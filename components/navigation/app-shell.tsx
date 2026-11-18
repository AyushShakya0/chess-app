"use client";

import React, { useState } from "react";
import { Sidebar } from "./sidebar";
import { Board3DModal } from "@/components/chess/board-3d-modal";
import { Menu, Crown } from "lucide-react";
import { SovereignLogo } from "@/components/brand/sovereign-logo";

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0d0f12] text-slate-100 font-sans flex">
      {/* Persistent Left Sidebar (Desktop & Mobile Drawer) */}
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Viewport with Responsive Margin for Sidebar */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 transition-all duration-300">
        {/* Mobile-Only Minimal Header Bar (Desktop Top Bar is Clean / Empty) */}
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
            <span className="text-[10px] font-black uppercase tracking-wider text-[#d4a359] bg-[#d4a359]/10 px-2.5 py-1 rounded-full border border-[#d4a359]/30">
              Sovereign Arena
            </span>
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
    </div>
  );
};
