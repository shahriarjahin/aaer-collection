import React, { useState, useEffect, useRef, useCallback } from "react";
import { DataEntryForm } from "./components/DataEntryForm";
import { ReceiptComponent } from "./components/ReceiptComponent";
import { RecordsHistory } from "./components/RecordsHistory";
import { PrintableReport } from "./components/PrintableReport";
import { BlankVouchersPrint } from "./components/BlankVouchersPrint";
import { ReceiptOcrScannerModal } from "./components/ReceiptOcrScannerModal";
import { DatabaseSyncBar } from "./components/DatabaseSyncBar";
import { AdministratorPanel } from "./components/AdministratorPanel";
import { UserLoginScreen } from "./components/UserLoginScreen";
import { ReceiptVerificationModal } from "./components/ReceiptVerificationModal";
import { getCurrentUserApproval, getUserDisplayName, signOutUser } from "./lib/auth";
import { supabase } from "./lib/supabase";
import { downloadReceiptAsPng } from "./lib/recordsStore";
import { ReceiptFormData, ReceiptRecord } from "./types";
import { Printer, FilePlus, History, Eye, Sparkles, ShieldCheck, Lock, QrCode, FileText, ScanLine, Image, LogOut } from "lucide-react";
import { User } from "@supabase/supabase-js";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isApproved, setIsApproved] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<"form" | "preview" | "history" | "blank" | "administrator">("form");
  const [activeReceipt, setActiveReceipt] = useState<ReceiptRecord | null>(null);
  const [draftReceipt, setDraftReceipt] = useState<ReceiptRecord | null>(null);
  const [activeReportData, setActiveReportData] = useState<{ records: ReceiptRecord[]; filterLabel: string } | null>(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState<number>(0);

  // AI OCR Scanner State
  const [isOcrModalOpen, setIsOcrModalOpen] = useState<boolean>(false);
  const [scannedFormData, setScannedFormData] = useState<ReceiptFormData | null>(null);

  // QR Code Verification Modal State
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [publicPrintReceipt, setPublicPrintReceipt] = useState<ReceiptRecord | null>(null);

  useEffect(() => {
    if (!supabase) {
      setIsAuthLoading(false);
      return;
    }

    let isMounted = true;
    const applySession = async (user: User | null) => {
      if (isMounted) {
        setCurrentUser(user);
        const approval = user ? await getCurrentUserApproval(user.id).catch(() => null) : null;
        setIsApproved(Boolean(approval?.approved));
        setIsAdmin(Boolean(approval?.isAdmin && approval.approved));
        setIsAuthLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data }) => applySession(data.session?.user || null));

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      void applySession(session?.user || null);
    });

    // Check if URL has ?verifyId=...
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const vId = params.get("verifyId");
      if (vId) {
        setVerificationId(vId);
      }
    }

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Today formatted for signature block
  const todayFormatted = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // Administrator-only action helper. Authorization is enforced by Supabase RLS.
  const executeWithAdministrator = (action: () => void) => {
    if (isAdmin) action();
  };

  const handleAdminLogout = () => {
    setActiveTab("form");
  };

  // Handle when form submits & receives 200 OK with saved record
  const handleReceiptSavedAndPrint = (savedRecord: ReceiptRecord) => {
    setActiveReportData(null);
    setActiveReceipt(savedRecord);
    setHistoryRefreshKey((prev) => prev + 1);

    setTimeout(() => {
      window.print();
    }, 150);
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
          prev.email === formData.email &&
          prev.phone === formData.phone &&
          prev.amount === formData.amount &&
          prev.numberOfPersons === formData.numberOfPersons &&
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
          receivedBy: getUserDisplayName(currentUser!),
          ...formData,
        };
      });
    } else {
      setDraftReceipt((prev) => (prev === null ? null : null));
    }
  }, [activeReceiptId, currentUser]);

  const handleUserLogout = async () => {
    try {
      await signOutUser();
      setIsAdmin(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (isAuthLoading) {
    return <div className="min-h-screen bg-slate-100 flex items-center justify-center text-sm text-slate-500">Checking authentication...</div>;
  }

  if (!supabase) {
    return <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 text-center text-sm text-rose-700">Supabase Auth is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.</div>;
  }

  if (!currentUser) {
    if (verificationId) {
      return (
        <div className="min-h-screen bg-slate-100">
          <ReceiptVerificationModal
            receiptId={verificationId}
            onPrintReceipt={(record) => {
              setPublicPrintReceipt(record);
              setTimeout(() => {
                window.print();
                setTimeout(() => setPublicPrintReceipt(null), 500);
              }, 150);
            }}
            onClose={() => setVerificationId(null)}
          />
          {publicPrintReceipt && (
            <div className="print-only-container hidden print:block">
              <ReceiptComponent
                receipt={publicPrintReceipt}
                todayDateFormatted={todayFormatted}
              />
            </div>
          )}
          <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">
            Public receipt verification
          </div>
        </div>
      );
    }
    return <UserLoginScreen />;
  }

  if (!isApproved) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-amber-200 rounded-xl shadow-sm p-6 text-center">
          <h1 className="text-lg font-bold text-slate-900">Approval pending</h1>
          <p className="text-sm text-slate-600 mt-2">Your account is signed in, but an administrator must approve it before you can issue receipts.</p>
          <button type="button" onClick={handleUserLogout} className="mt-5 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold">Sign out</button>
        </div>
      </div>
    );
  }

  // Handle re-printing a single record from History
  const handlePrintHistoryRecord = (record: ReceiptRecord) => {
    executeWithAdministrator(() => {
      setActiveReportData(null);
      setActiveReceipt(record);
      setTimeout(() => {
        window.print();
      }, 150);
    });
  };

  // Handle printing the summary list/report from History
  const handlePrintReportList = (records: ReceiptRecord[], filterLabel: string) => {
    executeWithAdministrator(() => {
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
              className="w-30 h-30 object-contain select-none"
            />
            <div>
              <h1 className="text-sm md:text-base font-bold tracking-tight text-slate-900 leading-snug">
                AAER Collection Portal
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
                onClick={() => executeWithAdministrator(() => setActiveTab("blank"))}
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

            {/* Administrator workspace */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setActiveTab("administrator")}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                title="Open administrator workspace"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Administrator
              </button>
            )}

            <button
              type="button"
              onClick={handleUserLogout}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
              title={`Sign out ${getUserDisplayName(currentUser)}`}
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`max-w-6xl mx-auto px-4 pt-8 ${
        activeTab === "blank" ? "" : "print-main-hidden"
      }`}>
        {/* VIEW 1: DATA ENTRY FORM */}
        {activeTab === "form" && (
          <div className="space-y-8 animate-fadeIn">
            <DataEntryForm
              onReceiptSavedAndPrint={handleReceiptSavedAndPrint}
              onPreviewChange={handlePreviewChange}
              onOpenOcrScanner={() => setIsOcrModalOpen(true)}
              onOpenBlankPrint={() => executeWithAdministrator(() => setActiveTab("blank"))}
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
              canAdminister={isAdmin}
            />
          </div>
        )}

        {activeTab === "administrator" && isAdmin && <AdministratorPanel />}

        {/* VIEW 4: BULK BLANK VOUCHERS PRINTING */}
        {activeTab === "blank" && (
          <div className="animate-fadeIn">
            {isAdmin ? (
              <BlankVouchersPrint
                onBack={() => setActiveTab("form")}
              />
            ) : (
              <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center space-y-4 max-w-md mx-auto my-12">
                <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                  <h3 className="text-lg font-bold text-slate-800">Administrator approval required</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Downloading or printing blank vouchers is restricted to administrator accounts.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("form")}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm transition inline-flex items-center gap-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  Return to collection entry
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Hidden/Target Printable Element used exclusively during @media print */}
      <div className={`print-only-container hidden print:block ${
        activeReportData ? "print-report-target" : "print-receipt-target"
      }`}>
        {activeReportData ? (
          <PrintableReport
            records={activeReportData.records}
            filterLabel={activeReportData.filterLabel}
            todayDateFormatted={todayFormatted}
          />
        ) : (activeReceipt || draftReceipt) ? (
          <ReceiptComponent
            receipt={activeReceipt || draftReceipt}
            todayDateFormatted={todayFormatted}
          />
        ) : null}
      </div>

      {/* Receipt Authenticity Verification Modal */}
      <ReceiptVerificationModal
        receiptId={verificationId}
        onPrintReceipt={(record) => {
          setActiveReportData(null);
          setActiveReceipt(record);
          setTimeout(() => window.print(), 150);
        }}
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
