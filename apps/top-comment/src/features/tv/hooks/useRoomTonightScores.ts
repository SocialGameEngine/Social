import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../supabase/client';

export interface TonightScoreEntry {
  displayName: string;
  total: number;
}

interface RawEvent {
  points: number;
  socialites: {
    id: string;
    display_name: string | null;
  } | null;
  sociales: {
    room_id: string;
    ended_at: string | null;
  } | null;
}

export function useRoomTonightScores(roomId: string | undefined) {
  return useQuery<TonightScoreEntry[]>({
    queryKey: ['room-tonight-scores', roomId],
    queryFn: async () => {
      if (!roomId) return [];

      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('sociale_score_events')
        .select(`
          points,
          socialites!inner (
            id,
            display_name
          ),
          sociales!inner (
            room_id,
            ended_at
          )
        `)
        .eq('sociales.room_id', roomId)
        .gte('sociales.ended_at', since);

      if (error) throw error;

      const rows = (data ?? []) as unknown as RawEvent[];
      const totals = new Map<string, TonightScoreEntry>();
      for (const row of rows) {
        const name = row.socialites?.display_name ?? null;
        if (!name) continue;
        const existing = totals.get(name);
        if (existing) {
          existing.total += row.points;
        } else {
          totals.set(name, { displayName: name, total: row.points });
        }
      }

      return Array.from(totals.values())
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
    },
    enabled: !!roomId,
    staleTime: 30_000,
  });
}
