"use client";

import React, { useState, useEffect, useRef, useCallback, use } from "react";
import { Chess, type Square } from "chess.js";
import { Chessboard, BoardTheme } from "@/components/chess/board";
import { sound } from "@/lib/audio/sound";
import { useSettings } from "@/lib/stores/settings-store";
import {
  Trophy,
  Copy,
  Check,
  Users,
  MessageSquare,
  Flag,
  Handshake,
  ArrowLeft,
  ShieldCheck,
  RotateCcw,
  Clock,
  Eye,
} from "lucide-react";
import confetti from "canvas-confetti";
import Link from "next/link";
import type { PublicRoomState } from "@/lib/server/room-manager";

interface RoomPageProps {
  params: Promise<{ roomId: string }>;
}

function formatClockMs(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function OnlineRoomPage({ params }: RoomPageProps) {
  const { roomId } = use(params);
  const [settings] = useSettings();

  const [room, setRoom] = useState<PublicRoomState | null>(null);
  const [game, setGame] = useState<Chess>(new Chess());
  const [playerRole, setPlayerRole] = useState<"white" | "black" | "spectator">("white");
  const [playerToken, setPlayerToken] = useState<string>("");
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [copied, setCopied] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ sender: string; text: string }[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const [isSubmittingMove, setIsSubmittingMove] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Clocks
  const [whiteDisplayMs, setWhiteDisplayMs] = useState(300000);
  const [blackDisplayMs, setBlackDisplayMs] = useState(300000);

  // Board orientation
  const [boardOrientation, setBoardOrientation] = useState<"white" | "black">("white");

  // Apply state from server
  const applyRoomState = useCallback((updatedRoom: PublicRoomState) => {
    setRoom(updatedRoom);
    setChatMessages(updatedRoom.chat);
    setWhiteDisplayMs(updatedRoom.whiteTimeLeftMs);
    setBlackDisplayMs(updatedRoom.blackTimeLeftMs);

    try {
      const newGame = new Chess(updatedRoom.fen);
      setGame(newGame);
    } catch {
      // ignore fen parse fallback
    }

    if (updatedRoom.lastMove) {
      setLastMove({ from: updatedRoom.lastMove.from, to: updatedRoom.lastMove.to });
    }
  }, []);

  // Initial Join & Setup
  useEffect(() => {
    let active = true;
    const existingToken =
      typeof window !== "undefined" ? sessionStorage.getItem(`room_token_${roomId}`) || "" : "";

    async function joinRoom() {
      try {
        const res = await fetch(`/api/room/${roomId}/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: existingToken || undefined }),
        });

        if (!res.ok) {
          // If room doesn't exist, try getting info
          const getRes = await fetch(`/api/room/${roomId}`);
          if (!getRes.ok) throw new Error("Match room not found or expired.");
          const getData = await getRes.json();
          if (active && getData.room) {
            applyRoomState(getData.room);
            setPlayerRole("spectator");
          }
          return;
        }

        const data = await res.json();
        if (active && data.room) {
          if (data.playerToken) {
            setPlayerToken(data.playerToken);
            sessionStorage.setItem(`room_token_${roomId}`, data.playerToken);
          }
          setPlayerRole(data.role);
          setBoardOrientation(data.role === "black" ? "black" : "white");
          applyRoomState(data.room);
        }
      } catch (err: any) {
        if (active) setStatusError(err?.message || "Failed to join room");
      }
    }

    joinRoom();

    return () => {
      active = false;
    };
  }, [roomId, applyRoomState]);

  // Realtime updates via Server-Sent Events (SSE) with polling fallback
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let fallbackPoll: NodeJS.Timeout | null = null;

    try {
      eventSource = new EventSource(`/api/room/${roomId}/events`);

      eventSource.addEventListener("state", (e) => {
        try {
          const updatedState = JSON.parse(e.data) as PublicRoomState;
          applyRoomState(updatedState);
        } catch {
          // JSON parse ignore
        }
      });

      eventSource.onerror = () => {
        // SSE disconnected or errored, switch to polling fallback
        eventSource?.close();
        if (!fallbackPoll) {
          fallbackPoll = setInterval(async () => {
            try {
              const res = await fetch(`/api/room/${roomId}`);
              if (res.ok) {
                const data = await res.json();
                if (data.room) applyRoomState(data.room);
              }
            } catch {
              // ignore
            }
          }, 2000);
        }
      };
    } catch {
      // EventSource not supported
      fallbackPoll = setInterval(async () => {
        try {
          const res = await fetch(`/api/room/${roomId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.room) applyRoomState(data.room);
          }
        } catch {
          // ignore
        }
      }, 2000);
    }

    return () => {
      eventSource?.close();
      if (fallbackPoll) clearInterval(fallbackPoll);
    };
  }, [roomId, applyRoomState]);

  // Client Clock Interpolation
  useEffect(() => {
    if (!room || room.status !== "active" || !room.lastMoveTimestamp) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - room.lastMoveTimestamp!;

      if (room.turn === "w") {
        setWhiteDisplayMs(Math.max(0, room.whiteTimeLeftMs - elapsed));
      } else {
        setBlackDisplayMs(Math.max(0, room.blackTimeLeftMs - elapsed));
      }
    }, 200);

    return () => clearInterval(interval);
  }, [room]);

  // Handle Player Move
  const submitMove = async (m: { from: Square; to: Square; promotion?: string }) => {
    if (!room || room.status === "completed" || room.status === "aborted") return;
    if (playerRole === "spectator") return;

    const isMyTurn = (playerRole === "white" && room.turn === "w") || (playerRole === "black" && room.turn === "b");
    if (!isMyTurn) return;

    setIsSubmittingMove(true);
    setStatusError(null);

    try {
      const res = await fetch(`/api/room/${roomId}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: playerToken,
          from: m.from,
          to: m.to,
          promotion: m.promotion || (settings.autoQueen ? "q" : undefined),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatusError(data.error || "Illegal move rejected by server");
        sound.playDefeat();
        return;
      }

      if (data.room) {
        applyRoomState(data.room);
        sound.playMove();

        if (data.room.status === "completed") {
          if (
            (data.room.winner === "white" && playerRole === "white") ||
            (data.room.winner === "black" && playerRole === "black")
          ) {
            sound.playVictory();
            confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
          } else if (data.room.winner === "draw") {
            sound.playMove();
          } else {
            sound.playDefeat();
          }
        }
      }
    } catch (err: any) {
      setStatusError(err?.message || "Failed to send move to server");
    } finally {
      setIsSubmittingMove(false);
    }
  };

  const handleMove = (m: { from: Square; to: Square; promotion?: string }) => {
    void submitMove(m);
  };

  const handleAction = async (action: "resign" | "offer_draw" | "accept_draw") => {
    if (!playerToken) return;

    if (action === "resign" && !window.confirm("Are you sure you want to resign this game?")) {
      return;
    }

    try {
      const res = await fetch(`/api/room/${roomId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: playerToken, action }),
      });
      const data = await res.json();
      if (data.room) applyRoomState(data.room);
    } catch {
      // action error
    }
  };

  const copyInviteLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const text = inputMsg;
    setInputMsg("");

    try {
      await fetch(`/api/room/${roomId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: playerToken || undefined,
          sender: playerRole === "white" ? "White" : playerRole === "black" ? "Black" : "Spectator",
          text,
        }),
      });
    } catch {
      // chat error
    }
  };

  const isInteractive =
    Boolean(room) &&
    room?.status !== "completed" &&
    room?.status !== "aborted" &&
    playerRole !== "spectator" &&
    ((playerRole === "white" && room?.turn === "w") || (playerRole === "black" && room?.turn === "b")) &&
    !isSubmittingMove;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-950/85 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/online"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            Lobby
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-xs text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2.5 py-1 rounded-md">
              Room: {roomId}
            </span>
            <span className="text-[11px] font-bold text-slate-400 bg-slate-900 border border-slate-800 px-2 py-1 rounded-md">
              {room?.timeControl || "5+0"}
            </span>
          </div>
        </div>

        {/* Status & Share Link */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Authoritative</span>
          </div>

          <button
            onClick={copyInviteLink}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-md transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Link Copied!" : "Share Link"}
          </button>
        </div>
      </header>

      {/* Main Game Arena */}
      <main className="flex-1 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8 p-4 sm:p-6 max-w-7xl mx-auto w-full">
        {/* Left: Chessboard & Clocks */}
        <div className="flex flex-col items-center">
          {/* Top Clock (Opponent or Black) */}
          <div className="flex items-center justify-between w-full max-w-[600px] mb-2 px-2">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  boardOrientation === "white" ? "bg-indigo-400" : "bg-emerald-400"
                }`}
              />
              <span className="text-xs font-bold text-slate-300">
                {boardOrientation === "white"
                  ? room?.black?.name || "Waiting for opponent..."
                  : room?.white?.name || "Waiting for opponent..."}
              </span>
            </div>
            <div
              className={`font-mono text-sm sm:text-base font-black px-3 py-1 rounded-lg border flex items-center gap-1.5 ${
                (boardOrientation === "white" ? room?.turn === "b" : room?.turn === "w") &&
                room?.status === "active"
                  ? "bg-amber-500/20 border-amber-500 text-amber-300 ring-2 ring-amber-500/30 animate-pulse"
                  : "bg-slate-900 border-slate-800 text-slate-400"
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              {formatClockMs(boardOrientation === "white" ? blackDisplayMs : whiteDisplayMs)}
            </div>
          </div>

          <Chessboard
            game={game}
            orientation={boardOrientation}
            onMove={handleMove}
            interactive={isInteractive}
            theme={settings.theme}
            lastMove={lastMove}
          />

          {/* Bottom Clock (You or White) */}
          <div className="flex items-center justify-between w-full max-w-[600px] mt-2 px-2">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  boardOrientation === "white" ? "bg-emerald-400" : "bg-indigo-400"
                }`}
              />
              <span className="text-xs font-bold text-slate-300">
                {boardOrientation === "white"
                  ? `${room?.white?.name || "You"} ${playerRole === "white" ? "(You)" : ""}`
                  : `${room?.black?.name || "You"} ${playerRole === "black" ? "(You)" : ""}`}
              </span>
            </div>
            <div
              className={`font-mono text-sm sm:text-base font-black px-3 py-1 rounded-lg border flex items-center gap-1.5 ${
                (boardOrientation === "white" ? room?.turn === "w" : room?.turn === "b") &&
                room?.status === "active"
                  ? "bg-amber-500/20 border-amber-500 text-amber-300 ring-2 ring-amber-500/30 animate-pulse"
                  : "bg-slate-900 border-slate-800 text-slate-400"
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              {formatClockMs(boardOrientation === "white" ? whiteDisplayMs : blackDisplayMs)}
            </div>
          </div>

          {/* Error notice */}
          {statusError && (
            <div className="mt-3 bg-red-500/20 text-red-300 border border-red-500/50 px-4 py-1.5 rounded-xl text-xs font-bold">
              {statusError}
            </div>
          )}

          {/* Game Over Banner */}
          {room?.status === "completed" && (
            <div className="mt-4 bg-amber-500/20 border border-amber-500/50 p-4 rounded-2xl text-center max-w-[500px] w-full">
              <div className="flex items-center justify-center gap-2 text-amber-300 font-black text-base mb-1">
                <Trophy className="w-5 h-5" />
                Game Over: {room.result}
              </div>
              <p className="text-xs text-slate-300 mb-3">
                {room.termination === "checkmate"
                  ? `${room.winner === "white" ? "White" : "Black"} wins by checkmate!`
                  : room.termination === "timeout"
                  ? `${room.winner === "white" ? "White" : "Black"} wins on time!`
                  : room.termination === "resignation"
                  ? `${room.winner === "white" ? "White" : "Black"} wins by resignation!`
                  : "Match ended in a draw."}
              </p>
              <Link
                href="/online"
                className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all"
              >
                Return to Lobby & Play Again
              </Link>
            </div>
          )}
        </div>

        {/* Right Sidebar: Chat, Controls & Perspective */}
        <div className="flex flex-col gap-4 w-full max-w-sm">
          {/* Action Buttons (Resign / Draw) */}
          {playerRole !== "spectator" && room?.status === "active" && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex gap-2">
              <button
                onClick={() => handleAction("resign")}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold transition-all"
              >
                <Flag className="w-3.5 h-3.5" />
                Resign
              </button>

              {room.drawOfferFrom && room.drawOfferFrom !== (playerRole === "white" ? "w" : "b") ? (
                <button
                  onClick={() => handleAction("accept_draw")}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold animate-pulse transition-all"
                >
                  <Handshake className="w-3.5 h-3.5" />
                  Accept Draw
                </button>
              ) : (
                <button
                  onClick={() => handleAction("offer_draw")}
                  disabled={Boolean(room.drawOfferFrom)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  <Handshake className="w-3.5 h-3.5" />
                  {room.drawOfferFrom ? "Draw Offered" : "Offer Draw"}
                </button>
              )}
            </div>
          )}

          {/* Perspective & Role Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-400" />
              <span className="font-bold text-slate-300 capitalize">
                Role: <span className="text-white">{playerRole}</span>
              </span>
            </div>
            <button
              onClick={() => setBoardOrientation((prev) => (prev === "white" ? "black" : "white"))}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 hover:text-white font-bold"
            >
              <RotateCcw className="w-3 h-3" />
              Flip Board
            </button>
          </div>

          {/* Chat Window */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col h-[380px] shadow-xl">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 pb-2 border-b border-slate-800">
              <span className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Live Chat
              </span>
              <span className="text-[10px] text-slate-500">
                {room?.spectatorCount ? `${room.spectatorCount} Spectators` : ""}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`p-2 rounded-lg text-xs ${
                    msg.sender === "System"
                      ? "bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[11px]"
                      : "bg-slate-800/80 text-slate-200"
                  }`}
                >
                  <span className="font-bold text-[10px] text-blue-400 block mb-0.5">
                    {msg.sender}
                  </span>
                  {msg.text}
                </div>
              ))}
            </div>

            <form onSubmit={handleSendChat} className="mt-3 flex gap-2">
              <input
                type="text"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                placeholder="Send a chat message..."
                maxLength={200}
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
        </div>
      </main>
    </div>
  );
}
