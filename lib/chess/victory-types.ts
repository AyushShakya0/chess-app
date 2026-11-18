export type GameOutcome = "win" | "loss" | "draw";

export interface VictoryDialogData {
  title: string;
  subtitle: string;
  isWin: boolean;
  accentColor: string;
}

export function formatVictoryData(
  outcome: GameOutcome,
  reason?: string | null
): VictoryDialogData {
  let title = "Game Drawn";
  let subtitle = "By Agreement";
  let isWin = false;
  let accentColor = "text-slate-300";

  if (outcome === "win") {
    title = "You Won!";
    isWin = true;
    accentColor = "text-[#d4a359]";
  } else if (outcome === "loss") {
    title = "Defeat";
    isWin = false;
    accentColor = "text-rose-400";
  }

  const rawReason = (reason || "").toLowerCase();
  if (rawReason.includes("checkmate")) {
    subtitle = "Checkmate!";
  } else if (rawReason.includes("resign")) {
    subtitle = outcome === "win" ? "Opponent Resigned" : "By Resignation";
  } else if (rawReason.includes("timeout") || rawReason.includes("time")) {
    subtitle = outcome === "win" ? "Opponent Ran Out of Time" : "On Time";
  } else if (rawReason.includes("stalemate")) {
    subtitle = "Stalemate";
  } else if (rawReason.includes("insufficient")) {
    subtitle = "Insufficient Material";
  } else if (rawReason.includes("repetition")) {
    subtitle = "Threefold Repetition";
  } else if (rawReason.includes("50-move")) {
    subtitle = "50-Move Rule";
  } else if (reason) {
    subtitle = reason;
  }

  return { title, subtitle, isWin, accentColor };
}
