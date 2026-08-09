import React, { useState, useEffect, useRef } from "react";
import { ReceiptFormData, MembershipNature, PaymentMethod, ReceiptRecord } from "../types";
import { numberToWords } from "../utils/numberToWords";
import { saveRecord } from "../lib/recordsStore";
import { AlertCircle, CheckCircle2, DollarSign, Printer, RotateCcw, Building, User, Mail, CreditCard, Smartphone, ScanLine, FileText } from "lucide-react";

interface DataEntryFormProps {
  onReceiptSavedAndPrint: (receipt: ReceiptRecord) => void;
  onPreviewChange?: (formData: ReceiptFormData) => void;
  onOpenOcrScanner?: () => void;
  onOpenBlankPrint?: () => void;
  initialFormData?: ReceiptFormData | null;
}

const PRESET_AMOUNTS = [
  { label: "Tk. 500 (Joob Seeker)", value: 500 },
  { label: "Tk. 2,500 (General)", value: 2500 },
  { label: "Tk. 3,300 (1 guest)", value: 3300 },
  { label: "Tk. 4,100 (2 guests)", value: 4100 },
  { label: "Tk. 4,900 (3 guests)", value: 4900 },
  { label: "Tk. 5,700 (4 guests)", value: 5700 },
  { label: "Tk. 3,000 (Life Member)", value: 3000 },
  { label: "Tk. 10,000 ", value: 10000 },
];

