"use client";

import React, { useState } from "react";
import { X, User, Lock, Mail, Sparkles, AlertCircle, LogOut } from "lucide-react";
import { useAuth } from "@/lib/stores/auth-store";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [auth, { signInWithEmail, signUpWithEmail, signOut }] = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "signin") {
        const res = await signInWithEmail(email, password);
        if (res.error) {
          setError(res.error);
        } else {
          onClose();
        }
      } else {
        if (!username.trim()) {
          setError("Please choose a username.");
          setLoading(false);
          return;
        }
        const res = await signUpWithEmail(email, password, username.trim());
        if (res.error) {
          setError(res.error);
        } else {
          onClose();
        }
      }
    } catch (err: any) {
      setError(err?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Account Authentication"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8">
        <button
          onClick={onClose}
          aria-label="Close authentication modal"
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {auth.user ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400 mx-auto flex items-center justify-center">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {auth.profile?.username || auth.user.email?.split("@")[0] || "Chess Grandmaster"}
              </h2>
              <p className="text-xs text-slate-400">{auth.user.email}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 block">Blitz ELO</span>
                <span className="font-bold text-emerald-400 text-sm">{auth.profile?.elo_blitz || 1200}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Puzzles ELO</span>
                <span className="font-bold text-amber-400 text-sm">{auth.profile?.elo_puzzles || 1200}</span>
              </div>
            </div>

            <button
              onClick={() => {
                signOut();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-700"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setError(null);
                  }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    mode === "signin" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                  }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    mode === "signup" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Create Account
                </button>
              </div>
            </div>

            {!auth.isConfigured && (
              <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Local guest mode active. Connecting Supabase credentials enables cloud sync.</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === "signup" && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Username
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Grandmaster"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 pl-10 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="player@princhess.app"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 pl-10 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 pl-10 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                </div>
              </div>

              {error && <p className="text-xs text-red-400 font-medium">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-md transition-all disabled:opacity-50"
              >
                {loading ? "Processing..." : mode === "signin" ? "Sign In" : "Sign Up"}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 text-slate-400 hover:text-white text-xs font-semibold"
              >
                Play as Guest
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
