"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { sound } from "@/lib/audio/sound";

export interface UseChessClockOptions {
  initialTimeSeconds: number; // e.g. 600 (10 mins), 300 (5 mins), 180 (3 mins)
  incrementSeconds?: number; // e.g. 0, 1, 2, 5
  activeColor: "w" | "b";
  isRunning: boolean;
  onTimeout?: (loserColor: "w" | "b") => void;
  lowTimeThreshold?: number; // seconds, default 10
}

export interface UseChessClockReturn {
  whiteTime: number; // integer seconds remaining
  blackTime: number; // integer seconds remaining
  whiteDisplay: string; // "MM:SS" or "M:SS.d" when under 10s
  blackDisplay: string;
  isLowTimeWhite: boolean;
  isLowTimeBlack: boolean;
  switchTurn: () => void;
  resetClock: (newTimeSeconds?: number) => void;
  setTime: (color: "w" | "b", seconds: number) => void;
}

export function formatTimeDisplay(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function useChessClock({
  initialTimeSeconds,
  incrementSeconds = 0,
  activeColor,
  isRunning,
  onTimeout,
  lowTimeThreshold = 10,
}: UseChessClockOptions): UseChessClockReturn {
  const whiteMsRef = useRef(initialTimeSeconds * 1000);
  const blackMsRef = useRef(initialTimeSeconds * 1000);
  const lastTimestampRef = useRef<number | null>(null);
  const timedOutRef = useRef<boolean>(false);
  const lastTickedSecondRef = useRef<{ w: number | null; b: number | null }>({ w: null, b: null });

  const [whiteDisplaySec, setWhiteDisplaySec] = useState(initialTimeSeconds);
  const [blackDisplaySec, setBlackDisplaySec] = useState(initialTimeSeconds);

  // Sync state when initialTimeSeconds changes
  const resetClock = useCallback(
    (newTimeSeconds?: number) => {
      const t = newTimeSeconds ?? initialTimeSeconds;
      whiteMsRef.current = t * 1000;
      blackMsRef.current = t * 1000;
      lastTimestampRef.current = null;
      timedOutRef.current = false;
      lastTickedSecondRef.current = { w: null, b: null };
      setWhiteDisplaySec(t);
      setBlackDisplaySec(t);
    },
    [initialTimeSeconds]
  );

  const setTime = useCallback((color: "w" | "b", seconds: number) => {
    if (color === "w") {
      whiteMsRef.current = Math.max(0, seconds * 1000);
      setWhiteDisplaySec(Math.ceil(whiteMsRef.current / 1000));
    } else {
      blackMsRef.current = Math.max(0, seconds * 1000);
      setBlackDisplaySec(Math.ceil(blackMsRef.current / 1000));
    }
  }, []);

  // When a turn ends, add increment to the player who just finished their move
  const switchTurn = useCallback(() => {
    if (timedOutRef.current) return;
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();

    if (lastTimestampRef.current !== null) {
      const elapsed = now - lastTimestampRef.current;
      if (activeColor === "w") {
        whiteMsRef.current = Math.max(0, whiteMsRef.current - elapsed + incrementSeconds * 1000);
        setWhiteDisplaySec(Math.ceil(whiteMsRef.current / 1000));
      } else {
        blackMsRef.current = Math.max(0, blackMsRef.current - elapsed + incrementSeconds * 1000);
        setBlackDisplaySec(Math.ceil(blackMsRef.current / 1000));
      }
    }
    lastTimestampRef.current = isRunning ? now : null;
  }, [activeColor, incrementSeconds, isRunning]);

  // Main high-precision clock tick loop
  useEffect(() => {
    if (!isRunning || timedOutRef.current) {
      lastTimestampRef.current = null;
      return;
    }

    lastTimestampRef.current = typeof performance !== "undefined" ? performance.now() : Date.now();

    const interval = setInterval(() => {
      if (timedOutRef.current) return;
      const now = typeof performance !== "undefined" ? performance.now() : Date.now();
      const last = lastTimestampRef.current ?? now;
      const elapsed = Math.max(0, now - last);
      lastTimestampRef.current = now;

      if (activeColor === "w") {
        whiteMsRef.current = Math.max(0, whiteMsRef.current - elapsed);
        const sec = Math.ceil(whiteMsRef.current / 1000);
        setWhiteDisplaySec(sec);

        if (sec <= lowTimeThreshold && sec > 0 && lastTickedSecondRef.current.w !== sec) {
          lastTickedSecondRef.current.w = sec;
          sound.playLowTimeTick();
        }

        if (whiteMsRef.current <= 0) {
          timedOutRef.current = true;
          clearInterval(interval);
          if (onTimeout) onTimeout("w");
        }
      } else {
        blackMsRef.current = Math.max(0, blackMsRef.current - elapsed);
        const sec = Math.ceil(blackMsRef.current / 1000);
        setBlackDisplaySec(sec);

        if (sec <= lowTimeThreshold && sec > 0 && lastTickedSecondRef.current.b !== sec) {
          lastTickedSecondRef.current.b = sec;
          sound.playLowTimeTick();
        }

        if (blackMsRef.current <= 0) {
          timedOutRef.current = true;
          clearInterval(interval);
          if (onTimeout) onTimeout("b");
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isRunning, activeColor, lowTimeThreshold, onTimeout]);

  const isLowTimeWhite = whiteDisplaySec <= lowTimeThreshold && whiteDisplaySec > 0;
  const isLowTimeBlack = blackDisplaySec <= lowTimeThreshold && blackDisplaySec > 0;

  return {
    whiteTime: whiteDisplaySec,
    blackTime: blackDisplaySec,
    whiteDisplay: formatTimeDisplay(whiteDisplaySec),
    blackDisplay: formatTimeDisplay(blackDisplaySec),
    isLowTimeWhite,
    isLowTimeBlack,
    switchTurn,
    resetClock,
    setTime,
  };
}

