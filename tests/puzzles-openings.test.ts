import test from "node:test";
import assert from "node:assert";
import { Chess } from "chess.js";
import { CURATED_PUZZLES } from "../lib/data/puzzles.ts";
import { OPENINGS_CATALOG } from "../lib/data/openings.ts";

test("Tactical Puzzles - verify all multi-move sequences and checkmate deliveries", () => {
  assert.ok(CURATED_PUZZLES.length >= 8, "Expected at least 8 curated tactical puzzles");

  for (const puzzle of CURATED_PUZZLES) {
    const game = new Chess(puzzle.fen);
    assert.ok(puzzle.moves.length >= 1, `Puzzle ${puzzle.id} must have moves`);

    for (let i = 0; i < puzzle.moves.length; i++) {
      const moveSan = puzzle.moves[i];
      const result = game.move(moveSan);
      assert.ok(result, `Puzzle ${puzzle.id}: move #${i + 1} (${moveSan}) must be legal in position ${game.fen()}`);
    }

    // Verify last move was played successfully
    assert.strictEqual(game.history().length, puzzle.moves.length);
  }
});

test("Opening Academy - verify deep variations into middlegame (20+ plies)", () => {
  assert.ok(OPENINGS_CATALOG.length >= 4, "Expected at least 4 opening families");

  for (const family of OPENINGS_CATALOG) {
    for (const variation of family.variations) {
      assert.ok(
        variation.moves.length >= 20,
        `Variation ${variation.name} must reach middlegame with 20+ plies (got ${variation.moves.length})`
      );

      const game = new Chess();
      for (let i = 0; i < variation.moves.length; i++) {
        const moveObj = variation.moves[i];
        const result = game.move(moveObj.san);
        assert.ok(
          result,
          `Opening ${family.name} - ${variation.name}: move #${i + 1} (${moveObj.san}) must be legal`
        );
        assert.ok(moveObj.concept.length > 5, `Concept for move ${moveObj.san} must be meaningful`);
      }
    }
  }
});
