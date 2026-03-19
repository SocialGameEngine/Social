import { useCallback } from "react";
import { useVenueRoom } from "../../hooks/useVenueRoom";

export function useHostRoom() {
  const { room, loading, error, refreshRoom } = useVenueRoom();

  const roomId = room?.id ?? null;
  const roomCode = room?.code ?? null;

  const setHostRoom = useCallback((roomData: { roomId: string; roomCode: string } | null) => {
    // In the new system, rooms are managed by the venue room hook
    // We don't need to set anything manually since it's database-backed
    // This function is kept for compatibility but doesn't do anything
    if (roomData) {
      refreshRoom(); // Just refresh to ensure we have the latest data
    }
  }, [refreshRoom]);

  return {
    roomId,
    roomCode,
    setHostRoom,
    clearHostRoom: useCallback(() => {
      // In the new system, we don't clear rooms since they're tied to venues
      // This function is kept for compatibility
    }, []),
    loading,
    error,
  };
}
