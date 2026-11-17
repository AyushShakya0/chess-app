import test from "node:test";
import assert from "node:assert";
import {
  DEFAULT_KNIGHTS_TOUR_RECORDS,
  recordTourProgress,
  loadKnightsTourRecords,
  saveKnightsTourRecords,
  type KnightsTourRecordsMap,
} from "../lib/chess/knights-tour-records.ts";

test("Knight's Tour Records - track max visited progress", () => {
  const initial: KnightsTourRecordsMap = { ...DEFAULT_KNIGHTS_TOUR_RECORDS };
  assert.strictEqual(initial[5].maxVisited, 0);

  const { updatedRecords } = recordTourProgress(initial, 5, 14, 25, false);
  assert.strictEqual(updatedRecords[5].maxVisited, 14);
  assert.strictEqual(updatedRecords[5].completed, false);
  assert.strictEqual(updatedRecords[5].bestTimeSec, null);

  // Moving to 10 visited should not lower maxVisited
  const { updatedRecords: updated2 } = recordTourProgress(updatedRecords, 5, 10, 15, false);
  assert.strictEqual(updated2[5].maxVisited, 14);
});

test("Knight's Tour Records - completion sets best time and increments completions", () => {
  const initial: KnightsTourRecordsMap = { ...DEFAULT_KNIGHTS_TOUR_RECORDS };

  // First completion in 48s
  const { updatedRecords: r1, isNewBestTime: b1 } = recordTourProgress(initial, 5, 25, 48, true);
  assert.strictEqual(b1, true);
  assert.strictEqual(r1[5].completed, true);
  assert.strictEqual(r1[5].bestTimeSec, 48);
  assert.strictEqual(r1[5].completionsCount, 1);

  // Second completion in slower 60s
  const { updatedRecords: r2, isNewBestTime: b2 } = recordTourProgress(r1, 5, 25, 60, true);
  assert.strictEqual(b2, false);
  assert.strictEqual(r2[5].bestTimeSec, 48);
  assert.strictEqual(r2[5].completionsCount, 2);

  // Third completion in faster 35s
  const { updatedRecords: r3, isNewBestTime: b3 } = recordTourProgress(r2, 5, 25, 35, true);
  assert.strictEqual(b3, true);
  assert.strictEqual(r3[5].bestTimeSec, 35);
  assert.strictEqual(r3[5].completionsCount, 3);
});

test("Knight's Tour Records - safe defaults when window is undefined", () => {
  const records = loadKnightsTourRecords();
  assert.deepStrictEqual(records[5], DEFAULT_KNIGHTS_TOUR_RECORDS[5]);
  assert.doesNotThrow(() => saveKnightsTourRecords(records));
});
