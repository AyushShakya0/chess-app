import test from "node:test";
import assert from "node:assert";
import { Chess, type Square } from "chess.js";

function isValidQueenMove(game: Chess, from: Square, to: Square, playerColor: "w" | "b"): boolean {
  if (from === to) return false;

  const fromFile = from.charCodeAt(0) - 97;
  const fromRank = parseInt(from[1], 10) - 1;
  const toFile = to.charCodeAt(0) - 97;
  const toRank = parseInt(to[1], 10) - 1;

  const dx = toFile - fromFile;
  const dy = toRank - fromRank;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  const isOrthogonal = (absDx === 0 && absDy > 0) || (absDx > 0 && absDy === 0);
  const isDiagonal = absDx === absDy && absDx > 0;

  if (!isOrthogonal && !isDiagonal) return false;

  const stepX = dx === 0 ? 0 : dx > 0 ? 1 : -1;
  const stepY = dy === 0 ? 0 : dy > 0 ? 1 : -1;

  let currX = fromFile + stepX;
  let currY = fromRank + stepY;

  while (currX !== toFile || currY !== toRank) {
    const sqName = `${String.fromCharCode(97 + currX)}${currY + 1}` as Square;
    if (game.get(sqName)) return false;
    currX += stepX;
    currY += stepY;
  }

  const targetPiece = game.get(to);
  if (targetPiece) {
    if (targetPiece.color === playerColor) return false;
    if (targetPiece.type === "k") return false;
  }

  return true;
}

function executeQueenMove(
  game: Chess,
  from: Square,
  to: Square,
  color: "w" | "b"
): { captured?: { type: string; color: string } } {
  const movingPiece = game.remove(from);
  const targetPiece = game.get(to);
  let captured: { type: string; color: string } | undefined = undefined;

  if (targetPiece) {
    captured = { type: targetPiece.type, color: targetPiece.color };
    game.remove(to);
  }

  game.put(movingPiece || { type: "p", color }, to);

  const fenParts = game.fen().split(" ");
  fenParts[1] = color === "w" ? "b" : "w";
  fenParts[3] = "-";
  fenParts[4] = String(Number(fenParts[4]) + 1);
  if (color === "b") {
    fenParts[5] = String(Number(fenParts[5]) + 1);
  }

  game.load(fenParts.join(" "));
  return { captured };
}

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

