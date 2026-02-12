import type { RoomAnalyticsSummary } from "../../../services/analyticsService";

interface StatCardsProps {
  summary: RoomAnalyticsSummary | null;
  isLoading: boolean;
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-4 text-center">
      <p className="text-2xl font-black text-pink-400">{value}</p>
      <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400 mt-1">{label}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  return `${mins}m`;
}

function formatRate(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

export function StatCards({ summary, isLoading }: StatCardsProps) {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-700 bg-slate-800/80 p-4 animate-pulse">
            <div className="h-7 w-12 mx-auto rounded bg-slate-700" />
            <div className="h-3 w-16 mx-auto rounded bg-slate-700 mt-2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard label="Sessions" value={String(summary.totalSessions)} sub="total" />
      <StatCard label="Players" value={String(summary.uniquePlayers)} sub="unique" />
      <StatCard label="Answer Rate" value={formatRate(summary.avgAnswerRate)} sub="average" />
      <StatCard label="Duration" value={formatDuration(summary.avgSessionDurationSec)} sub="avg session" />
    </div>
  );
}
