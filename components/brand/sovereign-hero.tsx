"use client";

import React from "react";
import Link from "next/link";
import { Play, ArrowDown, Users, TrendingUp, BookOpen, Crown, Sparkles } from "lucide-react";

export const SovereignHero: React.FC<{ onPlayNow?: () => void }> = ({ onPlayNow }) => {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-[#0d0f12] border border-[#252a36] shadow-2xl mb-8">
      {/* Background Ambient Glow & Subtle Chess Grid */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Amber / Gold Radial Lighting from top right */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#d4a359]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-[#d4a359]/5 rounded-full blur-2xl" />

        {/* Subtle Diagonal Perspective Grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #d4a359 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      <div className="relative z-10 px-6 sm:px-12 py-12 sm:py-16 max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
        {/* Left Column: Headline & Action */}
        <div className="flex-1 space-y-6 text-center md:text-left">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#d4a359]/10 border border-[#d4a359]/30 text-[#d4a359] text-xs font-bold shadow-sm">
            <Crown className="w-3.5 h-3.5" />
            <span>The Grandmaster Chess Experience</span>
          </div>

          {/* Headline matching Reference Image */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] font-display">
            Think. Move.{" "}
            <span className="text-[#d4a359] font-serif italic tracking-normal drop-shadow-sm">
              Win.
            </span>
          </h1>

          {/* Subtitle matching Reference Image */}
          <p className="text-sm sm:text-base text-slate-400 max-w-lg leading-relaxed">
            Play chess online, improve your skills, and be part of a global community with master-level bots, live tactical analytics, and seamless match play.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3.5 pt-2">
            {onPlayNow ? (
              <button
                onClick={onPlayNow}
                className="flex items-center gap-2.5 px-6 py-3 rounded-full bg-[#d4a359] hover:bg-[#e2b768] text-black font-black text-sm shadow-xl shadow-[#d4a359]/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Play className="w-4 h-4 fill-black text-black" />
                <span>Play Now</span>
              </button>
            ) : (
              <Link
                href="/bots"
                className="flex items-center gap-2.5 px-6 py-3 rounded-full bg-[#d4a359] hover:bg-[#e2b768] text-black font-black text-sm shadow-xl shadow-[#d4a359]/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Play className="w-4 h-4 fill-black text-black" />
                <span>Play Now</span>
              </Link>
            )}

            <Link
              href="/learn"
              className="flex items-center gap-2 px-5 py-3 rounded-full bg-[#14171f] hover:bg-[#1c202a] border border-[#252a36] hover:border-[#384152] text-slate-200 hover:text-white font-bold text-sm transition-all"
            >
              <span>Learn More</span>
              <ArrowDown className="w-3.5 h-3.5 text-[#d4a359]" />
            </Link>
          </div>
        </div>

        {/* Right Column: Visual Golden King Piece & Atmosphere */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 shrink-0 flex items-center justify-center">
          {/* Subtle Pedestal Reflection Circle */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-[#d4a359]/20 via-[#14171f] to-transparent border border-[#d4a359]/20 p-2 shadow-2xl flex items-center justify-center">
            {/* Inner Glow */}
            <div className="w-full h-full rounded-full bg-[#0d0f12] flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#d4a359]/15 to-transparent" />

              {/* Majestic Sovereign King Silhouette Vector */}
              <svg
                viewBox="0 0 100 120"
                className="w-40 h-48 drop-shadow-[0_15px_25px_rgba(212,163,89,0.35)]"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="kingGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFF2CC" />
                    <stop offset="35%" stopColor="#E2B768" />
                    <stop offset="70%" stopColor="#C8923B" />
                    <stop offset="100%" stopColor="#8C5C18" />
                  </linearGradient>
                  <linearGradient id="kingDarkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#252a36" />
                    <stop offset="50%" stopColor="#14171f" />
                    <stop offset="100%" stopColor="#0d0f12" />
                  </linearGradient>
                </defs>

                {/* King Cross Finial */}
                <path
                  d="M 50 10 L 50 24 M 43 17 L 57 17"
                  stroke="url(#kingGoldGrad)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Crown Dome & Arches */}
                <path
                  d="M 36 28 C 36 22, 64 22, 64 28 C 68 32, 68 40, 64 44 C 58 46, 42 46, 36 44 C 32 40, 32 32, 36 28 Z"
                  fill="url(#kingGoldGrad)"
                />

                {/* Crown Filigree & Jewel */}
                <circle cx="50" cy="34" r="3" fill="#0d0f12" />

                {/* Neck Collar */}
                <path
                  d="M 40 45 L 60 45 L 62 52 L 38 52 Z"
                  fill="url(#kingGoldGrad)"
                  opacity="0.9"
                />

                {/* Body Waist */}
                <path
                  d="M 38 53 C 44 65, 44 75, 34 90 L 66 90 C 56 75, 56 65, 62 53 Z"
                  fill="url(#kingGoldGrad)"
                />

                {/* Pedestal Base Base Ring */}
                <rect x="28" y="91" width="44" height="6" rx="3" fill="url(#kingGoldGrad)" />
                <path
                  d="M 22 98 C 22 98, 30 106, 50 106 C 70 106, 78 98, 78 98 L 78 108 L 22 108 Z"
                  fill="url(#kingGoldGrad)"
                />
                <rect x="18" y="108" width="64" height="6" rx="3" fill="url(#kingGoldGrad)" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Feature Badges matching Reference Image */}
      <div className="border-t border-[#252a36] bg-[#14171f]/80 backdrop-blur-md px-6 sm:px-12 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {/* Badge 1: Play Online */}
          <Link
            href="/online"
            className="flex items-center gap-3.5 p-2.5 rounded-xl hover:bg-[#1c202a] transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#d4a359]/15 border border-[#d4a359]/30 flex items-center justify-center text-[#d4a359] shrink-0 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white group-hover:text-[#d4a359] transition-colors">
                Play Online
              </h4>
              <p className="text-[11px] text-slate-400">With Players Worldwide</p>
            </div>
          </Link>

          {/* Badge 2: Track Your Progress */}
          <Link
            href="/profile"
            className="flex items-center gap-3.5 p-2.5 rounded-xl hover:bg-[#1c202a] transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                Track Your Progress
              </h4>
              <p className="text-[11px] text-slate-400">With Detailed Stats</p>
            </div>
          </Link>

          {/* Badge 3: Learn Chess */}
          <Link
            href="/learn"
            className="flex items-center gap-3.5 p-2.5 rounded-xl hover:bg-[#1c202a] transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                Learn Chess
              </h4>
              <p className="text-[11px] text-slate-400">With Expert Resources</p>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
};
