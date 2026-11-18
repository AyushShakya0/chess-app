import { AppShell } from "@/components/navigation/app-shell";
import { QuickPlayGrid } from "@/components/dashboard/quick-play-grid";
import { OpenChallengesFeed } from "@/components/dashboard/open-challenges-feed";
import { DailyPuzzleWidget } from "@/components/dashboard/daily-puzzle-widget";
import { PlayerOverviewWidget } from "@/components/dashboard/player-overview-widget";
import { RecentActivityStream } from "@/components/dashboard/recent-activity-stream";
import Link from "next/link";
import { Bot, Swords, Sparkles, Globe } from "lucide-react";

export default function HomeDashboardPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        {/* Top Minimal Greeting Bar (Leaving top empty/clean as requested) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white font-display tracking-tight flex items-center gap-2">
              <span>Sovereign Dashboard</span>
              <span className="text-[#d4a359] text-sm font-sans font-normal border border-[#d4a359]/30 bg-[#d4a359]/10 px-2 py-0.5 rounded-full">
                Arena Live
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Authoritative matchmaking, live challenges, and tactical analytics.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#14171f] border border-[#252a36] text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <Globe className="w-3.5 h-3.5 text-emerald-400 ml-1" />
              <span className="font-mono font-bold text-white">12,842</span>
              <span className="text-slate-500">online</span>
            </div>
          </div>
        </div>

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
