"use client";

import React, { useState, useEffect } from "react";
import { Chess, Square, Move } from "chess.js";
import { Chessboard, BoardTheme } from "./board";
import { sound } from "@/lib/audio/sound";
import { ChessEvaluator } from "@/lib/engine/evaluator";
import { Bot, MessageSquare, RefreshCw, Trophy, Flag, Zap, Sparkles, Settings } from "lucide-react";
import confetti from "canvas-confetti";
import { EvaluationBar, EvalBarMode } from "./evaluation-bar";
import { SettingsModal } from "./settings-modal";

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
      start: ["Meow! Is this checkers?", "I like the little horsies!", "Wait, which one is my king?"],
      goodMove: ["Woah, that piece was shiny!", "Did you do that on purpose?", "Meow?!"],
      blunder: ["Oopsie! Did I need that bishop?", "Free snack for you! Meow.", "I meant to do that... maybe."],
      check: ["Hey! Stop chasing my king!", "Meow! Rude!", "Can we cuddle instead of checking?"],
      win: ["Wait, did I win?! Yay meow!", "I am the grandmaster kitten!", "Purrrr... victory nap time."],
      lose: ["Good game hooman! Time for tuna.", "You were too fast for my little paws.", "Rematch after my nap!"],
    },
  },
  {
    id: "hustler",
    name: "Park Hustler",
    elo: 1300,
    avatar: "🧢",
    title: "Speed Gambiteer",
    description: "Trash-talking speed demon from Washington Square Park.",
    depth: 2,
    blunderRate: 0.25,
    dialogs: {
      start: ["Five bucks on the clock, let's roll!", "Hope you brought your wallet, friend.", "Clock is ticking!"],
      goodMove: ["Okay, okay, not bad for an amateur.", "Lucky shot, kid.", "I see what you're trying."],
      blunder: ["Thanks for the donation!", "You just gave me the whole game, friend!", "Boom! Hand it over."],
      check: ["Check! Nowhere to run!", "Check! Feel the street heat!", "Watch that king, buddy!"],
      win: ["Pay up! Better luck next time.", "Too slow for the park! Next!", "That's how we do it downtown."],
      lose: ["You got me this time! Run it back!", "Double or nothing right now!", "Respect. Good hustle."],
    },
  },
  {
    id: "gotham",
    name: "Gotham Levy",
    elo: 1850,
    avatar: "🎙️",
    title: "International Master",
    description: "Loves sacrifices, screams in all caps, and hates the London System.",
    depth: 3,
    blunderRate: 0.1,
    dialogs: {
      start: ["Welcome back to Guess the ELO!", "Please don't play the London System.", "AND WE ARE OFF!"],
      goodMove: ["Brilliant move?! Is he Stockfish?!", "Oh that is spicy!", "You found the engine line!"],
      blunder: ["HE SACRIFICES... THE ROOOOOK!!", "WHAT WERE YOU THINKING?!", "A catastrophic blunder!"],
      check: ["CHECK! The king has no squares!", "Danger levels are off the charts!", "Checkmate is around the corner!"],
      win: ["Subscribe to the YouTube channel for more wins!", "And that is how it is done!", "Game over! Classic finish."],
      lose: ["Okay you played like a Grandmaster.", "I'm making a recap video about this.", "GG! Well played."],
    },
  },
  {
    id: "hikaru",
    name: "Hikaru Speed",
    elo: 2450,
    avatar: "⚡",
    title: "Super GM & Streamer",
    description: "Literally takes takes takes. Premoves everything.",
    depth: 6,
    blunderRate: 0.03,
    dialogs: {
      start: ["Alright chat, let's win this quickly.", "Literally takes takes takes.", "I literally don't care."],
      goodMove: ["Wait, that's actually a decent move.", "Okay, you know some theory.", "Nice find, chat approves."],
      blunder: ["Yeah that's just completely losing.", "Literally takes, takes, and you resign.", "Chat, look at this blunder."],
      check: ["Check. King has to run.", "Check! You're in serious trouble.", "Takes, check, wins."],
      win: ["GG! Let's analyze this in 2 seconds.", "Literally crushed. Next game!", "Thanks for the game!"],
      lose: ["Wait, did I actually lose?! What?!", "You played insanely well. GG.", "Huge respect, that was clean."],
    },
  },
  {
    id: "magnus",
    name: "Magnus Endgamer",
    elo: 2850,
    avatar: "👑",
    title: "World Champion",
    description: "Positionally flawless. Grinds you down to dust.",
    depth: 7,
    blunderRate: 0.0,
    dialogs: {
      start: ["Let's see what you've got.", "A casual game before dinner.", "White to play and survive."],
      goodMove: ["Impressive move. Very accurate.", "You have good positional sense.", "Now the real game begins."],
      blunder: ["That is a decisive mistake.", "Your position is crumbling.", "The endgame is already won for me."],
      check: ["Check. No counterplay remaining.", "Every escape is covered.", "Precision."],
      win: ["Good effort, but positional mastery wins.", "The knight endgame is settled.", "Checkmate."],
      lose: ["Incredible game. You outplayed me completely.", "Remarkable calculation. Well done.", "A true masterpiece."],
    },
  },
];

