export interface QuickPlayOption {
  id: string;
  name: string;
  timeControl: string;
  type: "bullet" | "blitz" | "rapid";
  label: string;
  isPopular?: boolean;
}

export const QUICK_PLAY_OPTIONS: QuickPlayOption[] = [
  { id: "1+0", name: "1 min", timeControl: "1+0", type: "bullet", label: "Bullet" },
  { id: "3+0", name: "3 min", timeControl: "3+0", type: "blitz", label: "Blitz", isPopular: true },
  { id: "5+0", name: "5 min", timeControl: "5+0", type: "blitz", label: "Blitz" },
  { id: "10+0", name: "10 min", timeControl: "10+0", type: "rapid", label: "Rapid", isPopular: true },
];

export function parseTimeControlSeconds(tc: string): { baseSeconds: number; incrementSeconds: number } {
  const [baseStr, incStr] = tc.split("+");
  const baseMinutes = parseFloat(baseStr) || 5;
  const incSeconds = parseInt(incStr, 10) || 0;
  return {
    baseSeconds: Math.round(baseMinutes * 60),
    incrementSeconds: incSeconds,
  };
}
