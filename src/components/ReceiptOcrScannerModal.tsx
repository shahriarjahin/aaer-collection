import React, { useState } from "react";
import { createWorker } from "tesseract.js";
import { ReceiptFormData, MembershipNature, PaymentMethod } from "../types";
import {
  Upload,
  Sparkles,
  Check,
  AlertCircle,
  X,
  FileSearch,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  Save,
  ScanLine,
  WifiOff,
  Cpu,
} from "lucide-react";

interface ReceiptOcrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExtractSuccess: (data: ReceiptFormData) => void;
}

export const ReceiptOcrScannerModal: React.FC<ReceiptOcrScannerModalProps> = ({
  isOpen,
  onClose,
  onExtractSuccess,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMode, setLoadingMode] = useState<"ai" | "offline" | null>(null);
  const [rawOfflineText, setRawOfflineText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ReceiptFormData | null>(null);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (PNG, JPG, JPEG, WEBP).");
      return;
    }

    setError(null);
    setExtractedData(null);
    setRawOfflineText(null);

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 1. ONLINE GEMINI AI OCR (Best for handwriting)
  const handleRunAiOcr = async () => {
    if (!selectedImage) return;

    setLoading(true);
    setLoadingMode("ai");
    setError(null);
    setRawOfflineText(null);

    try {
      const response = await fetch("/api/ocr-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: selectedImage }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to scan handwritten voucher with AI");
      }

      const parsed: ReceiptFormData = {
        name: result.data.name || "",
        amount: String(result.data.amount || "0"),
        membershipNature: result.data.membershipNature || "General",
        paymentMethod: result.data.paymentMethod?.toLowerCase().includes("cheque")
          ? "Cheque"
          : result.data.paymentMethod?.toLowerCase().includes("bkash")
          ? "bKash"
          : result.data.paymentMethod?.toLowerCase().includes("nagad")
          ? "Nagad"
          : "Cash",
        chequeNumberAndDate: result.data.paymentRef || "",
        organization: result.data.organization || "",
        emailAndCell: "",
        amountInWords: "",
        remarks: result.data.remarks || "AI OCR Scanned Record",
      };

      setExtractedData(parsed);
    } catch (err: any) {
      console.error("AI OCR Scan Error:", err);
      setError(err.message || "Failed to analyze handwritten document.");
    } finally {
      setLoading(false);
      setLoadingMode(null);
    }
  };

  // 2. 100% OFFLINE ZERO-NETWORK TESSERACT OCR
  const handleRunOfflineOcr = async () => {
    if (!selectedImage) return;

    setLoading(true);
    setLoadingMode("offline");
    setError(null);
    setRawOfflineText(null);

    try {
      const worker = await createWorker("eng");
      const ret = await worker.recognize(selectedImage);
      const text = ret.data.text || "";
      await worker.terminate();

      setRawOfflineText(text);

      // Intelligent heuristic extraction from raw OCR text
      let extractedName = "";
      let extractedAmount = "0";
      let extractedNature: MembershipNature = "General";
      let extractedPayment: PaymentMethod = "Cash";
      let extractedOrg = "";

      // Look for amount (e.g. ৳ 5000, Tk 5000, 5000/-)
      const amountMatch = text.match(/(?:৳|TK|Tk|BDT|Amount[:\s]*)[^\d]*(\d[\d,]*)/i) || text.match(/(\d{3,6})/);
      if (amountMatch) {
        extractedAmount = amountMatch[1].replace(/,/g, "");
      }

      // Look for name line
      const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
      const nameLine = lines.find(
        (l) => /from|received|payer|name/i.test(l) && !/association|alumni|department/i.test(l)
      );
      if (nameLine) {
        extractedName = nameLine.replace(/received with thanks from|received from|name:|payer:/i, "").trim();
      }

      // Look for membership nature
      if (/life/i.test(text)) extractedNature = "Life Member";
      else if (/agm/i.test(text)) extractedNature = "AGM";
      else if (/conference/i.test(text)) extractedNature = "Conference";

      // Look for payment method
      if (/cheque|bank|check/i.test(text)) extractedPayment = "Cheque";
      else if (/bkash/i.test(text)) extractedPayment = "bKash";
      else if (/nagad/i.test(text)) extractedPayment = "Nagad";

      setExtractedData({
        name: extractedName,
        amount: extractedAmount,
        membershipNature: extractedNature,
        paymentMethod: extractedPayment,
        chequeNumberAndDate: "",
        organization: extractedOrg,
        emailAndCell: "",
        amountInWords: "",
        remarks: "100% Offline Tesseract OCR Record",
      });
    } catch (err: any) {
      console.error("Offline OCR Error:", err);
      setError("Offline Tesseract engine failed to process image. Try AI OCR for complex handwriting.");
    } finally {
      setLoading(false);
      setLoadingMode(null);
    }
  };

  const handleApplyToForm = () => {
    if (extractedData) {
      onExtractSuccess(extractedData);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn no-print overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ScanLine className="w-6 h-6 text-indigo-400" />
            <div>
              <h3 className="font-bold text-sm">Scan Receipt Voucher (OCR Engine Choice)</h3>
              <p className="text-[10px] text-slate-300">
                Choose between Cloud AI OCR or 100% Offline Client-side Tesseract OCR
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5">
          {/* File Upload Box */}
          <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-5 text-center bg-slate-50 hover:bg-slate-100/80 transition relative cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center space-y-2">
              <Upload className="w-8 h-8 text-indigo-500" />
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Click or drag photo of money receipt voucher
                </p>
                <p className="text-[10px] text-slate-500">
                  Supports JPG, PNG, WEBP photos from mobile camera or gallery
                </p>
              </div>
            </div>
          </div>

          {/* Image Preview & Action Buttons */}
          {selectedImage && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <div className="bg-slate-100 p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">
                  Uploaded Document Preview:
                </span>
                <img
                  src={selectedImage}
                  alt="Receipt Preview"
                  className="w-full h-48 object-contain rounded bg-white border border-slate-200"
                />
              </div>

              <div className="space-y-2.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  Select OCR Recognition Mode:
                </span>

                {/* Option 1: AI Cloud OCR */}
                <button
                  onClick={handleRunAiOcr}
                  disabled={loading}
                  className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-between gap-2 cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-left">
                    <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                    <div>
                      <div className="leading-tight">Gemini AI OCR (Cloud)</div>
                      <div className="text-[9px] font-normal text-indigo-200">
                        High accuracy for cursive handwriting
                      </div>
                    </div>
                  </div>
                  {loading && loadingMode === "ai" && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
                </button>

                {/* Option 2: 100% Offline Zero Network Tesseract OCR */}
                <button
                  onClick={handleRunOfflineOcr}
                  disabled={loading}
                  className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-500 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-between gap-2 cursor-pointer border border-slate-700"
                >
                  <div className="flex items-center gap-2 text-left">
                    <WifiOff className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="leading-tight flex items-center gap-1.5">
                        Offline Tesseract OCR
                        <span className="bg-emerald-500/20 text-emerald-300 text-[9px] px-1.5 py-0.2 rounded border border-emerald-500/30 font-normal">
                          Zero Cost / Local
                        </span>
                      </div>
                      <div className="text-[9px] font-normal text-slate-300">
                        Runs 100% in browser, no server data sent
                      </div>
                    </div>
                  </div>
                  {loading && loadingMode === "offline" && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
                </button>

                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {extractedData && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold">
                      Text extracted successfully! Verify data below.
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Raw Text Output Preview for Offline Mode */}
          {rawOfflineText && (
            <div className="p-2.5 bg-slate-900 text-slate-200 rounded-lg text-[10px] font-mono space-y-1 max-h-24 overflow-y-auto">
              <span className="text-slate-400 font-sans font-bold block">Raw Offline Tesseract Detected Text:</span>
              <p className="whitespace-pre-wrap">{rawOfflineText || "No readable printed text detected."}</p>
            </div>
          )}

          {/* Extracted Fields Form Preview */}
          {extractedData && (
            <div className="bg-indigo-50/50 border border-indigo-200 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5 border-b border-indigo-200 pb-2">
                <FileSearch className="w-4 h-4 text-indigo-600" />
                Extracted Receipt Data
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">
                    Payer Name:
                  </label>
                  <input
                    type="text"
                    value={extractedData.name}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, name: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">
                    Amount (৳):
                  </label>
                  <input
                    type="number"
                    value={extractedData.amount}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, amount: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-bold text-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">
                    Membership Category:
                  </label>
                  <select
                    value={extractedData.membershipNature}
                    onChange={(e) =>
                      setExtractedData({
                        ...extractedData,
                        membershipNature: e.target.value as MembershipNature,
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-medium"
                  >
                    <option value="General">General Collection</option>
                    <option value="Life Member">Life Member</option>
                    <option value="AGM">AGM Fee</option>
                    <option value="Conference">Conference Fee</option>
                    <option value="Other">Other / Donation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">
                    Payment Method:
                  </label>
                  <select
                    value={extractedData.paymentMethod}
                    onChange={(e) =>
                      setExtractedData({
                        ...extractedData,
                        paymentMethod: e.target.value as PaymentMethod,
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-medium capitalize"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="bKash">bKash</option>
                    <option value="Nagad">Nagad</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">
                    Organization / Phone / Designation:
                  </label>
                  <input
                    type="text"
                    value={extractedData.organization || ""}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, organization: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-medium"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition cursor-pointer"
          >
            Cancel
          </button>

          {extractedData && (
            <button
              onClick={handleApplyToForm}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Populate & Import to Collection Form
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

