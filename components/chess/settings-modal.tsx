"use client";

import React from "react";
import { BoardTheme } from "./board";
import { EvalBarMode } from "./evaluation-bar";
import { X, Sliders, Palette, Activity, Cpu, Check } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: BoardTheme;
  onThemeChange: (theme: BoardTheme) => void;
  evalMode: EvalBarMode;
  onEvalModeChange: (mode: EvalBarMode) => void;
  activeBotName?: string;
  activeBotDepth?: number;
}

const THEME_OPTIONS: { id: BoardTheme; name: string; desc: string; lightBg: string; darkBg: string }[] = [
  {
    id: "classic",
    name: "Classic Green",
    desc: "Tournament standard forest green & warm cream",
    lightBg: "bg-[#ebecd0]",
    darkBg: "bg-[#739552]",
  },
  {
    id: "wood",
    name: "Walnut Wood",
    desc: "Rich mahogany & golden birch hardwood",
    lightBg: "bg-[#e3c19b]",
    darkBg: "bg-[#b37a4c]",
  },
  {
    id: "glass",
    name: "Obsidian Glass",
    desc: "Ultra-modern translucent dark frosted glass",
    lightBg: "bg-slate-700/60",
    darkBg: "bg-slate-900/90",
  },
  {
    id: "neon",
    name: "Cyber Neon",
    desc: "Vibrant synthwave cyan & electric purple glow",
    lightBg: "bg-cyan-900/50",
    darkBg: "bg-indigo-950/80",
  },
];

const EVAL_OPTIONS: { id: EvalBarMode; label: string; desc: string; badge: string }[] = [
  {
    id: "live",
    label: "Always Active (Live)",
    desc: "Dynamically updates centipawns on every move made",
    badge: "Recommended",
  },
  {
    id: "every-5",
    label: "Update Every 5 Moves",
    desc: "Periodic evaluation refresh every 5 plies to prevent distraction",
    badge: "Focused",
  },
  {
    id: "disabled",
    label: "Disabled (Hidden)",
    desc: "Hides the evaluation bar for a clean, pure board experience",
    badge: "Clean",
  },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  theme,
  onThemeChange,
  evalMode,
  onEvalModeChange,
  activeBotName,
  activeBotDepth,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div
        className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">Game & Board Settings</h2>
              <p className="text-xs text-slate-400">Customize visual appearance and engine analytics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto py-5 space-y-6 pr-1">
          {/* Section 1: Board Theme */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Palette className="w-4 h-4 text-emerald-400" />
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Board Theme
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {THEME_OPTIONS.map((opt) => {
                const isSelected = theme === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => onThemeChange(opt.id)}
                    className={`flex flex-col text-left p-3 rounded-2xl border transition-all ${
                      isSelected
                        ? "bg-blue-600/20 border-blue-500 shadow-md ring-2 ring-blue-500/40"
                        : "bg-slate-800/60 border-slate-700/80 hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      {/* Mini 2x2 Board Preview Swatch */}
                      <div className="grid grid-cols-2 grid-rows-2 w-8 h-8 rounded-md overflow-hidden border border-slate-600/70 shadow-sm">
                        <div className={opt.lightBg} />
                        <div className={opt.darkBg} />
                        <div className={opt.darkBg} />
                        <div className={opt.lightBg} />
                      </div>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-white leading-snug">{opt.name}</span>
                    <span className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Evaluation Bar Mode */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-cyan-400" />
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Evaluation Bar
              </label>
            </div>
            <div className="space-y-2">
              {EVAL_OPTIONS.map((opt) => {
                const isSelected = evalMode === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => onEvalModeChange(opt.id)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? "bg-blue-600/20 border-blue-500 ring-2 ring-blue-500/40 shadow-sm"
                        : "bg-slate-800/60 border-slate-700/80 hover:bg-slate-800"
                    }`}
                  >
                    <div className="pr-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{opt.label}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-medium bg-slate-800 text-slate-400 border border-slate-700">
                          {opt.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{opt.desc}</p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                        isSelected
                          ? "border-blue-500 bg-blue-500 text-white"
                          : "border-slate-600 bg-slate-900"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Engine Calculation Details */}
          {activeBotName && (
            <div className="p-3.5 bg-slate-800/40 border border-slate-700/60 rounded-2xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Cpu className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-200 block">
                  {activeBotName} Engine Calibration
                </span>
                <span className="text-slate-400 text-[11px]">
                  Search depth: <strong className="text-emerald-400">{activeBotDepth || 3} moves deep</strong> (Alpha-Beta pruning + Tactical Quiescence).
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg transition-all"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
