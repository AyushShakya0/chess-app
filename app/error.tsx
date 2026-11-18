"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Sovereign Chess Error Boundary]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0d0f12] text-slate-100 flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="max-w-md w-full bg-[#14171f] border border-rose-900/60 rounded-3xl p-8 shadow-2xl flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-5">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <h1 className="text-xl font-black text-white mb-2 font-display">Something went wrong</h1>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          An unexpected game engine or rendering error occurred. The board state has been safely isolated.
        </p>

        {error.message && (
          <div className="w-full bg-[#0d0f12] border border-[#252a36] rounded-xl p-3 text-xs font-mono text-rose-300 mb-6 text-left truncate">
            {error.message}
          </div>
        )}

        <div className="flex items-center gap-3 w-full">
          <button
            onClick={() => reset()}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#d4a359] to-[#e2b768] text-black rounded-xl text-xs font-black transition-all shadow-lg font-display"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#1c202a] hover:bg-[#252a36] text-slate-200 rounded-xl text-xs font-bold transition-all border border-[#252a36]"
          >
            <Home className="w-4 h-4" />
            Arena Home
          </Link>
        </div>
      </div>
    </div>
  );
}

