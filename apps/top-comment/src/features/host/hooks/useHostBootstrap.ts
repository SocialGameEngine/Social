import { useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import type { Session } from "../../../shared/types";
import type { UseSessionOrchestratorReturn } from "../../../application/types/application.types";
import { logger } from "../../../shared/utils/logger";

interface UseHostBootstrapParams {
  // Auth state
  user: User | null;
  authLoading: boolean;
  
  // Venue account
  venueAccountLoading: boolean;
  isVenueAccount: boolean;
  refreshVenueAccount: () => Promise<any>;
  
  // Room recovery
  isBootstrapComplete: boolean;
  roomExistenceState: string;
  
  // Session state
  session: Session | null;
  sessionRef: React.MutableRefObject<Session | null>;
  orchestrator: UseSessionOrchestratorReturn;
  
  // Modal state
  roomModalMode: 'create' | 'settings' | null;
  setRoomModalMode: (mode: 'create' | 'settings' | null) => void;
  
  // Session/Room setters
  clearHostSession: () => void;
  setHostRoom: (data: { roomId: string; code: string }) => void;
}

export function useHostBootstrap(params: UseHostBootstrapParams) {
  const {
    user,
    authLoading,
    venueAccountLoading,
    isVenueAccount,
    refreshVenueAccount,
    isBootstrapComplete,
    roomExistenceState,
    session,
    sessionRef,
    orchestrator,
    roomModalMode,
    setRoomModalMode,
    clearHostSession,
    setHostRoom,
  } = params;

  // Clear stored data when user signs out
  useEffect(() => {
    if (!user || user.is_anonymous) {
      // Clear any stored session/room data when user is not authenticated
      clearHostSession();
      setHostRoom({ roomId: '', code: '' });
    }
  }, [user, clearHostSession, setHostRoom]);

  // Automatically load venue account when HostPage mounts
  useEffect(() => {
    if (user && !user.is_anonymous && !venueAccountLoading && !isVenueAccount) {
      refreshVenueAccount().catch((error) => {
        logger.error('Failed to load venue account on HostPage mount', { error });
      });
    }
  }, [user, venueAccountLoading, isVenueAccount, refreshVenueAccount]);

  // Auto-open create modal ONLY when room existence is conclusively "no_room_confirmed"
  // This effect handles AUTOMATIC modal opening, NOT manual settings button
  useEffect(() => {
    // Never auto-open for unauthenticated users
    if (!user || user.is_anonymous) {
      if (roomModalMode === 'create') {
        setRoomModalMode(null);
      }
      return;
    }
    
    // CRITICAL: Only make decisions when bootstrap is COMPLETE
    if (!isBootstrapComplete) {
      // Force modal closed during bootstrap to prevent flicker
      if (roomModalMode === 'create') {
        setRoomModalMode(null);
      }
      return;
    }
    
    // At this point, bootstrap is complete - make final decision based on room existence state
    // ONLY auto-open when room existence is conclusively "no_room_confirmed"
    const shouldAutoOpenCreate = isVenueAccount && 
      roomExistenceState === 'no_room_confirmed';
    
    // Only auto-open in "create" mode, never close "settings" mode
    if (shouldAutoOpenCreate && roomModalMode === null) {
      setRoomModalMode('create');
    } else if (!shouldAutoOpenCreate && roomModalMode === 'create') {
      setRoomModalMode(null);
    }
    // IMPORTANT: Never auto-close "settings" mode - user must close manually
  }, [user, isBootstrapComplete, roomExistenceState, isVenueAccount, roomModalMode, authLoading, venueAccountLoading, setRoomModalMode]);

  // Set sessionRef.current to latest session for auto advance actions
  useEffect(() => {
    sessionRef.current = session ?? null;
  }, [session, sessionRef]);

  return {
    isBootstrapping: !isBootstrapComplete,
  };
}
