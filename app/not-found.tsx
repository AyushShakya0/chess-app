import React from "react";
import Link from "next/link";
import { Home, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0d0f12] text-slate-100 flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="max-w-md w-full bg-[#14171f] border border-[#252a36] rounded-3xl p-8 shadow-2xl flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-[#d4a359]/15 border border-[#d4a359]/30 flex items-center justify-center text-[#d4a359] mb-5">
          <Compass className="w-8 h-8" />
        </div>

        <span className="text-4xl font-mono font-black gold-gradient-text mb-2">
          404
        </span>
        <h1 className="text-xl font-black text-white mb-2 font-display">Square Not on the Board</h1>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          The room, lesson, or square you navigated to does not exist or has already completed.
        </p>

        <Link
          href="/"
          className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#d4a359] to-[#e2b768] hover:from-[#e2b768] hover:to-[#f0cf85] text-black rounded-xl text-xs font-black transition-all shadow-lg font-display"
        >
          <Home className="w-4 h-4" />
          Return to Sovereign Arena
        </Link>
      </div>
    </div>
  );
}

