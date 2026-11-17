"use client";

import { useState, useEffect } from "react";
import { Chess } from "chess.js";

interface ActiveGameState {
  fen: string;
  pgn: string;
  source: string; // "bots" | "pass" | "variants" | "custom"
  is3DOpen: boolean;
}

const DEFAULT_STATE: ActiveGameState = {
  fen: new Chess().fen(),
  pgn: "",
  source: "bots",
  is3DOpen: false,
};

let currentState: ActiveGameState = { ...DEFAULT_STATE };
const listeners = new Set<(state: ActiveGameState) => void>();

export function getActiveGameState(): ActiveGameState {
  return currentState;
}

export function setActiveGamePosition(fen: string, pgn = "", source = "bots") {
  currentState = {
    ...currentState,
    fen,
    pgn,
    source,
  };
  listeners.forEach((l) => l(currentState));
}

export function toggle3DView(force?: boolean) {
  currentState = {
    ...currentState,
    is3DOpen: typeof force === "boolean" ? force : !currentState.is3DOpen,
  };
  listeners.forEach((l) => l(currentState));
}

export function useActiveGame(): [ActiveGameState, { setPosition: typeof setActiveGamePosition; toggle3D: typeof toggle3DView }] {
  const [state, setState] = useState<ActiveGameState>(currentState);

  useEffect(() => {
    const handler = (s: ActiveGameState) => setState(s);
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  return [state, { setPosition: setActiveGamePosition, toggle3D: toggle3DView }];
}
