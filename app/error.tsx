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
    console.error("[Prin Chess Error Boundary]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-slate-900 border border-red-900/60 rounded-3xl p-8 shadow-2xl flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-5">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <h1 className="text-xl font-black text-white mb-2">Something went wrong</h1>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          An unexpected game engine or rendering error occurred. The board state has been safely isolated.
        </p>

        {error.message && (
          <div className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-red-300 mb-6 text-left truncate">
            {error.message}
          </div>
        )}

        <div className="flex items-center gap-3 w-full">
          <button
            onClick={() => reset()}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700"
          >
            <Home className="w-4 h-4" />
            Back Home
          </Link>
        </div>
      </div>
    </div>
  );
}

