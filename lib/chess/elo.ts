/**
 * Standard FIDE ELO Calculation Engine
 * Formula: E = 1 / (1 + 10^((R_opp - R_player) / 400))
 * Delta = K * (ActualScore - ExpectedScore)
 */

export interface EloCalculationResult {
  oldPlayerElo: number;
  newPlayerElo: number;
  delta: number;
  expectedScore: number;
  actualScore: number;
}

export function calculateEloChange(
  playerElo: number,
  opponentElo: number,
  score: 1 | 0.5 | 0,
  kFactor: number = 32
): EloCalculationResult {
  // Expected score for player between 0 and 1
  const exponent = (opponentElo - playerElo) / 400;
  const expectedScore = 1 / (1 + Math.pow(10, exponent));

  // Compute raw change
  const rawDelta = kFactor * (score - expectedScore);
  const delta = Math.round(rawDelta);

  // New ELO clamped to min 100
  const newPlayerElo = Math.max(100, playerElo + delta);

  return {
    oldPlayerElo: playerElo,
    newPlayerElo,
    delta,
    expectedScore,
    actualScore: score,
  };
}

export const DEFAULT_STARTING_ELO = 1200;

export interface StoredPlayerStats {
  username: string;
  isGuest: boolean;
  eloBullet: number;
  eloBlitz: number;
  eloRapid: number;
  eloPuzzles: number;
  eloBots: number;
  gamesPlayed: number;
  gamesWon: number;
  gamesDrawn: number;
  gamesLost: number;
  recentGames: {
    id: string;
    opponent: string;
    result: "won" | "lost" | "draw";
    timeControl: string;
    date: string;
    eloChange: string;
  }[];
}

const STORAGE_KEY = "sovereign_player_stats_v2";

export function getLocalPlayerStats(): StoredPlayerStats {
  if (typeof window === "undefined") {
    return getDefaultStats();
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...getDefaultStats(), ...parsed };
    }
  } catch {}

  return getDefaultStats();
}

export function saveLocalPlayerStats(stats: StoredPlayerStats): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {}
}

export function recordBotGameResult(
  result: "won" | "lost" | "draw",
  botName: string,
  botElo: number,
  timeControl: string = "10 min • Rated"
): { newElo: number; delta: number; stats: StoredPlayerStats } {
  const stats = getLocalPlayerStats();
  const score = result === "won" ? 1 : result === "draw" ? 0.5 : 0;
  const calc = calculateEloChange(stats.eloBots, botElo, score, 32);

  const deltaStr = calc.delta >= 0 ? `+${calc.delta}` : `${calc.delta}`;

  stats.eloBots = calc.newPlayerElo;
  stats.eloBlitz = Math.round((stats.eloBlitz * 3 + calc.newPlayerElo) / 4);
  stats.gamesPlayed += 1;
  if (result === "won") stats.gamesWon += 1;
  else if (result === "draw") stats.gamesDrawn += 1;
  else stats.gamesLost += 1;

  const newGameRecord = {
    id: `g_${Date.now()}`,
    opponent: botName,
    result,
    timeControl,
    date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    eloChange: deltaStr,
  };

  stats.recentGames = [newGameRecord, ...stats.recentGames.slice(0, 19)];
  saveLocalPlayerStats(stats);

  return { newElo: calc.newPlayerElo, delta: calc.delta, stats };
}

function getDefaultStats(): StoredPlayerStats {
  return {
    username: "Guest",
    isGuest: true,
    eloBullet: DEFAULT_STARTING_ELO,
    eloBlitz: DEFAULT_STARTING_ELO,
    eloRapid: DEFAULT_STARTING_ELO,
    eloPuzzles: DEFAULT_STARTING_ELO,
    eloBots: DEFAULT_STARTING_ELO,
    gamesPlayed: 0,
    gamesWon: 0,
    gamesDrawn: 0,
    gamesLost: 0,
    recentGames: [],
  };
}
