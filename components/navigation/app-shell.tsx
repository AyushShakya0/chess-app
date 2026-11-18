"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sidebar } from "./sidebar";
import { Board3DModal } from "@/components/chess/board-3d-modal";
import { AuthModal } from "@/components/auth/auth-modal";
import { Menu, Crown, Bell, Sparkles } from "lucide-react";
import { SovereignLogo } from "@/components/brand/sovereign-logo";
import { useAuth } from "@/lib/stores/auth-store";

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [auth] = useAuth();

  const handleOpenAuth = (mode: "signin" | "signup" = "signin") => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const isAuthenticated = Boolean(auth.user || auth.profile);

  const userInitials = isAuthenticated
    ? auth.profile?.username
      ? auth.profile.username.slice(0, 2).toUpperCase()
      : auth.user?.email
      ? auth.user.email.slice(0, 2).toUpperCase()
      : "PL"
    : "G";

  const username = isAuthenticated
    ? auth.profile?.username || auth.user?.email?.split("@")[0] || "Player"
    : "Guest Player";

  const playerElo = isAuthenticated
    ? auth.profile?.elo_blitz || 1200
    : 1200;

  return (
    <div className="min-h-screen bg-[#0d0f12] text-slate-100 font-sans flex">
      {/* Persistent Left Sidebar (Desktop & Mobile Drawer) */}
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
        onOpenAuth={handleOpenAuth}
      />

      {/* Main Content Viewport with Responsive Margin for Sidebar */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 transition-all duration-300">
        {/* Desktop Header Top Bar matching Reference Image #1 & #2 */}
        <header className="hidden lg:flex sticky top-0 z-30 h-14 bg-[#0d0f12]/90 backdrop-blur-md border-b border-[#252a36]/60 px-6 items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400 font-display tracking-wide">
              Think. Move. Win.
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Notifications"
                  className="p-2 rounded-xl bg-[#14171f] hover:bg-[#1c202a] text-slate-400 hover:text-white border border-[#252a36] transition-colors relative"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#d4a359]" />
                </button>

                <Link
                  href="/profile"
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#14171f] hover:bg-[#1c202a] border border-[#252a36] text-xs font-bold transition-colors group"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#d4a359] to-[#f0cf85] text-black flex items-center justify-center font-black text-xs shadow-sm">
                    {userInitials}
                  </div>
                  <span className="text-white group-hover:text-[#d4a359] transition-colors font-display">
                    {username}
                  </span>
                  <span className="text-[10px] text-[#d4a359] font-mono font-bold bg-[#0d0f12] px-1.5 py-0.5 rounded border border-[#d4a359]/20">
                    {playerElo}
                  </span>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenAuth("signin")}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-[#14171f] border border-transparent hover:border-[#252a36] transition-all"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenAuth("signup")}
                  className="px-4 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-[#d4a359] to-[#f0cf85] hover:brightness-110 text-black font-display shadow-md shadow-[#d4a359]/20 hover:scale-105 transition-all"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Mobile Header Bar */}
        <header className="lg:hidden sticky top-0 z-30 h-14 bg-[#0d0f12]/95 backdrop-blur-md border-b border-[#252a36] px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Open navigation menu"
              className="p-2 rounded-xl bg-[#14171f] hover:bg-[#1c202a] text-slate-300 hover:text-white border border-[#252a36] transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <SovereignLogo href="/" size="sm" />
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Link
                href="/profile"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#14171f] border border-[#252a36] text-xs font-bold"
              >
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#d4a359] to-[#f0cf85] text-black flex items-center justify-center font-black text-[10px]">
                  {userInitials}
                </div>
                <span className="text-[11px] text-[#d4a359] font-mono">{playerElo}</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => handleOpenAuth("signin")}
                className="px-3 py-1 rounded-xl text-[11px] font-black bg-gradient-to-r from-[#d4a359] to-[#f0cf85] text-black font-display shadow-sm"
              >
                Sign In
              </button>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col py-4 px-3 sm:px-6 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Persistent Luxury Footer */}
        <footer className="w-full border-t border-[#1c212c] py-4 text-center text-xs text-slate-500 font-medium">
          <div className="flex items-center justify-center gap-2">
            <span className="font-display font-bold text-slate-400">SOVEREIGN CHESS</span>
            <span>&bull;</span>
            <span>Grandmaster Suite</span>
            <span>&bull;</span>
            <span className="italic text-[#d4a359]/80 font-serif">Think. Move. Win.</span>
          </div>
        </footer>
      </div>

      <Board3DModal />
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authMode}
      />
    </div>
  );
};
