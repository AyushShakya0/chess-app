"use client";

import React, { useState, useEffect } from "react";
import { X, Sparkles, Loader2, Trophy, ArrowRight, RotateCcw } from "lucide-react";
import { MoveGrade, FullGameAnalysis } from "@/lib/engine/evaluator";
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
        return "bg-[#d4a359]/25 text-[#f0cf85] border-[#d4a359]/50";
      case "inaccuracy":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/50";
      case "mistake":
        return "bg-orange-500/20 text-orange-300 border-orange-500/50";
      case "blunder":
        return "bg-rose-500/20 text-rose-300 border-rose-500/50";
      case "missed_win":
        return "bg-pink-500/20 text-pink-300 border-pink-500/50";
      default:
        return "bg-[#1c202a] text-slate-300 border-[#252a36]";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in" role="dialog" aria-modal="true">
      <div className="relative w-full max-w-4xl bg-[#14171f] border border-[#252a36] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header matching Victory/Analysis Reference */}
        <div className="flex items-center justify-between p-5 border-b border-[#252a36] bg-[#0d0f12]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#d4a359]/15 border border-[#d4a359]/30 rounded-2xl text-[#d4a359] shadow-inner">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white font-display">Match Review & Analysis</h2>
              <p className="text-xs text-slate-400">Sovereign Grandmaster Accuracy & Tactical Metrics</p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close game review"
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-[#1c202a] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <Loader2 className="w-10 h-10 text-[#d4a359] animate-spin" />
              <div>
                <h3 className="text-base font-bold text-white font-display">Analyzing Game Positions</h3>
                <p className="text-xs text-slate-400 max-w-md mt-1">
                  Calibrating move precision, calculating tactical accuracy, and generating positional graph...
                </p>
              </div>
            </div>
          ) : !analysis ? (
            <div className="text-center py-12 text-slate-400 text-sm italic">
              No moves to review. Play a match first!
            </div>
          ) : (
            <>
              {/* Victory Hero Banner if accurate */}
              <div className="text-center py-4 bg-gradient-to-b from-[#1c202a] to-[#0d0f12] rounded-2xl border border-[#252a36] relative overflow-hidden">
                <div className="w-14 h-14 rounded-2xl bg-[#d4a359]/20 text-[#d4a359] border border-[#d4a359]/40 flex items-center justify-center mx-auto mb-2 shadow-lg">
                  <Trophy className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-white font-hero tracking-wide">
                  Match Completed
                </h3>
                <p className="text-xs text-[#f0cf85] font-mono mt-0.5">
                  Accuracy: White {analysis.whiteAccuracy}% &bull; Black {analysis.blackAccuracy}%
                </p>
              </div>

              {/* Accuracy Score Cards */}
              <div className="grid grid-cols-2 gap-4">
                {/* White Player */}
                <div className="bg-[#0d0f12] border border-[#252a36] rounded-2xl p-4 flex flex-col items-center text-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-display">
                    White Accuracy
                  </span>
                  <span className="text-3xl sm:text-4xl font-black text-[#d4a359] font-mono">
                    {analysis.whiteAccuracy}%
                  </span>
                  <span className="text-xs text-slate-300 mt-1">
                    {analysis.whiteAccuracy >= 90 ? "Grandmaster precision" : analysis.whiteAccuracy >= 80 ? "Masterly technical play" : "Sharp competitive battle"}
                  </span>
                </div>

                {/* Black Player */}
                <div className="bg-[#0d0f12] border border-[#252a36] rounded-2xl p-4 flex flex-col items-center text-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-display">
                    Black Accuracy
                  </span>
                  <span className="text-3xl sm:text-4xl font-black text-slate-300 font-mono">
                    {analysis.blackAccuracy}%
                  </span>
                  <span className="text-xs text-slate-300 mt-1">
                    {analysis.blackAccuracy >= 90 ? "Grandmaster precision" : analysis.blackAccuracy >= 80 ? "Masterly technical play" : "Sharp competitive battle"}
                  </span>
                </div>
              </div>

              {/* Move Breakdown Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#0d0f12] p-4 rounded-2xl border border-[#252a36]">
                {/* White Stats */}
                <div className="space-y-1.5 text-xs">
                  <span className="font-bold text-white block mb-2 font-display">White Classifications</span>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(analysis.whiteStats).map(([grade, count]) => {
                      if (count === 0) return null;
                      return (
                        <span key={grade} className={`px-2 py-0.5 rounded-lg border text-[11px] font-semibold capitalize ${getBadgeStyle(grade as MoveGrade)}`}>
                          {count} {grade.replace("_", " ")}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Black Stats */}
                <div className="space-y-1.5 text-xs">
                  <span className="font-bold text-white block mb-2 font-display">Black Classifications</span>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(analysis.blackStats).map(([grade, count]) => {
                      if (count === 0) return null;
                      return (
                        <span key={grade} className={`px-2 py-0.5 rounded-lg border text-[11px] font-semibold capitalize ${getBadgeStyle(grade as MoveGrade)}`}>
                          {count} {grade.replace("_", " ")}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Move List by Turn */}
              <div className="border border-[#252a36] rounded-2xl overflow-hidden bg-[#0d0f12]">
                <div className="px-4 py-2.5 bg-[#14171f] border-b border-[#252a36] flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-display">Move-by-Move Log</span>
                  <span className="text-[11px] text-slate-400 font-mono">Total plies: {analysis.evaluatedMoves.length}</span>
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-[#252a36]/60 font-mono text-xs">
                  {analysis.evaluatedMoves.map((m) => {
                    const isSelected = m.ply === selectedPly;
                    return (
                      <button
                        key={m.ply}
                        onClick={() => setSelectedPly(m.ply)}
                        className={`w-full flex items-center justify-between px-4 py-2 text-left transition-colors ${
                          isSelected ? "bg-[#d4a359]/20 border-l-4 border-[#d4a359]" : "hover:bg-white/5"
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

        {/* Footer with Play Again / Back to Lobby buttons matching the reference image */}
        <div className="p-4 border-t border-[#252a36] bg-[#0d0f12] flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-[#1c202a] hover:bg-[#252a36] text-slate-300 font-bold rounded-xl text-xs transition-all border border-[#252a36]"
          >
            Back to Arena
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gradient-to-r from-[#d4a359] to-[#e2b768] hover:from-[#e2b768] hover:to-[#f0cf85] text-black rounded-xl text-xs font-black transition-all shadow-lg shadow-[#d4a359]/20 font-display flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
};
