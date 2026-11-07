"use client";

import React, { useState, useEffect } from "react";
import { Chess, Square } from "chess.js";
import { Chessboard, BoardTheme } from "./board";
import { sound } from "@/lib/audio/sound";
import { RotateCw, SplitSquareVertical, Trophy, RefreshCw, Flag, Handshake } from "lucide-react";
import confetti from "canvas-confetti";

export const PassAndPlay: React.FC = () => {
  const [game, setGame] = useState<Chess>(new Chess());
  const [viewMode, setViewMode] = useState<"flip" | "dual">("dual");
  const [theme, setTheme] = useState<BoardTheme>("classic");
  const [premoveEnabled, setPremoveEnabled] = useState(false);
  const [autoQueen, setAutoQueen] = useState(true);

  // Time controls
  const [timeControl, setTimeControl] = useState<number>(300); // 5 min default
  const [whiteTime, setWhiteTime] = useState<number>(300);
  const [blackTime, setBlackTime] = useState<number>(300);
  const [isClockRunning, setIsClockRunning] = useState<boolean>(false);

  // Rematch Score Tracker
  const [score, setScore] = useState<{ white: number; black: number; draws: number }>({
    white: 0,
    black: 0,
    draws: 0,
  });

  const [gameOverMessage, setGameOverMessage] = useState<string | null>(null);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);

  // Clock countdown timer
  useEffect(() => {
    if (!isClockRunning || gameOverMessage) return;

    const timer = setInterval(() => {
      if (game.turn() === "w") {
        setWhiteTime((prev) => {
          if (prev <= 1) {
            handleTimeOut("w");
            return 0;
          }
          if (prev === 10) sound.playLowTimeTick();
          return prev - 1;
        });
      } else {
        setBlackTime((prev) => {
          if (prev <= 1) {
            handleTimeOut("b");
            return 0;
          }
          if (prev === 10) sound.playLowTimeTick();
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isClockRunning, game.turn(), gameOverMessage]);

  const handleTimeOut = (loserColor: "w" | "b") => {
    const winner = loserColor === "w" ? "Black" : "White";
    setGameOverMessage(`${winner} wins on time! ⏰`);
    sound.playVictory();
    updateScore(winner === "White" ? "w" : "b");
  };

  const updateScore = (winner: "w" | "b" | "d") => {
    setScore((prev) => ({
      white: winner === "w" ? prev.white + 1 : prev.white,
      black: winner === "b" ? prev.black + 1 : prev.black,
      draws: winner === "d" ? prev.draws + 1 : prev.draws,
    }));
  };

  const handleMove = (move: { from: Square; to: Square; promotion?: string }) => {
    if (!isClockRunning) {
      setIsClockRunning(true);
    }

    setLastMove({ from: move.from, to: move.to });
    setMoveHistory(game.history());

    // Check game over states
    if (game.isCheckmate()) {
      const winner = game.turn() === "w" ? "Black" : "White";
      setGameOverMessage(`Checkmate! ${winner} wins! 🏆`);
      sound.playVictory();
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
      updateScore(winner === "White" ? "w" : "b");
    } else if (game.isDraw()) {
      let reason = "Draw by 50-move rule";
      if (game.isStalemate()) reason = "Draw by Stalemate";
      if (game.isThreefoldRepetition()) reason = "Draw by Threefold Repetition";
      if (game.isInsufficientMaterial()) reason = "Draw by Insufficient Material";
      setGameOverMessage(reason);
      updateScore("d");
    }
  };

  const resetGame = () => {
    const newG = new Chess();
    setGame(newG);
    setWhiteTime(timeControl);
    setBlackTime(timeControl);
    setIsClockRunning(false);
    setGameOverMessage(null);
    setMoveHistory([]);
    setLastMove(null);
  };

  const handleResign = (color: "w" | "b") => {
    if (gameOverMessage) return;
    const winner = color === "w" ? "Black" : "White";
    setGameOverMessage(`${color === "w" ? "White" : "Black"} resigned. ${winner} wins!`);
    updateScore(color === "w" ? "b" : "w");
  };

  const handleDraw = () => {
    if (gameOverMessage) return;
    setGameOverMessage("Game agreed to a draw 🤝");
    updateScore("d");
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 max-w-7xl mx-auto w-full">
      {/* Top Controls & Rematch Scoreboard */}
      <div className="flex flex-wrap items-center justify-between w-full bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 mb-6 backdrop-blur-md shadow-lg gap-4">
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6 text-yellow-400" />
          <div className="flex items-center gap-2 font-mono text-sm sm:text-base font-bold text-white">
            <span className="text-emerald-400">White: {score.white}</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-300">Draws: {score.draws}</span>
            <span className="text-slate-400">|</span>
            <span className="text-indigo-400">Black: {score.black}</span>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-slate-900/80 p-1 rounded-lg border border-slate-700">
          <button
            onClick={() => setViewMode("dual")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
              viewMode === "dual"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <SplitSquareVertical className="w-4 h-4" />
            Dual-Board Split
          </button>
          <button
            onClick={() => setViewMode("flip")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
              viewMode === "flip"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <RotateCw className="w-4 h-4" />
            Auto-Flip Board
          </button>
        </div>

        {/* Theme & Controls */}
        <div className="flex items-center gap-2">
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as BoardTheme)}
            className="bg-slate-900 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="classic">Classic Green</option>
            <option value="wood">Walnut Wood</option>
            <option value="glass">Obsidian Glass</option>
            <option value="neon">Cyber Neon</option>
          </select>

          <button
            onClick={resetGame}
            className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors border border-slate-600"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Rematch
          </button>
        </div>
      </div>

      {/* Clocks Bar */}
      <div className="flex items-center justify-between w-full max-w-4xl px-2 mb-3">
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-base font-bold border transition-all ${
            game.turn() === "w" && isClockRunning
              ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 ring-2 ring-emerald-500/40"
              : "bg-slate-800/80 border-slate-700 text-slate-300"
          }`}
        >
          <span>⚪ White:</span>
          <span className={whiteTime < 30 ? "text-red-400 animate-pulse" : ""}>
            {formatTime(whiteTime)}
          </span>
        </div>

        {gameOverMessage && (
          <div className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/50 px-4 py-1.5 rounded-lg text-sm font-semibold animate-bounce text-center">
            {gameOverMessage}
          </div>
        )}

        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-base font-bold border transition-all ${
            game.turn() === "b" && isClockRunning
              ? "bg-indigo-500/20 border-indigo-500 text-indigo-400 ring-2 ring-indigo-500/40"
              : "bg-slate-800/80 border-slate-700 text-slate-300"
          }`}
        >
          <span>⚫ Black:</span>
          <span className={blackTime < 30 ? "text-red-400 animate-pulse" : ""}>
            {formatTime(blackTime)}
          </span>
        </div>
      </div>

      {/* Boards Area */}
      {viewMode === "dual" ? (
        // DUAL-BOARD SIMULTANEOUS SPLIT-SCREEN
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-center justify-center w-full max-w-7xl">
          {/* Left Board: White Perspective */}
          <div className="flex flex-col items-center gap-3 bg-slate-800/40 border border-slate-700/60 p-4 rounded-2xl relative">
            <div className="flex items-center justify-between w-full px-2">
              <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                Player 1 (White's Board)
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {game.turn() === "w" ? "YOUR TURN" : "WAITING FOR OPPONENT"}
              </span>
            </div>

            <Chessboard
              game={game}
              orientation="white"
              onMove={handleMove}
              interactive={game.turn() === "w" && !gameOverMessage}
              theme={theme}
              autoPromoteToQueen={autoQueen}
              lastMove={lastMove}
            />

            <div className="flex items-center gap-2 w-full justify-end mt-1">
              <button
                onClick={() => handleResign("w")}
                disabled={Boolean(gameOverMessage)}
                className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors"
              >
                <Flag className="w-3 h-3" />
                Resign
              </button>
              <button
                onClick={handleDraw}
                disabled={Boolean(gameOverMessage)}
                className="text-xs text-slate-400 hover:text-yellow-400 flex items-center gap-1 transition-colors ml-2"
              >
                <Handshake className="w-3 h-3" />
                Offer Draw
              </button>
            </div>
          </div>

          {/* Right Board: Black Perspective */}
          <div className="flex flex-col items-center gap-3 bg-slate-800/40 border border-slate-700/60 p-4 rounded-2xl relative">
            <div className="flex items-center justify-between w-full px-2">
              <span className="text-sm font-bold text-indigo-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
                Player 2 (Black's Board)
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {game.turn() === "b" ? "YOUR TURN" : "WAITING FOR OPPONENT"}
              </span>
            </div>

            <Chessboard
              game={game}
              orientation="black"
              onMove={handleMove}
              interactive={game.turn() === "b" && !gameOverMessage}
              theme={theme}
              autoPromoteToQueen={autoQueen}
              lastMove={lastMove}
            />

            <div className="flex items-center gap-2 w-full justify-end mt-1">
              <button
                onClick={() => handleResign("b")}
                disabled={Boolean(gameOverMessage)}
                className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors"
              >
                <Flag className="w-3 h-3" />
                Resign
              </button>
              <button
                onClick={handleDraw}
                disabled={Boolean(gameOverMessage)}
                className="text-xs text-slate-400 hover:text-yellow-400 flex items-center gap-1 transition-colors ml-2"
              >
                <Handshake className="w-3 h-3" />
                Offer Draw
              </button>
            </div>
          </div>
        </div>
      ) : (
        // SINGLE BOARD AUTO-FLIP
        <div className="flex flex-col items-center gap-4 bg-slate-800/40 border border-slate-700/60 p-6 rounded-2xl">
          <div className="text-sm font-bold text-slate-300">
            Current Move:{" "}
            <span className={game.turn() === "w" ? "text-emerald-400" : "text-indigo-400"}>
              {game.turn() === "w" ? "White" : "Black"} to play
            </span>
          </div>

          <Chessboard
            game={game}
            orientation={game.turn() === "w" ? "white" : "black"}
            onMove={handleMove}
            interactive={!gameOverMessage}
            theme={theme}
            autoPromoteToQueen={autoQueen}
            lastMove={lastMove}
          />

          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={() => handleResign(game.turn())}
              disabled={Boolean(gameOverMessage)}
              className="text-sm text-slate-400 hover:text-red-400 flex items-center gap-1.5 transition-colors"
            >
              <Flag className="w-4 h-4" />
              Resign
            </button>
            <button
              onClick={handleDraw}
              disabled={Boolean(gameOverMessage)}
              className="text-sm text-slate-400 hover:text-yellow-400 flex items-center gap-1.5 transition-colors"
            >
              <Handshake className="w-4 h-4" />
              Offer Draw
            </button>
          </div>
        </div>
      )}

      {/* Move History Strip */}
      {moveHistory.length > 0 && (
        <div className="w-full max-w-4xl mt-6 bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
            Move Notation History
          </span>
          <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto text-xs font-mono text-slate-200">
            {moveHistory.map((m, idx) => (
              <span
                key={idx}
                className={`px-2 py-0.5 rounded ${
                  idx % 2 === 0 ? "bg-slate-700/60 text-emerald-300" : "bg-slate-700/30 text-indigo-300"
                }`}
              >
                {idx % 2 === 0 ? `${Math.floor(idx / 2) + 1}. ` : ""}
                {m}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
