"use client";

import React, { useState } from "react";
import { Crown, Sparkles, Swords, Bot, Users, Zap, Compass, Dices, Box } from "lucide-react";
import { PromoModal } from "../promo/promo-modal";

export type NavTab = "bots" | "pass" | "puzzles" | "openings" | "variants" | "tour" | "boss";

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  is3D: boolean;
  setIs3D: (val: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, is3D, setIs3D }) => {
  const [promoOpen, setPromoOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 h-16">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab("bots")}>
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/25 border border-amber-400/30">
              {/* Queen with Crown SVG */}
              <svg viewBox="0 0 40 40" fill="none" className="w-7 h-7 text-white drop-shadow-md">
                {/* Crown Diadem */}
                <path
                  d="M10 16L13 22H27L30 16L24 19L20 12L16 19L10 16Z"
                  fill="#FBBF24"
                  stroke="#78350F"
                  strokeWidth="1"
                />
                {/* Crown Jewels */}
                <circle cx="10" cy="15" r="1.5" fill="#F87171" />
                <circle cx="16" cy="18" r="1.2" fill="#60A5FA" />
                <circle cx="20" cy="11.5" r="1.8" fill="#FBBF24" />
                <circle cx="24" cy="18" r="1.2" fill="#60A5FA" />
                <circle cx="30" cy="15" r="1.5" fill="#F87171" />
                {/* Queen Bust / Body */}
                <path
                  d="M13 23C13 23 15 25 20 25C25 25 27 23 27 23L28 32H12L13 23Z"
                  fill="#FFFFFF"
                />
                {/* Royal Robe trim */}
                <path
                  d="M11 32C11 31 14 30 20 30C26 30 29 31 29 32H11Z"
                  fill="#F59E0B"
                />
              </svg>
            </div>
            <div>
              <span className="font-black text-xl text-white tracking-tight flex items-center gap-1.5">
                PRIN<span className="text-amber-400">CHESS</span>
              </span>
              <span className="text-[10px] text-amber-300/80 font-bold tracking-wider uppercase block -mt-1">
                Grandmaster Suite
              </span>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("bots")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "bots" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              AI Bots
            </button>

            <button
              onClick={() => setActiveTab("pass")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "pass" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Pass & Play
            </button>

            <button
              onClick={() => setActiveTab("puzzles")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "puzzles" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              Puzzles
            </button>

            <button
              onClick={() => setActiveTab("openings")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "openings" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              Courses
            </button>

            <button
              onClick={() => setActiveTab("variants")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "variants" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              <Dices className="w-3.5 h-3.5 text-purple-400" />
              Variants
            </button>

            <button
              onClick={() => setActiveTab("tour")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "tour" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Tour
            </button>

            <button
              onClick={() => setActiveTab("boss")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "boss"
                  ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                  : "text-red-400 hover:text-red-300"
              }`}
            >
              <Swords className="w-3.5 h-3.5" />
              Boss Mode
            </button>
          </nav>

          {/* Right Actions: 3D View Toggle + VIP Redeem Modal */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIs3D(!is3D)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                is3D
                  ? "bg-indigo-600 border-indigo-500 text-white shadow-lg"
                  : "bg-slate-900 border-slate-750 text-slate-300 hover:text-white"
              }`}
            >
              <Box className="w-3.5 h-3.5 text-indigo-400" />
              <span>{is3D ? "3D Active" : "3D View"}</span>
            </button>

            <button
              onClick={() => setPromoOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-black shadow-sm transition-all"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>VIP Pass</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Scroll Strip */}
        <div className="lg:hidden flex items-center gap-2 overflow-x-auto border-t border-slate-850 px-3 py-2 bg-slate-950/95 scrollbar-none">
          {(["bots", "pass", "puzzles", "openings", "variants", "tour", "boss"] as NavTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                activeTab === tab ? "bg-blue-600 text-white" : "text-slate-400 bg-slate-900"
              }`}
            >
              {tab === "openings" ? "Courses" : tab}
            </button>
          ))}
        </div>
      </header>

      <PromoModal isOpen={promoOpen} onClose={() => setPromoOpen(false)} />
    </>
  );
};
