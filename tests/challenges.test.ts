import test from "node:test";
import assert from "node:assert/strict";
import {
  filterActiveChallenges,
  generateChallengePayload,
  type OpenChallenge,
} from "../lib/services/challenge-types.ts";

test("Challenge Engine - filters expired and claimed challenges", () => {
  const now = Date.now();
  const sampleChallenges: OpenChallenge[] = [
    {
      id: "c1",
      creatorId: "u1",
      creatorName: "Ayush",
      creatorElo: 1642,
      timeControl: "10+0",
      category: "rapid",
      rated: true,
      colorPreference: "random",
      status: "open",
      createdAt: now - 1000,
      expiresAt: now + 600000,
    },
    {
      id: "c2",
      creatorId: "u2",
      creatorName: "Hikaru",
      creatorElo: 2500,
      timeControl: "3+0",
      category: "blitz",
      rated: true,
      colorPreference: "random",
      status: "claimed",
      createdAt: now - 5000,
      expiresAt: now + 600000,
    },
    {
      id: "c3",
      creatorId: "u3",
      creatorName: "OldMatch",
      creatorElo: 1200,
      timeControl: "5+0",
      category: "blitz",
      rated: false,
      colorPreference: "white",
      status: "open",
      createdAt: now - 700000,
      expiresAt: now - 1000, // expired
    },
  ];

  const active = filterActiveChallenges(sampleChallenges, now);
  assert.equal(active.length, 1);
  assert.equal(active[0].id, "c1");
  assert.equal(active[0].creatorName, "Ayush");
});

test("Challenge Engine - generateChallengePayload sets correct time control category", () => {
  const bullet = generateChallengePayload({
    creatorId: "u1",
    creatorName: "Ayush",
    creatorElo: 1642,
    timeControl: "1+0",
  });
  assert.equal(bullet.category, "bullet");

  const blitz = generateChallengePayload({
    creatorId: "u1",
    creatorName: "Ayush",
    creatorElo: 1642,
    timeControl: "3+0",
  });
  assert.equal(blitz.category, "blitz");

  const rapid = generateChallengePayload({
    creatorId: "u1",
    creatorName: "Ayush",
    creatorElo: 1642,
    timeControl: "10+0",
  });
  assert.equal(rapid.category, "rapid");
});
