"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Chess, Square } from "chess.js";
import { Chessboard, BoardTheme, BoardArrow, BoardHighlight } from "../chess/board";
import {
  BookOpen,
  GraduationCap,
  Compass,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Zap,
  Lightbulb,
  GitBranch,
  Eye,
  Trophy,
  Swords,
  Search,
  Copy,
  Check,
  Share2,
} from "lucide-react";
import { sound } from "@/lib/audio/sound";
import confetti from "canvas-confetti";
import { OPENINGS_CATALOG, type OpeningFamily, type VariationLine, type OpeningMoveIdea } from "@/lib/data/openings";
import { getMoveCoordsFromSan } from "@/lib/data/puzzles";
import { CoursesHub } from "./courses-hub";

export const OpeningExplorer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"courses" | "openings" | "academy">("courses");

  // Selected Family and Active Variation Line
  const [selectedFamily, setSelectedFamily] = useState<OpeningFamily>(OPENINGS_CATALOG[0]);
  const [activeVariation, setActiveVariation] = useState<VariationLine>(OPENINGS_CATALOG[0].variations[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [copiedFen, setCopiedFen] = useState(false);
  const [copiedPgn, setCopiedPgn] = useState(false);

  // Board & Training State
  const [game, setGame] = useState<Chess>(new Chess());
  const [stepIndex, setStepIndex] = useState(0); // number of plies played so far
  const [practiceSide, setPracticeSide] = useState<"white" | "black">("white");
  const [isBotReplying, setIsBotReplying] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [showArrowHint, setShowArrowHint] = useState(true);
  const [theme] = useState<BoardTheme>("classic");

  // Filtered opening families based on category and search query
  const filteredFamilies = OPENINGS_CATALOG.filter((f) => {
    if (selectedCategory !== "All" && f.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = f.name.toLowerCase().includes(q);
      const matchVar = f.variations.some(
        (v) => v.name.toLowerCase().includes(q) || v.eco.toLowerCase().includes(q)
      );
      if (!matchName && !matchVar) return false;
    }
    return true;
  });

  const handleCopyFen = () => {
    navigator.clipboard.writeText(game.fen());
    setCopiedFen(true);
    setTimeout(() => setCopiedFen(false), 2000);
  };

  const handleCopyPgn = () => {
    const pgnMoves = activeVariation.moves
      .map((m, idx) => {
        const moveNum = Math.floor(idx / 2) + 1;
        return idx % 2 === 0 ? `${moveNum}. ${m.san}` : `${m.san}`;
      })
      .join(" ");
    navigator.clipboard.writeText(pgnMoves);
    setCopiedPgn(true);
    setTimeout(() => setCopiedPgn(false), 2000);
  };

  // Initialize or reset line
  const loadVariation = (variation: VariationLine, side?: "white" | "black") => {
    setActiveVariation(variation);
    setGame(new Chess());
    setStepIndex(0);
    setIsCompleted(false);
    setLastMove(null);
    setIsBotReplying(false);
    if (side) setPracticeSide(side);
    setFeedback({
      type: "info",
      text: `Training ${variation.name}. Move on the board or step through with arrows!`,
    });
    sound.playMove();
  };

  const handleSelectFamily = (family: OpeningFamily) => {
    setSelectedFamily(family);
    loadVariation(family.variations[0], family.defaultSide);
  };

  // Keyboard Arrow Key Navigation
  const handleStepForward = useCallback(() => {
    if (stepIndex >= activeVariation.moves.length) return;
    const targetMove = activeVariation.moves[stepIndex];
    try {
      const nextGame = new Chess(game.fen());
      const exec = nextGame.move(targetMove.san);
      if (exec) {
        setGame(new Chess(nextGame.fen()));
        setLastMove({ from: exec.from as Square, to: exec.to as Square });
        const nextStep = stepIndex + 1;
        setStepIndex(nextStep);
        sound.playMove();
        setFeedback({
          type: "info",
          text: `${targetMove.san}: ${targetMove.concept}`,
        });
        if (nextStep >= activeVariation.moves.length) {
          setIsCompleted(true);
          sound.playVictory();
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        }
      }
    } catch {}
  }, [stepIndex, activeVariation, game]);

  const handleStepBackward = useCallback(() => {
    if (stepIndex <= 0) return;
    const prevGame = new Chess(game.fen());
    prevGame.undo();
    setGame(new Chess(prevGame.fen()));
    setStepIndex(stepIndex - 1);
    setIsCompleted(false);
    setLastMove(null);
    sound.playMove();
    setFeedback(null);
  }, [stepIndex, game]);

  // Listen to keyboard arrow keys (ArrowLeft / ArrowRight)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        handleStepForward();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        handleStepBackward();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleStepForward, handleStepBackward]);

  // Jump directly to any move ply by clicking in the move list
  const jumpToMovePly = (targetPly: number) => {
    const targetGame = new Chess();
    for (let i = 0; i < targetPly; i++) {
      try {
        targetGame.move(activeVariation.moves[i].san);
      } catch {}
    }
    setGame(targetGame);
    setStepIndex(targetPly);
    setIsCompleted(targetPly >= activeVariation.moves.length);
    setLastMove(null);
    sound.playMove();
  };

  // Reset current line back to ply 0
  const resetLine = () => {
    setGame(new Chess());
    setStepIndex(0);
    setIsCompleted(false);
    setLastMove(null);
    setIsBotReplying(false);
    setFeedback({
      type: "info",
      text: `Reset to move 1. Make your opening move!`,
    });
    sound.playMove();
  };

  // Interactive Board Play: validates move against active theory or branches dynamically
  const handlePlayerMove = (m: { from: Square; to: Square; promotion?: string; san?: string }): boolean => {
    if (stepIndex >= activeVariation.moves.length || isBotReplying) return false;

    const playedSan = m.san || "";
    const expectedTarget = activeVariation.moves[stepIndex];

    // Check if played move matches active variation
    if (playedSan === expectedTarget.san) {
      const nextStep = stepIndex + 1;
      setStepIndex(nextStep);
      setLastMove({ from: m.from, to: m.to });
      setFeedback({
        type: "success",
        text: `✓ Book Move! ${expectedTarget.san}: ${expectedTarget.concept}`,
      });

      // Check if finished entire line
      if (nextStep >= activeVariation.moves.length) {
        setIsCompleted(true);
        sound.playVictory();
        confetti({ particleCount: 160, spread: 80, origin: { y: 0.6 } });
        return true;
      }

      // Check if next move belongs to the bot (the opponent)
      const nextMoveBelongsToBot =
        (practiceSide === "white" && game.turn() === "b") ||
        (practiceSide === "black" && game.turn() === "w");

      if (nextMoveBelongsToBot) {
        setIsBotReplying(true);
        setTimeout(() => {
          const botMoveIdea = activeVariation.moves[nextStep];
          try {
            const botExec = game.move(botMoveIdea.san);
            if (botExec) {
              setGame(new Chess(game.fen()));
              setLastMove({ from: botExec.from as Square, to: botExec.to as Square });
              const stepAfterBot = nextStep + 1;
              setStepIndex(stepAfterBot);

              if (botExec.captured) sound.playCapture();
              else sound.playMove();

              if (game.inCheck()) {
                setTimeout(() => sound.playCheck(), 100);
              }

              setIsBotReplying(false);
              setFeedback({
                type: "info",
                text: `Bot played ${botMoveIdea.san}: ${botMoveIdea.concept}`,
              });

              if (stepAfterBot >= activeVariation.moves.length) {
                setIsCompleted(true);
                sound.playVictory();
                confetti({ particleCount: 160, spread: 80, origin: { y: 0.6 } });
              }
            }
          } catch {
            setIsBotReplying(false);
          }
        }, 450);
      }
      return true;
    }

    // Check for dynamic branch detection in other variations of this or other families!
    const currentMoves = activeVariation.moves.slice(0, stepIndex).map((m) => m.san);
    const candidateMoves = [...currentMoves, playedSan];

    for (const fam of OPENINGS_CATALOG) {
      for (const v of fam.variations) {
        const matchesBranch = candidateMoves.every((san, idx) => v.moves[idx]?.san === san);
        if (matchesBranch) {
          // Switch to this branched variation!
          setSelectedFamily(fam);
          setActiveVariation(v);
          const nextStep = candidateMoves.length;
          setStepIndex(nextStep);
          setLastMove({ from: m.from, to: m.to });
          setFeedback({
            type: "success",
            text: `🔀 Branch Detected! Switched to ${v.name} (${playedSan}).`,
          });

          // Trigger bot response in new branch
          if (nextStep < v.moves.length) {
            setIsBotReplying(true);
            setTimeout(() => {
              const botMoveIdea = v.moves[nextStep];
              try {
                const botExec = game.move(botMoveIdea.san);
                if (botExec) {
                  setGame(new Chess(game.fen()));
                  setLastMove({ from: botExec.from as Square, to: botExec.to as Square });
                  setStepIndex(nextStep + 1);
                  sound.playMove();
                  setIsBotReplying(false);
                  setFeedback({
                    type: "info",
                    text: `Bot played ${botMoveIdea.san}: ${botMoveIdea.concept}`,
                  });
                }
              } catch {
                setIsBotReplying(false);
              }
            }, 450);
          }
          return true;
        }
      }
    }

    // Outside theory: reject and auto-undo on the board
    sound.playDefeat();
    setFeedback({
      type: "error",
      text: `❌ That's not the theoretical continuation. The recommended book move is ${expectedTarget.san}. Try again!`,
    });
    return false;
  };

  // Target move calculation for drawing arrows
  const currentTargetMove = activeVariation.moves[stepIndex];
  const targetCoords = currentTargetMove && showArrowHint
    ? getMoveCoordsFromSan(game.fen(), currentTargetMove.san)
    : null;

  const customArrows: BoardArrow[] = targetCoords
    ? [{ from: targetCoords.from, to: targetCoords.to, color: "#22c55e" }]
    : [];
  const customHighlights: BoardHighlight[] = targetCoords
    ? [
        { square: targetCoords.from, color: "rgba(34, 197, 94, 0.4)" },
        { square: targetCoords.to, color: "rgba(34, 197, 94, 0.55)" },
      ]
    : [];

  // Group moves into pairs: 1. e4 e5, 2. Nf3 Nc6 ...
  const pairedMoves: { num: number; white: { san: string; ply: number }; black?: { san: string; ply: number } }[] = [];
  for (let i = 0; i < activeVariation.moves.length; i += 2) {
    pairedMoves.push({
      num: Math.floor(i / 2) + 1,
      white: { san: activeVariation.moves[i].san, ply: i + 1 },
      black: activeVariation.moves[i + 1] ? { san: activeVariation.moves[i + 1].san, ply: i + 2 } : undefined,
    });
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 max-w-7xl mx-auto w-full">
      {/* Top Header & Tab Switcher */}
      <div className="flex flex-wrap items-center justify-between w-full bg-slate-800/80 border border-slate-700 rounded-2xl p-4 mb-6 shadow-xl backdrop-blur-md gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/20 border border-indigo-500/40 rounded-xl text-indigo-400">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Opening Academy & Courses</h2>
            <p className="text-xs text-slate-400">Deep grandmaster variations and structured interactive chess courses</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/90 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setActiveTab("courses")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "courses" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <GraduationCap className="w-4 h-4 text-amber-400" />
            Courses & Lessons
          </button>
          <button
            onClick={() => setActiveTab("openings")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "openings" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <Compass className="w-4 h-4 text-emerald-400" />
            Opening Explorer ({OPENINGS_CATALOG.length})
          </button>
          <button
            onClick={() => setActiveTab("academy")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "academy" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <BookOpen className="w-4 h-4 text-purple-400" />
            Principles
          </button>
        </div>
      </div>

      {activeTab === "courses" ? (
        <CoursesHub />
      ) : activeTab === "openings" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
          {/* Left Column: Board & Navigation Controls */}
          <div className="lg:col-span-8 flex flex-col items-center">
            {/* Opening Title & Variation Badge Bar */}
            <div className="flex flex-wrap items-center justify-between w-full max-w-[600px] mb-2 px-1 gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  {activeVariation.eco}
                </span>
                <span className="text-sm font-bold text-white">{activeVariation.name}</span>
              </div>

              {/* Action Buttons: FEN / PGN / Side Selector */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopyFen}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-[10px] font-mono text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
                  title="Copy current position FEN"
                >
                  {copiedFen ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedFen ? "Copied" : "FEN"}
                </button>
                <button
                  onClick={handleCopyPgn}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-[10px] font-mono text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
                  title="Copy variation PGN"
                >
                  {copiedPgn ? <Check className="w-3 h-3 text-emerald-400" /> : <Share2 className="w-3 h-3" />}
                  {copiedPgn ? "Copied" : "PGN"}
                </button>
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 p-0.5 rounded-lg text-[11px]">
                  <button
                    onClick={() => setPracticeSide("white")}
                    className={`px-2 py-0.5 rounded font-bold transition-colors ${
                      practiceSide === "white" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    ⚪ White
                  </button>
                  <button
                    onClick={() => setPracticeSide("black")}
                    className={`px-2 py-0.5 rounded font-bold transition-colors ${
                      practiceSide === "black" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    ⚫ Black
                  </button>
                </div>
              </div>
            </div>

            {/* Chessboard */}
            <Chessboard
              game={game}
              orientation={practiceSide}
              onMove={handlePlayerMove}
              interactive={!isBotReplying && !isCompleted}
              allowedColor={practiceSide === "white" ? "w" : "b"}
              theme={theme}
              lastMove={lastMove}
              customArrows={customArrows}
              customHighlights={customHighlights}
            />

            {/* Navigation Buttons & Keyboard Arrow Hint */}
            <div className="flex items-center justify-between w-full max-w-[600px] mt-3 gap-2">
              <button
                onClick={handleStepBackward}
                disabled={stepIndex <= 0}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition-colors"
                title="Keyboard: Left Arrow"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Previous Move
              </button>

              <span className="text-xs font-mono font-semibold text-slate-400">
                Move {stepIndex} / {activeVariation.moves.length} plies
              </span>

              <button
                onClick={handleStepForward}
                disabled={stepIndex >= activeVariation.moves.length}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-colors shadow-md"
                title="Keyboard: Right Arrow"
              >
                Next Move
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Current Target Move Explanation */}
            {currentTargetMove && (
              <div className="w-full max-w-[600px] mt-3 p-3.5 bg-slate-900/90 border border-slate-700 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 text-xs font-black text-amber-400 uppercase tracking-wider">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                    Target Move: {currentTargetMove.san}
                  </div>
                  <button
                    onClick={() => setShowArrowHint(!showArrowHint)}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                  >
                    <Eye className="w-3 h-3" />
                    {showArrowHint ? "Hide Arrow" : "Show Arrow"}
                  </button>
                </div>
                <p className="text-xs text-slate-300">{currentTargetMove.concept}</p>
              </div>
            )}

            {/* Feedback Message */}
            {feedback && (
              <div
                className={`w-full max-w-[600px] mt-3 p-3 rounded-xl text-xs font-bold text-center border transition-all ${
                  feedback.type === "success"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : feedback.type === "error"
                    ? "bg-red-500/20 text-red-300 border-red-500/40 animate-shake"
                    : "bg-blue-500/20 text-blue-300 border-blue-500/40"
                }`}
              >
                {feedback.text}
              </div>
            )}
          </div>

          {/* Right Column: Complete Move Order Sheet & Variations Tree */}
          <div className="lg:col-span-4 flex flex-col gap-4 w-full">
            {/* Opening Families Selector with Search & Category Filters */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Opening Books ({filteredFamilies.length})
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search openings, ECO (e.g. Najdorf, C97, London)..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-1 mb-2.5">
                {["All", "1.e4 Open Games", "1.e4 Semi-Open", "1.d4 Closed Games", "Flank Openings"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors ${
                      selectedCategory === cat
                        ? "bg-blue-600 text-white"
                        : "bg-slate-900 text-slate-400 hover:text-white"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                {filteredFamilies.map((family) => (
                  <button
                    key={family.id}
                    onClick={() => handleSelectFamily(family)}
                    className={`p-2.5 rounded-xl text-left border transition-all ${
                      selectedFamily.id === family.id
                        ? "bg-blue-600/20 border-blue-500 text-white shadow-md"
                        : "bg-slate-900/60 border-slate-700/60 text-slate-300 hover:bg-slate-750"
                    }`}
                  >
                    <div className="text-xs font-bold line-clamp-1">{family.name}</div>
                    <span className="text-[10px] text-slate-400 block truncate">{family.category}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Variations of Selected Family */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2.5">
                <GitBranch className="w-4 h-4" />
                Available Variations ({selectedFamily.name})
              </div>
              <div className="flex flex-col gap-2">
                {selectedFamily.variations.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => loadVariation(v)}
                    className={`p-2.5 rounded-xl text-left border transition-all ${
                      activeVariation.id === v.id
                        ? "bg-indigo-600/20 border-indigo-500 text-white shadow-md"
                        : "bg-slate-900/60 border-slate-700/60 text-slate-300 hover:bg-slate-750"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{v.name}</span>
                      <span className="text-[10px] font-mono font-bold text-indigo-400">{v.eco}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{v.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Complete Interactive Move Order Sheet (Scrollable beyond 10 moves!) */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  Full Move Order (Middlegame Theory)
                </span>
                <button
                  onClick={resetLine}
                  className="text-[11px] font-semibold text-slate-400 hover:text-white flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              </div>

              {/* Scrollable Notation Sheet */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 max-h-[220px] overflow-y-auto space-y-1">
                {pairedMoves.map((pair) => (
                  <div key={pair.num} className="grid grid-cols-12 text-xs py-0.5 px-1 rounded hover:bg-slate-900/60 items-center">
                    <span className="col-span-2 font-mono text-slate-500 font-bold">{pair.num}.</span>

                    {/* White Move */}
                    <button
                      onClick={() => jumpToMovePly(pair.white.ply)}
                      className={`col-span-5 text-left px-1.5 py-0.5 rounded font-mono font-bold transition-colors ${
                        stepIndex === pair.white.ply
                          ? "bg-blue-600 text-white"
                          : "text-slate-300 hover:text-white hover:bg-slate-800"
                      }`}
                    >
                      {pair.white.san}
                    </button>

                    {/* Black Move */}
                    {pair.black ? (
                      <button
                        onClick={() => jumpToMovePly(pair.black!.ply)}
                        className={`col-span-5 text-left px-1.5 py-0.5 rounded font-mono font-bold transition-colors ${
                          stepIndex === pair.black.ply
                            ? "bg-blue-600 text-white"
                            : "text-slate-300 hover:text-white hover:bg-slate-800"
                        }`}
                      >
                        {pair.black.san}
                      </button>
                    ) : (
                      <span className="col-span-5 text-slate-600">-</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                <span>💡 Tip: Use &larr; &rarr; arrow keys to navigate moves</span>
                <span className="font-mono">{activeVariation.moves.length} moves</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Grandmaster Opening Academy Tab */
        <div className="max-w-4xl mx-auto w-full space-y-6">
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-2">The 3 Golden Rules of Opening Mastery</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="p-4 bg-slate-900/80 border border-slate-700/80 rounded-xl">
                <span className="text-blue-400 font-black text-sm block mb-1">1. Center Domination</span>
                <p className="text-xs text-slate-300">
                  Stake claims on e4, d4, e5, and d5 with pawns. The center dictates piece mobility across the whole board.
                </p>
              </div>
              <div className="p-4 bg-slate-900/80 border border-slate-700/80 rounded-xl">
                <span className="text-amber-400 font-black text-sm block mb-1">2. Rapid Development</span>
                <p className="text-xs text-slate-300">
                  Develop knights before bishops. Avoid moving the same piece twice in the opening without a direct tactical gain.
                </p>
              </div>
              <div className="p-4 bg-slate-900/80 border border-slate-700/80 rounded-xl">
                <span className="text-emerald-400 font-black text-sm block mb-1">3. King Safety</span>
                <p className="text-xs text-slate-300">
                  Castle early (moves 5-9) to tuck your King into safety and connect the rooks along the open central files.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Celebratory Completion Modal */}
      {isCompleted && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-blue-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-gradient-to-tr from-amber-500 to-yellow-400 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <Trophy className="w-8 h-8 text-slate-950" />
            </div>

            <h3 className="text-xl font-black text-white mb-1">
              🎉 Mastered {activeVariation.name}!
            </h3>
            <span className="text-xs font-mono font-bold text-blue-400 mb-3 block">
              ECO {activeVariation.eco} &bull; {activeVariation.moves.length} Plies Deep
            </span>

            <p className="text-xs text-slate-300 mb-5 leading-relaxed">
              Congratulations! You navigated through the opening book and successfully reached the active grandmaster middlegame setup.
            </p>

            <div className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 mb-5 text-left">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                Middlegame Strategy
              </span>
              <p className="text-xs text-slate-400">{activeVariation.description}</p>
            </div>

            <div className="flex flex-col gap-2 w-full">
              <button
                onClick={() => setIsCompleted(false)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                Review Move Notation
              </button>
              <button
                onClick={resetLine}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-slate-700 transition-all"
              >
                Replay From Move 1
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
