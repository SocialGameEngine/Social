// =============================================================================
// SOCIALE GAME STATE HOOK
// =============================================================================
// Central hook for Sociale state management - equivalent to useGameState
// Combines all Sociale data sources into a single computed state

import { useMemo, useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SocialeStateMachine } from '../../domain/services/SocialeStateMachine';
import { supabase } from '../../supabase/client';
import { 
  getRoundTypeDefinition,
  getDefaultPhases,
  isFinalPhase,
  getPhaseDuration
} from '../../domain/sociale/roundRegistry';
import type { 
  UseSocialeStateReturn,
  ApplicationSocialeState,
  SocialeStateConfig,
  SocialeGameStateError
} from '../types/application.types';
// Types imported for hook return types and type safety
// Note: Some types imported but not directly used in this hook
// They are used by the data fetching hooks and return types
import type { 
  Sociale,
  SocialeRound,
  SocialeRoundState,
  Socialite,
  SocialeResponse,
  SocialeVote,
  SocialeRoundType
} from '../../domain/types/sociale.types';

// Import existing Sociale hooks for data fetching
import { useSociale } from '../../features/sociale/hooks/useSociale';
import { useSocialites } from '../../features/sociale/hooks/useSocialites';
import { useSocialeResponses } from '../../features/sociale/hooks/useSocialeResponses';
import { useSocialeVotes } from '../../features/sociale/hooks/useSocialeVotes';

/**
 * Central hook that combines all Sociale data sources
 * Fetches raw data and computes derived state using domain services
 */
export function useSocialeGameState(config: SocialeStateConfig = {}): UseSocialeStateReturn {
  const { socialeId, userId } = config;
  
  // Error state
  const [error, setError] = useState<SocialeGameStateError | null>(null);

  // Fetch raw data using existing hooks
  const { data: sociale, isLoading: socialeLoading } = useSociale(socialeId);
  const { data: socialites = [], isLoading: socialitesLoading } = useSocialites(socialeId);
  const { data: responses = [], isLoading: responsesLoading } = useSocialeResponses(socialeId);
  const { data: votes = [], isLoading: votesLoading } = useSocialeVotes(socialeId);

  const isAmbient = sociale?.mode === 'ambient';

  // Fetch rounds using Supabase client (skipped for ambient — no sociale_rounds rows)
  const { data: rounds, isLoading: roundsLoading } = useQuery({
    queryKey: ['sociale-rounds', socialeId],
    queryFn: async () => {
      if (!socialeId) return [];

      const { data, error } = await supabase
        .from('sociale_rounds')
        .select('*')
        .eq('sociale_id', socialeId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!socialeId && !isAmbient,
  });

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
      // Track if we have initial snapshot (moved inside useMemo)
      const hasSnapshot = !socialeLoading && sociale !== undefined;
      
      // Basic loading state (ambient doesn't wait on roundsLoading — no sociale_rounds to fetch)
      const isLoading = socialeLoading || (!isAmbient && roundsLoading) || socialitesLoading || responsesLoading || votesLoading || !hasSnapshot;
      
      // Current round — ambient reads from runtime_state, regular modes find by ID in rounds array
      const currentRound = isAmbient
        ? ((sociale?.runtimeState?.ambientRound as SocialeRound | null) ?? null)
        : (rounds?.find((r: { id: string }) => r.id === sociale?.currentRoundId) ?? null);
      const currentRoundState = currentRound ? null : null; // Would fetch round state
      
      // Scoreboard calculation
      const scoreboard = socialites
        .filter(s => s.isActive && !s.isBanned)
        .map(s => ({
          socialiteId: s.id,
          displayName: s.displayName,
          mascotId: s.mascotId,
          score: s.score,
          rank: 0 // Would calculate rank
        }))
        .sort((a, b) => b.score - a.score)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));

      // Round summaries
      const roundSummaries = (rounds || []).map(round => {
        const roundResponses = (responses || []).filter((r: SocialeResponse) => r.roundId === round.id);
        const roundVotes = (votes || []).filter((v: SocialeVote) => v.roundId === round.id);
        const responseCounts = roundResponses.reduce((acc, r) => {
          const votesForResponse = roundVotes.filter((v: SocialeVote) => v.targetResponseId === r.id).length;
          return acc + votesForResponse;
        }, 0);

        return {
          roundId: round.id,
          roundIndex: round.order_index,
          type: round.type,
          responseCount: roundResponses.length,
          voteCount: roundVotes.length,
          topResponses: [] // Would calculate top responses
        };
      });

      // Current socialite for this user
      const currentSocialite = userId ? socialites.find(s => s.userId === userId) ?? null : null;

      // Phase-specific state
      const canAdvancePhase = false; // TODO: Implement phase advancement logic
      const canPauseSociale = sociale?.status === 'active';
      const canResumeSociale = sociale?.status === 'paused';

      // Timer state (temporarily disabled to fix infinite loop)
      const timeRemaining = null; // TODO: Add proper timer implementation
      
      const isTimedPhase = sociale?.phaseEndsAt !== null;

      // Progress tracking
      const roundProgress = sociale && (rounds?.length || 0) > 0 
        ? (sociale.currentRoundIndex ?? 0) / (rounds?.length || 1) 
        : 0;
      
      const phaseProgress = currentRound && sociale?.currentPhase
        ? getDefaultPhases(currentRound.type as SocialeRoundType).indexOf(sociale.currentPhase) / getDefaultPhases(currentRound.type as SocialeRoundType).length
        : 0;

      return {
        // Raw data
        sociale: sociale ?? null,
        rounds: rounds || [],
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
      setError({
        type: 'state_computation',
        message: err instanceof Error ? err.message : 'Failed to compute game state',
        details: err
      });
      
      // Return safe default state
      return {
        // Raw data
        sociale: null,
        rounds: [],
        currentRound: null,
        currentRoundState: null,
        socialites: [],
        responses: [],
        votes: [],
        scoreboard: [],
        roundSummaries: [],
        
        // Computed UI state
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to compute game state',
        
        // Phase-specific state
        canAdvancePhase: false,
        canPauseSociale: false,
        canResumeSociale: false,
        
        // Timer state
        timeRemaining: null,
        isTimedPhase: false,
        
        // Progress tracking
        roundProgress: 0,
        phaseProgress: 0,
        
        // User-specific state
        currentSocialite: null
      };
    }
  }, [
    sociale?.id, // Only track ID, not the entire object
    socialeLoading,
    rounds?.length, // Only track length, not entire array
    roundsLoading,
    socialites?.length, // Only track length, not entire array
    socialitesLoading,
    responses?.length, // Only track length, not entire array
    responsesLoading,
    votes?.length, // Only track length, not entire array
    votesLoading,
    userId,
    error
  ]);

  return {
    ...gameState,
    refresh,
    clearError
  };
}
