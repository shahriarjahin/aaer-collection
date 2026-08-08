import { ReceiptFormData, ReceiptRecord } from "../types";
import { requireSupabase } from "./supabase";
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
    name: record.name,
    organization: record.organization || "",
    membershipNature: record.membership_nature,
    emailAndCell: record.email_and_cell || "",
    amount: Number(record.amount),
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

export async function saveRecord(formData: ReceiptFormData): Promise<ReceiptRecord> {
  const { data, error } = await requireSupabase()
    .from("receipts")
    .insert({
      name: formData.name,
      organization: formData.organization,
      membership_nature: formData.membershipNature,
      email_and_cell: formData.emailAndCell,
      amount: Number(formData.amount),
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
  return newRecord;
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
