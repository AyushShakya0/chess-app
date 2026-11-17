import { Chess, type Square } from "chess.js";

export interface QueenMoveResult {
  captured?: { type: string; color: string };
  revealed: boolean;
}

/**
 * Validates whether a disguised pawn can move along an unobstructed queen line
 * from `from` to `to`, without capturing own pieces, capturing the king, or leaving own king in check.
 */
export function isValidQueenMove(game: Chess, from: Square, to: Square, playerColor: "w" | "b"): boolean {
  if (from === to) return false;

  const fromFile = from.charCodeAt(0) - 97; // 0..7
  const fromRank = parseInt(from[1], 10) - 1; // 0..7
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
    if (game.get(sqName)) {
      return false; // Path blocked
    }
    currX += stepX;
    currY += stepY;
  }

  const targetPiece = game.get(to);
  if (targetPiece) {
    if (targetPiece.color === playerColor) return false;
    if (targetPiece.type === "k") return false; // Cannot capture king directly
  }

  // Reject self-check: player cannot make a move that leaves their own king in check
  if (wouldLeaveKingInCheck(game, from, to, playerColor)) {
    return false;
  }

  return true;
}

/**
 * Checks if executing the queen move on a copy of the board leaves `color`'s king in check.
 */
export function wouldLeaveKingInCheck(game: Chess, from: Square, to: Square, color: "w" | "b"): boolean {
  try {
    const clone = new Chess(game.fen());
    const movingPiece = clone.remove(from);
    clone.remove(to);

    const isBackRank = (color === "w" && to[1] === "8") || (color === "b" && to[1] === "1");
    clone.put(isBackRank ? { type: "q", color } : (movingPiece || { type: "p", color }), to);

    const fenParts = clone.fen().split(" ");
    fenParts[1] = color; // test if active color's king is attacked
    fenParts[3] = "-";

    clone.load(fenParts.join(" "));
    return clone.inCheck();
  } catch {
    return true; // Any FEN corruption triggers rejection
  }
}

/**
 * Executes a disguised queen move on the live game instance.
 * Automatically promotes to a real Queen if reaching the back rank (ranks 1 or 8),
 * preventing chess.js FEN validation crashes.
 */
export function executeQueenMove(
  game: Chess,
  from: Square,
  to: Square,
  color: "w" | "b"
): QueenMoveResult {
  const movingPiece = game.remove(from);
  const targetPiece = game.get(to);
  let captured: { type: string; color: string } | undefined = undefined;

  if (targetPiece) {
    captured = { type: targetPiece.type, color: targetPiece.color };
    game.remove(to);
  }

  // When reaching the back rank (rank 8 for white, rank 1 for black),
  // automatically reveal and promote to Queen to avoid chess.js "pawns on edge rows" error.
  const isBackRank = (color === "w" && to[1] === "8") || (color === "b" && to[1] === "1");
  const pieceToPut = isBackRank
    ? { type: "q" as const, color }
    : (movingPiece || { type: "p" as const, color });

  game.put(pieceToPut, to);

  const fenParts = game.fen().split(" ");
  fenParts[1] = color === "w" ? "b" : "w"; // flip turn
  fenParts[3] = "-"; // clear en-passant
  fenParts[4] = String(Number(fenParts[4]) + 1);
  if (color === "b") {
    fenParts[5] = String(Number(fenParts[5]) + 1);
  }

  game.load(fenParts.join(" "));
  return { captured, revealed: isBackRank };
}

/**
 * Determines if a standard chess move captured a secret queen via normal capture or en-passant.
 */
export function checkSecretQueenCaptured(
  move: { from: Square; to: Square; flags?: string },
  secretSquare: Square | null,
  capturedColor: "w" | "b"
): boolean {
  if (!secretSquare) return false;

  // Direct capture on destination square
  if (move.to === secretSquare) return true;

  // En-passant capture: target pawn is on the same file as `to`, but rank of `from`
  if (move.flags && move.flags.includes("e")) {
    const epSquare = `${move.to[0]}${move.from[1]}` as Square;
    if (epSquare === secretSquare) {
      return true;
    }
  }

  return false;
}
