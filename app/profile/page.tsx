"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/navigation/app-shell";
import {
  Trophy,
  Crown,
  Flame,
  Award,
  TrendingUp,
  Clock,
  Swords,
  Shield,
  Edit3,
  Calendar,
  CheckCircle,
  XCircle,
  MinusCircle,
  ExternalLink,
  ChevronRight,
  Zap,
} from "lucide-react";
import { useAuth } from "@/lib/stores/auth-store";
import { SettingsModal } from "@/components/chess/settings-modal";

type ProfileTab = "games" | "stats" | "achievements";
type StatsTab = "overview" | "ratings" | "performance" | "games";

interface RecentMatch {
  id: string;
  opponent: string;
  result: "won" | "lost" | "draw";
  timeControl: string;
  type: string;
  date: string;
  eloChange: string;
}

const RECENT_GAMES: RecentMatch[] = [
  {
    id: "g-1",
    opponent: "ChessMaster",
    result: "won",
    timeControl: "10 min • Rated",
    type: "Rapid",
    date: "Oct 26, 2025",
    eloChange: "+14",
  },
  {
    id: "g-2",
    opponent: "Bot_Hikaru",
    result: "won",
    timeControl: "3 min • Rated",
    type: "Blitz",
    date: "Oct 25, 2025",
    eloChange: "+10",
  },
  {
    id: "g-3",
    opponent: "Bot_Magnus",
    result: "draw",
    timeControl: "10 min • Rated",
    type: "Rapid",
    date: "Oct 24, 2025",
    eloChange: "+2",
  },
  {
    id: "g-4",
    opponent: "Grandmaster_Apex",
    result: "lost",
    timeControl: "5 min • Rated",
    type: "Blitz",
    date: "Oct 22, 2025",
    eloChange: "-8",
  },
];

