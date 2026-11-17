import test from "node:test";
import assert from "node:assert";
import { Chess } from "chess.js";
import {
  isValidQueenMove,
  executeQueenMove,
  checkSecretQueenCaptured,
  wouldLeaveKingInCheck,
} from "../lib/variants/hidden-queen.ts";

test("Secret Queen - Queen sliding moves for disguised pawn", () => {
  const game = new Chess();

  // White secret queen pawn is at d2
  // Can slide diagonally to a5?
  assert.strictEqual(isValidQueenMove(game, "d2", "a5", "w"), true);

  // Can slide straight to d5 (path d3, d4 are empty)?
  assert.strictEqual(isValidQueenMove(game, "d2", "d5", "w"), true);

  // Cannot jump like a knight to e4
  assert.strictEqual(isValidQueenMove(game, "d2", "e4", "w"), false);

  // Cannot move to d1 occupied by own Queen
  assert.strictEqual(isValidQueenMove(game, "d2", "d1", "w"), false);

  // Execute queen move from d2 to a5
  const res = executeQueenMove(game, "d2", "a5", "w");
  assert.strictEqual(game.turn(), "b", "Turn should flip to Black after custom Queen move");
  assert.strictEqual(game.get("a5")?.type, "p", "Piece must retain pawn visual disguise");
  assert.strictEqual(game.get("d2"), undefined, "Source square must be empty");
  assert.ok(game.moves().length > 0, "Black must be able to make legal moves");
});

test("Secret Queen - Capturing enemy piece as a Queen", () => {
  const game = new Chess();

  // Can d2 capture on d7? Path is d3, d4, d5, d6 empty, d7 has black pawn
  assert.strictEqual(isValidQueenMove(game, "d2", "d7", "w"), true);

  // Cannot capture king on d8 directly
  assert.strictEqual(isValidQueenMove(game, "d2", "d8", "w"), false);

  const res = executeQueenMove(game, "d2", "d7", "w");
  assert.strictEqual(res.captured?.type, "p", "Captured black pawn");
  assert.strictEqual(game.get("d7")?.color, "w");
});

test("Secret Queen - Back-rank promotion prevents FEN corruption", () => {
  // Clear file d so d2 can slide directly to d8 (empty board except kings and pawns)
  const game = new Chess("3k4/8/8/8/8/8/3P4/3K4 w - - 0 1");

  // Move secret pawn d2 to d8
  assert.strictEqual(isValidQueenMove(game, "d2", "d8", "w"), false); // d8 is king
  assert.strictEqual(isValidQueenMove(game, "d2", "a5", "w"), true);

  // Set position where e8 is empty and d7 pawn reaches e8
  const game2 = new Chess("4k3/3P4/8/8/8/8/8/4K3 w - - 0 1");
  // Queen move from d7 to b7 or d8... wait d8 is attacked? Let's check a8
  const game3 = new Chess("7k/P7/8/8/8/8/8/7K w - - 0 1");
  // a7 slides to a8
  assert.strictEqual(isValidQueenMove(game3, "a7", "a8", "w"), true);

  // Execute queen move to back rank (a8)
  const result = executeQueenMove(game3, "a7", "a8", "w");
  assert.strictEqual(result.revealed, true, "Must be revealed on back rank");
  assert.strictEqual(game3.get("a8")?.type, "q", "Must be promoted to Queen on 8th rank to avoid FEN corruption");
  assert.doesNotThrow(() => game3.fen(), "FEN must remain completely valid");
});

test("Secret Queen - Rejects moves that leave own king in check (self-check)", () => {
  // White king on e1, black king on a8, black rook on e8, secret pawn on e2 pinning itself to the king
  const pinnedGame = new Chess("k3r3/8/8/8/8/8/4P3/4K3 w - - 0 1");

  // e2 moving sideways to a2 would expose e1 king to e8 rook check!
  assert.strictEqual(wouldLeaveKingInCheck(pinnedGame, "e2", "a2", "w"), true);
  assert.strictEqual(isValidQueenMove(pinnedGame, "e2", "a2", "w"), false, "Moving pinned secret pawn sideways must be illegal");

  // Moving along the pin (e2 to e4) shields the king, so it is legal!
  assert.strictEqual(wouldLeaveKingInCheck(pinnedGame, "e2", "e4", "w"), false);
  assert.strictEqual(isValidQueenMove(pinnedGame, "e2", "e4", "w"), true, "Moving along the pin line must be legal");
});

test("Secret Queen - Detects en-passant capture of secret pawn", () => {
  const game = new Chess();
  // 1. e4 a6 2. e5 d5
  game.move("e4");
  game.move("a6");
  game.move("e5");
  game.move("d5");

  // Black's secret pawn is at d5
  const blackSecret = "d5";

  // White plays en-passant capture: exd6
  const epMove = game.move("exd6");
  assert.ok(epMove, "exd6 en-passant should execute");
  assert.strictEqual(epMove.flags.includes("e"), true, "Move flags must include 'e' for en-passant");

  const captured = checkSecretQueenCaptured(
    { from: epMove.from, to: epMove.to, flags: epMove.flags },
    blackSecret,
    "b"
  );
  assert.strictEqual(captured, true, "En-passant capture on d6 must detect that secret pawn on d5 was captured");
});
