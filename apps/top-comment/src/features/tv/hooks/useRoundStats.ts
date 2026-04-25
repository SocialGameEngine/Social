// =============================================================================
// ROUND STATS HOOK
// =============================================================================
// Subscribes to the stats.finalized realtime broadcast from sociales-stats-finalize
// and falls back to runtime_state.roundStats when the component mounts late.

import { useState, useEffect } from 'react';
import { supabase } from '../../../supabase/client';

export interface RoundStatEntry {
  socialiteId: string;
  displayName: string;
  responseTime?: number;
  response?: string;
  upvoteCount?: number;
  correctAnswers?: number;
  totalAnswers?: number;
}

export interface RoundStats {
  topAnswerer: RoundStatEntry | null;
  fastestAnswer: RoundStatEntry | null;
  mostUpvoted: RoundStatEntry | null;
  perfectRound: RoundStatEntry | null;
  roundId: string | null;
}

export function useRoundStats(socialeId: string | null | undefined): RoundStats {
  const [stats, setStats] = useState<RoundStats>({
    topAnswerer: null,
    fastestAnswer: null,
    mostUpvoted: null,
    perfectRound: null,
    roundId: null,
  });

  useEffect(() => {
    if (!socialeId) return;

    // Seed from runtime_state in case we mounted after the broadcast fired
    const seedFromRuntimeState = async () => {
      const { data } = await supabase
        .from('sociales')
        .select('runtime_state, current_round_id')
        .eq('id', socialeId)
        .single();

      if (data?.runtime_state && typeof data.runtime_state === 'object') {
        const rs = data.runtime_state as Record<string, unknown>;
        if (rs.roundStats) {
          setStats({
            ...(rs.roundStats as Omit<RoundStats, 'roundId'>),
            roundId: data.current_round_id as string | null,
          });
        }
      }
    };

    seedFromRuntimeState().catch(console.error);

    // Subscribe to live stats broadcasts
    const channel = supabase
      .channel(`sociale_stats_${socialeId}`)
      .on('broadcast', { event: 'stats.finalized' }, ({ payload }) => {
        if (payload && payload.stats) {
          setStats({
            ...payload.stats,
            roundId: payload.roundId ?? null,
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [socialeId]);

  return stats;
}
