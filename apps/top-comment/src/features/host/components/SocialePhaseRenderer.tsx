// =============================================================================
// SOCIALE PHASE RENDERER
// =============================================================================
// Renders the appropriate Sociale phase based on current state

import { useCallback, useEffect, useRef } from 'react';
import { useSociale } from '../../../features/sociale/hooks/useSociale';
import { useSocialites } from '../../../features/sociale/hooks/useSocialites';
import { useRoundResponses } from '../../../features/sociale/hooks/useSocialeResponses';
import { useRoundVotes } from '../../../features/sociale/hooks/useSocialeVotes';
import { useSocialeOrchestrator } from '../../../application/hooks/useSocialeOrchestrator';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../supabase/client';
import { 
  SocialeLobbyPhase,
  SocialeAnswerPhase,
  SocialeVotePhase,
  SocialeRevealPhase,
  SocialeResultsPhase,
  SocialeEndedPhase
} from '../SocialePhases';

interface SocialePhaseRendererProps {
  socialeId: string;
  userId?: string;
  isDark: boolean;
  onCreateNewSociale?: () => void;
  onReturnToLobby?: () => void;
}

export function SocialePhaseRenderer({ 
  socialeId, 
  userId, 
  isDark,
  onCreateNewSociale,
  onReturnToLobby,
}: SocialePhaseRendererProps) {
  // Prevent rendering if no socialeId provided
  if (!socialeId) {
    return (
      <div className="min-h-[360px] flex flex-col items-center justify-center gap-4">
        <div className="text-lg">No Sociale selected</div>
      </div>
    );
  }

  // WORKING VERSION: All hooks individually, no useMemo
  const { data: sociale, isLoading: socialeLoading } = useSociale(socialeId);
  const { data: socialites = [], isLoading: socialitesLoading } = useSocialites(socialeId);
  const currentRoundId = sociale?.currentRoundId;
  const { data: responses = [], isLoading: responsesLoading } = useRoundResponses(socialeId, currentRoundId ?? undefined);
  const { data: votes = [], isLoading: votesLoading } = useRoundVotes(socialeId, currentRoundId ?? undefined);
  
  // Add orchestrator for real actions with auto-advance enabled
  const orchestrator = useSocialeOrchestrator({ 
    socialeId, 
    autoAdvance: true, 
    enablePauseResume: true 
  });
  
  // Keep orchestrator in sync with current Sociale state
  useEffect(() => {
    if (sociale) {
      orchestrator.updateSociale(sociale);
    }
  }, [sociale, orchestrator.updateSociale]);
  
  // Temporary fix: Create basic rounds if none exist
  const createBasicRounds = useCallback(async () => {
    if (!socialeId) return;
    
    const basicRounds = [
      {
        id: crypto.randomUUID(),
        sociale_id: socialeId,
        type: 'custom',
        content: 'Round 1: Icebreaker',
        order_index: 0,
        phase_sequence: ['answer', 'vote', 'results'],
        settings: { answerSeconds: 60, voteSeconds: 30, resultsSeconds: 30 }
      },
      {
        id: crypto.randomUUID(),
        sociale_id: socialeId,
        type: 'custom', 
        content: 'Round 2: Would You Rather',
        order_index: 1,
        phase_sequence: ['answer', 'vote', 'results'],
        settings: { answerSeconds: 60, voteSeconds: 30, resultsSeconds: 30 }
      },
      {
        id: crypto.randomUUID(),
        sociale_id: socialeId,
        type: 'custom',
        content: 'Round 3: This or That',
        order_index: 2,
        phase_sequence: ['answer', 'vote', 'results'],
        settings: { answerSeconds: 60, voteSeconds: 30, resultsSeconds: 30 }
      }
    ];

    try {
      const { error } = await supabase
        .from('sociale_rounds')
        .insert(basicRounds);
      
      if (error) {
        console.error('Failed to create rounds:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error creating rounds:', error);
      throw error;
    }
  }, [socialeId]);
  
  const isAmbient = sociale?.mode === 'ambient';

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

  // Simple loading check without useMemo
  const isLoading = socialeLoading || (!isAmbient && roundsLoading) || socialitesLoading || responsesLoading || votesLoading;

  // Ambient mode: current round lives in runtime_state.ambientRound, not sociale_rounds
  const currentRound = isAmbient
    ? (sociale?.runtimeState?.ambientRound ?? null)
    : (rounds?.find((r: { id: string }) => r.id === sociale?.currentRoundId) ?? null);

  // Convert database Json type to expected Record<string, any> type for components
  const normalizedCurrentRound = currentRound ? {
    ...currentRound,
    settings: currentRound.settings as Record<string, any> || {}
  } : null;
  
  // Simple current socialite without useMemo (for players, not host)
  const currentSocialite = userId ? socialites.find(s => s.userId === userId) ?? null : null;

  // Host detection: User is host if they're the room owner (not a socialite)
  // TODO: Get room ownership from room context or membership
  const isRoomHost = Boolean(userId && userId === sociale?.createdBy); // Simplified for now

  // Extract orchestrator actions
  const {
    startSociale,
    advancePhase,
    skipRound,
    skipPhase
  } = orchestrator;

  // Wrap onStartSociale in useCallback to prevent infinite re-renders
  const handleStartSociale = useCallback(async () => {
    // Create rounds first if none exist
    if (!rounds || rounds.length === 0) {
      await createBasicRounds();
    }
    // Then start the Sociale
    startSociale();
  }, [rounds, createBasicRounds, startSociale]);

  // Prevent double-advancing the same phase (guards against Strict Mode double-invoke)
  const advancedPhaseRef = useRef<string | null>(null);

  // Auto-advance phases that the host panel skips: trivia vote → reveal, discussion → results.
  // Done in a useEffect to avoid calling advancePhase() during render.
  useEffect(() => {
    if (sociale?.status !== 'active') return;
    const phase = sociale.currentPhase || 'answer';
    const roundType = normalizedCurrentRound?.type;
    const key = `${sociale.currentRoundId ?? ''}-${phase}`;

    const shouldSkip =
      (phase === 'vote' && roundType === 'trivia') ||
      phase === 'discussion';

    if (shouldSkip && advancedPhaseRef.current !== key) {
      advancedPhaseRef.current = key;
      advancePhase();
    }
  }, [sociale?.status, sociale?.currentPhase, sociale?.currentRoundId, normalizedCurrentRound?.type, advancePhase]);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="min-h-[360px] flex flex-col items-center justify-center gap-4">
        <div className="text-lg">Loading Sociale...</div>
      </div>
    );
  }

  switch (sociale?.status) {
    case 'draft':
    case 'lobby':
      return (
        <SocialeLobbyPhase
          sociale={{
            id: sociale.id,
            title: sociale.title || undefined,
            description: sociale.description || undefined,
            phaseEndsAt: sociale.phaseEndsAt,
            settings: {
              totalRounds: sociale.settings?.answerSeconds || 5,
              mode: 'custom'
            }
          }}
          socialites={socialites}
          currentSocialite={currentSocialite}
          onStartSociale={handleStartSociale}
          onCreateSociale={() => {}}
          onLoadSociale={() => {}}
          onSettings={() => {}}
          onCloseSociale={() => {}}
          isCurrentPlayerHost={isRoomHost}
          isDark={isDark}
        />
      );

    case 'paused':
    case 'active': {
      // Use canonical Sociale field so phase switches actually re-render.
      // `runtimeState.currentPhase` can be stale/undefined, which keeps the UI
      // stuck in the previous phase (e.g. answer timer appears to reset).
      const currentPhase = sociale.currentPhase || 'answer';

      // Treat setup and question phases as answer phases for UI purposes
      // (edge functions note: "UI treats `setup`/`question` as the 'answer-like' phase for timing")
      const isPaused = sociale.status === 'paused';

      const socialeTimerProps = {
        id: sociale.id,
        roomId: sociale.roomId,
        currentRoundId: sociale.currentRoundId || undefined,
        phaseEndsAt: sociale.phaseEndsAt,
        pausedRemainingSeconds: sociale.pausedRemainingSeconds,
        currentPhase,
      };

      if (currentPhase === 'setup' || currentPhase === 'question' || currentPhase === 'answer') {
        return (
          <SocialeAnswerPhase
            sociale={socialeTimerProps}
            currentRound={normalizedCurrentRound}
            socialites={socialites}
            responses={responses}
            currentSocialite={currentSocialite}
            onAdvancePhase={advancePhase}
            onSkipPhase={skipPhase}
            onSkipRound={skipRound}
            isCurrentPlayerHost={isRoomHost}
            isPaused={isPaused}
            isDark={isDark}
          />
        );
      } else if (currentPhase === 'vote') {
        // Trivia skips vote phase — useEffect handles the advance to reveal
        if (normalizedCurrentRound?.type === 'trivia') {
          return null;
        }
        return (
          <SocialeVotePhase
            sociale={socialeTimerProps}
            currentRound={normalizedCurrentRound}
            socialites={socialites}
            responses={responses}
            votes={votes}
            currentSocialite={currentSocialite}
            onAdvancePhase={advancePhase}
            isCurrentPlayerHost={isRoomHost}
            isPaused={isPaused}
            isDark={isDark}
          />
        );
      } else if (currentPhase === 'reveal') {
        return (
          <SocialeRevealPhase
            sociale={socialeTimerProps}
            currentRound={normalizedCurrentRound}
            socialites={socialites}
            responses={responses}
            votes={votes}
            currentSocialite={currentSocialite}
            onAdvancePhase={advancePhase}
            onSkipPhase={skipPhase}
            onSkipRound={skipRound}
            isCurrentPlayerHost={isRoomHost}
            isPaused={isPaused}
            isDark={isDark}
          />
        );
      } else if (currentPhase === 'results') {
        return (
          <SocialeResultsPhase
            sociale={socialeTimerProps}
            currentRound={normalizedCurrentRound}
            socialites={socialites}
            responses={responses}
            votes={votes}
            currentSocialite={currentSocialite}
            onAdvancePhase={advancePhase}
            isCurrentPlayerHost={isRoomHost}
            isPaused={isPaused}
            isDark={isDark}
          />
        );
      } else if (currentPhase === 'discussion') {
        // Discussion phase is skipped — useEffect handles the advance to results
        return null;
      } else if (currentPhase === 'break') {
        // P1-8 — while the intermission is active, show a reminder in the host
        // view. Full break controls live in HostSignalsToolbar so they're
        // available from anywhere in the flow.
        return (
          <div className="min-h-[360px] flex flex-col items-center justify-center gap-4 text-center">
            <div className="text-3xl font-black">Intermission in progress</div>
            <div className="text-sm text-slate-400">
              Hit "Resume" on the Signals toolbar when ready to continue.
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-[360px] flex flex-col items-center justify-center gap-4">
          <div className="text-lg">Unknown phase: {currentPhase}</div>
        </div>
      );
    }

    case 'completed':
    case 'cancelled':
      return (
        <SocialeEndedPhase
          sociale={{
            id: sociale.id,
            title: sociale.title || undefined,
            description: sociale.description || undefined,
            settings: {
              totalRounds: sociale.settings?.answerSeconds || 5,
              mode: 'custom'
            }
          }}
          socialites={socialites}
          currentSocialite={currentSocialite}
          onCreateNewSociale={onCreateNewSociale ?? (() => {})}
          onReturnToLobby={onReturnToLobby ?? (() => {})}
          isCurrentPlayerHost={isRoomHost}
          isDark={isDark}
        />
      );

    default:
      return (
        <div className="min-h-[360px] flex flex-col items-center justify-center gap-4">
          <div className="text-lg">Unknown Sociale status: {sociale?.status}</div>
          <div className="text-sm opacity-50">Debug Info:</div>
          <div className="text-xs opacity-50">Status: {sociale?.status || 'unknown'}</div>
          <div className="text-xs opacity-50">Current Round: {currentRound?.type || 'none'}</div>
          <div className="text-xs opacity-50">Socialites: {socialites.length}</div>
          <div className="text-xs opacity-50">Current User: {currentSocialite?.displayName || 'not found'}</div>
        </div>
      );
  }
}

