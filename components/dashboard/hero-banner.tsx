"use client";

import React from "react";
import Link from "next/link";
import { Play, ArrowDown, Globe, TrendingUp, BookOpen, Crown, Sparkles } from "lucide-react";

export const HeroBanner: React.FC = () => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0d0f12] via-[#14171f] to-[#1c202a] border border-[#252a36] shadow-2xl p-6 sm:p-10 mb-6 group">
      {/* Cinematic Golden Glow Ambient Orbs */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#d4a359]/10 rounded-full blur-3xl pointer-events-none group-hover:bg-[#d4a359]/15 transition-all duration-700" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[#d4a359]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Decorative Chess King Silhouette Background */}
      <div className="absolute right-4 bottom-2 opacity-5 pointer-events-none select-none text-white hidden md:block">
        <Crown className="w-72 h-72 text-[#d4a359]" />
      </div>

      <div className="relative z-10 max-w-2xl space-y-5">
        {/* Platform Status Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1c202a]/80 border border-[#252a36] text-[11px] font-bold text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-400">Sovereign Chess Suite</span>
          <span className="text-[#d4a359]">v2.5</span>
        </div>

        {/* Signature Headline from Reference Mockup */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white font-display tracking-tight leading-none">
          Think. Move. <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d4a359] to-[#f0cf85]">Win.</span>
        </h1>

        {/* Subtitle from Reference Mockup */}
        <p className="text-sm sm:text-base text-slate-400 max-w-lg font-sans leading-relaxed">
          Play chess online, improve your skills, and be part of a global grandmaster community.
        </p>

        {/* Action Buttons matching Reference Mockup */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link
            href="/online"
            className="py-3 px-6 bg-gradient-to-r from-[#d4a359] to-[#e2b768] hover:from-[#e2b768] hover:to-[#f0cf85] text-black font-black rounded-xl text-xs sm:text-sm shadow-xl shadow-[#d4a359]/20 transition-all flex items-center gap-2 font-display transform hover:scale-[1.02]"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Play Now</span>
          </Link>

          <Link
            href="/learn"
            className="py-3 px-6 bg-[#0d0f12]/80 hover:bg-[#1c202a] text-slate-200 hover:text-white border border-[#252a36] hover:border-[#d4a359]/40 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2"
          >
            <span>Learn More</span>
            <ArrowDown className="w-3.5 h-3.5 text-[#d4a359]" />
          </Link>
        </div>

        {/* 3 Value Pillars matching Reference Mockup */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-[#252a36]/60">
          <Link
            href="/online"
            className="flex items-center gap-3 p-2.5 rounded-xl bg-[#0d0f12]/40 hover:bg-[#0d0f12] border border-[#252a36]/50 hover:border-[#d4a359]/30 transition-all group/item"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white group-hover/item:text-[#d4a359] transition-colors">
                Play Online
              </h4>
              <p className="text-[10px] text-slate-500">With players worldwide</p>
            </div>
          </Link>

          <Link
            href="/profile#stats"
            className="flex items-center gap-3 p-2.5 rounded-xl bg-[#0d0f12]/40 hover:bg-[#0d0f12] border border-[#252a36]/50 hover:border-[#d4a359]/30 transition-all group/item"
          >
            <div className="w-9 h-9 rounded-lg bg-[#d4a359]/10 border border-[#d4a359]/20 flex items-center justify-center text-[#d4a359] shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white group-hover/item:text-[#d4a359] transition-colors">
                Track Progress
              </h4>
              <p className="text-[10px] text-slate-500">With detailed stats</p>
            </div>
          </Link>

          <Link
            href="/learn"
            className="flex items-center gap-3 p-2.5 rounded-xl bg-[#0d0f12]/40 hover:bg-[#0d0f12] border border-[#252a36]/50 hover:border-[#d4a359]/30 transition-all group/item"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white group-hover/item:text-[#d4a359] transition-colors">
                Learn Chess
              </h4>
              <p className="text-[10px] text-slate-500">With expert courses</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};
