import { Card, SessionTimer, AnswerCard } from "@social/ui";
import { useTheme } from "../../../shared/providers/ThemeProvider";
import type { Answer, RoundGroup, Vote } from "../../../shared/types";

interface VotePhaseProps {
  totalGroups: number;
  activeGroupIndex: number;
  activeGroup: RoundGroup | null;
  roundGroups: RoundGroup[];
  activeGroupAnswers: Answer[];
  voteCounts: Map<string, number>;
  activeGroupVote: string | null;
  handleHostVote: (answerId: string) => void;
  isSubmittingVote: boolean;
  roundSummaries: {
    group: RoundGroup;
    index: number;
    answers: Answer[];
    winners: Answer[];
  }[];
  sessionEndsAt: string | undefined;
  voteSecs: number;
  sessionPaused?: boolean;
  votes: Vote[];
  teams: any[];
  currentRoundIndex?: number;
}

export function VotePhase({
  totalGroups,
  activeGroupIndex,
  activeGroup,
  roundGroups, // receive roundGroups here
  activeGroupAnswers,
  voteCounts,
  activeGroupVote,
  handleHostVote,
  isSubmittingVote,
  roundSummaries,
  sessionEndsAt,
  voteSecs,
  sessionPaused = false,
  votes,
  teams,
  currentRoundIndex,
}: VotePhaseProps) {
  const { isDark } = useTheme();
  
  // Calculate voting participation stats
  const votingParticipation = {
    totalVoters: new Set(votes?.filter(v => v.roundIndex === currentRoundIndex).map(v => v.voterId) || []).size,
    totalPlayers: teams?.length || 0,
    votesPerGroup: roundGroups.map(group => ({
      groupId: group.id,
      voteCount: votes?.filter(v => v.groupId === group.id && v.roundIndex === currentRoundIndex).length || 0
    }))
  };
  return (
    <Card className="space-y-6" isDark={isDark}>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-brand-primary">
          Voting phase
        </span>
        <p className={`text-sm font-semibold uppercase tracking-wide ${!isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          {totalGroups
            ? `Group ${activeGroupIndex + 1} of ${totalGroups}`
            : "Waiting for groups"}
        </p>
        {activeGroup?.prompt ?? roundGroups[activeGroupIndex]?.prompt ? (
          <h3 className={`text-2xl font-bold text-brand-primary`}>
            {activeGroup?.prompt ?? roundGroups[activeGroupIndex]?.prompt}
          </h3>
        ) : (
          <div className="flex items-center gap-2">
            <svg className="animate-spin h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm text-cyan-300">Loading...</span>
          </div>
        )}
        <p className={`text-sm ${!isDark ? 'text-slate-600' : 'text-brand-primary'}`}>
          Everyone votes on the answers from this group.
        </p>
      </div>
      <SessionTimer
        endTime={sessionEndsAt}
        totalSeconds={voteSecs}
        paused={sessionPaused}
        label="Voting ends"
        size="md"
        isDark={isDark}
      />
      <div className="grid gap-4">
        {activeGroupAnswers.length ? (
          activeGroupAnswers.map((answer) => {
            const voteTotal = voteCounts.get(answer.id) ?? 0;
            const isSelected = activeGroupVote === answer.id;
            // Add teamId compatibility for UI
            const answerWithTeamId = {
              ...answer,
              teamId: answer.membershipId
            };
            return (
              <AnswerCard
                key={answer.id}
                answer={answerWithTeamId}
                voteCount={voteTotal}
                isSelected={isSelected}
                onClick={() => handleHostVote(answer.id)}
                disabled={isSubmittingVote}
                variant="host"
                isDark={isDark}
              />
            );
          })
        ) : (
          <p className={`text-sm font-medium ${!isDark ? 'text-slate-600' : 'text-slate-300'}`}>
            Waiting for answers from this group...
          </p>
        )}
      </div>
      <div className="elevated-card p-4">
        <h4 className={`text-xs font-semibold uppercase tracking-wide ${!isDark ? 'text-slate-700' : 'text-brand-primary'}`}>
          Group progress
        </h4>
        <ul className="mt-3 space-y-2 text-sm">
          {roundSummaries.map((summary) => {
            const answerCount = summary.answers.length;
            const voteTotal = summary.answers.reduce(
              (total, answer) => total + (voteCounts.get(answer.id) ?? 0),
              0,
            );
            const isCurrent = summary.group.id === activeGroup?.id;
            return (
              <li
                key={summary.group.id}
                className={`timer-elevated flex items-center justify-between px-4 py-3 ${
                  isCurrent
                    ? `${!isDark ? 'text-brand-primary' : 'text-cyan-400 neon-glow-cyan'}`
                    : `${!isDark ? 'text-slate-800' : 'text-slate-200'}`
                }`}
              >
                <span>
                  Group {summary.index + 1}
                  {isCurrent ? " • now voting" : ""}
                </span>
                <span>
                  {answerCount} answer{answerCount === 1 ? "" : "s"},{" "}
                  {voteTotal} vote{voteTotal === 1 ? "" : "s"}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
      
      {/* Voting Participation Stats */}
      <div className="elevated-card p-4">
        <h4 className={`text-xs font-semibold uppercase tracking-wide ${!isDark ? 'text-slate-700' : 'text-brand-primary'}`}>
          🎯 Voting Participation
        </h4>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
              Active Voters
            </span>
            <span className={`font-semibold ${isDark ? 'text-cyan-400' : 'text-brand-primary'}`}>
              {votingParticipation.totalVoters}/{votingParticipation.totalPlayers}
            </span>
          </div>
          <div className="flex justify-between">
            <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
              Participation Rate
            </span>
            <span className={`font-semibold ${isDark ? 'text-cyan-400' : 'text-brand-primary'}`}>
              {votingParticipation.totalPlayers > 0 
                ? Math.round((votingParticipation.totalVoters / votingParticipation.totalPlayers) * 100)
                : 0}%
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
