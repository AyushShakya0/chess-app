export type BoardSize = 5 | 6 | 7 | 8;

export interface KnightsTourRecord {
  completed: boolean;
  maxVisited: number;
  bestTimeSec: number | null;
  completionsCount: number;
}

export type KnightsTourRecordsMap = Record<BoardSize, KnightsTourRecord>;

export const DEFAULT_KNIGHTS_TOUR_RECORDS: KnightsTourRecordsMap = {
  5: { completed: false, maxVisited: 0, bestTimeSec: null, completionsCount: 0 },
  6: { completed: false, maxVisited: 0, bestTimeSec: null, completionsCount: 0 },
  7: { completed: false, maxVisited: 0, bestTimeSec: null, completionsCount: 0 },
  8: { completed: false, maxVisited: 0, bestTimeSec: null, completionsCount: 0 },
};

export const KNIGHTS_TOUR_STORAGE_KEY = "sovereign_knights_tour_records";

export function loadKnightsTourRecords(): KnightsTourRecordsMap {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(KNIGHTS_TOUR_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          5: { ...DEFAULT_KNIGHTS_TOUR_RECORDS[5], ...(parsed[5] || {}) },
          6: { ...DEFAULT_KNIGHTS_TOUR_RECORDS[6], ...(parsed[6] || {}) },
          7: { ...DEFAULT_KNIGHTS_TOUR_RECORDS[7], ...(parsed[7] || {}) },
          8: { ...DEFAULT_KNIGHTS_TOUR_RECORDS[8], ...(parsed[8] || {}) },
        };
      }
    } catch {}
  }
  return { ...DEFAULT_KNIGHTS_TOUR_RECORDS };
}

export function saveKnightsTourRecords(records: KnightsTourRecordsMap): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(KNIGHTS_TOUR_STORAGE_KEY, JSON.stringify(records));
    } catch {}
  }
}

export function recordTourProgress(
  currentRecords: KnightsTourRecordsMap,
  size: BoardSize,
  visitedCount: number,
  timeSec: number,
  isComplete: boolean
): { updatedRecords: KnightsTourRecordsMap; isNewBestTime: boolean } {
  const existing = currentRecords[size] || DEFAULT_KNIGHTS_TOUR_RECORDS[size];
  const newMax = Math.max(existing.maxVisited, visitedCount);

  let isNewBestTime = false;
  let newBestTime = existing.bestTimeSec;
  let newCompletions = existing.completionsCount;
  let newCompleted = existing.completed;

  if (isComplete) {
    newCompleted = true;
    newCompletions += 1;
    if (newBestTime === null || timeSec < newBestTime) {
      newBestTime = timeSec;
      isNewBestTime = true;
    }
  }

  const updatedRecords: KnightsTourRecordsMap = {
    ...currentRecords,
    [size]: {
      completed: newCompleted,
      maxVisited: newMax,
      bestTimeSec: newBestTime,
      completionsCount: newCompletions,
    },
  };

  saveKnightsTourRecords(updatedRecords);
  return { updatedRecords, isNewBestTime };
}
