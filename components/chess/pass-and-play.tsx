"use client";

import React, { useState, useEffect } from "react";
import { Chess, Square } from "chess.js";
import { Chessboard, BoardTheme } from "./board";
import { sound } from "@/lib/audio/sound";
import {
  RotateCw,
  SplitSquareVertical,
  Trophy,
  RefreshCw,
  Flag,
  Handshake,
  Dices,
  Lock,
  Crown,
  Eye,
  EyeOff,
  Sparkles,
  Zap,
} from "lucide-react";
import confetti from "canvas-confetti";

export type PassVariant = "standard" | "three-check" | "hidden-queen" | "queen-odds" | "knight-odds";

type SecretSetupStep = "white-pick" | "white-done" | "black-pick" | "ready";

const WHITE_STARTING_PAWNS: { square: Square; label: string }[] = [
  { square: "a2", label: "a2 (Flank Sniper)" },
  { square: "b2", label: "b2 (Queenside Spear)" },
  { square: "c2", label: "c2 (Bishop Pawn)" },
  { square: "d2", label: "d2 (Queen Pawn)" },
  { square: "e2", label: "e2 (King Pawn)" },
  { square: "f2", label: "f2 (f-Pawn Strike)" },
  { square: "g2", label: "g2 (Kingside Wing)" },
  { square: "h2", label: "h2 (h-File Assassin)" },
];

const BLACK_STARTING_PAWNS: { square: Square; label: string }[] = [
  { square: "a7", label: "a7 (Flank Sniper)" },
  { square: "b7", label: "b7 (Queenside Spear)" },
  { square: "c7", label: "c7 (Bishop Pawn)" },
  { square: "d7", label: "d7 (Queen Pawn)" },
  { square: "e7", label: "e7 (King Pawn)" },
  { square: "f7", label: "f7 (f-Pawn Strike)" },
  { square: "g7", label: "g7 (Kingside Wing)" },
  { square: "h7", label: "h7 (h-File Assassin)" },
];

// Helper: verifies unobstructed queen line geometry
function isValidQueenMove(game: Chess, from: Square, to: Square, playerColor: "w" | "b"): boolean {
  if (from === to) return false;

  const fromFile = from.charCodeAt(0) - 97; // 0..7
  const fromRank = parseInt(from[1], 10) - 1; // 0..7
  const toFile = to.charCodeAt(0) - 97;
  const toRank = parseInt(to[1], 10) - 1;

  const dx = toFile - fromFile;
  const dy = toRank - fromRank;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  const isOrthogonal = (absDx === 0 && absDy > 0) || (absDx > 0 && absDy === 0);
  const isDiagonal = absDx === absDy && absDx > 0;

  if (!isOrthogonal && !isDiagonal) return false;

  const stepX = dx === 0 ? 0 : dx > 0 ? 1 : -1;
  const stepY = dy === 0 ? 0 : dy > 0 ? 1 : -1;

  let currX = fromFile + stepX;
  let currY = fromRank + stepY;

  while (currX !== toFile || currY !== toRank) {
    const sqName = `${String.fromCharCode(97 + currX)}${currY + 1}` as Square;
    if (game.get(sqName)) {
      return false; // Path blocked
    }
    currX += stepX;
    currY += stepY;
  }

  const targetPiece = game.get(to);
  if (targetPiece) {
    if (targetPiece.color === playerColor) return false;
    if (targetPiece.type === "k") return false; // Cannot capture king directly
  }

  return true;
}

// Helper: moves a disguised piece with queen movement and updates FEN turn
function executeQueenMove(
  game: Chess,
  from: Square,
  to: Square,
  color: "w" | "b"
): { captured?: { type: string; color: string } } {
  const movingPiece = game.remove(from);
  const targetPiece = game.get(to);
  let captured: { type: string; color: string } | undefined = undefined;

  if (targetPiece) {
    captured = { type: targetPiece.type, color: targetPiece.color };
    game.remove(to);
  }

  // Preserve pawn visual disguise
  game.put(movingPiece || { type: "p", color }, to);

  const fenParts = game.fen().split(" ");
  fenParts[1] = color === "w" ? "b" : "w"; // flip turn
  fenParts[3] = "-"; // clear en-passant
  fenParts[4] = String(Number(fenParts[4]) + 1);
  if (color === "b") {
    fenParts[5] = String(Number(fenParts[5]) + 1);
  }

  game.load(fenParts.join(" "));
  return { captured };
}

