import { AppShell } from "@/components/navigation/app-shell";
import { KnightsTour } from "@/components/chess/knights-tour";
import { ModeErrorBoundary } from "@/components/chess/mode-error-boundary";

export default function KnightsTourPage() {
  return (
    <AppShell>
      <ModeErrorBoundary modeName="Knight's Tour">
        <KnightsTour />
      </ModeErrorBoundary>
    </AppShell>
  );
}
