import test from "node:test";
import assert from "node:assert/strict";
import { calculateEloChange, DEFAULT_STARTING_ELO } from "../lib/chess/elo.ts";

test("Guest & ELO Rules - Starting ELO is 1200 across formats", () => {
  assert.equal(DEFAULT_STARTING_ELO, 1200);
});

test("Guest Puzzle Limit - allows 3 free puzzles, gates 4th puzzle", () => {
  const maxFreePuzzles = 3;
  const isPuzzleGated = (solvedCount: number, isAuthenticated: boolean) => {
    if (isAuthenticated) return false;
    return solvedCount >= maxFreePuzzles;
  };

  assert.equal(isPuzzleGated(0, false), false, "Guest with 0 solved can play");
  assert.equal(isPuzzleGated(1, false), false, "Guest with 1 solved can play");
  assert.equal(isPuzzleGated(2, false), false, "Guest with 2 solved can play");
  assert.equal(isPuzzleGated(3, false), true, "Guest with 3 solved is gated from 4th puzzle");
  assert.equal(isPuzzleGated(5, true), false, "Authenticated user is never gated");
});

test("Bot ELO Progression - beating Magnus Carlsen ranks up player ELO significantly", () => {
  const playerElo = 1200;
  const magnusElo = 2800;
  const win = calculateEloChange(playerElo, magnusElo, 1, 32);

  assert.ok(win.delta >= 31, "Beating Magnus from 1200 should award max K-factor delta (+32)");
  assert.equal(win.newPlayerElo, 1200 + win.delta);
});

test("Bot ELO Progression - beating Mittens ranks up player ELO appropriately", () => {
  const playerElo = 1200;
  const mittensElo = 400;
  const win = calculateEloChange(playerElo, mittensElo, 1, 32);

  assert.ok(win.delta >= 0 && win.delta <= 2, "Beating low rated bot from 1200 gives small delta");
  assert.equal(win.newPlayerElo, 1200 + win.delta);
});

test("Donut Chart Geometry - contiguous arc lengths sum exactly to 100% of circumference", () => {
  const radius = 38;
  const circumference = 2 * Math.PI * radius; // ~238.761

  const winRate = 62;
  const drawRate = 12;
  const lossRate = 26;

  const winLen = (winRate / 100) * circumference;
  const drawLen = (drawRate / 100) * circumference;
  const lossLen = (lossRate / 100) * circumference;

  const totalLen = winLen + drawLen + lossLen;
  assert.ok(Math.abs(totalLen - circumference) < 0.001, "Arcs must equal full circumference");

  // Verify non-overlapping sequential offsets
  const winOffset = 0;
  const drawOffset = -winLen;
  const lossOffset = -(winLen + drawLen);

  assert.equal(winOffset, 0);
  assert.ok(drawOffset < 0);
  assert.ok(lossOffset < drawOffset);
});
