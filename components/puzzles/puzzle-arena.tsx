"use client";

import React, { useState, useEffect } from "react";
import { Chess, Square } from "chess.js";
import { Chessboard, BoardTheme } from "../chess/board";
import { sound } from "@/lib/audio/sound";
import { Zap, Flame, Trophy, CheckCircle2, XCircle, RotateCcw, Lightbulb, ArrowRight } from "lucide-react";
import confetti from "canvas-confetti";

export interface TacticalPuzzle {
  id: string;
  fen: string;
  moves: string[]; // Solution moves in SAN, e.g. ["Bxf7+", "Kxf7", "Nxe5+"]
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

  // The player's assigned color is permanently fixed from the starting FEN turn
  const playerColor: "white" | "black" = new Chess(puzzle.fen).turn() === "w" ? "white" : "black";

  const [game, setGame] = useState<Chess>(new Chess(puzzle.fen));
  const [stepFen, setStepFen] = useState<string>(puzzle.fen);
  const [moveStep, setMoveStep] = useState(0);
  const [status, setStatus] = useState<"solving" | "correct" | "retry">("solving");
  const [feedback, setFeedback] = useState<string>(
    `Your turn as ${playerColor === "white" ? "White" : "Black"}. Find the best continuation!`
  );
  const [isOpponentMoving, setIsOpponentMoving] = useState(false);
  const [theme, setTheme] = useState<BoardTheme>("classic");
  const [showHint, setShowHint] = useState(false);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);

  // Puzzle Rush States
  const [rushScore, setRushScore] = useState(0);
  const [rushStrikes, setRushStrikes] = useState(0);
  const [rushTimer, setRushTimer] = useState(180); // 3 minutes
  const [isRushActive, setIsRushActive] = useState(false);

  // Initialize or reset puzzle
  useEffect(() => {
    setGame(new Chess(puzzle.fen));
    setStepFen(puzzle.fen);
    setMoveStep(0);
    setStatus("solving");
    setIsOpponentMoving(false);
    setShowHint(false);
    setLastMove(null);
    setFeedback(`Your turn as ${playerColor === "white" ? "White" : "Black"}. Find the best move!`);
  }, [currentIdx, puzzle.fen, playerColor]);

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

  // Handle Player's Interactive Move
  const handlePlayerMove = (m: { from: Square; to: Square; promotion?: string }) => {
    if (status !== "solving" || isOpponentMoving) return;

    // Strict Player Turn Check: player can ONLY move when it's their color's turn
    const isPlayerTurn = game.turn() === (playerColor === "white" ? "w" : "b");
    if (!isPlayerTurn) return;

    const expectedMove = puzzle.moves[moveStep];
    const testGame = new Chess(game.fen());

    try {
      const executed = testGame.move({ from: m.from, to: m.to, promotion: m.promotion });
      if (!executed) return;

      const matchesSan = executed.san === expectedMove;
      const matchesUci = `${m.from}${m.to}`.toLowerCase() === expectedMove.toLowerCase();

      if (matchesSan || matchesUci) {
        // Correct move!
        const nextStep = moveStep + 1;
        setGame(new Chess(testGame.fen()));
        setLastMove({ from: executed.from as Square, to: executed.to as Square });
        setMoveStep(nextStep);

        if (executed.captured) sound.playCapture();
        else sound.playMove();

        // Check if finished entire puzzle
        if (nextStep >= puzzle.moves.length) {
          setStatus("correct");
          sound.playVictory();
          confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 } });
          setFeedback("🎉 Puzzle Solved! Brilliant calculation!");

          if (mode === "rush") {
            setRushScore((s) => s + 1);
            setTimeout(() => {
              setCurrentIdx((i) => (i + 1) % CURATED_PUZZLES.length);
            }, 900);
          }
        } else {
          // Automatic opponent response
          setIsOpponentMoving(true);
          setFeedback("✓ Best move! Opponent is replying...");

          setTimeout(() => {
            const oppMoveSan = puzzle.moves[nextStep];
            try {
              const oppExec = testGame.move(oppMoveSan);
              if (oppExec) {
                setGame(new Chess(testGame.fen()));
                setStepFen(testGame.fen());
                setLastMove({ from: oppExec.from as Square, to: oppExec.to as Square });
                setMoveStep(nextStep + 1);

                if (oppExec.captured) sound.playCapture();
                else sound.playMove();

                setIsOpponentMoving(false);
                setFeedback("Opponent replied. Your turn: find the winning follow-up!");
              }
            } catch {
              setIsOpponentMoving(false);
            }
          }, 450);
        }
      } else {
        // INCORRECT MOVE:
        // Do NOT advance game. Do NOT flip board. Play defeat sound.
        // Alert player and automatically reset board back to stepFen after 600ms so they can try again!
        sound.playDefeat();
        setStatus("retry");
        setFeedback(`❌ Incorrect move! Resetting position... try another move.`);

        if (mode === "rush") {
          const newStrikes = rushStrikes + 1;
          setRushStrikes(newStrikes);
          if (newStrikes >= 3) {
            handleRushEnd();
          }
        }

        setTimeout(() => {
          setGame(new Chess(stepFen));
          setStatus("solving");
          setFeedback(`Find the best move for ${playerColor === "white" ? "White" : "Black"}!`);
        }, 650);
      }
    } catch {
      sound.playDefeat();
      setFeedback("Illegal move. Try again!");
    }
  };

  const retryPuzzle = () => {
    setGame(new Chess(puzzle.fen));
    setStepFen(puzzle.fen);
    setMoveStep(0);
    setStatus("solving");
    setIsOpponentMoving(false);
    setShowHint(false);
    setLastMove(null);
    setFeedback(`Board reset. Find the best move!`);
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
            <p className="text-xs text-slate-400">Solve curated master tactics & elevate calculation</p>
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
            <span className="text-xs text-slate-200 font-bold px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700">
              {playerColor === "white" ? "⚪ You play White" : "⚫ You play Black"}
            </span>
          </div>

          {/* Board Orientation is strictly locked to playerColor - never flips! */}
          <Chessboard
            game={game}
            orientation={playerColor}
            onMove={handlePlayerMove}
            interactive={status === "solving" && !isOpponentMoving}
            theme={theme}
            lastMove={lastMove}
          />

          {/* Dynamic Feedback Message Banner */}
          <div className="w-full max-w-[600px] mt-3">
            <div
              className={`p-3.5 rounded-xl text-center text-xs sm:text-sm font-bold border transition-all ${
                status === "correct"
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-lg"
                  : status === "retry"
                  ? "bg-red-500/20 text-red-300 border-red-500/50 animate-shake"
                  : isOpponentMoving
                  ? "bg-blue-500/20 text-blue-300 border-blue-500/40 animate-pulse"
                  : "bg-slate-800/80 text-slate-200 border-slate-700"
              }`}
            >
              {feedback}
            </div>
          </div>
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
                  Solve as many tactical puzzles as you can before time or strikes expire!
                </p>
              )}
            </div>
          ) : (
            /* Daily Puzzle Info */
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-xl">
              <h3 className="text-base font-bold text-white mb-1.5">{puzzle.theme}</h3>
              <p className="text-xs text-slate-400 mb-4">{puzzle.description}</p>

              {/* Solved Status & Next Puzzle Button */}
              {status === "correct" ? (
                <div className="mb-4">
                  <button
                    onClick={nextPuzzle}
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl text-sm shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <span>Next Puzzle</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-3 mb-4">
                  {showHint ? (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300">
                      <strong>Hint:</strong> The first target move is {puzzle.moves[0]}. Look for forced checks or tactical piece sacrifices!
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowHint(true)}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                      Need a Hint?
                    </button>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2 border-t border-slate-700/60">
                <button
                  onClick={retryPuzzle}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-xl text-xs font-semibold transition-colors border border-slate-600"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Position
                </button>
                <button
                  onClick={nextPuzzle}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-xl text-xs font-semibold transition-colors shadow-md"
                >
                  Skip Puzzle
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
