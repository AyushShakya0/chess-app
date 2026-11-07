"use client";

import React, { useState, useEffect } from "react";
import { Chess, Square, Move } from "chess.js";
import { Chessboard, BoardTheme } from "./board";
import { sound } from "@/lib/audio/sound";
import { Bot, MessageSquare, RefreshCw, Trophy, Flag, Zap, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

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
    depth: 4,
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
    depth: 5,
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
  const [isThinking, setIsThinking] = useState(false);
  const [chatLog, setChatLog] = useState<{ sender: "bot" | "player"; text: string }[]>([]);
  const [lastBotRemark, setLastBotRemark] = useState<string>("");
  const [gameOver, setGameOver] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);

  // Greet on bot change
  useEffect(() => {
    const greeting = getRandomLine(selectedBot.dialogs.start);
    setLastBotRemark(greeting);
    setChatLog([{ sender: "bot", text: greeting }]);
    resetGame();
  }, [selectedBot]);

  const getRandomLine = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  const resetGame = () => {
    setGame(new Chess());
    setIsThinking(false);
    setGameOver(null);
    setLastMove(null);
  };

  // Bot makes a move
  const triggerBotMove = async (currentGame: Chess) => {
    if (currentGame.isGameOver()) return;
    setIsThinking(true);

    // Dynamic delay for humanized bot feel (400ms - 900ms)
    await new Promise((r) => setTimeout(r, 600));

    const moves = currentGame.moves({ verbose: true }) as Move[];
    if (moves.length === 0) {
      setIsThinking(false);
      return;
    }

    let chosenMove: Move;

    // Check if bot intentionally blunders according to blunderRate
    const shouldBlunder = Math.random() < selectedBot.blunderRate;

    if (shouldBlunder) {
      // Pick random legal move
      chosenMove = moves[Math.floor(Math.random() * moves.length)];
    } else {
      // Prioritize captures and checks, then random
      const captures = moves.filter((m) => m.captured);
      const checks = moves.filter((m) => {
        const testG = new Chess(currentGame.fen());
        testG.move(m);
        return testG.inCheck();
      });

      if (checks.length > 0 && Math.random() < 0.7) {
        chosenMove = checks[Math.floor(Math.random() * checks.length)];
      } else if (captures.length > 0 && Math.random() < 0.6) {
        chosenMove = captures[Math.floor(Math.random() * captures.length)];
      } else {
        chosenMove = moves[Math.floor(Math.random() * moves.length)];
      }
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
        setGame(new Chess(currentGame.fen()));

        // Trigger bot dialogue
        triggerBotReaction(executed, currentGame);
      }
    } catch {
      // Ignore move error
    }

    setIsThinking(false);
  };

  // Bot Reaction (Gemini API with Fallback)
  const triggerBotReaction = async (move: Move, currentGame: Chess) => {
    let event = "normal move";
    let fallbackText = getRandomLine(selectedBot.dialogs.goodMove);

    if (currentGame.isCheckmate()) {
      event = "bot won by checkmate";
      fallbackText = getRandomLine(selectedBot.dialogs.win);
      setGameOver(`${selectedBot.name} won by Checkmate!`);
      sound.playDefeat();
    } else if (currentGame.inCheck()) {
      event = "bot checked opponent king";
      fallbackText = getRandomLine(selectedBot.dialogs.check);
    } else if (move.captured) {
      event = `bot captured player's ${move.captured}`;
      fallbackText = getRandomLine(selectedBot.dialogs.blunder);
    }

    // Attempt Gemini Flash API call
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botName: selectedBot.name,
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
              onClick={() => setSelectedBot(bot)}
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
          <div className="flex items-center justify-between w-full max-w-[600px] mb-3 px-2">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{selectedBot.avatar}</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-white">{selectedBot.name}</span>
                  <span className="text-xs font-mono px-2 py-0.5 bg-slate-800 text-emerald-400 border border-slate-700 rounded-md">
                    {selectedBot.elo}
                  </span>
                </div>
                <span className="text-xs text-slate-400">{selectedBot.title}</span>
              </div>
            </div>

            {isThinking && (
              <div className="flex items-center gap-1.5 text-xs text-blue-400 font-medium animate-pulse">
                <Bot className="w-4 h-4" />
                Thinking...
              </div>
            )}
          </div>

          <Chessboard
            game={game}
            orientation="white"
            onMove={handlePlayerMove}
            interactive={game.turn() === "w" && !isThinking && !gameOver}
            theme={theme}
            lastMove={lastMove}
          />

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
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as BoardTheme)}
              className="bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-medium focus:outline-none"
            >
              <option value="classic">Classic Green</option>
              <option value="wood">Walnut Wood</option>
              <option value="glass">Obsidian Glass</option>
              <option value="neon">Cyber Neon</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

