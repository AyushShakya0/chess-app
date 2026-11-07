"use client";

import React, { useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "../chess/board";
import { BookOpen, GraduationCap, Compass, ArrowRight, Play, CheckCircle } from "lucide-react";
import { sound } from "@/lib/audio/sound";

export interface ChessOpening {
  name: string;
  eco: string;
  moves: string[];
  description: string;
  whiteWinRate: number;
  drawRate: number;
  blackWinRate: number;
}

export const OPENINGS_CATALOG: ChessOpening[] = [
  {
    name: "Sicilian Defense: Najdorf",
    eco: "B90",
    moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6"],
    description: "The sharpest and most popular response against 1.e4, beloved by Garry Kasparov and Bobby Fischer.",
    whiteWinRate: 38,
    drawRate: 34,
    blackWinRate: 28,
  },
  {
    name: "Ruy Lopez: Closed",
    eco: "C84",
    moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7"],
    description: "The Spanish Game—one of the oldest and most deeply analyzed openings in chess history.",
    whiteWinRate: 40,
    drawRate: 38,
    blackWinRate: 22,
  },
  {
    name: "Queen's Gambit Declined",
    eco: "D30",
    moves: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "Be7"],
    description: "A rock-solid classical defense where Black fortifies the central d5 square.",
    whiteWinRate: 39,
    drawRate: 40,
    blackWinRate: 21,
  },
  {
    name: "King's Indian Defense",
    eco: "E60",
    moves: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6"],
    description: "A hypermodern, counter-attacking system where Black allows White to occupy the center, then launches a ferocious kingside assault.",
    whiteWinRate: 41,
    drawRate: 32,
    blackWinRate: 27,
  },
  {
    name: "Caro-Kann Defense",
    eco: "B12",
    moves: ["e4", "c6", "d4", "d5", "e5", "Bf5"],
    description: "A resilient, fortress-like defense favored for its exceptionally clean pawn structures.",
    whiteWinRate: 37,
    drawRate: 41,
    blackWinRate: 22,
  },
  {
    name: "The London System",
    eco: "D02",
    moves: ["d4", "d5", "Bf4", "Nf6", "e3", "e6", "Nf3", "Bd6"],
    description: "A harmonious setup system for White requiring minimal theoretical memorization.",
    whiteWinRate: 40,
    drawRate: 36,
    blackWinRate: 24,
  },
];

export interface LearnLesson {
  id: string;
  title: string;
  category: "Beginner" | "Intermediate" | "Tactics";
  summary: string;
  points: string[];
}

export const LESSONS_CATALOG: LearnLesson[] = [
  {
    id: "l1",
    title: "The Golden Rules of the Opening",
    category: "Beginner",
    summary: "Three universal principles that will instantly elevate your opening play.",
    points: [
      "Control the center (e4, d4, e5, d5) with pawns to restrict enemy piece mobility.",
      "Develop knights before bishops—knights take longer to find their ideal outposts.",
      "Castle within the first 7-10 moves to safeguard your King and activate your rooks.",
    ],
  },
  {
    id: "l2",
    title: "Special Moves: Castling & En Passant",
    category: "Beginner",
    summary: "Master the unique rules that trip up beginner players.",
    points: [
      "Kingside (O-O) vs Queenside (O-O-O) Castling: King moves two squares toward the rook.",
      "Castling is illegal if the King has moved, the Rook has moved, or the King passes through check.",
      "En Passant: A pawn moving two squares can be captured diagonally by an enemy pawn on its first turn only.",
    ],
  },
  {
    id: "l3",
    title: "The 4 Tactical Motifs Every Player Must Know",
    category: "Tactics",
    summary: "Tactical combinations that win material in over 85% of club games.",
    points: [
      "The Fork: One piece (especially the Knight) attacks two enemy targets simultaneously.",
      "The Pin: A piece cannot move without exposing a more valuable piece behind it.",
      "The Skewer: An attack on a valuable piece that forces it to move, exposing a piece behind it.",
      "Discovered Attack: Moving one piece unveils an ambush attack from another piece behind it.",
    ],
  },
];

