// =============================================================================
// SOCIALE STATE HOOK
// =============================================================================
// Central hook for Sociale game state management.
// Based on useGameState.ts but for Sociales.

import { useMemo, useCallback, useState } from 'react';
import { SocialeStateMachine } from '../../domain/services/SocialeStateMachine';
import { 
  scoreRound, 
  buildRoundAnalytics 
} from '../../domain/sociale/roundRegistry';
import type { 
  UseSocialeStateReturn, 
  ApplicationSocialeState,
  SocialeStateConfig,
  SocialeStateError 
} from '../types/application.types';
import type { 
  Sociale, 
  SocialeRound, 
  SocialeRoundState,
  Socialite, 
  SocialeResponse, 
  SocialeVote,
  SocialeScoreEvent,
  SocialeScoreboardEntry,
  SocialeRoundSummary,
  SocialeRoundType,
} from '../../domain/types/sociale.types';

// Import existing hooks for data fetching (these will be implemented)
// import { useSociale, useSocialites, useSocialeResponses, useSocialeVotes } from '../../features/sociale/hooks';

/**
 * Central hook that replaces multiple useMemo hooks for Sociale state
 * Fetches raw data and computes derived state using domain services
 */
export function useSocialeState(config: SocialeStateConfig = {}): UseSocialeStateReturn {
  const { socialeId, userId } = config;
  
  // Error state
  const [error, setError] = useState<SocialeStateError | null>(null);

  // TODO: Replace with actual hooks when implemented
  // For now, use mock data
  const { sociale, loading: socialeLoading, hasSnapshot }: { sociale: Sociale | null; loading: boolean; hasSnapshot: boolean } = { sociale: null, loading: false, hasSnapshot: false };
  const rounds: SocialeRound[] = [];
  const socialites: Socialite[] = [];
  const responses: SocialeResponse[] = [];
  const votes: SocialeVote[] = [];
  const currentRoundState: SocialeRoundState | null = null;

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
  const gameState = useMemo((): ApplicationSocialeState => {
    try {
      // Basic state
      const isLoading = socialeLoading || !hasSnapshot;
      const typedSociale = sociale as Sociale | null;
      
      // Get current round
      const currentRound = typedSociale && typedSociale.currentRoundId 
        ? rounds.find(r => r.id === typedSociale.currentRoundId)
        : null;
      
      // Build scoreboard
      const scoreboard: SocialeScoreboardEntry[] = socialites
        .filter(s => s.isActive && !s.isBanned)
        .map((socialite, index) => ({
          socialiteId: socialite.id,
          displayName: socialite.displayName,
          mascotId: socialite.mascotId,
          score: socialite.score,
          rank: index + 1,
        }))
        .sort((a, b) => b.score - a.score)
        .map((socialite, index) => ({ ...socialite, rank: index + 1 }));
      
      // Build round summaries
      const roundSummaries: SocialeRoundSummary[] = rounds.map((round, index) => {
        const roundResponses = responses.filter(r => r.roundId === round.id);
        const roundVotes = votes.filter(v => v.roundId === round.id);
        
        // Count votes per response
        const voteCountByResponse = new Map<string, number>();
        roundVotes.forEach(vote => {
          const count = voteCountByResponse.get(vote.targetResponseId) ?? 0;
          voteCountByResponse.set(vote.targetResponseId, count + 1);
        });
        
        // Find top responses
        const topResponses = roundResponses
          .map(response => ({
            responseId: response.id,
            socialiteId: response.socialiteId,
            displayName: socialites.find(s => s.id === response.socialiteId)?.displayName ?? 'Unknown',
            value: response.value,
            voteCount: voteCountByResponse.get(response.id) ?? 0,
            scoreAwarded: response.scoreAwarded ?? 0,
          }))
          .sort((a, b) => b.voteCount - a.voteCount)
          .slice(0, 3);
        
        return {
          roundId: round.id,
          roundIndex: index,
          type: round.type,
          responseCount: roundResponses.length,
          voteCount: roundVotes.length,
          topResponses,
        };
      });
      
      // Build state machine context
      const context = SocialeStateMachine.buildContext(
        typedSociale, 
        socialites, 
        responses, 
        votes, 
        currentRoundState
      );
      
      // Phase-specific state
      const canAdvancePhase = false; // TODO: Implement proper phase advancement logic
      const canPauseSociale = typedSociale ? SocialeStateMachine.isPlayable(typedSociale) : false;
      const canResumeSociale = typedSociale ? typedSociale.status === 'paused' : false;

      // Timer state
      const timeRemaining = typedSociale?.phaseEndsAt 
        ? Math.max(0, new Date(typedSociale.phaseEndsAt).getTime() - Date.now()) 
        : null;
      const isTimedPhase = typedSociale ? SocialeStateMachine.isTimedPhase(context.currentPhase, context.currentRoundType) : false;

      // Progress tracking
      const roundProgress = typedSociale ? 
        (typedSociale.currentRoundIndex ?? 0) / Math.max((typedSociale.totalRounds ?? 1) - 1, 1) 
        : 0;
      
      // Phase progress (would need phase sequence from round type)
      const phaseProgress = 0; // TODO: Calculate based on current phase in sequence

      // User-specific state
      const currentSocialite = userId ? (socialites.find(s => s.userId === userId) ?? null) : null;
      
      return {
        // Base Sociale state
        sociale: typedSociale,
        rounds,
        currentRound,
        currentRoundState,
        socialites,
        responses,
        votes,
        scoreboard,
        roundSummaries,
        
        // Computed UI state
        isLoading,
        error: error?.message ?? null,
        
        // Phase-specific state
        canAdvancePhase,
        canPauseSociale,
        canResumeSociale,
        
        // Timer state
        timeRemaining,
        isTimedPhase,
        
        // Progress tracking
        roundProgress,
        phaseProgress,
        
        // User-specific state
        currentSocialite
      };
    } catch (err) {
      // Handle any errors in computation
      const gameStateError: SocialeStateError = {
        code: 'SOCIALE_STATE_COMPUTATION_ERROR',
        message: err instanceof Error ? err.message : 'Unknown error computing Sociale state',
        details: err
      };
      
      setError(gameStateError);
      
      // Return minimal safe state
      return {
        sociale: null,
        rounds: [],
        currentRound: null,
        currentRoundState: null,
        socialites: [],
        responses: [],
        votes: [],
        scoreboard: [],
        roundSummaries: [],
        isLoading: false,
        error: gameStateError.message,
        canAdvancePhase: false,
        canPauseSociale: false,
        canResumeSociale: false,
        timeRemaining: null,
        isTimedPhase: false,
        roundProgress: 0,
        phaseProgress: 0,
        currentSocialite: null
      };
    }
  }, [
    sociale, 
    socialeLoading, 
    hasSnapshot, 
    rounds, 
    socialites, 
    responses, 
    votes, 
    currentRoundState, 
    userId, 
    error
  ]);

  return {
    ...gameState,
    refresh,
    clearError
  };
}
