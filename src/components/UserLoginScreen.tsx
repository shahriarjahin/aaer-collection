import React, { useState } from "react";
import { LockKeyhole, LogIn, UserPlus } from "lucide-react";
import { signInWithPassword, signUpWithPassword } from "../lib/auth";

export const UserLoginScreen: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    setIsSubmitting(true);
    try {
      const result = isSignUp
        ? await signUpWithPassword(email.trim(), password, fullName)
        : await signInWithPassword(email.trim(), password);

      if (result.error) throw result.error;
      if (isSignUp) {
        setMessage(result.data.session
          ? "Your account was created and is waiting for administrator approval."
          : "Sign-up received. Check your email, then wait for an administrator to approve your account.");
        setPassword("");
      }
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
            <h2 className="text-base font-bold text-slate-900">{isSignUp ? "Request an account" : "Approved user sign in"}</h2>
            <p className="text-xs text-slate-500 mt-1">
              {isSignUp ? "An administrator must approve your account before you can sign in." : ""}
            </p>
          </div>

          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full name</label>
              <input type="text" value={fullName} onChange={(event) => setFullName(event.target.value)} required autoComplete="name" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>
          )}

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
              autoComplete={isSignUp ? "new-password" : "current-password"}
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
            {isSignUp ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            {isSubmitting ? "Please wait..." : isSignUp ? "Request sign up" : "Sign in"}
          </button>

          <button type="button" onClick={() => { setIsSignUp((value) => !value); setError(null); setMessage(null); }} className="w-full text-xs text-indigo-600 hover:text-indigo-800 font-semibold">
            {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
          </button>

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
            <LockKeyhole className="w-3 h-3" /> Secured by Supabase Auth
          </div>
        </form>
      </div>
    </main>
  );
};