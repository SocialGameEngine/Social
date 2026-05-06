import { useEffect, useRef } from 'react';
import { useTTS } from '../../../shared/hooks/useTTS';
import type { Sociale, SocialeRound } from '../../../domain/types/sociale.types';
import type { VoiceProfile } from '../../../shared/services/voiceProfiles';
import {
  getPhaseAnnouncement,
  getRoundIntroAnnouncement,
} from '../utils/tvAnnouncements';

/**
 * P1-16: TTS announcer hook.
 *
 * Beat structure per round:
 *   1. Round intro (fired on new round id) — ≈2s after phase change so the
 *      phase line doesn't trample it.
 *   2. Phase announcement (answer/vote/results/ended) at each phase boundary.
 *   3. Prompt read-out (existing behaviour, delayed 3.5s after intro so the
 *      host can breathe).
 */
export function useTVAutoTTS(
  sociale: Sociale | null,
  currentRound: SocialeRound | null,
) {
  const voiceProfile = (sociale?.settings as any)?.voiceProfile as VoiceProfile | undefined;
  const { play } = useTTS({ profile: voiceProfile });

  const prevPhaseRef = useRef<string | null>(null);
  const prevRoundIdRef = useRef<string | null>(null);
  const questionFiredForPhaseRef = useRef<string | null>(null);

  useEffect(() => {
    if (!sociale?.currentPhase) return;
    if (sociale.currentPhase === prevPhaseRef.current) return;
    prevPhaseRef.current = sociale.currentPhase;

    const totalRounds = sociale.totalRounds ?? null;
    const roundIndex = sociale.currentRoundIndex ?? null;
    const isFinalRound =
      totalRounds != null && roundIndex != null && roundIndex === totalRounds - 1;

    const text = getPhaseAnnouncement({
      phase: sociale.currentPhase,
      roundType: currentRound?.type ?? undefined,
      roundIndex,
      totalRounds,
      isFinalRound,
    });
    if (text) void play(text);
  }, [sociale?.currentPhase, sociale?.currentRoundIndex, sociale?.totalRounds, currentRound?.type, play]);

  // Round intro announcement + prompt read on new round id
  useEffect(() => {
    if (!currentRound?.id) return;
    if (currentRound.id === prevRoundIdRef.current) return;
    prevRoundIdRef.current = currentRound.id;

    const totalRounds = sociale?.totalRounds ?? 0;
    const roundIndex = sociale?.currentRoundIndex ?? 0;
    const isFinalRound = totalRounds > 0 && roundIndex === totalRounds - 1;

    const intro = getRoundIntroAnnouncement({
      roundIndex,
      totalRounds,
      title: currentRound.title ?? null,
      roundType: currentRound.type ?? undefined,
      isFinalRound,
    });
    const prompt = getPromptText(currentRound);

    const timers: number[] = [];
    if (intro) {
      timers.push(window.setTimeout(() => void play(intro), 1800));
    }
    if (prompt) {
      timers.push(window.setTimeout(() => void play(prompt), 3500));
    }
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [currentRound?.id, sociale?.totalRounds, sociale?.currentRoundIndex, play]);

  // P1-16: Re-read the question when the host manually advances into the
  // answer phase (e.g. from setup/question → answer). Does NOT double-fire
  // on new rounds since those are handled by the round-intro effect above.
  useEffect(() => {
    if (sociale?.currentPhase !== 'answer') return;
    if (!currentRound?.id) return;
    const key = `${currentRound.id}-answer`;
    if (questionFiredForPhaseRef.current === key) return;
    // Skip if this is a brand-new round (handled by the intro effect above)
    if (currentRound.id !== prevRoundIdRef.current) return;
    questionFiredForPhaseRef.current = key;
    const prompt = getPromptText(currentRound);
    if (!prompt) return;
    const timer = window.setTimeout(() => void play(prompt), 1000);
    return () => window.clearTimeout(timer);
  }, [sociale?.currentPhase, currentRound?.id, play]);
}

function getPromptText(round: SocialeRound): string {
  const settings = round.settings as any;
  return settings?.snapshot?.prompt ?? round.content ?? round.title ?? '';
}
