"use client";

import React, { useState } from "react";
import { X, User, Lock, Mail, AlertCircle, LogOut } from "lucide-react";
import { useAuth } from "@/lib/stores/auth-store";
import { SovereignKnightIcon } from "@/components/brand/sovereign-logo";
import { signInWithGoogle } from "@/lib/appwrite/auth";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "signin" | "signup";
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = "signin" }) => {
  const [auth, { signInWithEmail, signUpWithEmail, signOut }] = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    const res = await signInWithGoogle();
    if (res.error) {
      setError(res.error);
      setLoading(false);
    }
  };

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-md bg-[#14171f] border border-[#252a36] rounded-3xl shadow-2xl p-6 sm:p-8">
        <button
          onClick={onClose}
          aria-label="Close authentication modal"
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-[#1c202a] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {auth.user ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#d4a359] to-[#f0cf85] text-black mx-auto flex items-center justify-center font-black text-2xl font-display shadow-lg">
              {auth.profile?.username ? auth.profile.username.slice(0, 2).toUpperCase() : "AS"}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white font-display">
                {auth.profile?.username || auth.user.email?.split("@")[0] || "Sovereign Grandmaster"}
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{auth.user.email}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-[#0d0f12] p-3 rounded-2xl border border-[#252a36] text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase tracking-wider font-bold">Blitz Rating</span>
                <span className="font-bold text-[#d4a359] text-base font-mono">{auth.profile?.elo_blitz || 1200}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase tracking-wider font-bold">Tactics ELO</span>
                <span className="font-bold text-emerald-400 text-base font-mono">{auth.profile?.elo_puzzles || 1200}</span>
              </div>
            </div>

            <button
              onClick={() => {
                signOut();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#1c202a] hover:bg-rose-950/40 hover:text-rose-300 text-slate-300 rounded-xl text-xs font-bold transition-all border border-[#252a36]"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        ) : (
          <div>
            {/* Sovereign Knight Logo at top matching reference image */}
            <div className="flex flex-col items-center justify-center text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-[#1c202a] border border-[#2c3240] flex items-center justify-center mb-3 shadow-lg">
                <SovereignKnightIcon className="w-10 h-10" glow />
              </div>
              <h2 className="text-2xl font-black text-white font-display tracking-tight">
                {mode === "signin" ? "Welcome Back" : "Create Account"}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {mode === "signin"
                  ? "Sign in to continue your sovereign chess journey"
                  : "Join the next generation grandmaster community"}
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="flex gap-1.5 p-1 bg-[#0d0f12] rounded-xl border border-[#252a36] mb-4">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setError(null);
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  mode === "signin"
                    ? "bg-[#d4a359] text-black font-black shadow-md font-display"
                    : "text-slate-400 hover:text-white"
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
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  mode === "signup"
                    ? "bg-[#d4a359] text-black font-black shadow-md font-display"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Sign Up
              </button>
            </div>

            {!auth.isConfigured && (
              <div className="mb-4 p-3 bg-[#d4a359]/10 border border-[#d4a359]/30 rounded-xl text-[#f0cf85] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#d4a359]" />
                <span>Guest mode active. Sign in enables cloud sync across devices.</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === "signup" && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-display">
                    Username
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. Grandmaster"
                      className="w-full bg-[#0d0f12] border border-[#252a36] rounded-xl px-3.5 py-2.5 pl-10 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#d4a359]"
                    />
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-display">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="player@sovereignchess.app"
                    className="w-full bg-[#0d0f12] border border-[#252a36] rounded-xl px-3.5 py-2.5 pl-10 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#d4a359]"
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-display">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#0d0f12] border border-[#252a36] rounded-xl px-3.5 py-2.5 pl-10 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#d4a359]"
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                </div>
              </div>

              {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-[#d4a359] to-[#e2b768] hover:from-[#e2b768] hover:to-[#f0cf85] text-black font-black rounded-xl text-xs shadow-lg shadow-[#d4a359]/20 transition-all disabled:opacity-50 font-display"
              >
                {loading ? "Processing..." : mode === "signin" ? "Sign In" : "Create Sovereign Account"}
              </button>

              {mode === "signin" && (
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => alert("Password reset link will be sent to your email.")}
                    className="text-[11px] text-slate-400 hover:text-[#d4a359] transition-colors"
                  >
                    Forgot your password?
                  </button>
                </div>
              )}

              {/* Social Login Divider matching Reference Image */}
              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-[#252a36] w-full" />
                <span className="bg-[#14171f] px-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider relative">
                  or
                </span>
              </div>

              {/* Social Providers matching Reference Image */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  aria-label="Sign in with Google"
                  className="py-2 px-3 rounded-xl bg-[#0d0f12] hover:bg-[#1c202a] border border-[#252a36] text-slate-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span className="font-black text-rose-400">G</span>
                </button>
                <button
                  type="button"
                  onClick={() => alert("GitHub sign-in will be enabled with your OAuth credentials.")}
                  aria-label="Sign in with GitHub"
                  className="py-2 px-3 rounded-xl bg-[#0d0f12] hover:bg-[#1c202a] border border-[#252a36] text-slate-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span className="font-black text-slate-200">GitHub</span>
                </button>
                <button
                  type="button"
                  onClick={() => alert("Apple sign-in will be enabled with your OAuth credentials.")}
                  aria-label="Sign in with Apple"
                  className="py-2 px-3 rounded-xl bg-[#0d0f12] hover:bg-[#1c202a] border border-[#252a36] text-slate-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span className="font-black text-slate-200"> Apple</span>
                </button>
              </div>

              {/* Bottom Switch Link matching Reference Image */}
              <div className="text-center pt-2 text-xs text-slate-400">
                {mode === "signin" ? (
                  <span>
                    Don&apos;t have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("signup")}
                      className="text-[#d4a359] hover:underline font-bold"
                    >
                      Sign Up
                    </button>
                  </span>
                ) : (
                  <span>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("signin")}
                      className="text-[#d4a359] hover:underline font-bold"
                    >
                      Sign In
                    </button>
                  </span>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
