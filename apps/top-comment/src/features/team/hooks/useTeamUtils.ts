import { useCallback } from "react";

const DUPLICATE_TEAM_NAME_CODE = "functions/already-exists";
const DUPLICATE_TEAM_NAME_MESSAGE =
  "That team name is already taken. Try another one.";
const HAS_MANUALLY_LEFT_KEY = "sidebets_has_manually_left";
const KICKED_FROM_SESSIONS_KEY = "sidebets_kicked_from_sessions";

interface KickedSession {
  sessionId: string;
  code: string;
}

export function useTeamUtils() {
  const getKickedFromSessions = useCallback((): Map<string, KickedSession> => {
    if (typeof window === "undefined") return new Map();
    try {
      const stored = window.sessionStorage.getItem(KICKED_FROM_SESSIONS_KEY);
      if (!stored) return new Map();
      const parsed = JSON.parse(stored);
      return new Map(Object.entries(parsed));
    } catch {
      return new Map();
    }
  }, []);

  const isKickedFromCode = useCallback((code: string): boolean => {
    const kicked = getKickedFromSessions();
    return kicked.has(code.toUpperCase());
  }, [getKickedFromSessions]);

  const isDuplicateTeamNameError = useCallback((error: unknown) => {
    if (error && typeof error === "object" && "code" in error) {
      const code = (error as { code?: unknown }).code;
      if (typeof code === "string") {
        return code === DUPLICATE_TEAM_NAME_CODE;
      }
    }
    return false;
  }, []);

  const addToKickedSessions = useCallback((sessionId: string, code: string) => {
    if (typeof window === "undefined") return;
    try {
      const kicked = getKickedFromSessions();
      kicked.set(sessionId, { sessionId, code });
      window.sessionStorage.setItem(
        KICKED_FROM_SESSIONS_KEY,
        JSON.stringify(Object.fromEntries(kicked))
      );
    } catch {
      // Ignore storage errors
    }
  }, [getKickedFromSessions]);

  const setHasManuallyLeft = useCallback((hasLeft: boolean) => {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(HAS_MANUALLY_LEFT_KEY, hasLeft.toString());
    } catch {
      // Ignore storage errors
    }
  }, []);

  const getHasManuallyLeft = useCallback((): boolean => {
    if (typeof window === "undefined") return false;
    try {
      return window.sessionStorage.getItem(HAS_MANUALLY_LEFT_KEY) === "true";
    } catch {
      return false;
    }
  }, []);

  return {
    DUPLICATE_TEAM_NAME_CODE,
    DUPLICATE_TEAM_NAME_MESSAGE,
    HAS_MANUALLY_LEFT_KEY,
    KICKED_FROM_SESSIONS_KEY,
    getKickedFromSessions,
    isKickedFromCode,
    isDuplicateTeamNameError,
    addToKickedSessions,
    setHasManuallyLeft,
    getHasManuallyLeft,
  };
}

export type { KickedSession };
