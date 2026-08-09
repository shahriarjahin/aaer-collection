import React, { useState, useEffect, useRef } from "react";
import { ReceiptRecord } from "../types";
import { getRecords, deleteRecord, downloadReceiptAsPng, sendReceiptEmail } from "../lib/recordsStore";
import { ReceiptComponent } from "./ReceiptComponent";
import { Search, Printer, Trash2, Download, RefreshCw, FileText, TrendingUp, Users, Wallet, Calendar, X, Image, Mail } from "lucide-react";

interface RecordsHistoryProps {
  onPrintRecord: (record: ReceiptRecord) => void;
  onPrintReport?: (records: ReceiptRecord[], filterLabel: string) => void;
  refreshTrigger?: number;
}

export const RecordsHistory: React.FC<RecordsHistoryProps> = ({
  onPrintRecord,
  onPrintReport,
  refreshTrigger = 0,
}) => {
  const [records, setRecords] = useState<ReceiptRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterNature, setFilterNature] = useState<string>("All");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Hidden container state for PNG export
  const [pngTargetReceipt, setPngTargetReceipt] = useState<ReceiptRecord | null>(null);
  const [isExportingPng, setIsExportingPng] = useState<boolean>(false);
  const pngExportRef = useRef<HTMLDivElement>(null);
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const [emailMessages, setEmailMessages] = useState<Record<string, string>>({});

  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedRecords = await getRecords();
      setRecords(fetchedRecords || []);
    } catch (err: any) {
      console.error("Error loading records:", err);
      setError(err.message || "Failed to load collection history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [refreshTrigger]);

  const handleDelete = async (id: string) => {
    const confirmText = `Are you sure you want to permanently delete receipt ${id} from Supabase?`;

    if (!window.confirm(confirmText)) return;

    try {
      await deleteRecord(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      alert(err.message || "Error deleting receipt");
    }
  };

  const handleDownloadPng = async (record: ReceiptRecord) => {
    setIsExportingPng(true);
    setPngTargetReceipt(record);
    setTimeout(async () => {
      if (pngExportRef.current) {
        await downloadReceiptAsPng(pngExportRef.current, `AAER_Receipt_${record.id}.png`);
      }
      setPngTargetReceipt(null);
      setIsExportingPng(false);
    }, 200);
  };

  const handleResendEmail = async (record: ReceiptRecord) => {
    setSendingEmailId(record.id);
    setEmailMessages((prev) => ({ ...prev, [record.id]: "Sending..." }));
    const result = await sendReceiptEmail(record);
    setEmailMessages((prev) => ({
      ...prev,
      [record.id]: result.status === "sent"
        ? `Sent to ${record.email}`
        : result.error || "Email was not sent.",
    }));
    setSendingEmailId(null);
  };

  // Date quick-set helpers
  const handleSetToday = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    setStartDate(todayStr);
    setEndDate(todayStr);
  };

  const handleClearDates = () => {
    setStartDate("");
    setEndDate("");
  };

  // Filter logic
  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.organization && r.organization.toLowerCase().includes(searchTerm.toLowerCase())) ||
      ((r.email || r.phone) && `${r.email} ${r.phone}`.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesNature =
      filterNature === "All" || r.membershipNature === filterNature;

    const matchesDate = (() => {
      if (!startDate && !endDate) return true;
      if (!r.timestamp) return true;
      try {
        const recDate = new Date(r.timestamp).toISOString().split("T")[0];
        if (startDate && recDate < startDate) return false;
        if (endDate && recDate > endDate) return false;
      } catch (e) {
        return true;
      }
      return true;
    })();

    return matchesSearch && matchesNature && matchesDate;
  });

  // Filtered totals
  const filteredTotalAmount = filteredRecords.reduce((sum, r) => {
    const val = typeof r.amount === "number" ? r.amount : parseFloat(String(r.amount) || "0");
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const filteredCashTotal = filteredRecords
    .filter((r) => r.paymentMethod === "Cash")
    .reduce((sum, r) => sum + (parseFloat(String(r.amount)) || 0), 0);

  const filteredChequeTotal = filteredRecords
    .filter((r) => r.paymentMethod === "Cheque")
    .reduce((sum, r) => sum + (parseFloat(String(r.amount)) || 0), 0);

  const filteredBkashTotal = filteredRecords
    .filter((r) => r.paymentMethod === "bKash")
    .reduce((sum, r) => sum + (parseFloat(String(r.amount)) || 0), 0);

  const filteredNagadTotal = filteredRecords
    .filter((r) => r.paymentMethod === "Nagad")
    .reduce((sum, r) => sum + (parseFloat(String(r.amount)) || 0), 0);

  const filteredTotalPersons = filteredRecords.reduce(
    (sum, r) => sum + (Number(r.numberOfPersons) || 1),
    0
  );

  // Overall totals for all records
  const totalAmount = records.reduce((sum, r) => {
    const val = typeof r.amount === "number" ? r.amount : parseFloat(String(r.amount) || "0");
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  // Membership Nature breakdown calculations (on filtered set)
  const membershipCategories = ["Life Member", "General", "AGM", "Conference", "Other"];
  const membershipBreakdown = membershipCategories.map((cat) => {
    const catRecords = filteredRecords.filter((r) => r.membershipNature === cat);
    const catTotal = catRecords.reduce((sum, r) => {
      const val = typeof r.amount === "number" ? r.amount : parseFloat(String(r.amount) || "0");
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
    return {
      category: cat,
      count: catRecords.length,
      total: catTotal,
    };
  });

  // Helper to trigger report print
  const handlePrintReport = () => {
    let filterLabel = "Whole Collection List (All Records)";
    if (startDate || endDate) {
      if (startDate && endDate) {
        filterLabel = `Datewise Report: ${startDate} to ${endDate}`;
      } else if (startDate) {
        filterLabel = `Datewise Report: From ${startDate} onwards`;
      } else {
        filterLabel = `Datewise Report: Up to ${endDate}`;
      }
    } else if (filterNature !== "All") {
      filterLabel = `Category Filter Report: ${filterNature}`;
    }

    if (onPrintReport) {
      onPrintReport(filteredRecords, filterLabel);
    } else {
      window.print();
    }
  };

  // CSV Export helper
  const exportToCSV = () => {
    if (records.length === 0) return;
    const headers = [
      "Receipt ID",
      "Timestamp",
      "Name",
      "Organization",
      "Membership Nature",
      "Contact",
      "Amount (Tk)",
      "Number of Persons",
      "Payment Method",
      "Cheque No / Date",
      "Bank",
    ];

    const rows = records.map((r) => [
      r.id,
      r.timestamp ? new Date(r.timestamp).toLocaleString() : "",
      `"${(r.name || "").replace(/"/g, '""')}"`,
      `"${(r.organization || "").replace(/"/g, '""')}"`,
      r.membershipNature,
      `"${[r.email, r.phone].filter(Boolean).join(" | ").replace(/"/g, '""')}"`,
      r.amount,
      r.numberOfPersons,
      r.paymentMethod,
      `"${(r.chequeNumberAndDate || "").replace(/"/g, '""')}"`,
      `"${(r.bankName || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "agm_collections.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="records-history-section no-print bg-white rounded-xl shadow-xs border border-slate-200 p-6 md:p-8 max-w-5xl mx-auto">
      {/* Header & Stats Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded uppercase tracking-widest">
            Audit Ledger
          </span>
          <h3 className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-2">
            Collection History & Ledger
          </h3>
          <p className="text-xs text-slate-500">
            Stored in the <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded font-bold">Supabase Ledger</code>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={fetchRecords}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-md text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <button
            type="button"
            onClick={exportToCSV}
            disabled={records.length === 0}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-40 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>

          <button
            type="button"
            onClick={handlePrintReport}
            disabled={filteredRecords.length === 0}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition shadow-xs disabled:opacity-40 cursor-pointer"
            title="Print Whole List or Datewise Collection Report with Total Amount"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Report ({filteredRecords.length})
          </button>
        </div>
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-indigo-600 text-white flex items-center justify-center shrink-0 font-bold">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Total Money Collected
            </p>
            <p className="text-lg font-bold text-slate-900 font-mono">
              ৳ {totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Cash: ৳{filteredCashTotal.toLocaleString()} | Cheque: ৳{filteredChequeTotal.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-slate-800 text-white flex items-center justify-center shrink-0 font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Total Receipts Issued
            </p>
            <p className="text-lg font-bold text-slate-900 font-mono">
              {filteredRecords.length} Payees
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {filteredTotalPersons} Persons | Stored in Supabase
            </p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0 font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Payment Method Breakdown
            </p>
            <p className="text-xs font-bold text-slate-800 mt-1">
              Cash: <span className="text-indigo-700 font-mono">৳{filteredCashTotal.toLocaleString()}</span> ({filteredRecords.filter(r => r.paymentMethod === 'Cash').length})
            </p>
            <p className="text-xs font-bold text-slate-800 mt-0.5">
              Cheque: <span className="text-amber-700 font-mono">৳{filteredChequeTotal.toLocaleString()}</span> ({filteredRecords.filter(r => r.paymentMethod === 'Cheque').length})
            </p>
            <p className="text-xs font-bold text-slate-800 mt-0.5">
              bKash: <span className="text-pink-700 font-mono">৳{filteredBkashTotal.toLocaleString()}</span> ({filteredRecords.filter(r => r.paymentMethod === 'bKash').length})
            </p>
            <p className="text-xs font-bold text-slate-800 mt-0.5">
              Nagad: <span className="text-orange-700 font-mono">৳{filteredNagadTotal.toLocaleString()}</span> ({filteredRecords.filter(r => r.paymentMethod === 'Nagad').length})
            </p>
          </div>
        </div>
      </div>

      {/* Breakdown by Membership Nature */}
      <div className="mb-6 bg-slate-50/60 border border-slate-200 rounded-lg p-4">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
          Breakdown by Membership Nature
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {membershipBreakdown.map((item) => (
            <div
              key={item.category}
              className="bg-white border border-slate-200/80 rounded-md p-2.5 text-center shadow-2xs"
            >
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                {item.category}
              </p>
              <p className="text-sm font-bold text-slate-900 mt-0.5 font-mono">
                ৳{item.total.toLocaleString()}
              </p>
              <p className="text-[10px] text-indigo-600 font-semibold mt-0.5">
                {item.count} {item.count === 1 ? "receipt" : "receipts"}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Date Range Filter Panel */}
      <div className="mb-4 bg-slate-50 border border-slate-200 rounded-lg p-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Datewise Filter:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded px-2 py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs text-slate-800 font-medium focus:outline-none bg-transparent"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded px-2 py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs text-slate-800 font-medium focus:outline-none bg-transparent"
              />
            </div>

            <button
              type="button"
              onClick={handleSetToday}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-xs font-semibold text-slate-700 transition cursor-pointer"
            >
              Today
            </button>

            {(startDate || endDate) && (
              <button
                type="button"
                onClick={handleClearDates}
                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded text-xs font-semibold text-rose-700 transition flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" />
                Clear Dates
              </button>
            )}
          </div>
        </div>

        {/* Date Filter Summary Bar */}
        <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <p className="text-slate-600">
            Showing <strong className="text-slate-900 font-mono">{filteredRecords.length}</strong> receipt(s)
            {startDate || endDate ? (
              <span className="text-indigo-700 font-medium ml-1">
                ({startDate ? `from ${startDate}` : ""} {endDate ? `to ${endDate}` : ""})
              </span>
            ) : (
              <span className="text-slate-500 ml-1">(Whole Collection List)</span>
            )}
          </p>

          <p className="font-semibold text-slate-900">
            Filtered Total:{" "}
            <span className="font-mono font-bold text-indigo-700 text-sm">
              ৳ {filteredTotalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
            <span className="ml-3 text-slate-600">
              Persons: <span className="font-mono text-indigo-700">{filteredTotalPersons}</span>
            </span>
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Payee Name, Cell Number, or Receipt ID..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-medium text-slate-500">Nature Filter:</span>
          <select
            value={filterNature}
            onChange={(e) => setFilterNature(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="All">All Categories</option>
            <option value="Life Member">Life Member</option>
            <option value="General">General</option>
            <option value="AGM">AGM</option>
            <option value="Conference">Conference</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          Loading records...
        </div>
      ) : error ? (
        <div className="py-6 text-center text-rose-600 text-xs font-semibold bg-rose-50 rounded-md border border-rose-200">
          {error}
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          {records.length === 0
            ? "No receipt records saved yet. Submit the form above to register a payment."
            : "No records matched your search query."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-slate-200">
          <table className="w-full text-left text-xs text-slate-800">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Receipt ID / Timestamp</th>
                <th className="py-2.5 px-3">Payee Name & Org</th>
                <th className="py-2.5 px-3">Membership Type</th>
                <th className="py-2.5 px-3 text-right">Amount (Tk.)</th>
                <th className="py-2.5 px-3 text-center">Persons</th>
                <th className="py-2.5 px-3">Payment Method</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredRecords.map((r) => {
                const amt =
                  typeof r.amount === "number"
                    ? r.amount
                    : parseFloat(String(r.amount) || "0");
                const formattedTime = r.timestamp
                  ? new Date(r.timestamp).toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "";
                return (
                  <tr key={r.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">
                      <div>{r.id}</div>
                      {formattedTime && (
                        <div className="text-[10px] font-normal text-slate-400">
                          {formattedTime}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      <div>{r.name}</div>
                      {r.organization && (
                        <div className="text-[11px] text-slate-500 font-normal">
                          {r.organization}
                        </div>
                      )}
                      {(r.email || r.phone) && (
                        <div className="text-[10px] text-slate-400 font-normal">
                          {[r.email, r.phone].filter(Boolean).join(" | ")}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {r.membershipNature}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      ৳ {amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">
                      {Number(r.numberOfPersons) || 1}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          r.paymentMethod === "Cash"
                            ? "bg-indigo-50 text-indigo-800 border border-indigo-100"
                            : "bg-amber-50 text-amber-800 border border-amber-100"
                        }`}
                      >
                        {r.paymentMethod}
                      </span>
                      {r.paymentMethod === "Cheque" && r.chequeNumberAndDate && (
                        <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                          {r.chequeNumberAndDate}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center space-x-1.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleResendEmail(r)}
                        disabled={sendingEmailId === r.id || !r.email}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium text-[11px] inline-flex items-center gap-1 transition shadow-xs cursor-pointer disabled:opacity-50"
                        title={r.email ? `Resend receipt to ${r.email}` : "No payee email recorded"}
                      >
                        <Mail className="w-3 h-3" />
                        {sendingEmailId === r.id ? "Sending..." : "Resend Email"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadPng(r)}
                        disabled={isExportingPng}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium text-[11px] inline-flex items-center gap-1 transition shadow-xs cursor-pointer disabled:opacity-50"
                        title="Download Receipt as PNG Image"
                      >
                        <Image className="w-3 h-3" />
                        Download PNG
                      </button>
                      <button
                        type="button"
                        onClick={() => onPrintRecord(r)}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-black text-white rounded font-medium text-[11px] inline-flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                        title="Reprint Receipt"
                      >
                        <Printer className="w-3 h-3" />
                        Print
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(r.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      {emailMessages[r.id] && (
                        <div className={`text-[10px] mt-1 ${emailMessages[r.id].startsWith("Sent") ? "text-emerald-600" : "text-rose-600"}`}>
                          {emailMessages[r.id]}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Offscreen container rendered exclusively for generating clean high-res PNG downloads */}
      {pngTargetReceipt && (
        <div className="fixed -left-[9999px] top-0 opacity-100 pointer-events-none">
          <div ref={pngExportRef} className="w-[800px] bg-white p-6">
            <ReceiptComponent receipt={pngTargetReceipt} />
          </div>
        </div>
      )}
    </div>
  );
};
