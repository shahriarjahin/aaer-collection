import React from "react";
import { ReceiptRecord } from "../types";

interface PrintableReportProps {
  records: ReceiptRecord[];
  filterLabel: string;
  todayDateFormatted?: string;
}

export const PrintableReport: React.FC<PrintableReportProps> = ({
  records,
  filterLabel,
  todayDateFormatted,
}) => {
  const displayDate = todayDateFormatted || new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const displayTime = new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const totalAmount = records.reduce((sum, r) => {
    const val = typeof r.amount === "number" ? r.amount : parseFloat(String(r.amount) || "0");
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const totalPersons = records.reduce(
    (sum, r) => sum + (Number(r.numberOfPersons) || 1),
    0
  );

  const cashTotal = records
    .filter((r) => r.paymentMethod === "Cash")
    .reduce((sum, r) => {
      const val = typeof r.amount === "number" ? r.amount : parseFloat(String(r.amount) || "0");
      return sum + (isNaN(val) ? 0 : val);
    }, 0);

  const chequeTotal = records
    .filter((r) => r.paymentMethod === "Cheque")
    .reduce((sum, r) => {
      const val = typeof r.amount === "number" ? r.amount : parseFloat(String(r.amount) || "0");
      return sum + (isNaN(val) ? 0 : val);
    }, 0);

  const bkashTotal = records
    .filter((r) => r.paymentMethod === "bKash")
    .reduce((sum, r) => {
      const val = typeof r.amount === "number" ? r.amount : parseFloat(String(r.amount) || "0");
      return sum + (isNaN(val) ? 0 : val);
    }, 0);

  const nagadTotal = records
    .filter((r) => r.paymentMethod === "Nagad")
    .reduce((sum, r) => {
      const val = typeof r.amount === "number" ? r.amount : parseFloat(String(r.amount) || "0");
      return sum + (isNaN(val) ? 0 : val);
    }, 0);

  return (
    <div className="printable-report-container bg-white text-slate-900 p-6 max-w-4xl mx-auto print:max-w-none print:w-full print:p-0">
      {/* 1. HEADER */}
      <header className="flex flex-row items-start justify-between pb-4 border-b-2 border-slate-800 gap-4">
        {/* Left: Organization Logo */}
        <div className="flex items-center gap-3">
          <img 
            src="/logo.png" 
            alt="AAER Logo" 
            className="w-20 h-20 object-contain select-none" 
          />
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">
              Alumni Association of Agricultural Extension & Rural Development (AAER)
            </h1>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">
              GAU ESTD. - 2017
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="bg-slate-900 text-white px-3 py-1 text-xs font-bold rounded-xs uppercase tracking-widest inline-block">
            Collection Ledger Report
          </span>
          <p className="text-[10px] text-slate-500 mt-1 font-mono">
            Generated: {displayDate} at {displayTime}
          </p>
        </div>
      </header>

      {/* 2. REPORT META BAR */}
      <div className="my-4 p-3 bg-slate-50 border border-slate-200 rounded text-xs flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block">
            Report Filter Scope
          </span>
          <span className="font-semibold text-slate-800">
            {filterLabel || "Whole Collection List"}
          </span>
        </div>

        <div className="flex items-center gap-4 text-right">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Receipts</span>
            <span className="font-mono font-bold text-slate-800">{records.length} Vouchers</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Amount</span>
            <span className="font-mono font-bold text-indigo-700 text-sm">
              ৳ {totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Persons</span>
            <span className="font-mono font-bold text-slate-800">{totalPersons}</span>
          </div>
        </div>
      </div>

      {/* 3. TABLE OF RECORDS */}
      <div className="my-4 overflow-hidden border border-slate-300 rounded-sm">
        <table className="w-full text-left text-xs text-slate-800 border-collapse">
          <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[9px] border-b border-slate-300">
            <tr>
              <th className="py-2 px-2 border-r border-slate-300 w-8 text-center">#</th>
              <th className="py-2 px-2 border-r border-slate-300">Receipt ID</th>
              <th className="py-2 px-2 border-r border-slate-300">Date & Time</th>
              <th className="py-2 px-2 border-r border-slate-300">Payee Name</th>
              <th className="py-2 px-2 border-r border-slate-300">Organization</th>
              <th className="py-2 px-2 border-r border-slate-300">Membership</th>
              <th className="py-2 px-2 border-r border-slate-300">Method</th>
              <th className="py-2 px-2 text-right">Amount (Tk.)</th>
              <th className="py-2 px-2 text-center">Persons</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {records.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-6 text-center text-slate-400 italic">
                  No collection records found for the selected filter criteria.
                </td>
              </tr>
            ) : (
              records.map((r, idx) => {
                const amt = typeof r.amount === "number" ? r.amount : parseFloat(String(r.amount) || "0");
                const formattedTime = r.timestamp
                  ? new Date(r.timestamp).toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "N/A";

                return (
                  <tr key={r.id || idx} className="hover:bg-slate-50">
                    <td className="py-1.5 px-2 border-r border-slate-200 text-center font-mono text-[10px]">
                      {idx + 1}
                    </td>
                    <td className="py-1.5 px-2 border-r border-slate-200 font-mono font-bold text-slate-900 text-[11px]">
                      {r.id}
                    </td>
                    <td className="py-1.5 px-2 border-r border-slate-200 text-[10px] text-slate-600 font-mono">
                      {formattedTime}
                    </td>
                    <td className="py-1.5 px-2 border-r border-slate-200 font-medium text-slate-900">
                      {r.name}
                      {(r.email || r.phone) && (
                        <span className="block text-[9px] text-slate-400 font-normal">
                          {[r.email, r.phone].filter(Boolean).join(" | ")}
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 px-2 border-r border-slate-200 text-slate-600 text-[11px]">
                      {r.organization || "—"}
                    </td>
                    <td className="py-1.5 px-2 border-r border-slate-200 text-[10px] font-medium">
                      {r.membershipNature}
                    </td>
                    <td className="py-1.5 px-2 border-r border-slate-200 text-[10px] uppercase font-semibold">
                      {r.paymentMethod}
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-900">
                      ৳ {amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-1.5 px-2 text-center font-mono font-bold text-slate-900">
                      {Number(r.numberOfPersons) || 1}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* TOTAL FOOTER ROW */}
          <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-400 text-xs text-slate-900">
            <tr>
              <td colSpan={6} className="py-2.5 px-3 border-r border-slate-300 text-right uppercase tracking-wider text-[10px]">
                Total Collection Summary (Cash: ৳{cashTotal.toLocaleString()} | Cheque: ৳{chequeTotal.toLocaleString()} | bKash: ৳{bkashTotal.toLocaleString()} | Nagad: ৳{nagadTotal.toLocaleString()})
              </td>
              <td className="py-2.5 px-2 border-r border-slate-300 text-center uppercase text-[10px]">
                GRAND TOTAL:
              </td>
              <td className="py-2.5 px-2 text-right font-mono font-extrabold text-indigo-900 text-sm">
                ৳ {totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 4. SIGNATURE FOOTER */}
      <footer className="mt-12 pt-4 flex justify-between items-end">
        <div className="w-44 border-t border-slate-400 text-center pt-1.5">
          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">
            Prepared By (Desk Officer)
          </p>
        </div>

        <div className="w-56 text-center relative">
          <div className="mb-1 flex flex-col items-center">
            <img 
              src="/signature.png" 
              alt="Treasurer Signature" 
              className="h-12 w-auto object-contain -rotate-2 select-none mb-1 mix-blend-multiply" 
            />
            <div className="text-[8px] text-slate-400 font-mono mt-1">
              Date: {displayDate}
            </div>
          </div>
          <div className="border-t border-slate-400 pt-1.5">
            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">
              Signature of Treasurer with Date
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
