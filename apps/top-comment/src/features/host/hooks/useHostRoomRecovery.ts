import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../../supabase/client";

export type HostRoomRecoveryStatus = 
  | 'idle'
  | 'waiting_for_identity'
  | 'recovering'
  | 'recovered'
  | 'no_room_found'
  | 'error';

export type RoomExistenceState =
  | 'unknown'
  | 'checking_storage'
  | 'validating_storage'
  | 'recovering_from_db'
  | 'room_found'
  | 'no_room_confirmed'
  | 'error';

interface UseHostRoomRecoveryResult {
  status: HostRoomRecoveryStatus;
  error: Error | null;
  roomExistenceState: RoomExistenceState;
}

interface UseHostRoomRecoveryProps {
  user: User | null;
  authLoading: boolean;
  isVenueAccount: boolean;
  venueAccountLoading: boolean;
  roomId: string | null;
  setRoomId: (id: string | null) => void;
  setHostRoom: (room: { roomId: string; code: string }) => void;
  setShowRoomCreateModal: (show: boolean) => void;
}

interface UseHostRoomRecoveryResult {
  status: HostRoomRecoveryStatus;
  error: Error | null;
}

export function useHostRoomRecovery({
  user,
  authLoading,
  isVenueAccount,
  venueAccountLoading,
  roomId,
  setRoomId,
  setHostRoom,
  setShowRoomCreateModal,
}: UseHostRoomRecoveryProps): UseHostRoomRecoveryResult {
  const [status, setStatus] = useState<HostRoomRecoveryStatus>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [roomExistenceState, setRoomExistenceState] = useState<RoomExistenceState>('unknown');
  const recoveryAttemptedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    // If we have a room (from localStorage or after creation), always mark as found.
    // This must run even if recovery was already attempted so that roomExistenceState
    // stays 'room_found' after a room is created mid-session.
    if (roomId) {
      setStatus('recovered');
      setRoomExistenceState('room_found');
      recoveryAttemptedRef.current = true;
      return;
    }

    // Don't retry DB recovery if already attempted
    if (recoveryAttemptedRef.current) return;

    // Wait for auth and venue account to complete
    if (authLoading || venueAccountLoading) {
      setStatus('waiting_for_identity');
      setRoomExistenceState('unknown');
      return;
    }

    // Not a venue account - skip recovery but mark as complete
    if (!user || user.is_anonymous || !isVenueAccount) {
      setStatus('idle');
      setRoomExistenceState('no_room_confirmed');
      recoveryAttemptedRef.current = true;
      return;
    }

    // Start recovery
    setStatus('recovering');
    setRoomExistenceState('recovering_from_db');
    setShowRoomCreateModal(false); // Hide create modal while we check

    const recoverRoom = async () => {
      try {
        // First, get the room_id associated with this venue account
        const { data: venueData, error: venueError } = await supabase
          .from("venue_accounts")
          .select("room_id")
          .eq("auth_user_id", user.id)
          .maybeSingle();

        if (venueError) {
          if (!cancelled) {
            const err = venueError instanceof Error ? venueError : new Error('Venue account query failed');
            setError(err);
            setStatus('error');
            setRoomExistenceState('error');
            recoveryAttemptedRef.current = true;
            setShowRoomCreateModal(true);
          }
          return;
        }

        if (!venueData?.room_id) {
          if (!cancelled) {
            setStatus('no_room_found');
            setRoomExistenceState('no_room_confirmed');
            recoveryAttemptedRef.current = true;
            setShowRoomCreateModal(true);
          }
          return;
        }

        // Now get the room details using the venue account's room_id
        const { data, error } = await supabase
          .from("rooms")
          .select("id, code, status, created_at")
          .eq("id", venueData.room_id)  // Use the specific room_id from venue account
          .maybeSingle();

        if (error) {
          if (!cancelled) {
            const err = error instanceof Error ? error : new Error('Database query failed');
            setError(err);
            setStatus('error');
            setRoomExistenceState('error');
            recoveryAttemptedRef.current = true; // Mark as attempted even on error
            setShowRoomCreateModal(true);
          }
          return;
        }

        if (data?.id && data?.code) {
          // Check if room is archived
          if (data.status === 'archived') {
            if (!cancelled) {
              setStatus('no_room_found'); // Archived rooms are not usable
              setRoomExistenceState('no_room_confirmed');
              recoveryAttemptedRef.current = true;
              setShowRoomCreateModal(true);
            }
            return;
          }
          
          if (!cancelled) {
            setRoomId(data.id);
            setHostRoom({ roomId: data.id, code: data.code });
            setStatus('recovered');
            setRoomExistenceState('room_found');
            recoveryAttemptedRef.current = true; // Mark as attempted after successful recovery
            setShowRoomCreateModal(false);
          }
        } else {
          if (!cancelled) {
            setStatus('no_room_found');
            setRoomExistenceState('no_room_confirmed');
            recoveryAttemptedRef.current = true; // Mark as attempted - conclusive result
            setShowRoomCreateModal(true);
          }
        }
      } catch (error: unknown) {
        if (!cancelled) {
          const err = error instanceof Error ? error : new Error('Unexpected recovery error');
          setError(err);
          setStatus('error');
          setRoomExistenceState('error');
          recoveryAttemptedRef.current = true;
          setShowRoomCreateModal(true);
        }
      }
    };

    recoverRoom();
    
    return () => {
      cancelled = true;
    };
  }, [
    authLoading,
    venueAccountLoading,
    user,
    isVenueAccount,
    roomId,
    setRoomId,
    setHostRoom,
    setShowRoomCreateModal,
  ]);

  return { status, error, roomExistenceState };
}
