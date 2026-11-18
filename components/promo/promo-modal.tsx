"use client";

import React, { useState } from "react";
import { Sparkles, Check, Crown, X, KeyRound } from "lucide-react";
import confetti from "canvas-confetti";
import { sound } from "@/lib/audio/sound";
import { validatePromoCode } from "@/lib/promo";

interface PromoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVipUnlocked?: () => void;
}

export const PromoModal: React.FC<PromoModalProps> = ({ isOpen, onClose, onVipUnlocked }) => {
  const [code, setCode] = useState("");
  const [isVip, setIsVip] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("chess_vip_unlocked") === "true";
    }
    return false;
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/vip/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        if (typeof window !== "undefined") {
          localStorage.setItem("chess_vip_unlocked", "true");
        }
        setIsVip(true);
        setSuccess(data.message || "🎉 Code Accepted! You have unlocked Sovereign VIP Lifetime Access!");
        sound.playVictory();
        confetti({ particleCount: 160, spread: 80, origin: { y: 0.5 } });
        if (onVipUnlocked) onVipUnlocked();
      } else {
        setError(data.message || data.error || "Invalid promo code.");
        sound.playDefeat();
      }
    } catch {
      // Fallback for offline/standalone execution
      const result = validatePromoCode(code);
      if (result.valid) {
        if (typeof window !== "undefined") {
          localStorage.setItem("chess_vip_unlocked", "true");
        }
        setIsVip(true);
        setSuccess(result.message || "🎉 VIP Access Unlocked!");
        sound.playVictory();
        confetti({ particleCount: 160, spread: 80, origin: { y: 0.5 } });
        if (onVipUnlocked) onVipUnlocked();
      } else {
        setError(result.message || "Invalid promo code.");
        sound.playDefeat();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#14171f] border border-[#252a36] rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-[#1c202a] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 bg-[#d4a359]/15 border border-[#d4a359]/30 rounded-2xl text-[#d4a359] shadow-inner">
            <Crown className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-display">Sovereign VIP Pass</h2>
            <p className="text-xs sm:text-sm text-slate-400">Unlock every grandmaster feature across the platform</p>
          </div>
        </div>

        {/* VIP Perks */}
        <div className="bg-[#0d0f12] border border-[#252a36] rounded-2xl p-4 mb-6 space-y-2.5">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-200">
            <Check className="w-4 h-4 text-[#d4a359] shrink-0" />
            <span>Unlimited Daily Tactical Puzzles & Puzzle Rush</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-200">
            <Check className="w-4 h-4 text-[#d4a359] shrink-0" />
            <span>Full Stockfish Deep Engine Analysis & Move Accuracy</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-200">
            <Check className="w-4 h-4 text-[#d4a359] shrink-0" />
            <span>Celebrity AI Personas (Hikaru, Magnus, Hustler) with Trash-Talk</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-200">
            <Check className="w-4 h-4 text-[#d4a359] shrink-0" />
            <span>Full Opening Explorer & 3D Interactive Board Mode</span>
          </div>
        </div>

        {/* VIP Status or Redeem Input */}
        {isVip ? (
          <div className="bg-[#d4a359]/15 border border-[#d4a359]/40 rounded-2xl p-4 text-center">
            <div className="inline-flex items-center gap-2 text-[#f0cf85] font-bold text-base mb-1 font-display">
              <Sparkles className="w-5 h-5 text-[#d4a359]" />
              Sovereign VIP Active
            </div>
            <p className="text-xs text-slate-300">
              You currently enjoy 100% full unlocked access to all puzzles, bots, courses, and engine tools!
            </p>
          </div>
        ) : (
          <form onSubmit={handleRedeem} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 font-display">
                Have a Promo Code?
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter promo code (e.g. chess)"
                  className="w-full bg-[#0d0f12] border border-[#252a36] rounded-xl px-4 py-3 pl-10 text-white font-mono text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#d4a359]"
                />
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
            {success && <p className="text-xs text-emerald-400 font-medium">{success}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-[#d4a359] to-[#e2b768] hover:from-[#e2b768] hover:to-[#f0cf85] text-black font-black rounded-xl shadow-lg shadow-[#d4a359]/20 transition-all font-display text-sm disabled:opacity-60"
            >
              {isSubmitting ? "Verifying Code..." : "Redeem Code & Unlock VIP"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
