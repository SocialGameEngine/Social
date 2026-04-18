/**
 * Enhanced Host Session Hook with Async State Architecture
 * 
 * Features:
 * - Server validation before using localStorage
 * - Recovery state tracking
 * - Stale data detection
 * - Prevents race conditions between localStorage and server
 */

import { useCallback, useState, useEffect } from "react";
import { supabase } from "../../supabase/client";
import type { RecoveryState } from "../../hooks/async/types";

const HOST_SESSION_KEY = "sidebets_host_session";

type StoredHostSession = {
  sessionId: string;
  code: string;
  timestamp?: number;
};

interface UseHostSessionResult {
  sessionId: string | null;
  code: string | null;
  recoveryState: RecoveryState;
  isValidated: boolean;
  setHostSession: (session: StoredHostSession | null) => void;
  clearHostSession: () => void;
  validateSession: () => Promise<boolean>;
}

const readStoredSession = (): StoredHostSession | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(HOST_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredHostSession;
    if (parsed.sessionId && parsed.code) {
      return parsed;
    }
    return null;
  } catch (error) {
    console.error("Failed to parse host session storage", error);
    return null;
  }
};

const isSessionStale = (session: StoredHostSession | null): boolean => {
  if (!session || !session.timestamp) return true;
  const STALE_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours
  return Date.now() - session.timestamp > STALE_THRESHOLD;
};

export function useHostSession(): UseHostSessionResult {
  const [stored, setStored] = useState<StoredHostSession | null>(() =>
    readStoredSession()
  );
  const [recoveryState, setRecoveryState] = useState<RecoveryState>({
    status: "checking_storage",
    error: null,
  });
  const [isValidated, setIsValidated] = useState(false);

  // Validate session against server
  const validateSession = useCallback(async (): Promise<boolean> => {
    if (!stored?.sessionId) {
      setRecoveryState({ status: "expired", error: null });
      setIsValidated(false);
      return false;
    }

    setRecoveryState({ status: "validating", error: null });

    try {
      // Check if session exists in database
      const { data, error } = await supabase
        .from("top_comment_sessions")
        .select("id, status")
        .eq("id", stored.sessionId)
        .single();

      if (error || !data) {
        // Session not found or error
        setRecoveryState({ status: "expired", error: null });
        setIsValidated(false);
        // Clear invalid session from localStorage
        clearHostSession();
        return false;
      }

      // Check if session is still active
      if (data.status === "ended") {
        setRecoveryState({ status: "expired", error: null });
        setIsValidated(false);
        clearHostSession();
        return false;
      }

      // Session is valid
      setRecoveryState({ status: "recovered", error: null });
      setIsValidated(true);
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Validation failed");
      setRecoveryState({ status: "corrupted", error });
      setIsValidated(false);
      return false;
    }
  }, [stored?.sessionId]);

  // Auto-validate on mount if session exists
  useEffect(() => {
    if (!stored) {
      setRecoveryState({ status: "expired", error: null });
      setIsValidated(false);
      return;
    }

    // Check if stale
    if (isSessionStale(stored)) {
      console.warn("Host session is stale, validating with server...");
      validateSession();
      return;
    }

    // Validate with server
    validateSession();
  }, [stored, validateSession]);

  const setHostSession = useCallback((session: StoredHostSession | null) => {
    if (typeof window === "undefined") return;
    
    if (!session) {
      setStored(null);
      setIsValidated(false);
      window.localStorage.removeItem(HOST_SESSION_KEY);
      setRecoveryState({ status: "expired", error: null });
    } else {
      // Add timestamp when storing
      const sessionWithTimestamp = {
        ...session,
        timestamp: Date.now(),
      };
      setStored(sessionWithTimestamp);
      setIsValidated(true);
      window.localStorage.setItem(HOST_SESSION_KEY, JSON.stringify(sessionWithTimestamp));
      setRecoveryState({ status: "recovered", error: null });
    }
  }, []);

  const clearHostSession = useCallback(() => {
    setHostSession(null);
  }, [setHostSession]);

  return {
    sessionId: isValidated ? stored?.sessionId ?? null : null,
    code: isValidated ? stored?.code ?? null : null,
    recoveryState,
    isValidated,
    setHostSession,
    clearHostSession,
    validateSession,
  };
}
