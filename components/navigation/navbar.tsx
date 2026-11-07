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
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-blue-500/20">
              ♟
            </div>
            <div>
              <span className="font-black text-lg text-white tracking-tight flex items-center gap-1.5">
                VIBE<span className="text-blue-500">CHESS</span>
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
