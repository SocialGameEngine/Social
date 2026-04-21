import { useMemo } from 'react';
import type { Sociale, SocialeRound, SocialeResponse } from '../../../domain/types/sociale.types';

export function useTVPresenterTTS(
  sociale: Sociale | null,
  currentRound: SocialeRound | null,
  responses: SocialeResponse[]
) {
  const phaseAnnouncementText = useMemo(() => {
    if (!sociale) return '';
    switch (sociale.currentPhase) {
      case 'lobby': return 'Waiting for players to join.';
      case 'answer': return currentRound?.type === 'trivia'
        ? 'Answer the trivia question now.'
        : 'Submit your response.';
      case 'vote': return 'Vote for your favourite answer.';
      case 'results': return 'Here are the results.';
      case 'ended': return 'The game is over. Thanks for playing!';
      default: return '';
    }
  }, [sociale?.currentPhase, currentRound?.type]);

  const promptAnnouncementText = useMemo(() => {
    if (!currentRound) return '';
    const settings = currentRound.settings as any;
    return settings?.snapshot?.prompt ?? currentRound.content ?? currentRound.title ?? '';
  }, [currentRound]);

  return { phaseAnnouncementText, promptAnnouncementText };
}
