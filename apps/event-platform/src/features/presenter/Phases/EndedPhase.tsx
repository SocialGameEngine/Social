import { Leaderboard, Card } from "@social/ui";
import type { Team } from "../../../shared/types";
import { useTheme } from "../../../shared/providers/ThemeProvider";

interface EndedPhaseProps {
  leaderboard: (Team & { rank: number })[];
}

export function EndedPhase({ leaderboard }: EndedPhaseProps) {
  const { isDark } = useTheme();
  return (
    <Card isDark={isDark}>
      <p className={`text-sm font-semibold uppercase tracking-[0.3em] ${!isDark ? 'text-slate-600' : 'text-slate-300'}`}>
        Final scoreboard
      </p>
      <div className="mt-4">
        <Leaderboard
          leaderboard={leaderboard}
          variant="presenter"
          className="space-y-3 text-2xl font-semibold"
          isDark={isDark}
        />
      </div>
    </Card>
  );
}

