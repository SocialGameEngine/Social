import { Leaderboard, RoundSummaryCard, Card } from "@social/ui";
import type { Answer, RoundGroup } from "../../../shared/types";
import { useTheme } from "../../../shared/providers/ThemeProvider";

interface RoundSummary {
  group: RoundGroup;
  index: number;
  answers: Answer[];
  winners: Answer[];
}

interface ResultsPhaseProps {
  leaderboard: any[]; // LeaderboardEntry with rank
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
          roundSummaries.map((summary) => {
            // Add teamId compatibility for UI
            const summaryWithTeamId = {
              ...summary,
              answers: summary.answers.map(answer => ({
                ...answer,
                teamId: answer.membershipId
              })),
              winners: summary.winners.map(answer => ({
                ...answer,
                teamId: answer.membershipId
              }))
            };
            return (
              <RoundSummaryCard
                key={summary.group.id}
                summary={summaryWithTeamId}
                voteCounts={voteCounts}
                variant="presenter"
                isDark={isDark}
              />
            );
          })
        ) : (
          <p className={`text-center ${!isDark ? 'text-slate-500' : 'text-white/60'}`}>
            No answers submitted this round.
          </p>
        )}
      </section>
    </>
  );
}
