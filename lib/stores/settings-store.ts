"use client";

import { useState, useEffect, useCallback } from "react";
import { sound } from "../audio/sound.ts";

export type BoardTheme = "classic" | "wood" | "glass" | "neon" | "obsidian" | "tournament" | "emerald";
export type PieceSetStyle = "classic" | "gold" | "wood" | "pixel" | "modern";
export type EvalBarMode = "live" | "every-5" | "disabled";

export interface ChessSettings {
  theme: BoardTheme;
  pieceSet: PieceSetStyle;
  soundEnabled: boolean;
  volume: number; // 0.0 - 1.0
  autoQueen: boolean;
  evalMode: EvalBarMode;
  showCoordinates: boolean;
}

const DEFAULT_SETTINGS: ChessSettings = {
  theme: "classic",
  pieceSet: "classic",
  soundEnabled: true,
  volume: 0.6,
  autoQueen: true,
  evalMode: "live",
  showCoordinates: true,
};

const STORAGE_KEY = "sovereign_chess_settings";

// In-memory store state
let currentSettings: ChessSettings = { ...DEFAULT_SETTINGS };
const listeners = new Set<(settings: ChessSettings) => void>();

function syncToSoundEngine(s: ChessSettings) {
  sound.setEnabled(s.soundEnabled);
  sound.setVolume(s.volume);
}

// Load initial settings from localStorage on client
if (typeof window !== "undefined") {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      currentSettings = { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {}
  syncToSoundEngine(currentSettings);
}

export function getGlobalSettings(): ChessSettings {
  return currentSettings;
}

export function updateGlobalSettings(patch: Partial<ChessSettings>) {
  currentSettings = { ...currentSettings, ...patch };
  syncToSoundEngine(currentSettings);

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentSettings));
    } catch {}
  }

  listeners.forEach((listener) => listener(currentSettings));
}

export function useSettings(): [ChessSettings, (patch: Partial<ChessSettings>) => void] {
  const [settings, setSettings] = useState<ChessSettings>(currentSettings);

  useEffect(() => {
    const handler = (newSettings: ChessSettings) => {
      setSettings(newSettings);
    };
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  const update = useCallback((patch: Partial<ChessSettings>) => {
    updateGlobalSettings(patch);
  }, []);

  return [settings, update];
}
