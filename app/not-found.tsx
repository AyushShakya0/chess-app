import React from "react";
import Link from "next/link";
import { Home, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-5">
          <Compass className="w-8 h-8" />
        </div>

        <span className="text-4xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 mb-2">
          404
        </span>
        <h1 className="text-xl font-black text-white mb-2">Square Not on the Board</h1>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          The room, lesson, or square you navigated to does not exist or has already completed.
        </p>

        <Link
          href="/"
          className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg"
        >
          <Home className="w-4 h-4" />
          Return to Chess Arena
        </Link>
      </div>
    </div>
  );
}

