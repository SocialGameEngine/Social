import type { PlayerEngagement, RetentionMetrics } from "../../../services/analyticsService";

interface PlayerEngagementTableProps {
  players: PlayerEngagement[];
  retention: RetentionMetrics | null;
  isLoading: boolean;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function PlayerEngagementTable({ players, retention, isLoading }: PlayerEngagementTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-40 rounded bg-slate-700" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 rounded bg-slate-700/50" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800/80 overflow-hidden">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">Top Players</h3>
          <p className="text-xs text-slate-400 mt-0.5">{players.length} players tracked</p>
        </div>
        {retention && (
          <div className="flex gap-4 text-right">
            <div>
              <p className="text-sm font-bold text-pink-400">{Math.round(retention.returnRate * 100)}%</p>
              <p className="text-[10px] text-slate-400 uppercase">Return rate</p>
            </div>
            <div>
              <p className="text-sm font-bold text-pink-400">{retention.avgSessionsPerPlayer.toFixed(1)}</p>
              <p className="text-[10px] text-slate-400 uppercase">Avg sessions</p>
            </div>
          </div>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Player</th>
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Sessions</th>
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Score</th>
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">First Visit</th>
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Last Visit</th>
            </tr>
          </thead>
          <tbody>
            {players.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-sm">
                  No player data yet
                </td>
              </tr>
            ) : (
              players.slice(0, 20).map((p, i) => (
                <tr key={p.userId} className="border-b border-slate-700/30 hover:bg-slate-700/30 transition-colors">
                  <td className="px-3 py-2 text-cyan-100 font-medium">
                    <span className="text-slate-500 mr-2 text-xs">{i + 1}.</span>
                    {p.playerName}
                  </td>
                  <td className="px-3 py-2 text-slate-300">{p.sessionsPlayed}</td>
                  <td className="px-3 py-2 text-slate-300">{p.totalScore.toLocaleString()}</td>
                  <td className="px-3 py-2 text-slate-400 text-xs">{formatDate(p.firstPlayedAt)}</td>
                  <td className="px-3 py-2 text-slate-400 text-xs">{formatDate(p.lastPlayedAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
