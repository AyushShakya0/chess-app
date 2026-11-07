"use client";

import React, { useState } from "react";
import { Chess, Square } from "chess.js";
import { Chessboard } from "./board";
import { sound } from "@/lib/audio/sound";
import { Dices, EyeOff, ShieldAlert, Award, RefreshCw, Check } from "lucide-react";
import confetti from "canvas-confetti";

export type VariantType = "hidden-queen" | "three-check" | "handicap";

export const VariantsPlay: React.FC = () => {
  const [selectedVariant, setSelectedVariant] = useState<VariantType>("three-check");
  const [game, setGame] = useState<Chess>(new Chess());
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [gameOver, setGameOver] = useState<string | null>(null);

  // 3-Check Mode counters
  const [whiteChecksGiven, setWhiteChecksGiven] = useState(0);
  const [blackChecksGiven, setBlackChecksGiven] = useState(0);

  // Hidden Queen Mode state
  const [whiteHiddenPawn, setWhiteHiddenPawn] = useState<Square | null>("e2");
  const [blackHiddenPawn, setBlackHiddenPawn] = useState<Square | null>("e7");
  const [hiddenQueenPhase, setHiddenQueenPhase] = useState<"selecting" | "playing">("selecting");
  const [hiddenQueenRevealed, setHiddenQueenRevealed] = useState<boolean>(false);

  // Handicap preset
  const [handicapType, setHandicapType] = useState<"queen-odds" | "rook-odds" | "double-queen">("queen-odds");

  // Reset Game on variant switch
  const resetVariant = (variant: VariantType = selectedVariant) => {
    setSelectedVariant(variant);
    setGameOver(null);
    setLastMove(null);
    setWhiteChecksGiven(0);
    setBlackChecksGiven(0);
    setHiddenQueenRevealed(false);

    if (variant === "handicap") {
      let fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
      if (handicapType === "queen-odds") {
        // Remove White's queen (d1)
        fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNB1KBNR w KQkq - 0 1";
      } else if (handicapType === "rook-odds") {
        // Remove White's a1 rook
        fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/1NBQKBNR w Kkq - 0 1";
      }
      setGame(new Chess(fen));
    } else {
      setGame(new Chess());
    }

    if (variant === "hidden-queen") {
      setHiddenQueenPhase("selecting");
    }
  };

  const handleMove = (m: { from: Square; to: Square; promotion?: string }) => {
    setLastMove({ from: m.from, to: m.to });

    // 3-Check Logic
    if (selectedVariant === "three-check") {
      if (game.inCheck()) {
        if (game.turn() === "b") {
          // White just delivered check
          const count = whiteChecksGiven + 1;
          setWhiteChecksGiven(count);
          if (count >= 3) {
            setGameOver("White delivered 3 checks and won the 3-Check Match! 🏆");
            sound.playVictory();
            confetti({ particleCount: 140, spread: 75, origin: { y: 0.6 } });
            return;
          }
        } else {
          // Black just delivered check
          const count = blackChecksGiven + 1;
          setBlackChecksGiven(count);
          if (count >= 3) {
            setGameOver("Black delivered 3 checks and won the 3-Check Match! 🏆");
            sound.playVictory();
            confetti({ particleCount: 140, spread: 75, origin: { y: 0.6 } });
            return;
          }
        }
      }
    }

    // Hidden Queen Logic
    if (selectedVariant === "hidden-queen" && !hiddenQueenRevealed) {
      if (m.from === whiteHiddenPawn || m.from === blackHiddenPawn) {
        setHiddenQueenRevealed(true);
        sound.playCheck();
      }
    }

    if (game.isCheckmate()) {
      const winner = game.turn() === "w" ? "Black" : "White";
      setGameOver(`Checkmate! ${winner} wins! 🏆`);
      sound.playVictory();
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 max-w-7xl mx-auto w-full">
      {/* Header & Mode Selector */}
      <div className="flex flex-wrap items-center justify-between w-full bg-slate-800/80 border border-slate-700 rounded-2xl p-4 mb-6 shadow-xl backdrop-blur-md gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/20 border border-purple-500/40 rounded-xl text-purple-400">
            <Dices className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Chess Variants Lab</h2>
            <p className="text-xs text-slate-400">Play thrilling variations and custom game modes</p>
          </div>
        </div>

        {/* Variant Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => resetVariant("three-check")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedVariant === "three-check" ? "bg-purple-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            3-Check Chess
          </button>

          <button
            onClick={() => resetVariant("hidden-queen")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedVariant === "hidden-queen" ? "bg-purple-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            The Hidden Queen
          </button>

          <button
            onClick={() => resetVariant("handicap")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedVariant === "handicap" ? "bg-purple-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            Handicap Odds
          </button>
        </div>
      </div>

      {/* Main Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
        {/* Left: Board */}
        <div className="lg:col-span-8 flex flex-col items-center">
          {/* Status Indicator */}
          {selectedVariant === "three-check" && (
            <div className="flex items-center justify-between w-full max-w-[600px] mb-3 px-2">
              <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                <span className="text-xs font-bold text-emerald-400">White Checks:</span>
                <span className="font-mono font-black text-sm text-white">{whiteChecksGiven} / 3</span>
              </div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                Deliver 3 Checks to Win!
              </span>
              <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                <span className="text-xs font-bold text-indigo-400">Black Checks:</span>
                <span className="font-mono font-black text-sm text-white">{blackChecksGiven} / 3</span>
              </div>
            </div>
          )}

          <Chessboard
            game={game}
            orientation="white"
            onMove={handleMove}
            interactive={!gameOver}
            lastMove={lastMove}
          />

          {gameOver && (
            <div className="mt-4 bg-yellow-500/20 text-yellow-300 border border-yellow-500/50 px-6 py-2.5 rounded-xl text-sm font-bold animate-bounce text-center">
              {gameOver}
            </div>
          )}
        </div>

        {/* Right: Variant Rule Guide & Controls */}
        <div className="lg:col-span-4 flex flex-col gap-4 w-full">
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-xl">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              {selectedVariant === "three-check" && "⚡ 3-Check Chess Rules"}
              {selectedVariant === "hidden-queen" && "👑 The Hidden Queen Rules"}
              {selectedVariant === "handicap" && "⚖️ Handicap / Odds Mode"}
            </h3>

            {selectedVariant === "three-check" && (
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                In addition to normal checkmate, you can win the game instantly by delivering **3 checks** to the opponent's king. Play ultra-aggressively to hunt the king!
              </p>
            )}

            {selectedVariant === "hidden-queen" && (
              <div className="space-y-3 text-xs text-slate-300 leading-relaxed mb-4">
                <p>
                  One of your starting pawns is secretly a Queen in disguise! The opponent cannot tell which pawn it is until it moves with Queen powers or captures.
                </p>
                {hiddenQueenPhase === "selecting" ? (
                  <div className="bg-slate-900 border border-purple-500/40 p-3 rounded-xl">
                    <span className="font-bold text-purple-300 block mb-1">Secret Selection:</span>
                    <span className="text-[11px] text-slate-400">
                      White designated pawn: <strong>{whiteHiddenPawn?.toUpperCase()}</strong>
                    </span>
                    <button
                      onClick={() => setHiddenQueenPhase("playing")}
                      className="mt-2.5 w-full py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-xs"
                    >
                      Lock In Secret Queen & Play
                    </button>
                  </div>
                ) : (
                  <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 p-2.5 rounded-xl font-bold text-xs flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" />
                    Secret Queen is active on the board!
                  </div>
                )}
              </div>
            )}

            {selectedVariant === "handicap" && (
              <div className="space-y-3 mb-4">
                <p className="text-xs text-slate-300">
                  Select a material handicap configuration to challenge yourself or balance games between players of different skill levels:
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => {
                      setHandicapType("queen-odds");
                      resetVariant("handicap");
                    }}
                    className={`p-2.5 rounded-xl border text-left font-bold ${
                      handicapType === "queen-odds" ? "bg-purple-600 text-white border-purple-500" : "bg-slate-900 border-slate-700 text-slate-300"
                    }`}
                  >
                    Queen Odds (No Q)
                  </button>
                  <button
                    onClick={() => {
                      setHandicapType("rook-odds");
                      resetVariant("handicap");
                    }}
                    className={`p-2.5 rounded-xl border text-left font-bold ${
                      handicapType === "rook-odds" ? "bg-purple-600 text-white border-purple-500" : "bg-slate-900 border-slate-700 text-slate-300"
                    }`}
                  >
                    Rook Odds (No R)
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => resetVariant()}
              className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-xl text-xs font-bold transition-colors border border-slate-600"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Match
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
