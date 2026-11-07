import { Chess, Square, Move } from "chess.js";

// Piece values in centipawns
const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Simplified PeSTO-style Piece-Square Tables (Middle-game)
const PAWN_TABLE = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
   5,  5, 10, 25, 25, 10,  5,  5,
   0,  0,  0, 20, 20,  0,  0,  0,
   5, -5,-10,  0,  0,-10, -5,  5,
   5, 10, 10,-20,-20, 10, 10,  5,
   0,  0,  0,  0,  0,  0,  0,  0
];

const KNIGHT_TABLE = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50,
];

const BISHOP_TABLE = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20,
];

const ROOK_TABLE = [
    0,  0,  0,  0,  0,  0,  0,  0,
    5, 10, 10, 10, 10, 10, 10,  5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
    0,  0,  0,  5,  5,  0,  0,  0
];

export type MoveGrade =
  | "brilliant"
  | "great"
  | "best"
  | "excellent"
  | "good"
  | "book"
  | "inaccuracy"
  | "mistake"
  | "blunder"
  | "missed_win";

export interface EvaluatedMove {
  ply: number;
  san: string;
  uci: string;
  turn: "w" | "b";
  evalBefore: number; // in centipawns
  evalAfter: number;
  evalDelta: number;
  grade: MoveGrade;
  bestAlternative?: string;
  comment?: string;
}

