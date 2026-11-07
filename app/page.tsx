"use client";

import React, { useState } from "react";
import { Chess } from "chess.js";
import { Navbar, NavTab } from "@/components/navigation/navbar";
import { AiBotsPlay } from "@/components/chess/ai-bots";
import { PassAndPlay } from "@/components/chess/pass-and-play";
import { PuzzleArena } from "@/components/puzzles/puzzle-arena";
import { OpeningExplorer } from "@/components/learn/opening-explorer";
import { VariantsPlay } from "@/components/chess/variants-play";
import { KnightsTour } from "@/components/chess/knights-tour";
import { BossMode } from "@/components/chess/boss-mode";
import { Board3D } from "@/components/chess/board-3d";

export default function Home() {
  const [activeTab, setActiveTab] = useState<NavTab>("bots");
  const [is3D, setIs3D] = useState(false);
  const [demoGame, setDemoGame] = useState<Chess>(new Chess());

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} is3D={is3D} setIs3D={setIs3D} />

      <main className="flex-1 flex flex-col py-6 px-3 sm:px-6">
        {is3D ? (
          <div className="flex flex-col items-center justify-center p-6 max-w-4xl mx-auto w-full">
            <div className="flex items-center justify-between w-full max-w-[600px] mb-4">
              <div>
                <h2 className="text-xl font-black text-white">Interactive 3D Chessboard</h2>
                <p className="text-xs text-slate-400">Orbit with mouse to view positions from any angle</p>
              </div>
              <button
                onClick={() => setIs3D(false)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                Return to 2D
              </button>
            </div>
            <Board3D game={demoGame} />
          </div>
        ) : (
          <>
            {activeTab === "bots" && <AiBotsPlay />}
            {activeTab === "pass" && <PassAndPlay />}
            {activeTab === "puzzles" && <PuzzleArena />}
            {activeTab === "openings" && <OpeningExplorer />}
            {activeTab === "variants" && <VariantsPlay />}
            {activeTab === "tour" && <KnightsTour />}
            {activeTab === "boss" && <BossMode />}
          </>
        )}
      </main>

      <footer className="w-full border-t border-slate-900 py-4 text-center text-xs text-slate-500">
        VibeChess &copy; {new Date().getFullYear()} &bull; Built with Next.js, Supabase, Go & Google AI Studio
      </footer>
    </div>
  );
}
