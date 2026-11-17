"use client";

import React from "react";
import { BoardTheme } from "./board";
import { EvalBarMode } from "./evaluation-bar";
import { X, Sliders, Palette, Activity, Cpu, Check, Volume2, VolumeX, Eye } from "lucide-react";
import { useSettings } from "@/lib/stores/settings-store";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: BoardTheme;
  onThemeChange?: (theme: BoardTheme) => void;
  evalMode?: EvalBarMode;
  onEvalModeChange?: (mode: EvalBarMode) => void;
  autoPromoteToQueen?: boolean;
  onAutoPromoteChange?: (val: boolean) => void;
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
  theme: propTheme,
  onThemeChange: propOnThemeChange,
  evalMode: propEvalMode,
  onEvalModeChange: propOnEvalModeChange,
  autoPromoteToQueen: propAutoPromote,
  onAutoPromoteChange: propOnAutoPromoteChange,
  activeBotName,
  activeBotDepth,
}) => {
  const [globalSettings, updateGlobalSettings] = useSettings();

  if (!isOpen) return null;

  const currentTheme = propTheme || globalSettings.theme;
  const currentEvalMode = propEvalMode || globalSettings.evalMode;
  const currentAutoQueen = typeof propAutoPromote === "boolean" ? propAutoPromote : globalSettings.autoQueen;

  const handleThemeSelect = (newTheme: BoardTheme) => {
    if (propOnThemeChange) propOnThemeChange(newTheme);
    updateGlobalSettings({ theme: newTheme });
  };

  const handleEvalSelect = (newEval: EvalBarMode) => {
    if (propOnEvalModeChange) propOnEvalModeChange(newEval);
    updateGlobalSettings({ evalMode: newEval });
  };

  const handleAutoQueenToggle = () => {
    const nextVal = !currentAutoQueen;
    if (propOnAutoPromoteChange) propOnAutoPromoteChange(nextVal);
    updateGlobalSettings({ autoQueen: nextVal });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Game & Board Settings"
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">Game & Board Settings</h2>
              <p className="text-xs text-slate-400">Audio, visuals, coordinates, and engine analytics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5 pr-2">
          {/* Section 1: Sound & Audio */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              {globalSettings.soundEnabled ? (
                <Volume2 className="w-4 h-4 text-blue-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Audio & Sound Effects
              </label>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Board Sound FX</span>
                  <span className="text-[11px] text-slate-400">Tactile piece movement, checks, captures & clock ticks</span>
                </div>
                <button
                  type="button"
                  onClick={() => updateGlobalSettings({ soundEnabled: !globalSettings.soundEnabled })}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    globalSettings.soundEnabled ? "bg-blue-600" : "bg-slate-700"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      globalSettings.soundEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {globalSettings.soundEnabled && (
                <div className="pt-2 border-t border-slate-700/60">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-300 font-semibold">Volume Level</span>
                    <span className="text-blue-400 font-mono font-bold">{Math.round(globalSettings.volume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={globalSettings.volume}
                    onChange={(e) => updateGlobalSettings({ volume: parseFloat(e.target.value) })}
                    className="w-full accent-blue-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Board Theme */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Palette className="w-4 h-4 text-emerald-400" />
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Board Theme
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {THEME_OPTIONS.map((opt) => {
                const isSelected = currentTheme === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleThemeSelect(opt.id)}
                    className={`flex flex-col text-left p-3 rounded-2xl border transition-all ${
                      isSelected
                        ? "bg-blue-600/20 border-blue-500 shadow-md ring-2 ring-blue-500/40"
                        : "bg-slate-800/60 border-slate-700/80 hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
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

          {/* Section 3: Board Coordinates */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-indigo-400" />
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Board Display</label>
            </div>
            <button
              type="button"
              onClick={() => updateGlobalSettings({ showCoordinates: !globalSettings.showCoordinates })}
              className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                globalSettings.showCoordinates
                  ? "bg-slate-800/90 border-blue-500/60 shadow-lg"
                  : "bg-slate-800/40 border-slate-700/60 hover:border-slate-600"
              }`}
            >
              <div>
                <span className="text-xs font-bold text-white block">Show Rank & File Coordinates</span>
                <span className="text-[11px] text-slate-400">Display 1-8 numbers and a-h letters along board edges</span>
              </div>
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0 ml-3 ${
                  globalSettings.showCoordinates
                    ? "border-blue-500 bg-blue-500 text-white"
                    : "border-slate-600 bg-slate-900"
                }`}
              >
                {globalSettings.showCoordinates && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </button>
          </div>

          {/* Section 4: Evaluation Bar Mode */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-cyan-400" />
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Evaluation Bar
              </label>
            </div>
            <div className="space-y-2">
              {EVAL_OPTIONS.map((opt) => {
                const isSelected = currentEvalMode === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleEvalSelect(opt.id)}
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

          {/* Section 5: Pawn Promotion Behavior */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Pawn Promotion</span>
            </div>
            <button
              type="button"
              onClick={handleAutoQueenToggle}
              className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                currentAutoQueen
                  ? "bg-slate-800/90 border-blue-500/60 shadow-lg"
                  : "bg-slate-800/40 border-slate-700/60 hover:border-slate-600"
              }`}
            >
              <div>
                <span className="text-xs font-bold text-white block">
                  {currentAutoQueen ? "Auto-Queen (Default)" : "Manual Choice (Under-promotion allowed)"}
                </span>
                <span className="text-[11px] text-slate-400">
                  {currentAutoQueen
                    ? "Automatically promotes pawns reaching the 8th rank to a Queen"
                    : "Shows piece picker (Queen, Rook, Bishop, Knight) on promotion"}
                </span>
              </div>
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0 ml-3 ${
                  currentAutoQueen
                    ? "border-blue-500 bg-blue-500 text-white"
                    : "border-slate-600 bg-slate-900"
                }`}
              >
                {currentAutoQueen && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </button>
          </div>

          {/* Section 6: Engine Calibration Details */}
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
        <div className="px-6 py-4 border-t border-slate-800 flex justify-end bg-slate-900/90">
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
