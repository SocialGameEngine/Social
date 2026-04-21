import { useState, useEffect, useRef } from "react";
import { supabase } from "../../../supabase/client";
import { ensureAnonymousAuth } from "../../../supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { ViboxQueueItem } from "../../types/vibox";
import { viboxApi } from "../../api/vibox";
import { throttle } from "../../utils/realtimeThrottle";

interface UseRealtimeQueueReturn {
  queue: ViboxQueueItem[];
  isQueueLoading: boolean;
  queueChannelRef: React.MutableRefObject<RealtimeChannel | null>;
}

export const useRealtimeQueue = (roomId?: string): UseRealtimeQueueReturn => {
  const [queue, setQueue] = useState<ViboxQueueItem[]>([]);
  const [isQueueLoading] = useState(false);
  const queueChannelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!roomId) {
      setQueue([]);
      return;
    }

    let isActive = true;

    const fetchQueue = () => {
      viboxApi.getQueue(roomId).then((response) => {
        if (isActive && response.success && response.data) {
          setQueue(response.data.queue);
        }
      });
    };

    let channel: RealtimeChannel | null = null;

    const setupSubscription = async () => {
      await ensureAnonymousAuth();
      if (!isActive) return;

      // Initial fetch
      fetchQueue();

      // Setup realtime subscription with throttled refetch.
      // Queue changes are batched (e.g. bulk add/remove) so throttle to 2s.
      const throttledFetch = throttle(fetchQueue, 2000);

      channel = supabase
        .channel(`vibox-queue-${roomId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'vibox_queue',
            filter: `room_id=eq.${roomId}`,
          },
          () => {
            throttledFetch();
          }
        )
        .subscribe((status, err) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error('VIBox queue subscription status:', status, err);
          }
        });

      queueChannelRef.current = channel;
    };

    setupSubscription();

    return () => {
      isActive = false;
      if (channel) {
        channel.unsubscribe();
        supabase.removeChannel(channel);
      }
      queueChannelRef.current = null;
      // throttledFetch is scoped inside setupSubscription, cleanup handled by channel removal
    };
  }, [roomId]);

  return {
    queue,
    isQueueLoading,
    queueChannelRef,
  };
};
