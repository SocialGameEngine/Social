// Fetches the active season and the current membership's standing.

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../supabase/client';
import type { Season, SeasonStanding } from '../../../domain/seasons/seasonalLeagues';

function rowToSeason(row: Record<string, unknown>): Season {
  return {
    id: row.id as string,
    name: row.name as string,
    startsAt: new Date(row.starts_at as string),
    endsAt: new Date(row.ends_at as string),
    status: row.status as Season['status'],
    createdAt: new Date(row.created_at as string),
  };
}

function rowToStanding(row: Record<string, unknown>): SeasonStanding {
  return {
    id: row.id as string,
    seasonId: row.season_id as string,
    membershipId: row.membership_id as string,
    totalScore: row.total_score as number,
    gamesPlayed: row.games_played as number,
    tier: row.tier as SeasonStanding['tier'],
    finalRank: (row.final_rank as number | null) ?? null,
  };
}

export function useCurrentSeason() {
  return useQuery({
    queryKey: ['current-season'],
    queryFn: async (): Promise<Season | null> => {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .eq('status', 'active')
        .lte('starts_at', today)
        .gte('ends_at', today)
        .limit(1)
        .single();

      if (error || !data) return null;
      return rowToSeason(data as Record<string, unknown>);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useMySeasonStanding(membershipId: string | null | undefined) {
  const { data: season } = useCurrentSeason();

  return useQuery({
    queryKey: ['season-standing', season?.id, membershipId],
    enabled: !!season?.id && !!membershipId,
    queryFn: async (): Promise<SeasonStanding | null> => {
      const { data, error } = await supabase
        .from('season_standings')
        .select('*')
        .eq('season_id', season!.id)
        .eq('membership_id', membershipId!)
        .single();

      if (error || !data) return null;
      return rowToStanding(data as Record<string, unknown>);
    },
    staleTime: 60 * 1000,
  });
}

export function useSeasonLeaderboard(seasonId: string | null | undefined) {
  return useQuery({
    queryKey: ['season-leaderboard', seasonId],
    enabled: !!seasonId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('season_standings')
        .select('*, room_memberships(display_name)')
        .eq('season_id', seasonId!)
        .order('total_score', { ascending: false })
        .limit(100);

      if (error || !data) return [];
      return (data as Record<string, unknown>[]).map((row) => ({
        standing: rowToStanding(row),
        displayName:
          (row.room_memberships as Record<string, unknown> | null)?.display_name as
            | string
            | undefined ?? 'Unknown',
      }));
    },
    staleTime: 30 * 1000,
  });
}
