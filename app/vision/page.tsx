import { AppShell } from "@/components/navigation/app-shell";
import { VisionTrainer } from "@/components/chess/vision-trainer";
import { ModeErrorBoundary } from "@/components/chess/mode-error-boundary";

export const metadata = {
  title: "Board Vision & Notation Trainer - Prin Chess",
  description:
    "Train your mind to instantly recognize chessboard squares and navigate algebraic notation without looking at pieces.",
};

export default function VisionPage() {
  return (
    <AppShell>
      <ModeErrorBoundary modeName="Board Vision & Notation Trainer">
        <VisionTrainer />
      </ModeErrorBoundary>
    </AppShell>
  );
}
