import { useCallback, useState } from "react";

const HOST_ROOM_KEY = "sidebets_host_room";

type StoredHostRoom = {
  roomId: string;
  roomCode: string;
};

const readStoredRoom = (): StoredHostRoom | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(HOST_ROOM_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredHostRoom;
    if (parsed.roomId && parsed.roomCode) {
      return parsed;
    }
    return null;
  } catch (error) {
    console.error("Failed to parse host room storage", error);
    return null;
  }
};

export function useHostRoom() {
  const [stored, setStored] = useState<StoredHostRoom | null>(() =>
    readStoredRoom(),
  );

  const setHostRoom = useCallback((room: StoredHostRoom | null) => {
    setStored(room);
    if (typeof window === "undefined") return;
    if (!room) {
      window.localStorage.removeItem(HOST_ROOM_KEY);
    } else {
      window.localStorage.setItem(HOST_ROOM_KEY, JSON.stringify(room));
    }
  }, []);

  return {
    roomId: stored?.roomId ?? null,
    roomCode: stored?.roomCode ?? null,
    setHostRoom,
    clearHostRoom: useCallback(() => setHostRoom(null), [setHostRoom]),
  };
}
