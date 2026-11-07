"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Check, Crown, X, KeyRound } from "lucide-react";
import confetti from "canvas-confetti";
import { sound } from "@/lib/audio/sound";

interface PromoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVipUnlocked?: () => void;
}

export const PromoModal: React.FC<PromoModalProps> = ({ isOpen, onClose, onVipUnlocked }) => {
  const [code, setCode] = useState("");
  const [isVip, setIsVip] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const unlocked = localStorage.getItem("chess_vip_unlocked") === "true";
      setIsVip(unlocked);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRedeem = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanCode = code.trim().toLowerCase();

    if (cleanCode === "chess") {
      if (typeof window !== "undefined") {
        localStorage.setItem("chess_vip_unlocked", "true");
      }
      setIsVip(true);
      setSuccess("🎉 Code Accepted! You have unlocked VIP Lifetime Access for FREE!");
      sound.playVictory();
      confetti({ particleCount: 160, spread: 80, origin: { y: 0.5 } });
      if (onVipUnlocked) onVipUnlocked();
    } else {
      setError("Invalid promo code. (Hint: Try code 'chess')");
      sound.playDefeat();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400">
            <Crown className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white">Grandmaster VIP Pass</h2>
            <p className="text-xs sm:text-sm text-slate-400">Unlock every premium feature across the platform</p>
          </div>
        </div>

        {/* VIP Perks */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 mb-6 space-y-2.5">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-200">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Unlimited Daily Tactical Puzzles & Puzzle Rush</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-200">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Full Stockfish Deep Engine Analysis & Move Accuracy</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-200">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Celebrity AI Bots (Hikaru, Magnus, Hustler) with Gemini Trash-Talk</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-200">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Full Opening Explorer & 3D Interactive Board Mode</span>
          </div>
        </div>

        {/* VIP Status or Redeem Input */}
        {isVip ? (
          <div className="bg-emerald-500/20 border border-emerald-500/60 rounded-xl p-4 text-center">
            <div className="inline-flex items-center gap-2 text-emerald-400 font-bold text-base mb-1">
              <Sparkles className="w-5 h-5" />
              VIP Status Active
            </div>
            <p className="text-xs text-emerald-300">
              You currently enjoy 100% full unlocked access to all puzzles, bots, and analysis!
            </p>
          </div>
        ) : (
          <form onSubmit={handleRedeem} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Have a Promo Code?
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter promo code (e.g. chess)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 pl-10 text-white font-mono text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {error && <p className="text-xs text-red-400 font-medium">{error}</p>}
            {success && <p className="text-xs text-emerald-400 font-medium">{success}</p>}

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black rounded-xl shadow-lg transition-all transform active:scale-98 text-sm"
            >
              Redeem Code & Unlock VIP
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

