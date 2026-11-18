export type ChallengeCategory = "bullet" | "blitz" | "rapid" | "classical";

export interface OpenChallenge {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorElo: number;
  timeControl: string;
  category: ChallengeCategory;
  rated: boolean;
  colorPreference: "white" | "black" | "random";
  status: "open" | "claimed" | "cancelled" | "expired";
  acceptorId?: string;
  acceptorName?: string;
  roomId?: string;
  createdAt: number;
  expiresAt: number;
}

export function determineCategory(timeControl: string): ChallengeCategory {
  const parts = timeControl.split("+");
  const baseMinutes = parseInt(parts[0], 10) || 5;
  if (baseMinutes < 3) return "bullet";
  if (baseMinutes < 10) return "blitz";
  if (baseMinutes < 30) return "rapid";
  return "classical";
}

export function generateChallengePayload(params: {
  creatorId?: string;
  creatorName?: string;
  creatorElo?: number;
  timeControl: string;
  rated?: boolean;
  colorPreference?: "white" | "black" | "random";
}): OpenChallenge {
  const now = Date.now();
  const category = determineCategory(params.timeControl);
  return {
    id: `chal_${now.toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    creatorId: params.creatorId || "guest_" + Math.random().toString(36).slice(2, 6),
    creatorName: params.creatorName || "AyushShakya",
    creatorElo: params.creatorElo || 1642,
    timeControl: params.timeControl,
    category,
    rated: params.rated ?? true,
    colorPreference: params.colorPreference || "random",
    status: "open",
    createdAt: now,
    expiresAt: now + 10 * 60 * 1000, // 10 minutes expiry
  };
}

export function filterActiveChallenges(
  challenges: OpenChallenge[],
  now: number = Date.now()
): OpenChallenge[] {
  return challenges.filter(
    (c) => c.status === "open" && c.expiresAt > now
  );
}
