import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../supabase/client';

export interface ActiveSocialeRoundStateRow {
  id: string;
  sociale_id: string;
  round_id: string;
  status: string;
  phase: string;
  phase_started_at: string | null;
  phase_ends_at: string | null;
  paused_remaining_seconds?: number | null;
  started_at: string | null;
  ended_at?: string | null;
}

export function useActiveSocialeRoundState(socialeId: string | undefined, socialeStatus: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socialeId) return;

    const channel = supabase
      .channel(`sociale-round-state-active:${socialeId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sociale_round_state', filter: `sociale_id=eq.${socialeId}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['sociale-round-state-active', socialeId] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [socialeId, queryClient]);

  return useQuery({
    queryKey: ['sociale-round-state-active', socialeId],
    queryFn: async (): Promise<ActiveSocialeRoundStateRow | null> => {
      if (!socialeId) return null;
      const { data, error } = await supabase
        .from('sociale_round_state')
        .select('*')
        .eq('sociale_id', socialeId)
        .in('status', ['active', 'paused']) // Include both active and paused states
        .maybeSingle();
      if (error) throw error;
      return data as ActiveSocialeRoundStateRow | null;
    },
    // Round state is still relevant while the Sociale is paused; we want
    // the canonical `round_id` for modals (answer/vote) and timers.
    enabled: !!socialeId && (socialeStatus === 'active' || socialeStatus === 'paused'),
  });
}
