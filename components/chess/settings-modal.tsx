"use client";

import React, { useState } from "react";
import { BoardTheme } from "./board";
import { EvalBarMode } from "./evaluation-bar";
import { ChessPiece } from "./pieces";
import {
  X,
  User,
  Palette,
  Bell,
  Shield,
  MoreHorizontal,
  Volume2,
  VolumeX,
  Check,
  Crown,
  Sparkles,
  Sliders,
  RotateCcw,
} from "lucide-react";
import { useSettings, type PieceSetStyle } from "@/lib/stores/settings-store";
import { useAuth } from "@/lib/stores/auth-store";

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

type SettingsTab = "account" | "appearance" | "notifications" | "privacy" | "other";

const THEME_OPTIONS: { id: BoardTheme; name: string; desc: string; lightBg: string; darkBg: string }[] = [
  {
    id: "classic",
    name: "Classic Green",
    desc: "Tournament standard forest green & warm cream",
    lightBg: "bg-[#ebecd0]",
    darkBg: "bg-[#739552]",
  },
  {
    id: "emerald",
    name: "Emerald Pro",
    desc: "Chess.com emerald green & light ivory",
    lightBg: "bg-[#eeeed2]",
    darkBg: "bg-[#769656]",
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
  {
    id: "obsidian",
    name: "Midnight Obsidian",
    desc: "Pitch dark OLED slate & graphite shadows",
    lightBg: "bg-slate-700/70",
    darkBg: "bg-slate-950",
  },
  {
    id: "tournament",
    name: "Tournament Blue",
    desc: "Championship navy blue & warm buff contrast",
    lightBg: "bg-[#eae9d2]",
    darkBg: "bg-[#4b7399]",
  },
];

const PIECE_SET_OPTIONS: { id: PieceSetStyle; name: string; desc: string }[] = [
  {
    id: "classic",
    name: "Staunton Vector",
    desc: "Tournament standard vector silhouettes",
  },
  {
    id: "gold",
    name: "Sovereign Gold",
    desc: "Imperial metallic gold & obsidian glass",
  },
  {
    id: "wood",
    name: "Carved Walnut",
    desc: "Warm organic mahogany & golden birch",
  },
  {
    id: "pixel",
    name: "8-Bit Arcade",
    desc: "Retro arcade pixel art geometry",
  },
  {
    id: "modern",
    name: "Bauhaus Minimal",
    desc: "Sleek geometric architectural silhouettes",
  },
];

const EVAL_OPTIONS: { id: EvalBarMode; label: string; desc: string }[] = [
  {
    id: "live",
    label: "Live Dynamic",
    desc: "Real-time client-side minimax evaluation bar",
  },
  {
    id: "every-5",
    label: "Step Sync",
    desc: "Calculates every 5 ply to conserve CPU resources",
  },
  {
    id: "disabled",
    label: "Disabled",
    desc: "Hidden evaluation bar for pure competitive focus",
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
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
  const [globalSettings, updateGlobalSettings] = useSettings();
  const [auth] = useAuth();

  const [usernameInput, setUsernameInput] = useState(() => {
    return auth.profile?.username || (typeof window !== "undefined" ? localStorage.getItem("sovereign_player_name") || "Guest Player" : "Guest Player");
  });
  const [emailInput, setEmailInput] = useState(() => {
    return auth.user?.email || "guest@sovereignchess.app";
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Notifications state
  const [notifySound, setNotifySound] = useState(true);
  const [notifyLowTime, setNotifyLowTime] = useState(true);
  const [botChatter, setBotChatter] = useState(true);

  // Privacy state
  const [publicProfile, setPublicProfile] = useState(true);
  const [allowChallenges, setAllowChallenges] = useState(true);

  if (!isOpen) return null;

  const currentTheme = propTheme ?? globalSettings.theme;
  const currentEval = propEvalMode ?? globalSettings.evalMode;
  const currentAutoQueen = propAutoPromote ?? globalSettings.autoQueen;

  const handleSelectTheme = (t: BoardTheme) => {
    if (propOnThemeChange) propOnThemeChange(t);
    updateGlobalSettings({ theme: t });
  };

  const handleSelectEval = (m: EvalBarMode) => {
    if (propOnEvalModeChange) propOnEvalModeChange(m);
    updateGlobalSettings({ evalMode: m });
  };

  const handleToggleAutoQueen = () => {
    const nextVal = !currentAutoQueen;
    if (propOnAutoPromoteChange) propOnAutoPromoteChange(nextVal);
    updateGlobalSettings({ autoQueen: nextVal });
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      localStorage.setItem("sovereign_player_name", usernameInput.trim());
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const userInitials = usernameInput.slice(0, 2).toUpperCase() || "AS";

  const NAV_ITEMS: { id: SettingsTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: "account", label: "Account", icon: User },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Shield },
    { id: "other", label: "Other", icon: MoreHorizontal },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Sovereign Chess Settings"
    >
      <div
        className="bg-[#14171f] border border-[#252a36] rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#252a36] bg-[#0d0f12]">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-white font-display">Settings</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="w-8 h-8 rounded-xl bg-[#1c202a] hover:bg-[#252a36] border border-[#252a36] text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2-Column Layout matching Reference Image */}
        <div className="flex-1 flex flex-col md:flex-row min-h-[420px] overflow-hidden">
          {/* Left Sidebar */}
          <div className="w-full md:w-48 bg-[#0d0f12]/60 border-b md:border-b-0 md:border-r border-[#252a36] p-3 flex md:flex-col gap-1.5 shrink-0 overflow-x-auto md:overflow-x-visible">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left w-full whitespace-nowrap ${
                    isActive
                      ? "bg-[#d4a359] text-black shadow-md shadow-[#d4a359]/20 font-black"
                      : "text-slate-400 hover:text-white hover:bg-[#1c202a]"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-black" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Content Panel */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-[#14171f]">
            {/* TAB: Account */}
            {activeTab === "account" && (
              <form onSubmit={handleSaveAccount} className="space-y-5">
                <div>
                  <h3 className="text-base font-bold text-white font-display">Account Settings</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Manage your public persona, avatar, and credentials.</p>
                </div>

                {/* Avatar Row */}
                <div className="flex items-center gap-4 p-4 bg-[#0d0f12] border border-[#252a36] rounded-2xl">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#d4a359] to-[#f0cf85] text-black flex items-center justify-center font-black text-xl shadow-lg shadow-[#d4a359]/20">
                    {userInitials}
                  </div>
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => alert("Avatar customization: connect image upload or Gravatar in future update.")}
                      className="px-3 py-1.5 bg-[#1c202a] hover:bg-[#252a36] border border-[#252a36] text-xs font-bold text-white rounded-xl transition-colors"
                    >
                      Change Avatar
                    </button>
                    <p className="text-[11px] text-slate-400">JPG, PNG or GIF up to 5MB</p>
                  </div>
                </div>

                {/* Username Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Username</label>
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0d0f12] border border-[#252a36] rounded-xl text-white text-xs font-medium focus:outline-none focus:border-[#d4a359] transition-colors"
                    placeholder="Enter your username"
                  />
                </div>

                {/* Email Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Email</label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 bg-[#0d0f12] border border-[#252a36] rounded-xl text-white text-xs font-medium focus:outline-none focus:border-[#d4a359] transition-colors"
                      placeholder="name@example.com"
                    />
                    <button
                      type="button"
                      onClick={() => alert("Verification link sent to email.")}
                      className="px-3 py-2 bg-[#1c202a] hover:bg-[#252a36] border border-[#252a36] text-xs font-bold text-white rounded-xl shrink-0 transition-colors"
                    >
                      Change Email
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#d4a359] hover:bg-[#e2b768] text-black font-black text-xs rounded-xl shadow-lg shadow-[#d4a359]/20 transition-all"
                  >
                    Save Changes
                  </button>
                  {saveSuccess && (
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Saved successfully
                    </span>
                  )}
                </div>
              </form>
            )}

            {/* TAB: Appearance */}
            {activeTab === "appearance" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white font-display">Appearance</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Customize your chessboard styling, pieces, and visual aids.</p>
                </div>

                {/* Board Themes */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2.5">
                    Board Theme
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {THEME_OPTIONS.map((opt) => {
                      const isSelected = currentTheme === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectTheme(opt.id)}
                          className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${
                            isSelected
                              ? "bg-[#1c202a] border-[#d4a359] ring-1 ring-[#d4a359]/40 shadow-sm"
                              : "bg-[#0d0f12] border-[#252a36] hover:border-slate-600"
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg overflow-hidden grid grid-cols-2 grid-rows-2 shrink-0 border border-black/40">
                            <div className={opt.lightBg} />
                            <div className={opt.darkBg} />
                            <div className={opt.darkBg} />
                            <div className={opt.lightBg} />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-white block truncate">{opt.name}</span>
                            <span className="text-[10px] text-slate-400 block truncate">{opt.desc}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Piece Sets */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2.5">
                    Piece Set Style
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {PIECE_SET_OPTIONS.map((opt) => {
                      const isSelected = globalSettings.pieceSet === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => updateGlobalSettings({ pieceSet: opt.id })}
                          className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                            isSelected
                              ? "bg-[#1c202a] border-[#d4a359] ring-1 ring-[#d4a359]/40 shadow-sm"
                              : "bg-[#0d0f12] border-[#252a36] hover:border-slate-600"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <div className="flex items-center bg-[#14171f] p-1 rounded-lg border border-[#252a36] shrink-0">
                              <ChessPiece type="k" color="w" size={20} style={opt.id} />
                              <ChessPiece type="n" color="b" size={20} style={opt.id} />
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-white block">{opt.name}</span>
                              <span className="text-[10px] text-slate-400 block truncate">{opt.desc}</span>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-[#d4a359] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Board Coordinates & Options */}
                <div className="bg-[#0d0f12] border border-[#252a36] rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">Board Coordinates (A-H, 1-8)</span>
                      <span className="text-[11px] text-slate-400">Display notation indicators along board edges</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateGlobalSettings({ showCoordinates: !globalSettings.showCoordinates })}
                      className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                        globalSettings.showCoordinates ? "bg-[#d4a359]" : "bg-slate-700"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          globalSettings.showCoordinates ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Notifications & Audio */}
            {activeTab === "notifications" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-bold text-white font-display">Notifications & Audio</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Control sound effects, move chimes, and bot commentary.</p>
                </div>

                {/* Sound FX Toggle & Volume */}
                <div className="bg-[#0d0f12] border border-[#252a36] rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {globalSettings.soundEnabled ? (
                        <Volume2 className="w-4 h-4 text-[#d4a359]" />
                      ) : (
                        <VolumeX className="w-4 h-4 text-slate-500" />
                      )}
                      <div>
                        <span className="text-xs font-bold text-white block">Master Sound Effects</span>
                        <span className="text-[11px] text-slate-400">Piece movement, captures, checks, and victories</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateGlobalSettings({ soundEnabled: !globalSettings.soundEnabled })}
                      className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                        globalSettings.soundEnabled ? "bg-[#d4a359]" : "bg-slate-700"
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
                    <div className="pt-2 border-t border-[#252a36]">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-300 font-semibold">Volume Level</span>
                        <span className="text-[#d4a359] font-mono font-bold">{Math.round(globalSettings.volume * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={globalSettings.volume}
                        onChange={(e) => updateGlobalSettings({ volume: parseFloat(e.target.value) })}
                        className="w-full accent-[#d4a359] h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                {/* Alerts List */}
                <div className="bg-[#0d0f12] border border-[#252a36] rounded-2xl p-4 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">Low Time Warning</span>
                      <span className="text-[11px] text-slate-400">Audible clock countdown tick under 30 seconds</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotifyLowTime(!notifyLowTime)}
                      className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                        notifyLowTime ? "bg-[#d4a359]" : "bg-slate-700"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          notifyLowTime ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#252a36]">
                    <div>
                      <span className="text-xs font-bold text-white block">AI Bot Banter & Trash Talk</span>
                      <span className="text-[11px] text-slate-400">Gemini-powered real-time bot reactions</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBotChatter(!botChatter)}
                      className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                        botChatter ? "bg-[#d4a359]" : "bg-slate-700"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          botChatter ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Privacy */}
            {activeTab === "privacy" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-bold text-white font-display">Privacy & Visibility</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Control how your ratings and statistics appear to other players.</p>
                </div>

                <div className="bg-[#0d0f12] border border-[#252a36] rounded-2xl p-4 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">Public Profile & Statistics</span>
                      <span className="text-[11px] text-slate-400">Allow players to view your match history & ELO breakdown</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPublicProfile(!publicProfile)}
                      className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                        publicProfile ? "bg-[#d4a359]" : "bg-slate-700"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          publicProfile ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#252a36]">
                    <div>
                      <span className="text-xs font-bold text-white block">Accept Direct Match Challenges</span>
                      <span className="text-[11px] text-slate-400">Allow incoming match requests from other users</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAllowChallenges(!allowChallenges)}
                      className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                        allowChallenges ? "bg-[#d4a359]" : "bg-slate-700"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          allowChallenges ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Other */}
            {activeTab === "other" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-bold text-white font-display">Game Engine & Rules</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Engine depth, pawn promotion, and data reset.</p>
                </div>

                <div className="bg-[#0d0f12] border border-[#252a36] rounded-2xl p-4 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">Auto-Promote to Queen</span>
                      <span className="text-[11px] text-slate-400">Automatically promote pawns to Queen on the 8th rank</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleAutoQueen}
                      className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                        currentAutoQueen ? "bg-[#d4a359]" : "bg-slate-700"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          currentAutoQueen ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="pt-3 border-t border-[#252a36]">
                    <label className="text-xs font-bold text-slate-300 block mb-2">Evaluation Bar Mode</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {EVAL_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectEval(opt.id)}
                          className={`p-2 rounded-xl border text-left text-xs transition-colors ${
                            currentEval === opt.id
                              ? "bg-[#1c202a] border-[#d4a359] text-white font-bold"
                              : "bg-[#0d0f12] border-[#252a36] text-slate-400 hover:text-white"
                          }`}
                        >
                          <span className="block font-bold text-white">{opt.label}</span>
                          <span className="block text-[10px] text-slate-400 mt-0.5">{opt.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Reset Data Danger Zone */}
                <div className="bg-rose-950/20 border border-rose-900/30 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-rose-300 block">Reset Local Game Cache</span>
                    <span className="text-[11px] text-slate-400">Clear active match state and local streak records</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Reset active board state and cached scores?")) {
                        localStorage.removeItem("sovereign_chess_active_game_bots");
                        localStorage.removeItem("sovereign_chess_active_game_pass");
                        window.location.reload();
                      }
                    }}
                    className="px-3 py-1.5 bg-rose-900/40 hover:bg-rose-900/70 text-rose-200 border border-rose-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
