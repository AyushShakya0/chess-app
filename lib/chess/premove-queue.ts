import { Chess, type Square } from "chess.js";

export interface QueuedPremove {
  from: Square;
  to: Square;
  promotion?: string;
}

export const MAX_PREMOVE_QUEUE_SIZE = 3;

/**
 * Appends a premove to the queue up to maximum queue capacity.
 */
export function enqueuePremove(
  queue: QueuedPremove[],
  newMove: QueuedPremove,
  maxSize = MAX_PREMOVE_QUEUE_SIZE
): QueuedPremove[] {
  if (queue.length >= maxSize) {
    return queue;
  }
  return [...queue, newMove];
}

/**
 * Removes all queued premoves.
 */
export function clearPremoveQueue(): QueuedPremove[] {
  return [];
}

/**
 * Flips the active turn in a FEN string ('w' <-> 'b').
 */
export function flipFenTurn(fen: string): string {
  const parts = fen.split(" ");
  if (parts.length >= 2) {
    parts[1] = parts[1] === "w" ? "b" : "w";
    // Clear en-passant square when forcefully flipping turn for virtual simulation
    parts[3] = "-";
    return parts.join(" ");
  }
  return fen;
}

/**
 * Simulates a virtual board incorporating already-queued premoves
 * to allow accurate legal-move dot calculations while it's the opponent's turn.
 */
export function buildVirtualPremoveBoard(
  realFen: string,
  queue: QueuedPremove[],
  playerColor: "w" | "b"
): Chess {
  try {
    let currentFen = realFen;
    const realGame = new Chess(realFen);

    // If it's opponent's turn, flip turn to playerColor so we can check player's moves
    if (realGame.turn() !== playerColor) {
      currentFen = flipFenTurn(realFen);
    }

    const simGame = new Chess(currentFen);

    // Apply already-queued premoves onto the simulation board
    for (const move of queue) {
      try {
        simGame.move({
          from: move.from,
          to: move.to,
          promotion: (move.promotion as any) || "q",
        });
        // Flip turn back to playerColor if needed for subsequent premove steps
        if (simGame.turn() !== playerColor) {
          const flipped = flipFenTurn(simGame.fen());
          simGame.load(flipped);
        }
      } catch {
        // If simulation step fails, stop simulation chain
        break;
      }
    }

    return simGame;
  } catch {
    return new Chess(realFen);
  }
}

/**
 * Calculates legal destination squares on the virtual board for a piece during premove.
 */
export function getPremoveLegalMoves(
  realFen: string,
  queue: QueuedPremove[],
  square: Square,
  playerColor: "w" | "b"
): Square[] {
  const virtual = buildVirtualPremoveBoard(realFen, queue, playerColor);
  try {
    const piece = virtual.get(square);
    if (!piece || piece.color !== playerColor) {
      return [];
    }
    const moves = virtual.moves({ square, verbose: true });
    return moves.map((m) => m.to as Square);
  } catch {
    return [];
  }
}

/**
 * Executes the head of the premove queue on the real game board once it becomes the player's turn.
 */
export function processPremoveExecution(
  realGame: Chess,
  queue: QueuedPremove[]
): {
  executedMove: QueuedPremove | null;
  remainingQueue: QueuedPremove[];
  success: boolean;
} {
  if (queue.length === 0) {
    return { executedMove: null, remainingQueue: [], success: false };
  }

  const [head, ...rest] = queue;

  try {
    const moveRes = realGame.move({
      from: head.from,
      to: head.to,
      promotion: (head.promotion as any) || "q",
    });

    if (moveRes) {
      return {
        executedMove: head,
        remainingQueue: rest,
        success: true,
      };
    }
  } catch {
    // Move was illegal in actual board state
  }

  // Premove failed: clear entire queue to prevent broken lines
  return {
    executedMove: null,
    remainingQueue: [],
    success: false,
  };
}
