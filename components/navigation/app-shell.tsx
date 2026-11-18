"use client";

import React from "react";
import { Navbar } from "./navbar";
import { Board3DModal } from "@/components/chess/board-3d-modal";

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#0d0f12] text-slate-100 font-sans">
      <Navbar />
      <main className="flex-1 flex flex-col py-2 sm:py-3 px-2 sm:px-4">
        {children}
      </main>
      <Board3DModal />
      <footer className="w-full border-t border-[#1c212c] py-3 text-center text-xs text-slate-500 font-medium">
        <div className="flex items-center justify-center gap-2">
          <span className="font-display font-bold text-slate-400">SOVEREIGN CHESS</span>
          <span>&bull;</span>
          <span>Grandmaster Suite</span>
          <span>&bull;</span>
          <span className="italic text-[#d4a359]/70">Think. Move. Win.</span>
        </div>
      </footer>
    </div>
  );
};
