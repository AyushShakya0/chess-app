import { AppShell } from "@/components/navigation/app-shell";
import { AiBotsPlay } from "@/components/chess/ai-bots";
import { ModeErrorBoundary } from "@/components/chess/mode-error-boundary";

export default function BotsPage() {
  return (
    <AppShell>
      <ModeErrorBoundary modeName="AI Bots Arena">
        <AiBotsPlay />
      </ModeErrorBoundary>
    </AppShell>
  );
}
