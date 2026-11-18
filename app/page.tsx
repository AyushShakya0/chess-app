import { AppShell } from "@/components/navigation/app-shell";
import { AiBotsPlay } from "@/components/chess/ai-bots";
import { ModeErrorBoundary } from "@/components/chess/mode-error-boundary";
import { SovereignHero } from "@/components/brand/sovereign-hero";

export default function Home() {
  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4">
        <SovereignHero />
        <div id="arena">
          <ModeErrorBoundary modeName="AI Bots Arena">
            <AiBotsPlay />
          </ModeErrorBoundary>
        </div>
      </div>
    </AppShell>
  );
}
