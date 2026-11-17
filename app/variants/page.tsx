import { AppShell } from "@/components/navigation/app-shell";
import { VariantsPlay } from "@/components/chess/variants-play";
import { ModeErrorBoundary } from "@/components/chess/mode-error-boundary";

export default function VariantsPage() {
  return (
    <AppShell>
      <ModeErrorBoundary modeName="Chess Variants">
        <VariantsPlay />
      </ModeErrorBoundary>
    </AppShell>
  );
}
