import { Leaderboard } from "@social/ui";
import { useTheme } from "../../../shared/providers/ThemeProvider";
import { downloadCSV, generateSessionFilename } from "../../../domain/analytics/sessionAnalytics";
import type { SessionAnalytics } from "../../../shared/types";

interface LeaderboardTeam {
  id: string;
  rank: number;
  playerName: string;
  score: number;
}

interface EndedPhaseProps {
  leaderboard: LeaderboardTeam[];
  analytics: SessionAnalytics | null;
}

function buildCSV(leaderboard: LeaderboardTeam[], analytics: SessionAnalytics | null): string {
  const lines: string[] = ['SESSION ANALYTICS', ''];

  if (analytics) {
    lines.push(`Session ID,${analytics.sessionId}`);
    lines.push(`Started,${analytics.startTime}`);
    if (analytics.endTime) lines.push(`Ended,${analytics.endTime}`);
    if (analytics.duration) lines.push(`Duration (minutes),${Math.round(analytics.duration / 60)}`);
    lines.push(`Players joined,${analytics.joinedCount ?? analytics.totalParticipants}`);
    lines.push(`Rounds completed,${analytics.roundsCompleted}`);
    if (analytics.answerRate != null) lines.push(`Completion rate,${(analytics.answerRate * 100).toFixed(1)}%`);
    if (analytics.voteRate != null) lines.push(`Avg votes/round,${analytics.voteRate.toFixed(1)}`);
    lines.push('');
  }

  lines.push('LEADERBOARD');
  lines.push('');
  lines.push('Rank,Player,Score');
  leaderboard.forEach(e => lines.push(`${e.rank},"${e.playerName}",${e.score}`));

  return lines.join('\n');
}

export function EndedPhase({ leaderboard, analytics }: EndedPhaseProps) {
  const { isDark } = useTheme();

  const handleExportCSV = () => {
    const csv = buildCSV(leaderboard, analytics);
    const filename = generateSessionFilename(undefined, new Date());
    downloadCSV(csv, filename);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className={`text-2xl font-bold ${!isDark ? 'text-slate-900' : 'text-white'}`}>Game complete</h3>
        <p className={`text-sm ${!isDark ? 'text-slate-600' : 'text-slate-300'}`}>
          Share the leaderboard and invite players to another round anytime.
        </p>
      </div>
      <div className="space-y-3">
        <h4 className={`text-sm font-semibold uppercase tracking-wide ${!isDark ? 'text-slate-700' : 'text-brand-primary'}`}>
          Leaderboard
        </h4>
        <Leaderboard
          leaderboard={leaderboard.map(entry => ({
            ...entry,
            teamName: entry.playerName
          }))}
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
              <dt className={`font-medium ${!isDark ? 'text-slate-600' : 'text-slate-400'}`}>Players joined</dt>
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
      <div>
        <button
          onClick={handleExportCSV}
          className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors border ${
            !isDark
              ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
              : 'border-slate-600 text-slate-300 hover:bg-slate-800'
          }`}
        >
          Export analytics CSV
        </button>
      </div>
    </div>
  );
}
