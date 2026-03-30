// =============================================================================
// SOCIALE PHASE RENDERER
// =============================================================================
// Renders the appropriate Sociale phase based on current state

import { useCallback } from 'react';
import { useSociale } from '../../../features/sociale/hooks/useSociale';
import { useSocialites } from '../../../features/sociale/hooks/useSocialites';
import { useSocialeResponses } from '../../../features/sociale/hooks/useSocialeResponses';
import { useSocialeVotes } from '../../../features/sociale/hooks/useSocialeVotes';
import { useSocialeOrchestrator } from '../../../application/hooks/useSocialeOrchestrator';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../supabase/client';
import { 
  SocialeLobbyPhase,
  SocialeAnswerPhase,
  SocialeVotePhase,
  SocialeResultsPhase,
  SocialeEndedPhase
} from '../SocialePhases';

interface SocialePhaseRendererProps {
  socialeId: string;
  userId?: string;
  isDark: boolean;
}

export function SocialePhaseRenderer({ 
  socialeId, 
  userId, 
  isDark 
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
  const { data: responses = [], isLoading: responsesLoading } = useSocialeResponses(socialeId);
  const { data: votes = [], isLoading: votesLoading } = useSocialeVotes(socialeId);
  
  // Add orchestrator for real actions
  const orchestrator = useSocialeOrchestrator({ socialeId });
  
  // Temporary fix: Create basic rounds if none exist
  const createBasicRounds = useCallback(async () => {
    if (!socialeId) return;
    
    console.log('Creating basic rounds for Sociale...');
    
    const basicRounds = [
      {
        id: crypto.randomUUID(),
        sociale_id: socialeId,
        type: 'custom',
        content: 'Round 1: Icebreaker',
        order_index: 0,
        phase_sequence: ['answer', 'vote', 'results'],
        settings: { answerSeconds: 60, voteSeconds: 30 }
      },
      {
        id: crypto.randomUUID(),
        sociale_id: socialeId,
        type: 'custom', 
        content: 'Round 2: Would You Rather',
        order_index: 1,
        phase_sequence: ['answer', 'vote', 'results'],
        settings: { answerSeconds: 60, voteSeconds: 30 }
      },
      {
        id: crypto.randomUUID(),
        sociale_id: socialeId,
        type: 'custom',
        content: 'Round 3: This or That',
        order_index: 2,
        phase_sequence: ['answer', 'vote', 'results'],
        settings: { answerSeconds: 60, voteSeconds: 30 }
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
      
      console.log('Successfully created basic rounds');
    } catch (error) {
      console.error('Error creating rounds:', error);
      throw error;
    }
  }, [socialeId]);
  
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
    enabled: !!socialeId,
  });

  // Simple loading check without useMemo
  const isLoading = socialeLoading || roundsLoading || socialitesLoading || responsesLoading || votesLoading;
  
  // Simple current round calculation without useMemo
  const currentRound = rounds?.find((r: { id: string }) => r.id === sociale?.currentRoundId) ?? null;
  
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

  // Handle loading state
  if (isLoading) {
    return (
      <div className="min-h-[360px] flex flex-col items-center justify-center gap-4">
        <div className="text-lg">Loading Sociale...</div>
      </div>
    );
  }

  // WORKING: Render actual phases based on Sociale status
  // DEBUG: Add debug info to see what's happening
  console.log('SocialePhaseRenderer Debug:', {
    socialeId,
    socialeStatus: sociale?.status,
    socialitesCount: socialites.length,
    roundsCount: rounds?.length || 0,
    currentSocialite,
    isRoomHost,
    hasSociale: !!sociale,
    orchestratorActions: !!startSociale,
    createdBy: sociale?.createdBy,
    currentUserId: userId
  });

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
          onCreateSociale={() => console.log('Create new Sociale')}
          onLoadSociale={() => console.log('Load existing Sociale')}
          onSettings={() => console.log('Open Sociale settings')}
          onCloseSociale={() => console.log('Close Sociale')}
          isCurrentPlayerHost={isRoomHost}
          isDark={isDark}
        />
      );

    case 'active':
      // Check current phase from runtime state
      const currentPhase = (sociale as any).runtimeState?.currentPhase || 'answer';
      
      if (currentPhase === 'answer') {
        return (
          <SocialeAnswerPhase
            sociale={{
              id: sociale.id,
              currentRoundId: sociale.currentRoundId || undefined,
              phaseEndsAt: sociale.phaseEndsAt,
              currentPhase
            }}
            currentRound={currentRound}
            socialites={socialites}
            responses={responses}
            currentSocialite={currentSocialite}
            onAdvancePhase={advancePhase}
            onSkipPhase={skipPhase}
            onSkipRound={skipRound}
            isCurrentPlayerHost={isRoomHost}
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
            currentRound={currentRound}
            socialites={socialites}
            responses={responses}
            votes={votes}
            currentSocialite={currentSocialite}
            onAdvancePhase={advancePhase}
            isCurrentPlayerHost={isRoomHost}
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
            currentRound={currentRound}
            socialites={socialites}
            responses={responses}
            votes={votes}
            currentSocialite={currentSocialite}
            onAdvancePhase={advancePhase}
            isCurrentPlayerHost={isRoomHost}
            isDark={isDark}
          />
        );
      }
      
      return (
        <div className="min-h-[360px] flex flex-col items-center justify-center gap-4">
          <div className="text-lg">Unknown phase: {currentPhase}</div>
        </div>
      );

    case 'completed':
    case 'ended':
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
          onCreateNewSociale={() => console.log('Create new Sociale')}
          onReturnToLobby={() => console.log('Return to lobby')}
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
      // Check current phase from runtime state
      const currentPhase = (sociale as any).runtimeState?.currentPhase || 'answer';
      
      if (currentPhase === 'answer') {
        return (
          <SocialeAnswerPhase
            sociale={{
              id: sociale.id,
              currentRoundId: sociale.currentRoundId || undefined,
              phaseEndsAt: sociale.phaseEndsAt,
              currentPhase
            }}
            currentRound={currentRound}
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
            currentRound={currentRound}
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
            currentRound={currentRound}
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
    case 'ended':
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
            console.log('Create new Sociale');
          }}
          onReturnToLobby={() => {
            // TODO: Return to lobby functionality
            console.log('Return to lobby');
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
