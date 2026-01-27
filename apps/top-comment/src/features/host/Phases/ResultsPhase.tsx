import { Card, RoundSummaryCard, SessionTimer } from "@social/ui";
import { useTheme } from "../../../shared/providers/ThemeProvider";
import type { RoundGroup, Answer } from "../../../shared/types";

interface ResultsPhaseProps {
  sessionRoundIndex: number;
  roundSummaries: {
    group: RoundGroup;
    index: number;
    answers: Answer[];
    winners: Answer[];
  }[];
  voteCounts: Map<string, number>;
  sessionEndsAt: string | undefined;
  resultsSecs: number;
  sessionPaused?: boolean;
}

export function ResultsPhase({
  sessionRoundIndex,
  roundSummaries,
  voteCounts,
  sessionEndsAt,
  resultsSecs,
  sessionPaused = false,
}: ResultsPhaseProps) {
  const { isDark } = useTheme();
  return (
    <Card className="space-y-6" isDark={isDark}>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-brand-primary">
          Round results
        </span>
        <h3 className={`text-2xl font-bold text-brand-primary`}>
          Recap for round {sessionRoundIndex + 1}
        </h3>
        <p className={`text-sm ${!isDark ? 'text-slate-600' : 'text-slate-300'}`}>
          Highlight the winning answers from each group below.
        </p>
        
        <SessionTimer
          endTime={sessionEndsAt}
          totalSeconds={resultsSecs}
          paused={sessionPaused}
          label={
            <span className="flex items-center">
              Next round starts soon
              <span className="ml-1 dots" />
            </span>
          }
          size="md"
          isDark={isDark}
        />
      </div>
      <div className="space-y-4">
        {roundSummaries.length ? (
          roundSummaries.map((summary) => (
            <RoundSummaryCard
              key={summary.group.id}
              summary={summary}
              voteCounts={voteCounts}
              variant="host"
              isDark={isDark}
            />
          ))
        ) : (
          <p className="text-sm text-slate-500">
            No answers submitted this round.
          </p>
        )}
      </div>
    </Card>
  );
}
