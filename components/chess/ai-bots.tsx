"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Chess, Square, Move } from "chess.js";
import { Chessboard } from "./board";
import { sound } from "@/lib/audio/sound";
import { engineClient } from "@/lib/engine/engine-client";
import {
  Bot,
  RefreshCw,
  Trophy,
  Sparkles,
  Settings,
  Copy,
  Check,
  Download,
  Upload,
  Maximize2,
  Minimize2,
  X,
  Sliders,
} from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { EvaluationBar } from "./evaluation-bar";
import { SettingsModal } from "./settings-modal";
import { GameReviewModal } from "./game-review-modal";
import { useChessGame } from "@/lib/chess/use-chess-game";
import { useSettings } from "@/lib/stores/settings-store";

export interface BotPersona {
  id: string;
  name: string;
  elo: number;
  avatar: string;
  title: string;
  description: string;
  depth: number;
  blunderRate: number; // 0 to 1
  dialogs: {
    start: string[];
    goodMove: string[];
    blunder: string[];
    check: string[];
    win: string[];
    lose: string[];
  };
}

export const BOT_CATALOG: BotPersona[] = [
  {
    id: "mittens",
    name: "Mittens Noob",
    elo: 400,
    avatar: "🐱",
    title: "Curious Kitten",
    description: "Cute, distracted, and drops pieces constantly.",
    depth: 1,
    blunderRate: 0.65,
    dialogs: {
      start: ["Meow! I found a shiny piece!", "Wait, which one is the horse again?", "Let's play! *paws at board*"],
      goodMove: ["Ooh, that looked fancy!", "Purrr...", "Did you mean to do that?"],
      blunder: ["Oopsie! Did I need that?", "Mew... my bishop ran away.", "Wait, undo? No? Okay :("],
      check: ["A piece is pointing at my King! Meow!", "Is this check? My King is scared!", "Hey, not so loud!"],
      win: ["Yay! I knocked over all the pieces! Mew!", "Did I win? Where is my treat?", "Purrrr... good game friend!"],
      lose: ["Hisss... my king took a nap.", "Good game! Can I bat the pawns now?", "You got me! Meow..."],
    },
  },
  {
    id: "hustler",
    name: "Park Hustler",
    elo: 1100,
    avatar: "🧢",
    title: "Washington Square Hustler",
    description: "Trash-talking blitz enthusiast. Plays the Scholar's Mate every time.",
    depth: 3,
    blunderRate: 0.28,
    dialogs: {
      start: ["Five bucks says you don't survive 20 moves, kid.", "Touch piece, you move piece. No takebacks in my park.", "Clock's ticking, rookie."],
      goodMove: ["Hmph. Beginner's luck.", "I gave you that square.", "Cute move. Won't save you."],
      blunder: ["Free piece! Much obliged, partner.", "That was a gift. Cash or Venmo?", "You sure about that one?"],
      check: ["Check! Watch the crown!", "Check! Better run that king!", "Boom! King's in the crosshairs!"],
      win: ["Pay up! Just like that, Washington Square rules.", "Told ya, kid. Next challenger!", "Easiest coffee money I made today."],
      lose: ["You got lucky today, kid. Rematch right now.", "Whatever, sun was in my eyes.", "Alright, respect. You can actually play."],
    },
  },
  {
    id: "gotham",
    name: "Gotham Sensei",
    elo: 1600,
    avatar: "🎙️",
    title: "The Content Sensei",
    description: "Energetic IM and streamer. Loves the Vienna, screams at the Caro-Kann.",
    depth: 4,
    blunderRate: 0.12,
    dialogs: {
      start: ["WELCOME BACK TO THE CHESSBOARD!", "If you play the London I might cry.", "Let's play some real chess today."],
      goodMove: ["OKAY! That is a brilliant concept!", "Look at this move! Masterclass!", "HE SACRIFICED... THE ROOOOOK!"],
      blunder: ["AND HE SACRIFICES... FOR ABSOLUTELY NOTHING!", "What was that?! That's a minus four blunder!", "Call the police, a crime was just committed."],
      check: ["CHECK! The pressure is real!", "Check! Finding king safety is mandatory!", "Tempo with check! Delicious."],
      win: ["AND THAT IS CHECKMATE! Subscribe to the channel!", "Clinical conversion. Textbook endgame.", "Hope you learned something today!"],
      lose: ["You outplayed me. Send that game to Guess the ELO.", "Genuinely superb calculation. Respect.", "Well played... I need some water."],
    },
  },
  {
    id: "hikaru",
    name: "Hikaru Speed",
    elo: 2200,
    avatar: "⚡",
    title: "Blitz Speed Demon",
    description: "Fast-talking super-GM. Premoves everything and calculates 15 lines simultaneously.",
    depth: 6,
    blunderRate: 0.04,
    dialogs: {
      start: ["Take, take, take, and we're totally fine here. Let's go.", "Wait, does this move work? Yeah, it literally does.", "Chat, look at this. Easy game."],
      goodMove: ["Okay, wait, that's actually a move. Wait, is that good?", "Takes, takes, wait that's pretty sharp.", "Not bad, but I still have counterplay."],
      blunder: ["Wait, he blundered? Chat, he literally just blundered.", "Takes, takes, queen here and it's completely winning.", "That's just completely losing on the spot."],
      check: ["Check. Quick tempo.", "Check, king moves, and we push.", "Check! You have only one legal reply."],
      win: ["Gg, literally completely winning from move 10.", "Thanks for the game, chat said it was GG.", "Takes, takes, mate. Good game!"],
      lose: ["Wait, what? I missed that? Wow, crazy game, gg.", "Incredible calculation. You're super underrated.", "Gg! Really strong tactical play."],
    },
  },
  {
    id: "magnus",
    name: "Magnus Endboss",
    elo: 2800,
    avatar: "👑",
    title: "The Classical World Champion",
    description: "The GOAT. Grinds you down in 80 moves with ruthless endgame precision.",
    depth: 7,
    blunderRate: 0.01,
    dialogs: {
      start: ["A draw is not an option.", "Let's see if you can handle the endgame.", "Every piece has a purpose. Show me yours."],
      goodMove: ["Respectable preparation.", "A solid idea. Let's see your continuation.", "You understand the position."],
      blunder: ["Inaccurate. The advantage is decisive now.", "A tiny concession, but enough to win.", "That pawn structure is fatally damaged."],
      check: ["Check. Your king is uncoordinated.", "Check. The king has no comfortable squares.", "Check. Precise defence is required."],
      win: ["Good effort, but positional mastery wins.", "The knight endgame is settled.", "Checkmate."],
      lose: ["Incredible game. You outplayed me completely.", "Remarkable calculation. Well done.", "A true masterpiece."],
    },
  },
];

