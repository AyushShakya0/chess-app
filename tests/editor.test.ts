import test from "node:test";
import assert from "node:assert";
import { Chess } from "chess.js";

// Validation helper mirroring board-editor.tsx logic
function validateBoardPositions(boardState: Record<string, { type: string; color: string } | null>, fen: string) {
  let whiteKings = 0;
  let blackKings = 0;
  let invalidPawns = false;

  for (const [sq, p] of Object.entries(boardState)) {
    if (!p) continue;
    if (p.type === "k") {
      if (p.color === "w") whiteKings++;
      else blackKings++;
    }
    if (p.type === "p") {
      const rank = sq[1];
      if (rank === "1" || rank === "8") {
        invalidPawns = true;
      }
    }
  }

  if (whiteKings === 0) return { valid: false, error: "Missing White King (White must have exactly 1 King)." };
  if (whiteKings > 1) return { valid: false, error: "Too many White Kings (Must have exactly 1 King)." };
  if (blackKings === 0) return { valid: false, error: "Missing Black King (Black must have exactly 1 King)." };
  if (blackKings > 1) return { valid: false, error: "Too many Black Kings (Must have exactly 1 King)." };
  if (invalidPawns) return { valid: false, error: "Pawns cannot be placed on rank 1 or rank 8." };

  try {
    new Chess(fen);
    return { valid: true, error: null };
  } catch (e: any) {
    return { valid: false, error: e.message || "Invalid position arrangement." };
  }
}

test("Board Editor - detects missing white king", () => {
  const board: Record<string, any> = {
    e8: { type: "k", color: "b" },
  };
  const res = validateBoardPositions(board, "4k3/8/8/8/8/8/8/8 w - - 0 1");
  assert.strictEqual(res.valid, false);
  assert.match(res.error!, /Missing White King/);
});

test("Board Editor - detects missing black king", () => {
  const board: Record<string, any> = {
    e1: { type: "k", color: "w" },
  };
  const res = validateBoardPositions(board, "8/8/8/8/8/8/8/4K3 w - - 0 1");
  assert.strictEqual(res.valid, false);
  assert.match(res.error!, /Missing Black King/);
});

test("Board Editor - rejects pawns on 1st or 8th rank", () => {
  const board: Record<string, any> = {
    e1: { type: "k", color: "w" },
    e8: { type: "k", color: "b" },
    a1: { type: "p", color: "w" },
  };
  const res = validateBoardPositions(board, "4k3/8/8/8/8/8/8/P3K3 w - - 0 1");
  assert.strictEqual(res.valid, false);
  assert.match(res.error!, /Pawns cannot be placed on rank 1 or rank 8/);
});

test("Board Editor - accepts legal custom endgame position", () => {
  // Lucena Position: 1k6/1P6/1K6/8/8/8/8/5R2 w - - 0 1 (White rook on f1, King on b6, pawn on b7, black king on b8)
  const board: Record<string, any> = {
    b8: { type: "k", color: "b" },
    b7: { type: "p", color: "w" },
    b6: { type: "k", color: "w" },
    f1: { type: "r", color: "w" },
  };
  const fen = "1k6/1P6/1K6/8/8/8/8/5R2 w - - 0 1";
  const res = validateBoardPositions(board, fen);
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.error, null);
});
