import test from "node:test";
import assert from "node:assert";
import { Chess } from "chess.js";
import { ChessEvaluator } from "../lib/engine/evaluator.ts";

test("ChessEvaluator - initial position balance", () => {
  const game = new Chess();
  const score = ChessEvaluator.evaluatePosition(game);
  // Initial position should be roughly balanced (around 0 centipawns)
  assert.ok(Math.abs(score) < 50, `Initial eval score should be close to 0, got ${score}`);
});

test("ChessEvaluator - checkmate detection", () => {
  // Scholar's Mate: 1. e4 e5 2. Qh5 Nc6 3. Bc4 Nf6 4. Qxf7#
  const game = new Chess();
  game.move("e4");
  game.move("e5");
  game.move("Qh5");
  game.move("Nc6");
  game.move("Bc4");
  game.move("Nf6");
  game.move("Qxf7#");

  assert.strictEqual(game.isCheckmate(), true);
  const score = ChessEvaluator.evaluatePosition(game);
  // White delivered checkmate, score should be highly positive (+10000)
  assert.strictEqual(score, 10000);
});

test("ChessEvaluator - best move recommendation", () => {
  const game = new Chess();
  const { bestMove, score } = ChessEvaluator.getBestMoveAndEval(game, 2);
  assert.ok(bestMove !== null, "Should return a best move from start position");
  assert.ok(typeof score === "number", "Should return a numeric evaluation");
});

test("ChessEvaluator - analyzeFullGame accuracy computation", () => {
  // 4-move game
  const history = ["e4", "e5", "Nf3", "Nc6"];
  const analysis = ChessEvaluator.analyzeFullGame(history);

  assert.strictEqual(analysis.evaluatedMoves.length, 4);
  assert.ok(analysis.whiteAccuracy >= 50 && analysis.whiteAccuracy <= 100, `White accuracy: ${analysis.whiteAccuracy}`);
  assert.ok(analysis.blackAccuracy >= 50 && analysis.blackAccuracy <= 100, `Black accuracy: ${analysis.blackAccuracy}`);
  assert.ok(analysis.whiteStats.book > 0, "First moves should count towards opening book");
});
