import { Card, Timer, ProgressBar } from "@social/ui";
import { useTheme } from "../../../shared/providers/ThemeProvider";

interface SpotlightPhaseProps {
  sessionEndsAt: string | undefined;
}

export function SpotlightPhase({ sessionEndsAt }: SpotlightPhaseProps) {
  const { isDark } = useTheme();
  return (
    <Card className="space-y-6" isDark={isDark}>
      <div className="flex flex-col items-center justify-center space-y-6 py-12">
        <h2 className={`text-6xl font-black ${!isDark ? 'text-slate-900' : 'text-white'}`}>Spotlight</h2>
        <Timer endTime={sessionEndsAt} label="Time left" isDark={isDark} />
        <ProgressBar endTime={sessionEndsAt} totalSeconds={30} />
      </div>
    </Card>
  );
}

