import { Card, Leaderboard } from "@social/ui";
import { useTheme } from "../../../shared/providers/ThemeProvider";
import type { SessionAnalytics } from "../../../shared/types";

interface LeaderboardTeam {
  id: string;
  rank: number;
  teamName: string;
  score: number;
}

interface EndedPhaseProps {
  leaderboard: LeaderboardTeam[];
  analytics: SessionAnalytics | null;
}

export function EndedPhase({ leaderboard, analytics }: EndedPhaseProps) {
  const { isDark } = useTheme();
  return (
    <Card className="space-y-6" isDark={isDark}>
      <div>
        <h3 className={`text-2xl font-bold ${!isDark ? 'text-slate-900' : 'text-white'}`}>Game complete</h3>
        <p className={`text-sm ${!isDark ? 'text-slate-600' : 'text-slate-300'}`}>
          Share the leaderboard and invite teams to another round anytime.
        </p>
      </div>
      <div className="space-y-3">
        <h4 className={`text-sm font-semibold uppercase tracking-wide ${!isDark ? 'text-slate-700' : 'text-brand-primary'}`}>
          Leaderboard
        </h4>
        <Leaderboard
          leaderboard={leaderboard}
          variant="host"
          isDark={isDark}
        />
      </div>
      {analytics && (
        <div className="space-y-3 p-5">
          <h4 className={`text-sm font-semibold uppercase tracking-wide ${!isDark ? 'text-slate-700' : 'text-brand-primary'}`}>
            Session stats
          </h4>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className={`font-medium ${!isDark ? 'text-slate-600' : 'text-slate-400'}`}>Teams joined</dt>
              <dd className={`text-lg font-semibold ${!isDark ? 'text-slate-900' : 'text-cyan-300'}`}>
                {analytics.joinedCount}
              </dd>
            </div>
            <div>
              <dt className={`font-medium ${!isDark ? 'text-slate-600' : 'text-slate-400'}`}>Completion rate</dt>
              <dd className={`text-lg font-semibold ${!isDark ? 'text-slate-900' : 'text-cyan-300'}`}>
                {Math.round((analytics.answerRate ?? 0) * 100)}%
              </dd>
            </div>
            <div>
              <dt className={`font-medium ${!isDark ? 'text-slate-600' : 'text-slate-400'}`}>Avg votes/round</dt>
              <dd className={`text-lg font-semibold ${!isDark ? 'text-slate-900' : 'text-cyan-300'}`}>
                {analytics.voteRate?.toFixed(1) ?? "0.0"}
              </dd>
            </div>
            <div>
              <dt className={`font-medium ${!isDark ? 'text-slate-600' : 'text-slate-400'}`}>Duration</dt>
              <dd className={`text-lg font-semibold ${!isDark ? 'text-slate-900' : 'text-cyan-300'}`}>
                {analytics.duration
                  ? `${Math.round(analytics.duration / 60)} min`
                  : "-"}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </Card>
  );
}
