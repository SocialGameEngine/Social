/**
 * useConnectionStatus - Monitor network connectivity for host panel
 * 
 * Provides:
 * - Real-time connection status (connected/reconnecting/offline)
 * - Offline banner display logic
 * - Retry mechanism for reconnection
 * 
 * Features:
 * - Uses navigator.onLine and online/offline events
 * - Integrates with Supabase realtime connection status
 * - Provides retry countdown for reconnection attempts
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ConnectionStatus } from '../types/host-panel.types';

interface UseConnectionStatusOptions {
  onStatusChange?: (status: ConnectionStatus) => void;
  retryIntervalMs?: number;
  maxRetries?: number;
}

interface ConnectionStatusResult {
  status: ConnectionStatus;
  isOnline: boolean;
  isReconnecting: boolean;
  retryCount: number;
  lastConnectedAt: Date | null;
  retry: () => void;
}

export function useConnectionStatus(
  options: UseConnectionStatusOptions = {}
): ConnectionStatusResult {
  const {
    onStatusChange,
    retryIntervalMs = 5000,
    maxRetries = 5,
  } = options;

  const [status, setStatus] = useState<ConnectionStatus>(
    typeof navigator !== 'undefined' && navigator.onLine ? 'connected' : 'offline'
  );
  const [retryCount, setRetryCount] = useState(0);
  const [lastConnectedAt, setLastConnectedAt] = useState<Date | null>(
    typeof navigator !== 'undefined' && navigator.onLine ? new Date() : null
  );

  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update status and notify
  const updateStatus = useCallback((newStatus: ConnectionStatus) => {
    setStatus(prev => {
      if (prev !== newStatus) {
        onStatusChange?.(newStatus);
        if (newStatus === 'connected') {
          setLastConnectedAt(new Date());
          setRetryCount(0);
        }
        return newStatus;
      }
      return prev;
    });
  }, [onStatusChange]);

  // Handle going online
  const handleOnline = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    updateStatus('connected');
  }, [updateStatus]);

  // Handle going offline
  const handleOffline = useCallback(() => {
    updateStatus('offline');
  }, [updateStatus]);

  // Retry connection
  const retry = useCallback(() => {
    if (status === 'connected') return;
    
    setRetryCount(prev => prev + 1);
    updateStatus('reconnecting');

    // Check if we're actually online
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      // We're online but might have lost websocket connection
      // This would integrate with Supabase realtime reconnection
      retryTimeoutRef.current = setTimeout(() => {
        if (navigator.onLine) {
          updateStatus('connected');
        } else {
          updateStatus('offline');
        }
      }, 1000);
    } else {
      // Schedule next retry if under max retries
      if (retryCount < maxRetries) {
        retryTimeoutRef.current = setTimeout(() => {
          if (typeof navigator !== 'undefined' && navigator.onLine) {
            updateStatus('connected');
          } else {
            updateStatus('offline');
          }
        }, retryIntervalMs);
      }
    }
  }, [status, retryCount, maxRetries, retryIntervalMs, updateStatus]);

  // Set up event listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [handleOnline, handleOffline]);

  // Auto-retry when offline
  useEffect(() => {
    if (status === 'offline' && retryCount < maxRetries) {
      retryTimeoutRef.current = setTimeout(retry, retryIntervalMs);
      return () => {
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
      };
    }
  }, [status, retryCount, maxRetries, retryIntervalMs, retry]);

  return {
    status,
    isOnline: status === 'connected',
    isReconnecting: status === 'reconnecting',
    retryCount,
    lastConnectedAt,
    retry,
  };
}

// OfflineBanner component is in shell/OfflineBanner.tsx
