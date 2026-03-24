/**
 * Async State Architecture - Subscription Hook
 * 
 * Standardized wrapper for real-time Supabase subscriptions.
 * Provides connection status, reconnection logic, and guards against premature subscription.
 */

import { useEffect, useState, useCallback, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { AsyncSubscriptionResult, ConnectionStatus, AsyncStatus } from "./types";

interface UseAsyncSubscriptionOptions<T> {
  channel: RealtimeChannel | null;
  initialData?: T | null;
  enabled?: boolean;
  onData?: (data: T) => void;
  onError?: (error: Error) => void;
  staleThreshold?: number;
}

export function useAsyncSubscription<T>(
  options: UseAsyncSubscriptionOptions<T>
): AsyncSubscriptionResult<T> {
  const { channel, initialData = null, enabled = true, onData, onError, staleThreshold = 30000 } = options;

  const [data, setData] = useState<T | null>(initialData);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [error, setError] = useState<Error | null>(null);
  const [subscriptionError, setSubscriptionError] = useState<Error | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const handleError = useCallback((err: Error) => {
    setSubscriptionError(err);
    setError(err);
    onError?.(err);
  }, [onError]);

  const reconnect = useCallback(() => {
    if (!channel || reconnectAttempts.current >= maxReconnectAttempts) {
      setConnectionStatus("error");
      return;
    }

    reconnectAttempts.current += 1;
    setConnectionStatus("reconnecting");

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        setConnectionStatus("connected");
        reconnectAttempts.current = 0;
      } else if (status === "CHANNEL_ERROR") {
        setConnectionStatus("error");
        handleError(new Error("Subscription channel error"));
      }
    });
  }, [channel, handleError]);

  useEffect(() => {
    if (!channel || !enabled) {
      setConnectionStatus("disconnected");
      return;
    }

    setConnectionStatus("connecting");

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        setConnectionStatus("connected");
        reconnectAttempts.current = 0;
      } else if (status === "CHANNEL_ERROR") {
        setConnectionStatus("error");
        handleError(new Error("Subscription channel error"));
      } else if (status === "TIMED_OUT") {
        reconnect();
      }
    });

    return () => {
      channel.unsubscribe();
      setConnectionStatus("disconnected");
    };
  }, [channel, enabled, handleError, reconnect]);

  useEffect(() => {
    if (initialData && !data) {
      setData(initialData);
      setLastUpdatedAt(Date.now());
    }
  }, [initialData, data]);

  const getStatus = (): AsyncStatus => {
    if (connectionStatus === "connecting") return "loading";
    if (connectionStatus === "reconnecting") return "reconnecting";
    if (connectionStatus === "error") return "error";
    if (connectionStatus === "disconnected") return "degraded";
    if (!data) return "empty";
    
    const isStale = lastUpdatedAt 
      ? Date.now() - lastUpdatedAt > staleThreshold
      : false;
    
    if (isStale) return "stale";
    return "ready";
  };

  const isStale = lastUpdatedAt 
    ? Date.now() - lastUpdatedAt > staleThreshold
    : false;

  const canInteract = connectionStatus === "connected" || !!data;

  const retry = useCallback(() => {
    reconnect();
  }, [reconnect]);

  return {
    status: getStatus(),
    data,
    error,
    retry,
    lastUpdatedAt,
    isStale,
    canInteract,
    connectionStatus,
    reconnect,
    subscriptionError,
  };
}
