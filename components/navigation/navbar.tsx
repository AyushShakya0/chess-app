"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Crown,
  Swords,
  Bot,
  Users,
  Zap,
  Compass,
  Dices,
  Box,
  Globe,
  User,
  Eye,
  Sliders,
  ChevronDown,
} from "lucide-react";
import { SovereignLogo } from "../brand/sovereign-logo";
import { PromoModal } from "../promo/promo-modal";
import { AuthModal } from "../auth/auth-modal";
import { useActiveGame } from "@/lib/stores/active-game-store";
import { useAuth } from "@/lib/stores/auth-store";

export type NavTab =
  | "bots"
  | "pass"
  | "puzzles"
  | "openings"
  | "variants"
  | "tour"
  | "boss"
  | "online"
  | "vision"
  | "editor";

interface NavbarProps {
  activeTab?: NavTab;
  setActiveTab?: (tab: NavTab) => void;
  is3D?: boolean;
  setIs3D?: (val: boolean) => void;
}

const PRIMARY_NAV_ITEMS: { id: NavTab; href: string; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: "bots", href: "/bots", label: "Play Computer", icon: Bot },
  { id: "online", href: "/online", label: "Play Online", icon: Globe },
  { id: "puzzles", href: "/puzzles", label: "Puzzles", icon: Zap },
  { id: "openings", href: "/learn", label: "Courses", icon: Compass },
  { id: "pass", href: "/pass-and-play", label: "Pass & Play", icon: Users },
];

