import test from "node:test";
import assert from "node:assert";
import { Chess } from "chess.js";

test("Chess Game History - preserves full move history across turns", () => {
  const game = new Chess();

  // Play standard moves
  game.move("e4");
  game.move("e5");
  game.move("Nf3");
  game.move("Nc6");

  assert.strictEqual(game.history().length, 4, "Game should have 4 moves in history");
  assert.deepStrictEqual(game.history(), ["e4", "e5", "Nf3", "Nc6"]);

  // Verify that history is preserved without FEN reset
  const pgn = game.pgn();
  assert.ok(pgn.includes("1. e4 e5 2. Nf3 Nc6"), "PGN must include full move notation");

  // Verify threefold repetition detection works when moves are repeated
  game.move("Ng1");
  game.move("Nb8");
  game.move("Nf3");
  game.move("Nc6");
  game.move("Ng1");
  game.move("Nb8");

  assert.strictEqual(game.isThreefoldRepetition(), true, "Threefold repetition must be detected with history preserved");
});

test("Pawn Promotion - under-promotion choices validation", () => {
  // Setup position where White pawn on e7 is about to promote (black king safely tucked on h8)
  const game = new Chess("7k/4P3/8/8/8/8/8/4K3 w - - 0 1");
  
  // Test legal promotion moves generated
  const moves = game.moves({ square: "e7", verbose: true });
  assert.strictEqual(moves.length, 4, "Should have 4 promotion options: q, r, b, n");
  
  const piecePromotions = moves.map((m) => m.promotion).sort();
  assert.deepStrictEqual(piecePromotions, ["b", "n", "q", "r"]);

  // Test under-promoting to Knight
  const executed = game.move({ from: "e7", to: "e8", promotion: "n" });
  assert.ok(executed, "Under-promotion to Knight should succeed");
  assert.strictEqual(game.get("e8")?.type, "n", "Piece on e8 must be a Knight");
  assert.strictEqual(game.get("e8")?.color, "w");
});
