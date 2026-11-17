"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import { Chess } from "chess.js";
import { Loader2, X } from "lucide-react";
import { useActiveGame } from "@/lib/stores/active-game-store";

const DynamicBoard3D = dynamic(
  () => import("@/components/chess/board-3d").then((mod) => mod.Board3D),
  {
    ssr: false,
    loading: () => (
      <div className="w-full max-w-[600px] h-[520px] flex flex-col items-center justify-center bg-slate-900/80 rounded-2xl border border-slate-800">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-2" />
        <span className="text-xs text-slate-400">Loading Three.js 3D View...</span>
      </div>
    ),
  }
);

export const Board3DModal: React.FC = () => {
  const [activeGame, { toggle3D }] = useActiveGame();

  const gameInstance = useMemo(() => {
    try {
      const c = new Chess();
      if (activeGame.pgn) {
        c.loadPgn(activeGame.pgn);
      } else if (activeGame.fen) {
        c.load(activeGame.fen);
      }
      return c;
    } catch {
      return new Chess();
    }
  }, [activeGame.fen, activeGame.pgn]);

  if (!activeGame.is3DOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="3D Chessboard View"
    >
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-4 sm:p-6 flex flex-col items-center max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between w-full max-w-[640px] mb-3">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white">Interactive 3D Chessboard</h2>
            <p className="text-xs text-slate-400">
              Live position from active match &bull; Orbit, zoom, and inspect from any angle
            </p>
          </div>
          <button
            onClick={() => toggle3D(false)}
            aria-label="Close 3D View"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-700"
          >
            <X className="w-4 h-4" />
            <span>Return to 2D</span>
          </button>
        </div>

        <DynamicBoard3D game={gameInstance} />
      </div>
    </div>
  );
};
