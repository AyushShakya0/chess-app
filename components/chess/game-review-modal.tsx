"use client";

import React, { useState, useEffect } from "react";
import { X, Sparkles, Loader2, Award, Zap, AlertTriangle } from "lucide-react";
import { EvaluatedMove, MoveGrade, FullGameAnalysis } from "@/lib/engine/evaluator";
import { engineClient } from "@/lib/engine/engine-client";

interface GameReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: string[];
}

export const GameReviewModal: React.FC<GameReviewModalProps> = ({ isOpen, onClose, history }) => {
  const [selectedPly, setSelectedPly] = useState<number>(history.length);
  const [analysis, setAnalysis] = useState<FullGameAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (!isOpen || history.length === 0) {
      setAnalysis(null);
      return;
    }
    let active = true;
    setIsAnalyzing(true);
    engineClient.analyzeFullGame(history).then((res) => {
      if (active) {
        setAnalysis(res);
        setSelectedPly(history.length);
        setIsAnalyzing(false);
      }
    });
    return () => {
      active = false;
    };
  }, [isOpen, history]);

  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" role="dialog" aria-modal="true">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/20 border border-blue-500/40 rounded-xl text-blue-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Full Game Review & Analysis</h2>
              <p className="text-xs text-slate-400">Worker-accelerated move grading and accuracy metrics</p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close game review"
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
              <div>
                <h3 className="text-base font-bold text-white">Analyzing Game Moves</h3>
                <p className="text-xs text-slate-400 max-w-md mt-1">
                  Calibrating move accuracy, detecting tactical mistakes, and computing positional advantage...
                </p>
              </div>
            </div>
          ) : !analysis ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No moves to review. Play a game first!
            </div>
          ) : (
            <>
              {/* Accuracy Score Cards */}
              <div className="grid grid-cols-2 gap-4">
                {/* White Player */}
                <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4 flex flex-col items-center text-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    White Accuracy
                  </span>
                  <span className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono">
                    {analysis.whiteAccuracy}%
                  </span>
                  <span className="text-xs text-slate-300 mt-1">
                    {analysis.whiteAccuracy >= 90 ? "Grandmaster precision" : analysis.whiteAccuracy >= 80 ? "Solid masterly play" : "Sharp tactical contest"}
                  </span>
                </div>

                {/* Black Player */}
                <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4 flex flex-col items-center text-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Black Accuracy
                  </span>
                  <span className="text-3xl sm:text-4xl font-black text-indigo-400 font-mono">
                    {analysis.blackAccuracy}%
                  </span>
                  <span className="text-xs text-slate-300 mt-1">
                    {analysis.blackAccuracy >= 90 ? "Grandmaster precision" : analysis.blackAccuracy >= 80 ? "Solid masterly play" : "Sharp tactical contest"}
                  </span>
                </div>
              </div>

              {/* Move Breakdown Badges */}
              <div className="grid grid-cols-2 gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                {/* White Stats */}
                <div className="space-y-1.5 text-xs">
                  <span className="font-bold text-slate-300 block mb-2">White Classifications</span>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(analysis.whiteStats).map(([grade, count]) => {
                      if (count === 0) return null;
                      return (
                        <span key={grade} className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold capitalize ${getBadgeStyle(grade as MoveGrade)}`}>
                          {count} {grade.replace("_", " ")}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Black Stats */}
                <div className="space-y-1.5 text-xs">
                  <span className="font-bold text-slate-300 block mb-2">Black Classifications</span>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(analysis.blackStats).map(([grade, count]) => {
                      if (count === 0) return null;
                      return (
                        <span key={grade} className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold capitalize ${getBadgeStyle(grade as MoveGrade)}`}>
                          {count} {grade.replace("_", " ")}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Move List by Turn */}
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-800/80 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Move-by-Move Log</span>
                  <span className="text-[11px] text-slate-400">Total plies: {analysis.evaluatedMoves.length}</span>
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/60 font-mono text-xs">
                  {analysis.evaluatedMoves.map((m) => {
                    const isSelected = m.ply === selectedPly;
                    return (
                      <button
                        key={m.ply}
                        onClick={() => setSelectedPly(m.ply)}
                        className={`w-full flex items-center justify-between px-4 py-2 text-left transition-colors ${
                          isSelected ? "bg-blue-600/25 border-l-4 border-blue-500" : "hover:bg-slate-800/40"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500 w-8">
                            {Math.ceil(m.ply / 2)}.
                          </span>
                          <span className="font-bold text-white w-14">{m.san}</span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-sans font-bold capitalize border ${getBadgeStyle(m.grade)}`}>
                            {m.grade.replace("_", " ")}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Eval: {m.evalAfter >= 0 ? `+${(m.evalAfter / 100).toFixed(2)}` : (m.evalAfter / 100).toFixed(2)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
