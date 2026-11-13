import { Chess, type Square, type Move } from "chess.js";
import { OPENINGS_CATALOG } from "../data/openings.ts";

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

  // Helper to score moves for Alpha-Beta move ordering (MVV-LVA)
  private static scoreMove(m: Move): number {
    let score = 0;
    if (m.captured) {
      const victimVal = PIECE_VALUES[m.captured] || 100;
      const attackerVal = PIECE_VALUES[m.piece] || 100;
      // Most Valuable Victim - Least Valuable Attacker (e.g., PxQ = 1000 + 9000 - 100 = 9900)
      score += 1000 + (victimVal * 10 - attackerVal);
    }
    if (m.promotion) score += 900;
    if (m.san && m.san.includes("+")) score += 500;
    if (["d4", "e4", "d5", "e5"].includes(m.to)) score += 30;
    return score;
  }

  // Orders moves to maximize alpha-beta pruning efficiency
  private static orderMoves(moves: Move[]): Move[] {
    return moves.sort((a, b) => this.scoreMove(b) - this.scoreMove(a));
  }

  // Quiescence search: calculates captures & checks to resolve tactical tension at horizon
  private static quiescence(
    game: Chess,
    alpha: number,
    beta: number,
    isMaximizing: boolean,
    qdepth: number
  ): number {
    const standPat = this.evaluatePosition(game);
    if (qdepth <= 0) return standPat;

    if (isMaximizing) {
      if (standPat >= beta) return beta;
      if (standPat > alpha) alpha = standPat;
    } else {
      if (standPat <= alpha) return alpha;
      if (standPat < beta) beta = standPat;
    }

    // Only search top priority captures and forcing checks (capped to top 5)
    const tacticalMoves = (game.moves({ verbose: true }) as Move[]).filter(
      (m) => m.captured || (m.san && m.san.includes("+"))
    );
    this.orderMoves(tacticalMoves);
    const topTactical = tacticalMoves.slice(0, 5);

    if (isMaximizing) {
      for (const m of topTactical) {
        game.move(m);
        const score = this.quiescence(game, alpha, beta, false, qdepth - 1);
        game.undo();
        if (score >= beta) return beta;
        if (score > alpha) alpha = score;
      }
      return alpha;
    } else {
      for (const m of topTactical) {
        game.move(m);
        const score = this.quiescence(game, alpha, beta, true, qdepth - 1);
        game.undo();
        if (score <= alpha) return alpha;
        if (score < beta) beta = score;
      }
      return beta;
    }
  }

  // Minimax search with move ordering, alpha-beta pruning, and quiescence horizon extension
  public static getBestMoveAndEval(
    game: Chess,
    depth = 2,
    qdepth = 0
  ): { bestMove: Move | null; score: number } {
    const isMaximizing = game.turn() === "w";
    let moves = game.moves({ verbose: true }) as Move[];

    if (moves.length === 0) {
      return { bestMove: null, score: this.evaluatePosition(game) };
    }

    moves = this.orderMoves(moves);

    let bestMove: Move = moves[0];
    let bestScore = isMaximizing ? -Infinity : Infinity;

    for (const m of moves) {
      game.move(m);
      const score = this.minimax(
        game,
        depth - 1,
        -Infinity,
        Infinity,
        !isMaximizing,
        qdepth
      );
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

  // Opening book line lookup for Grandmaster bots
  public static getBookMove(game: Chess): Move | null {
    const history = game.history();
    if (history.length >= 12) return null;

    const matchingNextMoves: string[] = [];
    for (const opening of OPENINGS_CATALOG) {
      for (const variation of opening.variations) {
        if (variation.moves.length <= history.length) continue;
        let isMatch = true;
        for (let i = 0; i < history.length; i++) {
          if (variation.moves[i].san !== history[i]) {
            isMatch = false;
            break;
          }
        }
        if (isMatch) {
          matchingNextMoves.push(variation.moves[history.length].san);
        }
      }
    }

    if (matchingNextMoves.length === 0) return null;

    // Pick one of the authentic theoretical opening book choices
    const chosenSan = matchingNextMoves[Math.floor(Math.random() * matchingNextMoves.length)];
    const legalMoves = game.moves({ verbose: true }) as Move[];
    return legalMoves.find((m) => m.san === chosenSan) || null;
  }

  // Calibrated bot move picker reflecting actual human ELO rating & depth
  public static getBotMoveForElo(
    game: Chess,
    elo: number,
    blunderRate: number,
    botDepth?: number
  ): Move | null {
    const moves = game.moves({ verbose: true }) as Move[];
    if (moves.length === 0) return null;

    // 1. For Grandmaster bots (ELO >= 2000), check opening theory book first
    if (elo >= 2000 && game.history().length < 10) {
      const bookMove = this.getBookMove(game);
      if (bookMove) return bookMove;
    }

    const isMaximizing = game.turn() === "w";

    // 2. Bot intentional blunder check based on blunderRate
    if (Math.random() < blunderRate) {
      if (elo <= 600) {
        // Beginners (400 ELO) pick random moves carelessly
        return moves[Math.floor(Math.random() * moves.length)];
      }

      // Intermediate (1200-1800 ELO) blunder by choosing an inaccurate or trappy move
      const scored = moves.map((m) => {
        game.move(m);
        const s = this.evaluatePosition(game);
        game.undo();
        return { move: m, score: s };
      });
      // Sort ascending if maximizing (weaker first) or descending if minimizing
      scored.sort((a, b) => (isMaximizing ? a.score - b.score : b.score - a.score));
      const idx = Math.floor(Math.random() * Math.min(scored.length, 3));
      return scored[idx]?.move || moves[0];
    }

    // 3. High-rated play: Minimax calculation based on ELO & botDepth
    let depth = botDepth ?? (elo <= 600 ? 1 : elo <= 1400 ? 2 : elo <= 2000 ? 3 : elo <= 2500 ? 5 : 6);

    // Dynamic endgame depth boost when piece count drops
    const board = game.board();
    let pieceCount = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c]) pieceCount++;
      }
    }
    if (pieceCount <= 12 && depth >= 5) {
      depth += 1; // e.g. Magnus reaches depth 7 in endgames
    }

    let baseDepth = depth;
    let qdepth = 0;
    if (depth >= 4) {
      baseDepth = Math.max(2, Math.floor(depth * 0.6));
      qdepth = depth - baseDepth;
    }

    const result = this.getBestMoveAndEval(game, baseDepth, qdepth);
    return result.bestMove || moves[0];
  }

  private static minimax(
    game: Chess,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean,
    qdepth = 0
  ): number {
    if (depth <= 0) {
      return qdepth > 0
        ? this.quiescence(game, alpha, beta, isMaximizing, qdepth)
        : this.evaluatePosition(game);
    }
    if (game.isGameOver()) {
      return this.evaluatePosition(game);
    }

    let moves = game.moves({ verbose: true }) as Move[];
    moves = this.orderMoves(moves);

    // Forward pruning for deeper plies to maintain sub-second GM response times
    if (depth <= 2 && moves.length > 10) {
      const tactical: Move[] = [];
      const quiet: Move[] = [];
      for (const m of moves) {
        if (m.captured || (m.san && m.san.includes("+")) || m.promotion) {
          tactical.push(m);
        } else {
          quiet.push(m);
        }
      }
      moves = [...tactical, ...quiet.slice(0, 5)];
    }

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const m of moves) {
        game.move(m);
        const evaluation = this.minimax(game, depth - 1, alpha, beta, false, qdepth);
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
        const evaluation = this.minimax(game, depth - 1, alpha, beta, true, qdepth);
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

