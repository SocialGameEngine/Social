import { useCallback, useState } from "react";

const HOST_SESSION_KEY = "sidebets_host_session";

type StoredHostSession = {
  sessionId: string;
  code: string;
};

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

export function useHostSession() {
  const [stored, setStored] = useState<StoredHostSession | null>(() =>
    readStoredSession(),
  );

  const setHostSession = useCallback((session: StoredHostSession | null) => {
    setStored(session);
    if (typeof window === "undefined") return;
    if (!session) {
      window.localStorage.removeItem(HOST_SESSION_KEY);
    } else {
      window.localStorage.setItem(HOST_SESSION_KEY, JSON.stringify(session));
    }
  }, []);

  return {
    sessionId: stored?.sessionId ?? null,
    code: stored?.code ?? null,
    setHostSession,
    clearHostSession: useCallback(() => setHostSession(null), [setHostSession]),
  };
}
