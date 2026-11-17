"use client";

import React, { useState, useEffect } from "react";
import { sound } from "@/lib/audio/sound";
import { RotateCcw, Undo2, Award, Zap, Trophy, CheckCircle2, X } from "lucide-react";
import confetti from "canvas-confetti";
import { ChessPiece } from "./pieces";
import {
  type BoardSize,
  type KnightsTourRecordsMap,
  loadKnightsTourRecords,
  recordTourProgress,
} from "@/lib/chess/knights-tour-records";

export type { BoardSize };

interface Position {
  r: number;
  c: number;
}

export const KnightsTour: React.FC = () => {
  const [boardSize, setBoardSize] = useState<BoardSize>(5);
  const [visited, setVisited] = useState<Position[]>([]);
  const [currentPos, setCurrentPos] = useState<Position | null>(null);
  const [timer, setTimer] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isStuck, setIsStuck] = useState<boolean>(false);

  // Leaderboard & Record Engine
  const [records, setRecords] = useState<KnightsTourRecordsMap>(loadKnightsTourRecords);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);

  const totalSquares = boardSize * boardSize;

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && !isCompleted && !isStuck) {
      interval = setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, isCompleted, isStuck]);

  // Reset Game
  const resetGame = (newSize: BoardSize = boardSize) => {
    setBoardSize(newSize);
    setVisited([]);
    setCurrentPos(null);
    setTimer(0);
    setIsRunning(false);
    setIsCompleted(false);
    setIsStuck(false);
  };

  // Check valid Knight jumps: L-shape (2 by 1)
  const isKnightMove = (from: Position, to: Position) => {
    const dr = Math.abs(from.r - to.r);
    const dc = Math.abs(from.c - to.c);
    return (dr === 1 && dc === 2) || (dr === 2 && dc === 1);
  };

  // Get all legal target squares from current position
  const getLegalMoves = (pos: Position | null): Position[] => {
    if (!pos) {
      // First move can be any square
      const all: Position[] = [];
      for (let r = 0; r < boardSize; r++) {
        for (let c = 0; c < boardSize; c++) {
          all.push({ r, c });
        }
      }
      return all;
    }

    const deltas = [
      [-2, -1],
      [-2, 1],
      [-1, -2],
      [-1, 2],
      [1, -2],
      [1, 2],
      [2, -1],
      [2, 1],
    ];

    const legal: Position[] = [];
    for (const [dr, dc] of deltas) {
      const nr = pos.r + dr;
      const nc = pos.c + dc;
      if (nr >= 0 && nr < boardSize && nc >= 0 && nc < boardSize) {
        // Must not be already visited
        const alreadyVisited = visited.some((v) => v.r === nr && v.c === nc);
        if (!alreadyVisited) {
          legal.push({ r: nr, c: nc });
        }
      }
    }
    return legal;
  };

  const legalMoves = getLegalMoves(currentPos);

  // Square Click
  const handleSquareClick = (r: number, c: number) => {
    if (isCompleted) return;

    if (!currentPos) {
      // First placement
      const first: Position = { r, c };
      setCurrentPos(first);
      setVisited([first]);
      setIsRunning(true);
      sound.playMove();

      const { updatedRecords } = recordTourProgress(records, boardSize, 1, 0, false);
      setRecords(updatedRecords);
      return;
    }

    // Check if target is a legal unvisited square
    const isLegal = legalMoves.some((m) => m.r === r && m.c === c);
    if (!isLegal) return;

    const next: Position = { r, c };
    const newVisited = [...visited, next];
    setVisited(newVisited);
    setCurrentPos(next);
    sound.playMove();

    const isComplete = newVisited.length === totalSquares;
    const { updatedRecords } = recordTourProgress(records, boardSize, newVisited.length, timer, isComplete);
    setRecords(updatedRecords);

    // Check if completed
    if (isComplete) {
      setIsCompleted(true);
      setIsRunning(false);
      sound.playVictory();
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
      return;
    }

    // Check if stuck (no legal moves left from the next position)
    const nextLegals = getLegalMoves(next);
    if (nextLegals.length === 0) {
      setIsStuck(true);
      sound.playDefeat();
    }
  };

  // Undo Move
  const handleUndo = () => {
    if (visited.length <= 1) {
      resetGame(boardSize);
      return;
    }

    const prevVisited = visited.slice(0, -1);
    setVisited(prevVisited);
    setCurrentPos(prevVisited[prevVisited.length - 1]);
    setIsCompleted(false);
    setIsStuck(false);
    sound.playMove();
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const currentRecord = records[boardSize] || { completed: false, maxVisited: 0, bestTimeSec: null, completionsCount: 0 };

  return (
    <div className="flex flex-col items-center justify-center p-4 max-w-4xl mx-auto w-full">
      {/* Header & Controls */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 w-full shadow-xl backdrop-blur-md mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Zap className="w-6 h-6 text-yellow-400" />
              The Knight's Tour
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Visit every square on the board with the knight without stepping on the same square twice!
            </p>
          </div>

          {/* Board Size Selector & Leaderboard Button */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-700">
              {([5, 6, 7, 8] as BoardSize[]).map((sz) => (
                <button
                  key={sz}
                  onClick={() => resetGame(sz)}
                  className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                    boardSize === sz
                      ? "bg-blue-600 text-white shadow-md scale-105"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {sz}x{sz}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowLeaderboard(true)}
              className="flex items-center gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors shadow-sm"
              title="View Records & Best Clears"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Records</span>
            </button>
          </div>
        </div>

        {/* Stats & Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-5 pt-4 border-t border-slate-700/60">
          <div className="flex flex-wrap items-center gap-5 font-mono text-sm sm:text-base">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-400" />
              <span className="text-slate-300">Visited:</span>
              <span className="font-bold text-emerald-400">
                {visited.length} / {totalSquares}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-300">Time:</span>
              <span className="font-bold text-blue-400">{formatTimer(timer)}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs sm:text-sm">Best:</span>
              <span className="font-bold text-amber-400 text-xs sm:text-sm">
                {currentRecord.bestTimeSec !== null
                  ? `${formatTimer(currentRecord.bestTimeSec)} (Cleared)`
                  : `${currentRecord.maxVisited} / ${totalSquares}`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              disabled={visited.length === 0 || isCompleted}
              className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors border border-slate-600"
            >
              <Undo2 className="w-4 h-4" />
              Undo
            </button>
            <button
              onClick={() => resetGame(boardSize)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors shadow-lg"
            >
              <RotateCcw className="w-4 h-4" />
              Restart
            </button>
          </div>
        </div>
      </div>

      {/* Status Banners */}
      {isCompleted && (
        <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/60 px-6 py-3 rounded-xl mb-4 font-bold text-center text-base sm:text-lg animate-bounce shadow-xl">
          🎉 Incredible! You completed the {boardSize}x{boardSize} Knight's Tour in {formatTimer(timer)}!
        </div>
      )}

      {isStuck && !isCompleted && (
        <div className="bg-red-500/20 text-red-300 border border-red-500/60 px-6 py-3 rounded-xl mb-4 font-bold text-center text-sm sm:text-base shadow-xl">
          ⚠️ No legal moves remaining! Use Undo or restart to try another path.
        </div>
      )}

      {/* Interactive Knight's Tour Grid */}
      <div className="relative p-2 bg-slate-900 border-2 border-slate-700/80 rounded-2xl shadow-2xl">
        <div
          className="grid gap-1.5"
          style={{
            gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))`,
            width: "min(88vw, 520px)",
            height: "min(88vw, 520px)",
          }}
        >
          {Array.from({ length: boardSize }).map((_, r) =>
            Array.from({ length: boardSize }).map((_, c) => {
              const visitIndex = visited.findIndex((v) => v.r === r && v.c === c);
              const isVisited = visitIndex !== -1;
              const isCurrent = currentPos && currentPos.r === r && currentPos.c === c;
              const isLegal = legalMoves.some((m) => m.r === r && m.c === c);
              const isLight = (r + c) % 2 === 0;

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => handleSquareClick(r, c)}
                  className={`relative aspect-square w-full h-full min-w-0 min-h-0 flex items-center justify-center rounded-xl cursor-pointer transition-colors duration-150 select-none overflow-hidden ${
                    isCurrent
                      ? "bg-yellow-400 text-slate-950 ring-2 ring-yellow-400/80 shadow-md z-10"
                      : isVisited
                      ? "bg-slate-700/90 text-slate-200 border border-slate-600"
                      : isLegal
                      ? "bg-blue-600/40 hover:bg-blue-500/60 text-white ring-2 ring-blue-400/80"
                      : isLight
                      ? "bg-slate-800/80 hover:bg-slate-700/80 text-slate-400"
                      : "bg-slate-850 hover:bg-slate-800 text-slate-400"
                  }`}
                >
                  {isCurrent ? (
                    <div className="flex items-center justify-center w-full h-full p-1 animate-piece-drop">
                      <ChessPiece
                        type="n"
                        color="w"
                        size={boardSize === 8 ? 24 : boardSize === 7 ? 28 : boardSize === 6 ? 32 : 36}
                      />
                    </div>
                  ) : isVisited ? (
                    <span className="font-mono font-black text-xs sm:text-sm text-emerald-400">
                      {visitIndex + 1}
                    </span>
                  ) : isLegal ? (
                    <div className="w-3 h-3 rounded-full bg-blue-400/90" />
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Leaderboard & Records Modal */}
      {showLeaderboard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-amber-400" />
                <h3 className="text-lg font-black text-white">Knight's Tour Records</h3>
              </div>
              <button
                onClick={() => setShowLeaderboard(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              {([
                { size: 5, label: "5x5 Sprint", total: 25 },
                { size: 6, label: "6x6 Challenge", total: 36 },
                { size: 7, label: "7x7 Master", total: 49 },
                { size: 8, label: "8x8 Grandmaster", total: 64 },
              ] as const).map(({ size, label, total }) => {
                const rec = records[size] || { completed: false, maxVisited: 0, bestTimeSec: null, completionsCount: 0 };
                return (
                  <div
                    key={size}
                    className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{label}</span>
                        {rec.completed ? (
                          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            Completed ({rec.completionsCount}x)
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-400 border border-slate-600">
                            In Progress
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Max Squares: <strong className="text-slate-200">{rec.maxVisited} / {total}</strong>
                      </p>
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-[11px] block uppercase text-slate-400 font-bold">Fastest Clear</span>
                      <span className="text-sm font-black text-amber-400">
                        {rec.bestTimeSec !== null ? formatTimer(rec.bestTimeSec) : "--:--"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowLeaderboard(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Close Records
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
