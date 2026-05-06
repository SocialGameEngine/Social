import { useEffect, useState } from 'react';
import { supabase } from '../../../supabase/client';

/**
 * Observes how many TV pages are currently open for the given room.
 * TVPage announces itself via Supabase Realtime Presence; Supabase
 * automatically drops the entry when the tab closes or crashes.
 */
export function useTVPresence(roomId: string | null | undefined): number {
  const [tvCount, setTvCount] = useState(0);

  useEffect(() => {
    if (!roomId) return;

    const channel = supabase.channel(`room-tv:${roomId}`);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<{ role: string }>();
        const count = Object.values(state).flat().filter(p => p.role === 'tv').length;
        setTvCount(count);
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [roomId]);

  return tvCount;
}
