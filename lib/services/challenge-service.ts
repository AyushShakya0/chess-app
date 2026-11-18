"use client";

import {
  OpenChallenge,
  generateChallengePayload,
  filterActiveChallenges,
} from "./challenge-types";

// In-memory fallback store with realistic initial matches for instant interaction
let localChallenges: OpenChallenge[] = [
  {
    id: "chal_init_1",
    creatorId: "user_hikaru",
    creatorName: "Grandmaster_Hikaru",
    creatorElo: 2500,
    timeControl: "3+0",
    category: "blitz",
    rated: true,
    colorPreference: "random",
    status: "open",
    createdAt: Date.now() - 35000,
    expiresAt: Date.now() + 500000,
  },
  {
    id: "chal_init_2",
    creatorId: "user_nepal",
    creatorName: "Himalayan_Tiger",
    creatorElo: 1720,
    timeControl: "10+0",
    category: "rapid",
    rated: true,
    colorPreference: "random",
    status: "open",
    createdAt: Date.now() - 95000,
    expiresAt: Date.now() + 480000,
  },
  {
    id: "chal_init_3",
    creatorId: "user_tactician",
    creatorName: "TacticalViper",
    creatorElo: 1540,
    timeControl: "5+0",
    category: "blitz",
    rated: true,
    colorPreference: "white",
    status: "open",
    createdAt: Date.now() - 140000,
    expiresAt: Date.now() + 420000,
  },
];

const subscribers = new Set<(challenges: OpenChallenge[]) => void>();

function notifySubscribers() {
  const active = filterActiveChallenges(localChallenges);
  subscribers.forEach((callback) => callback(active));
}

export async function fetchOpenChallenges(): Promise<OpenChallenge[]> {
  try {
    const res = await fetch("/api/challenge/list");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.challenges)) {
        return filterActiveChallenges(data.challenges);
      }
    }
  } catch {}
  return filterActiveChallenges(localChallenges);
}

export async function broadcastOpenChallenge(params: {
  creatorId?: string;
  creatorName?: string;
  creatorElo?: number;
  timeControl: string;
  rated?: boolean;
  colorPreference?: "white" | "black" | "random";
}): Promise<OpenChallenge> {
  const payload = generateChallengePayload(params);
  localChallenges.unshift(payload);
  notifySubscribers();

  try {
    await fetch("/api/challenge/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {}

  return payload;
}

export async function claimOpenChallenge(
  challengeId: string,
  acceptorName: string = "AyushShakya"
): Promise<{ roomId: string }> {
  // First, find the challenge
  const challenge = localChallenges.find((c) => c.id === challengeId);
  const timeControl = challenge ? challenge.timeControl : "10+0";

  // Create an authoritative match room
  const createRes = await fetch("/api/room/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      timeControl,
      playerName: acceptorName,
      colorPreference: challenge?.colorPreference === "white" ? "black" : "white",
    }),
  });

  const roomData = await createRes.json();
  if (!createRes.ok || !roomData.roomId) {
    throw new Error(roomData.error || "Failed to create match room for challenge");
  }

  // Update challenge status
  if (challenge) {
    challenge.status = "claimed";
    challenge.roomId = roomData.roomId;
    challenge.acceptorName = acceptorName;
  }
  notifySubscribers();

  try {
    await fetch("/api/challenge/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId, roomId: roomData.roomId, acceptorName }),
    });
  } catch {}

  return { roomId: roomData.roomId };
}

export function subscribeToChallenges(
  callback: (challenges: OpenChallenge[]) => void
): () => void {
  subscribers.add(callback);
  callback(filterActiveChallenges(localChallenges));
  return () => {
    subscribers.delete(callback);
  };
}
