import React, { useState } from "react";
import { downloadReceiptAsPng } from "../lib/recordsStore";
import { Printer, FileText, ArrowLeft, Image } from "lucide-react";

interface BlankVouchersPrintProps {
  onBack?: () => void;
}

interface SingleBlankCopyProps {
  copyType: "PAYEE'S COPY" | "OFFICE COPY";
  voucherNumStr: string | null;
}

type VoucherLayout = "portrait" | "landscape";

const SingleBlankCopy: React.FC<SingleBlankCopyProps> = ({ copyType, voucherNumStr }) => {
  return (
    <div className="printable-receipt-card blank-voucher-copy bg-white border border-slate-300 rounded-lg p-2.5 shadow-2xs text-slate-800">
      {/* 1. HEADER */}
      <header className="flex flex-row items-start justify-between pb-1.5 border-b border-slate-300 gap-2">
        <div className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="AAER Logo"
            className="w-12 h-12 object-contain select-none"
          />
        </div>

        <div className="flex-1 text-center">
          <h1 className="text-[11px] font-extrabold text-slate-900 leading-tight uppercase tracking-tight">
            Alumni Association of Agricultural Extension & Rural Development (AAER)
          </h1>
          <p className="text-[8px] font-semibold text-slate-600 mt-0.5">
            Department of Agricultural Extension & Rural Development, GAU, Gazipur
          </p>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="bg-slate-900 text-white font-extrabold text-[8px] px-2 py-0.5 rounded uppercase tracking-widest">
              MONEY RECEIPT
            </span>
            <span className="bg-indigo-100 text-indigo-900 border border-indigo-300 font-bold text-[8px] px-2 py-0.5 rounded uppercase tracking-wider">
              {copyType}
            </span>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-[9px] font-mono text-slate-700 font-bold flex items-center justify-end gap-1">
            <span>Voucher No:</span>
            {voucherNumStr ? (
              <span className="text-slate-900 font-extrabold">{voucherNumStr}</span>
            ) : (
              <span className="border-b border-dotted border-slate-500 w-28 inline-block h-3"></span>
            )}
          </div>
          <div className="text-[9px] font-mono text-slate-600 mt-1">
            Date: <span className="border-b border-dotted border-slate-500 px-6 inline-block">2026</span>
          </div>
        </div>
      </header>

      {/* 2. DOTTED FORM BODY FOR PEN FILL-UP */}
      <div className="blank-voucher-body py-1.5 space-y-1.5 text-[11px] font-medium text-slate-800">
        <div className="flex items-baseline gap-2">
          <span className="shrink-0 font-bold text-slate-700">Received with thanks from:</span>
          <div className="flex-1 border-b border-dotted border-slate-400 h-3"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="flex items-baseline gap-1.5">
            <span className="shrink-0 font-bold text-slate-700">Organization:</span>
            <div className="flex-1 border-b border-dotted border-slate-400 h-3"></div>
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="shrink-0 font-bold text-slate-700">Designation:</span>
            <div className="flex-1 border-b border-dotted border-slate-400 h-3"></div>
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="shrink-0 font-bold text-slate-700">Phone:</span>
            <div className="flex-1 border-b border-dotted border-slate-400 h-3"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-0.5">
          <div className="flex items-baseline gap-1.5 col-span-1">
            <span className="shrink-0 font-bold text-slate-700">Amount:</span>
            <div className="flex-1 border-b border-dotted border-slate-400 font-mono font-bold text-[11px] px-1">
              ৳
            </div>
          </div>

          <div className="flex items-baseline gap-1.5 col-span-2">
            <span className="shrink-0 font-bold text-slate-700">In Words:</span>
            <div className="flex-1 border-b border-dotted border-slate-400 h-3"></div>
          </div>
        </div>

        <div className="flex items-start justify-between border-t border-slate-200 pt-1 mt-1">
          <div>
            <span className="font-bold text-slate-700 block text-[9px] mb-0.5">Membership Category:</span>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] text-slate-700">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 border border-slate-500"></div>
              <span>Life Member</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 border border-slate-500"></div>
              <span>Annual Member</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 border border-slate-500"></div>
              <span>AGM / Conf.</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 border border-slate-500"></div>
              <span>Others: ......</span>
            </div>
            </div>
          </div>
          <div className="border-l border-slate-200 pl-3">
            <span className="font-bold text-slate-700 block text-[9px] mb-0.5">Payment Mode:</span>
            <div className="space-y-1 text-[9px] text-slate-700">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1"><div className="w-2.5 h-2.5 border border-slate-500"></div> Cash</span>
                <span className="inline-flex items-center gap-1"><div className="w-2.5 h-2.5 border border-slate-500"></div> bKash/Bank</span>
              </div>
              <div className="flex items-center gap-1"><span className="font-bold">Ref:</span><span className="border-b border-dotted border-slate-400 w-24 inline-block"></span></div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. FOOTER SIGNATURES */}
      <footer className="mt-1 pt-1 border-t border-slate-300 flex justify-between items-end gap-2">
        <div className="w-28 text-center">
          <div className="border-b border-slate-400 h-5 mb-0.5"></div>
          <p className="text-[7px] font-bold text-slate-600 uppercase tracking-wider">
            Received By
          </p>
        </div>

        <div className="text-center text-[7px] text-slate-500 italic max-w-[12rem]">
          * Valid only with authorized signature.
        </div>

        <div className="w-32 text-center">
          <div className="flex flex-col items-center">
            <img
              src="/signature.png"
              alt="Treasurer Signature"
              className="h-6 w-auto object-contain -rotate-2 select-none mix-blend-multiply"
            />
            <div className="border-t border-slate-400 w-full pt-0.5">
              <p className="text-[7px] font-bold text-slate-800">Treasurer, AAER</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const BlankVouchersPrint: React.FC<BlankVouchersPrintProps> = ({ onBack }) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [isCustomQuantity, setIsCustomQuantity] = useState<boolean>(false);
  const [includeVoucherNum, setIncludeVoucherNum] = useState<boolean>(true);
  const [startVoucherNum, setStartVoucherNum] = useState<number>(101);
  const [layout, setLayout] = useState<VoucherLayout>("portrait");
  const isLandscape = layout === "landscape";

  const handlePrint = () => {
    const doPrint = () => {
      window.print();
    };

    doPrint();
  };

  const handleDownloadPng = () => {
    const doDownload = () => {
      const el = document.getElementById("blank-voucher-page-0");
      if (el) {
        downloadReceiptAsPng(
          el,
          `AAER_Blank_Vouchers_${isLandscape ? "Landscape" : "Portrait"}.png`
        );
      }
    };

    doDownload();
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar (hidden when printing) */}
      <div className="no-print bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Bulk Blank Vouchers Printing (A4 4-Copy Sheets)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Each A4 page prints 2 voucher sets: Payee Copy followed by Office Copy.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Entry
            </button>
          )}

          <div className="flex items-center gap-2 text-xs">
            <label className="font-semibold text-slate-700">Quantity (Pages):</label>
            <select
              value={isCustomQuantity ? "custom" : String(quantity)}
              onChange={(e) => {
                if (e.target.value === "custom") {
                  setIsCustomQuantity(true);
                  setQuantity(1);
                } else {
                  setIsCustomQuantity(false);
                  setQuantity(Number(e.target.value));
                }
              }}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-slate-50 font-medium text-xs focus:ring-2 focus:ring-indigo-500"
            >
              <option value={1}>1 Page (2 Sets)</option>
              <option value={2}>2 Pages (4 Sets)</option>
              <option value={5}>5 Pages (10 Sets)</option>
              <option value={10}>10 Pages (20 Sets)</option>
              <option value="custom">Custom Quantity...</option>
            </select>
            {isCustomQuantity && (
              <input
                type="number"
                min={1}
                max={100}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
                className="w-16 px-2 py-1.5 border border-slate-300 rounded-lg text-center font-mono font-bold text-xs"
                aria-label="Custom number of pages"
              />
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <label htmlFor="blank-voucher-layout" className="font-semibold text-slate-700">Layout:</label>
            <select
              id="blank-voucher-layout"
              value={layout}
              onChange={(e) => setLayout(e.target.value as VoucherLayout)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-slate-50 font-medium text-xs focus:ring-2 focus:ring-indigo-500"
            >
              <option value="portrait">Portrait: 2 Sets / Page</option>
              <option value="landscape">Landscape: Payee + Office Side by Side</option>
            </select>
          </div>

          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700 bg-slate-50 px-2.5 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 select-none">
            <input
              type="checkbox"
              checked={includeVoucherNum}
              onChange={(e) => setIncludeVoucherNum(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
            />
            <span>Print Voucher No</span>
          </label>

          {includeVoucherNum && (
            <div className="flex items-center gap-2 text-xs">
              <label className="font-semibold text-slate-700">Start No:</label>
              <input
                type="number"
                value={startVoucherNum}
                onChange={(e) => setStartVoucherNum(Number(e.target.value))}
                className="w-20 px-2 py-1.5 border border-slate-300 rounded-lg text-center font-mono font-bold text-xs"
              />
            </div>
          )}

          <button
            onClick={handleDownloadPng}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            title={`Download ${isLandscape ? "landscape" : "portrait"} blank voucher page as PNG image`}
          >
            <Image className="w-4 h-4" />
            Download {isLandscape ? "Landscape" : "Portrait"} PNG
          </button>

          <button
            onClick={handlePrint}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm transition flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print {isLandscape ? "Landscape" : "Portrait"} Vouchers
          </button>
        </div>
      </div>

      {/* Printable Vouchers Container */}
      <div className="blank-vouchers-print-container space-y-8">
        {Array.from({ length: quantity }).map((_, index) => {
          const firstVoucherNumStr = includeVoucherNum
            ? `REC-2026-BLANK-${String(startVoucherNum + index * (isLandscape ? 1 : 2)).padStart(4, "0")}`
            : null;
          const secondVoucherNumStr = includeVoucherNum
            ? `REC-2026-BLANK-${String(startVoucherNum + index * 2 + 1).padStart(4, "0")}`
            : null;

          return (
            <div
              key={index}
              id={`blank-voucher-page-${index}`}
              className={`a4-blank-voucher-page ${isLandscape ? "a4-blank-voucher-landscape" : ""} bg-white p-4 max-w-3xl mx-auto flex flex-col justify-between ${
                index > 0 ? "print:page-break-before" : ""
              }`}
            >
              {isLandscape ? (
                <div className="blank-voucher-landscape-set flex items-center justify-center gap-2">
                  <SingleBlankCopy copyType="PAYEE'S COPY" voucherNumStr={firstVoucherNumStr} />
                  <div className="blank-voucher-landscape-tear border-l border-dashed border-slate-400 h-full flex items-center justify-center">
                    <span className="bg-white px-1 text-[8px] font-mono text-slate-400 uppercase tracking-widest select-none [writing-mode:vertical-rl]">
                      CUT
                    </span>
                  </div>
                  <SingleBlankCopy copyType="OFFICE COPY" voucherNumStr={firstVoucherNumStr} />
                </div>
              ) : (
                <>
                  <div className="blank-voucher-set flex-1 flex flex-col justify-center gap-1.5">
                    <SingleBlankCopy copyType="PAYEE'S COPY" voucherNumStr={firstVoucherNumStr} />
                    <div className="blank-voucher-tear my-1 border-t border-dashed border-slate-300 flex items-center justify-center">
                      <span className="bg-white px-2 text-[8px] font-mono text-slate-400 uppercase tracking-widest select-none">
                        {firstVoucherNumStr ? `(#${firstVoucherNumStr})` : ""}
                      </span>
                    </div>
                    <SingleBlankCopy copyType="OFFICE COPY" voucherNumStr={firstVoucherNumStr} />
                  </div>

                  <div className="blank-voucher-page-divider my-3 border-t-[3px] border-slate-800 relative flex items-center justify-center">
                    <span className="bg-white px-4 text-[10px] font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1 select-none"></span>
                  </div>

                  <div className="blank-voucher-set flex-1 flex flex-col justify-center gap-1.5">
                    <SingleBlankCopy copyType="PAYEE'S COPY" voucherNumStr={secondVoucherNumStr} />
                    <div className="blank-voucher-tear my-1 border-t border-dashed border-slate-300 flex items-center justify-center">
                      <span className="bg-white px-2 text-[8px] font-mono text-slate-400 uppercase tracking-widest select-none">
                        {secondVoucherNumStr ? `(#${secondVoucherNumStr})` : ""}
                      </span>
                    </div>
                    <SingleBlankCopy copyType="OFFICE COPY" voucherNumStr={secondVoucherNumStr} />
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

