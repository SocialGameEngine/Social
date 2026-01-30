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
    if (!myAnswer) return 0;
    
    // Calculate actual points based on backend logic
    const voteCount = voteCounts.get(myAnswer.id) ?? 0;
    let actualPoints = voteCount; // Base: 1 point per vote
    
    // Check if team won their group
    const wonGroup = roundSummaries.some((summary) =>
      summary.winners.some((winner) => winner.id === myAnswer.id),
    );
    
    // Add 10-point group winner bonus for classic mode
    if (wonGroup) {
      actualPoints += 10;
    } else {
      // Check for second place bonus
      // Get all answers in the same group and sort by vote count
      const currentRound = session?.rounds?.[session.roundIndex];
      if (currentRound && currentRound.groups) {
        const myGroup = currentRound.groups.find(g => 
          g.teamIds && g.teamIds.some(teamId => {
            const teamAnswer = roundSummaries
              .flatMap(s => s.answers)
              .find(a => a.teamId === teamId && a.roundIndex === session.roundIndex);
            return teamAnswer?.id === myAnswer.id;
          })
        );
        
        if (myGroup) {
          // Get all answers in this group with their vote counts
          const groupAnswers = roundSummaries
            .flatMap(s => s.answers)
            .filter(a => a.groupId === myGroup.id && a.roundIndex === session.roundIndex);
          
          // Sort by vote count to find second place
          const sortedAnswers = groupAnswers
            .map(answer => ({
              answer,
              votes: voteCounts.get(answer.id) || 0
            }))
            .sort((a, b) => b.votes - a.votes);
          
          // Check if this answer is second (and has votes)
          if (sortedAnswers.length >= 2 && 
              sortedAnswers[1].answer.id === myAnswer.id && 
              sortedAnswers[1].votes > 0) {
            actualPoints += 5; // Second place bonus
          }
        }
      }
    }
    
    // Apply 100x display multiplier
    return actualPoints * 100;
  }, [myAnswer, voteCounts, roundSummaries, session]);

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
