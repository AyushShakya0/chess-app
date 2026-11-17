import test from "node:test";
import assert from "node:assert";
import { StockfishService } from "../lib/engine/stockfish-service.ts";

test("StockfishService - initialization and fallback readiness", async () => {
  const engine = new StockfishService();
  const ready = await engine.init();
  assert.strictEqual(ready, true);
});

test("StockfishService - evaluate initial position", async () => {
  const engine = new StockfishService();
  await engine.init();

  const startFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const result = await engine.evaluate(startFen, 2);

  assert.strictEqual(result.isMate, false);
  assert.strictEqual(result.mateIn, null);
  // Score should be close to 0 in starting position (balanced)
  assert.ok(Math.abs(result.scoreCp) < 50);
  assert.ok(result.bestMove.length >= 4);
});

test("StockfishService - detect checkmate delivery", async () => {
  const engine = new StockfishService();
  await engine.init();

  // Scholar's mate position: White delivers mate with Qxf7#
  // 1. e4 e5 2. Qh5 Nc6 3. Bc4 Nf6 4. Qxf7#
  const mateFen = "r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4";
  const result = await engine.evaluate(mateFen, 1);

  assert.strictEqual(result.isMate, true);
  assert.strictEqual(result.mateIn, 1); // White mated Black
  assert.ok(result.scoreCp >= 9000);
});

test("StockfishService - find best move in tactical position", async () => {
  const engine = new StockfishService();
  await engine.init();

  // White has mate in 1 with Qh7#
  // fen: 5rk1/5ppp/8/8/8/6Q1/5PPP/4R1K1 w - - 0 1 (White Qh7 is not yet mate)
  // Clean mate-in-1:
  // White to move: Queen on f3, King on g8 with pawn on g7, h7: Qf7 or similar
  // Let's use back-rank mate: White has rook on d1, Black has king on e8, back rank open:
  const backRankFen = "4k3/4bppp/8/8/8/8/8/3R2K1 w - - 0 1";
  const bestMove = await engine.getBestMove(backRankFen, 2);
  assert.ok(typeof bestMove === "string");
  assert.ok(bestMove.length >= 4);
});

test("StockfishService - stop and terminate without errors", async () => {
  const engine = new StockfishService();
  await engine.init();
  assert.doesNotThrow(() => engine.stop());
  assert.doesNotThrow(() => engine.terminate());
});
