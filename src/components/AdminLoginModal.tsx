import React, { useState } from "react";
import { verifyAdminPin, getStoredAdminPin, setStoredAdminPin, setAdminLoggedIn, resetAdminPinToDefault } from "../lib/adminAuth";
import { Lock, Unlock, KeyRound, CheckCircle, ShieldAlert, X, ShieldCheck, RefreshCw } from "lucide-react";

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
  description?: string;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = "Admin Authentication Required",
  description = "You must enter the Admin Passcode to issue receipts, delete records, or modify settings.",
}) => {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [currentPinInput, setCurrentPinInput] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmNewPin, setConfirmNewPin] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (verifyAdminPin(pin)) {
      setPin("");
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setError("Invalid Admin Passcode!");
    }
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!verifyAdminPin(currentPinInput)) {
      setError("Incorrect current admin passcode!");
      return;
    }

    if (newPin.length < 4) {
      setError("New passcode must be at least 4 digits/characters.");
      return;
    }
    if (newPin !== confirmNewPin) {
      setError("New passcodes do not match.");
      return;
    }

    setStoredAdminPin(newPin);
    setSuccessMsg("Admin Passcode updated successfully!");
    setCurrentPinInput("");
    setNewPin("");
    setConfirmNewPin("");
    setTimeout(() => {
      setSuccessMsg(null);
      setIsChangingPin(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn no-print">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-sm">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          <p className="text-xs text-slate-600 mb-4">{description}</p>

          {!isChangingPin ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Enter Admin Passcode / PIN
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Enter PIN"
                    autoFocus
                    className="w-full pl-9 pr-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1 flex justify-between items-center">
                  <span>Default Passcode: <strong className="font-mono text-indigo-600">1234</strong></span>
                </p>
              </div>

              {error && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      resetAdminPinToDefault();
                      setPin("1234");
                      setError(null);
                      setSuccessMsg("Reset passcode back to default 1234!");
                      setTimeout(() => setSuccessMsg(null), 2500);
                    }}
                    className="text-[11px] text-indigo-600 hover:underline font-semibold flex items-center gap-1 cursor-pointer pt-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Reset Passcode to Default (1234)
                  </button>
                </div>
              )}

              {successMsg && !isChangingPin && (
                <div className="p-2 bg-emerald-50 text-xs text-emerald-700 rounded border border-emerald-200 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {successMsg}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setIsChangingPin(true)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:underline cursor-pointer"
                >
                  Change Passcode?
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    Authenticate
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleChangePin} className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800">Change Admin Passcode</h4>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Current Admin Passcode
                </label>
                <input
                  type="password"
                  value={currentPinInput}
                  onChange={(e) => setCurrentPinInput(e.target.value)}
                  placeholder="Enter current passcode"
                  required
                  autoFocus
                  className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  New Admin Passcode
                </label>
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="At least 4 digits"
                  required
                  className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Confirm New Passcode
                </label>
                <input
                  type="password"
                  value={confirmNewPin}
                  onChange={(e) => setConfirmNewPin(e.target.value)}
                  placeholder="Re-enter new passcode"
                  required
                  className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                />
              </div>

              {error && (
                <div className="p-2 bg-rose-50 text-xs text-rose-700 rounded border border-rose-200">
                  {error}
                </div>
              )}

              {successMsg && (
                <div className="p-2 bg-emerald-50 text-xs text-emerald-700 rounded border border-emerald-200 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {successMsg}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsChangingPin(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                >
                  Back to Login
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded cursor-pointer"
                >
                  Save New Passcode
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
