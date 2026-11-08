"use client";

import React, { useState, useMemo } from "react";
import { X, Trophy, Sparkles, AlertTriangle, CheckCircle2, ChevronRight, ChevronLeft } from "lucide-react";
import { ChessEvaluator, EvaluatedMove, MoveGrade } from "@/lib/engine/evaluator";

interface GameReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: string[];
}

export const GameReviewModal: React.FC<GameReviewModalProps> = ({ isOpen, onClose, history }) => {
  const [selectedPly, setSelectedPly] = useState<number>(history.length);

  const analysis = useMemo(() => {
    if (!isOpen || history.length === 0) return null;
    return ChessEvaluator.analyzeFullGame(history);
  }, [isOpen, history]);

  if (!isOpen || !analysis) return null;

  const { evaluatedMoves, whiteAccuracy, blackAccuracy, whiteStats, blackStats } = analysis;

  const getBadgeStyle = (grade: MoveGrade) => {
    switch (grade) {
      case "brilliant":
        return "bg-cyan-500/20 text-cyan-300 border-cyan-500/50";
      case "great":
        return "bg-teal-500/20 text-teal-300 border-teal-500/50";
      case "best":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/50";
      case "excellent":
        return "bg-green-500/20 text-green-300 border-green-500/50";
      case "book":
        return "bg-amber-600/20 text-amber-300 border-amber-600/50";
      case "inaccuracy":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/50";
      case "mistake":
        return "bg-orange-500/20 text-orange-300 border-orange-500/50";
      case "blunder":
        return "bg-red-500/20 text-red-300 border-red-500/50";
      case "missed_win":
        return "bg-pink-500/20 text-pink-300 border-pink-500/50";
      default:
        return "bg-slate-700 text-slate-300 border-slate-600";
    }
  };

  const currentMove = evaluatedMoves.find((m) => m.ply === selectedPly) || evaluatedMoves[evaluatedMoves.length - 1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/20 border border-blue-500/40 rounded-xl text-blue-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Full Game Review & Analysis</h2>
              <p className="text-xs text-slate-400">Comprehensive move accuracy and classification</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Accuracy Score Cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* White Player */}
            <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4 flex flex-col items-center text-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                White Accuracy
              </span>
              <span className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono">
                {whiteAccuracy}%
              </span>
              <span className="text-xs text-slate-300 mt-1">
                {whiteAccuracy >= 90 ? "Grandmaster level!" : whiteAccuracy >= 80 ? "Masterly played" : "Solid game"}
              </span>
            </div>

            {/* Black Player */}
            <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4 flex flex-col items-center text-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Black Accuracy
              </span>
              <span className="text-3xl sm:text-4xl font-black text-indigo-400 font-mono">
                {blackAccuracy}%
              </span>
              <span className="text-xs text-slate-300 mt-1">
                {blackAccuracy >= 90 ? "Grandmaster level!" : blackAccuracy >= 80 ? "Masterly played" : "Solid game"}
              </span>
            </div>
          </div>

          {/* Move Grade Breakdown Table */}
          <div className="bg-slate-800/50 border border-slate-700/80 rounded-xl p-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              Move Classification Summary
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
                <span>💎 Brilliant</span>
                <span className="font-mono font-bold">{whiteStats.brilliant + blackStats.brilliant}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                <span>🟢 Best Moves</span>
                <span className="font-mono font-bold">{whiteStats.best + blackStats.best}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-300">
                <span>🟡 Inaccuracies</span>
                <span className="font-mono font-bold">{whiteStats.inaccuracy + blackStats.inaccuracy}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300">
                <span>🔴 Blunders</span>
                <span className="font-mono font-bold">{whiteStats.blunder + blackStats.blunder}</span>
              </div>
            </div>
          </div>

          {/* Interactive Move Step Inspector */}
          {currentMove && (
            <div className="bg-slate-850 border border-slate-700 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Move Inspector (Ply {currentMove.ply})
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${getBadgeStyle(currentMove.grade)}`}>
                  {currentMove.grade.replace("_", " ")}
                </span>
              </div>

              <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-base text-white">
                    {Math.ceil(currentMove.ply / 2)}. {currentMove.turn === "w" ? "" : "... "}
                    {currentMove.san}
                  </span>
                  <span className="text-xs text-slate-400">
                    (Eval: {(currentMove.evalAfter / 100).toFixed(1)})
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSelectedPly((p) => Math.max(1, p - 1))}
                    disabled={selectedPly <= 1}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-md text-white transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedPly((p) => Math.min(evaluatedMoves.length, p + 1))}
                    disabled={selectedPly >= evaluatedMoves.length}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-md text-white transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Move Grid Clickable Chips */}
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
              All Moves in Match
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 bg-slate-950 rounded-xl border border-slate-800">
              {evaluatedMoves.map((m) => (
                <button
                  key={m.ply}
                  onClick={() => setSelectedPly(m.ply)}
                  className={`px-2 py-1 rounded text-xs font-mono font-semibold transition-all border ${
                    selectedPly === m.ply
                      ? "ring-2 ring-blue-500 scale-105"
                      : "opacity-80 hover:opacity-100"
                  } ${getBadgeStyle(m.grade)}`}
                >
                  {m.turn === "w" ? `${Math.ceil(m.ply / 2)}. ` : ""}
                  {m.san}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-lg"
          >
            Done Reviewing
          </button>
        </div>
      </div>
    </div>
  );
};

