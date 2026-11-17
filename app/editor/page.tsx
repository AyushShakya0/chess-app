import { AppShell } from "@/components/navigation/app-shell";
import { BoardEditor } from "@/components/chess/board-editor";
import { ModeErrorBoundary } from "@/components/chess/mode-error-boundary";

export const metadata = {
  title: "Board & Position Editor - Prin Chess",
  description:
    "Design custom chess positions, analyze tactical setups with Stockfish UCI, export FEN, and challenge AI grandmasters directly.",
};

export default function EditorPage() {
  return (
    <AppShell>
      <ModeErrorBoundary modeName="Board & Position Editor">
        <BoardEditor />
      </ModeErrorBoundary>
    </AppShell>
  );
}
