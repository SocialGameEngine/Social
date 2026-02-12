import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../supabase/client';

interface ConnectionHealthState {
  isConnected: boolean;
  lastConnectedAt: number | null;
  reconnectAttempts: number;
  secondsSinceLastUpdate: number;
}

export function useConnectionHealth() {
  const [state, setState] = useState<ConnectionHealthState>({
    isConnected: true,
    lastConnectedAt: Date.now(),
    reconnectAttempts: 0,
    secondsSinceLastUpdate: 0,
  });
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const refreshCallbackRef = useRef<(() => void) | null>(null);

  // Register a callback to run on reconnection
  const onReconnect = useCallback((cb: () => void) => {
    refreshCallbackRef.current = cb;
  }, []);

  // Mark data as updated (resets the stale timer)
  const markUpdated = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isConnected: true,
      lastConnectedAt: Date.now(),
      reconnectAttempts: 0,
      secondsSinceLastUpdate: 0,
    }));
  }, []);

  // Monitor Supabase realtime connection
  useEffect(() => {
    const channel = supabase
      .channel('connection-health')
      .on('system', { event: '*' } as any, (payload: any) => {
        if (payload?.type === 'connected' || payload?.event === 'connected') {
          setState((prev) => {
            if (!prev.isConnected && refreshCallbackRef.current) {
              refreshCallbackRef.current();
            }
            return {
              ...prev,
              isConnected: true,
              lastConnectedAt: Date.now(),
              reconnectAttempts: 0,
              secondsSinceLastUpdate: 0,
            };
          });
        } else if (payload?.type === 'disconnected' || payload?.event === 'disconnected') {
          setState((prev) => ({
            ...prev,
            isConnected: false,
            reconnectAttempts: prev.reconnectAttempts + 1,
          }));
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setState((prev) => ({
            ...prev,
            isConnected: true,
            lastConnectedAt: Date.now(),
            secondsSinceLastUpdate: 0,
          }));
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setState((prev) => ({
            ...prev,
            isConnected: false,
            reconnectAttempts: prev.reconnectAttempts + 1,
          }));
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, []);

  // Update secondsSinceLastUpdate every second
  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => {
        if (!prev.lastConnectedAt) return prev;
        return {
          ...prev,
          secondsSinceLastUpdate: Math.floor((Date.now() - prev.lastConnectedAt) / 1000),
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Visibility change: force refresh when tab becomes visible
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        if (refreshCallbackRef.current) {
          refreshCallbackRef.current();
        }
        markUpdated();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [markUpdated]);

  return {
    ...state,
    onReconnect,
    markUpdated,
  };
}
