"use client";

import React, { useState } from "react";
import { Crown, Sparkles, Swords, Bot, Users, Zap, Settings } from "lucide-react";
import { PromoModal } from "../promo/promo-modal";

interface NavbarProps {
  activeTab: "bots" | "pass" | "tour" | "boss";
  setActiveTab: (tab: "bots" | "pass" | "tour" | "boss") => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const [promoOpen, setPromoOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
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

          {/* Center Tabs */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("bots")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "bots" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              <Bot className="w-4 h-4" />
              AI Bots
            </button>

            <button
              onClick={() => setActiveTab("pass")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "pass" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              <Users className="w-4 h-4" />
              Pass & Play
            </button>

            <button
              onClick={() => setActiveTab("tour")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "tour" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              <Zap className="w-4 h-4 text-yellow-400" />
              Knight's Tour
            </button>

            <button
              onClick={() => setActiveTab("boss")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "boss"
                  ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                  : "text-red-400 hover:text-red-300"
              }`}
            >
              <Swords className="w-4 h-4" />
              Boss Mode
            </button>
          </nav>

          {/* Right Actions: VIP Redeem Modal */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPromoOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-black shadow-sm transition-all"
            >
              <Crown className="w-4 h-4 text-amber-400" />
              <span>VIP Pass</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="md:hidden flex items-center justify-around border-t border-slate-850 px-2 py-1.5 bg-slate-950/95">
          <button
            onClick={() => setActiveTab("bots")}
            className={`flex flex-col items-center py-1 px-3 text-[11px] font-bold ${
              activeTab === "bots" ? "text-blue-400" : "text-slate-400"
            }`}
          >
            <Bot className="w-4 h-4 mb-0.5" />
            AI Bots
          </button>
          <button
            onClick={() => setActiveTab("pass")}
            className={`flex flex-col items-center py-1 px-3 text-[11px] font-bold ${
              activeTab === "pass" ? "text-blue-400" : "text-slate-400"
            }`}
          >
            <Users className="w-4 h-4 mb-0.5" />
            Pass & Play
          </button>
          <button
            onClick={() => setActiveTab("tour")}
            className={`flex flex-col items-center py-1 px-3 text-[11px] font-bold ${
              activeTab === "tour" ? "text-yellow-400" : "text-slate-400"
            }`}
          >
            <Zap className="w-4 h-4 mb-0.5" />
            Tour
          </button>
          <button
            onClick={() => setActiveTab("boss")}
            className={`flex flex-col items-center py-1 px-3 text-[11px] font-bold ${
              activeTab === "boss" ? "text-red-400" : "text-slate-400"
            }`}
          >
            <Swords className="w-4 h-4 mb-0.5" />
            Boss
          </button>
        </div>
      </header>

      <PromoModal isOpen={promoOpen} onClose={() => setPromoOpen(false)} />
    </>
  );
};
