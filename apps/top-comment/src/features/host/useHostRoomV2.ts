/**
 * Enhanced Host Room Hook with Async State Architecture (V2)
 * 
 * REPLACES: useHostRoom.ts (deprecated)
 * 
 * Features:
 * - Server validation before using localStorage
 * - Recovery state tracking
 * - Prevents stale room data from overriding server state
 */

import { useCallback, useState, useEffect } from "react";
import { supabase } from "../../supabase/client";
import type { RecoveryState } from "../../hooks/async/types";

const HOST_ROOM_KEY = "sidebets_host_room";

type StoredHostRoom = {
  roomId: string;
  code: string;
  timestamp?: number;
};

interface UseHostRoomV2Result {
  roomId: string | null;
  code: string | null;
  recoveryState: RecoveryState;
  isValidated: boolean;
  setHostRoom: (room: StoredHostRoom | null) => void;
  clearHostRoom: () => void;
  validateRoom: () => Promise<boolean>;
}

const readStoredRoom = (): StoredHostRoom | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(HOST_ROOM_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredHostRoom;
    if (parsed.roomId && parsed.code) {
      return parsed;
    }
    return null;
  } catch (error) {
    console.error("Failed to parse host room storage", error);
    return null;
  }
};

const isRoomStale = (room: StoredHostRoom | null): boolean => {
  if (!room || !room.timestamp) return true;
  const STALE_THRESHOLD = 7 * 24 * 60 * 60 * 1000; // 7 days
  return Date.now() - room.timestamp > STALE_THRESHOLD;
};

export function useHostRoomV2(): UseHostRoomV2Result {
  const [stored, setStored] = useState<StoredHostRoom | null>(() =>
    readStoredRoom()
  );
  const [recoveryState, setRecoveryState] = useState<RecoveryState>({
    status: "checking_storage",
    error: null,
  });
  const [isValidated, setIsValidated] = useState(false);

  // Validate room against server
  const validateRoom = useCallback(async (): Promise<boolean> => {
    if (!stored?.roomId) {
      setRecoveryState({ status: "expired", error: null });
      setIsValidated(false);
      return false;
    }

    setRecoveryState({ status: "validating", error: null });

    try {
      // Check if room exists in database
      const { data, error } = await supabase
        .from("rooms")
        .select("id, code, status")
        .eq("id", stored.roomId)
        .single();

      if (error || !data) {
        // Room not found or error
        setRecoveryState({ status: "expired", error: null });
        setIsValidated(false);
        clearHostRoom();
        return false;
      }

      // Check if room is still active
      if (data.status === "archived" || data.status === "suspended") {
        setRecoveryState({ status: "expired", error: null });
        setIsValidated(false);
        clearHostRoom();
        return false;
      }

      // Room is valid
      setRecoveryState({ status: "recovered", error: null });
      setIsValidated(true);
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Validation failed");
      setRecoveryState({ status: "corrupted", error });
      setIsValidated(false);
      return false;
    }
  }, [stored?.roomId]);

  // Auto-validate on mount if room exists
  useEffect(() => {
    if (!stored) {
      setRecoveryState({ status: "expired", error: null });
      setIsValidated(false);
      return;
    }

    // Check if stale
    if (isRoomStale(stored)) {
      console.warn("Host room is stale, validating with server...");
      validateRoom();
      return;
    }

    // Validate with server
    validateRoom();
  }, [stored, validateRoom]);

  const setHostRoom = useCallback((room: StoredHostRoom | null) => {
    if (typeof window === "undefined") return;
    
    if (!room) {
      setStored(null);
      setIsValidated(false);
      window.localStorage.removeItem(HOST_ROOM_KEY);
      setRecoveryState({ status: "expired", error: null });
    } else {
      // Add timestamp when storing
      const roomWithTimestamp = {
        ...room,
        timestamp: Date.now(),
      };
      setStored(roomWithTimestamp);
      setIsValidated(true);
      window.localStorage.setItem(HOST_ROOM_KEY, JSON.stringify(roomWithTimestamp));
      setRecoveryState({ status: "recovered", error: null });
    }
  }, []);

  const clearHostRoom = useCallback(() => {
    setHostRoom(null);
  }, [setHostRoom]);

  return {
    roomId: isValidated ? stored?.roomId ?? null : null,
    code: isValidated ? stored?.code ?? null : null,
    recoveryState,
    isValidated,
    setHostRoom,
    clearHostRoom,
    validateRoom,
  };
}
