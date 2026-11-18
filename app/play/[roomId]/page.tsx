"use client";

import React, { useState, useEffect, useRef, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { Chess, type Square } from "chess.js";
import { Chessboard } from "@/components/chess/board";
import { sound } from "@/lib/audio/sound";
import { useSettings } from "@/lib/stores/settings-store";
import { AppShell } from "@/components/navigation/app-shell";
import { VictoryModal } from "@/components/chess/victory-modal";
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
  Swords,
  Maximize2,
  ChevronRight,
} from "lucide-react";
import confetti from "canvas-confetti";
import Link from "next/link";
import type { PublicRoomState } from "@/lib/server/room-manager";
import { useAuth } from "@/lib/stores/auth-store";

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
  const router = useRouter();
  const { roomId } = use(params);
  const [settings] = useSettings();
  const [auth] = useAuth();

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
  const [isVictoryModalOpen, setIsVictoryModalOpen] = useState(false);

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

    if (updatedRoom.status === "completed") {
      setIsVictoryModalOpen(true);
    }

    try {
      const newGame = new Chess(updatedRoom.fen);
      setGame(newGame);
    } catch {}

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
          applyRoomState(data.room);
          setPlayerRole(data.role);
          setPlayerToken(data.playerToken);
          setBoardOrientation(data.role === "black" ? "black" : "white");
          if (typeof window !== "undefined") {
            sessionStorage.setItem(`room_token_${roomId}`, data.playerToken);
          }
        }
      } catch (err: any) {
        if (active) setStatusError(err?.message || "Failed to join room");
      }
    }

    joinRoom();

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/room/${roomId}`);
        if (res.ok) {
          const data = await res.json();
          if (active && data.room) applyRoomState(data.room);
        }
      } catch {}
    }, 1500);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [roomId, applyRoomState]);

  // Clock tick countdown
  useEffect(() => {
    if (!room || room.status !== "active") return;

    const interval = setInterval(() => {
      if (room.turn === "w") {
        setWhiteDisplayMs((prev) => Math.max(0, prev - 200));
      } else {
        setBlackDisplayMs((prev) => Math.max(0, prev - 200));
      }
    }, 200);

    return () => clearInterval(interval);
  }, [room]);

  const submitMove = async (move: { from: Square; to: Square; promotion?: string }) => {
    if (!playerToken || isSubmittingMove) return;

    try {
      setIsSubmittingMove(true);
      setStatusError(null);

      const res = await fetch(`/api/room/${roomId}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: playerToken,
          from: move.from,
          to: move.to,
          promotion: move.promotion || "q",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Move rejected by server");

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
    } catch {}
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
    } catch {}
  };

  const isInteractive =
    Boolean(room) &&
    room?.status !== "completed" &&
    room?.status !== "aborted" &&
    playerRole !== "spectator" &&
    ((playerRole === "white" && room?.turn === "w") || (playerRole === "black" && room?.turn === "b")) &&
    !isSubmittingMove;

  const opponentName =
    boardOrientation === "white"
      ? room?.black?.name || "Waiting for Opponent..."
      : room?.white?.name || "Waiting for Opponent...";

  const playerName =
    boardOrientation === "white"
      ? room?.white?.name || auth.profile?.username || "AyushShakya"
      : room?.black?.name || auth.profile?.username || "AyushShakya";

  const opponentClockMs = boardOrientation === "white" ? blackDisplayMs : whiteDisplayMs;
  const playerClockMs = boardOrientation === "white" ? whiteDisplayMs : blackDisplayMs;
  const isOpponentTurn = boardOrientation === "white" ? room?.turn === "b" : room?.turn === "w";
  const isPlayerTurnActive = boardOrientation === "white" ? room?.turn === "w" : room?.turn === "b";

  return (
    <AppShell>
      <div className="space-y-4">
        {/* Top Arena Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#14171f] border border-[#252a36] rounded-2xl px-5 py-3 shadow-lg">
          <div className="flex items-center gap-3">
            <Link
              href="/online"
              className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white bg-[#0d0f12] border border-[#252a36] px-3 py-1.5 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Lobby</span>
            </Link>

            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs text-[#d4a359] bg-[#d4a359]/10 border border-[#d4a359]/30 px-2.5 py-1 rounded-lg">
                Room: {roomId}
              </span>
              <span className="text-[11px] font-bold text-slate-400 bg-[#0d0f12] border border-[#252a36] px-2.5 py-1 rounded-lg">
                {room?.timeControl || "10+0"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Server-Authoritative</span>
            </div>

            <button
              onClick={copyInviteLink}
              className="flex items-center gap-1.5 bg-[#d4a359] hover:bg-[#e2b768] text-black px-3.5 py-1.5 rounded-xl text-xs font-black shadow-md shadow-[#d4a359]/20 transition-all hover:scale-105"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Invite Link"}</span>
            </button>
          </div>
        </div>

        {/* Main Chess Arena matching Reference Image */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Center Column: Opponent Bar, Chessboard, Player Bar */}
          <div className="lg:col-span-8 flex flex-col items-center">
            {/* Top Opponent Bar */}
            <div className="w-full max-w-[620px] bg-[#14171f] border border-[#252a36] rounded-2xl px-4 py-2.5 mb-2 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1c202a] to-[#252a36] border border-[#2c3240] flex items-center justify-center font-black text-xs text-slate-200">
                  {opponentName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white truncate max-w-[140px] sm:max-w-[200px]">
                      {opponentName}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isOpponentTurn && room?.status === "active" ? "bg-[#d4a359] animate-ping" : "bg-slate-500"
                      }`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {boardOrientation === "white" ? "Black" : "White"} &bull; Opponent
                  </span>
                </div>
              </div>

              {/* Opponent Clock */}
              <div
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-mono font-black text-sm sm:text-base ${
                  isOpponentTurn && room?.status === "active"
                    ? "bg-[#d4a359] text-black border-[#d4a359] shadow-lg shadow-[#d4a359]/20"
                    : "bg-[#0d0f12] text-slate-300 border-[#252a36]"
                }`}
              >
                <Clock className="w-3.5 h-3.5 opacity-80" />
                <span>{formatClockMs(opponentClockMs)}</span>
              </div>
            </div>

            {/* Centered Chessboard */}
            <div className="relative">
              <Chessboard
                game={game}
                orientation={boardOrientation}
                onMove={handleMove}
                interactive={isInteractive}
                theme={settings.theme}
                pieceSet={settings.pieceSet}
                lastMove={lastMove}
              />
            </div>

            {/* Bottom Player Bar */}
            <div className="w-full max-w-[620px] bg-[#14171f] border border-[#252a36] rounded-2xl px-4 py-2.5 mt-2 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#d4a359] to-[#f0cf85] text-black flex items-center justify-center font-black text-xs shadow-md shadow-[#d4a359]/20">
                  {playerName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white truncate max-w-[140px] sm:max-w-[200px]">
                      {playerName} {playerRole !== "spectator" ? "(You)" : ""}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-[10px] text-[#d4a359] font-semibold">
                    1642 ELO &bull; {boardOrientation === "white" ? "White" : "Black"}
                  </span>
                </div>
              </div>

              {/* Player Clock */}
              <div
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-mono font-black text-sm sm:text-base ${
                  isPlayerTurnActive && room?.status === "active"
                    ? "bg-[#d4a359] text-black border-[#d4a359] shadow-lg shadow-[#d4a359]/20"
                    : "bg-[#0d0f12] text-slate-300 border-[#252a36]"
                }`}
              >
                <Clock className="w-3.5 h-3.5 opacity-80" />
                <span>{formatClockMs(playerClockMs)}</span>
              </div>
            </div>

            {statusError && (
              <div className="mt-3 bg-rose-500/10 text-rose-300 border border-rose-500/30 px-4 py-2 rounded-xl text-xs font-bold">
                {statusError}
              </div>
            )}
          </div>

          {/* Right Game Room Panel matching Reference Image */}
          <div className="lg:col-span-4 bg-[#14171f] border border-[#252a36] rounded-2xl p-5 shadow-xl flex flex-col justify-between min-h-[580px]">
            {/* Header */}
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#252a36] mb-4">
                <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
                  <Swords className="w-4 h-4 text-[#d4a359]" />
                  <span>Game Room</span>
                </h3>

                <button
                  onClick={() => setBoardOrientation((prev) => (prev === "white" ? "black" : "white"))}
                  className="p-1.5 rounded-lg bg-[#0d0f12] hover:bg-[#1c202a] border border-[#252a36] text-slate-400 hover:text-white transition-colors"
                  title="Flip board orientation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Swords Good Luck Banner from Mockup */}
              <div className="text-center py-6 border-b border-[#252a36]/60">
                <div className="w-12 h-12 rounded-2xl bg-[#0d0f12] border border-[#252a36] flex items-center justify-center mx-auto mb-2 text-[#d4a359]">
                  <Swords className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
                  {room?.status === "active" ? "Good luck!" : room?.status === "completed" ? "Game Over" : "Matchmaking"}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {room?.status === "active" ? "May the best mind prevail." : room?.result || "Standby"}
                </p>
              </div>

              {/* Chat / Spectators Stream */}
              <div className="py-3 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                  <span>Match Chat</span>
                  <span className="text-[10px] text-slate-500">
                    {room?.spectatorCount ? `${room.spectatorCount} Spectating` : "Live"}
                  </span>
                </div>

                <div className="h-44 overflow-y-auto space-y-2 pr-1 custom-scrollbar bg-[#0d0f12] p-2.5 rounded-xl border border-[#252a36]">
                  {chatMessages.length === 0 ? (
                    <p className="text-[11px] text-slate-600 text-center py-8">Chat is quiet. Say hello!</p>
                  ) : (
                    chatMessages.map((msg, i) => (
                      <div key={i} className="text-xs p-1.5 rounded-lg bg-[#14171f] border border-[#252a36]/60">
                        <span className="font-bold text-[10px] text-[#d4a359] block">{msg.sender}</span>
                        <span className="text-slate-300 text-[11px]">{msg.text}</span>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleSendChat} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={inputMsg}
                    onChange={(e) => setInputMsg(e.target.value)}
                    placeholder="Message opponent..."
                    maxLength={150}
                    className="flex-1 bg-[#0d0f12] border border-[#252a36] rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#d4a359]"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-[#1c202a] hover:bg-[#252a36] text-white rounded-xl text-xs font-bold border border-[#252a36] transition-colors"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>

            {/* Bottom Action Buttons matching Reference Image (½ Draw & ⚐ Resign) */}
            <div className="pt-4 border-t border-[#252a36] grid grid-cols-2 gap-2.5">
              {room?.drawOfferFrom && room.drawOfferFrom !== (playerRole === "white" ? "w" : "b") ? (
                <button
                  onClick={() => handleAction("accept_draw")}
                  className="py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all animate-pulse"
                >
                  Accept Draw
                </button>
              ) : (
                <button
                  onClick={() => handleAction("offer_draw")}
                  disabled={Boolean(room?.drawOfferFrom) || playerRole === "spectator" || room?.status !== "active"}
                  className="py-2.5 bg-[#0d0f12] hover:bg-[#1c202a] text-slate-300 hover:text-white border border-[#252a36] rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                >
                  ½ Draw
                </button>
              )}

              <button
                onClick={() => handleAction("resign")}
                disabled={playerRole === "spectator" || room?.status !== "active"}
                className="py-2.5 bg-[#0d0f12] hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-[#252a36] hover:border-rose-900/40 rounded-xl text-xs font-bold transition-all disabled:opacity-40 flex items-center justify-center gap-1.5"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Resign</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Victory / Game Over Modal matching Mockup */}
      {(() => {
        const isWin =
          room?.status === "completed" &&
          ((room.winner === "white" && playerRole === "white") ||
            (room.winner === "black" && playerRole === "black"));
        const isLoss =
          room?.status === "completed" &&
          playerRole !== "spectator" &&
          ((room.winner === "white" && playerRole === "black") ||
            (room.winner === "black" && playerRole === "white"));
        const outcome = isWin ? "win" : isLoss ? "loss" : "draw";
        const opponentName =
          playerRole === "white"
            ? room?.black?.name || "Black Opponent"
            : room?.white?.name || "White Opponent";

        return (
          <VictoryModal
            isOpen={isVictoryModalOpen}
            outcome={outcome}
            reason={room?.termination || room?.result || "Checkmate"}
            opponentName={opponentName}
            ratingChange={isWin ? "+14" : isLoss ? "-10" : "+2"}
            onPlayAgain={() => router.push("/online")}
            onBackToLobby={() => router.push("/online")}
            onClose={() => setIsVictoryModalOpen(false)}
          />
        );
      })()}
    </AppShell>
  );
}
