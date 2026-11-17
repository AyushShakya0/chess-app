"use client";

import React from "react";
import { Navbar } from "./navbar";
import { Board3DModal } from "@/components/chess/board-3d-modal";

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />
      <main className="flex-1 flex flex-col py-2 sm:py-3 px-2 sm:px-4">
        {children}
      </main>
      <Board3DModal />
      <footer className="w-full border-t border-slate-900 py-2.5 text-center text-[11px] text-slate-500">
        Prin Chess &copy; {new Date().getFullYear()} &bull; Built with Next.js, Supabase, Go & Google AI Studio
      </footer>
    </div>
  );
};
