import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { ReceiptRecord } from "../types";

interface ReceiptComponentProps {
  receipt: ReceiptRecord | null;
  todayDateFormatted?: string;
}

interface SingleReceiptProps {
  receipt: ReceiptRecord;
  copyType: "PAYEE'S COPY" | "OFFICE COPY";
  formattedDate: string;
  formattedAmount: string;
  displayTodayDate: string;
}

const SingleReceiptCopy: React.FC<SingleReceiptProps> = ({
  receipt,
  copyType,
  formattedDate,
  formattedAmount,
  displayTodayDate,
}) => {
  return (
    <div className="receipt-single-copy bg-white border border-slate-200 rounded-lg p-5 print:border-slate-300 print:p-4 print:rounded-none relative shadow-xs print:shadow-none">
      {/* 1. HEADER & LOGO */}
      <header className="flex flex-row items-start justify-between pb-3 border-b border-slate-200 gap-3">
        {/* Left: Organization Logo */}
        <div className="flex items-center gap-3">
          <img 
            src="/logo.png" 
            alt="AAER Logo" 
            className="w-20 h-20 object-contain select-none" 
          />
        </div>

        {/* Right: Organization Title & Badges */}
        <div className="text-right flex-1 pl-2">
          <h2 className="text-xs md:text-sm font-bold text-slate-900 leading-tight">
            Alumni Association of Agricultural Extension & Rural Development (AAER)
          </h2>
          <p className="text-[9px] text-slate-500 font-medium my-0.5 uppercase tracking-wider">
            GAU ESTD. - 2017
          </p>

          <div className="mt-1.5 flex flex-wrap items-center justify-end gap-1.5">
            <span className="bg-indigo-600 text-white px-2 py-0.5 text-[10px] font-bold rounded-xs uppercase tracking-wider">
              Money Receipt
            </span>
            <span className="bg-slate-100 text-slate-800 border border-slate-300 px-2 py-0.5 text-[10px] font-bold rounded-xs uppercase tracking-wider print:border-slate-400">
              {copyType}
            </span>
            <span className="bg-amber-50 text-amber-900 border border-amber-200 font-mono px-2 py-0.5 text-[10px] font-bold rounded-xs">
              Voucher No: #{receipt.id}
            </span>
          </div>

          <p className="text-[9px] text-slate-400 mt-1 font-mono">
            Issue Date: {formattedDate}
          </p>
        </div>
      </header>

      {/* 2. BODY GRID */}
      <div className="py-3 space-y-2.5 text-xs">
        <div className="grid grid-cols-2 gap-y-2.5 gap-x-6">
          <div className="border-b border-slate-100 pb-1">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
              Received From
            </p>
            <p className="font-semibold text-slate-900 text-xs mt-0.5">
              {receipt.name || "N/A"}
            </p>
          </div>

          <div className="border-b border-slate-100 pb-1">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
              Membership Nature
            </p>
            <p className="font-semibold text-slate-900 text-xs mt-0.5">
              {receipt.membershipNature || "N/A"}
            </p>
          </div>

          <div className="border-b border-slate-100 pb-1">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
              Organization
            </p>
            <p className="font-medium text-slate-800 text-[11px] mt-0.5">
              {receipt.organization || "N/A"}
            </p>
          </div>

          <div className="border-b border-slate-100 pb-1">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
              Contact Info
            </p>
            <p className="font-medium text-slate-800 text-[11px] mt-0.5">
              {receipt.emailAndCell || "N/A"}
            </p>
          </div>

          <div className="col-span-2 border-b border-slate-100 pb-1.5">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
              Amount Description
            </p>
            <div className="flex items-end justify-between gap-2 mt-0.5">
              <p className="font-medium text-slate-800 text-[11px] italic capitalize">
                {receipt.amountInWords || "Zero Taka Only"}
              </p>
              <p className="text-base font-bold text-indigo-700 font-mono tracking-tight shrink-0">
                Tk. {formattedAmount}/-
              </p>
            </div>
          </div>

          <div className="border-b border-slate-100 pb-1">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
              Payment Method
            </p>
            <p className="font-semibold text-slate-800 text-[11px] mt-0.5 uppercase">
              {receipt.paymentMethod} Payment
            </p>
          </div>

          <div className="border-b border-slate-100 pb-1">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
              Voucher Reference
            </p>
            <p className="font-mono text-[11px] text-slate-700 mt-0.5">
              #{receipt.id}
            </p>
          </div>
        </div>

        {/* Cheque info if available */}
        {receipt.paymentMethod === "Cheque" && (
          <div className="p-2 bg-slate-50 border border-slate-200 rounded text-[11px] space-y-0.5">
            <p className="text-[9px] font-bold text-slate-500 uppercase">
              Cheque Details:
            </p>
            <p className="text-slate-800 font-medium">
              Cheque No/Date: {receipt.chequeNumberAndDate || "N/A"} | Bank: {receipt.bankName || "N/A"}
            </p>
          </div>
        )}
      </div>

      {/* 3. FOOTER & SIGNATURES */}
      <footer className="mt-4 pt-2 flex justify-between items-end gap-2">
        <div className="w-32 border-t border-slate-300 text-center pt-1 shrink-0">
          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">
            Received by
          </p>
        </div>

        {/* Official QR Code for Authenticity Verification */}
        <div className="flex flex-col items-center justify-center shrink-0">
          <div className="p-1 bg-white border border-slate-300 rounded shadow-2xs flex flex-col items-center text-center">
            <QRCodeSVG
              value={
                typeof window !== "undefined"
                  ? `${window.location.origin}?verifyId=${encodeURIComponent(receipt.id)}`
                  : `https://aaer.org/verify?id=${receipt.id}`
              }
              size={52}
              level="M"
              includeMargin={false}
            />
            <span className="text-[7px] font-bold text-indigo-900 mt-0.5 uppercase tracking-wider font-mono">
              VERIFY AUTHENTICITY
            </span>
          </div>
        </div>

        <div className="w-44 text-center relative shrink-0">
          <div className="mb-1 flex flex-col items-center">
            <img 
              src="/signature.png" 
              alt="Treasurer Signature" 
              className="h-12 w-auto object-contain -rotate-2 select-none mb-1 mix-blend-multiply" 
            />
            <div className="text-[8px] text-slate-400 font-mono mt-1">
              Date: {displayTodayDate}
            </div>
          </div>
          <div className="border-t border-slate-300 pt-1">
            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">
              Signature of Treasurer with Date
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const ReceiptComponent: React.FC<ReceiptComponentProps> = ({
  receipt,
  todayDateFormatted,
}) => {
  if (!receipt) {
    return (
      <div className="receipt-container hidden p-8 text-center text-slate-400">
        No receipt data loaded.
      </div>
    );
  }

  // Format timestamp if available, else use current date
  const formattedDate = receipt.timestamp
    ? new Date(receipt.timestamp).toLocaleDateString("en-US", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : todayDateFormatted || new Date().toLocaleDateString("en-US");

  const numericAmount = typeof receipt.amount === "number"
    ? receipt.amount
    : parseFloat(String(receipt.amount) || "0");

  const formattedAmount = isNaN(numericAmount)
    ? "0.00"
    : numericAmount.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

  const displayTodayDate = todayDateFormatted || new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="receipt-container bg-white text-slate-900 p-4 max-w-2xl mx-auto print:max-w-none print:w-full print:p-0 space-y-4">
      {/* 1. PAYEE'S COPY */}
      <SingleReceiptCopy
        receipt={receipt}
        copyType="PAYEE'S COPY"
        formattedDate={formattedDate}
        formattedAmount={formattedAmount}
        displayTodayDate={displayTodayDate}
      />

      {/* TEAR / CUT PERFORATED LINE */}
      <div className="my-2 border-t-2 border-dashed border-slate-300 relative flex items-center justify-center print:my-3">
        <span className="bg-white px-3 text-[9px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1 select-none">
          ✂ Tear / Cut Line (Payee Copy Top / Office Copy Bottom)
        </span>
      </div>

      {/* 2. OFFICE COPY */}
      <SingleReceiptCopy
        receipt={receipt}
        copyType="OFFICE COPY"
        formattedDate={formattedDate}
        formattedAmount={formattedAmount}
        displayTodayDate={displayTodayDate}
      />
    </div>
  );
};
