import { Chess, type Square } from "chess.js";

export interface TacticalPuzzle {
  id: string;
  title: string;
  fen: string;
  moves: string[]; // Solution moves in SAN. Odd plies = player, Even plies = opponent bot counter-replies.
  rating: number;
  theme: string;
  description: string;
}

export const CURATED_PUZZLES: TacticalPuzzle[] = [
  {
    id: "opera-motif",
    title: "Opera Deflection & Mate",
    fen: "4kb1r/p2n1ppp/4q3/4p1B1/4P3/1Q6/PPP2PPP/2KR4 w k - 1 18",
    moves: ["Qb8+", "Nxb8", "Rd8#"],
    rating: 1250,
    theme: "Queen Sacrifice & Back-Rank Mate",
    description: "White deflects the defender knight with a brilliant queen sacrifice to deliver checkmate.",
  },
  {
    id: "deflect-mate-2",
    title: "Back-Rank Infiltration",
    fen: "6k1/1p3ppp/pq2p3/3p4/8/1P4QP/P1r2PP1/5RK1 w - - 0 24",
    moves: ["Qb8+", "Rc8", "Qxc8+", "Qd8", "Qxd8#"],
    rating: 950,
    theme: "Forced Back-Rank Checkmate",
    description: "Penetrate the vulnerable back rank with consecutive checking deflections.",
  },
  {
    id: "greek-gift",
    title: "Greek Gift Follow-Through",
    fen: "r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5N2/PPPP1PPP/RNBQ1RK1 w kq - 0 5",
    moves: ["Bxf7+", "Kxf7", "Nxe5+"],
    rating: 1150,
    theme: "Tactical Greek Gift & King Hunt",
    description: "Sacrifice the bishop on f7 to strip the enemy king of castling rights and fork center pieces.",
  },
  {
    id: "knight-fork-queen",
    title: "Pin Break & Tactical Exchange",
    fen: "r1b1k2r/ppppqppp/2n5/4n3/1bP2B2/4PN2/PP1N1PPP/R2QKB1R w KQkq - 0 8",
    moves: ["Bxe5", "Nxe5", "a3"],
    rating: 1220,
    theme: "Central Exchange & Tempo Relief",
    description: "Eliminate Black's central knight outpost and put the question to the pinned bishop on b4.",
  },
  {
    id: "smothered-outpost",
    title: "Central Outpost Seizure",
    fen: "r2q1rk1/1p1b1ppp/p1np1b2/4p3/3NP3/2N1B3/PPPQ1PPP/2KR3R w - - 0 13",
    moves: ["Nxc6", "bxc6", "Qxd6"],
    rating: 1350,
    theme: "Tactical Liquidation & Pawn Win",
    description: "Shatter Black's pawn structure on the queenside to win the backward d6 pawn.",
  },
  {
    id: "queen-tempo",
    title: "Queen Harassment & Development",
    fen: "r1b2rk1/pp1p1ppp/2n1p3/q7/3NP3/P1P5/2PQ1PPP/R3KB1R w KQ - 1 11",
    moves: ["Nb3", "Qe5", "Bd3"],
    rating: 1180,
    theme: "Knight Outpost & Center Defense",
    description: "Kick Black's queen with tempo and solidify the central e4 pawn with ideal development.",
  },
  {
    id: "anastasia-pressure",
    title: "File Domination & Double Attack",
    fen: "r4rk1/1pp2ppp/p7/4N3/3Pn3/8/PP3PPP/R2Q1RK1 w - - 0 16",
    moves: ["Re1", "Nf6", "Qb3"],
    rating: 1280,
    theme: "Open File & Queenside Double Attack",
    description: "Seize the open e-file with the rook, then double attack b7 and f7 with the queen.",
  },
  {
    id: "back-rank-deflect",
    title: "Luft Creation & Open File",
    fen: "3r2k1/p4ppp/1p6/4q3/8/1Q2P3/PP3PPP/2R3K1 w - - 0 21",
    moves: ["h3", "g6", "Rd1"],
    rating: 1300,
    theme: "Luft & Central File Seizure",
    description: "Create an escape square for your king to prevent back-rank mates, then contest the d-file.",
  },
  {
    id: "black-center-strike",
    title: "Black Central Counter-Strike",
    fen: "r1bq1rk1/pp2ppbp/2np1np1/8/3NP3/2N1BP2/PPP3PP/2KR1B1R b - - 0 9",
    moves: ["d5", "exd5", "Nxd5"],
    rating: 1380,
    theme: "Sicilian Dragon Center Break",
    description: "As Black, detonate White's center with the timely ...d5 pawn break to activate the dark-squared bishop.",
  },
  {
    id: "pure-backrank",
    title: "Pure Back-Rank Checkmate",
    fen: "6k1/5ppp/8/8/8/8/1r3PPP/4R1K1 w - - 0 1",
    moves: ["Re8#"],
    rating: 800,
    theme: "Back-Rank Checkmate",
    description: "Deliver an instantaneous checkmate along the back rank against the trapped king.",
  },
];

// Helper to convert SAN/UCI move into from/to coordinates
export function getMoveCoordsFromSan(fen: string, sanOrUci: string): { from: Square; to: Square } | null {
  try {
    const g = new Chess(fen);
    if (/^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(sanOrUci)) {
      return {
        from: sanOrUci.slice(0, 2) as Square,
        to: sanOrUci.slice(2, 4) as Square,
      };
    }
    const moves = g.moves({ verbose: true });
    const found = moves.find((m) => m.san === sanOrUci);
    if (found) {
      return { from: found.from as Square, to: found.to as Square };
    }
  } catch {}
  return null;
}