function getRandomLine(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const AiBotsPlay: React.FC = () => {
  const [selectedBot, setSelectedBot] = useState<BotPersona>(BOT_CATALOG[2]); // Gotham default
  const [settings, updateSettings] = useSettings();

  const {
    game,
    history: gameHistory,
    move: executeMove,
    reset: resetChessGame,
    lastMove,
    setLastMove,
    syncState,
  } = useChessGame({
    persistenceKey: "prin_chess_active_game_bots",
    enableSounds: true,
  });

  const [evalScore, setEvalScore] = useState<number>(0);
  const [isMate, setIsMate] = useState(false);
  const [mateIn, setMateIn] = useState<number | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [chatLog, setChatLog] = useState<{ sender: "bot" | "player"; text: string }[]>([]);
  const [lastBotRemark, setLastBotRemark] = useState<string>("");
  const [gameOver, setGameOver] = useState<string | null>(null);
  const [switchedMidGame, setSwitchedMidGame] = useState<string | null>(null);

  // Zen / Focus Mode
  const [isZenMode, setIsZenMode] = useState(false);

  // FEN & PGN Tools
  const [copiedFen, setCopiedFen] = useState(false);
  const [copiedPgn, setCopiedPgn] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importInput, setImportInput] = useState("");
  const [importError, setImportError] = useState<string | null>(null);

  const botTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear pending timers on unmount
  useEffect(() => {
    return () => {
      if (botTimeoutRef.current) {
        clearTimeout(botTimeoutRef.current);
      }
    };
  }, []);

  // Keydown listener for 'z' / 'Z' Zen toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "z" || e.key === "Z") {
        setIsZenMode((z) => !z);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Initial bot greeting
  useEffect(() => {
    const greeting = getRandomLine(selectedBot.dialogs.start);
    setLastBotRemark(greeting);
    setChatLog([{ sender: "bot", text: greeting }]);
  }, [selectedBot]);

  // Update position evaluation off the main thread via Web Worker
  const updateEvaluation = useCallback(
    async (currentGame: Chess, forced = false) => {
      if (settings.evalMode === "disabled" && !forced) return;
      if (settings.evalMode === "every-5" && !forced && currentGame.history().length % 5 !== 0) return;

      const res = await engineClient.getEvaluation(currentGame, 2);
      setIsMate(res.isMate);
      setMateIn(res.mateIn);
      setEvalScore(res.score);
    },
    [settings.evalMode]
  );

  // Read initial FEN from URL query parameters (e.g. from Board Editor)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const initialFen = params.get("fen");
      if (initialFen) {
        try {
          game.load(initialFen);
          syncState();
          updateEvaluation(game, true);
        } catch {}
      }
    }
  }, [game, syncState, updateEvaluation]);

  const formatFullPgn = useCallback(() => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, ".");
    let header = `[Event "Prin Chess Bot Match"]\n`;
    header += `[Site "Prin Chess Platform"]\n`;
    header += `[Date "${dateStr}"]\n`;
    header += `[White "Player"]\n`;
    header += `[Black "${selectedBot.name} (${selectedBot.elo})"]\n`;
    header += `[Result "${game.isGameOver() ? (game.isCheckmate() ? (game.turn() === "w" ? "0-1" : "1-0") : "1/2-1/2") : "*"}"]\n\n`;
    return header + (game.pgn() || gameHistory.map((m, i) => (i % 2 === 0 ? `${Math.floor(i / 2) + 1}. ${m}` : `${m}`)).join(" "));
  }, [game, gameHistory, selectedBot]);

  const handleCopyFen = () => {
    navigator.clipboard.writeText(game.fen());
    setCopiedFen(true);
    setTimeout(() => setCopiedFen(false), 2000);
  };

  const handleCopyPgn = () => {
    const pgnString = formatFullPgn();
    navigator.clipboard.writeText(pgnString);
    setCopiedPgn(true);
    setTimeout(() => setCopiedPgn(false), 2000);
  };

  const handleDownloadPgn = () => {
    const pgnString = formatFullPgn();
    const blob = new Blob([pgnString], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `prin-chess-vs-${selectedBot.id}-${Date.now()}.pgn`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSubmit = () => {
    const trimmed = importInput.trim();
    if (!trimmed) return;
    try {
      if (trimmed.includes("/") || trimmed.split(" ").length >= 4) {
        game.load(trimmed);
      } else {
        game.loadPgn(trimmed);
      }
      syncState();
      updateEvaluation(game, true);
      setIsImportModalOpen(false);
      setImportInput("");
      setImportError(null);
      sound.playMove();
    } catch {
      setImportError("Invalid FEN or PGN string. Please check the notation format.");
    }
  };

  // Switch bot cleanly without resetting the board mid-game
  const handleSelectBot = (newBot: BotPersona) => {
    if (newBot.id === selectedBot.id) return;
    setSelectedBot(newBot);

    const isGameActive = game.history().length > 0 && !gameOver;
    if (isGameActive) {
      const takeoverMsg = `⚡ ${newBot.name} (${newBot.elo} ELO, depth ${newBot.depth}) has stepped in to take over the board! Board position preserved.`;
      setSwitchedMidGame(newBot.name);
      setLastBotRemark(`I'm taking over as Black! Let's see your skills.`);
      setChatLog((prev) => [...prev, { sender: "bot", text: takeoverMsg }]);
      setTimeout(() => setSwitchedMidGame(null), 3500);

      // If it's Black's turn to move, trigger the new bot
      if (game.turn() === "b") {
        if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current);
        botTimeoutRef.current = setTimeout(() => triggerBotMove(game, newBot), 400);
      }
    } else {
      const greeting = getRandomLine(newBot.dialogs.start);
      setLastBotRemark(greeting);
      setChatLog([{ sender: "bot", text: greeting }]);
      resetGame();
    }
  };

  const resetGame = () => {
    if (botTimeoutRef.current) {
      clearTimeout(botTimeoutRef.current);
      botTimeoutRef.current = null;
    }
    resetChessGame();
    setIsThinking(false);
    setGameOver(null);
    setLastMove(null);
    setSwitchedMidGame(null);
    setEvalScore(0);
    setIsMate(false);
    setMateIn(null);
    const greeting = getRandomLine(selectedBot.dialogs.start);
    setLastBotRemark(greeting);
  };

  // Bot makes a move using calibrated ELO & search depth engine
  const triggerBotMove = async (currentGame: Chess, botOverride?: BotPersona) => {
    if (currentGame.isGameOver()) return;
    setIsThinking(true);

    const activeBot = botOverride || selectedBot;

    // Clear any previous bot timer
    if (botTimeoutRef.current) {
      clearTimeout(botTimeoutRef.current);
    }

    // Dynamic delay for humanized bot feel (400ms - 800ms)
    await new Promise((r) => {
      botTimeoutRef.current = setTimeout(r, 550);
    });

    if (currentGame.isGameOver()) {
      setIsThinking(false);
      return;
    }

    // Get move computed off the main thread via Web Worker
    const chosenMove = await engineClient.getBotMove(
      currentGame,
      activeBot.elo,
      activeBot.blunderRate,
      activeBot.depth
    );

    if (!chosenMove) {
      setIsThinking(false);
      return;
    }

    try {
      const executed = executeMove({
        from: chosenMove.from as Square,
        to: chosenMove.to as Square,
        promotion: chosenMove.promotion,
      });

      if (executed) {
        updateEvaluation(currentGame);

        if (currentGame.isCheckmate()) {
          setGameOver(`Checkmate! ${activeBot.name} won the match!`);
          sound.playDefeat();
          const speech = getRandomLine(activeBot.dialogs.win);
          setLastBotRemark(speech);
          setChatLog((prev) => [...prev, { sender: "bot", text: speech }]);
        } else if (currentGame.isThreefoldRepetition()) {
          setGameOver("Draw by threefold repetition!");
        } else if (currentGame.isDraw()) {
          setGameOver("Draw reached against " + activeBot.name);
        } else {
          // Trigger bot dialogue
          triggerBotReaction(executed, currentGame, activeBot);
        }
      }
    } catch {
      // Ignore move error
    }

    setIsThinking(false);
  };

  // Bot Reaction (Gemini API with Fallback)
  const triggerBotReaction = async (move: Move, currentGame: Chess, activeBot: BotPersona = selectedBot) => {
    let event = "normal move";
    let fallbackText = getRandomLine(activeBot.dialogs.goodMove);

    if (currentGame.isCheckmate()) {
      event = "bot won by checkmate";
      fallbackText = getRandomLine(activeBot.dialogs.win);
    } else if (currentGame.inCheck()) {
      event = "bot gave check";
      fallbackText = getRandomLine(activeBot.dialogs.check);
    } else if (move.captured) {
      event = "bot captured a piece";
      fallbackText = getRandomLine(activeBot.dialogs.goodMove);
    }

    // Attempt Gemini Flash API call
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botName: activeBot.name,
          event,
          lastMove: move.san,
          pgn: currentGame.history().slice(-6).join(" "),
        }),
      });

      const data = await res.json();
      const speech = data.fallback ? fallbackText : data.text;
      setLastBotRemark(speech);
      setChatLog((prev) => [...prev.slice(-8), { sender: "bot", text: speech }]);
    } catch {
      setLastBotRemark(fallbackText);
      setChatLog((prev) => [...prev.slice(-8), { sender: "bot", text: fallbackText }]);
    }
  };

  // Player makes move (executed by Chessboard)
  const handlePlayerMove = (m: { from: Square; to: Square; promotion?: string }) => {
    setLastMove({ from: m.from, to: m.to });
    syncState();
    updateEvaluation(game);

    if (game.isCheckmate()) {
      setGameOver(`Checkmate! You defeated ${selectedBot.name}! 🏆`);
      sound.playVictory();
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      const speech = getRandomLine(selectedBot.dialogs.lose);
      setLastBotRemark(speech);
      setChatLog((prev) => [...prev, { sender: "bot", text: speech }]);
      return;
    }

    if (game.isThreefoldRepetition()) {
      setGameOver("Draw by threefold repetition!");
      return;
    }

    if (game.isDraw()) {
      setGameOver("Draw reached against " + selectedBot.name);
      return;
    }

    // Bot's turn
    triggerBotMove(game);
  };

  return (
    <div className={`flex flex-col items-center justify-start ${isZenMode ? "max-w-3xl" : "max-w-7xl"} mx-auto w-full transition-all`}>
      {/* Arena Grid */}
      <div className={`w-full ${isZenMode ? "flex flex-col items-center justify-center" : "grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"}`}>
        {/* Left: Chessboard & Active Opponent Header */}
        <div className={`${isZenMode ? "w-full flex flex-col items-center" : "lg:col-span-7 xl:col-span-8 flex flex-col items-center w-full"}`}>
          {/* Active Bot Bar */}
          <div className="flex items-center justify-between w-full max-w-[620px] mb-2 px-1">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl p-1 bg-slate-800 rounded-lg border border-slate-700">{selectedBot.avatar}</span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm sm:text-base font-bold text-white leading-tight">{selectedBot.name}</span>
                  <span className="text-[11px] font-mono px-1.5 py-0.2 bg-slate-800 text-emerald-400 border border-slate-700 rounded">
                    {selectedBot.elo} ELO
                  </span>
                </div>
                <span className="text-xs text-slate-400 block -mt-0.5">{selectedBot.title}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isThinking && (
                <div className="flex items-center gap-1.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2.5 py-1 rounded-full text-xs font-semibold animate-pulse">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                  Calculating...
                </div>
              )}

              {/* Zen / Focus Mode Toggle */}
              <button
                onClick={() => setIsZenMode((z) => !z)}
                className={`p-1.5 rounded-xl border transition-colors ${
                  isZenMode
                    ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                }`}
                title={isZenMode ? "Exit Zen Mode (Z)" : "Zen Focus Mode (Press Z)"}
              >
                {isZenMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Mid-Game Bot Switch Toast Banner */}
          {switchedMidGame && (
            <div className="w-full max-w-[620px] mb-2 bg-gradient-to-r from-purple-900/80 to-blue-900/80 border border-purple-500/60 text-purple-200 px-3.5 py-1.5 rounded-xl text-xs font-bold text-center shadow-lg animate-fade-in flex items-center justify-center gap-2">
              <span>⚡</span>
              <span>
                <strong>{switchedMidGame}</strong> took over the board! Position preserved.
              </span>
            </div>
          )}

          {/* Board Container with Side Evaluation Bar */}
          <div className="relative flex items-center justify-center gap-2 w-full">
            {settings.evalMode !== "disabled" && (
              <EvaluationBar
                evalScore={evalScore}
                isMate={isMate}
                mateIn={mateIn}
                orientation="white"
                heightClass="h-[min(88vw,calc(100vh-210px))] sm:h-[min(80vw,calc(100vh-210px))] lg:h-[min(560px,calc(100vh-200px))] max-h-[560px]"
                mode={settings.evalMode}
                moveCount={game.history().length}
              />
            )}

            <Chessboard
              game={game}
              orientation="white"
              onMove={handlePlayerMove}
              interactive={game.turn() === "w" && !isThinking && !gameOver}
              autoPromoteToQueen={settings.autoQueen}
              theme={settings.theme}
              lastMove={lastMove}
              boardSizeClass="w-[min(88vw,calc(100vh-210px))] h-[min(88vw,calc(100vh-210px))] sm:w-[min(80vw,calc(100vh-210px))] sm:h-[min(80vw,calc(100vh-210px))] lg:w-[min(560px,calc(100vh-200px))] lg:h-[min(560px,calc(100vh-200px))] max-w-[560px] max-h-[560px] aspect-square"
            />
          </div>

          {/* FEN & PGN Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between w-full max-w-[560px] mt-2.5 px-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs gap-2 shadow-inner">
            <div className="flex items-center gap-1.5 truncate max-w-[200px] text-slate-400 font-mono text-[11px]">
              <span className="text-slate-500 font-bold">FEN:</span>
              <span className="truncate">{game.fen()}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopyFen}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white font-semibold text-[11px] border border-slate-700 transition-colors"
                title="Copy position FEN to clipboard"
              >
                {copiedFen ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                <span>{copiedFen ? "Copied" : "FEN"}</span>
              </button>
              <button
                onClick={handleCopyPgn}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white font-semibold text-[11px] border border-slate-700 transition-colors"
                title="Copy game PGN moves"
              >
                {copiedPgn ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                <span>{copiedPgn ? "Copied" : "PGN"}</span>
              </button>
              <button
                onClick={handleDownloadPgn}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white font-semibold text-[11px] border border-slate-700 transition-colors"
                title="Download .PGN game file"
              >
                <Download className="w-3 h-3 text-slate-400" />
                <span className="hidden sm:inline">Save</span>
              </button>
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-semibold text-[11px] border border-blue-500/40 transition-colors"
                title="Load custom FEN or PGN"
              >
                <Upload className="w-3 h-3" />
                <span>Load</span>
              </button>
              <Link
                href={`/editor?fen=${encodeURIComponent(game.fen())}`}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 font-semibold text-[11px] border border-purple-500/40 transition-colors"
                title="Edit this position in Board Editor"
              >
                <Sliders className="w-3 h-3" />
                <span className="hidden sm:inline">Editor</span>
              </Link>
            </div>
          </div>

          {gameOver && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <div className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/50 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-center">
                {gameOver}
              </div>
              <button
                onClick={() => setIsReviewOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Review Game
              </button>
            </div>
          )}
        </div>

        {/* Right: AI Opponents Selector, Live Banter & Chat */}
        <div className={`${isZenMode ? "hidden" : "lg:col-span-5 xl:col-span-4 flex flex-col gap-3 w-full lg:max-h-[min(620px,calc(100vh-150px))] lg:overflow-y-auto pr-1"}`}>
          {/* Choose AI Opponent Card */}
          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-3.5 shadow-xl">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-blue-400" />
                Choose Opponent
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {selectedBot.name}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {BOT_CATALOG.map((b) => {
                const isSelected = b.id === selectedBot.id;
                return (
                  <button
                    key={b.id}
                    onClick={() => handleSelectBot(b)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                      isSelected
                        ? "bg-blue-600 border-blue-500 text-white shadow-md scale-102"
                        : "bg-slate-900/90 border-slate-750 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <span className="text-xl mb-1">{b.avatar}</span>
                    <span className="text-[10px] font-bold truncate w-full text-center">{b.name.split(" ")[0]}</span>
                    <span className={`text-[9px] font-mono font-semibold ${isSelected ? "text-blue-100" : "text-slate-400"}`}>
                      {b.elo}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Bot Dialogue Bubble */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span className="text-sm">{selectedBot.avatar}</span>
              <span>{selectedBot.name}&apos;s Trash Talk</span>
            </div>
            <p className="text-sm font-medium text-slate-200 italic leading-relaxed min-h-[3rem]">
              &ldquo;{lastBotRemark}&rdquo;
            </p>
          </div>

          {/* Chat / Banter Log */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex-1 flex flex-col shadow-inner">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">Game Chat Log</span>
            <div className="flex-1 overflow-y-auto space-y-2 max-h-[140px] pr-1 scrollbar-thin">
              {chatLog.map((c, idx) => (
                <div
                  key={idx}
                  className={`text-xs p-2.5 rounded-xl leading-relaxed ${
                    c.sender === "bot"
                      ? "bg-slate-800/80 text-slate-200 border border-slate-700/60"
                      : "bg-blue-600/30 text-blue-200 border border-blue-500/40 ml-4"
                  }`}
                >
                  {c.text}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={resetGame}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-xl text-xs sm:text-sm font-bold shadow-lg transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              New Game
            </button>
            <button
              onClick={() => setIsReviewOpen(true)}
              className="flex items-center justify-center gap-1.5 bg-indigo-600/80 hover:bg-indigo-600 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border border-indigo-500 shadow-md transition-all"
              title="Review Game Analysis"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Review
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border border-slate-700 shadow-md transition-all"
              title="Open Board & Engine Settings"
            >
              <Settings className="w-3.5 h-3.5 text-blue-400" />
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={settings.theme}
        onThemeChange={(newTheme) => updateSettings({ theme: newTheme })}
        evalMode={settings.evalMode}
        onEvalModeChange={(newMode) => {
          updateSettings({ evalMode: newMode });
          if (newMode !== "disabled") {
            updateEvaluation(game, true);
          }
        }}
        activeBotName={selectedBot.name}
        activeBotDepth={selectedBot.depth}
        autoPromoteToQueen={settings.autoQueen}
        onAutoPromoteChange={(val) => updateSettings({ autoQueen: val })}
      />

      {/* Full Game Review Modal */}
      <GameReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        history={game.history()}
      />

      {/* Floating Zen Mode Indicator */}
      {isZenMode && (
        <div className="fixed bottom-6 z-40 flex items-center gap-3 bg-slate-900/95 border border-slate-700 px-5 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md animate-fade-in">
          <div className="flex items-center gap-2">
            <Maximize2 className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-mono font-bold text-slate-200">
              Zen Mode Active <span className="text-slate-400 font-normal">(Press Z to toggle)</span>
            </span>
          </div>
          <button
            onClick={() => setIsZenMode(false)}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
          >
            Exit Zen
          </button>
        </div>
      )}

      {/* Load Custom FEN or PGN Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-400" />
                Load FEN or PGN Position
              </h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-4 space-y-3">
              <textarea
                value={importInput}
                onChange={(e) => setImportInput(e.target.value)}
                placeholder="Paste FEN (e.g. rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1) or PGN notation..."
                className="w-full h-32 p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              {importError && <p className="text-xs text-rose-400 font-bold">{importError}</p>}
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportError(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleImportSubmit}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-md"
              >
                Load Position
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
