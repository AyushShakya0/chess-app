import { Chess, type Square } from "chess.js";
import crypto from "crypto";

export interface RoomPlayer {
  id: string;
  name: string;
  color: "white" | "black" | "spectator";
  token: string;
  connected: boolean;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}

export interface AuthoritativeRoom {
  id: string;
  white: RoomPlayer | null;
  black: RoomPlayer | null;
  spectators: RoomPlayer[];
  fen: string;
  pgn: string;
  history: string[];
  turn: "w" | "b";
  status: "waiting" | "active" | "completed" | "aborted";
  result: "1-0" | "0-1" | "1/2-1/2" | null;
  termination:
    | "checkmate"
    | "resignation"
    | "timeout"
    | "stalemate"
    | "agreement"
    | "abandonment"
    | null;
  winner: "white" | "black" | "draw" | null;

  // Clocks
  timeControl: string; // e.g. "5+0", "3+2", "1+0", "10+0"
  initialTimeMs: number;
  incrementMs: number;
  whiteTimeLeftMs: number;
  blackTimeLeftMs: number;
  lastMoveTimestamp: number | null; // epoch ms when active turn began

  lastMove: { from: Square; to: Square; san: string } | null;
  drawOfferFrom: "w" | "b" | null;
  chat: ChatMessage[];
  createdAt: number;
  expiresAt: number;
}

export interface PublicRoomState {
  id: string;
  white: { id: string; name: string; connected: boolean } | null;
  black: { id: string; name: string; connected: boolean } | null;
  spectatorCount: number;
  fen: string;
  pgn: string;
  history: string[];
  turn: "w" | "b";
  status: "waiting" | "active" | "completed" | "aborted";
  result: "1-0" | "0-1" | "1/2-1/2" | null;
  termination: string | null;
  winner: "white" | "black" | "draw" | null;
  timeControl: string;
  whiteTimeLeftMs: number;
  blackTimeLeftMs: number;
  lastMoveTimestamp: number | null;
  lastMove: { from: Square; to: Square; san: string } | null;
  drawOfferFrom: "w" | "b" | null;
  chat: ChatMessage[];
}

export function toPublicRoomState(room: AuthoritativeRoom): PublicRoomState {
  // Compute real-time clock interpolation
  let currentWhite = room.whiteTimeLeftMs;
  let currentBlack = room.blackTimeLeftMs;

  if (room.status === "active" && room.lastMoveTimestamp) {
    const elapsed = Date.now() - room.lastMoveTimestamp;
    if (room.turn === "w") {
      currentWhite = Math.max(0, currentWhite - elapsed);
    } else {
      currentBlack = Math.max(0, currentBlack - elapsed);
    }
  }

  return {
    id: room.id,
    white: room.white ? { id: room.white.id, name: room.white.name, connected: room.white.connected } : null,
    black: room.black ? { id: room.black.id, name: room.black.name, connected: room.black.connected } : null,
    spectatorCount: room.spectators.length,
    fen: room.fen,
    pgn: room.pgn,
    history: room.history,
    turn: room.turn,
    status: room.status,
    result: room.result,
    termination: room.termination,
    winner: room.winner,
    timeControl: room.timeControl,
    whiteTimeLeftMs: currentWhite,
    blackTimeLeftMs: currentBlack,
    lastMoveTimestamp: room.lastMoveTimestamp,
    lastMove: room.lastMove,
    drawOfferFrom: room.drawOfferFrom,
    chat: room.chat,
  };
}

class RoomManager {
  private rooms = new Map<string, AuthoritativeRoom>();
  private subscribers = new Map<string, Set<(room: PublicRoomState) => void>>();

  constructor() {
    // Periodic garbage collector every 5 minutes
    if (typeof setInterval !== "undefined") {
      const timer = setInterval(() => this.cleanupExpiredRooms(), 5 * 60 * 1000);
      if (typeof (timer as any)?.unref === "function") {
        (timer as any).unref();
      }
    }
  }

  private cleanupExpiredRooms() {
    const now = Date.now();
    for (const [id, room] of this.rooms.entries()) {
      if (now > room.expiresAt) {
        this.rooms.delete(id);
        this.subscribers.delete(id);
      }
    }
  }

  public subscribe(roomId: string, cb: (room: PublicRoomState) => void): () => void {
    if (!this.subscribers.has(roomId)) {
      this.subscribers.set(roomId, new Set());
    }
    const set = this.subscribers.get(roomId)!;
    set.add(cb);
    return () => {
      set.delete(cb);
      if (set.size === 0) {
        this.subscribers.delete(roomId);
      }
    };
  }