export default function ProfilePage() {
  const [auth] = useAuth();
  const [profileTab, setProfileTab] = useState<ProfileTab>("games");
  const [statsTab, setStatsTab] = useState<StatsTab>("overview");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const username =
    auth.profile?.username ||
    (typeof window !== "undefined"
      ? localStorage.getItem("sovereign_player_name") || "AyushShakya"
      : "AyushShakya");

  const rating = 1642;
  const gamesPlayed = 287;
  const winRate = 62;

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-8 space-y-8">
        {/* Top Grid: Profile Card (left) & Statistics Card (right) matching reference design */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Middle-Center: Player Profile Card */}
          <div className="lg:col-span-6 bg-[#14171f] border border-[#252a36] rounded-2xl p-6 shadow-xl space-y-6">
            {/* Header with Avatar & Meta */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {/* Avatar Circle with Online indicator */}
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#d4a359] to-[#f0cf85] text-black flex items-center justify-center font-black text-2xl shadow-lg shadow-[#d4a359]/20 border-2 border-[#1c202a]">
                    {username.slice(0, 2).toUpperCase()}
                  </div>
                  <span
                    className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#14171f]"
                    title="Online Now"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-white font-display">{username}</h1>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                    <span className="text-sm">🇳🇵</span>
                    <span className="font-medium text-slate-300">Nepal</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsSettingsOpen(true)}
                className="px-4 py-1.5 bg-[#1c202a] hover:bg-[#252a36] border border-[#252a36] text-xs font-bold text-slate-200 hover:text-white rounded-xl transition-colors self-start sm:self-center flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#d4a359]" />
                Edit Profile
              </button>
            </div>

            {/* 3 Metric Badges matching Reference Image */}
            <div className="grid grid-cols-3 gap-3">
              {/* Rating */}
              <div className="bg-[#0d0f12] border border-[#252a36] rounded-2xl p-3.5 text-center flex flex-col items-center justify-center">
                <Crown className="w-5 h-5 text-[#d4a359] mb-1" />
                <span className="text-xl font-black text-white font-display tracking-tight">
                  {rating}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Rating
                </span>
              </div>

              {/* Games */}
              <div className="bg-[#0d0f12] border border-[#252a36] rounded-2xl p-3.5 text-center flex flex-col items-center justify-center">
                <Trophy className="w-5 h-5 text-[#d4a359] mb-1" />
                <span className="text-xl font-black text-white font-display tracking-tight">
                  {gamesPlayed}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Games
                </span>
              </div>

              {/* Win Rate */}
              <div className="bg-[#0d0f12] border border-[#252a36] rounded-2xl p-3.5 text-center flex flex-col items-center justify-center">
                <Award className="w-5 h-5 text-emerald-400 mb-1" />
                <span className="text-xl font-black text-emerald-400 font-display tracking-tight">
                  {winRate}%
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Win Rate
                </span>
              </div>
            </div>

            {/* Sub-Navigation Tabs */}
            <div className="border-b border-[#252a36] flex gap-6 text-xs font-bold">
              <button
                onClick={() => setProfileTab("games")}
                className={`pb-2 transition-all relative ${
                  profileTab === "games"
                    ? "text-[#d4a359] font-black"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Games
                {profileTab === "games" && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#d4a359] rounded-full" />
                )}
              </button>

              <button
                onClick={() => setProfileTab("stats")}
                className={`pb-2 transition-all relative ${
                  profileTab === "stats"
                    ? "text-[#d4a359] font-black"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Stats
                {profileTab === "stats" && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#d4a359] rounded-full" />
                )}
              </button>

              <button
                onClick={() => setProfileTab("achievements")}
                className={`pb-2 transition-all relative ${
                  profileTab === "achievements"
                    ? "text-[#d4a359] font-black"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Achievements
                {profileTab === "achievements" && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#d4a359] rounded-full" />
                )}
              </button>
            </div>

            {/* TAB CONTENT: Games */}
            {profileTab === "games" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">Recent Games</span>
                  <Link
                    href="/online"
                    className="text-[#d4a359] hover:underline font-bold flex items-center gap-1"
                  >
                    View All →
                  </Link>
                </div>

                <div className="space-y-2">
                  {RECENT_GAMES.map((game) => (
                    <div
                      key={game.id}
                      className="flex items-center justify-between p-3 bg-[#0d0f12] hover:bg-[#181c26] border border-[#252a36] rounded-xl transition-all"
                    >
                      <div className="flex items-center gap-3">
                        {game.result === "won" && (
                          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                            +
                          </div>
                        )}
                        {game.result === "lost" && (
                          <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs shrink-0">
                            -
                          </div>
                        )}
                        {game.result === "draw" && (
                          <div className="w-6 h-6 rounded-full bg-slate-500/20 text-slate-400 flex items-center justify-center font-bold text-xs shrink-0">
                            =
                          </div>
                        )}

                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span
                              className={
                                game.result === "won"
                                  ? "text-emerald-400"
                                  : game.result === "lost"
                                  ? "text-rose-400"
                                  : "text-slate-400"
                              }
                            >
                              {game.result === "won" ? "Won" : game.result === "lost" ? "Lost" : "Draw"}
                            </span>
                            <span>vs</span>
                            <span className="text-slate-200">{game.opponent}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {game.timeControl}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] font-bold text-slate-400 block">
                          {game.date}
                        </span>
                        <span
                          className={`text-[10px] font-bold font-mono ${
                            game.eloChange.startsWith("+")
                              ? "text-emerald-400"
                              : "text-rose-400"
                          }`}
                        >
                          {game.eloChange}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: Stats */}
            {profileTab === "stats" && (
              <div className="space-y-3 text-xs text-slate-300">
                <div className="bg-[#0d0f12] border border-[#252a36] rounded-xl p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Best Blitz ELO</span>
                    <span className="font-bold text-white">1680</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Best Rapid ELO</span>
                    <span className="font-bold text-white">1715</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Puzzle Rush Streak</span>
                    <span className="font-bold text-[#d4a359]">28 solved</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Win with White</span>
                    <span className="font-bold text-white">65% (112 wins)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Win with Black</span>
                    <span className="font-bold text-white">58% (66 wins)</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: Achievements */}
            {profileTab === "achievements" && (
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-[#0d0f12] border border-[#252a36] rounded-xl flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#d4a359]/20 text-[#d4a359] flex items-center justify-center shrink-0">
                    <Crown className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Sovereign Knight</span>
                    <span className="text-[10px] text-slate-400">100+ Games</span>
                  </div>
                </div>

                <div className="p-3 bg-[#0d0f12] border border-[#252a36] rounded-xl flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Speed Demon</span>
                    <span className="text-[10px] text-slate-400">Sub-1 min mate</span>
                  </div>
                </div>

                <div className="p-3 bg-[#0d0f12] border border-[#252a36] rounded-xl flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Hikaru Slayer</span>
                    <span className="text-[10px] text-slate-400">Defeated Bot</span>
                  </div>
                </div>

                <div className="p-3 bg-[#0d0f12] border border-[#252a36] rounded-xl flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Vision Master</span>
                    <span className="text-[10px] text-slate-400">90%+ Blindfold</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Middle-Right: Statistics Card */}
          <div className="lg:col-span-6 bg-[#14171f] border border-[#252a36] rounded-2xl p-6 shadow-xl space-y-6">
            {/* Header with Sub-Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#252a36]">
              <h2 className="text-xl font-bold text-white font-display">Statistics</h2>

              <div className="flex gap-4 text-xs font-bold">
                <button
                  onClick={() => setStatsTab("overview")}
                  className={`pb-1 transition-all relative ${
                    statsTab === "overview"
                      ? "text-[#d4a359] font-black"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Overview
                  {statsTab === "overview" && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#d4a359] rounded-full" />
                  )}
                </button>
                <button
                  onClick={() => setStatsTab("ratings")}
                  className={`pb-1 transition-all relative ${
                    statsTab === "ratings"
                      ? "text-[#d4a359] font-black"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Ratings
                </button>
                <button
                  onClick={() => setStatsTab("performance")}
                  className={`pb-1 transition-all relative ${
                    statsTab === "performance"
                      ? "text-[#d4a359] font-black"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Performance
                </button>
                <button
                  onClick={() => setStatsTab("games")}
                  className={`pb-1 transition-all relative ${
                    statsTab === "games"
                      ? "text-[#d4a359] font-black"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Games
                </button>
              </div>
            </div>

            {/* 2 Side-by-Side Visual Cards matching Reference Image */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1: Rating Progression & Trend Line Chart */}
              <div className="bg-[#0d0f12] border border-[#252a36] rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Rating
                    </span>
                    <span className="text-[10px] text-slate-500">Last 30 Days</span>
                  </div>

                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-2xl font-black text-white font-display tracking-tight">
                      {rating}
                    </span>
                    <span className="text-xs font-bold text-emerald-400 flex items-center">
                      ▲ +24
                    </span>
                  </div>
                </div>

                {/* SVG Trend Chart matching reference design */}
                <div className="relative h-28 w-full">
                  <svg
                    viewBox="0 0 240 100"
                    className="w-full h-full overflow-visible"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Background grid lines */}
                    <line x1="0" y1="20" x2="240" y2="20" stroke="#1c202a" strokeDasharray="3 3" />
                    <line x1="0" y1="50" x2="240" y2="50" stroke="#1c202a" strokeDasharray="3 3" />
                    <line x1="0" y1="80" x2="240" y2="80" stroke="#1c202a" strokeDasharray="3 3" />

                    {/* Area fill */}
                    <path
                      d="M 10,75 Q 50,72 80,55 T 140,42 T 190,32 L 230,18 L 230,95 L 10,95 Z"
                      fill="url(#chartGradient)"
                    />

                    {/* Gradient Stroke Line */}
                    <path
                      d="M 10,75 Q 50,72 80,55 T 140,42 T 190,32 L 230,18"
                      fill="none"
                      stroke="#2dd4bf"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />

                    {/* Glowing Data Points */}
                    <circle cx="10" cy="75" r="3" fill="#2dd4bf" />
                    <circle cx="80" cy="55" r="3" fill="#2dd4bf" />
                    <circle cx="140" cy="42" r="3" fill="#2dd4bf" />
                    <circle cx="190" cy="32" r="3" fill="#2dd4bf" />
                    <circle cx="230" cy="18" r="4" fill="#ffffff" stroke="#2dd4bf" strokeWidth="2" />
                  </svg>

                  {/* Y-Axis Labels */}
                  <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[9px] font-mono text-slate-500 pointer-events-none">
                    <span>1600</span>
                    <span>1300</span>
                    <span>1000</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Games Played Donut Chart */}
              <div className="bg-[#0d0f12] border border-[#252a36] rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Games Played
                    </span>
                    <span className="text-[10px] text-slate-500">Career</span>
                  </div>

                  <div className="mb-3">
                    <span className="text-2xl font-black text-white font-display tracking-tight">
                      {gamesPlayed}
                    </span>
                  </div>
                </div>

                {/* Donut Chart with Legend */}
                <div className="flex items-center gap-4 py-2">
                  <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      {/* Background Circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke="#1c202a"
                        strokeWidth="12"
                      />
                      {/* Win (62%) - Emerald */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke="#22c55e"
                        strokeWidth="12"
                        strokeDasharray="238.76"
                        strokeDashoffset="90.72"
                      />
                      {/* Draw (12%) - Gold */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke="#eab308"
                        strokeWidth="12"
                        strokeDasharray="28.65 210.11"
                        strokeDashoffset="90.72"
                      />
                      {/* Loss (26%) - Rose */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke="#ef4444"
                        strokeWidth="12"
                        strokeDasharray="62.07 176.69"
                        strokeDashoffset="62.07"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-xs font-black text-white">{winRate}%</span>
                      <span className="text-[8px] text-slate-400 uppercase font-bold">Win</span>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="space-y-1.5 text-[11px] font-bold">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-slate-300">Win</span>
                      <span className="text-emerald-400 font-mono ml-auto">62%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                      <span className="text-slate-300">Draw</span>
                      <span className="text-yellow-400 font-mono ml-auto">12%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <span className="text-slate-300">Loss</span>
                      <span className="text-rose-400 font-mono ml-auto">26%</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#252a36] flex items-center justify-between text-[11px] text-slate-400">
                  <span>Accuracy Avg:</span>
                  <span className="font-bold text-[#d4a359]">88.4%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </AppShell>
  );
}
