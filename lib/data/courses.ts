import { Chess, type Square } from "chess.js";

export interface CourseLesson {
  id: string;
  title: string;
  fen: string;
  playerSide: "white" | "black";
  instruction: string;
  moves: { san: string; explanation: string }[];
  keyTakeaway: string;
}

export interface ChessCourse {
  id: string;
  title: string;
  subtitle: string;
  category: "Tactics" | "Checkmates" | "Endgames" | "Strategy" | "Masterpieces";
  level: "Beginner" | "Intermediate" | "Advanced" | "Grandmaster";
  icon: string;
  description: string;
  lessons: CourseLesson[];
}

export const CHESS_COURSES: ChessCourse[] = [
  {
    id: "tactical-weapons",
    title: "Tactical Weaponry",
    subtitle: "Master Forks, Pins, Skewers & Deflection",
    category: "Tactics",
    level: "Beginner",
    icon: "⚔️",
    description: "Learn how to spot and execute forcing tactical motifs that win material on the spot.",
    lessons: [
      {
        id: "tw-1",
        title: "The Royal Knight Fork",
        fen: "r1b1k2r/pp1p1ppp/2n1pn2/q7/2B1P3/2N5/PP1B1PPP/R2QK2R w KQkq - 0 9",
        playerSide: "white",
        instruction: "White has a tactical strike in the center using knight geometry. Find the jump to d5!",
        moves: [
          { san: "Nd5", explanation: "White springs the knight to d5, discovering an attack on the black Queen while threatening Nc7+ fork!" },
          { san: "Qd8", explanation: "Black must retreat the queen to safety." },
          { san: "Nxf6+", explanation: "White liquidates Black's knight with check, shattering Black's kingside pawn structure." },
          { san: "gxf6", explanation: "Black is forced to recapture, leaving doubled isolated f-pawns and an exposed king." }
        ],
        keyTakeaway: "Knights excel at jumping over pieces to hit high-value targets and create irreversible structural damage."
      },
      {
        id: "tw-2",
        title: "The Absolute Pin & Decisive Liquidation",
        fen: "r1bqk2r/ppp2ppp/2n5/3np3/1b6/2NP1N2/PPPBBPPP/R2QK2R w KQkq - 0 8",
        playerSide: "white",
        instruction: "Black pins White's knight to the King. Dissolve Black's central outpost with tactical exchanges.",
        moves: [
          { san: "Nxd5", explanation: "White captures the central knight, putting Black under immediate tactical pressure." },
          { san: "Bxd2+", explanation: "Black checks by trading bishops." },
          { san: "Qxd2", explanation: "White recaptures with the Queen, developing the major piece with harmony." },
          { san: "Qxd5", explanation: "Black recaptures the knight, but White now holds total central and kingside development control." }
        ],
        keyTakeaway: "When facing a pin, look for active counter-captures that relieve tactical tension while keeping piece activity high."
      },
      {
        id: "tw-3",
        title: "The Skewer: Striking Through the King",
        fen: "4k3/8/8/8/8/8/r7/2R1K3 w - - 0 1",
        playerSide: "white",
        instruction: "Use your rook to deliver a back-rank check and skewer the enemy pieces along the 8th rank.",
        moves: [
          { san: "Rc8+", explanation: "Rook checks the black King on the back rank, forcing it to move!" },
          { san: "Kd7", explanation: "The King steps aside to d7." },
          { san: "Rh8", explanation: "White's rook swings to h8, dominating the open board and securing total rook activity." }
        ],
        keyTakeaway: "A skewer attacks a high-value piece in front, forcing it to step aside and exposing targets behind it."
      },
      {
        id: "tw-4",
        title: "The Decoy & Deflection Sacrifice",
        fen: "4kb1r/p2n1ppp/4q3/4p1B1/4P3/1Q6/PPP2PPP/2KR4 w k - 1 18",
        playerSide: "white",
        instruction: "Find the immortal Queen sacrifice that deflects the defender knight and delivers checkmate!",
        moves: [
          { san: "Qb8+", explanation: "Brilliant queen sacrifice! Deflects the defender knight from the 8th rank." },
          { san: "Nxb8", explanation: "Black has only one legal move: must capture with the knight." },
          { san: "Rd8#", explanation: "Checkmate! The rook delivers mate along the back rank with the bishop guarding the diagonal!" }
        ],
        keyTakeaway: "Deflection removes a key defender from guarding a vital square, allowing an unstoppable mating finish."
      }
    ]
  },
  {
    id: "checkmate-patterns",
    title: "Essential Checkmates",
    subtitle: "Iconic King Hunts & Mating Nets",
    category: "Checkmates",
    level: "Intermediate",
    icon: "👑",
    description: "Learn the timeless checkmating patterns every tournament player must recognize in an instant.",
    lessons: [
      {
        id: "cm-1",
        title: "Anastasia's Mate",
        fen: "1r3rk1/1p3ppp/p2p4/3N4/4PP2/4K3/PP4R1/7R w - - 0 26",
        playerSide: "white",
        instruction: "White's knight seals the escape squares e7 and g7. Sac the rook on h7 to open the h-file for mate!",
        moves: [
          { san: "Ne7+", explanation: "White checks with the knight, forcing the black King into the corner pocket on h8." },
          { san: "Kh8", explanation: "King must step into the corner." },
          { san: "Rxh7+", explanation: "Immortal rook sacrifice! Tears open the h-file right in front of the King." },
          { san: "Kxh7", explanation: "King is forced to recapture on h7." },
          { san: "Rh2#", explanation: "Rook swings to h2 with checkmate! The knight on e7 prevents escape to g8 and g6." }
        ],
        keyTakeaway: "Anastasia's mate pairs a knight sealing escape squares with a heavy rook delivering the death blow on the edge file."
      },
      {
        id: "cm-2",
        title: "Smothered Mate (Philidor's Legacy)",
        fen: "r1b2r1k/pp3Npp/2n5/q7/2B5/8/PP3PPP/R2Q1RK1 b - - 0 16",
        playerSide: "black",
        instruction: "White has jumped in with a dangerous knight check. Eliminate the knight to defend your King!",
        moves: [
          { san: "Rxf7", explanation: "Black sacrifices the rook exchange to eliminate White's lethal f7 knight." },
          { san: "Bxf7", explanation: "White recaptures with the bishop, but Black has defused the immediate mating net." }
        ],
        keyTakeaway: "When a knight hops into f7 or e6 threatening smothered mating nets, giving up the rook exchange is often the only defensive salvation."
      },
      {
        id: "cm-3",
        title: "The Classic Greek Gift Sacrifice",
        fen: "r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5N2/PPPP1PPP/RNBQ1RK1 w kq - 0 5",
        playerSide: "white",
        instruction: "Strike at f7 with the bishop sacrifice to strip Black's king of castling rights!",
        moves: [
          { san: "Bxf7+", explanation: "Bishop sacrifices on f7, ripping off Black's protective pawn shield!" },
          { san: "Kxf7", explanation: "Black king is forced to capture and lose castling rights permanently." },
          { san: "Nxe5+", explanation: "White forks the center and begins the king hunt with full piece harmony." }
        ],
        keyTakeaway: "Striking f7 or h7 with a minor piece sacrifice when the opponent king is uncastled opens decisive attacking lanes."
      },
      {
        id: "cm-4",
        title: "Back-Rank Corridor Checkmate",
        fen: "6k1/1p3ppp/pq2p3/3p4/8/1P4QP/P1r2PP1/5RK1 w - - 0 24",
        playerSide: "white",
        instruction: "Black's back rank is completely undefended. Deliver the crushing back-rank infiltration!",
        moves: [
          { san: "Qb8+", explanation: "White's Queen penetrates to b8 with check!" },
          { san: "Rc8", explanation: "Black is forced to block with the rook on c8." },
          { san: "Qxc8+", explanation: "White takes the rook with check!" },
          { san: "Qd8", explanation: "Black desperately blocks with the Queen." },
          { san: "Qxd8#", explanation: "Queen takes Queen with checkmate! Pure back-rank domination." }
        ],
        keyTakeaway: "Always watch for weak back ranks lacking 'luft' (king escape squares) to deliver sudden checkmates."
      }
    ]
  },
  {
    id: "masterclass-endgames",
    title: "Masterclass Endgames",
    subtitle: "Rook & Pawn Endgame Foundations",
    category: "Endgames",
    level: "Advanced",
    icon: "🏰",
    description: "Learn the foundational theoretical endgames that turn drawn or equal positions into clinical victories.",
    lessons: [
      {
        id: "eg-1",
        title: "The Lucena Position (Building the Bridge)",
        fen: "1K1k4/1P6/8/8/8/8/2r5/7R w - - 0 1",
        playerSide: "white",
        instruction: "White has a pawn on the 7th rank. Cut the enemy king and build the legendary 4th-rank bridge!",
        moves: [
          { san: "Rh4", explanation: "The key move! White lifts the rook to the 4th rank, preparing the shielding bridge on d4." },
          { san: "Rc1", explanation: "Black rook continues checking and harassing." },
          { san: "Rd4+", explanation: "White checks the black King to force it away from the promoting file." },
          { san: "Ke7", explanation: "Black King steps away." },
          { san: "Rd5", explanation: "The bridge is built! White's king can now step out and the rook shields all checks." }
        ],
        keyTakeaway: "The Lucena Position is the most important endgame in chess: the 4th-rank rook lift shields the king to force promotion."
      },
      {
        id: "eg-2",
        title: "King Opposition & Key Squares",
        fen: "8/8/4k3/8/4P3/4K3/8/8 w - - 0 1",
        playerSide: "white",
        instruction: "Seize the direct opposition to shepherd your passed pawn safely to promotion.",
        moves: [
          { san: "Kd4", explanation: "White takes the direct opposition! Black King must give way to either side." },
          { san: "Kd6", explanation: "Black attempts to stand firm on d6." },
          { san: "e5+", explanation: "White pushes the passed pawn forward with check and controls the key advance squares." }
        ],
        keyTakeaway: "In king-and-pawn endgames, claiming the opposition forces the defending king to surrender key breakthrough squares."
      },
      {
        id: "eg-3",
        title: "Active Rook vs Passive Rook",
        fen: "4r1k1/5ppp/8/8/8/8/R4PPP/6K1 w - - 0 1",
        playerSide: "white",
        instruction: "Create luft for your king before invading with your active rook.",
        moves: [
          { san: "h3", explanation: "Crucial luft move! Gives the king an escape hatch and neutralizes back-rank threats." },
          { san: "g6", explanation: "Black mirrors the luft strategy." },
          { san: "Ra7", explanation: "White's active rook invades the 7th rank! The most dominant square for a rook in the endgame." }
        ],
        keyTakeaway: "A rook on the 7th rank ties down the opponent's pawns and paralyzes the defending pieces."
      }
    ]
  },
  {
    id: "positional-strategy",
    title: "Positional Mastery",
    subtitle: "Pawn Structures, Outposts & Weak Squares",
    category: "Strategy",
    level: "Intermediate",
    icon: "🧠",
    description: "Understand the deep strategic concepts of master play: outposts, open files, and minority attacks.",
    lessons: [
      {
        id: "ps-1",
        title: "Seizing the Central Outpost",
        fen: "r2q1rk1/1p1b1ppp/p1np1b2/4p3/3NP3/2N1B3/PPPQ1PPP/2KR3R w - - 0 13",
        playerSide: "white",
        instruction: "White has a powerful knight on d4. Liquidate Black's defender to win the backward d6 pawn!",
        moves: [
          { san: "Nxc6", explanation: "White trades off Black's defending knight on c6." },
          { san: "bxc6", explanation: "Black recaptures toward the center, creating doubled isolated pawns." },
          { san: "Qxd6", explanation: "White captures the backward d6 pawn with dominant centralization!" }
        ],
        keyTakeaway: "A backward pawn on an open file is a permanent target. Eliminate its defenders and harvest it."
      },
      {
        id: "ps-2",
        title: "Developing with Tempo",
        fen: "r1b2rk1/pp1p1ppp/2n1p3/q7/3NP3/P1P5/2PQ1PPP/R3KB1R w KQ - 1 11",
        playerSide: "white",
        instruction: "Kick Black's adventurous queen with tempo and solidify your center.",
        moves: [
          { san: "Nb3", explanation: "Knight retreats to b3 with an immediate tempo attack on Black's Queen." },
          { san: "Qe5", explanation: "Black Queen is forced to relocate." },
          { san: "Bd3", explanation: "White develops the bishop smoothly while protecting the e4 pawn center." }
        ],
        keyTakeaway: "Developing pieces while making threats gains tempi, accelerating your harmonious piece coordination."
      },
      {
        id: "ps-3",
        title: "Open File Domination",
        fen: "r4rk1/1pp2ppp/p7/4N3/3Pn3/8/PP3PPP/R2Q1RK1 w - - 0 16",
        playerSide: "white",
        instruction: "Seize the open e-file with your rook, then coordinate a double attack with the Queen.",
        moves: [
          { san: "Re1", explanation: "White takes control of the open e-file with the rook, harassing Black's central knight." },
          { san: "Nf6", explanation: "Knight retreats back to f6." },
          { san: "Qb3", explanation: "White's Queen swings to b3, double-attacking Black's b7 and f7 weaknesses!" }
        ],
        keyTakeaway: "Rooks belong on open files. From an open file, they control transition squares and support queen infiltrations."
      }
    ]
  },
  {
    id: "immortal-masterpieces",
    title: "Immortal Masterpieces",
    subtitle: "Historical Master Game Studies",
    category: "Masterpieces",
    level: "Grandmaster",
    icon: "💎",
    description: "Step into the shoes of Paul Morphy, Adolf Anderssen, and Garry Kasparov to play their greatest moves.",
    lessons: [
      {
        id: "im-1",
        title: "Paul Morphy's Opera Game (1858)",
        fen: "4kb1r/p2n1ppp/4q3/4p1B1/4P3/1Q6/PPP2PPP/2KR4 w k - 1 18",
        playerSide: "white",
        instruction: "Paul Morphy faces the Duke of Brunswick. Play the queen sacrifice that finishes this historic masterpiece!",
        moves: [
          { san: "Qb8+", explanation: "Morphy offers his Queen on b8! An astounding tactical deflection." },
          { san: "Nxb8", explanation: "Black must accept the sacrifice with the knight." },
          { san: "Rd8#", explanation: "Rook delivers checkmate on d8 supported by the bishop! Pure romantic genius." }
        ],
        keyTakeaway: "Rapid piece development and king alignment can justify sacrificing heavy material for forced checkmate."
      },
      {
        id: "im-2",
        title: "Sicilian Dragon: Black's Central Detonation",
        fen: "r1bq1rk1/pp2ppbp/2np1np1/8/3NP3/2N1BP2/PPP3PP/2KR1B1R b - - 0 9",
        playerSide: "black",
        instruction: "In the Yugoslav Attack, Black must counter-strike in the center. Play the thematic pawn break!",
        moves: [
          { san: "d5", explanation: "The thematic ...d5 central explosion! Black detonates the center to activate the Dragon bishop." },
          { san: "exd5", explanation: "White captures the pawn." },
          { san: "Nxd5", explanation: "Black recaptures with the knight, establishing dynamic counter-play across the central lines." }
        ],
        keyTakeaway: "In opposite-side castling races, striking the center with ...d5 halts the opponent's flank pawn storm."
      }
    ]
  }
];
