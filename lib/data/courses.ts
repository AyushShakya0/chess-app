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
  category: "Tactics" | "Checkmates" | "Endgames" | "Strategy" | "Middlegame" | "Masterpieces";
  level: "Beginner" | "Intermediate" | "Advanced" | "Grandmaster";
  icon: string;
  description: string;
  lessons: CourseLesson[];
}

export const CHESS_COURSES: ChessCourse[] = [
  // 1. Tactical Weaponry
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

  // 2. Essential Checkmates
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

  // 3. Middlegame Attacking Formations
  {
    id: "mg-attacking",
    title: "Middlegame Attacking Formations",
    subtitle: "King Hunts, Central Breaks & Piece Sacrifices",
    category: "Middlegame",
    level: "Intermediate",
    icon: "⚡",
    description: "Master the aggressive middlegame structures used by grandmasters to tear open the enemy king's fortifications.",
    lessons: [
      {
        id: "mga-1",
        title: "The Classical Greek Gift Breakthrough",
        fen: "r1bq1rk1/pppn1ppp/4pn2/3p4/1bPP4/2NBPN2/PP3PPP/R1BQK2R w KQ - 0 8",
        playerSide: "white",
        instruction: "White has ideal development and pieces eyeing h7. Launch the immortal bishop sacrifice on h7!",
        moves: [
          { san: "Bxh7+", explanation: "White sacrifices the light-squared bishop on h7, tearing open the Black king's castled shelter." },
          { san: "Kxh7", explanation: "Black is compelled to recapture the bishop on h7." },
          { san: "Ng5+", explanation: "The knight springs in with check, taking away f7 and coordinating with the Queen." },
          { san: "Kg8", explanation: "Black king retreats to safety." },
          { san: "Qh5", explanation: "White Queen penetrates to h5, setting up unstoppable mating threats on h7!" }
        ],
        keyTakeaway: "The Greek Gift sacrifice on h7 destroys the castled king's pawn shelter and enables an unstoppable queen-knight battery."
      },
      {
        id: "mga-2",
        title: "Central Break & Long Diagonal Clearance",
        fen: "r1bq1rk1/pp3ppp/2n1pn2/2pp4/3P4/2PBPN2/PP1N1PPP/R2Q1RK1 w - - 0 9",
        playerSide: "white",
        instruction: "Strike in the center with e4 to liberate your pieces and blow open the central diagonals!",
        moves: [
          { san: "e4", explanation: "White launches the thematic e4 central pawn break, fighting for space and opening the diagonal for pieces." },
          { san: "dxe4", explanation: "Black captures the central pawn." },
          { san: "Nxe4", explanation: "White recaptures with the knight, establishing active central coordination and targeting f6." }
        ],
        keyTakeaway: "Central pawn breaks in the middlegame vacate key squares and diagonals for major piece infiltration."
      },
      {
        id: "mga-3",
        title: "Opposite-Side Castling Central Explosion",
        fen: "r1bq1rk1/pp2ppbp/2np1np1/8/3NP3/2N1BP2/PPP3PP/2KR1B1R b - - 0 9",
        playerSide: "black",
        instruction: "White has castled queenside to launch a flank storm. Counter immediately with Black's thematic central break!",
        moves: [
          { san: "d5", explanation: "The decisive ...d5 counter-blow in the center! In opposite castling games, strike the center immediately." },
          { san: "exd5", explanation: "White captures the advancing pawn." },
          { san: "Nxd5", explanation: "Black recaptures with the knight, activating the dark-squared dragon bishop across the entire board." }
        ],
        keyTakeaway: "When both sides castle on opposite wings, striking the center with pawn breaks blunts the enemy's flank assault."
      },
      {
        id: "mga-4",
        title: "Morphy's Long Diagonal Deflection Mate",
        fen: "4kb1r/p2n1ppp/4q3/4p1B1/4P3/1Q6/PPP2PPP/2KR4 w k - 1 18",
        playerSide: "white",
        instruction: "Deflect Black's defensive knight with a brilliant queen sacrifice to deliver mate on d8!",
        moves: [
          { san: "Qb8+", explanation: "Morphy offers his Queen on b8! An astounding tactical deflection." },
          { san: "Nxb8", explanation: "Black must accept the sacrifice with the knight." },
          { san: "Rd8#", explanation: "Rook delivers checkmate on d8 supported by the bishop! Pure romantic genius." }
        ],
        keyTakeaway: "Deflection removes a key defender from guarding a vital square, allowing an unstoppable mating finish."
      }
    ]
  },

  // 4. Middlegame Strategy & Pawn Structures
  {
    id: "mg-strategy",
    title: "Middlegame Strategy & Structures",
    subtitle: "Pawn Breaks, Outposts & Weak Square Exploitation",
    category: "Middlegame",
    level: "Advanced",
    icon: "🛡️",
    description: "Learn how grandmasters navigate complex pawn skeletons, create permanent outposts, and punish positional blunders.",
    lessons: [
      {
        id: "mgs-1",
        title: "The Outpost Knight Liquidation",
        fen: "r2q1rk1/1p1b1ppp/p1np1b2/4p3/3NP3/2N1B3/PPPQ1PPP/2KR3R w - - 0 13",
        playerSide: "white",
        instruction: "White has an outpost on d4. Liquidate Black's defender to win the backward d6 pawn!",
        moves: [
          { san: "Nxc6", explanation: "White trades off the defender on c6 to expose Black's weak backward pawn." },
          { san: "bxc6", explanation: "Black recaptures toward the center." },
          { san: "Qxd6", explanation: "White's Queen centralizes on d6, winning the backward pawn with overwhelming piece activity." }
        ],
        keyTakeaway: "A backward pawn on an semi-open file is a permanent structural weakness. Eliminate its defenders and harvest it."
      },
      {
        id: "mgs-2",
        title: "Gaining Tempi Against Overextended Pieces",
        fen: "r1b2rk1/pp1p1ppp/2n1p3/q7/3NP3/P1P5/2PQ1PPP/R3KB1R w KQ - 1 11",
        playerSide: "white",
        instruction: "Kick Black's adventurous queen with tempo and solidify your piece harmony.",
        moves: [
          { san: "Nb3", explanation: "White attacks the exposed Black Queen while retreating the knight to a solid outpost." },
          { san: "Qe5", explanation: "Black must lose another move repositioning the Queen." },
          { san: "Bd3", explanation: "White develops the bishop with harmony, defending the center and preparing kingside castling." }
        ],
        keyTakeaway: "Always seek development moves that make immediate threats against the opponent's exposed pieces."
      },
      {
        id: "mgs-3",
        title: "Dominating the Open E-File",
        fen: "r4rk1/1pp2ppp/p7/4N3/3Pn3/8/PP3PPP/R2Q1RK1 w - - 0 16",
        playerSide: "white",
        instruction: "Seize the open e-file with your rook, then double attack Black's queenside weaknesses with your Queen.",
        moves: [
          { san: "Re1", explanation: "White seizes control of the open e-file with the rook, harassing Black's central knight." },
          { san: "Nf6", explanation: "Black retreats the knight to safety." },
          { san: "Qb3", explanation: "White's Queen invades to b3, forking Black's b7 pawn and putting pressure on f7!" }
        ],
        keyTakeaway: "Rooks belong on open files: from there they control transition squares and facilitate double attacks."
      },
      {
        id: "mgs-4",
        title: "The Central Fork Trick Transition",
        fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 4 4",
        playerSide: "white",
        instruction: "Liquidate on e5 with the knight, then push d4 to fork Black's minor pieces in the center!",
        moves: [
          { san: "Nxe5", explanation: "White strikes on e5 with the knight, temporarily offering material." },
          { san: "Nxe5", explanation: "Black captures the knight on e5." },
          { san: "d4", explanation: "Pawn forks Black's bishop and knight in the center! White regains the piece with central dominance." }
        ],
        keyTakeaway: "The central fork trick temporarily sacrifices a knight on e5 to win central control and reclaim the piece with d4."
      }
    ]
  },

  // 5. Endgame Tactical Precision
  {
    id: "eg-tactics",
    title: "Endgame Tactical Precision",
    subtitle: "Breakthroughs, Réti Geometry & Zugzwang",
    category: "Endgames",
    level: "Advanced",
    icon: "🎯",
    description: "Master the precise tactical and geometric breakthroughs that decide tournament king and pawn endgames.",
    lessons: [
      {
        id: "egt-1",
        title: "The 3-Pawn Breakthrough Miracle",
        fen: "8/ppp5/8/PPP5/8/8/8/4k2K w - - 0 1",
        playerSide: "white",
        instruction: "White pawns are locked with Black's pawns. Execute the miraculous breakthrough sacrifice!",
        moves: [
          { san: "b6", explanation: "The miraculous breakthrough pawn sacrifice! Disables Black's three symmetrical pawns." },
          { san: "axb6", explanation: "Black captures the b-pawn." },
          { san: "c6", explanation: "Second pawn sacrifice! Deflects Black's b-pawn away from guarding the a6 square." },
          { san: "bxc6", explanation: "Black recaptures on c6." },
          { san: "a6", explanation: "The outside passed pawn marches forward to promotion and cannot be caught!" }
        ],
        keyTakeaway: "In symmetric pawn endgames, sacrifice two pawns to create an unstoppable outside passed runner."
      },
      {
        id: "egt-2",
        title: "Réti's Diagonal King Pursuit (1921)",
        fen: "7K/8/k1P5/7p/8/8/8/8 w - - 0 1",
        playerSide: "white",
        instruction: "White's king seems impossibly far from both pawns. Execute Réti's immortal diagonal king march!",
        moves: [
          { san: "Kg7", explanation: "White launches Réti's immortal diagonal march, stepping towards both the c-pawn and the h-pawn." },
          { san: "h4", explanation: "Black pushes the h-pawn towards promotion." },
          { san: "Kf6", explanation: "The King advances diagonally to f6, keeping dual threats alive." },
          { san: "Kb6", explanation: "Black King attempts to capture the c-pawn." },
          { san: "Ke5", explanation: "King defends the pawn advance while staying within the square of the Black h-pawn!" },
          { san: "Kxc6", explanation: "Black captures the c-pawn." },
          { san: "Kf4", explanation: "White's king reaches the square of the Black h-pawn and captures it next move to draw!" }
        ],
        keyTakeaway: "Réti's geometry teaches that moving diagonally allows a king to execute two divergent missions at once."
      },
      {
        id: "egt-3",
        title: "Mutual Zugzwang & Distant Opposition",
        fen: "8/8/4k3/4p3/4P3/4K3/8/8 w - - 0 1",
        playerSide: "white",
        instruction: "Outflank Black's king using opposition and triangulation to penetrate the pawn chain.",
        moves: [
          { san: "Kd3", explanation: "White steps to d3, taking indirect opposition." },
          { san: "Kd6", explanation: "Black king matches." },
          { san: "Kc4", explanation: "White outflanks to c4, threatening to breach Black's pawn chain via b5 or d5." },
          { san: "Kc6", explanation: "Black king attempts to maintain defense." },
          { san: "Kb4", explanation: "White triangulates on the queenside, preparing to penetrate and win the e5 pawn." }
        ],
        keyTakeaway: "In king and pawn endgames, triangulation and outflanking force the defender into fatal zugzwang."
      },
      {
        id: "egt-4",
        title: "King Opposition & Shepherd Push",
        fen: "8/8/4k3/8/4P3/4K3/8/8 w - - 0 1",
        playerSide: "white",
        instruction: "Seize the direct vertical opposition to shepherd your passed pawn safely to promotion.",
        moves: [
          { san: "Kd4", explanation: "White claims the direct vertical opposition, forcing the Black king to yield ground." },
          { san: "Kd6", explanation: "Black king stands opposite on d6." },
          { san: "e5+", explanation: "White pushes the passed pawn with check, seizing control of the e6 advance square." }
        ],
        keyTakeaway: "Claiming the opposition forces the defending king to surrender key breakthrough squares."
      }
    ]
  },

  // 6. Practical Rook Endgames
  {
    id: "practical-rooks",
    title: "Practical Rook Endgames",
    subtitle: "Philidor Defense, Lucena Bridge & 7th-Rank Dominance",
    category: "Endgames",
    level: "Intermediate",
    icon: "🏰",
    description: "Learn the foundational theoretical rook endgames that turn drawn or equal positions into clinical master victories.",
    lessons: [
      {
        id: "pre-1",
        title: "The Philidor 3rd Rank Drawing Defense",
        fen: "4k3/3R4/4KP2/8/8/8/8/r7 b - - 0 1",
        playerSide: "black",
        instruction: "White has pushed the pawn to the 6th rank. Check White's king relentlessly from behind to draw!",
        moves: [
          { san: "Re1+", explanation: "Black's rook delivers vertical checks from behind, giving the White king no shelter!" },
          { san: "Kf5", explanation: "White king tries to escape towards the pawn." },
          { san: "Rf1+", explanation: "Black checks relentlessly along the open f-file to guarantee a theoretical draw." }
        ],
        keyTakeaway: "Once the opponent's pawn crosses to the 6th rank, drop your rook to the 1st rank to check endlessly from behind."
      },
      {
        id: "pre-2",
        title: "The Lucena Bridge (Building the Shelter)",
        fen: "1K1k4/1P6/8/8/8/8/2r5/7R w - - 0 1",
        playerSide: "white",
        instruction: "White has a pawn on the 7th rank. Cut the enemy king and build the legendary 4th-rank bridge!",
        moves: [
          { san: "Rh4", explanation: "The hallmark 4th-rank rook lift! Prepares to shield the king on d4." },
          { san: "Rc1", explanation: "Black rook maintains vertical harassing checks." },
          { san: "Rd4+", explanation: "White checks Black's king to push it back from the promotion file." },
          { san: "Ke7", explanation: "Black king retreats." },
          { san: "Rd5", explanation: "Bridge completed! The rook stands ready to intercept Black's rook checks." }
        ],
        keyTakeaway: "Building the Lucena bridge on the 4th rank is the single most essential rook endgame technique."
      },
      {
        id: "pre-3",
        title: "The 7th-Rank Rook Invasion",
        fen: "4r1k1/5ppp/8/8/8/8/R4PPP/6K1 w - - 0 1",
        playerSide: "white",
        instruction: "Create luft for your king before invading with your active rook onto the 7th rank.",
        moves: [
          { san: "h3", explanation: "White creates essential 'luft' for the king before executing the invasion." },
          { san: "g6", explanation: "Black also creates luft." },
          { san: "Ra7", explanation: "Rook invades the 7th rank! Paralyzes Black's pawns along the rank." }
        ],
        keyTakeaway: "A rook on the 7th rank ties down defending pieces and harvests enemy pawns at will."
      },
      {
        id: "pre-4",
        title: "Double Rook 7th-Rank Mating Net",
        fen: "5rk1/R7/8/8/8/8/1R5K/8 w - - 0 1",
        playerSide: "white",
        instruction: "Coordinate both rooks on the 7th rank to weave an inescapable mating net around the enemy king.",
        moves: [
          { san: "Rg2+", explanation: "Rook checks Black's king and drives it into the corner pocket on h8." },
          { san: "Kh8", explanation: "King is forced into the corner." },
          { san: "Rgg7", explanation: "Doubled rooks on the 7th rank! Creates an inescapable mating net around the enemy king." }
        ],
        keyTakeaway: "Double rooks on the 7th rank weave an inescapable mating net against the trapped enemy king."
      }
    ]
  },

  // 7. Positional Mastery
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

  // 8. Immortal Masterpieces
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
