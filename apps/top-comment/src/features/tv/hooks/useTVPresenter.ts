import { useMemo } from 'react';
import { useSociale } from '../../sociale/hooks/useSociale';
import { useSocialeRounds, useCurrentRound } from '../../sociale/hooks/useSocialeRounds';
import { useSocialites } from '../../sociale/hooks/useSocialites';
import { useSocialeResponses } from '../../sociale/hooks/useSocialeResponses';
import { useSocialeVotes } from '../../sociale/hooks/useSocialeVotes';
import type { GamePhase } from '../../../shared/types/game.types';

export function useTVPresenter(socialeId: string) {
  const { data: sociale, isLoading: socialeLoading } = useSociale(socialeId);
  const { data: rounds = [] } = useSocialeRounds(socialeId);
  const currentRound = useCurrentRound(socialeId, sociale?.currentRoundId ?? undefined);
  const { data: socialites = [] } = useSocialites(socialeId);
  const { data: responses = [] } = useSocialeResponses(socialeId);
  const { data: votes = [] } = useSocialeVotes(socialeId);

  const currentPhase = (sociale?.currentPhase ?? 'lobby') as GamePhase;

  const timeRemaining = useMemo(() => {
    if (!sociale?.phaseEndsAt) return null;
    const remaining = new Date(sociale.phaseEndsAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(remaining / 1000));
  }, [sociale?.phaseEndsAt]);

  // Scoreboard from sociale.scoreboard (already computed by backend)
  const scoreboard = useMemo(() => {
    if (!sociale?.scoreboard) return [];
    return Object.values(sociale.scoreboard) as any[];
  }, [sociale?.scoreboard]);

  // Responses for the current round only
  const currentRoundResponses = useMemo(
    () => responses.filter(r => r.roundId === currentRound?.id),
    [responses, currentRound?.id]
  );

  // Votes for the current round only
  const currentRoundVotes = useMemo(
    () => votes.filter(v => v.roundId === currentRound?.id),
    [votes, currentRound?.id]
  );

  return {
    sociale,
    rounds,
    currentRound,
    socialites,
    currentRoundResponses,
    currentRoundVotes,
    scoreboard,
    currentPhase,
    timeRemaining,
    isLoading: socialeLoading && !sociale,
  };
}
