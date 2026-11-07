"use client";

import React from "react";

interface EvalBarProps {
  scoreCentipawns: number; // Positive = White ahead, Negative = Black ahead
  funMode?: boolean; // If true, only reveals every 5 moves
  moveCount?: number;
  heightClass?: string;
}

export const EvalBar: React.FC<EvalBarProps> = ({
  scoreCentipawns,
  funMode = false,
  moveCount = 0,
  heightClass = "h-[320px] sm:h-[460px] md:h-[540px] lg:h-[600px]",
}) => {
  // If fun mode is active, check if current move is multiple of 5
  const isRevealed = !funMode || (moveCount > 0 && moveCount % 5 === 0);

  // Convert centipawns to percentage between 5% and 95%
  // Using sigmoid formula: 50 + 50 * (2 / (1 + exp(-0.004 * score)) - 1)
  const normalized = Math.max(-1000, Math.min(1000, scoreCentipawns));
  const whitePercent = Math.round(
    50 + 50 * (2 / (1 + Math.exp(-0.0035 * normalized)) - 1)
  );
  const clampedPercent = Math.max(5, Math.min(95, whitePercent));

  const formatScore = (cp: number) => {
    if (Math.abs(cp) >= 9000) {
      return cp > 0 ? "+M" : "-M";
    }
    const val = (cp / 100).toFixed(1);
    return cp > 0 ? `+${val}` : val;
  };

  if (!isRevealed) {
    return (
      <div className={`w-7 sm:w-8 ${heightClass} bg-slate-900 border border-slate-800 rounded-lg flex flex-col items-center justify-center p-1 text-center shadow-lg`}>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest -rotate-90">
          Fun Eval
        </span>
        <span className="text-[9px] font-mono text-slate-600 mt-2">
          {5 - (moveCount % 5)} left
        </span>
      </div>
    );
  }

  return (
    <div
      className={`relative w-7 sm:w-8 ${heightClass} bg-slate-900 border border-slate-700/80 rounded-lg overflow-hidden flex flex-col justify-end shadow-2xl transition-all duration-300 ${
        funMode ? "ring-2 ring-amber-400 animate-pulse" : ""
      }`}
    >
      {/* Black evaluation section (top) */}
      <div className="absolute top-1.5 inset-x-0 flex justify-center text-[10px] sm:text-xs font-mono font-bold text-slate-400 z-10 pointer-events-none">
        {scoreCentipawns < 0 ? formatScore(scoreCentipawns) : ""}
      </div>

      {/* White evaluation fill (rising from bottom) */}
      <div
        className="w-full bg-slate-100 transition-all duration-300 ease-out"
        style={{ height: `${clampedPercent}%` }}
      />

      {/* White evaluation score display (bottom) */}
      <div className="absolute bottom-1.5 inset-x-0 flex justify-center text-[10px] sm:text-xs font-mono font-bold text-slate-900 z-10 pointer-events-none">
        {scoreCentipawns >= 0 ? formatScore(scoreCentipawns) : ""}
      </div>
    </div>
  );
};
