import { useState, useEffect, useRef } from "react";
import { supabase } from "../../../supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { ViboxQueueItem } from "../../types/vibox";
import { viboxApi } from "../../api/vibox";

interface UseRealtimeQueueReturn {
  queue: ViboxQueueItem[];
  isQueueLoading: boolean;
  queueChannelRef: React.MutableRefObject<RealtimeChannel | null>;
}

export const useRealtimeQueue = (): UseRealtimeQueueReturn => {
  const [queue, setQueue] = useState<ViboxQueueItem[]>([]);
  const [isQueueLoading] = useState(false);
  const queueChannelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const fetchQueue = () => {
      viboxApi.getQueue().then((response) => {
        if (response.success && response.data) {
          setQueue(response.data.queue);
        }
      });
    };

    // Initial fetch
    fetchQueue();
    
    // Setup realtime subscription
    const channel = supabase
      .channel('vibox-queue')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vibox_queue',
        },
        () => {
          // Immediate fetch for realtime events
          fetchQueue();
        }
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('VIBox realtime failed:', status, err?.message);
        }
      });

    queueChannelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return {
    queue,
    isQueueLoading,
    queueChannelRef,
  };
};
