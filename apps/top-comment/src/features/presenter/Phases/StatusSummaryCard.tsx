import { ProgressBar, Card } from "@social/ui";
import { phaseHeadline } from "../../../shared/constants";
import type { Session } from "../../../shared/types";
import { useTheme } from "../../../shared/providers/ThemeProvider";

interface StatusSummaryCardProps {
  session: Session;
  presenterHeading: string | null;
  groupStatusLabel: string;
  totalSeconds: number;
}

export function StatusSummaryCard({
  session,
  presenterHeading,
  groupStatusLabel,
  totalSeconds,
}: StatusSummaryCardProps) {
  const { isDark } = useTheme();

  return (
    <Card className="space-y-4" isDark={isDark}>
      <div className="flex flex-col gap-4">
        <span className={`text-sm font-semibold uppercase tracking-[0.3em] ${!isDark ? 'text-amber-500' : 'text-cyan-400'}`}>
          {phaseHeadline[session.status]}
        </span>
        {presenterHeading ? (
          <h2 className={`text-4xl font-bold leading-tight ${!isDark ? 'text-slate-900' : 'text-pink-400'}`}>{presenterHeading}</h2>
        ) : (
          <div className="flex items-center gap-3">
            <svg className="animate-spin h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-lg text-cyan-300">Loading...</span>
          </div>
        )}
        {groupStatusLabel ? (
          <p className={`text-sm uppercase tracking-[0.3em] ${!isDark ? 'text-slate-600' : 'text-cyan-300'}`}>
            {groupStatusLabel}
          </p>
        ) : null}
        {session.status !== "lobby" ? (
          <div className="space-y-3">
            <ProgressBar
              endTime={session.endsAt}
              totalSeconds={totalSeconds}
              variant="brand"
              isDark={isDark}
              paused={session.paused}
            />
          </div>
        ) : null}
      </div>
    </Card>
  );
}

