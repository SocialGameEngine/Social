import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../shared/providers/AuthContext';
import { getOrCreateVenueRoom, getVenueRoom } from '../services/venueRoomService';
import type { Room } from '../shared/types';

/**
 * Hook to manage a venue's single room
 * Ensures each venue account has exactly one room
 */
export function useVenueRoom() {
  const { venueAccount, venueAccountLoading } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true); // Start with true to prevent race conditions
  const [error, setError] = useState<string | null>(null);

  // Load or create venue room
  const loadVenueRoom = useCallback(async () => {
    if (!venueAccount?.id || !venueAccount?.authUserId) {
      setRoom(null);
      setLoading(false); // Set loading to false when no venue account
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const venueRoom = await getOrCreateVenueRoom(venueAccount.authUserId);
      setRoom(venueRoom);
    } catch (err) {
      console.error('Error loading venue room:', err);
      setError(err instanceof Error ? err.message : 'Failed to load venue room');
    } finally {
      setLoading(false);
    }
  }, [venueAccount?.authUserId]);

  // Get existing venue room without creating
  const getExistingRoom = useCallback(async (): Promise<Room | null> => {
    if (!venueAccount?.authUserId) return null;

    try {
      return await getVenueRoom(venueAccount.authUserId);
    } catch (err) {
      console.error('Error getting existing venue room:', err);
      return null;
    }
  }, [venueAccount?.authUserId]);

  // Load room when venue account is available
  useEffect(() => {
    if (!venueAccountLoading && venueAccount?.id) {
      loadVenueRoom();
    }
  }, [venueAccountLoading, venueAccount?.id, loadVenueRoom]);

  return {
    room,
    loading,
    error,
    refreshRoom: loadVenueRoom,
    getExistingRoom,
  };
}
