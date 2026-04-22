import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../supabase/client';
import type { LeaderboardTeam } from '@social/ui';

interface RawEvent {
  points: number;
  socialites: {
    membership_id: string | null;
    room_memberships: {
      id: string;
      player_name: string | null;
      mascot_id: number | null;
      room_id: string;
    } | null;
  } | null;
}

/**
 * Returns the top-10 all-time leaderboard for a room, aggregated across every
 * completed Sociale that credited points to a persistent `room_memberships` id.
 *
 * Anonymous socialites (no membership_id) are excluded -- they have no stable
 * identity across sociales.
 */
export function useRoomAllTimeLeaderboard(roomId: string | undefined) {
  return useQuery<LeaderboardTeam[]>({
    queryKey: ['room-alltime-leaderboard', roomId],
    queryFn: async () => {
      if (!roomId) return [];

      const { data, error } = await supabase
        .from('sociale_score_events')
        .select(`
          points,
          socialites!inner (
            membership_id,
            room_memberships!inner (
              id,
              player_name,
              mascot_id,
              room_id
            )
          )
        `)
        .eq('socialites.room_memberships.room_id', roomId)
        .not('socialites.membership_id', 'is', null);

      if (error) throw error;

      const rows = (data ?? []) as unknown as RawEvent[];
      const totals = new Map<string, {
        playerName: string;
        mascotId: number | null;
        total: number;
      }>();

      for (const row of rows) {
        const membership = row.socialites?.room_memberships;
        if (!membership || !membership.player_name) continue;
        const existing = totals.get(membership.id);
        if (existing) {
          existing.total += row.points;
        } else {
          totals.set(membership.id, {
            playerName: membership.player_name,
            mascotId: membership.mascot_id,
            total: row.points,
          });
        }
      }

      const sorted = Array.from(totals.entries())
        .map(([id, entry]) => ({ id, ...entry }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

      return sorted.map((entry, i) => ({
        id: entry.id,
        rank: i + 1,
        teamName: entry.playerName,
        score: entry.total,
        mascotId: entry.mascotId ?? undefined,
      }));
    },
    enabled: !!roomId,
    staleTime: 30_000,
  });
}
