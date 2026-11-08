"use client";

import React, { useState, useEffect } from "react";
import { Chess, Square, Move } from "chess.js";
import { Chessboard, BoardTheme } from "../chess/board";
import { sound } from "@/lib/audio/sound";
import { Zap, Flame, Trophy, CheckCircle2, XCircle, RotateCcw, Lightbulb, ArrowRight } from "lucide-react";
import confetti from "canvas-confetti";

export interface TacticalPuzzle {
  id: string;
  fen: string;
  moves: string[]; // Solution moves in UCI or SAN, e.g. ["Nxf7", "Kxf7", "Qxe6#"]
  rating: number;
  theme: string;
  description: string;
}

export const CURATED_PUZZLES: TacticalPuzzle[] = [
  {
    id: "puzzle-1",
    fen: "r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5N2/PPPP1PPP/RNBQ1RK1 w kq - 0 5",
    moves: ["Bxf7+", "Kxf7", "Nxe5+"],
    rating: 1150,
    theme: "Tactical Greek Gift / King Hunt",
    description: "White sacrifices the bishop to expose the uncastled black king.",
  },
  {
    id: "puzzle-2",
    fen: "6k1/5ppp/8/8/8/8/1r3PPP/4R1K1 w - - 0 1",
    moves: ["Re8#"],
    rating: 800,
    theme: "Back-Rank Checkmate",
    description: "The black king is trapped behind its own pawns. Deliver checkmate!",
  },
  {
    id: "puzzle-3",
    fen: "r1b2rk1/pp3ppp/2n1p3/q2p4/3PnB2/P1P1PN2/2Q2PPP/R3KB1R w KQ - 1 12",
    moves: ["Bd3", "Nxc3", "O-O"],
    rating: 1420,
    theme: "Positional Defense & Pin",
    description: "Neutralize Black's queen pressure and develop your pieces safely.",
  },
  {
    id: "puzzle-4",
    fen: "r2qk2r/ppp2ppp/2n5/3p4/1b1Pn1b1/2NB1N2/PPP2PPP/R1BQK2R w KQkq - 4 8",
    moves: ["O-O", "Bxc3", "bxc3"],
    rating: 1300,
    theme: "King Safety & Center Control",
    description: "Secure king safety while retaining a powerful pawn center.",
  },
  {
    id: "puzzle-5",
    fen: "r1b1kb1r/pppp1ppp/8/4q3/4n3/8/PPP2PPP/RNBQKB1R w KQkq - 0 7",
    moves: ["Be2", "Bc5", "O-O"],
    rating: 1250,
    theme: "Defensive Pin & Castling",
    description: "Block the open e-file pin and prepare an immediate castle.",
  },
  {
    id: "puzzle-6",
    fen: "r3k2r/ppp2ppp/2n5/3q4/1b1Pn1b1/2NB1N2/PPP2PPP/R1BQK2R w KQkq - 0 8",
    moves: ["O-O", "Bxc3", "bxc3", "O-O"],
    rating: 1550,
    theme: "Complex Exchange",
    description: "Tactical maneuvering to seize active open files.",
  },
];

