import { Leaderboard, RoundSummaryCard, Card } from "@social/ui";
import type { Answer, RoundGroup, Team } from "../../../shared/types";
import { useTheme } from "../../../shared/providers/ThemeProvider";

interface RoundSummary {
  group: RoundGroup;
  index: number;
  answers: Answer[];
  winners: Answer[];
}

interface ResultsPhaseProps {
  leaderboard: (Team & { rank: number })[];
  roundSummaries: RoundSummary[];
  voteCounts: Map<string, number>;
}

export function ResultsPhase({
  leaderboard,
  roundSummaries,
  voteCounts,
}: ResultsPhaseProps) {
  const { isDark } = useTheme();
  return (
    <>
      <Card isDark={isDark}>
        <p className={`text-sm font-semibold uppercase tracking-[0.3em] ${!isDark ? 'text-slate-600' : 'text-slate-300'}`}>
          Leaderboard
        </p>
        <div className="mt-4">
          <Leaderboard
            leaderboard={leaderboard}
            variant="presenter"
            className="grid gap-3 text-lg font-semibold lg:grid-cols-2"
            isDark={isDark}
          />
        </div>
      </Card>

      <section className="grid gap-6">
        {roundSummaries.length ? (
          roundSummaries.map((summary) => (
            <RoundSummaryCard
              key={summary.group.id}
              summary={summary}
              voteCounts={voteCounts}
              variant="presenter"
              isDark={isDark}
            />
          ))
        ) : (
          <p className={`text-center ${!isDark ? 'text-slate-500' : 'text-white/60'}`}>
            No answers submitted this round.
          </p>
        )}
      </section>
    </>
  );
}
