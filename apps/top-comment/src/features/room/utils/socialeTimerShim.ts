import type { Sociale } from '../../../domain/types/sociale.types';

/** Minimal `session`-shaped object for `usePhaseTimer` + `SessionTimer` in /room */
export function buildSocialeTimerSessionShim(
  sociale: Sociale,
  uiPhase: 'answer' | 'vote' | 'reveal' | 'results'
) {
  const status = uiPhase === 'vote' ? 'vote' : uiPhase === 'results' ? 'results' : uiPhase === 'reveal' ? 'reveal' : 'answer';
  return {
    status,
    endsAt: sociale.phaseEndsAt,
    settings: {
      answerSecs: sociale.settings?.answerSeconds ?? 90,
      voteSecs: sociale.settings?.votingSeconds ?? 30,
    },
  };
}
