"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Clock, Flame, Sliders, Bot, Play, Loader2, Sparkles } from "lucide-react";
import { QUICK_PLAY_OPTIONS, QuickPlayOption } from "./quick-play-types";
import { useAuth } from "@/lib/stores/auth-store";

export const QuickPlayGrid: React.FC = () => {
  const router = useRouter();
  const [auth] = useAuth();
  const [loadingTc, setLoadingTc] = useState<string | null>(null);

  const handleQuickPlay = async (option: QuickPlayOption) => {
    setLoadingTc(option.id);
    try {
      const playerName =
        auth.profile?.username || auth.user?.email?.split("@")[0] || "AyushShakya";

      const res = await fetch("/api/room/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timeControl: option.timeControl,
          playerName,
          colorPreference: "random",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.roomId) {
        throw new Error(data.error || "Failed to create match");
      }

      if (typeof window !== "undefined") {
        sessionStorage.setItem(`room_token_${data.roomId}`, data.playerToken);
      }

      router.push(`/play/${data.roomId}`);
    } catch (err: any) {
      alert(err?.message || "Failed to start match");
      setLoadingTc(null);
    }
  };

  return (
    <div className="bg-[#14171f] border border-[#252a36] rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Play className="w-5 h-5 text-[#d4a359]" />
          <h2 className="text-lg font-bold text-white font-display">Quick Matchmaking</h2>
        </div>

        <button
          onClick={() => router.push("/bots")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1c202a] hover:bg-[#252a36] border border-[#252a36] text-slate-300 hover:text-white text-xs font-bold transition-colors"
        >
          <Bot className="w-3.5 h-3.5 text-[#d4a359]" />
          <span>vs Computer</span>
        </button>
      </div>

      {/* Grid of Time Controls */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {QUICK_PLAY_OPTIONS.map((opt) => {
          const isLoading = loadingTc === opt.id;
          const isBlitz = opt.type === "blitz";
          const isRapid = opt.type === "rapid";

          return (
            <button
              key={opt.id}
              onClick={() => handleQuickPlay(opt)}
              disabled={Boolean(loadingTc)}
              className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden group flex flex-col justify-between min-h-[92px] ${
                opt.isPopular
                  ? "bg-gradient-to-b from-[#1c202a] to-[#0d0f12] border-[#d4a359]/50 hover:border-[#d4a359] shadow-lg shadow-[#d4a359]/10"
                  : "bg-[#0d0f12] border-[#252a36] hover:border-slate-600 hover:bg-[#181c26]"
              } disabled:opacity-50`}
            >
              {opt.isPopular && (
                <div className="absolute top-2 right-2 text-[9px] font-black uppercase tracking-wider text-[#d4a359] bg-[#d4a359]/15 px-1.5 py-0.5 rounded-full border border-[#d4a359]/30">
                  Popular
                </div>
              )}

              <div className="flex items-center gap-2 text-slate-400 group-hover:text-white transition-colors">
                {isBlitz ? (
                  <Flame className="w-4 h-4 text-amber-400" />
                ) : isRapid ? (
                  <Clock className="w-4 h-4 text-blue-400" />
                ) : (
                  <Zap className="w-4 h-4 text-emerald-400" />
                )}
                <span className="text-xs font-bold uppercase tracking-wider">{opt.label}</span>
              </div>

              <div className="flex items-baseline justify-between mt-2">
                <span className="text-xl font-black text-white font-display group-hover:text-[#d4a359] transition-colors">
                  {opt.name}
                </span>

                {isLoading ? (
                  <Loader2 className="w-4 h-4 text-[#d4a359] animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#d4a359] transition-transform group-hover:translate-x-0.5" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
