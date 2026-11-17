"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Chess, type Square, type PieceSymbol, type Color } from "chess.js";
import { ChessPiece } from "./pieces";
import { sound } from "@/lib/audio/sound";
import { stockfish, type StockfishEvaluation } from "@/lib/engine/stockfish-service";
import {
  RotateCcw,
  Trash2,
  Copy,
  Check,
  Bot,
  Activity,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Sliders,
} from "lucide-react";
import Link from "next/link";
import { FILES, RANKS, getSquareColor } from "@/lib/chess/vision-engine";

interface PieceOption {
  type: PieceSymbol;
  color: Color;
  label: string;
}

const PIECE_PALETTE: PieceOption[] = [
  { type: "k", color: "w", label: "White King" },
  { type: "q", color: "w", label: "White Queen" },
  { type: "r", color: "w", label: "White Rook" },
  { type: "b", color: "w", label: "White Bishop" },
  { type: "n", color: "w", label: "White Knight" },
  { type: "p", color: "w", label: "White Pawn" },
  { type: "k", color: "b", label: "Black King" },
  { type: "q", color: "b", label: "Black Queen" },
  { type: "r", color: "b", label: "Black Rook" },
  { type: "b", color: "b", label: "Black Bishop" },
  { type: "n", color: "b", label: "Black Knight" },
  { type: "p", color: "b", label: "Black Pawn" },
];

