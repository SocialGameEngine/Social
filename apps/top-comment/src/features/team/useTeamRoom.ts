import { useCallback, useState } from "react";

type TeamRoom = {
  roomId: string;
  roomCode: string;
  playerName: string;
  // No membershipId needed - we use UUID-based user identification
};

const TEAM_ROOM_KEY = "sidebets_team_room";

const readStoredTeamRoom = (): TeamRoom | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(TEAM_ROOM_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TeamRoom;
    if (parsed.roomId && parsed.roomCode) {
      return parsed;
    }
    return null;
  } catch (error) {
    console.error("Failed to read team room", error);
    return null;
  }
};

export function useTeamRoom() {
  const [stored, setStored] = useState<TeamRoom | null>(() =>
    readStoredTeamRoom(),
  );

  const setTeamRoom = useCallback((value: TeamRoom | null) => {
    setStored(value);
    if (typeof window === "undefined") return;
    if (!value) {
      window.localStorage.removeItem(TEAM_ROOM_KEY);
    } else {
      window.localStorage.setItem(TEAM_ROOM_KEY, JSON.stringify(value));
    }
  }, []);

  return {
    teamRoom: stored,
    setTeamRoom,
    clearTeamRoom: useCallback(() => setTeamRoom(null), [setTeamRoom]),
  };
}
