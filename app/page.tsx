import { AppShell } from "@/components/navigation/app-shell";
import { HeroBanner } from "@/components/dashboard/hero-banner";
import { QuickPlayGrid } from "@/components/dashboard/quick-play-grid";
import { OpenChallengesFeed } from "@/components/dashboard/open-challenges-feed";
import { DailyPuzzleWidget } from "@/components/dashboard/daily-puzzle-widget";
import { PlayerOverviewWidget } from "@/components/dashboard/player-overview-widget";
import { RecentActivityStream } from "@/components/dashboard/recent-activity-stream";
import Link from "next/link";
import { Bot, Swords, Sparkles, Globe, Eye } from "lucide-react";

export default function HomeDashboardPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        {/* Sovereign Think. Move. Win. Hero Banner from Mockup */}
        <HeroBanner />

        {/* 12-Column Responsive Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Action Column (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Quick Matchmaking Matrix */}
            <QuickPlayGrid />

            {/* Real-time Open Challenges Feed (Broadcasts across all dashboards) */}
            <OpenChallengesFeed />

            {/* Recent Match Activity Stream */}
            <RecentActivityStream />
          </div>

          {/* Right Sidebar Widgets Column (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Player Stats & Overview Widget */}
            <PlayerOverviewWidget />

            {/* Daily Tactical Puzzle Widget */}
            <DailyPuzzleWidget />

            {/* Board Vision & Square Trainer Promotion Card */}
            <div className="bg-[#14171f] border border-[#252a36] rounded-2xl p-5 shadow-xl space-y-3 relative overflow-hidden group">
              <div className="flex items-center gap-2 text-[#d4a359]">
                <Eye className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Vision & Notation Trainer
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white font-display group-hover:text-[#d4a359] transition-colors">
                  Learn Chessboard Square Names
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Train your mind to play through algebraic annotation without looking at the pieces.
                </p>
              </div>

              <Link
                href="/vision"
                className="w-full py-2.5 bg-[#0d0f12] hover:bg-[#1c202a] text-white border border-[#252a36] text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all group-hover:border-[#d4a359]/40"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#d4a359]" />
                <span>Train Square Vision</span>
              </Link>
            </div>

            {/* Play AI Bot Arena Promo Card */}
            <div className="bg-gradient-to-br from-[#14171f] to-[#0d0f12] border border-[#252a36] rounded-2xl p-5 shadow-xl space-y-3 relative overflow-hidden group">
              <div className="flex items-center gap-2 text-[#d4a359]">
                <Bot className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Grandmaster Bot Arena
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white font-display group-hover:text-[#d4a359] transition-colors">
                  Play Against Magnus & Hikaru
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Real-time Gemini trash talk banter, adaptive ELOs from 250 to 2850.
                </p>
              </div>

              <Link
                href="/bots"
                className="w-full py-2.5 bg-[#1c202a] hover:bg-[#252a36] text-white border border-[#252a36] text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all group-hover:border-[#d4a359]/40"
              >
                <Swords className="w-3.5 h-3.5 text-[#d4a359]" />
                <span>Enter Bot Arena</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
