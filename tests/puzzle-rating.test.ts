import test from "node:test";
import assert from "node:assert";
import {
  calculatePuzzleEloChange,
  getStoredPuzzleElo,
  saveStoredPuzzleElo,
} from "../lib/chess/puzzle-rating.ts";

test("Puzzle ELO - higher rated puzzle yields greater gain on success", () => {
  const userRating = 1200;
  // Beating an 1800 puzzle (much harder)
  const hardResult = calculatePuzzleEloChange(userRating, 1800, true);
  // Beating an 800 puzzle (much easier)
  const easyResult = calculatePuzzleEloChange(userRating, 800, true);

  assert.ok(hardResult.delta > easyResult.delta);
  assert.ok(hardResult.newRating > userRating);
  assert.ok(easyResult.newRating > userRating);
  assert.strictEqual(hardResult.delta, 31); // high gain clamped under 35
});

test("Puzzle ELO - failing against lower rated puzzle yields larger penalty", () => {
  const userRating = 1500;
  // Failing an easy 900 puzzle
  const failedEasy = calculatePuzzleEloChange(userRating, 900, false);
  // Failing a hard 2100 puzzle
  const failedHard = calculatePuzzleEloChange(userRating, 2100, false);

  assert.ok(failedEasy.delta < failedHard.delta); // e.g. -31 vs -5
  assert.ok(failedEasy.newRating < userRating);
  assert.ok(failedHard.newRating < userRating);
});

test("Puzzle ELO - speed bonus gives extra delta when solved in <= 15s", () => {
  const userRating = 1200;
  const puzzleRating = 1200;

  const normalSolve = calculatePuzzleEloChange(userRating, puzzleRating, true, 45);
  const fastSolve = calculatePuzzleEloChange(userRating, puzzleRating, true, 8);

  assert.strictEqual(fastSolve.delta, normalSolve.delta + 2);
});

test("Puzzle ELO - rating is clamped to at least 100", () => {
  const userRating = 110;
  const puzzleRating = 600;
  const result = calculatePuzzleEloChange(userRating, puzzleRating, false);

  assert.ok(result.newRating >= 100);
});

test("Puzzle ELO - storage fallback when window is undefined", () => {
  // In Node environment without window
  const defaultElo = getStoredPuzzleElo();
  assert.strictEqual(defaultElo, 1200);

  // saveStoredPuzzleElo doesn't throw
  assert.doesNotThrow(() => saveStoredPuzzleElo(1450));
});