export const PassAndPlay: React.FC = () => {
  const [variant, setVariant] = useState<PassVariant>("standard");
  const [game, setGame] = useState<Chess>(new Chess());
  const [viewMode, setViewMode] = useState<"dual" | "flip">("dual");
  const [theme, setTheme] = useState<BoardTheme>("classic");
  const [autoQueen] = useState(true);

  // Variant trackers
  const [whiteChecks, setWhiteChecks] = useState(0);
  const [blackChecks, setBlackChecks] = useState(0);

  // Secret Queen Setup & Tracking
  const [secretSetupStep, setSecretSetupStep] = useState<SecretSetupStep>("ready");
  const [whitePickedPawn, setWhitePickedPawn] = useState<Square>("e2");
  const [blackPickedPawn, setBlackPickedPawn] = useState<Square>("e7");
  const [whiteSecretSquare, setWhiteSecretSquare] = useState<Square | null>("e2");
  const [blackSecretSquare, setBlackSecretSquare] = useState<Square | null>("e7");
  const [secretAnnouncement, setSecretAnnouncement] = useState<string | null>(null);

  // Time controls
  const [timeControl] = useState<number>(300); // 5 min default
  const [whiteTime, setWhiteTime] = useState<number>(300);
  const [blackTime, setBlackTime] = useState<number>(300);
  const [isClockRunning, setIsClockRunning] = useState<boolean>(false);

  // Score Tracker
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
    if (!isClockRunning || gameOverMessage || secretSetupStep !== "ready") return;

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
  }, [isClockRunning, game.turn(), gameOverMessage, secretSetupStep]);

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

  // Custom Move Interceptor: Allows the Secret Queen pawn to move as a Queen
  // Fog of war: legal moves displayed on board remain pawn moves, but clicking/dragging to queen squares is accepted!
  const handleCustomMove = (from: Square, to: Square): boolean => {
    if (variant !== "hidden-queen" || gameOverMessage || secretSetupStep !== "ready") return false;

    const currentTurn = game.turn();

    if (currentTurn === "w" && whiteSecretSquare && from === whiteSecretSquare) {
      if (isValidQueenMove(game, from, to, "w")) {
        // Execute queen movement
        const wasCaptured = to === blackSecretSquare;
        const res = executeQueenMove(game, from, to, "w");

        if (res.captured) sound.playCapture();
        else sound.playMove();

        if (game.inCheck()) {
          setTimeout(() => sound.playCheck(), 100);
        }

        // Update tracking
        setWhiteSecretSquare(to);
        if (wasCaptured) {
          setBlackSecretSquare(null);
          setSecretAnnouncement("💥 White's Secret Queen captured Black's Secret Queen!");
          sound.playVictory();
          setTimeout(() => setSecretAnnouncement(null), 4000);
        } else {
          setSecretAnnouncement(`✨ White unleashed Secret Queen power from ${from} to ${to}!`);
          setTimeout(() => setSecretAnnouncement(null), 3000);
        }

        setLastMove({ from, to });
        setGame(new Chess(game.fen()));
        setMoveHistory(game.history());
        setIsClockRunning(true);

        checkPostMoveState("w");
        return true;
      }
    } else if (currentTurn === "b" && blackSecretSquare && from === blackSecretSquare) {
      if (isValidQueenMove(game, from, to, "b")) {
        const wasCaptured = to === whiteSecretSquare;
        const res = executeQueenMove(game, from, to, "b");

        if (res.captured) sound.playCapture();
        else sound.playMove();

        if (game.inCheck()) {
          setTimeout(() => sound.playCheck(), 100);
        }

        setBlackSecretSquare(to);
        if (wasCaptured) {
          setWhiteSecretSquare(null);
          setSecretAnnouncement("💥 Black's Secret Queen captured White's Secret Queen!");
          sound.playVictory();
          setTimeout(() => setSecretAnnouncement(null), 4000);
        } else {
          setSecretAnnouncement(`✨ Black unleashed Secret Queen power from ${from} to ${to}!`);
          setTimeout(() => setSecretAnnouncement(null), 3000);
        }

        setLastMove({ from, to });
        setGame(new Chess(game.fen()));
        setMoveHistory(game.history());
        setIsClockRunning(true);

        checkPostMoveState("b");
        return true;
      }
    }

    return false;
  };

  // Standard move handler
  const handleMove = (move: { from: Square; to: Square; promotion?: string }) => {
    if (!isClockRunning) {
      setIsClockRunning(true);
    }

    // Keep secret queen tracking synchronized if piece moves via standard pawn moves
    if (variant === "hidden-queen") {
      if (move.from === whiteSecretSquare) {
        setWhiteSecretSquare(move.to);
      } else if (move.from === blackSecretSquare) {
        setBlackSecretSquare(move.to);
      }

      // Check if secret queen was captured by standard move
      if (move.to === whiteSecretSquare) {
        setWhiteSecretSquare(null);
        setSecretAnnouncement("💥 Black captured White's Secret Queen!");
        setTimeout(() => setSecretAnnouncement(null), 3500);
      } else if (move.to === blackSecretSquare) {
        setBlackSecretSquare(null);
        setSecretAnnouncement("💥 White captured Black's Secret Queen!");
        setTimeout(() => setSecretAnnouncement(null), 3500);
      }
    }

    setLastMove({ from: move.from, to: move.to });
    setMoveHistory(game.history());

    // 3-Check rule verification
    if (variant === "three-check") {
      if (game.inCheck()) {
        if (game.turn() === "b") {
          const count = whiteChecks + 1;
          setWhiteChecks(count);
          if (count >= 3) {
            setGameOverMessage("White delivered 3 checks and won the 3-Check match! 🏆");
            sound.playVictory();
            confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 } });
            updateScore("w");
            return;
          }
        } else {
          const count = blackChecks + 1;
          setBlackChecks(count);
          if (count >= 3) {
            setGameOverMessage("Black delivered 3 checks and won the 3-Check match! 🏆");
            sound.playVictory();
            confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 } });
            updateScore("b");
            return;
          }
        }
      }
    }

    checkPostMoveState(game.turn() === "w" ? "b" : "w");
  };

  const checkPostMoveState = (lastMover: "w" | "b") => {
    if (game.isCheckmate()) {
      const winner = lastMover === "w" ? "White" : "Black";
      setGameOverMessage(`Checkmate! ${winner} wins! 🏆`);
      sound.playVictory();
      confetti({ particleCount: 130, spread: 70, origin: { y: 0.6 } });
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

  const resetGame = (newVariant: PassVariant = variant) => {
    setVariant(newVariant);
    let fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    if (newVariant === "queen-odds") {
      fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNB1KBNR w KQkq - 0 1";
    } else if (newVariant === "knight-odds") {
      fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/R1BQKBNR w KQkq - 0 1";
    }
    setGame(new Chess(fen));
    setWhiteTime(timeControl);
    setBlackTime(timeControl);
    setIsClockRunning(false);
    setGameOverMessage(null);
    setMoveHistory([]);
    setLastMove(null);
    setWhiteChecks(0);
    setBlackChecks(0);
    setSecretAnnouncement(null);

    if (newVariant === "hidden-queen") {
      setSecretSetupStep("white-pick");
    } else {
      setSecretSetupStep("ready");
    }
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

  // Responsive board size class for dual side-by-side mode (left and right with no vertical stacking)
  const dualBoardSizeClass =
    "w-[155px] h-[155px] xs:w-[210px] xs:h-[210px] sm:w-[270px] sm:h-[270px] md:w-[330px] md:h-[330px] lg:w-[400px] lg:h-[400px] xl:w-[460px] xl:h-[460px]";

  return (
    <div className="flex flex-col items-center justify-center p-3 sm:p-4 max-w-7xl mx-auto w-full">
      {/* Top Controls & Rematch Scoreboard */}
      <div className="flex flex-wrap items-center justify-between w-full bg-slate-800/90 border border-slate-700/80 rounded-xl p-3 sm:p-4 mb-4 backdrop-blur-md shadow-lg gap-3">
        <div className="flex items-center gap-3">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <div className="flex items-center gap-2 font-mono text-xs sm:text-sm font-bold text-white">
            <span className="text-emerald-400">White: {score.white}</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-300">Draws: {score.draws}</span>
            <span className="text-slate-400">|</span>
            <span className="text-indigo-400">Black: {score.black}</span>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-lg border border-slate-700">
          <button
            onClick={() => setViewMode("dual")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
              viewMode === "dual" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <SplitSquareVertical className="w-4 h-4" />
            Side-by-Side Dual Boards
          </button>
          <button
            onClick={() => setViewMode("flip")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
              viewMode === "flip" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <RotateCw className="w-4 h-4" />
            Auto-Flip Board
          </button>
        </div>

        {/* Theme & Reset */}
        <div className="flex items-center gap-2">
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as BoardTheme)}
            className="bg-slate-900 text-slate-200 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="classic">Classic Green</option>
            <option value="wood">Walnut Wood</option>
            <option value="glass">Obsidian Glass</option>
            <option value="neon">Cyber Neon</option>
          </select>

          <button
            onClick={() => resetGame(variant)}
            className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-slate-600"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Variant Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 mb-4 gap-2">
        <div className="flex items-center gap-2">
          <Dices className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Mode:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {([
            { id: "standard", name: "Standard Chess" },
            { id: "hidden-queen", name: "The Hidden Queen" },
            { id: "three-check", name: "3-Check Chess" },
            { id: "queen-odds", name: "Queen Odds" },
            { id: "knight-odds", name: "Knight Odds" },
          ] as { id: PassVariant; name: string }[]).map((v) => (
            <button
              key={v.id}
              onClick={() => resetGame(v.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                variant === v.id
                  ? "bg-purple-600 text-white shadow-md ring-1 ring-purple-400"
                  : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
              }`}
            >
              {v.name}
            </button>
          ))}
        </div>
      </div>

      {/* Secret Queen Notification / Fog of War Banner */}
      {variant === "hidden-queen" && (
        <div className="flex flex-wrap items-center justify-between w-full max-w-4xl mb-3 p-2.5 bg-purple-950/60 border border-purple-800/80 rounded-xl text-xs font-medium text-purple-200 gap-2">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-400" />
            <span>
              White: <strong>🔒 Secret Queen Active</strong> &bull; Black: <strong>🔒 Secret Queen Active</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-purple-300 italic">
              Disguised as pawns. Can slide and capture as a Queen!
            </span>
            <button
              onClick={() => setSecretSetupStep("white-pick")}
              className="px-2 py-0.5 bg-purple-800 hover:bg-purple-700 text-white text-[11px] font-bold rounded"
            >
              Reselect
            </button>
          </div>
        </div>
      )}

      {/* Secret Queen Move Announcement */}
      {secretAnnouncement && (
        <div className="w-full max-w-xl mb-3 p-2 bg-gradient-to-r from-amber-500/20 to-purple-500/20 border border-amber-500/50 rounded-xl text-center text-xs font-bold text-amber-300 animate-fade-in flex items-center justify-center gap-2 shadow-lg">
          <Sparkles className="w-4 h-4 text-amber-400" />
          {secretAnnouncement}
        </div>
      )}

      {/* 3-Check Status Header */}
      {variant === "three-check" && (
        <div className="flex items-center justify-center gap-6 w-full max-w-xl mb-3 p-2 bg-purple-950/60 border border-purple-800/80 rounded-xl text-xs font-bold">
          <span className="text-emerald-400">White Checks: {whiteChecks} / 3</span>
          <span className="text-purple-300 font-extrabold uppercase tracking-wider">3 Checks Win</span>
          <span className="text-indigo-400">Black Checks: {blackChecks} / 3</span>
        </div>
      )}

      {/* Clocks Bar */}
      <div className="flex items-center justify-between w-full max-w-4xl px-2 mb-3">
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-sm font-bold border transition-all ${
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
          <div className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/50 px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold animate-bounce text-center">
            {gameOverMessage}
          </div>
        )}

        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-sm font-bold border transition-all ${
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
        // DUAL-BOARD STRICTLY SIDE-BY-SIDE (LEFT AND RIGHT)
        <div className="grid grid-cols-2 gap-3 sm:gap-6 items-start justify-center w-full max-w-7xl">
          {/* Left Board: White Perspective */}
          <div className="flex flex-col items-center gap-2 bg-slate-800/40 border border-slate-700/60 p-2 sm:p-4 rounded-2xl relative shadow-xl">
            <div className="flex items-center justify-between w-full px-1">
              <span className="text-xs sm:text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${game.turn() === "w" ? "bg-emerald-400 animate-ping" : "bg-slate-600"}`} />
                Player 1 (White)
              </span>
              <span className="text-[10px] sm:text-xs text-slate-400 font-mono font-bold">
                {game.turn() === "w" ? "YOUR TURN" : "WAITING"}
              </span>
            </div>

            <Chessboard
              game={game}
              orientation="white"
              onMove={handleMove}
              customMoveHandler={handleCustomMove}
              interactive={game.turn() === "w" && !gameOverMessage && secretSetupStep === "ready"}
              theme={theme}
              autoPromoteToQueen={autoQueen}
              lastMove={lastMove}
              boardSizeClass={dualBoardSizeClass}
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
                Draw
              </button>
            </div>
          </div>

          {/* Right Board: Black Perspective */}
          <div className="flex flex-col items-center gap-2 bg-slate-800/40 border border-slate-700/60 p-2 sm:p-4 rounded-2xl relative shadow-xl">
            <div className="flex items-center justify-between w-full px-1">
              <span className="text-xs sm:text-sm font-bold text-indigo-400 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${game.turn() === "b" ? "bg-indigo-400 animate-ping" : "bg-slate-600"}`} />
                Player 2 (Black)
              </span>
              <span className="text-[10px] sm:text-xs text-slate-400 font-mono font-bold">
                {game.turn() === "b" ? "YOUR TURN" : "WAITING"}
              </span>
            </div>

            <Chessboard
              game={game}
              orientation="black"
              onMove={handleMove}
              customMoveHandler={handleCustomMove}
              interactive={game.turn() === "b" && !gameOverMessage && secretSetupStep === "ready"}
              theme={theme}
              autoPromoteToQueen={autoQueen}
              lastMove={lastMove}
              boardSizeClass={dualBoardSizeClass}
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
                Draw
              </button>
            </div>
          </div>
        </div>
      ) : (
        // SINGLE BOARD AUTO-FLIP
        <div className="flex flex-col items-center gap-3 bg-slate-800/40 border border-slate-700/60 p-4 sm:p-6 rounded-2xl">
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
            customMoveHandler={handleCustomMove}
            interactive={!gameOverMessage && secretSetupStep === "ready"}
            theme={theme}
            autoPromoteToQueen={autoQueen}
            lastMove={lastMove}
          />

          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={() => handleResign(game.turn())}
              disabled={Boolean(gameOverMessage)}
              className="text-xs sm:text-sm text-slate-400 hover:text-red-400 flex items-center gap-1.5 transition-colors"
            >
              <Flag className="w-4 h-4" />
              Resign
            </button>
            <button
              onClick={handleDraw}
              disabled={Boolean(gameOverMessage)}
              className="text-xs sm:text-sm text-slate-400 hover:text-yellow-400 flex items-center gap-1.5 transition-colors"
            >
              <Handshake className="w-4 h-4" />
              Offer Draw
            </button>
          </div>
        </div>
      )}

      {/* Move History Strip */}
      {moveHistory.length > 0 && (
        <div className="w-full max-w-4xl mt-5 bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Move Notation History
          </span>
          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto text-xs font-mono text-slate-200">
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

      {/* Secret Queen Setup Flow Modal */}
      {variant === "hidden-queen" && secretSetupStep !== "ready" && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-purple-500/60 rounded-2xl p-6 max-w-lg w-full shadow-2xl flex flex-col items-center text-center">
            {secretSetupStep === "white-pick" && (
              <>
                <div className="w-12 h-12 bg-amber-500/20 border border-amber-500/40 rounded-2xl flex items-center justify-center mb-3">
                  <Crown className="w-7 h-7 text-amber-400" />
                </div>
                <h3 className="text-lg font-black text-white mb-1">
                  👑 Player 1 (White): Choose Your Secret Queen
                </h3>
                <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                  Secretly select which of your 8 starting pawns will carry Queen powers. Keep your screen hidden from Black!
                </p>

                <div className="grid grid-cols-4 gap-2 w-full mb-5">
                  {WHITE_STARTING_PAWNS.map((p) => (
                    <button
                      key={p.square}
                      onClick={() => setWhitePickedPawn(p.square)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                        whitePickedPawn === p.square
                          ? "bg-amber-500/20 border-amber-400 text-amber-300 ring-2 ring-amber-400 shadow-lg scale-105"
                          : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750"
                      }`}
                    >
                      <span className="font-mono font-black text-sm uppercase">{p.square}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{p.label.split("(")[1]?.replace(")", "")}</span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setSecretSetupStep("white-done")}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black rounded-xl text-xs sm:text-sm shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  Lock Choice & Pass to Black
                </button>
              </>
            )}

            {secretSetupStep === "white-done" && (
              <>
                <div className="w-14 h-14 bg-blue-500/20 border border-blue-500/40 rounded-2xl flex items-center justify-center mb-4">
                  <Lock className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-black text-white mb-1">Choice Locked! 🔒</h3>
                <p className="text-xs text-slate-300 mb-6 leading-relaxed max-w-sm">
                  White's Secret Queen is safely sealed. Hand over the device or step aside for Player 2 (Black).
                </p>

                <button
                  onClick={() => setSecretSetupStep("black-pick")}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-xs sm:text-sm shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <span>I am Player 2 (Black) &bull; Select Secret Queen</span>
                  <Eye className="w-4 h-4" />
                </button>
              </>
            )}

            {secretSetupStep === "black-pick" && (
              <>
                <div className="w-12 h-12 bg-indigo-500/20 border border-indigo-500/40 rounded-2xl flex items-center justify-center mb-3">
                  <Crown className="w-7 h-7 text-indigo-400" />
                </div>
                <h3 className="text-lg font-black text-white mb-1">
                  👑 Player 2 (Black): Choose Your Secret Queen
                </h3>
                <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                  Secretly select which of your 8 starting pawns will carry Queen powers. Keep your screen hidden from White!
                </p>

                <div className="grid grid-cols-4 gap-2 w-full mb-5">
                  {BLACK_STARTING_PAWNS.map((p) => (
                    <button
                      key={p.square}
                      onClick={() => setBlackPickedPawn(p.square)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                        blackPickedPawn === p.square
                          ? "bg-indigo-500/20 border-indigo-400 text-indigo-300 ring-2 ring-indigo-400 shadow-lg scale-105"
                          : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750"
                      }`}
                    >
                      <span className="font-mono font-black text-sm uppercase">{p.square}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{p.label.split("(")[1]?.replace(")", "")}</span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    setWhiteSecretSquare(whitePickedPawn);
                    setBlackSecretSquare(blackPickedPawn);
                    setSecretSetupStep("ready");
                    sound.playVictory();
                  }}
                  className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-black rounded-xl text-xs sm:text-sm shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Lock Choice & Start Match!
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
