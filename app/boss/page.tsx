import { AppShell } from "@/components/navigation/app-shell";
import { BossMode } from "@/components/chess/boss-mode";
import { ModeErrorBoundary } from "@/components/chess/mode-error-boundary";

export default function BossPage() {
  return (
    <AppShell>
      <ModeErrorBoundary modeName="Boss Arena">
        <BossMode />
      </ModeErrorBoundary>
    </AppShell>
  );
}
