/**
 * Dynamic Puzzle ELO Rating Engine
 * Implements FIDE-style ELO adjustment for tactical chess puzzles.
 */

export interface PuzzleRatingResult {
  previousRating: number;
  newRating: number;
  delta: number;
  expectedScore: number;
}

const STORAGE_KEY = "sovereign_chess_puzzle_elo";
const DEFAULT_ELO = 1200;

/**
 * Calculates ELO rating change for a puzzle attempt.
 * @param userRating - Player's current puzzle rating
 * @param puzzleRating - Puzzle's assigned difficulty rating
 * @param solved - Whether the player solved the puzzle without hints
 * @param timeTakenSec - Optional time in seconds taken to solve
 */
export function calculatePuzzleEloChange(
  userRating: number,
  puzzleRating: number,
  solved: boolean,
  timeTakenSec?: number
): PuzzleRatingResult {
  const K = 32;
  const exponent = (puzzleRating - userRating) / 400;
  const expectedScore = 1 / (1 + Math.pow(10, exponent));

  const actualScore = solved ? 1 : 0;
  let rawDelta = Math.round(K * (actualScore - expectedScore));

  // Speed bonus for rapid solving
  if (solved && typeof timeTakenSec === "number" && timeTakenSec > 0 && timeTakenSec <= 15) {
    rawDelta += 2;
  }

  // Clamping to guarantee meaningful progression
  let delta: number;
  if (solved) {
    delta = Math.max(5, Math.min(35, rawDelta));
  } else {
    delta = Math.min(-5, Math.max(-35, rawDelta));
  }

  const newRating = Math.max(100, userRating + delta);

  return {
    previousRating: userRating,
    newRating,
    delta,
    expectedScore,
  };
}

export function getStoredPuzzleElo(): number {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const val = parseInt(stored, 10);
        if (!isNaN(val) && val > 100) return val;
      }
    } catch {}
  }
  return DEFAULT_ELO;
}

export function saveStoredPuzzleElo(elo: number): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, String(elo));
    } catch {}
  }
}
