import test from "node:test";
import assert from "node:assert/strict";
import {
  QUICK_PLAY_OPTIONS,
  parseTimeControlSeconds,
} from "../components/dashboard/quick-play-types.ts";

test("Quick Play - time control calculation handles increments correctly", () => {
  assert.equal(parseTimeControlSeconds("1+0").baseSeconds, 60);
  assert.equal(parseTimeControlSeconds("3+0").baseSeconds, 180);
  assert.equal(parseTimeControlSeconds("10+0").baseSeconds, 600);
  assert.equal(parseTimeControlSeconds("15+10").baseSeconds, 900);
  assert.equal(parseTimeControlSeconds("15+10").incrementSeconds, 10);
});

test("Quick Play - includes all standard chess.com tournament formats", () => {
  const ids = QUICK_PLAY_OPTIONS.map((o) => o.id);
  assert.ok(ids.includes("1+0"));
  assert.ok(ids.includes("3+0"));
  assert.ok(ids.includes("5+0"));
  assert.ok(ids.includes("10+0"));
});
