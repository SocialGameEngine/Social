import { Timer, ProgressBar, Card } from "@social/ui";

interface SpotlightPhaseProps {
  sessionEndsAt: string | undefined;
}

export function SpotlightPhase({ sessionEndsAt }: SpotlightPhaseProps) {
  return (
    <Card className="flex flex-col items-center justify-center space-y-8">
      <h2 className="text-7xl font-black text-slate-900">Spotlight</h2>
      <Timer
        endTime={sessionEndsAt}
        variant="light"
        size="lg"
        label="Time"
      />
      <ProgressBar
        endTime={sessionEndsAt}
        totalSeconds={30}
        variant="brand"
      />
    </Card>
  );
}