export const BoardEditor: React.FC = () => {
  const [boardState, setBoardState] = useState<Record<Square, { type: PieceSymbol; color: Color } | null>>(() => {
    const initial = new Chess();
    const map: Record<Square, { type: PieceSymbol; color: Color } | null> = {} as any;
    for (const file of FILES) {
      for (const rank of RANKS) {
        const sq = `${file}${rank}` as Square;
        const p = initial.get(sq);
        map[sq] = p ? { type: p.type, color: p.color } : null;
      }
    }
    return map;
  });

  const [selectedTool, setSelectedTool] = useState<PieceOption | "trash" | null>(null);
  const [turn, setTurn] = useState<Color>("w");
  const [castling, setCastling] = useState({ K: true, Q: true, k: true, q: true });
  const [orientation, setOrientation] = useState<"white" | "black">("white");
  const [copiedFen, setCopiedFen] = useState(false);

  // Stockfish Instant Analysis
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sfEval, setSfEval] = useState<StockfishEvaluation | null>(null);

  // Load FEN from URL query parameters if provided
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const customFen = params.get("fen");
    if (!customFen) return;
    try {
      const parsed = new Chess(customFen);
      const map: Record<Square, { type: PieceSymbol; color: Color } | null> = {} as any;
      for (const file of FILES) {
        for (const rank of RANKS) {
          const sq = `${file}${rank}` as Square;
          const p = parsed.get(sq);
          map[sq] = p ? { type: p.type, color: p.color } : null;
        }
      }
      setBoardState(map);
      setTurn(parsed.turn());
      const tokens = customFen.trim().split(/\s+/);
      const castlingStr = tokens[2] || "-";
      setCastling({
        K: castlingStr.includes("K"),
        Q: castlingStr.includes("Q"),
        k: castlingStr.includes("k"),
        q: castlingStr.includes("q"),
      });
    } catch {
      // Ignore invalid initial FEN query
    }
  }, []);

  // Derive FEN from current boardState
  const currentFen = useMemo(() => {
    let fen = "";
    for (let r = 8; r >= 1; r--) {
      let emptyCount = 0;
      for (let f = 0; f < 8; f++) {
        const file = FILES[f];
        const sq = `${file}${r}` as Square;
        const piece = boardState[sq];

        if (!piece) {
          emptyCount++;
        } else {
          if (emptyCount > 0) {
            fen += String(emptyCount);
            emptyCount = 0;
          }
          const char = piece.type;
          fen += piece.color === "w" ? char.toUpperCase() : char.toLowerCase();
        }
      }
      if (emptyCount > 0) {
        fen += String(emptyCount);
      }
      if (r > 1) fen += "/";
    }

    // Active color
    fen += ` ${turn}`;

    // Castling rights
    let castlingStr = "";
    if (castling.K) castlingStr += "K";
    if (castling.Q) castlingStr += "Q";
    if (castling.k) castlingStr += "k";
    if (castling.q) castlingStr += "q";
    fen += ` ${castlingStr || "-"}`;

    // En passant, halfmove, fullmove
    fen += " - 0 1";
    return fen;
  }, [boardState, turn, castling]);

  // Validation
  const validation = useMemo(() => {
    let whiteKings = 0;
    let blackKings = 0;
    let invalidPawns = false;

    for (const [sq, p] of Object.entries(boardState)) {
      if (!p) continue;
      if (p.type === "k") {
        if (p.color === "w") whiteKings++;
        else blackKings++;
      }
      if (p.type === "p") {
        const rank = sq[1];
        if (rank === "1" || rank === "8") {
          invalidPawns = true;
        }
      }
    }

    if (whiteKings === 0) return { valid: false, error: "Missing White King (White must have exactly 1 King)." };
    if (whiteKings > 1) return { valid: false, error: "Too many White Kings (Must have exactly 1 King)." };
    if (blackKings === 0) return { valid: false, error: "Missing Black King (Black must have exactly 1 King)." };
    if (blackKings > 1) return { valid: false, error: "Too many Black Kings (Must have exactly 1 King)." };
    if (invalidPawns) return { valid: false, error: "Pawns cannot be placed on rank 1 or rank 8." };

    try {
      new Chess(currentFen);
      return { valid: true, error: null };
    } catch (e: any) {
      return { valid: false, error: e.message || "Invalid position arrangement." };
    }
  }, [boardState, currentFen]);

  // Square Click handler
  const handleSquareClick = (sq: Square) => {
    if (!selectedTool) return;

    sound.playMove();
    setBoardState((prev) => {
      if (selectedTool === "trash") {
        return { ...prev, [sq]: null };
      }
      return { ...prev, [sq]: { type: selectedTool.type, color: selectedTool.color } };
    });
    setSfEval(null);
  };

  // Reset to initial standard chess position
  const handleResetInitial = () => {
    const initial = new Chess();
    const map: Record<Square, { type: PieceSymbol; color: Color } | null> = {} as any;
    for (const file of FILES) {
      for (const rank of RANKS) {
        const sq = `${file}${rank}` as Square;
        const p = initial.get(sq);
        map[sq] = p ? { type: p.type, color: p.color } : null;
      }
    }
    setBoardState(map);
    setTurn("w");
    setCastling({ K: true, Q: true, k: true, q: true });
    setSfEval(null);
    sound.playMove();
  };

  // Clear all pieces
  const handleClearBoard = () => {
    const map: Record<Square, { type: PieceSymbol; color: Color } | null> = {} as any;
    for (const file of FILES) {
      for (const rank of RANKS) {
        map[`${file}${rank}` as Square] = null;
      }
    }
    setBoardState(map);
    setCastling({ K: false, Q: false, k: false, q: false });
    setSfEval(null);
    sound.playMove();
  };

  const handleCopyFen = () => {
    navigator.clipboard.writeText(currentFen);
    setCopiedFen(true);
    setTimeout(() => setCopiedFen(false), 2000);
  };

  const handleRunAnalysis = async () => {
    if (!validation.valid) return;
    setIsAnalyzing(true);
    try {
      const res = await stockfish.evaluate(currentFen, 4);
      setSfEval(res);
    } catch {
      // Ignored
    }
    setIsAnalyzing(false);
  };

  const renderRanks = orientation === "white" ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
  const renderFiles = orientation === "white" ? FILES : [...FILES].reverse();

  return (
    <div className="flex flex-col items-center justify-center p-4 max-w-6xl mx-auto w-full">
      {/* Header Hub */}
      <div className="w-full bg-slate-800/90 border border-slate-700 rounded-3xl p-5 mb-6 shadow-2xl backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">Board & Position Editor</h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Place pieces freely to set up tactical puzzles, study custom positions, and analyze with Stockfish
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetInitial}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold border border-slate-600 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Starting
            </button>
            <button
              onClick={handleClearBoard}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs font-bold border border-rose-500/40 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Board
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
        {/* Left: 8x8 Canvas */}
        <div className="lg:col-span-8 flex flex-col items-center">
          <div className="relative p-2 bg-slate-900 border-2 border-slate-700/80 rounded-2xl shadow-2xl select-none">
            <div
              className="grid grid-cols-8 gap-0 border border-slate-700/50 rounded-xl overflow-hidden"
              style={{
                width: "min(88vw, 540px)",
                height: "min(88vw, 540px)",
              }}
            >
              {renderRanks.map((r) =>
                renderFiles.map((f) => {
                  const sq = `${f}${r}` as Square;
                  const isLight = getSquareColor(sq) === "light";
                  const piece = boardState[sq];

                  return (
                    <div
                      key={sq}
                      onClick={() => handleSquareClick(sq)}
                      className={`relative flex items-center justify-center cursor-pointer transition-colors duration-100 ${
                        isLight ? "bg-[#ebecd0] hover:bg-[#d8d9b8]" : "bg-[#739552] hover:bg-[#638244]"
                      }`}
                    >
                      {/* Optional Coordinate on edges */}
                      {f === (orientation === "white" ? "a" : "h") && (
                        <span
                          className={`absolute top-0.5 left-1 text-[10px] font-black select-none pointer-events-none ${
                            isLight ? "text-[#739552]" : "text-[#ebecd0]"
                          }`}
                        >
                          {r}
                        </span>
                      )}
                      {r === (orientation === "white" ? 1 : 8) && (
                        <span
                          className={`absolute bottom-0.5 right-1 text-[10px] font-black select-none pointer-events-none uppercase ${
                            isLight ? "text-[#739552]" : "text-[#ebecd0]"
                          }`}
                        >
                          {f}
                        </span>
                      )}

                      {/* Piece Icon */}
                      {piece && (
                        <div className="w-full h-full flex items-center justify-center p-1 pointer-events-none">
                          <ChessPiece type={piece.type} color={piece.color} size={42} />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* FEN Bar */}
          <div className="flex flex-wrap items-center justify-between w-full max-w-[540px] mt-3 px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs gap-2">
            <div className="flex items-center gap-1.5 truncate max-w-[360px] text-slate-400 font-mono text-[11px]">
              <span className="text-slate-500 font-bold">FEN:</span>
              <span className="truncate">{currentFen}</span>
            </div>
            <button
              onClick={handleCopyFen}
              className="flex items-center gap-1 text-[11px] font-bold text-slate-300 hover:text-white px-2.5 py-1 rounded bg-slate-800 border border-slate-700 transition-colors"
            >
              {copiedFen ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedFen ? "Copied" : "Copy FEN"}</span>
            </button>
          </div>
        </div>

        {/* Right: Piece Palette & Attributes */}
        <div className="lg:col-span-4 flex flex-col gap-4 w-full">
          {/* Piece Palette */}
          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 shadow-xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Piece Palette</h3>

            {/* White Pieces */}
            <div className="mb-3">
              <span className="text-[11px] font-bold text-slate-300 block mb-1.5">White Pieces</span>
              <div className="grid grid-cols-6 gap-1 bg-slate-900 p-1.5 rounded-xl border border-slate-700/60">
                {PIECE_PALETTE.slice(0, 6).map((p) => {
                  const isSelected = selectedTool && selectedTool !== "trash" && selectedTool.type === p.type && selectedTool.color === p.color;
                  return (
                    <button
                      key={`w-${p.type}`}
                      onClick={() => setSelectedTool(p)}
                      className={`p-1 rounded-lg flex items-center justify-center transition-all ${
                        isSelected ? "bg-blue-600 shadow-md ring-2 ring-blue-400" : "hover:bg-slate-800"
                      }`}
                      title={p.label}
                    >
                      <ChessPiece type={p.type} color={p.color} size={30} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Black Pieces */}
            <div className="mb-4">
              <span className="text-[11px] font-bold text-slate-300 block mb-1.5">Black Pieces</span>
              <div className="grid grid-cols-6 gap-1 bg-slate-900 p-1.5 rounded-xl border border-slate-700/60">
                {PIECE_PALETTE.slice(6, 12).map((p) => {
                  const isSelected = selectedTool && selectedTool !== "trash" && selectedTool.type === p.type && selectedTool.color === p.color;
                  return (
                    <button
                      key={`b-${p.type}`}
                      onClick={() => setSelectedTool(p)}
                      className={`p-1 rounded-lg flex items-center justify-center transition-all ${
                        isSelected ? "bg-blue-600 shadow-md ring-2 ring-blue-400" : "hover:bg-slate-800"
                      }`}
                      title={p.label}
                    >
                      <ChessPiece type={p.type} color={p.color} size={30} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Eraser Tool */}
            <button
              onClick={() => setSelectedTool("trash")}
              className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                selectedTool === "trash"
                  ? "bg-rose-600 border-rose-500 text-white shadow-md ring-2 ring-rose-400"
                  : "bg-slate-900 border-slate-750 text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Eraser Tool (Click square to remove piece)</span>
            </button>
          </div>

          {/* Match Settings & Castling Rights */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-xl space-y-4">
            {/* Active Turn */}
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Turn to Move</span>
              <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-xl border border-slate-700 text-xs font-bold">
                <button
                  onClick={() => setTurn("w")}
                  className={`py-1.5 rounded-lg transition-all ${
                    turn === "w" ? "bg-slate-700 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  White to Move
                </button>
                <button
                  onClick={() => setTurn("b")}
                  className={`py-1.5 rounded-lg transition-all ${
                    turn === "b" ? "bg-slate-700 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Black to Move
                </button>
              </div>
            </div>

            {/* Castling Rights */}
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Castling Rights</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 p-2 bg-slate-900 rounded-xl border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={castling.K}
                    onChange={(e) => setCastling((c) => ({ ...c, K: e.target.checked }))}
                    className="accent-blue-500 rounded"
                  />
                  <span className="text-slate-300 font-semibold">White O-O</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-slate-900 rounded-xl border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={castling.Q}
                    onChange={(e) => setCastling((c) => ({ ...c, Q: e.target.checked }))}
                    className="accent-blue-500 rounded"
                  />
                  <span className="text-slate-300 font-semibold">White O-O-O</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-slate-900 rounded-xl border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={castling.k}
                    onChange={(e) => setCastling((c) => ({ ...c, k: e.target.checked }))}
                    className="accent-blue-500 rounded"
                  />
                  <span className="text-slate-300 font-semibold">Black O-O</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-slate-900 rounded-xl border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={castling.q}
                    onChange={(e) => setCastling((c) => ({ ...c, q: e.target.checked }))}
                    className="accent-blue-500 rounded"
                  />
                  <span className="text-slate-300 font-semibold">Black O-O-O</span>
                </label>
              </div>
            </div>

            {/* Validation Feedback */}
            {!validation.valid && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-xs text-red-300">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
                <span>{validation.error}</span>
              </div>
            )}

            {/* Actions: Play vs AI & Stockfish Analysis */}
            <div className="space-y-2 pt-2 border-t border-slate-700/60">
              <Link
                href={validation.valid ? `/bots?fen=${encodeURIComponent(currentFen)}` : "#"}
                className={`w-full py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
                  validation.valid
                    ? "bg-blue-600 hover:bg-blue-500 text-white"
                    : "bg-slate-800 text-slate-500 cursor-not-allowed pointer-events-none"
                }`}
              >
                <Bot className="w-4 h-4" />
                <span>Play vs AI from this Position</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <button
                onClick={handleRunAnalysis}
                disabled={!validation.valid || isAnalyzing}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-750 disabled:opacity-50 text-slate-200 hover:text-white rounded-xl text-xs font-bold border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isAnalyzing ? "Stockfish Calculating..." : "Analyze with Stockfish"}</span>
              </button>
            </div>

            {/* Stockfish Analysis Result */}
            {sfEval && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 animate-fade-in space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span>Stockfish Evaluation:</span>
                  <span className="font-mono">
                    {sfEval.isMate ? `Mate in ${sfEval.mateIn}` : `${(sfEval.scoreCp / 100).toFixed(2)} pawns`}
                  </span>
                </div>
                {sfEval.bestMove && (
                  <p className="text-[11px] text-slate-400">
                    Recommended Move: <strong className="text-white font-mono">{sfEval.bestMove}</strong>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