// Original code (commented out for now):
/*
  const orchestrator = useSocialeOrchestrator({ socialeId });
  
  // Extract data from game state
  const {
    sociale,
    currentRound,
    socialites,
    responses,
    votes,
    currentSocialite
  } = gameState;

  // Extract orchestrator actions
  const {
    startSociale,
    advancePhase,
    skipRound,
    skipPhase
  } = orchestrator;
  
  // Note: pauseSociale and resumeSociale available but not currently used in phase rendering
  // const { pauseSociale, resumeSociale } = orchestrator;

  // Determine if current user is host
  const isCurrentPlayerHost = currentSocialite?.isHost ?? false;

  // Render phase based on current phase
  switch (sociale.status) {
    case 'draft':
    case 'lobby':
      return (
        <SocialeLobbyPhase
          sociale={{
            id: sociale.id,
            title: sociale.title || undefined,
            description: sociale.description || undefined,
            phaseEndsAt: sociale.phaseEndsAt,
            settings: {
              totalRounds: sociale.settings?.answerSeconds || 5,
              mode: 'custom'
            }
          }}
          socialites={socialites}
          currentSocialite={currentSocialite}
          onStartSociale={startSociale}
          isCurrentPlayerHost={isCurrentPlayerHost}
          isDark={isDark}
        />
      );

    case 'active':
      // Use canonical Sociale field so phase switches actually re-render.
      const currentPhase = sociale.currentPhase || 'answer';
      
      if (currentPhase === 'answer') {
        return (
          <SocialeAnswerPhase
            sociale={{
              id: sociale.id,
              currentRoundId: sociale.currentRoundId || undefined,
              phaseEndsAt: sociale.phaseEndsAt,
              currentPhase
            }}
            currentRound={normalizedCurrentRound}
            socialites={socialites}
            responses={responses}
            currentSocialite={currentSocialite}
            onAdvancePhase={advancePhase}
            onSkipPhase={skipPhase}
            onSkipRound={skipRound}
            isCurrentPlayerHost={isCurrentPlayerHost}
            isDark={isDark}
          />
        );
      } else if (currentPhase === 'vote') {
        return (
          <SocialeVotePhase
            sociale={{
              id: sociale.id,
              currentRoundId: sociale.currentRoundId || undefined,
              phaseEndsAt: sociale.phaseEndsAt,
              currentPhase
            }}
            currentRound={normalizedCurrentRound}
            socialites={socialites}
            responses={responses}
            votes={votes}
            currentSocialite={currentSocialite}
            onAdvancePhase={advancePhase}
            isCurrentPlayerHost={isCurrentPlayerHost}
            isDark={isDark}
          />
        );
      } else if (currentPhase === 'results') {
        return (
          <SocialeResultsPhase
            sociale={{
              id: sociale.id,
              currentRoundId: sociale.currentRoundId || undefined,
              phaseEndsAt: sociale.phaseEndsAt,
              currentPhase
            }}
            currentRound={normalizedCurrentRound}
            socialites={socialites}
            responses={responses}
            votes={votes}
            currentSocialite={currentSocialite}
            onAdvancePhase={advancePhase}
            isCurrentPlayerHost={isCurrentPlayerHost}
            isDark={isDark}
          />
        );
      }
      break;

    case 'completed':
    case 'cancelled':
      return (
        <SocialeEndedPhase
          sociale={{
            id: sociale.id,
            title: sociale.title || undefined,
            description: sociale.description || undefined,
            settings: {
              totalRounds: sociale.settings?.answerSeconds || 5,
              mode: 'custom'
            }
          }}
          socialites={socialites}
          currentSocialite={currentSocialite}
          onAdvancePhase={advancePhase}
          isCurrentPlayerHost={isCurrentPlayerHost}
          isDark={isDark}
        />
      );

    case 'cancelled':
      return (
        <SocialeEndedPhase
          sociale={{
            id: sociale.id,
            title: sociale.title || undefined,
            description: 'Game was cancelled',
            endedAt: sociale.endedAt,
            settings: {
              totalRounds: sociale.settings?.answerSeconds || 5,
              mode: 'custom'
            }
          }}
          socialites={socialites}
          currentSocialite={currentSocialite}
          onCreateNewSociale={() => {
            // TODO: Create new Sociale functionality
          }}
          onReturnToLobby={() => {
            // TODO: Return to lobby functionality
          }}
          isCurrentPlayerHost={isCurrentPlayerHost}
          isDark={isDark}
        />
      );

    default:
      return (
        <div className="min-h-[360px] flex flex-col items-center justify-center gap-4">
          <div className="text-lg">Unknown phase: {sociale.status}</div>
        </div>
      );
  }
  */
