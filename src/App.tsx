import React, { useState, useEffect, useRef, useCallback } from "react";
import { DataEntryForm } from "./components/DataEntryForm";
import { ReceiptComponent } from "./components/ReceiptComponent";
import { RecordsHistory } from "./components/RecordsHistory";
import { PrintableReport } from "./components/PrintableReport";
import { BlankVouchersPrint } from "./components/BlankVouchersPrint";
import { ReceiptOcrScannerModal } from "./components/ReceiptOcrScannerModal";
import { DatabaseSyncBar } from "./components/DatabaseSyncBar";
import { AdminLoginModal } from "./components/AdminLoginModal";
import { ReceiptVerificationModal } from "./components/ReceiptVerificationModal";
import { isAdminLoggedIn, setAdminLoggedIn } from "./lib/adminAuth";
import { downloadReceiptAsPng } from "./lib/recordsStore";
import { ReceiptFormData, ReceiptRecord } from "./types";
import { Printer, FilePlus, History, Eye, Sparkles, ShieldCheck, Lock, Unlock, QrCode, FileText, ScanLine, Image } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"form" | "preview" | "history" | "blank">("form");
  const [activeReceipt, setActiveReceipt] = useState<ReceiptRecord | null>(null);
  const [draftReceipt, setDraftReceipt] = useState<ReceiptRecord | null>(null);
  const [activeReportData, setActiveReportData] = useState<{ records: ReceiptRecord[]; filterLabel: string } | null>(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState<number>(0);

  // AI OCR Scanner State
  const [isOcrModalOpen, setIsOcrModalOpen] = useState<boolean>(false);
  const [scannedFormData, setScannedFormData] = useState<ReceiptFormData | null>(null);

  // Admin Security State
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [pendingAdminAction, setPendingAdminAction] = useState<(() => void) | null>(null);

  // QR Code Verification Modal State
  const [verificationId, setVerificationId] = useState<string | null>(null);

  useEffect(() => {
    setIsAdmin(isAdminLoggedIn());

    // Check if URL has ?verifyId=...
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const vId = params.get("verifyId");
      if (vId) {
        setVerificationId(vId);
      }
    }
  }, []);

  // Today formatted for signature block
  const todayFormatted = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // Admin action execution helper
  const executeWithAdminAuth = (action: () => void) => {
    if (isAdminLoggedIn()) {
      action();
    } else {
      setPendingAdminAction(() => action);
      setIsAdminModalOpen(true);
    }
  };

  const handleAdminAuthSuccess = () => {
    setIsAdmin(true);
    if (pendingAdminAction) {
      pendingAdminAction();
      setPendingAdminAction(null);
    }
  };

  const handleAdminLogout = () => {
    setAdminLoggedIn(false);
    setIsAdmin(false);
  };

  // Handle when form submits & receives 200 OK with saved record
  const handleReceiptSavedAndPrint = (savedRecord: ReceiptRecord) => {
    executeWithAdminAuth(() => {
      setActiveReportData(null);
      setActiveReceipt(savedRecord);
      setHistoryRefreshKey((prev) => prev + 1);

      setTimeout(() => {
        window.print();
      }, 150);
    });
  };

  // Handle live preview drafting
  const activeReceiptId = activeReceipt?.id;
  const handlePreviewChange = useCallback((formData: ReceiptFormData) => {
    if (formData.name || formData.amount) {
      setDraftReceipt((prev) => {
        const targetId = activeReceiptId || "REC-2026-DRAFT";
        if (
          prev &&
          prev.id === targetId &&
          prev.name === formData.name &&
          prev.organization === formData.organization &&
          prev.emailAndCell === formData.emailAndCell &&
          prev.amount === formData.amount &&
          prev.paymentMethod === formData.paymentMethod &&
          prev.chequeNumberAndDate === formData.chequeNumberAndDate &&
          prev.bankName === formData.bankName &&
          prev.remarks === formData.remarks &&
          prev.membershipNature === formData.membershipNature
        ) {
          return prev;
        }
        return {
          id: targetId,
          timestamp: prev?.timestamp || new Date().toISOString(),
          ...formData,
        };
      });
    } else {
      setDraftReceipt((prev) => (prev === null ? null : null));
    }
  }, [activeReceiptId]);

  // Handle re-printing a single record from History
  const handlePrintHistoryRecord = (record: ReceiptRecord) => {
    executeWithAdminAuth(() => {
      setActiveReportData(null);
      setActiveReceipt(record);
      setTimeout(() => {
        window.print();
      }, 150);
    });
  };

  // Handle printing the summary list/report from History
  const handlePrintReportList = (records: ReceiptRecord[], filterLabel: string) => {
    executeWithAdminAuth(() => {
      setActiveReceipt(null);
      setActiveReportData({ records, filterLabel });
      setTimeout(() => {
        window.print();
      }, 150);
    });
  };

  return (
    <div className="min-h-screen bg-slate-100/70 font-sans text-slate-900 pb-16">
      {/* Supabase Database Status Bar */}
      <DatabaseSyncBar onRefresh={() => setHistoryRefreshKey((prev) => prev + 1)} />

      {/* Top Application Navigation Bar (no-print) */}
      <header className="no-print bg-white text-slate-900 border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="AAER Logo"
              className="w-20 h-20 object-contain select-none"
            />
            <div>
              <h1 className="text-sm md:text-base font-bold tracking-tight text-slate-900 leading-snug">
                AAER AGM Portal
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                Alumni Association of Agricultural Extension & Rural Development — GAU ESTD. 2017
              </p>
            </div>
          </div>

          {/* Navigation Tabs & Security Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab("form")}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 transition ${
                  activeTab === "form"
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <FilePlus className="w-3.5 h-3.5 text-indigo-600" />
                Collection Entry
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 transition ${
                  activeTab === "preview"
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-indigo-600" />
                Receipt Preview
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("history")}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 transition ${
                  activeTab === "history"
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <History className="w-3.5 h-3.5 text-indigo-600" />
                Report Dashboard
              </button>

              <button
                type="button"
                onClick={() => executeWithAdminAuth(() => setActiveTab("blank"))}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 transition ${
                  activeTab === "blank"
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                Blank Vouchers
              </button>
            </nav>

            {/* Quick Scan AI Button */}
            <button
              type="button"
              onClick={() => setIsOcrModalOpen(true)}
              className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
              title="Scan Handwritten Receipt Photo with Gemini AI OCR"
            >
              <ScanLine className="w-3.5 h-3.5 text-indigo-600" />
              AI OCR Scan
            </button>

            {/* Quick Verify Receipt QR Button */}
            <button
              type="button"
              onClick={() => setVerificationId("REC-2026-0001")}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
              title="Scan or Verify Receipt Authenticity"
            >
              <QrCode className="w-3.5 h-3.5 text-indigo-600" />
              Verify QR
            </button>

            {/* Admin Security Badge / Button */}
            {isAdmin ? (
              <button
                type="button"
                onClick={handleAdminLogout}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                title="Admin Authorized. Click to Lock / Logout Admin mode."
              >
                <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                Admin Mode
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setPendingAdminAction(null);
                  setIsAdminModalOpen(true);
                }}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                title="Click to authenticate as Admin"
              >
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                Admin Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 pt-8">
        {/* VIEW 1: DATA ENTRY FORM */}
        {activeTab === "form" && (
          <div className="space-y-8 animate-fadeIn">
            <DataEntryForm
              onReceiptSavedAndPrint={handleReceiptSavedAndPrint}
              onPreviewChange={handlePreviewChange}
              onOpenOcrScanner={() => setIsOcrModalOpen(true)}
              onOpenBlankPrint={() => executeWithAdminAuth(() => setActiveTab("blank"))}
              initialFormData={scannedFormData}
            />

            {/* Quick Helper Banner */}
            <div className="no-print bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 max-w-3xl mx-auto flex items-center justify-between text-xs shadow-sm">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>
                  <strong>Instant Auto-Print & AI OCR Enabled:</strong> Submit entry directly or scan handwritten receipt photos to auto-populate fields.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("history")}
                className="underline font-bold text-indigo-300 hover:text-indigo-200 shrink-0 ml-2"
              >
                View Saved Records &rarr;
              </button>
            </div>
          </div>
        )}

        {/* VIEW 2: RECEIPT PREVIEW (ON SCREEN) */}
        {activeTab === "preview" && (
          <div className="no-print space-y-6 max-w-3xl mx-auto animate-fadeIn">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Digital Invoice Receipt Preview
                </h3>
                <p className="text-xs text-slate-500">
                  Save as PNG image or send to physical/PDF printer.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const currentRec = activeReceipt || draftReceipt;
                    const el = document.getElementById("receipt-preview-card");
                    if (el) {
                      downloadReceiptAsPng(el, `AAER_Receipt_${currentRec?.id || "preview"}.png`);
                    }
                  }}
                  disabled={!activeReceipt && !draftReceipt}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition disabled:opacity-40 cursor-pointer shadow-xs"
                >
                  <Image className="w-4 h-4" />
                  Download PNG
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  disabled={!activeReceipt && !draftReceipt}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition disabled:opacity-40 cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  Print Receipt
                </button>
              </div>
            </div>

            <div id="receipt-preview-card">
              <ReceiptComponent
                receipt={activeReceipt || draftReceipt}
                todayDateFormatted={todayFormatted}
              />
            </div>
          </div>
        )}

        {/* VIEW 3: RECORDS HISTORY & SEARCH */}
        {activeTab === "history" && (
          <div className="animate-fadeIn">
            <RecordsHistory
              onPrintRecord={handlePrintHistoryRecord}
              onPrintReport={handlePrintReportList}
              refreshTrigger={historyRefreshKey}
            />
          </div>
        )}

        {/* VIEW 4: BULK BLANK VOUCHERS PRINTING */}
        {activeTab === "blank" && (
          <div className="animate-fadeIn">
            {isAdmin ? (
              <BlankVouchersPrint
                onBack={() => setActiveTab("form")}
                onRequireAdminAuth={executeWithAdminAuth}
              />
            ) : (
              <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center space-y-4 max-w-md mx-auto my-12">
                <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Admin Authentication Required</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Downloading or printing blank vouchers is restricted to authorized administrators only.
                </p>
                <button
                  type="button"
                  onClick={() => executeWithAdminAuth(() => setActiveTab("blank"))}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm transition inline-flex items-center gap-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  Authenticate as Admin
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Hidden/Target Printable Element used exclusively during @media print */}
      <div className="print-only-container hidden print:block">
        {activeReportData ? (
          <PrintableReport
            records={activeReportData.records}
            filterLabel={activeReportData.filterLabel}
            todayDateFormatted={todayFormatted}
          />
        ) : (
          <ReceiptComponent
            receipt={activeReceipt || draftReceipt}
            todayDateFormatted={todayFormatted}
          />
        )}
      </div>

      {/* Admin Passcode Authentication Modal */}
      <AdminLoginModal
        isOpen={isAdminModalOpen}
        onClose={() => {
          setIsAdminModalOpen(false);
          setPendingAdminAction(null);
        }}
        onSuccess={handleAdminAuthSuccess}
      />

      {/* Receipt Authenticity Verification Modal */}
      <ReceiptVerificationModal
        receiptId={verificationId}
        onClose={() => setVerificationId(null)}
      />

      {/* AI OCR Scanner Modal */}
      <ReceiptOcrScannerModal
        isOpen={isOcrModalOpen}
        onClose={() => setIsOcrModalOpen(false)}
        onExtractSuccess={(extractedData) => {
          setScannedFormData(extractedData);
          setActiveTab("form");
        }}
      />
    </div>
  );
}