export class ChessEvaluator {
  // Evaluates static board position from White's perspective (positive = White leads)
  public static evaluatePosition(game: Chess): number {
    if (game.isCheckmate()) {
      return game.turn() === "w" ? -10000 : 10000;
    }
    if (game.isDraw()) {
      return 0;
    }

    let score = 0;
    const board = game.board();

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (!piece) continue;

        const val = PIECE_VALUES[piece.type] || 0;
        const squareIdx = r * 8 + c;
        const flippedIdx = (7 - r) * 8 + c;

        let positional = 0;
        if (piece.type === "p") {
          positional = piece.color === "w" ? PAWN_TABLE[squareIdx] : PAWN_TABLE[flippedIdx];
        } else if (piece.type === "n") {
          positional = piece.color === "w" ? KNIGHT_TABLE[squareIdx] : KNIGHT_TABLE[flippedIdx];
        } else if (piece.type === "b") {
          positional = piece.color === "w" ? BISHOP_TABLE[squareIdx] : BISHOP_TABLE[flippedIdx];
        } else if (piece.type === "r") {
          positional = piece.color === "w" ? ROOK_TABLE[squareIdx] : ROOK_TABLE[flippedIdx];
        }

        const total = val + positional;
        score += piece.color === "w" ? total : -total;
      }
    }

    return score;
  }

  // Minimax search with alpha-beta pruning (depth 2 for instant sub-millisecond client eval)
  public static getBestMoveAndEval(
    game: Chess,
    depth = 2
  ): { bestMove: Move | null; score: number } {
    const isMaximizing = game.turn() === "w";
    const moves = game.moves({ verbose: true }) as Move[];

    if (moves.length === 0) {
      return { bestMove: null, score: this.evaluatePosition(game) };
    }

    let bestMove: Move = moves[0];
    let bestScore = isMaximizing ? -Infinity : Infinity;

    for (const m of moves) {
      game.move(m);
      const score = this.minimax(game, depth - 1, -Infinity, Infinity, !isMaximizing);
      game.undo();

      if (isMaximizing) {
        if (score > bestScore) {
          bestScore = score;
          bestMove = m;
        }
      } else {
        if (score < bestScore) {
          bestScore = score;
          bestMove = m;
        }
      }
    }

    return { bestMove, score: bestScore };
  }

  private static minimax(
    game: Chess,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean
  ): number {
    if (depth === 0 || game.isGameOver()) {
      return this.evaluatePosition(game);
    }

    const moves = game.moves({ verbose: true }) as Move[];

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const m of moves) {
        game.move(m);
        const evaluation = this.minimax(game, depth - 1, alpha, beta, false);
        game.undo();
        maxEval = Math.max(maxEval, evaluation);
        alpha = Math.max(alpha, evaluation);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const m of moves) {
        game.move(m);
        const evaluation = this.minimax(game, depth - 1, alpha, beta, true);
        game.undo();
        minEval = Math.min(minEval, evaluation);
        beta = Math.min(beta, evaluation);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }

  // Full Post-Game Analysis: grades every move and calculates CAPS accuracy percentage
  public static analyzeFullGame(history: string[]): {
    evaluatedMoves: EvaluatedMove[];
    whiteAccuracy: number;
    blackAccuracy: number;
    whiteStats: Record<MoveGrade, number>;
    blackStats: Record<MoveGrade, number>;
  } {
    const replayGame = new Chess();
    const evaluatedMoves: EvaluatedMove[] = [];

    const emptyStats = (): Record<MoveGrade, number> => ({
      brilliant: 0,
      great: 0,
      best: 0,
      excellent: 0,
      good: 0,
      book: 0,
      inaccuracy: 0,
      mistake: 0,
      blunder: 0,
      missed_win: 0,
    });

    const whiteStats = emptyStats();
    const blackStats = emptyStats();

    let whiteWinLossAccSum = 0;
    let whiteCount = 0;
    let blackWinLossAccSum = 0;
    let blackCount = 0;

    for (let i = 0; i < history.length; i++) {
      const san = history[i];
      const turn = replayGame.turn();
      const evalBefore = this.evaluatePosition(replayGame);

      // Theoretical opening book for first 4 plies
      const isBook = i < 4;

      const moveObj = replayGame.move(san);
      if (!moveObj) continue;

      const evalAfter = this.evaluatePosition(replayGame);
      // Delta from player perspective (positive means player improved their score)
      const delta = turn === "w" ? evalAfter - evalBefore : evalBefore - evalAfter;

      let grade: MoveGrade = "good";

      if (isBook) {
        grade = "book";
      } else if (moveObj.captured && delta >= 120 && Math.abs(evalAfter) > 200) {
        grade = "brilliant";
      } else if (delta >= 0) {
        grade = delta > 60 ? "great" : "best";
      } else if (delta >= -30) {
        grade = "excellent";
      } else if (delta >= -80) {
        grade = "good";
      } else if (delta >= -150) {
        grade = "inaccuracy";
      } else if (delta >= -300) {
        grade = "mistake";
      } else {
        // Severe drop
        const wasWinning = turn === "w" ? evalBefore > 250 : evalBefore < -250;
        grade = wasWinning ? "missed_win" : "blunder";
      }

      if (turn === "w") {
        whiteStats[grade]++;
        const winProbBefore = 1 / (1 + Math.pow(10, -evalBefore / 400));
        const winProbAfter = 1 / (1 + Math.pow(10, -evalAfter / 400));
        const acc = Math.max(0, 100 - Math.max(0, winProbBefore - winProbAfter) * 100);
        whiteWinLossAccSum += acc;
        whiteCount++;
      } else {
        blackStats[grade]++;
        const winProbBefore = 1 / (1 + Math.pow(10, evalBefore / 400));
        const winProbAfter = 1 / (1 + Math.pow(10, evalAfter / 400));
        const acc = Math.max(0, 100 - Math.max(0, winProbBefore - winProbAfter) * 100);
        blackWinLossAccSum += acc;
        blackCount++;
      }

      evaluatedMoves.push({
        ply: i + 1,
        san,
        uci: `${moveObj.from}${moveObj.to}`,
        turn,
        evalBefore,
        evalAfter,
        evalDelta: delta,
        grade,
      });
    }

    const whiteAccuracy = whiteCount > 0 ? Math.round(whiteWinLossAccSum / whiteCount) : 100;
    const blackAccuracy = blackCount > 0 ? Math.round(blackWinLossAccSum / blackCount) : 100;

    return {
      evaluatedMoves,
      whiteAccuracy,
      blackAccuracy,
      whiteStats,
      blackStats,
    };
  }
}
