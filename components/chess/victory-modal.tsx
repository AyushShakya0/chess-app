"use client";

import React, { useEffect } from "react";
import { Play, RotateCcw, X, ArrowLeft, Trophy } from "lucide-react";
import { formatVictoryData, type GameOutcome } from "@/lib/chess/victory-types";

export interface VictoryModalProps {
  isOpen: boolean;
  outcome: GameOutcome;
  reason?: string | null;
  opponentName?: string;
  ratingChange?: string;
  onPlayAgain: () => void;
  onBackToLobby: () => void;
  onClose?: () => void;
}

/**
 * Sovereign Laurel Wreath SVG embracing the Gold Trophy
 * Strictly matching the Reference Victory Screen from Sovereign Mockups
 */
function LaurelWreathTrophy() {
  return (
    <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
      {/* Ambient Radial Golden Glow */}
      <div className="absolute inset-0 bg-[#d4a359]/20 rounded-full blur-2xl transform scale-125 pointer-events-none" />

      {/* Golden Laurel Wreath Branches */}
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 w-full h-full text-[#d4a359] drop-shadow-[0_0_12px_rgba(212,163,89,0.4)]"
      >
        <defs>
          <linearGradient id="laurelGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f0cf85" />
            <stop offset="50%" stopColor="#d4a359" />
            <stop offset="100%" stopColor="#9a6e27" />
          </linearGradient>
        </defs>

        {/* Left Laurel Branch */}
        <g stroke="url(#laurelGold)" strokeWidth="2.5" strokeLinecap="round" fill="url(#laurelGold)">
          <path d="M 45 155 C 30 110 40 60 85 30" fill="none" strokeWidth="2.5" />
          {/* Leaves */}
          <path d="M 43 145 C 32 140 28 130 35 125 C 42 120 45 135 43 145 Z" />
          <path d="M 40 125 C 28 120 25 110 33 105 C 41 100 43 115 40 125 Z" />
          <path d="M 38 105 C 26 98 25 86 35 82 C 45 78 44 94 38 105 Z" />
          <path d="M 42 85 C 32 75 34 62 45 60 C 56 58 51 75 42 85 Z" />
          <path d="M 52 65 C 45 52 52 40 64 42 C 76 44 65 58 52 65 Z" />
          <path d="M 68 48 C 65 34 76 24 88 30 C 98 36 84 46 68 48 Z" />
        </g>

        {/* Right Laurel Branch (Mirrored) */}
        <g stroke="url(#laurelGold)" strokeWidth="2.5" strokeLinecap="round" fill="url(#laurelGold)">
          <path d="M 155 155 C 170 110 160 60 115 30" fill="none" strokeWidth="2.5" />
          {/* Leaves */}
          <path d="M 157 145 C 168 140 172 130 165 125 C 158 120 155 135 157 145 Z" />
          <path d="M 160 125 C 172 120 175 110 167 105 C 159 100 157 115 160 125 Z" />
          <path d="M 162 105 C 174 98 175 86 165 82 C 155 78 156 94 162 105 Z" />
          <path d="M 158 85 C 168 75 166 62 155 60 C 144 58 149 75 158 85 Z" />
          <path d="M 148 65 C 155 52 148 40 136 42 C 124 44 135 58 148 65 Z" />
          <path d="M 132 48 C 135 34 124 24 112 30 C 102 36 116 46 132 48 Z" />
        </g>
      </svg>

      {/* Central Trophy Icon */}
      <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#d4a359] to-[#f0cf85] text-black flex items-center justify-center shadow-2xl shadow-[#d4a359]/50 border border-[#f0cf85]/40 transform hover:scale-105 transition-transform duration-300">
        <Trophy className="w-9 h-9 text-black fill-current" />
      </div>
    </div>
  );
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  outcome,
  reason,
  opponentName,
  ratingChange,
  onPlayAgain,
  onBackToLobby,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const { title, subtitle, isWin } = formatVictoryData(outcome, reason);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Game Result"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-lg bg-[#14171f] border border-[#252a36] rounded-3xl shadow-2xl p-8 sm:p-10 text-center overflow-hidden">
        {/* Close Button if dismissible */}
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-[#1c202a] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-28 bg-[#d4a359]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Center Laurel Wreath & Trophy Banner */}
        <div className="mb-6">
          <LaurelWreathTrophy />
        </div>

        {/* Title: You Won! / Defeat / Game Drawn */}
        <div className="space-y-1 mb-6">
          <h2
            className={`text-3xl sm:text-4xl font-black font-display tracking-tight ${
              isWin ? "text-white" : outcome === "loss" ? "text-slate-100" : "text-slate-200"
            }`}
          >
            {title}
          </h2>
          <p className="text-sm font-semibold text-slate-400 tracking-wide font-sans">
            {subtitle}
          </p>

          {opponentName && (
            <p className="text-xs text-slate-500 mt-1">
              vs <span className="text-slate-300 font-bold">{opponentName}</span>
            </p>
          )}

          {ratingChange && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-2 rounded-full bg-[#0d0f12] border border-[#252a36] text-xs font-mono font-bold">
              <span className="text-slate-400">Rating:</span>
              <span className={ratingChange.startsWith("+") ? "text-emerald-400" : "text-rose-400"}>
                {ratingChange}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons matching Reference Image */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={onPlayAgain}
            className="w-full sm:w-auto min-w-[150px] py-3 px-6 bg-gradient-to-r from-[#d4a359] to-[#e2b768] hover:from-[#e2b768] hover:to-[#f0cf85] text-black font-black rounded-xl text-xs shadow-lg shadow-[#d4a359]/20 transition-all flex items-center justify-center gap-2 font-display"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Play Again</span>
          </button>

          <button
            onClick={onBackToLobby}
            className="w-full sm:w-auto min-w-[150px] py-3 px-6 bg-[#0d0f12] hover:bg-[#1c202a] text-slate-300 hover:text-white border border-[#252a36] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Lobby</span>
          </button>
        </div>
      </div>
    </div>
  );
};
