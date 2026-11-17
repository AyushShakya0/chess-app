import test from "node:test";
import assert from "node:assert";
import {
  ALL_SQUARES,
  getRandomSquare,
  getSquareColor,
  generateCoordinateChoices,
  loadVisionHighScores,
  saveVisionHighScores,
} from "../lib/chess/vision-engine.ts";

test("Vision Engine - all 64 squares present", () => {
  assert.strictEqual(ALL_SQUARES.length, 64);
  assert.ok(ALL_SQUARES.includes("a1"));
  assert.ok(ALL_SQUARES.includes("h8"));
  assert.ok(ALL_SQUARES.includes("e4"));
  assert.ok(ALL_SQUARES.includes("d5"));
});

test("Vision Engine - square colors accurate", () => {
  // a1 is dark
  assert.strictEqual(getSquareColor("a1"), "dark");
  // h1 is light
  assert.strictEqual(getSquareColor("h1"), "light");
  // e4 is light
  assert.strictEqual(getSquareColor("e4"), "light");
  // d4 is dark
  assert.strictEqual(getSquareColor("d4"), "dark");
  // c1 is dark
  assert.strictEqual(getSquareColor("c1"), "dark");
  // f1 is light
  assert.strictEqual(getSquareColor("f1"), "light");
});

test("Vision Engine - random square generator excludes previous square", () => {
  const current = "e4";
  for (let i = 0; i < 50; i++) {
    const next = getRandomSquare(current);
    assert.notStrictEqual(next, current);
    assert.ok(ALL_SQUARES.includes(next));
  }
});

test("Vision Engine - multiple choice foils include correct square and 3 distinct options", () => {
  const correct = "g7";
  const choices = generateCoordinateChoices(correct);
  assert.strictEqual(choices.length, 4);
  assert.ok(choices.includes(correct));

  const unique = new Set(choices);
  assert.strictEqual(unique.size, 4);
});

test("Vision Engine - storage fallbacks handle non-browser environments gracefully", () => {
  const scores = loadVisionHighScores();
  assert.strictEqual(scores.whiteBest, 0);
  assert.strictEqual(scores.blackBest, 0);
  assert.doesNotThrow(() => saveVisionHighScores({ whiteBest: 15, blackBest: 12, totalPracticed: 27 }));
});
