import { AppShell } from "@/components/navigation/app-shell";
import { PuzzleArena } from "@/components/puzzles/puzzle-arena";
import { ModeErrorBoundary } from "@/components/chess/mode-error-boundary";

export default function PuzzlesPage() {
  return (
    <AppShell>
      <ModeErrorBoundary modeName="Tactical Puzzles">
        <PuzzleArena />
      </ModeErrorBoundary>
    </AppShell>
  );
}
