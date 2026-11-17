"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Crown, Swords, Bot, Users, Zap, Compass, Dices, Box, Globe, User } from "lucide-react";
import { PromoModal } from "../promo/promo-modal";
import { AuthModal } from "../auth/auth-modal";
import { useActiveGame } from "@/lib/stores/active-game-store";
import { useAuth } from "@/lib/stores/auth-store";

export type NavTab = "bots" | "pass" | "puzzles" | "openings" | "variants" | "tour" | "boss" | "online";

interface NavbarProps {
  activeTab?: NavTab;
  setActiveTab?: (tab: NavTab) => void;
  is3D?: boolean;
  setIs3D?: (val: boolean) => void;
}

const NAV_ITEMS: { id: NavTab; href: string; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: "bots", href: "/bots", label: "AI Bots", icon: Bot },
  { id: "online", href: "/online", label: "Online", icon: Globe },
  { id: "pass", href: "/pass-and-play", label: "Pass & Play", icon: Users },
  { id: "puzzles", href: "/puzzles", label: "Puzzles", icon: Zap },
  { id: "openings", href: "/learn", label: "Courses", icon: Compass },
  { id: "variants", href: "/variants", label: "Variants", icon: Dices },
  { id: "tour", href: "/knights-tour", label: "Tour", icon: Zap },
  { id: "boss", href: "/boss", label: "Boss Mode", icon: Swords },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab: propActiveTab,
  setActiveTab: propSetActiveTab,
  is3D: propIs3D,
  setIs3D: propSetIs3D,
}) => {
  const [promoOpen, setPromoOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const pathname = usePathname();
  const [activeGame, { toggle3D }] = useActiveGame();
  const [auth] = useAuth();

  const is3DActive = typeof propIs3D === "boolean" ? propIs3D : activeGame.is3DOpen;

  const handleToggle3D = () => {
    if (propSetIs3D) {
      propSetIs3D(!propIs3D);
    } else {
      toggle3D();
    }
  };

  const getEffectiveTab = (): NavTab => {
    if (propActiveTab) return propActiveTab;
    if (pathname === "/online") return "online";
    if (pathname === "/pass-and-play") return "pass";
    if (pathname === "/puzzles") return "puzzles";
    if (pathname === "/learn") return "openings";
    if (pathname === "/variants") return "variants";
    if (pathname === "/knights-tour") return "tour";
    if (pathname === "/boss") return "boss";
    return "bots";
  };

  const currentTab = getEffectiveTab();

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 h-16">
          {/* Logo */}
          <Link href="/bots" className="flex items-center gap-3 cursor-pointer">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/25 border border-amber-400/30">
              {/* Queen with Crown SVG */}
              <svg viewBox="0 0 40 40" fill="none" className="w-7 h-7 text-white drop-shadow-md">
                <path
                  d="M10 16L13 22H27L30 16L24 19L20 12L16 19L10 16Z"
                  fill="#FBBF24"
                  stroke="#78350F"
                  strokeWidth="1"
                />
                <circle cx="10" cy="15" r="1.5" fill="#F87171" />
                <circle cx="16" cy="18" r="1.2" fill="#60A5FA" />
                <circle cx="20" cy="11.5" r="1.8" fill="#FBBF24" />
                <circle cx="24" cy="18" r="1.2" fill="#60A5FA" />
                <circle cx="30" cy="15" r="1.5" fill="#F87171" />
                <path
                  d="M13 23C13 23 15 25 20 25C25 25 27 23 27 23L28 32H12L13 23Z"
                  fill="#FFFFFF"
                />
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
          </Link>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isSelected = currentTab === item.id;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => propSetActiveTab?.(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isSelected
                      ? item.id === "boss"
                        ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                        : "bg-blue-600 text-white shadow-md"
                      : item.id === "boss"
                      ? "text-red-400 hover:text-red-300"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions: 3D View Toggle + VIP Redeem Modal + User Account */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggle3D}
              aria-label="Toggle 3D View"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                is3DActive
                  ? "bg-indigo-600 border-indigo-500 text-white shadow-lg"
                  : "bg-slate-900 border-slate-700 text-slate-300 hover:text-white"
              }`}
            >
              <Box className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">{is3DActive ? "3D Active" : "3D View"}</span>
            </button>

            <button
              onClick={() => setPromoOpen(true)}
              aria-label="Open VIP Pass"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-black shadow-sm transition-all"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">VIP Pass</span>
            </button>

            <button
              onClick={() => setAuthOpen(true)}
              aria-label="User Account"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all"
            >
              <User className="w-3.5 h-3.5 text-blue-400" />
              <span className="max-w-[80px] sm:max-w-[110px] truncate">
                {auth.user ? auth.profile?.username || auth.user.email?.split("@")[0] : "Sign In"}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Scroll Strip */}
        <div className="lg:hidden flex items-center gap-2 overflow-x-auto border-t border-slate-800 px-3 py-2 bg-slate-950/95 scrollbar-none">
          {NAV_ITEMS.map((item) => {
            const isSelected = currentTab === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => propSetActiveTab?.(item.id)}
                className={`shrink-0 px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                  isSelected ? "bg-blue-600 text-white" : "text-slate-400 bg-slate-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </header>

      <PromoModal isOpen={promoOpen} onClose={() => setPromoOpen(false)} />
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
};
