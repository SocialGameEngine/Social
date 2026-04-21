import { useEffect, useRef } from 'react';
import { useTTS } from '../../../shared/hooks/useTTS';
import type { Sociale, SocialeRound } from '../../../domain/types/sociale.types';
import type { VoiceProfile } from '../../../shared/services/voiceProfiles';

export function useTVAutoTTS(
  sociale: Sociale | null,
  currentRound: SocialeRound | null,
) {
  const voiceProfile = (sociale?.settings as any)?.voiceProfile as VoiceProfile | undefined;
  const { play } = useTTS({ profile: voiceProfile });
  
  const prevPhaseRef = useRef<string | null>(null);
  const prevRoundIdRef = useRef<string | null>(null);

  // Auto-announce on phase change
  useEffect(() => {
    if (!sociale?.currentPhase) return;
    if (sociale.currentPhase === prevPhaseRef.current) return;
    prevPhaseRef.current = sociale.currentPhase;

    const text = getPhaseText(sociale.currentPhase, currentRound?.type);
    if (text) void play(text);
  }, [sociale?.currentPhase, currentRound?.type, play]);

  // Auto-read prompt on round change (2s delay so phase announcement clears first)
  useEffect(() => {
    if (!currentRound?.id) return;
    if (currentRound.id === prevRoundIdRef.current) return;
    prevRoundIdRef.current = currentRound.id;

    const text = getPromptText(currentRound);
    if (!text) return;
    const timer = window.setTimeout(() => void play(text), 2000);
    return () => window.clearTimeout(timer);
  }, [currentRound?.id, play]);
}

function getPhaseText(phase: string, roundType?: string): string {
  switch (phase) {
    case 'lobby':   return 'Waiting for players to join.';
    case 'answer':  return roundType === 'trivia' ? 'Answer the trivia question now.' : 'Submit your response.';
    case 'vote':    return 'Vote for your favourite answer.';
    case 'results': return 'Here are the results.';
    case 'ended':   return 'The game is over. Thanks for playing!';
    default:        return '';
  }
}

function getPromptText(round: SocialeRound): string {
  const settings = round.settings as any;
  return settings?.snapshot?.prompt ?? round.content ?? round.title ?? '';
}
