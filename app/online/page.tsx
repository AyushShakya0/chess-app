"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/navigation/app-shell";
import { Swords, Zap, Flame, Clock, Play, ArrowRight, ShieldCheck, Copy, Check } from "lucide-react";
import { useAuth } from "@/lib/stores/auth-store";

const TIME_CONTROLS = [
  { id: "1+0", label: "1 min", type: "Bullet", icon: Zap, color: "text-amber-400" },
  { id: "3+0", label: "3 min", type: "Blitz", icon: Flame, color: "text-orange-400" },
  { id: "5+0", label: "5 min", type: "Blitz", icon: Flame, color: "text-emerald-400" },
  { id: "10+0", label: "10 min", type: "Rapid", icon: Clock, color: "text-blue-400" },
  { id: "15+10", label: "15|10", type: "Rapid", icon: Clock, color: "text-indigo-400" },
];

export default function OnlineLobbyPage() {
  const router = useRouter();
  const [auth] = useAuth();
  const [selectedTc, setSelectedTc] = useState("5+0");
  const [selectedColor, setSelectedColor] = useState<"white" | "black" | "random">("white");
  const [playerName, setPlayerName] = useState(
    auth.profile?.username || auth.user?.email?.split("@")[0] || ""
  );
  const [joinCode, setJoinCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateRoom = async () => {
    setIsCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/room/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timeControl: selectedTc,
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

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header Banner */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-xs font-bold mb-3">
            <Swords className="w-3.5 h-3.5" />
            Authoritative Multiplayer Arena
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
            Live Online Chess
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            Challenge players worldwide with server-authoritative move validation, tamper-proof clocks, and instant shareable room links.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Create Custom Match */}
          <div className="md:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Play className="w-4 h-4 text-emerald-400" />
                Create Match Room
              </h2>

              {/* Time Control Picker */}
              <div className="mb-5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Select Time Control
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
                            ? "bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/25"
                            : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                        }`}
                      >
                        <Icon className={`w-4 h-4 mb-1 ${isSelected ? "text-white" : tc.color}`} />
                        <span className="font-bold text-xs">{tc.label}</span>
                        <span className="text-[10px] text-slate-400">{tc.type}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Preference */}
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
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
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
                        ? "bg-blue-600 text-white border-blue-400 shadow"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-gradient-to-r from-white to-slate-900 border border-slate-400" />
                    Random
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedColor("black")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      selectedColor === "black"
                        ? "bg-indigo-600 text-white border-indigo-400 shadow"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-slate-900 border border-slate-700" />
                    Black
                  </button>
                </div>
              </div>

              {/* Player Name */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Your Display Name
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Grandmaster"
                  maxLength={30}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
            </div>

            <button
              onClick={handleCreateRoom}
              disabled={isCreating}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-xl text-xs sm:text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Swords className="w-4 h-4" />
              {isCreating ? "Generating Room..." : "Create Match Room & Get Link"}
            </button>
          </div>

          {/* Right Column: Join via Code & Fair Play Badges */}
          <div className="md:col-span-5 flex flex-col gap-6">
            {/* Join Room Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-blue-400" />
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 border border-slate-700"
                >
                  Join Game
                </button>
              </form>
            </div>

            {/* Fair Play & Technology Card */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 text-xs space-y-3">
              <div className="flex items-center gap-2 font-bold text-slate-200">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Authoritative Match Engine
              </div>
              <ul className="space-y-2 text-slate-400 text-[11px]">
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Server-Validated:</strong> Moves checked against chess.js rules on the server.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Monotonic Clocks:</strong> Clocks run server-side to prevent client time manipulation.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Spectator Broadcast:</strong> Real-time SSE streaming for observers and match chat.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
