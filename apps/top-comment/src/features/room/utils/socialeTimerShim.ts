import type { Sociale } from '../../../domain/types/sociale.types';

/** Minimal `session`-shaped object for `usePhaseTimer` + `SessionTimer` in /room. */
export function buildSocialeTimerSessionShim(
  sociale: Sociale,
  uiPhase: 'answer' | 'vote' | 'reveal' | 'results'
) {
  const status =
    uiPhase === 'vote'
      ? 'vote'
      : uiPhase === 'results'
        ? 'results'
        : uiPhase === 'reveal'
          ? 'reveal'
          : 'answer';
  return {
    status,
    phaseStartedAt: sociale.phaseStartedAt ?? null,
    phaseEndsAt: sociale.phaseEndsAt ?? null,
    endsAt: sociale.phaseEndsAt ?? null,
    settings: {
      answerSecs: sociale.settings?.answerSeconds ?? 90,
      voteSecs: sociale.settings?.votingSeconds ?? 30,
      revealSecs: sociale.settings?.revealSeconds ?? 15,
      resultsSecs: sociale.settings?.resultsSeconds ?? 12,
    },
  };
}
