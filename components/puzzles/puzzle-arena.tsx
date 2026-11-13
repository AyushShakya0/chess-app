"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Chess, Square } from "chess.js";
import { Chessboard, BoardTheme, BoardArrow, BoardHighlight } from "../chess/board";
import { sound } from "@/lib/audio/sound";
import {
  Zap,
  Flame,
  RotateCcw,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
  Trophy,
  Copy,
  Check,
  Target,
  Sparkles,
  Award,
  Filter,
} from "lucide-react";
import confetti from "canvas-confetti";

import { CURATED_PUZZLES, type TacticalPuzzle, getMoveCoordsFromSan } from "@/lib/data/puzzles";

export type PuzzleMode = "daily" | "rush" | "streak";
export type RatingTier = "all" | "under-1000" | "1000-1400" | "1400-1800" | "1800+";
export type ThemeFilter = "all" | "Checkmate" | "Sacrifices" | "Forks & Pins" | "Endgames";

export const PuzzleArena: React.FC = () => {
  const [mode, setMode] = useState<PuzzleMode>("daily");
  const [ratingTier, setRatingTier] = useState<RatingTier>("all");
  const [themeFilter, setThemeFilter] = useState<ThemeFilter>("all");

  // Filtered puzzles based on mode, rating tier, and theme
  const activePuzzles = useMemo(() => {
    if (mode === "streak") {
      // In streak mode, puzzles scale by difficulty ascending
      return [...CURATED_PUZZLES].sort((a, b) => a.rating - b.rating);
    }
    const filtered = CURATED_PUZZLES.filter((p) => {
      // Rating Tier Filter
      if (ratingTier === "under-1000" && p.rating >= 1000) return false;
      if (ratingTier === "1000-1400" && (p.rating < 1000 || p.rating >= 1400)) return false;
      if (ratingTier === "1400-1800" && (p.rating < 1400 || p.rating >= 1800)) return false;
      if (ratingTier === "1800+" && p.rating < 1800) return false;

      // Theme Filter
      if (themeFilter !== "all") {
        const t = p.theme.toLowerCase();
        if (themeFilter === "Checkmate" && !t.includes("mate")) return false;
        if (
          themeFilter === "Sacrifices" &&
          !t.includes("sacrifice") &&
          !t.includes("deflection") &&
          !t.includes("gift")
        )
          return false;
        if (
          themeFilter === "Forks & Pins" &&
          !t.includes("fork") &&
          !t.includes("pin") &&
          !t.includes("exchange") &&
          !t.includes("double attack")
        )
          return false;
        if (
          themeFilter === "Endgames" &&
          !t.includes("endgame") &&
          !t.includes("opposition") &&
          !t.includes("lucena") &&
          !t.includes("rook")
        )
          return false;
      }
      return true;
    });
    return filtered.length > 0 ? filtered : CURATED_PUZZLES;
  }, [mode, ratingTier, themeFilter]);

  const [currentIdx, setCurrentIdx] = useState(0);
  const puzzle = activePuzzles[currentIdx % activePuzzles.length];

  // The player's assigned color is permanently fixed from the starting FEN turn
  const playerColor: "white" | "black" = new Chess(puzzle.fen).turn() === "w" ? "white" : "black";
  const playerAllowedColor: "w" | "b" = playerColor === "white" ? "w" : "b";

  const [game, setGame] = useState<Chess>(new Chess(puzzle.fen));
  const [moveStep, setMoveStep] = useState(0);
  const [status, setStatus] = useState<"solving" | "correct" | "retry">("solving");
  const [feedback, setFeedback] = useState<string>(
    `Your turn as ${playerColor === "white" ? "White" : "Black"}. Find the winning tactical move!`
  );
  const [isOpponentMoving, setIsOpponentMoving] = useState(false);
  const [theme] = useState<BoardTheme>("classic");
  const [showHint, setShowHint] = useState(false);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [copiedFen, setCopiedFen] = useState(false);

  // Puzzle Rush States (3 minutes, 3 strikes)
  const [rushScore, setRushScore] = useState(0);
  const [rushStrikes, setRushStrikes] = useState(0);
  const [rushTimer, setRushTimer] = useState(180);
  const [isRushActive, setIsRushActive] = useState(false);

  // Puzzle Streak States (1 life, progressive difficulty, personal best)
  const [streakScore, setStreakScore] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [streakEnded, setStreakEnded] = useState(false);

  // Load personal best streak from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("prin_chess_best_streak");
      if (saved) setBestStreak(parseInt(saved, 10) || 0);
    } catch {}
  }, []);

  // Initialize or reset puzzle when index or puzzle changes
  useEffect(() => {
    setGame(new Chess(puzzle.fen));
    setMoveStep(0);
    setStatus("solving");
    setIsOpponentMoving(false);
    setShowHint(false);
    setLastMove(null);
    setFeedback(`Your turn as ${playerColor === "white" ? "White" : "Black"}. Find the winning continuation!`);
  }, [currentIdx, puzzle.fen, playerColor]);

  // Reset index when filters change
  useEffect(() => {
    setCurrentIdx(0);
  }, [ratingTier, themeFilter, mode]);

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

  const startStreak = () => {
    setStreakScore(0);
    setStreakEnded(false);
    setCurrentIdx(0);
    setStatus("solving");
  };

  // Handle Player's Interactive Move
  // Returns true to accept move, false to reject and auto-undo on the board
  const handlePlayerMove = (m: { from: Square; to: Square; promotion?: string; san?: string }): boolean => {
    if (status !== "solving" || isOpponentMoving || streakEnded) return false;

    const expectedMove = puzzle.moves[moveStep];
    const playedSan = m.san || "";

    const matchesSan = playedSan === expectedMove;
    const matchesUci = `${m.from}${m.to}`.toLowerCase() === expectedMove.toLowerCase();

    if (matchesSan || matchesUci) {
      // Correct move!
      const nextStep = moveStep + 1;
      setMoveStep(nextStep);
      setLastMove({ from: m.from, to: m.to });
      setShowHint(false);

      // Check if finished entire puzzle sequence
      if (nextStep >= puzzle.moves.length) {
        setStatus("correct");
        sound.playVictory();
        confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 } });
        setFeedback("🎉 Tactical Masterpiece! Puzzle Solved!");

        if (mode === "rush") {
          setRushScore((s) => s + 1);
          setTimeout(() => {
            setCurrentIdx((i) => (i + 1) % activePuzzles.length);
          }, 900);
        } else if (mode === "streak") {
          const newStreak = streakScore + 1;
          setStreakScore(newStreak);
          if (newStreak > bestStreak) {
            setBestStreak(newStreak);
            try {
              localStorage.setItem("prin_chess_best_streak", String(newStreak));
            } catch {}
          }
          setTimeout(() => {
            setCurrentIdx((i) => (i + 1) % activePuzzles.length);
          }, 1000);
        }
      } else {
        // Automatic opponent counter-reply
        setIsOpponentMoving(true);
        setFeedback("✓ Best move! Opponent is replying...");

        setTimeout(() => {
          const oppMoveSan = puzzle.moves[nextStep];
          try {
            const oppExec = game.move(oppMoveSan);
            if (oppExec) {
              setGame(new Chess(game.fen()));
              setLastMove({ from: oppExec.from as Square, to: oppExec.to as Square });
              setMoveStep(nextStep + 1);

              if (oppExec.captured) sound.playCapture();
              else sound.playMove();

              if (game.inCheck()) {
                setTimeout(() => sound.playCheck(), 100);
              }

              setIsOpponentMoving(false);
              setFeedback("Opponent replied! Find the winning follow-up!");
            }
          } catch {
            setIsOpponentMoving(false);
          }
        }, 450);
      }
      return true;
    } else {
      // INCORRECT MOVE:
      // Return false so board.tsx immediately undos the move!
      sound.playDefeat();
      setStatus("retry");

      if (mode === "streak") {
        setStreakEnded(true);
        setFeedback(`❌ Incorrect move! Streak ended at ${streakScore}.`);
        return false;
      }

      setFeedback(`❌ Incorrect move! That move does not win material or deliver mate. Try again!`);

      if (mode === "rush") {
        const newStrikes = rushStrikes + 1;
        setRushStrikes(newStrikes);
        if (newStrikes >= 3) {
          handleRushEnd();
        }
      }

      setTimeout(() => {
        setStatus("solving");
        setFeedback(`Find the best move for ${playerColor === "white" ? "White" : "Black"}!`);
      }, 700);

      return false;
    }
  };

  const retryPuzzle = () => {
    setGame(new Chess(puzzle.fen));
    setMoveStep(0);
    setStatus("solving");
    setIsOpponentMoving(false);
    setShowHint(false);
    setLastMove(null);
    setFeedback(`Position reset. Find the best move for ${playerColor === "white" ? "White" : "Black"}!`);
    sound.playMove();
  };

  const nextPuzzle = () => {
    setCurrentIdx((i) => (i + 1) % activePuzzles.length);
  };

  const handleCopyFen = () => {
    navigator.clipboard.writeText(puzzle.fen);
    setCopiedFen(true);
    setTimeout(() => setCopiedFen(false), 2000);
  };

  // Compute hint arrows and square highlights on the board
  const hintCoords = showHint ? getMoveCoordsFromSan(game.fen(), puzzle.moves[moveStep]) : null;
  const customArrows: BoardArrow[] = hintCoords
    ? [{ from: hintCoords.from, to: hintCoords.to, color: "#22c55e" }]
    : [];
  const customHighlights: BoardHighlight[] = hintCoords
    ? [
        { square: hintCoords.from, color: "rgba(34, 197, 94, 0.45)" },
        { square: hintCoords.to, color: "rgba(34, 197, 94, 0.55)" },
      ]
    : [];

  return (
    <div className="flex flex-col items-center justify-center p-4 max-w-7xl mx-auto w-full">
      {/* Mode Header */}
      <div className="flex flex-wrap items-center justify-between w-full bg-slate-800/80 border border-slate-700 rounded-2xl p-4 mb-6 shadow-xl backdrop-blur-md gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-yellow-500/20 border border-yellow-500/40 rounded-xl text-yellow-400">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white">Tactical Puzzle Training</h2>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {activePuzzles.length} Available
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive grandmaster puzzles with automated opponent counter-replies
            </p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-xl border border-slate-700">
          <button
            onClick={() => {
              setMode("daily");
              setIsRushActive(false);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === "daily" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            Daily Practice
          </button>
          <button
            onClick={() => {
              setMode("streak");
              setIsRushActive(false);
            }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === "streak" ? "bg-amber-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-300" />
            Puzzle Streak
          </button>
          <button
            onClick={() => setMode("rush")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === "rush" ? "bg-rose-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-rose-300" />
            3-Min Rush
          </button>
        </div>
      </div>

      {/* Filter Toolbar (Visible in Daily Practice Mode) */}
      {mode === "daily" && (
        <div className="flex flex-wrap items-center justify-between w-full bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2.5 mb-5 gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mr-1">
              <Filter className="w-3.5 h-3.5 text-blue-400" />
              Rating:
            </span>
            {[
              { id: "all", label: "All Ratings" },
              { id: "under-1000", label: "< 1000" },
              { id: "1000-1400", label: "1000 - 1400" },
              { id: "1400-1800", label: "1400 - 1800" },
              { id: "1800+", label: "1800+" },
            ].map((tier) => (
              <button
                key={tier.id}
                onClick={() => setRatingTier(tier.id as RatingTier)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  ratingTier === tier.id
                    ? "bg-blue-600 text-white shadow"
                    : "bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/60"
                }`}
              >
                {tier.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mr-1">
              <Target className="w-3.5 h-3.5 text-yellow-400" />
              Theme:
            </span>
            {[
              { id: "all", label: "All Themes" },
              { id: "Checkmate", label: "Checkmate" },
              { id: "Sacrifices", label: "Sacrifices" },
              { id: "Forks & Pins", label: "Forks & Pins" },
              { id: "Endgames", label: "Endgames" },
            ].map((th) => (
              <button
                key={th.id}
                onClick={() => setThemeFilter(th.id as ThemeFilter)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  themeFilter === th.id
                    ? "bg-amber-600 text-white shadow"
                    : "bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/60"
                }`}
              >
                {th.label}
              </button>
            ))}
          </div>
        </div>
      )}

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
            <span className="text-xs text-slate-200 font-bold px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  playerColor === "white" ? "bg-white" : "bg-slate-950 border border-slate-400"
                }`}
              />
              {playerColor === "white" ? "You play White" : "You play Black"}
            </span>
          </div>

          {/* Board Orientation is strictly locked to playerColor - never flips! */}
          <Chessboard
            game={game}
            orientation={playerColor}
            onMove={handlePlayerMove}
            interactive={status === "solving" && !isOpponentMoving && !streakEnded}
            allowedColor={playerAllowedColor}
            theme={theme}
            lastMove={lastMove}
            customArrows={customArrows}
            customHighlights={customHighlights}
          />

          {/* Dynamic Feedback Message Banner */}
          <div className="w-full max-w-[600px] mt-3">
            <div
              className={`p-3.5 rounded-xl text-center text-xs sm:text-sm font-bold border transition-all ${
                status === "correct"
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-lg"
                  : status === "retry" || streakEnded
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

        {/* Right: Info, Dashboard & Actions */}
        <div className="lg:col-span-4 flex flex-col gap-4 w-full">
          {mode === "rush" ? (
            /* Puzzle Rush Dashboard */
            <div className="bg-slate-800/90 border border-rose-600/50 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                  <Flame className="w-4 h-4 text-rose-400" />
                  3-Min Puzzle Rush
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
                  className="w-full py-3 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-slate-950 font-black rounded-xl text-sm shadow-lg transition-all"
                >
                  Start 3-Minute Rush!
                </button>
              ) : (
                <p className="text-xs text-center text-slate-400">
                  Solve as many tactical puzzles as you can before time or 3 strikes expire!
                </p>
              )}
            </div>
          ) : mode === "streak" ? (
            /* Puzzle Streak Dashboard */
            <div className="bg-slate-800/90 border border-amber-600/50 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  Puzzle Streak
                </span>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  1 Life &bull; Progressive
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
                  <span className="text-[11px] font-bold text-slate-400 block mb-0.5">Current Streak</span>
                  <div className="flex items-center justify-center gap-1">
                    <Flame className="w-5 h-5 text-amber-400" />
                    <span className="text-3xl font-black text-amber-400 font-mono">{streakScore}</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
                  <span className="text-[11px] font-bold text-slate-400 block mb-0.5">Personal Best</span>
                  <div className="flex items-center justify-center gap-1">
                    <Award className="w-5 h-5 text-emerald-400" />
                    <span className="text-3xl font-black text-emerald-400 font-mono">{bestStreak}</span>
                  </div>
                </div>
              </div>

              {streakEnded ? (
                <div className="space-y-3">
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-center">
                    <p className="text-xs text-red-300 font-bold mb-1">Streak Ended!</p>
                    <p className="text-[11px] text-slate-400">
                      Final Score: <strong className="text-white">{streakScore}</strong> &bull; Best:{" "}
                      <strong className="text-emerald-400">{bestStreak}</strong>
                    </p>
                  </div>
                  <button
                    onClick={startStreak}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black rounded-xl text-sm shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Play Another Streak
                  </button>
                </div>
              ) : (
                <p className="text-xs text-center text-slate-400">
                  Solve puzzles of increasing difficulty. One single mistake ends the streak!
                </p>
              )}
            </div>
          ) : null}

          {/* Puzzle Details & Action Hub */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-white">{puzzle.title}</h3>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30">
                Step {moveStep + 1} / {puzzle.moves.length}
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">{puzzle.description}</p>

            {/* Solved Status & Next Puzzle Button */}
            {status === "correct" ? (
              <div className="mb-4">
                <button
                  onClick={nextPuzzle}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl text-sm shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <span>Next Tactical Puzzle</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-3 mb-4">
                {showHint ? (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300">
                    <div className="font-bold flex items-center gap-1.5 mb-1 text-emerald-400">
                      <Lightbulb className="w-4 h-4 text-emerald-400" />
                      Target Move Arrow Active!
                    </div>
                    The best move is <strong>{puzzle.moves[moveStep]}</strong>. Follow the green arrow drawn directly on the board!
                  </div>
                ) : (
                  <button
                    onClick={() => setShowHint(true)}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                    Need a Hint? (Draw on Board)
                  </button>
                )}
              </div>
            )}

            {/* Action Bar */}
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
                Skip
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* FEN Copy Toolbar */}
            <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-[11px] truncate max-w-[200px] text-slate-500">
                FEN: {puzzle.fen.split(" ")[0]}...
              </span>
              <button
                onClick={handleCopyFen}
                className="flex items-center gap-1 text-[11px] font-bold text-slate-300 hover:text-white px-2 py-1 rounded bg-slate-900 border border-slate-700 hover:border-slate-600 transition-colors"
                title="Copy position FEN"
              >
                {copiedFen ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied FEN</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-slate-400" />
                    <span>Copy FEN</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
