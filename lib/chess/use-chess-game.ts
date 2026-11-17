"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Chess, Square, Move } from "chess.js";
import { sound } from "@/lib/audio/sound";

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
  const { initialFen, initialPgn, enableSounds = true } = options;

  // Single persistent Chess instance that preserves move history
  const gameRef = useRef<Chess>(
    initialPgn
      ? (() => {
          const c = new Chess();
          try {
            c.loadPgn(initialPgn);
          } catch {}
          return c;
        })()
      : initialFen
      ? new Chess(initialFen)
      : new Chess()
  );

  const [version, setVersion] = useState(0);
  const [fen, setFen] = useState<string>(() => gameRef.current.fen());
  const [turn, setTurn] = useState<"w" | "b">(() => gameRef.current.turn());
  const [history, setHistory] = useState<string[]>(() => gameRef.current.history());
  const [pgn, setPgn] = useState<string>(() => gameRef.current.pgn());
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [status, setStatus] = useState<ChessGameStatus>(() => deriveStatus(gameRef.current));

  const syncState = useCallback((moveExecuted?: Move | null) => {
    const g = gameRef.current;
    setFen(g.fen());
    setTurn(g.turn());
    setHistory(g.history());
    setPgn(g.pgn());
    setStatus(deriveStatus(g));
    if (moveExecuted) {
      setLastMove({ from: moveExecuted.from as Square, to: moveExecuted.to as Square });
    }
    setVersion((v) => v + 1);
  }, []);

  const move = useCallback(
    (moveInput: string | MoveInput): Move | null => {
      const g = gameRef.current;
      try {
        const executed = g.move(moveInput);
        if (!executed) return null;

        if (enableSounds) {
          if (executed.captured) {
            sound.playCapture();
          } else if (executed.flags.includes("k") || executed.flags.includes("q")) {
            sound.playCastle();
          } else {
            sound.playMove();
          }

          if (g.inCheck()) {
            setTimeout(() => sound.playCheck(), 100);
          }
        }

        syncState(executed);
        return executed;
      } catch {
        return null;
      }
    },
    [enableSounds, syncState]
  );

  const undo = useCallback((): Move | null => {
    const g = gameRef.current;
    const undone = g.undo();
    if (undone) {
      const hist = g.history({ verbose: true });
      if (hist.length > 0) {
        const prev = hist[hist.length - 1];
        setLastMove({ from: prev.from as Square, to: prev.to as Square });
      } else {
        setLastMove(null);
      }
      syncState(null);
      if (enableSounds) {
        sound.playMove();
      }
    }
    return undone;
  }, [enableSounds, syncState]);

  const reset = useCallback(
    (newFen?: string) => {
      if (newFen) {
        gameRef.current = new Chess(newFen);
      } else {
        gameRef.current = new Chess();
      }
      setLastMove(null);
      syncState(null);
    },
    [syncState]
  );

  const loadPgn = useCallback(
    (newPgn: string): boolean => {
      try {
        const next = new Chess();
        next.loadPgn(newPgn);
        gameRef.current = next;
        const hist = next.history({ verbose: true });
        if (hist.length > 0) {
          const prev = hist[hist.length - 1];
          setLastMove({ from: prev.from as Square, to: prev.to as Square });
        } else {
          setLastMove(null);
        }
        syncState(null);
        return true;
      } catch {
        return false;
      }
    },
    [syncState]
  );

  const loadFen = useCallback(
    (newFen: string): boolean => {
      try {
        const next = new Chess(newFen);
        gameRef.current = next;
        setLastMove(null);
        syncState(null);
        return true;
      } catch {
        return false;
      }
    },
    [syncState]
  );

  const bumpVersion = useCallback(() => {
    syncState(null);
  }, [syncState]);

  return {
    game: gameRef.current,
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
  };
}

