// =============================================================================
// SOCIALE ROUNDS HOOK
// =============================================================================
// Hook for fetching Sociale rounds

import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '../../../supabase/client';
import type { SocialeRound } from '../../../domain/types/sociale.types';
import { useSocialeChannel } from './useSocialeChannel';

/**
 * Hook for fetching rounds for a Sociale
 */
export function useSocialeRounds(socialeId?: string) {
  const queryClient = useQueryClient();

  // Use unified sociale channel instead of dedicated rounds channel
  const onPayload = useCallback((payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
    if (payload?.table === 'sociale_rounds') {
      void queryClient.invalidateQueries({ queryKey: ['sociale_rounds', socialeId] });
    }
  }, [socialeId, queryClient]);

  useSocialeChannel(socialeId, onPayload);

  return useQuery({
    queryKey: ['sociale_rounds', socialeId],
    queryFn: async () => {
      if (!socialeId) return [];
      
      const { data, error } = await supabase
        .from('sociale_rounds')
        .select('*')
        .eq('sociale_id', socialeId)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return (data ?? []).map((round) => ({
        id: round.id,
        socialeId: round.sociale_id,
        orderIndex: round.order_index,
        type: round.type,
        title: round.title,
        content: round.content,
        settings: round.settings,
        phaseSequence: round.phase_sequence,
        createdAt: round.created_at,
        updatedAt: round.updated_at,
      })) as SocialeRound[];
    },
    enabled: !!socialeId,
  });
}

/**
 * Hook for fetching the current round
 */
export function useCurrentRound(socialeId?: string, currentRoundId?: string) {
  const { data: rounds = [] } = useSocialeRounds(socialeId);
  
  const currentRound = rounds.find(round => round.id === currentRoundId);
  
  return currentRound || null;
}