const TOOLS_NAV_ITEMS: { id: NavTab; href: string; label: string; description: string; icon: React.FC<{ className?: string }> }[] = [
  { id: "vision", href: "/vision", label: "Vision Trainer", description: "Learn square names & notation blindfold", icon: Eye },
  { id: "editor", href: "/editor", label: "Position Editor", description: "Design custom boards & Stockfish analysis", icon: Sliders },
  { id: "variants", href: "/variants", label: "Chess Variants", description: "Hidden Queen, 3-Check, and Handicap matches", icon: Dices },
  { id: "tour", href: "/knights-tour", label: "Knight's Tour", description: "Mathematical board-clearing puzzle sprint", icon: Zap },
  { id: "boss", href: "/boss", label: "Boss Arena", description: "Grandmaster challenge mode with custom taunts", icon: Swords },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab: propActiveTab,
  setActiveTab: propSetActiveTab,
  is3D: propIs3D,
  setIs3D: propSetIs3D,
}) => {
  const [promoOpen, setPromoOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const toolsMenuRef = useRef<HTMLDivElement>(null);

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

  // Close tools dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target as Node)) {
        setToolsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getEffectiveTab = (): NavTab => {
    if (propActiveTab) return propActiveTab;
    if (pathname === "/online") return "online";
    if (pathname === "/pass-and-play") return "pass";
    if (pathname === "/puzzles") return "puzzles";
    if (pathname === "/learn") return "openings";
    if (pathname === "/vision") return "vision";
    if (pathname === "/editor") return "editor";
    if (pathname === "/variants") return "variants";
    if (pathname === "/knights-tour") return "tour";
    if (pathname === "/boss") return "boss";
    return "bots";
  };

  const currentTab = getEffectiveTab();
  const isToolsActive = ["vision", "editor", "variants", "tour", "boss"].includes(currentTab);

  // User initials or AS default
  const userInitials = auth.profile?.username
    ? auth.profile.username.slice(0, 2).toUpperCase()
    : auth.user?.email
    ? auth.user.email.slice(0, 2).toUpperCase()
    : "AS";

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[#252a36] bg-[#0d0f12]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-3 sm:px-4 h-16 gap-2">
          {/* Sovereign Logo */}
          <SovereignLogo href="/bots" size="md" />

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 bg-[#14171f] border border-[#252a36] p-1 rounded-2xl shadow-inner">
            {PRIMARY_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isSelected = currentTab === item.id;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => propSetActiveTab?.(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                    isSelected
                      ? "bg-[#d4a359] text-black shadow-md shadow-[#d4a359]/20 font-black"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* Tools & Modes Dropdown */}
            <div className="relative" ref={toolsMenuRef}>
              <button
                onClick={() => setToolsOpen(!toolsOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                  isToolsActive
                    ? "bg-[#d4a359] text-black shadow-md shadow-[#d4a359]/20 font-black"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Tools & Modes</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${toolsOpen ? "rotate-180" : ""}`} />
              </button>

              {toolsOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-[#14171f] border border-[#252a36] rounded-2xl p-2 shadow-2xl z-50 animate-fade-in divide-y divide-[#252a36]/50">
                  <div className="px-2 py-1.5 text-[10px] font-bold text-[#d4a359] uppercase tracking-wider font-mono">
                    Advanced Training & Modes
                  </div>
                  <div className="py-1 space-y-1">
                    {TOOLS_NAV_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const isSelected = currentTab === item.id;
                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          onClick={() => {
                            setToolsOpen(false);
                            propSetActiveTab?.(item.id);
                          }}
                          className={`flex items-start gap-2.5 p-2 rounded-xl text-xs transition-colors ${
                            isSelected
                              ? "bg-[#d4a359]/20 text-[#d4a359] font-bold border border-[#d4a359]/40"
                              : "text-slate-300 hover:text-white hover:bg-[#1c202a]"
                          }`}
                        >
                          <div className="p-1.5 rounded-lg bg-[#1c202a] border border-[#2c3240] shrink-0 text-[#d4a359]">
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-bold">{item.label}</div>
                            <div className="text-[10px] text-slate-400 font-normal leading-tight">
                              {item.description}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Right Actions: 3D View + VIP Pass + Profile */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggle3D}
              aria-label="Toggle 3D View"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                is3DActive
                  ? "bg-[#d4a359] border-[#d4a359] text-black shadow-md shadow-[#d4a359]/25 font-black"
                  : "bg-[#14171f] border-[#252a36] text-slate-300 hover:text-white hover:border-[#384152]"
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{is3DActive ? "3D Active" : "3D View"}</span>
            </button>

            <button
              onClick={() => setPromoOpen(true)}
              aria-label="Open VIP Pass"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#d4a359]/15 hover:bg-[#d4a359]/25 border border-[#d4a359]/40 text-[#f0cf85] rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              <Crown className="w-3.5 h-3.5 text-[#d4a359]" />
              <span className="hidden sm:inline">VIP Pass</span>
            </button>

            {auth.user ? (
              <Link
                href="/profile"
                aria-label="View Profile & Stats"
                className="flex items-center gap-2 px-2.5 py-1.5 bg-[#14171f] hover:bg-[#1c202a] border border-[#252a36] hover:border-[#d4a359]/50 text-slate-200 rounded-xl text-xs font-bold transition-all group"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#d4a359] to-[#f0cf85] text-black flex items-center justify-center font-black text-[10px] shadow-sm">
                  {userInitials}
                </div>
                <span className="max-w-[75px] sm:max-w-[100px] truncate hidden xs:inline group-hover:text-[#d4a359] transition-colors">
                  {auth.profile?.username || auth.user.email?.split("@")[0] || "Profile"}
                </span>
              </Link>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setAuthOpen(true)}
                  aria-label="Sign In"
                  className="px-3 py-1.5 bg-[#14171f] hover:bg-[#1c202a] border border-[#252a36] text-slate-200 rounded-xl text-xs font-bold transition-all"
                >
                  Sign In
                </button>
                <Link
                  href="/profile"
                  aria-label="View Profile & Stats"
                  className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#d4a359] to-[#f0cf85] text-black flex items-center justify-center font-black text-xs shadow-md shadow-[#d4a359]/20 hover:scale-105 transition-transform"
                  title="Guest Profile (AS)"
                >
                  {userInitials}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Scroll Strip */}
        <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto border-t border-[#252a36] px-3 py-2 bg-[#0d0f12] scrollbar-none">
          {[...PRIMARY_NAV_ITEMS, ...TOOLS_NAV_ITEMS].map((item) => {
            const isSelected = currentTab === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => propSetActiveTab?.(item.id)}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? "bg-[#d4a359] text-black font-black shadow-sm"
                    : "text-slate-400 bg-[#14171f] border border-[#252a36]/60"
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
