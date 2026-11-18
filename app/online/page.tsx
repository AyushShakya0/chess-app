"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/navigation/app-shell";
import {
  Swords,
  Zap,
  Flame,
  Clock,
  Play,
  ArrowRight,
  ShieldCheck,
  Trophy,
  Crown,
  Sliders,
  Users,
  ChevronDown,
  Layers,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/stores/auth-store";

const TIME_CONTROLS = [
  { id: "1+0", label: "1 min", type: "Bullet", icon: Zap, color: "text-amber-400" },
  { id: "3+0", label: "3 min", type: "Blitz", icon: Flame, color: "text-orange-400" },
  { id: "5+0", label: "5 min", type: "Blitz", icon: Flame, color: "text-emerald-400" },
  { id: "10+0", label: "10 min", type: "Rapid", icon: Clock, color: "text-blue-400" },
  { id: "15+10", label: "15|10", type: "Rapid", icon: Clock, color: "text-[#d4a359]" },
];

type LobbyFilter = "all" | "blitz" | "rapid" | "classical" | "custom";

interface LobbyMatch {
  id: string;
  name: string;
  timeControl: string;
  tcParam: string;
  type: string;
  category: "blitz" | "rapid" | "classical";
  playersCount: number;
  icon: React.FC<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  isTournament?: boolean;
}

const LOBBY_MATCHES: LobbyMatch[] = [
  {
    id: "blitz-arena",
    name: "Blitz Arena",
    timeControl: "3 min • Rated",
    tcParam: "3+0",
    type: "Blitz",
    category: "blitz",
    playersCount: 124,
    icon: Zap,
    iconBg: "bg-amber-500/15 border-amber-500/30",
    iconColor: "text-amber-400",
  },
  {
    id: "rapid-match",
    name: "Rapid Match",
    timeControl: "10 min • Rated",
    tcParam: "10+0",
    type: "Rapid",
    category: "rapid",
    playersCount: 89,
    icon: Clock,
    iconBg: "bg-blue-500/15 border-blue-500/30",
    iconColor: "text-blue-400",
  },
  {
    id: "casual-game",
    name: "Casual Game",
    timeControl: "Any Time • Unrated",
    tcParam: "10+0",
    type: "Casual",
    category: "rapid",
    playersCount: 42,
    icon: Trophy,
    iconBg: "bg-[#d4a359]/15 border-[#d4a359]/30",
    iconColor: "text-[#d4a359]",
  },
  {
    id: "daily-tournament",
    name: "Daily Tournament",
    timeControl: "Starts in 1h 30m",
    tcParam: "5+0",
    type: "Tournament",
    category: "classical",
    playersCount: 256,
    icon: Crown,
    iconBg: "bg-purple-500/15 border-purple-500/30",
    iconColor: "text-purple-400",
    isTournament: true,
  },
];

export default function OnlineLobbyPage() {
  const router = useRouter();
  const [auth] = useAuth();
  const [activeFilter, setActiveFilter] = useState<LobbyFilter>("all");
  const [selectedTc, setSelectedTc] = useState("5+0");
  const [selectedColor, setSelectedColor] = useState<"white" | "black" | "random">("white");
  const [playerName, setPlayerName] = useState(
    auth.profile?.username || auth.user?.email?.split("@")[0] || ""
  );
  const [joinCode, setJoinCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateRoom = async (overrideTc?: string) => {
    setIsCreating(true);
    setError(null);

    const tc = overrideTc || selectedTc;

    try {
      const res = await fetch("/api/room/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timeControl: tc,
          playerName: playerName.trim() || undefined,
          colorPreference: selectedColor,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.roomId) {
        throw new Error(data.error || "Failed to create match room");
      }

      if (typeof window !== "undefined") {
        sessionStorage.setItem(`room_token_${data.roomId}`, data.playerToken);
      }

      router.push(`/play/${data.roomId}`);
    } catch (err: any) {
      setError(err?.message || "Failed to create room");
      setIsCreating(false);
    }
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    let code = joinCode.trim();
    if (!code) return;

    if (code.includes("/play/")) {
      const parts = code.split("/play/");
      code = parts[1].replace(/[^a-zA-Z0-9_-]/g, "");
    }

    router.push(`/play/${code}`);
  };

  const filteredMatches = LOBBY_MATCHES.filter((m) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "custom") return false;
    return m.category === activeFilter;
  });

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-8">
        {/* Main 2-Column Game Lobby matching Reference Image */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left Navigation Sidebar */}
          <div className="md:col-span-3 bg-[#14171f] border border-[#252a36] rounded-2xl p-3 flex md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible shrink-0 shadow-xl">
            <button
              onClick={() => setActiveFilter("all")}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all w-full text-left whitespace-nowrap ${
                activeFilter === "all"
                  ? "bg-[#d4a359] text-black shadow-md shadow-[#d4a359]/25 font-black"
                  : "text-slate-300 hover:text-white hover:bg-[#1c202a]"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>All Games</span>
            </button>

            <button
              onClick={() => setActiveFilter("blitz")}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all w-full text-left whitespace-nowrap ${
                activeFilter === "blitz"
                  ? "bg-[#d4a359] text-black shadow-md shadow-[#d4a359]/25 font-black"
                  : "text-slate-300 hover:text-white hover:bg-[#1c202a]"
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Blitz</span>
            </button>

            <button
              onClick={() => setActiveFilter("rapid")}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all w-full text-left whitespace-nowrap ${
                activeFilter === "rapid"
                  ? "bg-[#d4a359] text-black shadow-md shadow-[#d4a359]/25 font-black"
                  : "text-slate-300 hover:text-white hover:bg-[#1c202a]"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Rapid</span>
            </button>

            <button
              onClick={() => setActiveFilter("classical")}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all w-full text-left whitespace-nowrap ${
                activeFilter === "classical"
                  ? "bg-[#d4a359] text-black shadow-md shadow-[#d4a359]/25 font-black"
                  : "text-slate-300 hover:text-white hover:bg-[#1c202a]"
              }`}
            >
              <Crown className="w-4 h-4" />
              <span>Classical</span>
            </button>

            <button
              onClick={() => setActiveFilter("custom")}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all w-full text-left whitespace-nowrap ${
                activeFilter === "custom"
                  ? "bg-[#d4a359] text-black shadow-md shadow-[#d4a359]/25 font-black"
                  : "text-slate-300 hover:text-white hover:bg-[#1c202a]"
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Custom Game</span>
            </button>
          </div>

          {/* Right Main Arena Panel */}
          <div className="md:col-span-9 space-y-6">
            {/* Game Lobby List Card */}
            {activeFilter !== "custom" && (
              <div className="bg-[#14171f] border border-[#252a36] rounded-2xl p-5 sm:p-6 shadow-xl">
                {/* Header Row */}
                <div className="flex items-center justify-between pb-5 border-b border-[#252a36] mb-5">
                  <h1 className="text-xl sm:text-2xl font-bold text-white font-display">
                    Game Lobby
                  </h1>

                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0d0f12] border border-[#252a36] rounded-xl text-xs text-slate-300 font-medium cursor-pointer hover:border-slate-600 transition-colors">
                    <span className="text-slate-400">Sort By:</span>
                    <span className="font-bold text-white">Popular</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
                  </div>
                </div>

                {/* Match Cards List */}
                <div className="space-y-3">
                  {filteredMatches.map((match) => {
                    const Icon = match.icon;
                    return (
                      <div
                        key={match.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#0d0f12] hover:bg-[#181c26] border border-[#252a36] hover:border-[#384152] rounded-2xl transition-all group"
                      >
                        <div className="flex items-center gap-3.5">
                          <div
                            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${match.iconBg}`}
                          >
                            <Icon className={`w-5 h-5 ${match.iconColor}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-white group-hover:text-[#d4a359] transition-colors">
                                {match.name}
                              </h3>
                              {match.isTournament && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                  Prize Arena
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">
                              {match.timeControl}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-5">
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                            <Users className="w-4 h-4 text-slate-500" />
                            <span>{match.playersCount}</span>
                          </div>

                          <button
                            onClick={() => handleCreateRoom(match.tcParam)}
                            disabled={isCreating}
                            className="px-6 py-2 bg-[#d4a359] hover:bg-[#e2b768] text-black font-black text-xs rounded-xl shadow-md shadow-[#d4a359]/20 transition-all disabled:opacity-50"
                          >
                            {match.isTournament ? "View" : isCreating ? "Loading..." : "Join"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Custom Game Creation & Join (visible when custom tab or below) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Create Custom Match */}
              <div className="lg:col-span-7 bg-[#14171f] border border-[#252a36] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between">
                <div>
                  <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2 font-display">
                    <Play className="w-4 h-4 text-[#d4a359]" />
                    Create Custom Match
                  </h2>

                  {/* Time Control Picker */}
                  <div className="mb-5">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Time Control
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {TIME_CONTROLS.map((tc) => {
                        const Icon = tc.icon;
                        const isSelected = selectedTc === tc.id;
                        return (
                          <button
                            key={tc.id}
                            type="button"
                            onClick={() => setSelectedTc(tc.id)}
                            className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${
                              isSelected
                                ? "bg-[#d4a359] border-[#d4a359] text-black shadow-lg shadow-[#d4a359]/25 font-black"
                                : "bg-[#0d0f12] border-[#252a36] text-slate-300 hover:border-slate-600"
                            }`}
                          >
                            <Icon
                              className={`w-4 h-4 mb-1 ${
                                isSelected ? "text-black" : tc.color
                              }`}
                            />
                            <span className="font-bold text-xs">{tc.label}</span>
                            <span
                              className={`text-[10px] ${
                                isSelected ? "text-black/80 font-semibold" : "text-slate-400"
                              }`}
                            >
                              {tc.type}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Play As Color */}
                  <div className="mb-5">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Play As
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedColor("white")}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                          selectedColor === "white"
                            ? "bg-slate-100 text-slate-950 border-white shadow"
                            : "bg-[#0d0f12] border-[#252a36] text-slate-400 hover:text-white"
                        }`}
                      >
                        <span className="w-3 h-3 rounded-full bg-white border border-slate-400" />
                        White
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedColor("random")}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                          selectedColor === "random"
                            ? "bg-[#d4a359] text-black border-[#d4a359] shadow font-black"
                            : "bg-[#0d0f12] border-[#252a36] text-slate-400 hover:text-white"
                        }`}
                      >
                        <span className="w-3 h-3 rounded-full bg-gradient-to-r from-white to-[#0d0f12] border border-[#252a36]" />
                        Random
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedColor("black")}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                          selectedColor === "black"
                            ? "bg-[#1c202a] text-white border-slate-500 shadow"
                            : "bg-[#0d0f12] border-[#252a36] text-slate-400 hover:text-white"
                        }`}
                      >
                        <span className="w-3 h-3 rounded-full bg-[#0d0f12] border border-slate-600" />
                        Black
                      </button>
                    </div>
                  </div>

                  {/* Player Display Name */}
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="e.g. Grandmaster"
                      maxLength={30}
                      className="w-full bg-[#0d0f12] border border-[#252a36] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#d4a359] transition-colors"
                    />
                  </div>

                  {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
                </div>

                <button
                  onClick={() => handleCreateRoom()}
                  disabled={isCreating}
                  className="w-full py-3 bg-[#d4a359] hover:bg-[#e2b768] text-black font-black rounded-xl text-xs sm:text-sm shadow-lg shadow-[#d4a359]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Swords className="w-4 h-4" />
                  {isCreating ? "Generating Room..." : "Create Match Room & Get Link"}
                </button>
              </div>

              {/* Join Existing Match & Engine Security */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                <div className="bg-[#14171f] border border-[#252a36] rounded-2xl p-5 sm:p-6 shadow-xl">
                  <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2 font-display">
                    <ArrowRight className="w-4 h-4 text-[#d4a359]" />
                    Join Existing Match
                  </h2>
                  <p className="text-xs text-slate-400 mb-4">
                    Enter a room code or paste an invite link to enter the game.
                  </p>

                  <form onSubmit={handleJoinRoom} className="space-y-3">
                    <input
                      type="text"
                      required
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                      placeholder="e.g. 7f9a12c8 or /play/7f9a12c8"
                      className="w-full bg-[#0d0f12] border border-[#252a36] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-[#d4a359] transition-colors"
                    />
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-[#1c202a] hover:bg-[#252a36] text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 border border-[#252a36]"
                    >
                      Join Game
                    </button>
                  </form>
                </div>

                {/* Authoritative Match Engine Card */}
                <div className="bg-[#14171f]/60 border border-[#252a36] rounded-2xl p-5 text-xs space-y-3">
                  <div className="flex items-center gap-2 font-bold text-slate-200">
                    <ShieldCheck className="w-4 h-4 text-[#d4a359]" />
                    Authoritative Match Engine
                  </div>
                  <ul className="space-y-2 text-slate-400 text-[11px]">
                    <li className="flex items-start gap-1.5">
                      <span className="text-[#d4a359] font-bold">✓</span>
                      <span><strong>Server-Validated:</strong> Moves checked against chess.js rules on the server.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-[#d4a359] font-bold">✓</span>
                      <span><strong>Monotonic Clocks:</strong> Clocks run server-side to prevent client time manipulation.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-[#d4a359] font-bold">✓</span>
                      <span><strong>Spectator Broadcast:</strong> Real-time SSE streaming for observers and live match sync.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