  public notify(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const publicState = toPublicRoomState(room);
    const subs = this.subscribers.get(roomId);
    if (subs) {
      for (const cb of subs) {
        try {
          cb(publicState);
        } catch {
          // ignore dead subscriber
        }
      }
    }
  }

  public createRoom(options?: {
    timeControl?: string;
    playerName?: string;
    colorPreference?: "white" | "black" | "random";
  }): { room: AuthoritativeRoom; token: string; color: "white" | "black" } {
    // Generate secure 8-character alphanumeric room code
    const roomId = crypto.randomBytes(4).toString("hex");
    const playerToken = crypto.randomBytes(16).toString("hex");

    const tc = options?.timeControl || "5+0";
    const [baseMinStr, incSecStr] = tc.split("+");
    const baseMinutes = parseInt(baseMinStr, 10) || 5;
    const incSeconds = parseInt(incSecStr, 10) || 0;

    const initialTimeMs = baseMinutes * 60 * 1000;
    const incrementMs = incSeconds * 1000;

    let assignedColor: "white" | "black" = "white";
    if (options?.colorPreference === "black") {
      assignedColor = "black";
    } else if (options?.colorPreference === "random") {
      assignedColor = Math.random() < 0.5 ? "white" : "black";
    }

    const hostPlayer: RoomPlayer = {
      id: crypto.randomUUID(),
      name: options?.playerName?.trim() || (assignedColor === "white" ? "Player 1 (White)" : "Player 1 (Black)"),
      color: assignedColor,
      token: playerToken,
      connected: true,
    };

    const initialFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const now = Date.now();

    const room: AuthoritativeRoom = {
      id: roomId,
      white: assignedColor === "white" ? hostPlayer : null,
      black: assignedColor === "black" ? hostPlayer : null,
      spectators: [],
      fen: initialFen,
      pgn: "",
      history: [],
      turn: "w",
      status: "waiting",
      result: null,
      termination: null,
      winner: null,
      timeControl: tc,
      initialTimeMs,
      incrementMs,
      whiteTimeLeftMs: initialTimeMs,
      blackTimeLeftMs: initialTimeMs,
      lastMoveTimestamp: null,
      lastMove: null,
      drawOfferFrom: null,
      chat: [
        {
          id: crypto.randomUUID(),
          sender: "System",
          text: `Match room ${roomId} created (${tc}). Share the invite link to play!`,
          timestamp: now,
        },
      ],
      createdAt: now,
      expiresAt: now + 2 * 60 * 60 * 1000, // 2 hours TTL
    };

    this.rooms.set(roomId, room);
    return { room, token: playerToken, color: assignedColor };
  }

  public getRoom(roomId: string): AuthoritativeRoom | undefined {
    const room = this.rooms.get(roomId);
    if (!room) return undefined;

    // Check flag fall if match is active
    if (room.status === "active" && room.lastMoveTimestamp) {
      const now = Date.now();
      const elapsed = now - room.lastMoveTimestamp;
      if (room.turn === "w" && room.whiteTimeLeftMs - elapsed <= 0) {
        room.whiteTimeLeftMs = 0;
        room.status = "completed";
        room.result = "0-1";
        room.termination = "timeout";
        room.winner = "black";
        room.chat.push({
          id: crypto.randomUUID(),
          sender: "System",
          text: "⏰ White's time expired! Black wins on time.",
          timestamp: now,
        });
        this.notify(roomId);
      } else if (room.turn === "b" && room.blackTimeLeftMs - elapsed <= 0) {
        room.blackTimeLeftMs = 0;
        room.status = "completed";
        room.result = "1-0";
        room.termination = "timeout";
        room.winner = "white";
        room.chat.push({
          id: crypto.randomUUID(),
          sender: "System",
          text: "⏰ Black's time expired! White wins on time.",
          timestamp: now,
        });
        this.notify(roomId);
      }
    }

    return room;
  }

