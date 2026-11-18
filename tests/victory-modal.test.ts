import test from "node:test";
import assert from "node:assert";
import { formatVictoryData } from "../lib/chess/victory-types.ts";

test("Victory Types - format victory data for checkmate win", () => {
  const data = formatVictoryData("win", "checkmate");
  assert.strictEqual(data.title, "You Won!");
  assert.strictEqual(data.subtitle, "Checkmate!");
  assert.strictEqual(data.isWin, true);
  assert.strictEqual(data.accentColor, "text-[#d4a359]");
});

test("Victory Types - format victory data for resignation win", () => {
  const data = formatVictoryData("win", "resignation");
  assert.strictEqual(data.title, "You Won!");
  assert.strictEqual(data.subtitle, "Opponent Resigned");
  assert.strictEqual(data.isWin, true);
});

test("Victory Types - format defeat by checkmate", () => {
  const data = formatVictoryData("loss", "checkmate");
  assert.strictEqual(data.title, "Defeat");
  assert.strictEqual(data.subtitle, "Checkmate!");
  assert.strictEqual(data.isWin, false);
  assert.strictEqual(data.accentColor, "text-rose-400");
});

test("Victory Types - format draw agreement", () => {
  const data = formatVictoryData("draw", "agreement");
  assert.strictEqual(data.title, "Game Drawn");
  assert.strictEqual(data.isWin, false);
});