export const AiBotsPlay: React.FC = () => {
  const [selectedBot, setSelectedBot] = useState<BotPersona>(BOT_CATALOG[2]); // Gotham default
  const [game, setGame] = useState<Chess>(new Chess());
  const [theme, setTheme] = useState<BoardTheme>("classic");
  const [evalMode, setEvalMode] = useState<EvalBarMode>("live");
  const [evalScore, setEvalScore] = useState<number>(0);
  const [isMate, setIsMate] = useState(false);
  const [mateIn, setMateIn] = useState<number | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [chatLog, setChatLog] = useState<{ sender: "bot" | "player"; text: string }[]>([]);
  const [lastBotRemark, setLastBotRemark] = useState<string>("");
  const [gameOver, setGameOver] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [switchedMidGame, setSwitchedMidGame] = useState<string | null>(null);

  // Restore stored preferences
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("prin_chess_theme") as BoardTheme | null;
      if (savedTheme && ["classic", "wood", "glass", "neon"].includes(savedTheme)) {
        setTheme(savedTheme);
      }
      const savedEval = localStorage.getItem("prin_chess_eval_mode") as EvalBarMode | null;
      if (savedEval && ["live", "every-5", "disabled"].includes(savedEval)) {
        setEvalMode(savedEval);
      }
    } catch {
      // LocalStorage not available in private mode
    }
  }, []);

  // Initial bot greeting
  useEffect(() => {
    const greeting = getRandomLine(selectedBot.dialogs.start);
    setLastBotRemark(greeting);
    setChatLog([{ sender: "bot", text: greeting }]);
  }, []);

  const getRandomLine = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  // Update position evaluation
  const updateEvaluation = (currentGame: Chess, forced = false) => {
    if (evalMode === "disabled" && !forced) return;

    const moveCount = currentGame.history().length;
    if (!forced && evalMode === "every-5" && moveCount % 5 !== 0) {
      return;
    }

    if (currentGame.isCheckmate()) {
      setIsMate(true);
      const isBlackMated = currentGame.turn() === "b";
      setMateIn(isBlackMated ? 1 : -1);
      setEvalScore(isBlackMated ? 10000 : -10000);
      return;
    }

    if (currentGame.isDraw()) {
      setIsMate(false);
      setMateIn(null);
      setEvalScore(0);
      return;
    }

    setIsMate(false);
    setMateIn(null);
    const { score } = ChessEvaluator.getBestMoveAndEval(currentGame, 2);
    setEvalScore(score);
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
        setTimeout(() => triggerBotMove(game, newBot), 400);
      }
    } else {
      const greeting = getRandomLine(newBot.dialogs.start);
      setLastBotRemark(greeting);
      setChatLog([{ sender: "bot", text: greeting }]);
      resetGame();
    }
  };

  const resetGame = () => {
    setGame(new Chess());
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

    // Dynamic delay for humanized bot feel (400ms - 800ms)
    await new Promise((r) => setTimeout(r, 550));

    // Get move computed by ChessEvaluator calibrated for this bot's ELO and search depth
    const chosenMove = ChessEvaluator.getBotMoveForElo(
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
      const executed = currentGame.move(chosenMove);
      if (executed) {
        if (executed.captured) sound.playCapture();
        else sound.playMove();

        if (currentGame.inCheck()) {
          setTimeout(() => sound.playCheck(), 100);
        }

        setLastMove({ from: executed.from as Square, to: executed.to as Square });
        const updatedGame = new Chess(currentGame.fen());
        setGame(updatedGame);
        updateEvaluation(updatedGame);

        // Trigger bot dialogue
        triggerBotReaction(executed, currentGame, activeBot);
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
      setGameOver(`${activeBot.name} won by Checkmate!`);
      sound.playDefeat();
    } else if (currentGame.inCheck()) {
      event = "bot checked opponent king";
      fallbackText = getRandomLine(activeBot.dialogs.check);
    } else if (move.captured) {
      event = `bot captured player's ${move.captured}`;
      fallbackText = getRandomLine(activeBot.dialogs.blunder);
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

  // Player makes move
  const handlePlayerMove = (m: { from: Square; to: Square; promotion?: string }) => {
    setLastMove({ from: m.from, to: m.to });
    const current = new Chess(game.fen());
    updateEvaluation(current);

    if (game.isCheckmate()) {
      setGameOver(`Checkmate! You defeated ${selectedBot.name}! 🏆`);
      sound.playVictory();
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      const speech = getRandomLine(selectedBot.dialogs.lose);
      setLastBotRemark(speech);
      setChatLog((prev) => [...prev, { sender: "bot", text: speech }]);
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
    <div className="flex flex-col items-center justify-center p-4 max-w-7xl mx-auto w-full">
      {/* Bot Catalog Carousel */}
      <div className="w-full bg-slate-800/80 border border-slate-700 rounded-2xl p-4 mb-6 shadow-xl backdrop-blur-md">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
          Choose Your AI Opponent
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {BOT_CATALOG.map((bot) => (
            <button
              key={bot.id}
              onClick={() => handleSelectBot(bot)}
              className={`flex flex-col items-center text-center p-3 rounded-xl border transition-all ${
                selectedBot.id === bot.id
                  ? "bg-blue-600/25 border-blue-500 shadow-lg scale-102 ring-2 ring-blue-500/50"
                  : "bg-slate-900/60 border-slate-700/80 hover:bg-slate-700/40"
              }`}
            >
              <span className="text-3xl mb-1">{bot.avatar}</span>
              <span className="text-sm font-bold text-white truncate w-full">{bot.name}</span>
              <span className="text-xs font-mono font-semibold text-emerald-400">{bot.elo} ELO</span>
              <span className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{bot.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Arena Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
        {/* Left: Chessboard */}
        <div className="lg:col-span-8 flex flex-col items-center">
          {/* Active Bot Bar */}
          <div className="flex items-center justify-between w-full max-w-[640px] mb-3 px-2">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{selectedBot.avatar}</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-white">{selectedBot.name}</span>
                  <span className="text-xs font-mono px-2 py-0.5 bg-slate-800 text-emerald-400 border border-slate-700 rounded-md">
                    {selectedBot.elo} ELO
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  {selectedBot.title} • Depth {selectedBot.depth}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isThinking && (
                <div className="flex items-center gap-1.5 text-xs text-blue-400 font-medium animate-pulse">
                  <Bot className="w-4 h-4" />
                  Calculating (d{selectedBot.depth})...
                </div>
              )}
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                title="Match & Board Settings"
              >
                <Settings className="w-3.5 h-3.5 text-blue-400" />
                Settings
              </button>
              <button
                onClick={resetGame}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                title="Start a fresh match"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                New Game
              </button>
            </div>
          </div>

          {switchedMidGame && (
            <div className="w-full max-w-[640px] mb-3 p-2.5 bg-blue-500/20 border border-blue-500/40 rounded-xl text-xs font-bold text-blue-300 text-center animate-fade-in flex items-center justify-center gap-2">
              <Zap className="w-4 h-4 text-blue-400" />
              Opponent switched to {switchedMidGame} (Board preserved!)
            </div>
          )}

          {/* Chessboard with Evaluation Bar */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 w-full">
            {evalMode !== "disabled" && (
              <EvaluationBar
                evalScore={evalScore}
                isMate={isMate}
                mateIn={mateIn}
                orientation="white"
                heightClass="h-[320px] sm:h-[460px] md:h-[540px] lg:h-[600px]"
                mode={evalMode}
                moveCount={game.history().length}
              />
            )}

            <Chessboard
              game={game}
              orientation="white"
              onMove={handlePlayerMove}
              interactive={game.turn() === "w" && !isThinking && !gameOver}
              theme={theme}
              lastMove={lastMove}
            />
          </div>

          {gameOver && (
            <div className="mt-4 bg-yellow-500/20 text-yellow-300 border border-yellow-500/50 px-6 py-2.5 rounded-xl text-sm font-bold animate-bounce text-center">
              {gameOver}
            </div>
          )}
        </div>

        {/* Right: Bot Trash-Talk Chat & Controls */}
        <div className="lg:col-span-4 flex flex-col gap-4 w-full">
          {/* Bot Live Reaction Bubble */}
          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Live Bot Banter (Powered by Gemini)
            </div>

            <div className="p-3.5 bg-slate-900/90 border border-slate-700/80 rounded-xl relative">
              <div className="text-sm font-medium text-slate-100 italic">
                "{lastBotRemark || "Make your move!"}"
              </div>
            </div>
          </div>

          {/* Chat History Box */}
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 flex flex-col h-[280px]">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              <MessageSquare className="w-4 h-4" />
              Game Chat
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
              {chatLog.map((c, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded-xl max-w-[88%] ${
                    c.sender === "bot"
                      ? "bg-slate-700/80 text-slate-200 self-start"
                      : "bg-blue-600 text-white self-end ml-auto"
                  }`}
                >
                  <span className="font-bold block text-[10px] text-slate-400 mb-0.5">
                    {c.sender === "bot" ? selectedBot.name : "You"}
                  </span>
                  {c.text}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={resetGame}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-lg transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              New Game
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold border border-slate-700 shadow-md transition-all"
              title="Open Board & Engine Settings"
            >
              <Settings className="w-4 h-4 text-blue-400" />
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        onThemeChange={(newTheme) => {
          setTheme(newTheme);
          try {
            localStorage.setItem("prin_chess_theme", newTheme);
          } catch {}
        }}
        evalMode={evalMode}
        onEvalModeChange={(newMode) => {
          setEvalMode(newMode);
          try {
            localStorage.setItem("prin_chess_eval_mode", newMode);
          } catch {}
          if (newMode !== "disabled") {
            updateEvaluation(game, true);
          }
        }}
        activeBotName={selectedBot.name}
        activeBotDepth={selectedBot.depth}
      />
    </div>
  );
};

