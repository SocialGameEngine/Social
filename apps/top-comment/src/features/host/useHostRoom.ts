import { useCallback } from "react";
import { useVenueRoom } from "../../hooks/useVenueRoom";
import { useHostSession } from "./useHostSession";

export function useHostRoom() {
  const { room, loading, error, refreshRoom } = useVenueRoom();
  const { setHostSession } = useHostSession();

  const roomId = room?.id ?? null;
  const roomCode = room?.code ?? null;

  
  const setHostRoom = useCallback((roomData: { roomId: string; roomCode: string } | null) => {
    if (roomData) {
      // Update the stored session to the new room
      setHostSession({ sessionId: roomData.roomId, code: roomData.roomCode });
      refreshRoom(); // Refresh to ensure we have the latest data
    }
  }, [setHostSession, refreshRoom]);

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
