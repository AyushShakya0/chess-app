"use client";

import React, { useState, useEffect, use } from "react";
import { Chess, Square } from "chess.js";
import { Chessboard, BoardTheme } from "@/components/chess/board";
import { sound } from "@/lib/audio/sound";
import { Trophy, Copy, Check, Users, MessageSquare, Flag, Handshake, ArrowLeft } from "lucide-react";
import confetti from "canvas-confetti";
import Link from "next/link";

interface RoomPageProps {
  params: Promise<{ roomId: string }>;
}

export default function OnlineRoomPage({ params }: RoomPageProps) {
  const { roomId } = use(params);

  const [game, setGame] = useState<Chess>(new Chess());
  const [playerColor, setPlayerColor] = useState<"white" | "black">("white");
  const [theme, setTheme] = useState<BoardTheme>("classic");
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [copied, setCopied] = useState(false);
  const [gameOver, setGameOver] = useState<string | null>(null);

  // Clocks
  const [whiteTime, setWhiteTime] = useState(300); // 5 min
  const [blackTime, setBlackTime] = useState(300);
  const [isClockRunning, setIsClockRunning] = useState(false);

  // Chat
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([
    { sender: "System", text: `Match room ${roomId} created. Share the link with your opponent!` },
  ]);
  const [inputMsg, setInputMsg] = useState("");

  // Clock countdown
  useEffect(() => {
    if (!isClockRunning || gameOver) return;
    const interval = setInterval(() => {
      if (game.turn() === "w") {
        setWhiteTime((t) => {
          if (t <= 1) {
            handleTimeout("w");
            return 0;
          }
          if (t === 10) sound.playLowTimeTick();
          return t - 1;
        });
      } else {
        setBlackTime((t) => {
          if (t <= 1) {
            handleTimeout("b");
            return 0;
          }
          if (t === 10) sound.playLowTimeTick();
          return t - 1;
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isClockRunning, game.turn(), gameOver]);

  const handleTimeout = (loser: "w" | "b") => {
    const winner = loser === "w" ? "Black" : "White";
    setGameOver(`${winner} wins on time! ⏰`);
    sound.playVictory();
  };

  const handleMove = (m: { from: Square; to: Square; promotion?: string }) => {
    if (!isClockRunning) setIsClockRunning(true);
    setLastMove({ from: m.from, to: m.to });

    if (game.isCheckmate()) {
      const winner = game.turn() === "w" ? "Black" : "White";
      setGameOver(`Checkmate! ${winner} wins! 🏆`);
      sound.playVictory();
      confetti({ particleCount: 130, spread: 75, origin: { y: 0.6 } });
    } else if (game.isDraw()) {
      setGameOver("Match drawn 🤝");
    }
  };

  const copyInviteLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    setMessages((prev) => [...prev, { sender: playerColor === "white" ? "White" : "Black", text: inputMsg }]);
    setInputMsg("");
  };

  const formatClock = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? "0" : ""}${sec}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            Lobby
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-sm text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2.5 py-1 rounded-md">
              Room: {roomId}
            </span>
          </div>
        </div>

        {/* Share Link Button */}
        <button
          onClick={copyInviteLink}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md transition-all"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Link Copied!" : "Copy Invite Link"}
        </button>
      </header>

      {/* Main Grid */}
      <main className="flex-1 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8 p-6 max-w-7xl mx-auto w-full">
        {/* Left: Chessboard & Clocks */}
        <div className="flex flex-col items-center">
          {/* Top Opponent Clock */}
          <div className="flex items-center justify-between w-full max-w-[600px] mb-3 px-2">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
              Opponent (Black)
            </span>
            <div
              className={`font-mono text-base font-black px-3 py-1 rounded-lg border ${
                game.turn() === "b" && isClockRunning
                  ? "bg-indigo-500/20 border-indigo-500 text-indigo-400 ring-2 ring-indigo-500/30"
                  : "bg-slate-900 border-slate-800 text-slate-300"
              }`}
            >
              {formatClock(blackTime)}
            </div>
          </div>

          <Chessboard
            game={game}
            orientation={playerColor}
            onMove={handleMove}
            interactive={!gameOver}
            theme={theme}
            lastMove={lastMove}
          />

          {/* Bottom Player Clock */}
          <div className="flex items-center justify-between w-full max-w-[600px] mt-3 px-2">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              You (White)
            </span>
            <div
              className={`font-mono text-base font-black px-3 py-1 rounded-lg border ${
                game.turn() === "w" && isClockRunning
                  ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 ring-2 ring-emerald-500/30"
                  : "bg-slate-900 border-slate-800 text-slate-300"
              }`}
            >
              {formatClock(whiteTime)}
            </div>
          </div>

          {gameOver && (
            <div className="mt-4 bg-yellow-500/20 text-yellow-300 border border-yellow-500/50 px-6 py-2 rounded-xl text-sm font-bold animate-bounce text-center">
              {gameOver}
            </div>
          )}
        </div>

        {/* Right: Chat & Quick Actions */}
        <div className="flex flex-col gap-4 w-full max-w-sm">
          {/* Chat Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col h-[400px] shadow-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              <MessageSquare className="w-4 h-4" />
              Match Chat
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
              {messages.map((msg, i) => (
                <div key={i} className="p-2 rounded-lg bg-slate-800/80 text-slate-200">
                  <span className="font-bold text-[10px] text-blue-400 block mb-0.5">{msg.sender}</span>
                  {msg.text}
                </div>
              ))}
            </div>

            <form onSubmit={handleSendChat} className="mt-3 flex gap-2">
              <input
                type="text"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-xl text-xs font-bold transition-colors"
              >
                Send
              </button>
            </form>
          </div>

          {/* Player Perspective Switcher */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Board View</span>
            <div className="flex gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setPlayerColor("white")}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  playerColor === "white" ? "bg-emerald-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                }`}
              >
                White
              </button>
              <button
                onClick={() => setPlayerColor("black")}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  playerColor === "black" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                }`}
              >
                Black
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

