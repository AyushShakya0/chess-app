"use client";

import React, { useState, useEffect } from "react";
import { Chess, Square } from "chess.js";
import { Chessboard, BoardTheme } from "../chess/board";
import {
  BookOpen,
  GraduationCap,
  Compass,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Zap,
  Lightbulb,
  GitBranch,
} from "lucide-react";
import { sound } from "@/lib/audio/sound";
import confetti from "canvas-confetti";

export interface OpeningMoveIdea {
  san: string;
  concept: string;
}

export interface OpeningVariation {
  id: string;
  name: string;
  eco: string;
  playerSide: "white" | "black";
  moves: OpeningMoveIdea[];
  description: string;
  whiteWinRate: number;
  drawRate: number;
  blackWinRate: number;
  variations?: { name: string; line: string[] }[];
}

export const OPENINGS_DATA: OpeningVariation[] = [
  {
    id: "sicilian-najdorf",
    name: "Sicilian Defense: Najdorf",
    eco: "B90",
    playerSide: "black",
    description: "The sharpest weapon against 1.e4, beloved by Garry Kasparov and Bobby Fischer. Black fights for central control asymmetrically.",
    whiteWinRate: 38,
    drawRate: 34,
    blackWinRate: 28,
    variations: [
      { name: "Najdorf 5...a6", line: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6"] },
      { name: "Dragon 5...g6", line: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "g6"] },
      { name: "Classical 5...Nc6", line: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "Nc6"] },
    ],
    moves: [
      { san: "e4", concept: "White claims the center and opens diagonals for Queen and light-squared Bishop." },
      { san: "c5", concept: "The Sicilian! Black clamps down on d4 to prevent White from creating an unchallenged pawn center." },
      { san: "Nf3", concept: "White develops the King's knight toward the center, directly preparing to strike d4." },
      { san: "d6", concept: "Black guards e5 and c5, creating an outpost for the future knight on f6." },
      { san: "d4", concept: "White opens the center to activate pieces and accelerate kingside development." },
      { san: "cxd4", concept: "Black trades a flank pawn for White's central d-pawn—giving Black a long-term central pawn majority." },
      { san: "Nxd4", concept: "White recaptures centrally with the knight on an aggressive central outpost." },
      { san: "Nf6", concept: "Black develops with tempo, immediately attacking White's undefended e4 pawn." },
      { san: "Nc3", concept: "White develops the Queen's knight to naturally defend the e4 pawn." },
      { san: "a6", concept: "The signature Najdorf move! Controls b5, preventing pesky knight or bishop checks and preparing ...b5 expansions." },
    ],
  },
  {
    id: "ruy-lopez",
    name: "Ruy Lopez: Spanish Game",
    eco: "C84",
    playerSide: "white",
    description: "One of the deepest and most analyzed openings in chess history. White applies subtle indirect pressure to Black's e5 pawn.",
    whiteWinRate: 40,
    drawRate: 38,
    blackWinRate: 22,
    variations: [
      { name: "Closed Defense", line: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7"] },
      { name: "Berlin Defense", line: ["e4", "e5", "Nf3", "Nc6", "Bb5", "Nf6", "O-O", "Nxe4"] },
      { name: "Exchange Variation", line: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Bxc6", "dxc6"] },
    ],
    moves: [
      { san: "e4", concept: "White seizes the center and opens lines for development." },
      { san: "e5", concept: "Black mirrors White, establishing an equal share of central territory." },
      { san: "Nf3", concept: "Develops with an immediate attack on Black's undefended e5 pawn." },
      { san: "Nc6", concept: "Black develops the knight to securely defend e5." },
      { san: "Bb5", concept: "The Ruy Lopez! White pins/pressures the knight defending e5 and prepares kingside castling." },
      { san: "a6", concept: "Morphy's Defense: Black immediately puts the question to White's bishop." },
      { san: "Ba4", concept: "White preserves the bishop along the diagonal while maintaining long-term pressure." },
      { san: "Nf6", concept: "Black develops kingside and attacks White's e4 pawn." },
      { san: "O-O", concept: "White castles into safety, ready to safeguard the King and place the rook on e1." },
      { san: "Be7", concept: "Black prepares castling and neutralizes future pins along the e-file." },
    ],
  },
  {
    id: "queens-gambit",
    name: "Queen's Gambit",
    eco: "D30",
    playerSide: "white",
    description: "White sacrifices a flank c-pawn to gain total central supremacy. A foundational pillar of classical grandmaster play.",
    whiteWinRate: 41,
    drawRate: 39,
    blackWinRate: 20,
    variations: [
      { name: "Declined (QGD)", line: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "Be7"] },
      { name: "Slav Defense", line: ["d4", "d5", "c4", "c6", "Nf3", "Nf6", "Nc3", "dxc4"] },
      { name: "Accepted (QGA)", line: ["d4", "d5", "c4", "dxc4", "Nf3", "Nf6", "e3"] },
    ],
    moves: [
      { san: "d4", concept: "White stakes a claim in the center with a pawn securely defended by the Queen." },
      { san: "d5", concept: "Black contests the center directly, preventing e4." },
      { san: "c4", concept: "The Queen's Gambit! White offers the c-pawn to deflect Black's central d-pawn." },
      { san: "e6", concept: "The Queen's Gambit Declined: Black firmly reinforces d5, prioritizing a rock-solid center." },
      { san: "Nc3", concept: "White develops pressure against the d5 square and prepares central e4." },
      { san: "Nf6", concept: "Black develops toward the center and strengthens defense of d5." },
      { san: "Bg5", concept: "White pins Black's knight to the Queen, undermining Black's central defense." },
      { san: "Be7", concept: "Black breaks the pin on the knight and prepares immediate kingside castling." },
    ],
  },
  {
    id: "kings-indian",
    name: "King's Indian Defense",
    eco: "E60",
    playerSide: "black",
    description: "Hypermodern brilliance! Black allows White to construct a massive center, then executes a devastating counter-attack.",
    whiteWinRate: 41,
    drawRate: 32,
    blackWinRate: 27,
    variations: [
      { name: "Classical Line", line: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6", "Nf3", "O-O"] },
      { name: "Sämisch Variation", line: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6", "f3", "O-O"] },
    ],
    moves: [
      { san: "d4", concept: "White claims the central d4 square." },
      { san: "Nf6", concept: "Black prevents White from playing an immediate 2.e4." },
      { san: "c4", concept: "White expands on the queenside and prepares central knight development." },
      { san: "g6", concept: "Black prepares to fianchetto the dark-squared bishop along the long diagonal." },
      { san: "Nc3", concept: "White develops naturally, threatening to take full central control with e4." },
      { san: "Bg7", concept: "The Dragon Bishop! Exerts ferocious long-range pressure down the a1-h8 diagonal." },
      { san: "e4", concept: "White builds an imposing pawn center with d4, c4, and e4." },
      { san: "d6", concept: "Black solidifies the center, restricts e5 pushes, and prepares the explosive ...e5 break." },
    ],
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
  const [selectedOpening, setSelectedOpening] = useState<OpeningVariation>(OPENINGS_DATA[0]);
  const [game, setGame] = useState<Chess>(new Chess());
  const [stepIndex, setStepIndex] = useState(0);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [theme, setTheme] = useState<BoardTheme>("classic");

  // Load an opening and reset trainer
  const loadOpening = (opening: OpeningVariation) => {
    setSelectedOpening(opening);
    setGame(new Chess());
    setStepIndex(0);
    setFeedback({
      type: "info",
      text: `Let's train the ${opening.name}! Follow the guided moves or explore the ideas below.`,
    });
    setIsCompleted(false);
    setLastMove(null);
    sound.playMove();
  };

  // Switch variation within opening
  const selectVariation = (varItem: { name: string; line: string[] }) => {
    const newG = new Chess();
    for (const m of varItem.line) {
      try {
        newG.move(m);
      } catch {}
    }
    setGame(newG);
    setStepIndex(varItem.line.length);
    setFeedback({
      type: "info",
      text: `Loaded variation: ${varItem.name} (${varItem.line.join(" ")})`,
    });
    sound.playMove();
  };

  // Reset to move 1
  const resetToStart = () => {
    setGame(new Chess());
    setStepIndex(0);
    setFeedback(null);
    setIsCompleted(false);
    setLastMove(null);
    sound.playMove();
  };

  // Current expected move in line
  const currentTargetMove = selectedOpening.moves[stepIndex];
  const isPlayerTurnToMove = currentTargetMove && ((game.turn() === "w" && selectedOpening.playerSide === "white") || (game.turn() === "b" && selectedOpening.playerSide === "black"));

  // Handle Player Interactive Move
  const handlePlayerMove = (m: { from: Square; to: Square; promotion?: string }) => {
    if (stepIndex >= selectedOpening.moves.length) return;

    const target = selectedOpening.moves[stepIndex];
    const testGame = new Chess(game.fen());

    try {
      const executed = testGame.move({ from: m.from, to: m.to, promotion: m.promotion });
      if (!executed) return;

      const matchesSan = executed.san === target.san;
      const matchesUci = `${m.from}${m.to}`.toLowerCase() === target.san.toLowerCase();

      if (matchesSan || matchesUci) {
        // Correct move!
        const nextStep = stepIndex + 1;
        setGame(new Chess(testGame.fen()));
        setLastMove({ from: executed.from as Square, to: executed.to as Square });
        setStepIndex(nextStep);
        sound.playMove();

        setFeedback({
          type: "success",
          text: `✓ Excellent! ${target.san}: ${target.concept}`,
        });

        // Check if finished entire line
        if (nextStep >= selectedOpening.moves.length) {
          setIsCompleted(true);
          sound.playVictory();
          confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 } });
          return;
        }

        // Automatic opponent reply if next move belongs to other side
        const opponentMove = selectedOpening.moves[nextStep];
        if (opponentMove) {
          setTimeout(() => {
            try {
              testGame.move(opponentMove.san);
              setGame(new Chess(testGame.fen()));
              setStepIndex(nextStep + 1);
              sound.playMove();
              setFeedback({
                type: "info",
                text: `Theory reply: ${opponentMove.san}. ${opponentMove.concept}`,
              });
            } catch {}
          }, 450);
        }
      } else {
        // Wrong move - feedback and revert
        sound.playDefeat();
        setFeedback({
          type: "error",
          text: `❌ That's not the main theoretical line! In this position, grandmasters play ${target.san}. Try again!`,
        });
        // Re-render current position to revert piece drag
        setGame(new Chess(game.fen()));
      }
    } catch {
      sound.playDefeat();
      setFeedback({
        type: "error",
        text: `Illegal or unexpected move. Play ${target.san}!`,
      });
    }
  };

  // Step Forward in theory
  const handleStepForward = () => {
    if (stepIndex >= selectedOpening.moves.length) return;
    const target = selectedOpening.moves[stepIndex];
    const nextGame = new Chess(game.fen());
    try {
      const exec = nextGame.move(target.san);
      if (exec) {
        setGame(new Chess(nextGame.fen()));
        setLastMove({ from: exec.from as Square, to: exec.to as Square });
        setStepIndex(stepIndex + 1);
        sound.playMove();
        setFeedback({
          type: "info",
          text: `${target.san}: ${target.concept}`,
        });
        if (stepIndex + 1 >= selectedOpening.moves.length) {
          setIsCompleted(true);
        }
      }
    } catch {}
  };

  // Step Backward
  const handleStepBackward = () => {
    if (stepIndex <= 0) return;
    const prevGame = new Chess(game.fen());
    prevGame.undo();
    setGame(new Chess(prevGame.fen()));
    setStepIndex(stepIndex - 1);
    setIsCompleted(false);
    setLastMove(null);
    sound.playMove();
    setFeedback(null);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 max-w-7xl mx-auto w-full">
      {/* Top Header & Tab Switcher */}
      <div className="flex flex-wrap items-center justify-between w-full bg-slate-800/80 border border-slate-700 rounded-2xl p-4 mb-6 shadow-xl backdrop-blur-md gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/20 border border-indigo-500/40 rounded-xl text-indigo-400">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Opening Academy & Courses</h2>
            <p className="text-xs text-slate-400">Interactive move trainer, master theory, and tactical concepts</p>
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
            Interactive Trainer
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
        /* INTERACTIVE OPENING TRAINER */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
          {/* Left: Board view */}
          <div className="lg:col-span-8 flex flex-col items-center">
            {/* Opening Title & Controls Header */}
            <div className="flex items-center justify-between w-full max-w-[600px] mb-2 px-1">
              <div>
                <span className="text-base font-bold text-white block">{selectedOpening.name}</span>
                <span className="text-xs font-mono text-emerald-400">
                  ECO: {selectedOpening.eco} &bull; Practice as {selectedOpening.playerSide === "white" ? "⚪ White" : "⚫ Black"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={resetToStart}
                  className="flex items-center gap-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restart Line
                </button>
              </div>
            </div>

            {/* Interactive Chessboard */}
            <Chessboard
              game={game}
              orientation={selectedOpening.playerSide}
              interactive={!isCompleted}
              onMove={handlePlayerMove}
              lastMove={lastMove}
              theme={theme}
            />

            {/* Stepper Controls */}
            <div className="flex items-center justify-between w-full max-w-[600px] mt-3 bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
              <button
                onClick={handleStepBackward}
                disabled={stepIndex === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-lg text-xs font-bold transition-colors border border-slate-700"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Previous Move
              </button>

              <div className="text-xs font-mono font-bold text-slate-400">
                Move {stepIndex} / {selectedOpening.moves.length}
              </div>

              <button
                onClick={handleStepForward}
                disabled={stepIndex >= selectedOpening.moves.length}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition-colors shadow-md"
              >
                Next Move
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Move Instruction & Strategic Concept Banner */}
            <div className="w-full max-w-[600px] mt-4">
              {feedback ? (
                <div
                  className={`p-4 rounded-xl text-xs sm:text-sm font-semibold border ${
                    feedback.type === "success"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : feedback.type === "error"
                      ? "bg-red-500/20 text-red-300 border-red-500/40"
                      : "bg-blue-500/20 text-blue-300 border-blue-500/40"
                  }`}
                >
                  {feedback.text}
                </div>
              ) : currentTargetMove ? (
                <div className="p-4 bg-slate-800/90 border border-slate-700 rounded-xl flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                      Target Move: {currentTargetMove.san}
                    </span>
                    <p className="text-xs text-slate-300 mt-1">
                      {currentTargetMove.concept}
                    </p>
                  </div>
                </div>
              ) : null}

              {isCompleted && (
                <div className="mt-3 bg-emerald-500/20 text-emerald-300 border border-emerald-500/60 p-4 rounded-xl text-center font-bold text-sm animate-bounce shadow-xl">
                  🎉 Fantastic job! You have completed the theoretical line for {selectedOpening.name}!
                </div>
              )}
            </div>

            {/* Master Win Rates Bar */}
            <div className="w-full max-w-[600px] mt-4 bg-slate-800/80 border border-slate-700 rounded-xl p-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Grandmaster Database Win Rates
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

          {/* Right: Opening Selector & Variations Tree */}
          <div className="lg:col-span-4 flex flex-col gap-4 w-full">
            {/* Branching Variations Chip Selector */}
            {selectedOpening.variations && selectedOpening.variations.length > 0 && (
              <div className="bg-slate-800/90 border border-purple-500/40 rounded-2xl p-4 shadow-xl">
                <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                  <GitBranch className="w-4 h-4 text-purple-400" />
                  Branching Variations
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedOpening.variations.map((v, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectVariation(v)}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-purple-600/30 text-purple-200 text-xs font-semibold border border-purple-500/30 transition-all"
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Opening Catalog */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 shadow-xl">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
                Featured Grandmaster Courses
              </span>
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {OPENINGS_DATA.map((op) => (
                  <button
                    key={op.id}
                    onClick={() => loadOpening(op)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                      selectedOpening.id === op.id
                        ? "bg-blue-600/25 border-blue-500 shadow-md ring-1 ring-blue-500"
                        : "bg-slate-900/60 border-slate-700/80 hover:bg-slate-700/40"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-white">{op.name}</span>
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-blue-400 border border-slate-700">
                        {op.eco}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-2 mb-2">{op.description}</p>
                    <div className="flex flex-wrap gap-1 text-[11px] font-mono text-slate-400">
                      {op.moves.slice(0, 6).map((m, i) => (
                        <span key={i} className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                          {m.san}
                        </span>
                      ))}
                      {op.moves.length > 6 && <span className="text-slate-500">+{op.moves.length - 6} more</span>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* LEARN TO PLAY ACADEMY */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl">
          {LESSONS_CATALOG.map((les) => (
            <div
              key={les.id}
              className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 shadow-xl flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 inline-block mb-3">
                  {les.category}
                </span>
                <h3 className="text-lg font-bold text-white mb-2">{les.title}</h3>
                <p className="text-xs text-slate-300 mb-4">{les.summary}</p>
                <ul className="space-y-2 text-xs text-slate-400">
                  {les.points.map((pt, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-blue-500 font-bold">&bull;</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
