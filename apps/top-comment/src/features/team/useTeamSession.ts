import { useCallback, useState } from "react";

type TeamSession = {
  sessionId: string;
  teamId: string;
  teamName: string;
  code: string;
  uid?: string;
  playerName?: string;
};

const TEAM_SESSION_KEY = "sidebets_team_session";

const readStoredTeam = (): TeamSession | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(TEAM_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TeamSession;
    if (parsed.sessionId && parsed.teamId) {
      return parsed;
    }
    return null;
  } catch (error) {
    console.error("Failed to read team session", error);
    return null;
  }
};

export function useTeamSession() {
  const [stored, setStored] = useState<TeamSession | null>(() =>
    readStoredTeam(),
  );

  const setTeamSession = useCallback((value: TeamSession | null) => {
    setStored(value);
    if (typeof window === "undefined") return;
    if (!value) {
      window.localStorage.removeItem(TEAM_SESSION_KEY);
    } else {
      window.localStorage.setItem(TEAM_SESSION_KEY, JSON.stringify(value));
    }
  }, []);

  return {
    teamSession: stored,
    setTeamSession,
    clearTeamSession: useCallback(
      () => setTeamSession(null),
      [setTeamSession],
    ),
  };
}

