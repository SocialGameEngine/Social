import { useState, useEffect } from 'react';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '../../../supabase/client';

export interface SessionPlayer {
  id: string;
  sessionId: string;
  userId: string;
  displayName: string;
  score: number;
  joinedAt: string;
  lastActiveAt: string | null;
}

export function useSessionPlayers(sessionId: string | null) {
  const [players, setPlayers] = useState<SessionPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setPlayers([]);
      return;
    }

    const fetchPlayers = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('top_comment_players')
          .select('*')
          .eq('session_id', sessionId)
          .order('score', { ascending: false });

        if (error) {
          console.error('Error fetching session players:', error);
          return;
        }

        const mappedPlayers: SessionPlayer[] = (data || []).map((p) => ({
          id: p.id,
          sessionId: p.session_id,
          userId: p.user_id,
          displayName: p.display_name,
          score: p.score || 0,
          joinedAt: p.joined_at,
          lastActiveAt: p.last_active_at,
        }));

        setPlayers(mappedPlayers);
      } catch (err) {
        console.error('Error fetching session players:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlayers();

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`session-players:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'top_comment_players',
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          // Handle different event types
          if (payload.eventType === 'DELETE') {
            // DELETE events only contain primary key, so refetch all players
            fetchPlayers();
          } else {
            // INSERT/UPDATE events contain full data, so we can filter by session_id
            const newSessionId = (payload.new as any)?.session_id;
            const oldSessionId = (payload.old as any)?.session_id;
            
            if (newSessionId === sessionId || oldSessionId === sessionId) {
              fetchPlayers();
            }
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [sessionId]);

  return { players, isLoading };
}
