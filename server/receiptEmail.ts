import { createClient } from "@supabase/supabase-js";
import PDFDocument from "pdfkit";

const supabaseAdmin = () => {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) throw new Error("Supabase server credentials are not configured.");
  return createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
};

export async function handleReceiptEmail(req: any, res: any) {
  try {
    const resendKey = process.env.RESEND_API_KEY;
    const fromAddress = process.env.RESEND_FROM_EMAIL;
    if (!resendKey || !fromAddress) {
      return res.status(503).json({ success: false, error: "Receipt email service is not configured." });
    }

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

    const {
      email,
      id,
      name,
      organization,
      phone,
      amount,
      amountInWords,
      paymentMethod,
      receivedBy,
    } = req.body || {};
    if (!email || !String(email).includes("@")) return res.status(200).json({ success: true, skipped: true });

    const pdf = await createReceiptPdf({
      id,
      name,
      organization,
      phone,
      amount,
      amountInWords,
      paymentMethod,
      receivedBy,
    });

    const amountText = `$${Number(amount || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: fromAddress,
        to: [email],
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
      console.error("Resend error:", details);
      return res.status(502).json({
        success: false,
        error: `Receipt saved, but Resend rejected the email: ${providerMessage}`,
      });
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Receipt email error:", error);
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
  amount: string | number;
  amountInWords?: string;
  paymentMethod?: string;
  receivedBy?: string;
}

function createReceiptPdf(data: ReceiptPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const document = new PDFDocument({ size: "A4", margin: 48, info: { Title: `AAER Receipt ${data.id}` } });
    const chunks: Buffer[] = [];

    document.on("data", (chunk: Buffer) => chunks.push(chunk));
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);

    const amountText = `BDT ${Number(data.amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

    document.fontSize(18).font("Helvetica-Bold").text("AAER MONEY RECEIPT", { align: "center" });
    document.moveDown(0.4);
    document.fontSize(10).font("Helvetica").text("Alumni Association of Agricultural Extension & Rural Development (AAER)", { align: "center" });
    document.text("Department of Agricultural Extension & Rural Development, GAU, Gazipur", { align: "center" });
    document.moveDown(1);
    document.font("Helvetica-Bold").text(`Receipt No: ${data.id}`);
    document.font("Helvetica").text(`Date: ${new Date().toLocaleDateString("en-GB")}`);
    document.moveDown(0.8);
    document.font("Helvetica-Bold").text("Thank you for your payment!");
    document.font("Helvetica").text(`We have successfully received your payment of ${amountText}.`);
    document.moveDown(1);
    document.font("Helvetica-Bold").text("Payee details");
    document.font("Helvetica").text(`Name: ${data.name || "N/A"}`);
    document.text(`Organization: ${data.organization || "N/A"}`);
    document.text(`Phone: ${data.phone || "N/A"}`);
    document.moveDown(0.8);
    document.font("Helvetica-Bold").text("Payment details");
    document.font("Helvetica").text(`Amount: ${amountText}`);
    document.text(`Amount in words: ${data.amountInWords || "N/A"}`);
    document.text(`Payment method: ${data.paymentMethod || "N/A"}`);
    document.moveDown(1.5);
    document.font("Helvetica-Bold").text(`Received by: ${data.receivedBy || "N/A"}`);
    document.moveDown(2);
    document.fontSize(9).font("Helvetica-Oblique").text("This PDF is an electronic copy of the AAER money receipt.", { align: "center" });
    document.end();
  });
}