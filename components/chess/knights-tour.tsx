"use client";

import React, { useState, useEffect } from "react";
import { sound } from "@/lib/audio/sound";
import { RotateCcw, Undo2, Award, Zap } from "lucide-react";
import confetti from "canvas-confetti";
import { ChessPiece } from "./pieces";

export type BoardSize = 5 | 6 | 7 | 8;

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

    // Check if completed
    if (newVisited.length === totalSquares) {
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

          {/* Board Size Selector */}
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
        </div>

        {/* Stats & Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-5 pt-4 border-t border-slate-700/60">
          <div className="flex items-center gap-6 font-mono text-sm sm:text-base">
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
                  className={`relative flex items-center justify-center rounded-xl cursor-pointer transition-all duration-150 select-none ${
                    isCurrent
                      ? "bg-yellow-400 text-slate-950 ring-4 ring-yellow-400/50 scale-105 z-20 shadow-xl"
                      : isVisited
                      ? "bg-slate-700/90 text-slate-200 border border-slate-600"
                      : isLegal
                      ? "bg-blue-600/40 hover:bg-blue-500/60 text-white ring-2 ring-blue-400/80 animate-pulse"
                      : isLight
                      ? "bg-slate-800/80 hover:bg-slate-700/80 text-slate-400"
                      : "bg-slate-850 hover:bg-slate-800 text-slate-400"
                  }`}
                >
                  {isCurrent ? (
                    <div className="animate-piece-drop">
                      <ChessPiece type="n" color="w" size={38} />
                    </div>
                  ) : isVisited ? (
                    <span className="font-mono font-black text-xs sm:text-sm text-emerald-400">
                      {visitIndex + 1}
                    </span>
                  ) : isLegal ? (
                    <div className="w-3.5 h-3.5 rounded-full bg-blue-400/90" />
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

