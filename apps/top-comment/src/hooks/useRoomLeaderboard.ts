import { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';

export interface SessionLeaderboardEntry {
  playerId: string;
  displayName: string;
  score: number;
  rank: number;
}

export interface SessionLeaderboard {
  sessionId: string;
  sessionCode: string;
  status: string;
  startedAt: string | null;
  endedAt: string | null;
  entries: SessionLeaderboardEntry[];
}

interface UseRoomLeaderboardOptions {
  roomId: string | undefined;
  currentSessionId: string | null;
}

export function useRoomLeaderboard({ roomId, currentSessionId }: UseRoomLeaderboardOptions) {
  const [currentLeaderboard, setCurrentLeaderboard] = useState<SessionLeaderboard | null>(null);
  const [pastLeaderboards, setPastLeaderboards] = useState<SessionLeaderboard[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch current session leaderboard
  useEffect(() => {
    if (!currentSessionId) {
      setCurrentLeaderboard(null);
      return;
    }

    const fetchCurrent = async () => {
      const { data: session } = await supabase
        .from('top_comment_sessions')
        .select('id, code, status, started_at, ended_at')
        .eq('id', currentSessionId)
        .single();

      if (!session) {
        setCurrentLeaderboard(null);
        return;
      }

      const { data: players } = await supabase
        .from('top_comment_players')
        .select('id, display_name, score')
        .eq('session_id', currentSessionId)
        .order('score', { ascending: false });

      if (!players) {
        setCurrentLeaderboard(null);
        return;
      }

      const entries = rankPlayers(players);
      setCurrentLeaderboard({
        sessionId: session.id,
        sessionCode: session.code,
        status: session.status,
        startedAt: session.started_at,
        endedAt: session.ended_at,
        entries,
      });
    };

    fetchCurrent();

    // Subscribe to player score changes for current session
    const channel = supabase
      .channel(`leaderboard:${currentSessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'top_comment_players',
          filter: `session_id=eq.${currentSessionId}`,
        },
        () => {
          fetchCurrent();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentSessionId]);

  // Fetch past session leaderboards for this room
  useEffect(() => {
    if (!roomId) return;

    const fetchPast = async () => {
      setIsLoading(true);

      // Get all ended sessions for this room
      const { data: sessions } = await supabase
        .from('top_comment_sessions')
        .select('id, code, status, started_at, ended_at')
        .eq('room_id', roomId)
        .eq('status', 'ended')
        .order('ended_at', { ascending: false })
        .limit(10);

      if (!sessions || sessions.length === 0) {
        setPastLeaderboards([]);
        setIsLoading(false);
        return;
      }

      // Fetch players for each session
      const leaderboards: SessionLeaderboard[] = [];
      for (const session of sessions) {
        // Skip current session (it's shown separately)
        if (session.id === currentSessionId) continue;

        const { data: players } = await supabase
          .from('top_comment_players')
          .select('id, display_name, score')
          .eq('session_id', session.id)
          .order('score', { ascending: false });

        if (players && players.length > 0) {
          leaderboards.push({
            sessionId: session.id,
            sessionCode: session.code,
            status: session.status,
            startedAt: session.started_at,
            endedAt: session.ended_at,
            entries: rankPlayers(players),
          });
        }
      }

      setPastLeaderboards(leaderboards);
      setIsLoading(false);
    };

    fetchPast();
  }, [roomId, currentSessionId]);

  return { currentLeaderboard, pastLeaderboards, isLoading };
}

function rankPlayers(
  players: Array<{ id: string; display_name: string; score: number }>
): SessionLeaderboardEntry[] {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  let currentRank = 1;
  let previousScore = sorted[0]?.score ?? 0;

  return sorted.map((player, index) => {
    if (index > 0 && player.score < previousScore) {
      currentRank = index + 1;
    }
    previousScore = player.score;

    return {
      playerId: player.id,
      displayName: player.display_name,
      score: player.score,
      rank: currentRank,
    };
  });
}
