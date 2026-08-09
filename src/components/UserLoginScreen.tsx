import React, { useState } from "react";
import { LockKeyhole, LogIn } from "lucide-react";
import { signInWithPassword } from "../lib/auth";

export const UserLoginScreen: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    setIsSubmitting(true);
    try {
      const result = await signInWithPassword(email.trim(), password);

      if (result.error) throw result.error;
    } catch (authError: any) {
      setError(authError.message || "Authentication failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="bg-slate-900 text-white p-6 text-center">
          <img src="/logo.png" alt="AAER Logo" className="w-20 h-20 object-contain mx-auto mb-3" />
          <h1 className="text-lg font-bold">AAER Collection Portal</h1>
          <p className="text-xs text-slate-300 mt-1">Sign in to issue and track receipts</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Approved user sign in</h2>
            <p className="text-xs text-slate-500 mt-1">
              Your account name will be printed automatically in the “Received by” field.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              autoComplete="current-password"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error && <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">{error}</div>}
          {message && <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700">{message}</div>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            {isSubmitting ? "Please wait..." : "Sign in"}
          </button>

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
            <LockKeyhole className="w-3 h-3" /> Secured by Supabase Auth
          </div>
        </form>
      </div>
    </main>
  );
};