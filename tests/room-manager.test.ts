import test from "node:test";
import assert from "node:assert";
import { roomManager } from "../lib/server/room-manager.ts";
import type { Square } from "chess.js";

test("Authoritative Room Manager - Room Creation and Defaults", () => {
  const { room, token, color } = roomManager.createRoom({
    timeControl: "5+0",
    playerName: "Alice",
    colorPreference: "white",
  });

  assert.ok(room.id, "Room has an ID");
  assert.strictEqual(color, "white");
  assert.ok(token, "Host has an auth token");
  assert.strictEqual(room.white?.name, "Alice");
  assert.strictEqual(room.black, null);
  assert.strictEqual(room.status, "waiting");
  assert.strictEqual(room.turn, "w");
  assert.strictEqual(room.whiteTimeLeftMs, 300000);
});

test("Authoritative Room Manager - Joining and Second Player Seat", () => {
  const { room, token: whiteToken } = roomManager.createRoom({
    timeControl: "3+2",
    playerName: "PlayerOne",
    colorPreference: "white",
  });

  const joinRes = roomManager.joinRoom(room.id, { playerName: "PlayerTwo" });
  assert.strictEqual(joinRes.success, true);
  assert.strictEqual(joinRes.role, "black");
  assert.strictEqual(joinRes.room.status, "active");
  assert.strictEqual(joinRes.room.black?.name, "PlayerTwo");

  // Third joiner becomes a spectator
  const specRes = roomManager.joinRoom(room.id, { playerName: "Watcher" });
  assert.strictEqual(specRes.success, true);
  assert.strictEqual(specRes.role, "spectator");
  assert.strictEqual(specRes.room.spectators.length, 1);
});

test("Authoritative Room Manager - Legal Moves and Turn Enforcement", () => {
  const { room, token: whiteToken } = roomManager.createRoom({
    timeControl: "5+0",
    playerName: "WhiteMaster",
  });
  const joinRes = roomManager.joinRoom(room.id, { playerName: "BlackMaster" });
  const blackToken = joinRes.token;

  // 1. Black cannot move on White's turn
  const badBlackMove = roomManager.makeMove(room.id, {
    token: blackToken,
    from: "e7" as Square,
    to: "e5" as Square,
  });
  assert.strictEqual(badBlackMove.success, false);
  assert.match(badBlackMove.error || "", /turn/i);

  // 2. White plays legal e2-e4
  const whiteMove = roomManager.makeMove(room.id, {
    token: whiteToken,
    from: "e2" as Square,
    to: "e4" as Square,
  });
  assert.strictEqual(whiteMove.success, true);
  assert.strictEqual(whiteMove.room?.turn, "b");
  assert.strictEqual(whiteMove.room?.history[0], "e4");

  // 3. White cannot play two moves in a row
  const doubleWhite = roomManager.makeMove(room.id, {
    token: whiteToken,
    from: "g1" as Square,
    to: "f3" as Square,
  });
  assert.strictEqual(doubleWhite.success, false);

  // 4. Black plays illegal move (e.g. e7 to e2)
  const illegalMove = roomManager.makeMove(room.id, {
    token: blackToken,
    from: "e7" as Square,
    to: "e2" as Square,
  });
  assert.strictEqual(illegalMove.success, false);
  assert.match(illegalMove.error || "", /Illegal move/i);

  // 5. Black plays legal e7-e5
  const blackMove = roomManager.makeMove(room.id, {
    token: blackToken,
    from: "e7" as Square,
    to: "e5" as Square,
  });
  assert.strictEqual(blackMove.success, true);
  assert.strictEqual(blackMove.room?.turn, "w");
});

test("Authoritative Room Manager - Resignation and Draw Handling", () => {
  const { room, token: whiteToken } = roomManager.createRoom({ playerName: "White" });
  const joinRes = roomManager.joinRoom(room.id, { playerName: "Black" });
  const blackToken = joinRes.token;

  // Black offers draw
  const drawOffer = roomManager.handleAction(room.id, {
    token: blackToken,
    action: "offer_draw",
  });
  assert.strictEqual(drawOffer.success, true);
  assert.strictEqual(drawOffer.room?.drawOfferFrom, "b");

  // White accepts draw
  const drawAccept = roomManager.handleAction(room.id, {
    token: whiteToken,
    action: "accept_draw",
  });
  assert.strictEqual(drawAccept.success, true);
  assert.strictEqual(drawAccept.room?.status, "completed");
  assert.strictEqual(drawAccept.room?.result, "1/2-1/2");
  assert.strictEqual(drawAccept.room?.winner, "draw");
});

test("Authoritative Room Manager - Resignation", () => {
  const { room, token: whiteToken } = roomManager.createRoom({ playerName: "White" });
  roomManager.joinRoom(room.id, { playerName: "Black" });

  const resignRes = roomManager.handleAction(room.id, {
    token: whiteToken,
    action: "resign",
  });
  assert.strictEqual(resignRes.success, true);
  assert.strictEqual(resignRes.room?.status, "completed");
  assert.strictEqual(resignRes.room?.winner, "black");
  assert.strictEqual(resignRes.room?.result, "0-1");
});
