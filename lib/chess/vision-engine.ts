import type { Square } from "chess.js";

export const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
export const RANKS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export type BoardOrientation = "white" | "black";
export type VisionTrainingMode = "find-square" | "name-square";

export interface VisionHighScore {
  whiteBest: number;
  blackBest: number;
  totalPracticed: number;
}

const STORAGE_KEY = "prin_chess_vision_scores";

export const ALL_SQUARES: Square[] = [];
for (const file of FILES) {
  for (const rank of RANKS) {
    ALL_SQUARES.push(`${file}${rank}` as Square);
  }
}

/**
 * Returns a random square, ensuring it does not immediately repeat the previous square.
 */
export function getRandomSquare(exclude?: Square): Square {
  let next: Square;
  do {
    const idx = Math.floor(Math.random() * ALL_SQUARES.length);
    next = ALL_SQUARES[idx];
  } while (exclude && next === exclude && ALL_SQUARES.length > 1);
  return next;
}

/**
 * Calculates whether a square is light or dark.
 * a1 is dark, b1 is light, c1 is dark, etc.
 */
export function getSquareColor(square: Square): "light" | "dark" {
  const fileChar = square[0];
  const rankNum = parseInt(square[1], 10);
  const fileIdx = FILES.indexOf(fileChar as any);
  // a1 (0, 1): 1 is odd -> dark; b1 (1, 1): 2 is even -> light
  return (fileIdx + rankNum) % 2 === 0 ? "light" : "dark";
}

/**
 * Generates 4 multiple choice coordinate options for "name-square" mode,
 * with 1 correct answer and 3 distinct random foils.
 */
export function generateCoordinateChoices(correct: Square): Square[] {
  const choices = new Set<Square>([correct]);
  while (choices.size < 4) {
    const foil = getRandomSquare(correct);
    choices.add(foil);
  }
  // Shuffle options
  return Array.from(choices).sort(() => Math.random() - 0.5);
}

/**
 * Reads persistent personal records for Vision training.
 */
export function loadVisionHighScores(): VisionHighScore {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          whiteBest: Number(parsed.whiteBest) || 0,
          blackBest: Number(parsed.blackBest) || 0,
          totalPracticed: Number(parsed.totalPracticed) || 0,
        };
      }
    } catch {}
  }
  return { whiteBest: 0, blackBest: 0, totalPracticed: 0 };
}

/**
 * Saves personal records.
 */
export function saveVisionHighScores(scores: VisionHighScore): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
    } catch {}
  }
}
