import type { Answer, RoundGroup } from "../../shared/types";

export interface RoundSummary {
  group: RoundGroup;
  index: number;
  answers: Answer[];
  winners: Answer[];
}

type RoundSummaryCardVariant = "host" | "presenter";

interface RoundSummaryCardProps {
  summary: RoundSummary;
  voteCounts: Map<string, number>;
  variant?: RoundSummaryCardVariant;
  className?: string;
  isDark?: boolean;
}

export function RoundSummaryCard({
  summary,
  voteCounts,
  variant = "host",
  className = "",
  isDark = false,
}: RoundSummaryCardProps) {
  const maxGroupVotes = summary.answers.reduce(
    (max, answer) => Math.max(max, voteCounts.get(answer.id) ?? 0),
    0,
  );

  if (variant === "presenter") {
    return (
      <div className={`elevated-card p-6 ${className}`}>
        <div className="flex flex-col gap-1 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-[0.3em] ${!isDark ? 'text-slate-600' : 'text-brand-primary'}`}>
              Group {summary.index + 1}
            </p>
            <p className={`mt-1 text-2xl font-bold leading-tight ${!isDark ? 'text-slate-900' : 'text-pink-400'}`}>
              {summary.group.prompt}
            </p>
          </div>
          <div className={`text-xs font-semibold uppercase tracking-[0.3em] ${!isDark ? 'text-slate-600' : 'text-brand-primary'}`}>
            {summary.winners.length ? "Winning answers" : "No votes"}
          </div>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {summary.answers.length ? (
            summary.answers.map((answer) => {
              const votesForAnswer = voteCounts.get(answer.id) ?? 0;
              const isWinner = summary.winners.some(
                (winner) => winner.id === answer.id,
              );
              const points = votesForAnswer * 100 + (isWinner ? 1000 : 0);
              const percentage = maxGroupVotes
                ? Math.round((votesForAnswer / maxGroupVotes) * 100)
                : 0;
              return (
                <div
                  key={answer.id}
                  className={`rounded-2xl p-4 border ${
                    isWinner
                      ? `${!isDark ? 'bg-white text-slate-900 border-slate-200' : 'bg-slate-800/50 text-white border-slate-600'}`
                      : `${!isDark ? 'bg-slate-50 text-slate-700 border-slate-100' : 'bg-slate-700/30 text-slate-300 border-slate-500'}`
                  }`}
                >
                  <p className="text-lg font-semibold">{answer.text}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-2 flex-1 rounded-full bg-slate-300">
                      <div
                        className={`h-full rounded-full ${
                          isWinner ? "bg-amber-500" : "bg-slate-400"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-cyan-400">
                      +{points}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className={`rounded-2xl p-4 text-sm border ${!isDark ? 'bg-slate-50 text-slate-500 border-slate-100' : 'bg-slate-700/30 text-slate-400 border-slate-500'}`}>
              No answers submitted for this group.
            </div>
          )}
        </div>
      </div>
    );
  }

  // Host variant (default)
  return (
      <div className={`elevated-card p-5 ${className}`}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wide ${!isDark ? 'text-slate-500' : 'text-brand-primary'}`}>
            Group {summary.index + 1}
          </p>
          <p className={`text-sm font-semibold ${!isDark ? 'text-slate-900' : 'text-white'}`}>
            {summary.group.prompt}
          </p>
        </div>
        <div className={`text-xs font-semibold uppercase tracking-wide ${!isDark ? 'text-slate-500' : 'text-brand-primary'}`}>
          {summary.winners.length
            ? "Winning answers"
            : "No votes received"}
        </div>
      </div>
      <ul className="mt-4 space-y-2">
        {summary.answers.length ? (
          summary.answers.map((answer) => {
            const votesForAnswer = voteCounts.get(answer.id) ?? 0;
            const percentage = maxGroupVotes
              ? Math.round((votesForAnswer / maxGroupVotes) * 100)
              : 0;
            const isWinner = summary.winners.some(
              (winner) => winner.id === answer.id,
            );
            return (
              <li key={answer.id} className={`rounded-2xl p-4 border ${!isDark ? 'bg-white text-slate-900 border-slate-200' : 'bg-slate-800/50 text-white border-slate-600'}`}>
                <div className="flex items-start justify-between gap-4">
                  <p className={`font-semibold ${!isDark ? 'text-slate-900' : 'text-white'}`}>
                    {answer.text}
                    {isWinner && (
                      <span className="ml-2 rounded-full bg-brand-primary px-2 py-0.5 text-xs font-semibold text-white">
                        Winner
                      </span>
                    )}
                  </p>
                  <span className={`text-sm font-medium ${!isDark ? 'text-slate-600' : 'text-slate-300'}`}>
                    {votesForAnswer} vote{votesForAnswer === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full ${
                      isWinner ? "bg-brand-primary" : "bg-slate-400"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </li>
            );
          })
        ) : (
          <li className={`rounded-2xl px-4 py-3 text-sm border ${!isDark ? 'bg-slate-50 text-slate-500 border-slate-100' : 'bg-slate-700/30 text-slate-400 border-slate-500'}`}>
            No answers submitted for this group.
          </li>
        )}
      </ul>
    </div>
  );
}
