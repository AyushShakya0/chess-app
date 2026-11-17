"use client";

import { useState, useCallback, useEffect } from "react";
import { Chess, Square, Move } from "chess.js";
import { sound } from "@/lib/audio/sound";
import { setActiveGamePosition } from "@/lib/stores/active-game-store";

export interface ChessGameStatus {
  isGameOver: boolean;
  isCheck: boolean;
  isCheckmate: boolean;
  isDraw: boolean;
  isStalemate: boolean;
  isThreefoldRepetition: boolean;
  isInsufficientMaterial: boolean;
}

export interface UseChessGameOptions {
  initialFen?: string;
  initialPgn?: string;
  enableSounds?: boolean;
  persistenceKey?: string;
}

export interface MoveInput {
  from: Square;
  to: Square;
  promotion?: string;
}

export interface UseChessGameReturn {
  game: Chess;
  version: number;
  fen: string;
  turn: "w" | "b";
  history: string[];
  pgn: string;
  lastMove: { from: Square; to: Square } | null;
  status: ChessGameStatus;
  move: (moveInput: string | MoveInput) => Move | null;
  undo: () => Move | null;
  reset: (newFen?: string) => void;
  loadPgn: (pgn: string) => boolean;
  loadFen: (fen: string) => boolean;
  setLastMove: (lastMove: { from: Square; to: Square } | null) => void;
  bumpVersion: () => void;
  syncState: (moveExecuted?: Move | null) => void;
}

function deriveStatus(game: Chess): ChessGameStatus {
  return {
    isGameOver: game.isGameOver(),
    isCheck: game.inCheck(),
    isCheckmate: game.isCheckmate(),
    isDraw: game.isDraw(),
    isStalemate: game.isStalemate(),
    isThreefoldRepetition: game.isThreefoldRepetition(),
    isInsufficientMaterial: game.isInsufficientMaterial(),
  };
}

export function useChessGame(options: UseChessGameOptions = {}): UseChessGameReturn {
  const { initialFen, initialPgn, enableSounds = true, persistenceKey } = options;

  // Single persistent Chess instance held in state (avoiding ref-during-render flags)
  const [game] = useState<Chess>(() => {
    const c = new Chess();
    if (typeof window !== "undefined" && persistenceKey) {
      try {
        const saved = localStorage.getItem(persistenceKey);
        if (saved && saved.trim()) {
          c.loadPgn(saved);
          return c;
        }
      } catch {}
    }
    if (initialPgn) {
      try {
        c.loadPgn(initialPgn);
        return c;
      } catch {}
    }
    if (initialFen) {
      try {
        c.load(initialFen);
        return c;
      } catch {}
    }
    return c;
  });

  const [version, setVersion] = useState(0);
  const [fen, setFen] = useState<string>(() => game.fen());
  const [turn, setTurn] = useState<"w" | "b">(() => game.turn());
  const [history, setHistory] = useState<string[]>(() => game.history());
  const [pgn, setPgn] = useState<string>(() => game.pgn());
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [status, setStatus] = useState<ChessGameStatus>(() => deriveStatus(game));

  const syncState = useCallback((moveExecuted?: Move | null) => {
    setFen(game.fen());
    setTurn(game.turn());
    setHistory(game.history());
    const currentPgn = game.pgn();
    setPgn(currentPgn);
    setStatus(deriveStatus(game));
    if (moveExecuted) {
      setLastMove({ from: moveExecuted.from as Square, to: moveExecuted.to as Square });
    }
    setVersion((v) => v + 1);

    if (typeof window !== "undefined" && persistenceKey) {
      try {
        localStorage.setItem(persistenceKey, currentPgn);
      } catch {}
    }

    setActiveGamePosition(game.fen(), currentPgn, persistenceKey || "custom");
  }, [game, persistenceKey]);

  const move = useCallback(
    (moveInput: string | MoveInput): Move | null => {
      try {
        const executed = game.move(moveInput);
        if (!executed) return null;

        if (enableSounds) {
          if (executed.captured) {
            sound.playCapture();
          } else if (executed.flags.includes("k") || executed.flags.includes("q")) {
            sound.playCastle();
          } else {
            sound.playMove();
          }

          if (game.inCheck()) {
            setTimeout(() => sound.playCheck(), 100);
          }
        }

        syncState(executed);
        return executed;
      } catch {
        return null;
      }
    },
    [game, enableSounds, syncState]
  );

  const undo = useCallback((): Move | null => {
    try {
      const undone = game.undo();
      if (undone) {
        if (enableSounds) sound.playMove();
        syncState();
      }
      return undone;
    } catch {
      return null;
    }
  }, [game, enableSounds, syncState]);

  const reset = useCallback(
    (newFen?: string) => {
      try {
        if (newFen) {
          game.load(newFen);
        } else {
          game.reset();
        }
        setLastMove(null);
        syncState();

        if (typeof window !== "undefined" && persistenceKey) {
          try {
            localStorage.removeItem(persistenceKey);
          } catch {}
        }
      } catch {}
    },
    [game, persistenceKey, syncState]
  );

  const loadPgn = useCallback(
    (newPgn: string): boolean => {
      try {
        game.loadPgn(newPgn);
        setLastMove(null);
        syncState();
        return true;
      } catch {
        return false;
      }
    },
    [game, syncState]
  );

  const loadFen = useCallback(
    (newFen: string): boolean => {
      try {
        game.load(newFen);
        setLastMove(null);
        syncState();
        return true;
      } catch {
        return false;
      }
    },
    [game, syncState]
  );

  const bumpVersion = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);

  return {
    game,
    version,
    fen,
    turn,
    history,
    pgn,
    lastMove,
    status,
    move,
    undo,
    reset,
    loadPgn,
    loadFen,
    setLastMove,
    bumpVersion,
    syncState,
  };
}
