export const DUPLICATE_TEAM_NAME_CODE = "functions/already-exists";
export const DUPLICATE_TEAM_NAME_MESSAGE =
  "That team name is already taken. Try another one.";
export const HAS_MANUALLY_LEFT_KEY = "sidebets_has_manually_left";
export const BANNED_FROM_SESSIONS_KEY = "sidebets_banned_from_sessions";

export interface BannedSession {
  sessionId: string;
  code: string;
}

export function getBannedFromSessions(): Map<string, BannedSession> {
  if (typeof window === "undefined") return new Map();
  try {
    const stored = window.sessionStorage.getItem(BANNED_FROM_SESSIONS_KEY);
    if (!stored) return new Map();
    const parsed = JSON.parse(stored);
    
    // Reconstruct Map with both sessionId and code as keys
    const map = new Map<string, BannedSession>();
    if (Array.isArray(parsed)) {
      // New format: array of sessions
      parsed.forEach((session: BannedSession) => {
        map.set(session.sessionId, session);
        map.set(session.code.toUpperCase(), session);
      });
    } else {
      // Old format: object entries
      Object.entries(parsed).forEach(([, value]) => {
        const session = value as BannedSession;
        map.set(session.sessionId, session);
        map.set(session.code.toUpperCase(), session);
      });
    }
    return map;
  } catch {
    return new Map();
  }
}

export function isBannedFromCode(code: string): boolean {
  const banned = getBannedFromSessions();
  return banned.has(code.toUpperCase());
}

export function isDuplicateTeamNameError(error: unknown): boolean {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === "string") {
      return code === DUPLICATE_TEAM_NAME_CODE;
    }
  }
  return false;
}

export function addToBannedSessions(sessionId: string, code: string): void {
  if (typeof window === "undefined") return;
  try {
    const banned = getBannedFromSessions();
    banned.set(sessionId, { sessionId, code });
    window.sessionStorage.setItem(
      BANNED_FROM_SESSIONS_KEY,
      JSON.stringify(Object.fromEntries(banned))
    );
  } catch {
    // Ignore storage errors
  }
}

export function getHasManuallyLeft(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(HAS_MANUALLY_LEFT_KEY) === "true";
  } catch {
    return false;
  }
}

export function setHasManuallyLeft(hasLeft: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(HAS_MANUALLY_LEFT_KEY, hasLeft.toString());
  } catch {
    // Ignore storage errors
  }
}

export function removeBannedSession(sessionId: string): void {
  if (typeof window === "undefined") return;
  try {
    const banned = getBannedFromSessions();
    const session = banned.get(sessionId);
    if (session) {
      banned.delete(sessionId);
      banned.delete(session.code);
      // Store as array of unique sessions
      const sessionsArray = Array.from(
        new Map(
          Array.from(banned.values()).map((s) => [s.sessionId, s]),
        ).values(),
      );
      window.sessionStorage.setItem(
        BANNED_FROM_SESSIONS_KEY,
        JSON.stringify(sessionsArray),
      );
    }
  } catch {
    // Ignore sessionStorage errors
  }
}

export function addBannedSession(sessionId: string, code: string): void {
  if (typeof window === "undefined") return;
  try {
    const banned = getBannedFromSessions();
    const session: BannedSession = { sessionId, code };
    banned.set(sessionId, session);
    banned.set(code, session); // Also index by code
    // Store as array of unique sessions (by sessionId)
    const sessionsArray = Array.from(
      new Map(
        Array.from(banned.values()).map((s) => [s.sessionId, s]),
      ).values(),
    );
    window.sessionStorage.setItem(
      BANNED_FROM_SESSIONS_KEY,
      JSON.stringify(sessionsArray),
    );
  } catch {
    // Ignore sessionStorage errors
  }
}