export const OpeningExplorer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"openings" | "academy">("openings");
  const [selectedOpening, setSelectedOpening] = useState<ChessOpening>(OPENINGS_CATALOG[0]);
  const [game, setGame] = useState<Chess>(new Chess());
  const [currentMoveIdx, setCurrentMoveIdx] = useState(0);

  // Load opening line onto board
  const loadOpening = (opening: ChessOpening) => {
    setSelectedOpening(opening);
    const newG = new Chess();
    for (const m of opening.moves) {
      try {
        newG.move(m);
      } catch {
        // Ignore
      }
    }
    setGame(newG);
    setCurrentMoveIdx(opening.moves.length);
    sound.playMove();
  };

  const resetToStart = () => {
    setGame(new Chess());
    setCurrentMoveIdx(0);
    sound.playMove();
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 max-w-7xl mx-auto w-full">
      {/* Tab Switcher */}
      <div className="flex flex-wrap items-center justify-between w-full bg-slate-800/80 border border-slate-700 rounded-2xl p-4 mb-6 shadow-xl backdrop-blur-md gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/20 border border-indigo-500/40 rounded-xl text-indigo-400">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Opening Explorer & Academy</h2>
            <p className="text-xs text-slate-400">Interactive grandmaster theory and beginner lessons</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/90 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setActiveTab("openings")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "openings" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <Compass className="w-4 h-4" />
            Opening Explorer
          </button>
          <button
            onClick={() => setActiveTab("academy")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "academy" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Learn to Play
          </button>
        </div>
      </div>

      {activeTab === "openings" ? (
        /* OPENING EXPLORER */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
          {/* Left: Board view */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="flex items-center justify-between w-full max-w-[600px] mb-2 px-1">
              <div>
                <span className="text-base font-bold text-white block">{selectedOpening.name}</span>
                <span className="text-xs font-mono text-emerald-400">ECO: {selectedOpening.eco}</span>
              </div>
              <button
                onClick={resetToStart}
                className="text-xs text-slate-400 hover:text-white bg-slate-800 px-3 py-1 rounded-lg border border-slate-700 transition-colors"
              >
                Reset Board
              </button>
            </div>

            <Chessboard game={game} orientation="white" interactive={false} />

            {/* Master Win Rates Bar */}
            <div className="w-full max-w-[600px] mt-4 bg-slate-800/80 border border-slate-700 rounded-xl p-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Master Database Win Rates
              </span>
              <div className="h-4 w-full rounded-full overflow-hidden flex font-mono text-[10px] font-black text-slate-950">
                <div
                  style={{ width: `${selectedOpening.whiteWinRate}%` }}
                  className="bg-slate-100 flex items-center justify-center"
                >
                  {selectedOpening.whiteWinRate}% White
                </div>
                <div
                  style={{ width: `${selectedOpening.drawRate}%` }}
                  className="bg-slate-400 flex items-center justify-center text-slate-800"
                >
                  {selectedOpening.drawRate}% Draw
                </div>
                <div
                  style={{ width: `${selectedOpening.blackWinRate}%` }}
                  className="bg-slate-900 flex items-center justify-center text-slate-200"
                >
                  {selectedOpening.blackWinRate}% Black
                </div>
              </div>
            </div>
          </div>

          {/* Right: Opening Catalog Selector */}
          <div className="lg:col-span-5 flex flex-col gap-3 w-full">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Popular Opening Books
            </span>
            <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
              {OPENINGS_CATALOG.map((op) => (
                <button
                  key={op.eco}
                  onClick={() => loadOpening(op)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedOpening.name === op.name
                      ? "bg-blue-600/20 border-blue-500 shadow-md ring-1 ring-blue-500"
                      : "bg-slate-800/60 border-slate-700 hover:bg-slate-850"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-white">{op.name}</span>
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-900 text-blue-400 border border-slate-700">
                      {op.eco}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2 mb-2">{op.description}</p>
                  <div className="flex flex-wrap gap-1 text-[11px] font-mono text-slate-400">
                    {op.moves.slice(0, 6).map((m, i) => (
                      <span key={i} className="bg-slate-900 px-1.5 py-0.5 rounded">
                        {m}
                      </span>
                    ))}
                    {op.moves.length > 6 && <span>...</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* LEARN TO PLAY ACADEMY */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {LESSONS_CATALOG.map((lesson) => (
            <div
              key={lesson.id}
              className="bg-slate-800/70 border border-slate-700 rounded-2xl p-6 shadow-xl flex flex-col justify-between"
            >
              <div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 inline-block mb-3">
                  {lesson.category}
                </span>
                <h3 className="text-lg font-bold text-white mb-2">{lesson.title}</h3>
                <p className="text-xs text-slate-300 mb-4">{lesson.summary}</p>

                <div className="space-y-2 mb-6">
                  {lesson.points.map((pt, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-colors border border-slate-600 flex items-center justify-center gap-2">
                <Play className="w-3.5 h-3.5" />
                Start Interactive Drill
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
