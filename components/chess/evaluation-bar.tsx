"use client";

import React from "react";

export type EvalBarMode = "live" | "every-5" | "disabled";

interface EvaluationBarProps {
  evalScore: number; // centipawns from White's perspective (+ = White advantage, - = Black advantage)
  isMate?: boolean;
  mateIn?: number | null;
  orientation?: "white" | "black";
  heightClass?: string;
  mode?: EvalBarMode;
  moveCount?: number;
}

export const EvaluationBar: React.FC<EvaluationBarProps> = ({
  evalScore,
  isMate = false,
  mateIn = null,
  orientation = "white",
  heightClass = "h-[320px] sm:h-[460px] md:h-[540px] lg:h-[600px]",
  mode = "live",
  moveCount = 0,
}) => {
  if (mode === "disabled") return null;

  // Calculate percentage of White's share of the bar
  let whitePercent = 50;
  let formattedEval = "0.0";
  let advantage = "Equal position (0.0)";

  if (isMate) {
    if (mateIn && mateIn > 0) {
      whitePercent = 98;
      formattedEval = `M${Math.abs(mateIn)}`;
      advantage = `White has Forced Mate in ${Math.abs(mateIn)}`;
    } else {
      whitePercent = 2;
      formattedEval = `-M${Math.abs(mateIn || 1)}`;
      advantage = `Black has Forced Mate in ${Math.abs(mateIn || 1)}`;
    }
  } else {
    // Sigmoid winning probability formula
    const winChance = 1 / (1 + Math.pow(10, -evalScore / 400));
    whitePercent = Math.min(96, Math.max(4, winChance * 100));

    const cp = evalScore / 100;
    if (Math.abs(cp) < 0.05) {
      formattedEval = "0.0";
      advantage = "Equal position (0.0)";
    } else if (cp > 0) {
      formattedEval = `+${cp.toFixed(1)}`;
      advantage = `White is leading by ${cp.toFixed(1)} pawns`;
    } else {
      formattedEval = `${cp.toFixed(1)}`;
      advantage = `Black is leading by ${Math.abs(cp).toFixed(1)} pawns`;
    }
  }

  // If flipped orientation (playing as Black)
  const displayWhitePercent = orientation === "white" ? whitePercent : 100 - whitePercent;
  const isWhiteWinning = orientation === "white" ? whitePercent >= 50 : whitePercent < 50;

  return (
    <div
      className={`group relative flex flex-col justify-between items-center w-6 sm:w-7 md:w-8 ${heightClass} bg-slate-950 border border-slate-700/80 rounded-lg sm:rounded-xl shadow-2xl overflow-hidden select-none transition-all duration-300 hover:border-blue-500/60`}
      title={`${advantage} • Mode: ${mode === "every-5" ? "Periodic (every 5 moves)" : "Live"}`}
    >
      {/* 5-move periodic badge indicator */}
      {mode === "every-5" && (
        <div className="absolute top-1 right-1 z-20 w-1.5 h-1.5 rounded-full bg-blue-400 shadow-sm animate-pulse" title="Updated every 5 moves" />
      )}

      {/* Black Area (Top) */}
      <div className="w-full h-full bg-slate-900 relative flex flex-col justify-between items-center">
        {/* Black score label if Black is ahead */}
        {!isWhiteWinning && (
          <span className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs font-mono font-black text-slate-100 tracking-tight z-10 drop-shadow">
            {formattedEval}
          </span>
        )}

        {/* White Area (Animated from bottom) */}
        <div
          className="w-full bg-slate-100 absolute bottom-0 left-0 flex flex-col justify-end items-center transition-all duration-700 ease-out shadow-inner"
          style={{ height: `${displayWhitePercent}%` }}
        >
          {/* White score label if White is ahead */}
          {isWhiteWinning && (
            <span className="mb-1.5 sm:mb-2 text-[10px] sm:text-xs font-mono font-black text-slate-900 tracking-tight z-10">
              {formattedEval}
            </span>
          )}
        </div>
      </div>

      {/* Center 50% equality notch line */}
      <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-slate-500/40 pointer-events-none z-10" />

      {/* Hover tooltip for detailed evaluation */}
      <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover:flex flex-col bg-slate-900 border border-slate-700 rounded-lg p-2.5 shadow-2xl z-30 pointer-events-none whitespace-nowrap min-w-[140px]">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
          Engine Eval {mode === "every-5" ? `(Move ${moveCount})` : "(Live)"}
        </span>
        <span className="text-sm font-black font-mono text-white">{formattedEval}</span>
        <span className="text-[11px] text-slate-300 mt-0.5">{advantage}</span>
        {mode === "every-5" && (
          <span className="text-[10px] text-blue-400 mt-1 font-semibold">
            Updates every 5 moves
          </span>
        )}
      </div>
    </div>
  );
};
