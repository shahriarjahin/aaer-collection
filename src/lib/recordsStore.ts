import { ReceiptFormData, ReceiptRecord } from "../types";
import { requireSupabase, supabase } from "./supabase";
import { getUserDisplayName } from "./auth";
import { toPng } from "html-to-image";

const LOCAL_STORAGE_KEY = "aaer_receipt_records_v1";

/**
 * Helper to get cached records from localStorage
 */
export function getCachedRecords(): ReceiptRecord[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading localStorage records:", err);
    return [];
  }
}

/**
 * Helper to save records to localStorage
 */
export function setCachedRecords(records: ReceiptRecord[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error("Error saving records to localStorage:", err);
  }
}

function mapDatabaseRecord(record: any): ReceiptRecord {
  return {
    id: record.id,
    timestamp: record.issued_at,
    receivedBy: record.received_by || "",
    name: record.name,
    organization: record.organization || "",
    membershipNature: record.membership_nature,
    email: record.email || record.email_and_cell || "",
    phone: record.phone || "",
    amount: Number(record.amount),
    numberOfPersons: Number(record.number_of_persons || 1),
    amountInWords: record.amount_in_words || "",
    paymentMethod: record.payment_method,
    chequeNumberAndDate: record.cheque_number_and_date || "",
    bankName: record.bank_name || "",
    remarks: record.remarks || "",
  };
}

export async function getRecords(): Promise<ReceiptRecord[]> {
  try {
    const { data, error } = await requireSupabase()
      .from("receipts")
      .select("*")
      .order("issued_at", { ascending: false });

    if (error) throw error;

    const records = (data || []).map(mapDatabaseRecord);
    setCachedRecords(records);
    return records;
  } catch (err: any) {
    if (err?.code === "PGRST205") {
      throw new Error(
        "Supabase table public.receipts is missing. Run supabase/schema.sql in the Supabase SQL Editor, then reload the app."
      );
    }
    console.warn("Could not fetch records from Supabase, falling back to local cache:", err);
    if (getCachedRecords().length > 0) return getCachedRecords();
    throw err;
  }
}

export async function verifyReceiptById(id: string): Promise<ReceiptRecord | null> {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase.rpc("verify_receipt", { receipt_id: id.trim() });
  if (error) throw error;

  const record = Array.isArray(data) ? data[0] : data;
  if (!record) return null;

  return {
    id: record.id,
    timestamp: record.issued_at,
    name: record.name || "",
    organization: record.organization || "",
    membershipNature: record.membership_nature,
    email: "",
    phone: "",
    amount: Number(record.amount),
    numberOfPersons: Number(record.number_of_persons || 1),
    amountInWords: record.amount_in_words || "",
    paymentMethod: record.payment_method,
    chequeNumberAndDate: "",
    bankName: "",
    remarks: "",
    receivedBy: record.received_by || "",
  };
}

export async function sendReceiptEmail(
  record: ReceiptRecord
): Promise<{ status: "sent" | "skipped" | "failed"; error?: string }> {
  if (!record.email) {
    return { status: "skipped", error: "No payee email is recorded." };
  }

  try {
    const client = requireSupabase();
    const { data: sessionData } = await client.auth.getSession();
    const emailResponse = await fetch("/api/send-receipt-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionData.session?.access_token || ""}`,
      },
      body: JSON.stringify({
        email: record.email,
        id: record.id,
        name: record.name,
          organization: record.organization,
          phone: record.phone,
        amount: record.amount,
        amountInWords: record.amountInWords,
        paymentMethod: record.paymentMethod,
        receivedBy: record.receivedBy,
      }),
    });
    const emailResult = await emailResponse.json().catch(() => ({}));
    if (emailResponse.ok && emailResult.success && !emailResult.skipped) {
      return { status: "sent" };
    }
    return { status: "failed", error: emailResult.error || "Receipt email delivery failed." };
  } catch (error) {
    return {
      status: "failed",
      error: error instanceof Error ? error.message : "Receipt email delivery failed.",
    };
  }
}

export async function saveRecord(formData: ReceiptFormData): Promise<ReceiptRecord> {
  const client = requireSupabase();
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("You must be signed in before saving a receipt.");
  }

  const { data, error } = await client
    .from("receipts")
    .insert({
      auth_user_id: userData.user.id,
      received_by: getUserDisplayName(userData.user),
      name: formData.name,
      organization: formData.organization,
      membership_nature: formData.membershipNature,
      email: formData.email,
      phone: formData.phone,
      amount: Number(formData.amount),
      number_of_persons: Number(formData.numberOfPersons) || 1,
      amount_in_words: formData.amountInWords,
      payment_method: formData.paymentMethod,
      cheque_number_and_date: formData.chequeNumberAndDate || "",
      bank_name: formData.bankName || "",
      remarks: formData.remarks || "",
    })
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST205") {
      throw new Error(
        "Supabase table public.receipts is missing. Run supabase/schema.sql in the Supabase SQL Editor, then try again."
      );
    }
    throw error;
  }

  const newRecord = mapDatabaseRecord(data);
  setCachedRecords([newRecord, ...getCachedRecords()]);

  let emailDeliveryStatus: ReceiptRecord["emailDeliveryStatus"] = "skipped";
  let emailDeliveryError: string | undefined;
  const emailResult = await sendReceiptEmail(newRecord);
  emailDeliveryStatus = emailResult.status;
  emailDeliveryError = emailResult.error;

  return { ...newRecord, emailDeliveryStatus, emailDeliveryError };
}

export async function deleteRecord(id: string): Promise<boolean> {
  const { error } = await requireSupabase().from("receipts").delete().eq("id", id);
  if (error) throw error;

  setCachedRecords(getCachedRecords().filter((record) => record.id !== id));
  return true;
}

/**
 * Generates and downloads a high-resolution PNG file from any given HTML element ref/node.
 */
export async function downloadReceiptAsPng(
  element: HTMLElement | null,
  filename: string = "receipt.png"
): Promise<void> {
  if (!element) {
    alert("Receipt container not found for PNG generation.");
    return;
  }

  try {
    const dataUrl = await toPng(element, {
      quality: 1.0,
      pixelRatio: 2,
      backgroundColor: "#ffffff",
      cacheBust: true,
      filter: (node) => {
        // Exclude elements with class 'no-png-export'
        if (node instanceof HTMLElement && node.classList.contains("no-png-export")) {
          return false;
        }
        return true;
      },
    });

    const link = document.createElement("a");
    link.download = filename.endsWith(".png") ? filename : `${filename}.png`;
    link.href = dataUrl;
    link.click();
  } catch (err: any) {
    console.error("PNG export error:", err);
    alert("Failed to capture PNG image. You can use the Print / Save as PDF option instead.");
  }
}
