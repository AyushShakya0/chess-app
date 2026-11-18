"use client";

import React from "react";
import Link from "next/link";
import { Crown, Trophy, TrendingUp, ChevronRight, Award } from "lucide-react";
import { useAuth } from "@/lib/stores/auth-store";

export const PlayerOverviewWidget: React.FC = () => {
  const [auth] = useAuth();

  const username =
    auth.profile?.username || auth.user?.email?.split("@")[0] || "AyushShakya";

  const userInitials = username.slice(0, 2).toUpperCase() || "AS";

  const rapidElo = auth.profile?.elo_rapid || 1642;
  const blitzElo = auth.profile?.elo_blitz || 1580;
  const puzzleElo = auth.profile?.elo_puzzles || 1720;

  return (
    <div className="bg-[#14171f] border border-[#252a36] rounded-2xl p-5 shadow-xl space-y-4">
      {/* Player Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#d4a359] to-[#f0cf85] text-black flex items-center justify-center font-black text-lg shadow-md shadow-[#d4a359]/20 border border-white/20">
            {userInitials}
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-white font-display truncate max-w-[120px]">
                {username}
              </h3>
              <span className="text-xs">🇳🇵</span>
            </div>
            <span className="text-[10px] font-semibold text-slate-400">
              Sovereign Member
            </span>
          </div>
        </div>

        <Link
          href="/profile"
          className="p-1.5 rounded-xl bg-[#0d0f12] hover:bg-[#1c202a] border border-[#252a36] text-slate-400 hover:text-white transition-colors"
          title="View full profile"
        >
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Ratings Strip */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[#0d0f12] border border-[#252a36] rounded-xl p-2.5 text-center">
          <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Rapid</span>
          <span className="text-sm font-black text-white font-mono">{rapidElo}</span>
        </div>

        <div className="bg-[#0d0f12] border border-[#252a36] rounded-xl p-2.5 text-center">
          <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Blitz</span>
          <span className="text-sm font-black text-[#d4a359] font-mono">{blitzElo}</span>
        </div>

        <div className="bg-[#0d0f12] border border-[#252a36] rounded-xl p-2.5 text-center">
          <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Puzzles</span>
          <span className="text-sm font-black text-emerald-400 font-mono">{puzzleElo}</span>
        </div>
      </div>

      {/* Win Rate Meter */}
      <div className="bg-[#0d0f12] border border-[#252a36] rounded-xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-slate-300">Win Rate</span>
        </div>
        <div className="flex items-center gap-1.5 font-bold">
          <span className="text-xs text-emerald-400 font-mono">62%</span>
          <span className="text-[10px] text-slate-500">(178W / 287G)</span>
        </div>
      </div>
    </div>
  );
};
