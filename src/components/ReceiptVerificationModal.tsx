import React, { useState, useEffect, useRef } from "react";
import { ReceiptRecord } from "../types";
import { getRecords, downloadReceiptAsPng } from "../lib/recordsStore";
import { ReceiptComponent } from "./ReceiptComponent";
import { CheckCircle2, XCircle, ShieldCheck, X, Search, FileText, Image } from "lucide-react";

interface ReceiptVerificationModalProps {
  receiptId: string | null;
  onClose: () => void;
  onPrintReceipt?: (record: ReceiptRecord) => void;
}

export const ReceiptVerificationModal: React.FC<ReceiptVerificationModalProps> = ({
  receiptId,
  onClose,
  onPrintReceipt,
}) => {
  const [loading, setLoading] = useState(false);
  const [record, setRecord] = useState<ReceiptRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchId, setSearchId] = useState(receiptId || "");
  const [isExportingPng, setIsExportingPng] = useState(false);

  const pngExportRef = useRef<HTMLDivElement>(null);

  const verifyReceipt = async (idToVerify: string) => {
    if (!idToVerify.trim()) return;
    setLoading(true);
    setError(null);
    setRecord(null);

    try {
      const records = await getRecords();
      const found = records.find(
        (r) => r.id.toLowerCase() === idToVerify.trim().toLowerCase()
      );

      if (found) {
        setRecord(found);
      } else {
        setError(`Voucher #${idToVerify} was not found in official AAER records.`);
      }
    } catch (err: any) {
      setError(`Verification error: ${err.message || "Failed to query database"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPng = async () => {
    if (!record) return;
    setIsExportingPng(true);
    setTimeout(async () => {
      if (pngExportRef.current) {
        await downloadReceiptAsPng(pngExportRef.current, `Verified_AAER_Receipt_${record.id}.png`);
      }
      setIsExportingPng(false);
    }, 200);
  };

  useEffect(() => {
    if (receiptId) {
      setSearchId(receiptId);
      verifyReceipt(receiptId);
    }
  }, [receiptId]);

  if (!receiptId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn no-print">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <div>
              <h3 className="font-bold text-sm">Official Receipt Authenticity Check</h3>
              <p className="text-[10px] text-slate-300">AAER Money Receipt Ledger Verification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Quick Manual Search */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              verifyReceipt(searchId);
            }}
            className="flex gap-2 mb-4"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Enter Voucher No (e.g. REC-2026-0001)"
                className="w-full pl-9 pr-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-slate-50"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
            >
              Verify
            </button>
          </form>

          {loading && (
            <div className="py-8 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              Verifying voucher record in AAER official ledger...
            </div>
          )}

          {error && !loading && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-center space-y-2">
              <XCircle className="w-8 h-8 text-rose-500 mx-auto" />
              <h4 className="font-bold text-rose-800 text-sm">AUTHENTICITY FAILURE</h4>
              <p className="text-xs text-rose-600">{error}</p>
            </div>
          )}

          {record && !loading && (
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-3 border-b border-emerald-200 pb-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                <div>
                  <div className="inline-flex items-center gap-1.5 bg-emerald-600 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                    AUTHENTIC & VERIFIED
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mt-0.5">
                    Official AAER Voucher #{record.id}
                  </h4>
                </div>
              </div>

              {/* Verified Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Received From:</span>
                  <p className="font-bold text-slate-800">{record.name}</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Amount Paid:</span>
                  <p className="font-bold text-emerald-700 font-mono text-sm">
                    ৳ {parseFloat(String(record.amount) || "0").toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Membership Category:</span>
                  <p className="font-medium text-slate-700">{record.membershipNature}</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Payment Method:</span>
                  <p className="font-medium text-slate-700 uppercase">{record.paymentMethod}</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Number of Persons:</span>
                  <p className="font-medium text-slate-700">{Number(record.numberOfPersons) || 1}</p>
                </div>

                <div className="col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Organization:</span>
                  <p className="font-medium text-slate-700">{record.organization || "N/A"}</p>
                </div>

                <div className="col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Issued On:</span>
                  <p className="font-mono text-slate-600 text-[11px]">
                    {new Date(record.timestamp).toLocaleString("en-GB")}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-emerald-200 flex items-center justify-between gap-2">
                <p className="text-[10px] text-slate-500 font-medium">
                  Issued by AAER
                </p>
                <button
                  type="button"
                  onClick={handleDownloadPng}
                  disabled={isExportingPng}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Image className="w-3.5 h-3.5" />
                  Download PNG
                </button>
                <button
                  type="button"
                  onClick={() => onPrintReceipt?.(record)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Print
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <p className="text-[11px] text-slate-500 font-mono">AAER Ledger ID: #{searchId}</p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Offscreen element for rendering PNG export of verified receipt */}
      {record && (
        <div className="fixed -left-[9999px] top-0 opacity-100 pointer-events-none">
          <div ref={pngExportRef} className="w-[800px] bg-white p-6">
            <ReceiptComponent receipt={record} />
          </div>
        </div>
      )}
    </div>
  );
};
