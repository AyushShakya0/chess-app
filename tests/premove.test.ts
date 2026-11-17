import test from "node:test";
import assert from "node:assert";
import { Chess, type Square } from "chess.js";
import {
  enqueuePremove,
  clearPremoveQueue,
  buildVirtualPremoveBoard,
  getPremoveLegalMoves,
  processPremoveExecution,
  MAX_PREMOVE_QUEUE_SIZE,
} from "../lib/chess/premove-queue.ts";

test("Multi-Premove Queue - enqueue up to max queue capacity", () => {
  let queue = enqueuePremove([], { from: "e2" as Square, to: "e4" as Square });
  assert.strictEqual(queue.length, 1);

  queue = enqueuePremove(queue, { from: "g1" as Square, to: "f3" as Square });
  assert.strictEqual(queue.length, 2);

  queue = enqueuePremove(queue, { from: "d2" as Square, to: "d4" as Square });
  assert.strictEqual(queue.length, 3);

  // 4th move should not exceed MAX_PREMOVE_QUEUE_SIZE (3)
  queue = enqueuePremove(queue, { from: "c2" as Square, to: "c4" as Square });
  assert.strictEqual(queue.length, MAX_PREMOVE_QUEUE_SIZE);

  // Clear queue
  queue = clearPremoveQueue();
  assert.strictEqual(queue.length, 0);
});

test("Multi-Premove Queue - virtual board calculates legal dots when opponent is to move", () => {
  const game = new Chess();
  // White plays 1. e4, now Black is to move
  game.move("e4");
  assert.strictEqual(game.turn(), "b");

  // White wants to premove Nf3 or Ne2 while Black is thinking
  const legalMovesForWhiteKnight = getPremoveLegalMoves(game.fen(), [], "g1" as Square, "w");
  assert.ok(legalMovesForWhiteKnight.includes("f3" as Square));
  assert.ok(legalMovesForWhiteKnight.includes("h3" as Square));
  assert.ok(legalMovesForWhiteKnight.includes("e2" as Square));
  assert.ok(!legalMovesForWhiteKnight.includes("d2" as Square));
});

test("Multi-Premove Queue - multi-step virtual simulation", () => {
  const game = new Chess();
  // White plays 1. e4
  game.move("e4");

  // White queues premove 1: g1 -> f3
  const queue1 = [{ from: "g1" as Square, to: "f3" as Square }];

  // Now White selects Bishop on f1 on the virtual board where Knight has moved to f3
  const legalMovesForBishop = getPremoveLegalMoves(game.fen(), queue1, "f1" as Square, "w");
  assert.ok(legalMovesForBishop.includes("c4" as Square));
  assert.ok(legalMovesForBishop.includes("b5" as Square));
});

test("Multi-Premove Queue - execute legal premove on turn change", () => {
  const game = new Chess();
  // White queues e2-e4 and g1-f3
  let queue = [
    { from: "e2" as Square, to: "e4" as Square },
    { from: "g1" as Square, to: "f3" as Square },
  ];

  // It's White's turn, execute first premove
  const res = processPremoveExecution(game, queue);
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.executedMove?.from, "e2");
  assert.strictEqual(res.executedMove?.to, "e4");
  assert.strictEqual(res.remainingQueue.length, 1);
  assert.strictEqual(game.turn(), "b");

  // Black makes move e7-e5
  game.move("e5");
  assert.strictEqual(game.turn(), "w");

  // Second premove g1-f3 executes
  const res2 = processPremoveExecution(game, res.remainingQueue);
  assert.strictEqual(res2.success, true);
  assert.strictEqual(res2.executedMove?.from, "g1");
  assert.strictEqual(res2.executedMove?.to, "f3");
  assert.strictEqual(res2.remainingQueue.length, 0);
  assert.strictEqual(game.turn(), "b");
});

test("Multi-Premove Queue - illegal premove clears queue", () => {
  const game = new Chess();
  game.move("e4");
  // Black plays e5
  game.move("e5");

  // White queues an illegal premove (e.g. pawn e4 to e6 when blocked or occupied)
  const badQueue = [{ from: "e4" as Square, to: "e6" as Square }];
  const res = processPremoveExecution(game, badQueue);
  assert.strictEqual(res.success, false);
  assert.strictEqual(res.executedMove, null);
  assert.strictEqual(res.remainingQueue.length, 0);
});