export const PuzzleArena: React.FC = () => {
  const [mode, setMode] = useState<"daily" | "rush">("daily");
  const [currentIdx, setCurrentIdx] = useState(0);
  const puzzle = CURATED_PUZZLES[currentIdx % CURATED_PUZZLES.length];

  const [game, setGame] = useState<Chess>(new Chess(puzzle.fen));
  const [moveStep, setMoveStep] = useState(0);
  const [status, setStatus] = useState<"solving" | "correct" | "failed">("solving");
  const [theme, setTheme] = useState<BoardTheme>("classic");
  const [showHint, setShowHint] = useState(false);

  // Puzzle Rush States
  const [rushScore, setRushScore] = useState(0);
  const [rushStrikes, setRushStrikes] = useState(0);
  const [rushTimer, setRushTimer] = useState(180); // 3 minutes
  const [isRushActive, setIsRushActive] = useState(false);

  // Initialize or reset puzzle
  useEffect(() => {
    setGame(new Chess(puzzle.fen));
    setMoveStep(0);
    setStatus("solving");
    setShowHint(false);
  }, [currentIdx, puzzle]);

  // Puzzle Rush Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRushActive && rushTimer > 0 && rushStrikes < 3) {
      interval = setInterval(() => {
        setRushTimer((t) => {
          if (t <= 1) {
            handleRushEnd();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRushActive, rushTimer, rushStrikes]);

  const handleRushEnd = () => {
    setIsRushActive(false);
    sound.playVictory();
  };

  const startRush = () => {
    setRushScore(0);
    setRushStrikes(0);
    setRushTimer(180);
    setIsRushActive(true);
    setCurrentIdx(0);
    setStatus("solving");
  };

  const handlePlayerMove = (m: { from: Square; to: Square; promotion?: string }) => {
    if (status !== "solving") return;

    const expectedMove = puzzle.moves[moveStep];
    const testGame = new Chess(game.fen());

    try {
      // Find move notation
      const executed = testGame.move({ from: m.from, to: m.to, promotion: m.promotion });
      if (!executed) return;

      const matchesSan = executed.san === expectedMove;
      const matchesUci = `${m.from}${m.to}` === expectedMove.toLowerCase();

      if (matchesSan || matchesUci) {
        // Correct move!
        const nextStep = moveStep + 1;
        setGame(new Chess(testGame.fen()));
        setMoveStep(nextStep);

        if (nextStep >= puzzle.moves.length) {
          // Solved whole puzzle!
          setStatus("correct");
          sound.playVictory();
          confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });

          if (mode === "rush") {
            setRushScore((s) => s + 1);
            setTimeout(() => {
              setCurrentIdx((i) => (i + 1) % CURATED_PUZZLES.length);
            }, 800);
          }
        } else {
          // Play opponent's automatic response
          setTimeout(() => {
            const oppMove = puzzle.moves[nextStep];
            try {
              testGame.move(oppMove);
              setGame(new Chess(testGame.fen()));
              setMoveStep(nextStep + 1);
              sound.playMove();
            } catch {
              // Ignore
            }
          }, 450);
        }
      } else {
        // Incorrect move
        setStatus("failed");
        sound.playDefeat();
        if (mode === "rush") {
          const newStrikes = rushStrikes + 1;
          setRushStrikes(newStrikes);
          if (newStrikes >= 3) {
            handleRushEnd();
          }
        }
      }
    } catch {
      setStatus("failed");
      sound.playDefeat();
    }
  };

  const retryPuzzle = () => {
    setGame(new Chess(puzzle.fen));
    setMoveStep(0);
    setStatus("solving");
    setShowHint(false);
  };

  const nextPuzzle = () => {
    setCurrentIdx((i) => (i + 1) % CURATED_PUZZLES.length);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 max-w-7xl mx-auto w-full">
      {/* Mode Header */}
      <div className="flex flex-wrap items-center justify-between w-full bg-slate-800/80 border border-slate-700 rounded-2xl p-4 mb-6 shadow-xl backdrop-blur-md gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-yellow-500/20 border border-yellow-500/40 rounded-xl text-yellow-400">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Tactical Puzzle Training</h2>
            <p className="text-xs text-slate-400">Solve daily tactics and boost your calculation</p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-2 bg-slate-900/90 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => {
              setMode("daily");
              setIsRushActive(false);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === "daily" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            Daily Puzzles
          </button>
          <button
            onClick={() => setMode("rush")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === "rush" ? "bg-amber-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <Flame className="w-4 h-4 text-amber-300" />
            3-Min Puzzle Rush
          </button>
        </div>
      </div>

      {/* Main Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
        {/* Left: Chessboard */}
        <div className="lg:col-span-8 flex flex-col items-center">
          <div className="flex items-center justify-between w-full max-w-[600px] mb-2 px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-yellow-400 border border-slate-700">
                Rating: {puzzle.rating}
              </span>
              <span className="text-xs text-slate-400 font-semibold">{puzzle.theme}</span>
            </div>
            <span className="text-xs text-slate-300 font-bold">
              {game.turn() === "w" ? "⚪ White to move" : "⚫ Black to move"}
            </span>
          </div>

          <Chessboard
            game={game}
            orientation={game.turn() === "w" ? "white" : "black"}
            onMove={handlePlayerMove}
            interactive={status === "solving"}
            theme={theme}
          />
        </div>

        {/* Right: Info, Rush Stats & Actions */}
        <div className="lg:col-span-4 flex flex-col gap-4 w-full">
          {mode === "rush" ? (
            /* Puzzle Rush Dashboard */
            <div className="bg-slate-800/90 border border-amber-600/50 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                  <Flame className="w-4 h-4" />
                  Puzzle Rush
                </span>
                <span className="font-mono text-base font-black text-white bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
                  {Math.floor(rushTimer / 60)}:{(rushTimer % 60).toString().padStart(2, "0")}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
                  <span className="text-[11px] font-bold text-slate-400 block mb-0.5">Score</span>
                  <span className="text-3xl font-black text-emerald-400 font-mono">{rushScore}</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
                  <span className="text-[11px] font-bold text-slate-400 block mb-0.5">Strikes</span>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {[1, 2, 3].map((s) => (
                      <span
                        key={s}
                        className={`text-base ${s <= rushStrikes ? "text-red-500 font-black" : "text-slate-700"}`}
                      >
                        ✕
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {!isRushActive ? (
                <button
                  onClick={startRush}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black rounded-xl text-sm shadow-lg transition-all"
                >
                  Start 3-Minute Rush!
                </button>
              ) : (
                <p className="text-xs text-center text-slate-400">
                  Keep solving as many puzzles as possible before time runs out!
                </p>
              )}
            </div>
          ) : (
            /* Daily Puzzle Info */
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-xl">
              <h3 className="text-base font-bold text-white mb-1.5">{puzzle.theme}</h3>
              <p className="text-xs text-slate-400 mb-4">{puzzle.description}</p>

              {/* Status Banner */}
              {status === "correct" && (
                <div className="bg-emerald-500/20 border border-emerald-500/60 text-emerald-300 p-3 rounded-xl flex items-center gap-2 mb-4 text-xs font-bold animate-bounce">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  Brilliant! Puzzle Solved Successfully!
                </div>
              )}

              {status === "failed" && (
                <div className="bg-red-500/20 border border-red-500/60 text-red-300 p-3 rounded-xl flex items-center gap-2 mb-4 text-xs font-bold">
                  <XCircle className="w-4 h-4 shrink-0 text-red-400" />
                  Incorrect move. Try again!
                </div>
              )}

              {/* Hint Box */}
              {showHint && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 p-3 rounded-xl mb-4 text-xs">
                  💡 Hint: Look for tactical checks or piece captures on the f7 or e8 squares!
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <button
                    onClick={retryPuzzle}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-xl text-xs font-bold transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Retry
                  </button>

                  <button
                    onClick={() => setShowHint(true)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-xl text-xs font-bold transition-colors"
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-yellow-400" />
                    Hint
                  </button>
                </div>

                <button
                  onClick={nextPuzzle}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-xs font-bold shadow-lg transition-colors"
                >
                  <span>Next Puzzle</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

