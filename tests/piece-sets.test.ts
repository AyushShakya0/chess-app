import test from "node:test";
import assert from "node:assert/strict";
import {
  getPieceSetMetadata,
  SUPPORTED_PIECE_SETS,
  type PieceSetId,
} from "../components/chess/piece-sets.ts";

test("Piece Sets Engine - provides all 5 distinct design styles", () => {
  const styles: PieceSetId[] = ["classic", "gold", "wood", "modern", "pixel"];
  for (const s of styles) {
    const meta = getPieceSetMetadata(s);
    assert.ok(meta, `Piece set ${s} must have metadata`);
    assert.ok(meta.name.length > 0, `Piece set ${s} must have a name`);
    assert.ok(meta.desc.length > 0, `Piece set ${s} must have a description`);
  }
});

test("Piece Sets Engine - lists all supported sets in correct order", () => {
  assert.equal(SUPPORTED_PIECE_SETS.length, 5);
  assert.equal(SUPPORTED_PIECE_SETS[0].id, "classic"); // Default is always Staunton classic
  assert.equal(SUPPORTED_PIECE_SETS[1].id, "gold");
});
