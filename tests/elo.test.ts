import test from "node:test";
import assert from "node:assert";
import { calculateEloChange, DEFAULT_STARTING_ELO } from "../lib/chess/elo.ts";

test("ELO Engine - default starting ELO is 1200", () => {
  assert.strictEqual(DEFAULT_STARTING_ELO, 1200);
});

test("ELO Engine - beating a much higher rated bot gains high ELO", () => {
  // Player 1200 beats Magnus 2800
  const result = calculateEloChange(1200, 2800, 1, 32);
  assert.strictEqual(result.delta, 32);
  assert.strictEqual(result.newPlayerElo, 1232);
});

test("ELO Engine - losing to a much higher rated bot loses minimal ELO", () => {
  // Player 1200 loses to Magnus 2800
  const result = calculateEloChange(1200, 2800, 0, 32);
  assert.ok(result.delta <= 0 && result.delta >= -1);
  assert.strictEqual(result.newPlayerElo, 1200); // 0 or minimal change
});

test("ELO Engine - equal rating win gains half of K factor", () => {
  // Player 1200 beats opponent 1200
  const result = calculateEloChange(1200, 1200, 1, 32);
  assert.strictEqual(result.delta, 16);
  assert.strictEqual(result.newPlayerElo, 1216);
});

test("ELO Engine - equal rating draw results in 0 change", () => {
  // Player 1200 draws opponent 1200
  const result = calculateEloChange(1200, 1200, 0.5, 32);
  assert.strictEqual(result.delta, 0);
  assert.strictEqual(result.newPlayerElo, 1200);
});

test("ELO Engine - losing to a lower rated bot penalizes heavily", () => {
  // Player 1200 loses to Mittens 400
  const result = calculateEloChange(1200, 400, 0, 32);
  assert.strictEqual(result.delta, -32);
  assert.strictEqual(result.newPlayerElo, 1168);
});