  public joinRoom(
    roomId: string,
    options?: { playerName?: string; existingToken?: string }
  ): {
    success: boolean;
    token: string;
    role: "white" | "black" | "spectator";
    room: AuthoritativeRoom;
    error?: string;
  } {
    const room = this.getRoom(roomId);
    if (!room) {
      return { success: false, token: "", role: "spectator", room: null as any, error: "Room not found" };
    }

    const token = options?.existingToken || crypto.randomBytes(16).toString("hex");

    // Check if player is returning with existing token
    if (room.white && room.white.token === options?.existingToken) {
      room.white.connected = true;
      this.notify(roomId);
      return { success: true, token: room.white.token, role: "white", room };
    }
    if (room.black && room.black.token === options?.existingToken) {
      room.black.connected = true;
      this.notify(roomId);
      return { success: true, token: room.black.token, role: "black", room };
    }

    // Assign open player seat
    if (!room.white) {
      room.white = {
        id: crypto.randomUUID(),
        name: options?.playerName?.trim() || "Player 1 (White)",
        color: "white",
        token,
        connected: true,
      };
      if (room.black && room.status === "waiting") {
        room.status = "active";
      }
      this.notify(roomId);
      return { success: true, token, role: "white", room };
    }

    if (!room.black) {
      room.black = {
        id: crypto.randomUUID(),
        name: options?.playerName?.trim() || "Player 2 (Black)",
        color: "black",
        token,
        connected: true,
      };
      if (room.white && room.status === "waiting") {
        room.status = "active";
        room.chat.push({
          id: crypto.randomUUID(),
          sender: "System",
          text: `Match started! ${room.white.name} (White) vs ${room.black.name} (Black).`,
          timestamp: Date.now(),
        });
      }
      this.notify(roomId);
      return { success: true, token, role: "black", room };
    }

    // Otherwise join as spectator
    const spectator: RoomPlayer = {
      id: crypto.randomUUID(),
      name: options?.playerName?.trim() || `Spectator #${room.spectators.length + 1}`,
      color: "spectator",
      token,
      connected: true,
    };
    room.spectators.push(spectator);
    this.notify(roomId);
    return { success: true, token, role: "spectator", room };
  }

  public makeMove(
    roomId: string,
    payload: { token: string; from: Square; to: Square; promotion?: string }
  ): { success: boolean; room?: AuthoritativeRoom; error?: string } {
    const room = this.getRoom(roomId);
    if (!room) return { success: false, error: "Room not found" };

    if (room.status === "completed" || room.status === "aborted") {
      return { success: false, error: "Game is already finished" };
    }

    // Determine acting player
    let playerColor: "w" | "b" | null = null;
    if (room.white && room.white.token === payload.token) playerColor = "w";
    else if (room.black && room.black.token === payload.token) playerColor = "b";

    if (!playerColor) {
      return { success: false, error: "Unauthorized: Invalid or spectator player token" };
    }

    if (room.turn !== playerColor) {
      return { success: false, error: `It is ${room.turn === "w" ? "White's" : "Black's"} turn to move` };
    }

    const now = Date.now();

    // Deduct elapsed time on active player's clock
    if (room.lastMoveTimestamp) {
      const elapsed = now - room.lastMoveTimestamp;
      if (playerColor === "w") {
        room.whiteTimeLeftMs -= elapsed;
        if (room.whiteTimeLeftMs <= 0) {
          room.whiteTimeLeftMs = 0;
          room.status = "completed";
          room.result = "0-1";
          room.termination = "timeout";
          room.winner = "black";
          this.notify(roomId);
          return { success: false, error: "Time expired" };
        }
      } else {
        room.blackTimeLeftMs -= elapsed;
        if (room.blackTimeLeftMs <= 0) {
          room.blackTimeLeftMs = 0;
          room.status = "completed";
          room.result = "1-0";
          room.termination = "timeout";
          room.winner = "white";
          this.notify(roomId);
          return { success: false, error: "Time expired" };
        }
      }
    }

    // Authoritative move validation with chess.js
    const chess = new Chess(room.fen);
    let moveResult;
    try {
      moveResult = chess.move({
        from: payload.from,
        to: payload.to,
        promotion: (payload.promotion as any) || "q",
      });
    } catch {
      return { success: false, error: "Illegal move according to chess rules" };
    }

    if (!moveResult) {
      return { success: false, error: "Illegal move according to chess rules" };
    }

    // Apply clock increment
    if (playerColor === "w") {
      room.whiteTimeLeftMs += room.incrementMs;
    } else {
      room.blackTimeLeftMs += room.incrementMs;
    }

    // Update game state
    room.fen = chess.fen();
    room.pgn = chess.pgn();
    room.history.push(moveResult.san);
    room.turn = chess.turn();
    room.lastMove = { from: payload.from, to: payload.to, san: moveResult.san };
    room.lastMoveTimestamp = now;
    room.drawOfferFrom = null;

    if (room.status === "waiting") {
      room.status = "active";
    }

    // Check win/draw conditions
    if (chess.isCheckmate()) {
      room.status = "completed";
      room.termination = "checkmate";
      room.winner = playerColor === "w" ? "white" : "black";
      room.result = playerColor === "w" ? "1-0" : "0-1";
      room.chat.push({
        id: crypto.randomUUID(),
        sender: "System",
        text: `🏆 Checkmate! ${playerColor === "w" ? "White" : "Black"} wins!`,
        timestamp: now,
      });
    } else if (chess.isDraw()) {
      room.status = "completed";
      room.winner = "draw";
      room.result = "1/2-1/2";
      if (chess.isStalemate()) room.termination = "stalemate";
      else if (chess.isThreefoldRepetition()) room.termination = "agreement";
      else room.termination = "stalemate";

      room.chat.push({
        id: crypto.randomUUID(),
        sender: "System",
        text: `🤝 Game drawn (${room.termination})`,
        timestamp: now,
      });
    }

    this.notify(roomId);
    return { success: true, room };
  }