export const DataEntryForm: React.FC<DataEntryFormProps> = ({
  onReceiptSavedAndPrint,
  onPreviewChange,
  onOpenOcrScanner,
  onOpenBlankPrint,
  initialFormData,
}) => {
  const [formData, setFormData] = useState<ReceiptFormData>({
    name: "",
    organization: "",
    membershipNature: "General",
    email: "",
    phone: "",
    amount: "",
    numberOfPersons: 1,
    amountInWords: "",
    paymentMethod: "Cash",
    chequeNumberAndDate: "",
    bankName: "",
    remarks: "",
  });

  // Update form if initialFormData passed in (e.g. from OCR scanner)
  useEffect(() => {
    if (initialFormData) {
      setFormData(initialFormData);
      setStatusMessage({
        type: "info",
        text: "Form fields auto-populated from scanned handwritten receipt! Please verify.",
      });
    }
  }, [initialFormData]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info" | null;
    text: string;
  }>({ type: null, text: "" });

  // Auto-fill amount in words whenever amount changes
  useEffect(() => {
    if (formData.amount !== "") {
      const words = numberToWords(formData.amount);
      if (formData.amountInWords !== words) {
        setFormData((prev) => ({
          ...prev,
          amountInWords: words,
        }));
      }
    } else if (formData.amountInWords !== "") {
      setFormData((prev) => ({
        ...prev,
        amountInWords: "",
      }));
    }
  }, [formData.amount, formData.amountInWords]);

  // Notify parent of live draft form updates for live preview
  const onPreviewChangeRef = useRef(onPreviewChange);
  useEffect(() => {
    onPreviewChangeRef.current = onPreviewChange;
  }, [onPreviewChange]);

  useEffect(() => {
    if (onPreviewChangeRef.current) {
      onPreviewChangeRef.current(formData);
    }
  }, [formData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setFormData((prev) => ({
      ...prev,
      paymentMethod: method,
    }));
  };

  const handlePresetAmount = (val: number) => {
    setFormData((prev) => ({
      ...prev,
      amount: val,
    }));
  };

  const handleReset = () => {
    setFormData({
      name: "",
      organization: "",
      membershipNature: "General",
      email: "",
      phone: "",
      amount: "",
      numberOfPersons: 1,
      amountInWords: "",
      paymentMethod: "Cash",
      chequeNumberAndDate: "",
      bankName: "",
      remarks: "",
    });
    setStatusMessage({ type: "info", text: "Form reset for next collection." });
    setTimeout(() => setStatusMessage({ type: null, text: "" }), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage({ type: null, text: "" });

    // Validation
    if (!formData.name.trim()) {
      setStatusMessage({ type: "error", text: "Please enter the payee's name." });
      return;
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      setStatusMessage({ type: "error", text: "Please enter a valid amount in Taka." });
      return;
    }
    if (formData.paymentMethod === "Cheque") {
      if (!formData.chequeNumberAndDate?.trim()) {
        setStatusMessage({
          type: "error",
          text: "Please enter Cheque Number and Date.",
        });
        return;
      }
      if (!formData.bankName?.trim()) {
        setStatusMessage({
          type: "error",
          text: "Please enter Bank Name for cheque payment.",
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const savedRecord = await saveRecord(formData);
      const emailMessage = savedRecord.emailDeliveryStatus === "sent"
        ? ` Email sent to ${formData.email}.`
        : savedRecord.emailDeliveryStatus === "skipped"
        ? " No payee email was provided."
        : ` Email was not sent: ${savedRecord.emailDeliveryError || "delivery failed"}`;

      setStatusMessage({
        type: savedRecord.emailDeliveryStatus === "failed" ? "error" : "success",
        text: `Receipt ${savedRecord.id} saved to Supabase.${emailMessage} Printing receipt...`,
      });

      // Trigger print and notify parent
      onReceiptSavedAndPrint(savedRecord);

      // Reset form for next entry after short delay
      setTimeout(() => {
        handleReset();
      }, 1500);
    } catch (err: any) {
      console.error("Submission error:", err);
      setStatusMessage({
        type: "error",
        text: err.message || "Error saving receipt record. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="data-entry-container bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8 max-w-3xl mx-auto">
      {/* Header Banner */}
      <div className="mb-6 pb-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded uppercase tracking-widest">
            Collection Entry
          </span>
          <h2 className="text-lg md:text-xl font-bold text-slate-900 mt-1">
            New Fee & Membership Record
          </h2>
          <p className="text-xs text-slate-500">
            Enter payee details to generate and print official money receipt.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenOcrScanner && (
            <button
              type="button"
              onClick={onOpenOcrScanner}
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              title="Scan photo of handwritten receipt voucher with AI"
            >
              <ScanLine className="w-3.5 h-3.5 text-indigo-600" />
              Scan Photo (AI OCR)
            </button>
          )}

          {onOpenBlankPrint && (
            <button
              type="button"
              onClick={onOpenBlankPrint}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              title="Print blank receipt sheets for pen fill-up"
            >
              <FileText className="w-3.5 h-3.5 text-slate-600" />
              Bulk Blank Print
            </button>
          )}

          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            title="Reset Form"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Form
          </button>
        </div>
      </div>

      {/* Status Alert Banner */}
      {statusMessage.text && (
        <div
          className={`mb-6 p-3.5 rounded-lg flex items-center gap-3 text-xs font-medium ${
            statusMessage.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
              : statusMessage.type === "error"
              ? "bg-rose-50 text-rose-900 border border-rose-200"
              : "bg-indigo-50 text-indigo-900 border border-indigo-200"
          }`}
        >
          {statusMessage.type === "success" && (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          {statusMessage.type === "error" && (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="flex-1">{statusMessage.text}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Row 1: Name & Organization */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Dr. Ahmed Rafiq"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Organization
            </label>
            <div className="relative">
              <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                name="organization"
                value={formData.organization}
                onChange={handleChange}
                placeholder="e.g. GAU Extension / BARI"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition"
              />
            </div>
          </div>
        </div>

        {/* Row 2: Membership Nature, Email & Phone */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Nature of Membership <span className="text-rose-500">*</span>
            </label>
            <select
              name="membershipNature"
              value={formData.membershipNature}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition font-medium"
            >
              <option value="Life Member">Life Member</option>
              <option value="General">General Member</option>
              <option value="AGM">AGM Delegate</option>
              <option value="Conference">Conference Participant</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. rafiq@gau.edu"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Phone
            </label>
            <div className="relative">
              <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g. 01712-345678"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition"
              />
            </div>
          </div>
        </div>
        <div className="relative col-span-1">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Number of Persons <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                name="numberOfPersons"
                required
                min="1"
                step="1"
                value={formData.numberOfPersons}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-base font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>

        {/* Row 3: Amount (Tk.) with Presets */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Amount (Tk.) <span className="text-rose-500">*</span>
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Presets:</span>
              {PRESET_AMOUNTS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handlePresetAmount(preset.value)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded border transition ${
                    Number(formData.amount) === preset.value
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-slate-700 border-slate-200 hover:border-indigo-400"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative col-span-1">
              <div className="absolute left-3 top-2 font-bold text-slate-700 text-sm">
                ৳
              </div>
              <input
                type="number"
                name="amount"
                required
                min="1"
                step="any"
                value={formData.amount}
                onChange={handleChange}
                placeholder="5000"
                className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-md text-base font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>

            

            <div className="col-span-1">
              <div className="text-xs italic text-indigo-700 bg-indigo-50/80 border border-indigo-100 rounded-md px-3 py-2 font-medium min-h-[38px] flex items-center">
                {formData.amountInWords || "Amount in words auto-calculates..."}
              </div>
            </div>
          </div>
        </div>

        {/* Row 4: Payment Method (Radio buttons) */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
            Payment Method <span className="text-rose-500">*</span>
          </label>
          <div className="flex items-center gap-6">
            <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-800">
              <input
                type="radio"
                name="paymentMethod"
                value="Cash"
                checked={formData.paymentMethod === "Cash"}
                onChange={() => handlePaymentMethodChange("Cash")}
                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <span className="flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-indigo-600" /> Cash
              </span>
            </label>

            <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-800">
              <input
                type="radio"
                name="paymentMethod"
                value="Cheque"
                checked={formData.paymentMethod === "Cheque"}
                onChange={() => handlePaymentMethodChange("Cheque")}
                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <span className="flex items-center gap-1">
                <CreditCard className="w-4 h-4 text-amber-600" /> Cheque
              </span>
            </label>

            <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-800">
              <input
                type="radio"
                name="paymentMethod"
                value="bKash"
                checked={formData.paymentMethod === "bKash"}
                onChange={() => handlePaymentMethodChange("bKash")}
                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <span className="flex items-center gap-1">
                <Smartphone className="w-4 h-4 text-pink-600" /> bKash
              </span>
            </label>

            <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-800">
              <input
                type="radio"
                name="paymentMethod"
                value="Nagad"
                checked={formData.paymentMethod === "Nagad"}
                onChange={() => handlePaymentMethodChange("Nagad")}
                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <span className="flex items-center gap-1">
                <Smartphone className="w-4 h-4 text-orange-600" /> Nagad
              </span>
            </label>
          </div>
        </div>

        {/* Conditional Cheque Details */}
        {formData.paymentMethod === "Cheque" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-amber-50/50 p-4 rounded-md border border-amber-200 animate-fadeIn">
            <div>
              <label className="block text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-1.5">
                Cheque Number & Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="chequeNumberAndDate"
                required={formData.paymentMethod === "Cheque"}
                value={formData.chequeNumberAndDate}
                onChange={handleChange}
                placeholder="e.g. CHQ-882910 dated 08/08/2026"
                className="w-full px-3 py-2 bg-white border border-amber-300 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-1.5">
                Bank Name & Branch <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="bankName"
                required={formData.paymentMethod === "Cheque"}
                value={formData.bankName}
                onChange={handleChange}
                placeholder="e.g. sonali Bank, GAU Branch"
                className="w-full px-3 py-2 bg-white border border-amber-300 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
        )}

        {/* Submit & Action Buttons */}
        <div className="pt-4 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-slate-500">
            * Saved directly to the <strong className="text-emerald-700">Supabase Ledger</strong> & available for instant verification.
          </p>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full md:w-auto px-8 py-3 bg-slate-900 hover:bg-black text-white font-bold text-sm tracking-wide rounded-md transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <Printer className="w-4 h-4" />
                SUBMIT & PRINT RECEIPT
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
