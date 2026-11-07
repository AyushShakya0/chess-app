"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/navigation/navbar";
import { AiBotsPlay } from "@/components/chess/ai-bots";
import { PassAndPlay } from "@/components/chess/pass-and-play";
import { KnightsTour } from "@/components/chess/knights-tour";
import { BossMode } from "@/components/chess/boss-mode";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"bots" | "pass" | "tour" | "boss">("bots");

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 flex flex-col py-6 px-3 sm:px-6">
        {activeTab === "bots" && <AiBotsPlay />}
        {activeTab === "pass" && <PassAndPlay />}
        {activeTab === "tour" && <KnightsTour />}
        {activeTab === "boss" && <BossMode />}
      </main>

      <footer className="w-full border-t border-slate-900 py-4 text-center text-xs text-slate-500">
        VibeChess &copy; {new Date().getFullYear()} &bull; Built with Next.js, Supabase, Go & Google AI Studio
      </footer>
    </div>
  );
}
