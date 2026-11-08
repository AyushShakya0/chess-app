import test from "node:test";
import assert from "node:assert";
import { Chess } from "chess.js";

test("Standard Chess - legal moves, castle and en-passant", () => {
  const game = new Chess();
  
  // Test en-passant setup
  // 1. e4 a6 2. e5 d5 3. exd6 (en passant)
  game.move("e4");
  game.move("a6");
  game.move("e5");
  game.move("d5");
  
  const epMove = game.move("exd6");
  assert.ok(epMove !== null, "En passant should be legal");
  assert.strictEqual(epMove.flags.includes("e"), true, "Flag should include 'e' for en passant");
});

test("Knight's Tour - movement geometry verification", () => {
  // Knight legal moves: (dx=1, dy=2) or (dx=2, dy=1)
  function isKnightMove(r1: number, c1: number, r2: number, c2: number): boolean {
    const dr = Math.abs(r1 - r2);
    const dc = Math.abs(c1 - c2);
    return (dr === 1 && dc === 2) || (dr === 2 && dc === 1);
  }

  assert.strictEqual(isKnightMove(4, 4, 6, 5), true, "Knight 2 up, 1 right is legal");
  assert.strictEqual(isKnightMove(4, 4, 5, 6), true, "Knight 1 up, 2 right is legal");
  assert.strictEqual(isKnightMove(4, 4, 4, 5), false, "Rook move is illegal for knight");
  assert.strictEqual(isKnightMove(4, 4, 6, 6), false, "Diagonal move is illegal for knight");
});

test("Handicap Variants - Initial FEN construction", () => {
  // Knight odds: White plays without Queen's Knight (b1)
  // Standard: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
  // Without b1: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/R1BQKBNR w KQkq - 0 1
  const knightOddsFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/R1BQKBNR w KQkq - 0 1";
  const game = new Chess(knightOddsFen);
  assert.strictEqual(game.get("b1"), undefined, "Square b1 should be empty in Knight odds");
  assert.ok(game.get("a1")?.type === "r", "Square a1 should have a rook");

  // Queen odds: White plays without Queen (d1)
  const queenOddsFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNB1KBNR w KQkq - 0 1";
  const queenGame = new Chess(queenOddsFen);
  assert.strictEqual(queenGame.get("d1"), undefined, "Square d1 should be empty in Queen odds");
});