  public handleAction(
    roomId: string,
    payload: { token: string; action: "resign" | "offer_draw" | "accept_draw" | "claim_timeout" }
  ): { success: boolean; room?: AuthoritativeRoom; error?: string } {
    const room = this.getRoom(roomId);
    if (!room) return { success: false, error: "Room not found" };

    let playerColor: "w" | "b" | null = null;
    if (room.white && room.white.token === payload.token) playerColor = "w";
    else if (room.black && room.black.token === payload.token) playerColor = "b";

    const now = Date.now();

    if (payload.action === "resign") {
      if (!playerColor) return { success: false, error: "Unauthorized" };
      if (room.status !== "active" && room.status !== "waiting") {
        return { success: false, error: "Game is not active" };
      }
      room.status = "completed";
      room.termination = "resignation";
      room.winner = playerColor === "w" ? "black" : "white";
      room.result = playerColor === "w" ? "0-1" : "1-0";
      room.chat.push({
        id: crypto.randomUUID(),
        sender: "System",
        text: `🏳️ ${playerColor === "w" ? "White" : "Black"} resigned. ${
          room.winner === "white" ? "White" : "Black"
        } wins!`,
        timestamp: now,
      });
      this.notify(roomId);
      return { success: true, room };
    }

    if (payload.action === "offer_draw") {
      if (!playerColor) return { success: false, error: "Unauthorized" };
      room.drawOfferFrom = playerColor;
      room.chat.push({
        id: crypto.randomUUID(),
        sender: "System",
        text: `🤝 ${playerColor === "w" ? "White" : "Black"} offered a draw.`,
        timestamp: now,
      });
      this.notify(roomId);
      return { success: true, room };
    }

    if (payload.action === "accept_draw") {
      if (!playerColor) return { success: false, error: "Unauthorized" };
      if (!room.drawOfferFrom || room.drawOfferFrom === playerColor) {
        return { success: false, error: "No pending draw offer to accept" };
      }
      room.status = "completed";
      room.termination = "agreement";
      room.winner = "draw";
      room.result = "1/2-1/2";
      room.drawOfferFrom = null;
      room.chat.push({
        id: crypto.randomUUID(),
        sender: "System",
        text: `🤝 Draw accepted by agreement!`,
        timestamp: now,
      });
      this.notify(roomId);
      return { success: true, room };
    }

    if (payload.action === "claim_timeout") {
      // Re-triggers flag fall logic in getRoom
      this.notify(roomId);
      return { success: true, room };
    }

    return { success: false, error: "Unknown action" };
  }

  public addChat(
    roomId: string,
    payload: { sender: string; text: string; token?: string }
  ): { success: boolean; error?: string } {
    const room = this.getRoom(roomId);
    if (!room) return { success: false, error: "Room not found" };

    const cleanText = payload.text.trim().slice(0, 300);
    if (!cleanText) return { success: false, error: "Message cannot be empty" };

    let sender = payload.sender.trim().slice(0, 30) || "Anonymous";
    if (payload.token) {
      if (room.white && room.white.token === payload.token) sender = `${room.white.name} (White)`;
      else if (room.black && room.black.token === payload.token) sender = `${room.black.name} (Black)`;
    }

    room.chat.push({
      id: crypto.randomUUID(),
      sender,
      text: cleanText,
      timestamp: Date.now(),
    });

    if (room.chat.length > 100) {
      room.chat = room.chat.slice(-100);
    }

    this.notify(roomId);
    return { success: true };
  }
}

// Global singleton instance
const globalForRoomManager = global as unknown as { roomManagerInstance?: RoomManager };
export const roomManager = globalForRoomManager.roomManagerInstance ?? new RoomManager();
if (process.env.NODE_ENV !== "production") globalForRoomManager.roomManagerInstance = roomManager;
