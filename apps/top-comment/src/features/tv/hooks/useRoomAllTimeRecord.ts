import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../supabase/client';

export interface AllTimeRecord {
  playerName: string;
  total: number;
}

interface RawEvent {
  points: number;
  socialites: {
    membership_id: string | null;
    room_memberships: {
      id: string;
      player_name: string | null;
      room_id: string;
    } | null;
  } | null;
}

export function useRoomAllTimeRecord(roomId: string | undefined) {
  return useQuery<AllTimeRecord | null>({
    queryKey: ['room-alltime-record', roomId],
    queryFn: async () => {
      if (!roomId) return null;

      const { data, error } = await supabase
        .from('sociale_score_events')
        .select(`
          points,
          socialites!inner (
            membership_id,
            room_memberships!inner (
              id,
              player_name,
              room_id
            )
          )
        `)
        .eq('socialites.room_memberships.room_id', roomId)
        .not('socialites.membership_id', 'is', null);

      if (error) throw error;

      const rows = (data ?? []) as unknown as RawEvent[];
      const totals = new Map<string, AllTimeRecord>();
      for (const row of rows) {
        const membership = row.socialites?.room_memberships;
        if (!membership || !membership.player_name) continue;
        const key = membership.id;
        const existing = totals.get(key);
        if (existing) {
          existing.total += row.points;
        } else {
          totals.set(key, { playerName: membership.player_name, total: row.points });
        }
      }

      let best: AllTimeRecord | null = null;
      for (const entry of totals.values()) {
        if (!best || entry.total > best.total) best = entry;
      }
      return best;
    },
    enabled: !!roomId,
    staleTime: 60_000,
  });
}
