import { createClient } from "@supabase/supabase-js";
import PDFDocument from "pdfkit"; // Fixes PDFKit bundler/font issues in Vercel
import QRCode from "qrcode";
import fs from "node:fs";
import path from "node:path";

const supabaseAdmin = () => {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) throw new Error("Supabase server credentials are not configured.");
  return createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
};

export async function handleReceiptEmail(req: any, res: any) {
  try {
    const resendKey = process.env.RESEND_API_KEY?.trim();
    const fromAddress = process.env.RESEND_FROM_EMAIL?.trim();
    const missingVariables = [
      !resendKey && "RESEND_API_KEY",
      !fromAddress && "RESEND_FROM_EMAIL",
      !(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL) && "SUPABASE_URL",
      !process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() && "SUPABASE_SERVICE_ROLE_KEY",
    ].filter(Boolean);

    if (missingVariables.length > 0) {
      return res.status(503).json({
        success: false,
        error: `Receipt email service is not configured. Missing variable(s): ${missingVariables.join(", ")}.`,
      });
    }

    // Safely parse request body if it arrives as a string
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});

    const authorization = String(req.headers.authorization || "");
    const accessToken = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    if (!accessToken) return res.status(401).json({ success: false, error: "Authentication required." });

    const admin = supabaseAdmin();
    const { data: authData, error: authError } = await admin.auth.getUser(accessToken);
    if (authError || !authData.user) return res.status(401).json({ success: false, error: "Invalid authentication token." });

    const { data: approval, error: approvalError } = await admin
      .from("approved_users")
      .select("approved")
      .eq("user_id", authData.user.id)
      .eq("approved", true)
      .maybeSingle();
    if (approvalError || !approval) return res.status(403).json({ success: false, error: "User is not approved." });

    // Extract fields (supports 'email' or 'payeeEmail')
    const {
      email,
      payeeEmail,
      id,
      name,
      organization,
      phone,
      membershipNature,
      numberOfPersons,
      amount,
      amountInWords,
      paymentMethod,
      receivedBy,
    } = body;

    const targetEmail = email || payeeEmail;

    // Fail explicitly if email is missing rather than skipping silently
    if (!targetEmail || !String(targetEmail).includes("@")) {
      console.warn("Receipt email request missing valid recipient email:", body);
      return res.status(400).json({
        success: false,
        error: "A valid payee email address is required to send receipts.",
      });
    }

    const pdf = await createReceiptPdf({
      id,
      name,
      organization,
      phone,
      membershipNature,
      numberOfPersons,
      amount,
      amountInWords,
      paymentMethod,
      receivedBy,
    });

    const amountText = `BDT ${Number(amount || 0).toLocaleString("en-BD", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: fromAddress,
        to: [targetEmail],
        subject: `AAER Money Receipt ${id}`,
        html: `<div style="font-family:Arial,sans-serif;color:#172033;max-width:620px"><h2>AAER Money Receipt</h2><p>Dear ${escapeHtml(name)},</p><p><strong>Thank you for your payment!</strong></p><p>We have successfully received your payment of <strong>${escapeHtml(amountText)}</strong>.</p><table cellpadding="6" cellspacing="0"><tr><td><b>Receipt</b></td><td>${escapeHtml(id)}</td></tr><tr><td><b>Amount in words</b></td><td>${escapeHtml(amountInWords)}</td></tr><tr><td><b>Payment method</b></td><td>${escapeHtml(paymentMethod)}</td></tr><tr><td><b>Received by</b></td><td>${escapeHtml(receivedBy)}</td></tr></table><p>Your receipt is attached as a PDF.</p><p>Thank you.</p></div>`,
        attachments: [{
          filename: `AAER_Receipt_${id}.pdf`,
          content: pdf.toString("base64"),
        }],
      }),
    });

    if (!response.ok) {
      const details = await response.json().catch(async () => ({ message: await response.text() }));
      const providerMessage = details?.message || details?.error || "Unknown Resend provider error.";
      console.error("Resend API rejection details:", details);
      return res.status(502).json({
        success: false,
        error: `Resend rejected the email: ${providerMessage}`,
      });
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Receipt email processing error:", error);
    return res.status(500).json({ success: false, error: error.message || "Receipt email failed." });
  }
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

interface ReceiptPdfData {
  id: string;
  name: string;
  organization?: string;
  phone?: string;
  membershipNature?: string;
  numberOfPersons?: string | number;
  amount: string | number;
  amountInWords?: string;
  paymentMethod?: string;
  receivedBy?: string;
}

function createReceiptPdf(data: ReceiptPdfData): Promise<Buffer> {
  return QRCode.toBuffer(getVerificationUrl(data.id), { type: "png", width: 180, margin: 1 })
    .then((qrBuffer) => new Promise<Buffer>((resolve, reject) => {
      const document = new PDFDocument({ size: "A4", margin: 36, info: { Title: `AAER Receipt ${data.id}` } });
      const chunks: Buffer[] = [];

      document.on("data", (chunk: Buffer) => chunks.push(chunk));
      document.on("end", () => resolve(Buffer.concat(chunks)));
      document.on("error", reject);

      const amountText = `BDT ${Number(data.amount || 0).toLocaleString("en-BD", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
      const left = document.page.margins.left;
      const top = document.page.margins.top;
      const pageWidth = document.page.width - left - document.page.margins.right;
      const right = left + pageWidth;
      const copyHeight = 770;
      const innerLeft = left + 14;
      const innerWidth = pageWidth - 28;
      const columnGap = 14;
      const columnWidth = (innerWidth - columnGap) / 2;

      document.roundedRect(left, top, pageWidth, copyHeight, 6).lineWidth(1).strokeColor("#cbd5e1").stroke();

      const logoPath = path.join(process.cwd(), "public", "logo.png");
      if (fs.existsSync(logoPath)) {
        document.image(logoPath, innerLeft, top + 14, { fit: [74, 74], align: "center", valign: "center" });
      }

      document.fillColor("#0f172a").font("Helvetica-Bold").fontSize(8.5).text(
        "Alumni Association of Agricultural Extension & Rural Development (AAER)",
        innerLeft + 84,
        top + 18,
        { width: 280, height: 28, align: "center", lineBreak: false, ellipsis: true }
      );
      document.fillColor("#475569").font("Helvetica").fontSize(7).text(
        "Department of Agricultural Extension & Rural Development, GAU, Gazipur",
        innerLeft + 84,
        top + 48,
        { width: 280, height: 12, align: "center", lineBreak: false, ellipsis: true }
      );
      document.roundedRect(left + 185, top + 72, 120, 20, 3).fill("#0f172a");
      document.fillColor("#ffffff").font("Helvetica-Bold").fontSize(8).text("MONEY RECEIPT", left + 185, top + 78, { width: 120, height: 9, align: "center", lineBreak: false });
      document.roundedRect(left + 313, top + 72, 105, 20, 3).fill("#e0e7ff");
      document.fillColor("#312e81").fontSize(8).text("PAYEE'S COPY", left + 313, top + 78, { width: 105, height: 9, align: "center", lineBreak: false });

      document.fillColor("#334155").font("Helvetica-Bold").fontSize(7).text(`Voucher No: ${data.id}`, right - 130, top + 13, { width: 116, height: 9, align: "right", lineBreak: false });
      document.font("Helvetica").text(`Date: ${new Date().toLocaleDateString("en-GB")}`, right - 130, top + 28, { width: 116, height: 9, align: "right", lineBreak: false });
      document.moveTo(innerLeft, top + 103).lineTo(right - 14, top + 103).strokeColor("#cbd5e1").stroke();

      const field = (label: string, value: unknown, x: number, y: number, width: number) => {
        document.font("Helvetica-Bold").fontSize(7).fillColor("#64748b").text(label.toUpperCase(), x, y, { width, lineBreak: false });
        document.font("Helvetica").fontSize(9).fillColor("#0f172a").text(String(value || "N/A"), x, y + 10, { width, height: 12, ellipsis: true, lineBreak: false });
        document.moveTo(x, y + 25).lineTo(x + width, y + 25).strokeColor("#e2e8f0").stroke();
      };

      const contentTop = top + 125;
      field("Received from", data.name, innerLeft, contentTop, columnWidth);
      field("Membership", data.membershipNature, innerLeft + columnWidth + columnGap, contentTop, columnWidth);
      field("Organization", data.organization, innerLeft, contentTop + 58, columnWidth);
      field("Phone", data.phone, innerLeft + columnWidth + columnGap, contentTop + 58, columnWidth);
      field("Amount", amountText, innerLeft, contentTop + 116, columnWidth);
      field("Payment method", data.paymentMethod, innerLeft + columnWidth + columnGap, contentTop + 116, columnWidth);
      field("Amount in words", data.amountInWords, innerLeft, contentTop + 174, innerWidth);
      field("Number of persons", data.numberOfPersons || 1, innerLeft, contentTop + 232, columnWidth);
      field("Voucher reference", data.id, innerLeft + columnWidth + columnGap, contentTop + 232, columnWidth);

      const footerTop = top + 575;
      document.moveTo(innerLeft, footerTop).lineTo(right - 14, footerTop).strokeColor("#cbd5e1").stroke();
      const qrSize = 82;
      const qrLeft = left + (pageWidth - qrSize) / 2;
      document.image(qrBuffer, qrLeft, footerTop + 18, { fit: [qrSize, qrSize] });
      document.fillColor("#312e81").font("Helvetica-Bold").fontSize(8).text("VERIFY AUTHENTICITY", qrLeft - 25, footerTop + 105, { width: qrSize + 50, height: 10, align: "center", lineBreak: false });
      document.fillColor("#475569").font("Helvetica-Oblique").fontSize(8).text("Scan to verify receipt", qrLeft - 25, footerTop + 120, { width: qrSize + 50, height: 10, align: "center", lineBreak: false });

      document.moveTo(left + 24, footerTop + 105).lineTo(left + 174, footerTop + 105).strokeColor("#94a3b8").stroke();
      document.fillColor("#475569").font("Helvetica-Bold").fontSize(8).text("Received by", left + 24, footerTop + 109, { width: 150, height: 10, align: "center", lineBreak: false });
      document.font("Helvetica").fontSize(10).text(data.receivedBy || "N/A", left + 24, footerTop + 88, { width: 150, height: 12, align: "center", lineBreak: false, ellipsis: true });

      const signaturePath = path.join(process.cwd(), "public", "signature.png");
      if (fs.existsSync(signaturePath)) {
        document.image(signaturePath, right - 145, footerTop + 62, { fit: [120, 42], align: "center", valign: "center" });
      }
      document.moveTo(right - 145, footerTop + 105).lineTo(right - 20, footerTop + 105).strokeColor("#94a3b8").stroke();
      document.fillColor("#475569").font("Helvetica-Bold").fontSize(8).text("Treasurer, AAER", right - 145, footerTop + 109, { width: 125, height: 10, align: "center", lineBreak: false });

      document.end();
  }));
}

function getVerificationUrl(receiptId: string): string {
  const configuredUrl = process.env.VITE_APP_URL || process.env.APP_URL || "https://aaercollection.vercel.app";
  const baseUrl = configuredUrl.startsWith("http") ? configuredUrl : `https://${configuredUrl}`;
  const verificationUrl = new URL(baseUrl);
  verificationUrl.search = `verifyId=${encodeURIComponent(receiptId)}`;
  verificationUrl.hash = "";
  return verificationUrl.toString();
}