import { useMemo } from "react";
import type { Session, RoundGroup, Answer, RoundSummary } from "../../domain/types/domain.types";

interface UseVoteCalculationsProps {
  session: Session;
  now: number;
  activeGroup: RoundGroup;
  activeGroupAnswers: Answer[];
  voteCounts: Map<string, number>;
  myAnswer?: Answer;
  roundSummaries?: RoundSummary[];
}

/**
 * Shared voting calculations hook
 * Provides common voting logic across all session views
 */
export function useVoteCalculations({
  session,
  now,
  activeGroup,
  activeGroupAnswers,
  voteCounts,
  myAnswer,
  roundSummaries,
}: UseVoteCalculationsProps) {
  const voteSummaryActive = useMemo(() => {
    // Game state should depend on session status and pause flag, not timer
    if (session?.status !== "vote") return false;
    if (session?.paused) return false; // Don't show vote summary when paused
    
    // For vote phase, show summary after voting period ends OR if timer is complete
    if (!session?.endsAt) return true; // If no timer, show summary immediately
    const endsAtTime = new Date(session.endsAt).getTime();
    const isActive = now >= endsAtTime;
    
    return isActive;
  }, [session?.status, session?.paused, session?.endsAt, now]);

  const activeGroupWinnerIds = useMemo(() => {
    if (!activeGroup) return new Set<string>();
    const winners = new Set<string>();
    let maxVotes = 0;
    activeGroupAnswers.forEach((answer) => {
      const votesForAnswer = voteCounts.get(answer.id) ?? 0;
      if (votesForAnswer > maxVotes) {
        maxVotes = votesForAnswer;
        winners.clear();
        if (votesForAnswer > 0) {
          winners.add(answer.id);
        }
      } else if (votesForAnswer === maxVotes && votesForAnswer > 0) {
        winners.add(answer.id);
      }
    });
    return winners;
  }, [activeGroup, activeGroupAnswers, voteCounts]);

  const votesForMe = useMemo(() => {
    if (!myAnswer) return 0;
    return voteCounts.get(myAnswer.id) ?? 0;
  }, [myAnswer, voteCounts]);

  const myRoundPoints = useMemo(() => {
    if (!myAnswer || !roundSummaries) return 0;
    const basePoints = (voteCounts.get(myAnswer.id) ?? 0) * 100;
    const wonGroup = roundSummaries.some((summary) =>
      summary.winners.some((winner) => winner.answer.id === myAnswer.id),
    );
    return basePoints + (wonGroup ? 1000 : 0);
  }, [myAnswer, voteCounts, roundSummaries]);

  return {
    voteSummaryActive,
    activeGroupWinnerIds,
    votesForMe,
    myRoundPoints,
  };
}
