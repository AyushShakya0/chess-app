import { AppShell } from "@/components/navigation/app-shell";
import { PassAndPlay } from "@/components/chess/pass-and-play";
import { ModeErrorBoundary } from "@/components/chess/mode-error-boundary";

export default function PassAndPlayPage() {
  return (
    <AppShell>
      <ModeErrorBoundary modeName="Pass & Play Mode">
        <PassAndPlay />
      </ModeErrorBoundary>
    </AppShell>
  );
}
