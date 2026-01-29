import { useMemo } from "react";
import type { Session, RoundGroup, Vote } from "../../../shared/types";
import type { RoundSummary } from "../../../application/utils/transformers";

interface UseTeamComputationsProps {
  // Basic derived state props
  sessionId: string | null;
  session: Session | null;
  endedSession: Session | null;
  authLoading: boolean;
  autoJoinAttempted: boolean;
  hasManuallyLeft: boolean;
  teamSession: { sessionId: string; code: string; teamName: string } | null;
  isJoining: boolean;
  sessionSnapshotReady: boolean;
  
  // Derived calculations props
  currentTeam: any;
  roundGroups: RoundGroup[];
  activeGroup: RoundGroup | null;
  activeGroupAnswers: any[];
  voteCounts: Map<string, number>;
  votes: Vote[];
  myAnswer: any;
  roundSummaries: RoundSummary[];
  teams: any[];
}

export function useTeamComputations({
  // Basic derived state
  sessionId,
  session,
  endedSession,
  authLoading,
  autoJoinAttempted,
  hasManuallyLeft,
  teamSession,
  isJoining,
  sessionSnapshotReady,
  
  // Derived calculations
  currentTeam,
  roundGroups,
  activeGroup,
  activeGroupAnswers,
  voteCounts,
  votes,
  myAnswer,
  roundSummaries,
}: UseTeamComputationsProps) {
  // Basic derived state computations
  const showingJoinScreen = useMemo(() => {
    return !sessionId || (!session && !endedSession);
  }, [sessionId, session, endedSession]);

  const leaderboardActive = useMemo(() => {
    return (
      session?.status === "results" ||
      session?.status === "ended" ||
      (!session && !!endedSession)
    );
  }, [session?.status, session, endedSession]);

  const phasesWithBackground = useMemo(() => {
    return new Set(["lobby", "answer", "vote", "results", "ended"]);
  }, []);

  const showBackground = useMemo(() => {
    return (
      showingJoinScreen ||
      (session && phasesWithBackground.has(session.status)) ||
      (!session && !!endedSession)
    );
  }, [showingJoinScreen, session, phasesWithBackground, endedSession]);

  const canAutoJoin = useMemo(() => {
    return (
      !authLoading &&
      !autoJoinAttempted &&
      !hasManuallyLeft &&
      !!teamSession &&
      !isJoining &&
      !sessionId
    );
  }, [authLoading, autoJoinAttempted, hasManuallyLeft, teamSession, isJoining, sessionId]);

  const isLoading = useMemo(() => {
    return authLoading || isJoining || !sessionSnapshotReady;
  }, [authLoading, isJoining, sessionSnapshotReady]);

  // Derived calculations
  const myGroup = useMemo(() => {
    if (!currentTeam || !roundGroups.length) return null;
    return (
      roundGroups.find((group) => group.teamIds.includes(currentTeam.id)) ??
      null
    );
  }, [roundGroups, currentTeam]);

  const myVotesByGroup = useMemo(() => {
    const map = new Map<string, Vote>();
    if (!currentTeam) {
      return map;
    }
    votes.forEach((vote) => {
      if (vote.voterId === currentTeam.id) {
        map.set(vote.groupId, vote);
      }
    });
    return map;
  }, [votes, currentTeam]);

  const myActiveVote = useMemo(() => {
    if (!activeGroup) return null;
    return myVotesByGroup.get(activeGroup.id) ?? null;
  }, [myVotesByGroup, activeGroup]);

  const isVotingOnOwnGroup = useMemo(() => {
    return session?.status === "vote" && 
           activeGroup !== null && 
           myGroup !== null && 
           activeGroup.id === myGroup.id;
  }, [session?.status, activeGroup, myGroup]);

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
    if (!myAnswer || !currentTeam) return 0;

    const ANSWER_VALUE = 50;
    const ALIGNMENT_VALUE = 10;
    const SCORE_MULTIPLIER = 100;

    const votesForAnswer = voteCounts.get(myAnswer.id) ?? 0;
    const answerPoints = votesForAnswer * ANSWER_VALUE;

    let alignmentPoints = 0;
    const myVote = votes.find((vote) => vote.voterId === currentTeam.id);
    if (myVote && myVote.answerId && myVote.answerId !== myAnswer.id) {
      const alignment = voteCounts.get(myVote.answerId) ?? 0;
      alignmentPoints = alignment * ALIGNMENT_VALUE;
    }

    return (answerPoints + alignmentPoints) * SCORE_MULTIPLIER;
  }, [myAnswer, currentTeam, voteCounts, votes]);

  return {
    // Basic derived state
    showingJoinScreen,
    leaderboardActive,
    showBackground,
    canAutoJoin,
    isLoading,
    
    // Derived calculations
    myGroup,
    myActiveVote,
    isVotingOnOwnGroup,
    activeGroupWinnerIds,
    votesForMe,
    myRoundPoints,
    roundSummaries,
  };
}
