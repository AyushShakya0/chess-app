"use client";

import React from "react";
import Link from "next/link";
import { Zap, Trophy, ArrowRight, Sparkles } from "lucide-react";

export const DailyPuzzleWidget: React.FC = () => {
  return (
    <div className="bg-[#14171f] border border-[#252a36] rounded-2xl p-5 shadow-xl space-y-3 relative overflow-hidden group">
      {/* Background Accent Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4a359]/5 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Zap className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Daily Puzzle
          </span>
        </div>

        <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30 font-mono">
          +12 ELO
        </span>
      </div>

      <div>
        <h3 className="text-sm font-bold text-white font-display group-hover:text-[#d4a359] transition-colors">
          Deflection into Back-Rank Mate
        </h3>
        <p className="text-[11px] text-slate-400 mt-0.5">
          White to move and force checkmate in 2 moves.
        </p>
      </div>

      {/* Mini Board Representation */}
      <div className="bg-[#0d0f12] border border-[#252a36] rounded-xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">♟️</span>
          <div className="text-[11px]">
            <span className="font-bold text-white block">Puzzle #482</span>
            <span className="text-slate-500">1450 ELO &bull; Rated</span>
          </div>
        </div>

        <Link
          href="/puzzles"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#d4a359] hover:bg-[#e2b768] text-black font-black text-xs rounded-xl shadow-md shadow-[#d4a359]/20 transition-all hover:scale-105"
        >
          <span>Solve</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
