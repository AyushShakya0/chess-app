import { AppShell } from "@/components/navigation/app-shell";
import { OpeningExplorer } from "@/components/learn/opening-explorer";
import { ModeErrorBoundary } from "@/components/chess/mode-error-boundary";

export default function LearnPage() {
  return (
    <AppShell>
      <ModeErrorBoundary modeName="Opening Academy & Courses">
        <OpeningExplorer />
      </ModeErrorBoundary>
    </AppShell>
  );
}
