import { useMemo, useCallback, useState } from 'react';
import { VotingEngine, LeaderboardCalculator, SessionStateMachine, RoundManager } from '../../domain';
import type { 
  UseGameStateReturn, 
  ApplicationGameState, 
  GameStateConfig,
  GameStateError 
} from '../types/application.types';

// Import existing hooks for data fetching
import { useSession, useMemberships, useAnswers, useVotes } from '../../features/session/hooks';

/**
 * Central hook that replaces 10+ useMemo hooks across all pages
 * Fetches raw data and computes derived state using domain services
 */
export function useGameState(config: GameStateConfig = {}): UseGameStateReturn {
  const { sessionId, userId } = config;
  
  // Error state
  const [error, setError] = useState<GameStateError | null>(null);

  // Fetch raw data using existing hooks
  const { session, loading: sessionLoading, hasSnapshot } = useSession(sessionId);
  const memberships = useMemberships(sessionId);
  const answers = useAnswers(sessionId, session?.roundIndex);
  const votes = useVotes(sessionId, session?.roundIndex);

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Refresh function (triggers re-fetch of all data)
  const refresh = useCallback(() => {
    // This would trigger re-fetch through the underlying hooks
    // For now, just clear any errors
    clearError();
  }, [clearError]);

  // Computed game state using domain services
  const gameState = useMemo((): ApplicationGameState => {
    try {
      // Basic state
      const isLoading = sessionLoading || !hasSnapshot;
      
      // Domain service computations
      const voteCounts = VotingEngine.calculateVoteCounts(votes);
      // Players are stored in the memberships table; treat each team as a player
      const leaderboard = LeaderboardCalculator.calculate(memberships);
      const roundSummaries = session ? 
        VotingEngine.calculateRoundSummaries(
          RoundManager.getCurrentGroups(session.rounds, session.roundIndex),
          answers,
          votes
        ) : [];
      
      const currentRound = session ? 
        RoundManager.getCurrentRound(session.rounds, session.roundIndex) : null;
      const currentGroups = session ? 
        RoundManager.getCurrentGroups(session.rounds, session.roundIndex) : [];
      const activeVoteGroup = session ? 
        RoundManager.getActiveVoteGroup(session.rounds, session.roundIndex, session.voteGroupIndex) : null;

      // Build state machine context
      const context = SessionStateMachine.buildContext(session, memberships, answers, votes);
      
      // Phase-specific state
      const canAdvancePhase = session ? 
        SessionStateMachine.canTransition(session.status, SessionStateMachine.getNextPhase(session.status, context) || 'ended') : false;
      const canPauseSession = session ? SessionStateMachine.isPlayable(session) && !session.paused : false;
      const canResumeSession = session ? session.paused === true : false;

      // Timer state
      const timeRemaining = session?.endsAt ? 
        Math.max(0, new Date(session.endsAt).getTime() - Date.now()) : null;
      const isTimedPhase = session ? SessionStateMachine.isTimedPhase(session.status) : false;

      // Progress tracking
      const roundProgress = session ? 
        RoundManager.getRoundProgress(session.roundIndex, session.rounds.length) : 0;
      const votingProgress = session && session.voteGroupIndex !== null ? 
        RoundManager.getVotingProgress(session.voteGroupIndex, currentGroups.length) : 0;

      // User-specific state
      const userTeam = userId ? memberships.find(team => team.uid === userId) : null;
      const userTeamState = userTeam ? {
        id: userTeam.id,
        name: userTeam.playerName,
        score: 0, // RoomMembership doesn't have score
        rank: LeaderboardCalculator.findMembershipRank(userTeam.id, leaderboard),
        isInCurrentRound: currentGroups.some(group => group.teamIds.includes(userTeam.id)),
        hasAnswered: answers.some(answer => answer.membershipId === userTeam.id),
        hasVoted: votes.some(vote => vote.voterId === userTeam.id)
      } : null;

      return {
        // Base game state
        session,
        memberships,
        answers,
        votes,
        voteCounts,
        leaderboard,
        roundSummaries,
        currentRound,
        currentGroups,
        activeVoteGroup,
        
        // Computed UI state
        isLoading,
        error: error?.message ?? null,
        
        // Phase-specific state
        canAdvancePhase,
        canPauseSession,
        canResumeSession,
        
        // Timer state
        timeRemaining,
        isTimedPhase,
        
        // Progress tracking
        roundProgress,
        votingProgress,
        
        // User-specific state
        userTeam: userTeamState
      };
    } catch (err) {
      // Handle any errors in computation
      const gameStateError: GameStateError = {
        code: 'GAME_STATE_COMPUTATION_ERROR',
        message: err instanceof Error ? err.message : 'Unknown error computing game state',
        details: err
      };
      
      setError(gameStateError);
      
      // Return minimal safe state
      return {
        session: null,
        memberships: [],
        answers: [],
        votes: [],
        voteCounts: new Map(),
        leaderboard: [],
        roundSummaries: [],
        currentRound: null,
        currentGroups: [],
        activeVoteGroup: null,
        isLoading: false,
        error: gameStateError.message,
        canAdvancePhase: false,
        canPauseSession: false,
        canResumeSession: false,
        timeRemaining: null,
        isTimedPhase: false,
        roundProgress: 0,
        votingProgress: 0,
        userTeam: null
      };
    }
  }, [
    session, 
    sessionLoading, 
    hasSnapshot, 
    memberships, 
    answers, 
    votes, 
    userId, 
    error
  ]);

  return {
    ...gameState,
    refresh,
    clearError
  };
}
