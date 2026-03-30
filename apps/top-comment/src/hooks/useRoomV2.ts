/**
 * Enhanced Room Hook with Async State Architecture (V2)
 * 
 * Refactored useRoom with:
 * - AsyncSubscriptionResult contract
 * - Connection status tracking
 * - Subscription guards (waits for auth)
 * - Stale data detection
 * - Proper error handling and recovery
 * 
 * REPLACES: useRoom.ts (deprecated)
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../shared/providers/AuthContext';
import type { 
  Room, 
  RoomMembership, 
  CreateRoomRequest, 
  JoinRoomRequest
} from '../shared/types';
import { roomService } from '../services/roomService';
import { roomMembershipService } from '../services/roomMembershipService';
import { supabase } from '../supabase/client';
import { logger } from '../shared/utils/logger';
import type { AsyncSubscriptionResult, ConnectionStatus } from './async/types';

interface UseRoomOptions {
  roomId?: string;
  roomCode?: string;
}

interface RoomData {
  room: Room;
  memberships: RoomMembership[];
  myMembership: RoomMembership | null;
  isHost: boolean;
}

export function useRoomV2(options: UseRoomOptions = {}): AsyncSubscriptionResult<RoomData> & {
  // Retry state for race condition handling
  isRetrying: boolean;
  // Mutations
  createRoom: (request: CreateRoomRequest) => Promise<Room>;
  joinRoom: (request: JoinRoomRequest) => Promise<RoomMembership>;
  leaveRoom: () => Promise<void>;
  updateRoom: (updates: Partial<Room>) => Promise<Room>;
  kickMember: (userId: string, reason?: string) => Promise<void>;
  banMember: (userId: string, reason?: string) => Promise<void>;
  approveMember: (userId: string) => Promise<void>;
  rejectMember: (userId: string, reason?: string) => Promise<void>;
  startSession: (sessionSettings: any) => Promise<any>;
  endSession: () => Promise<void>;
  refreshMembers: () => Promise<void>;
} {
  const { user, loading: authLoading } = useAuth();
  const { roomId, roomCode } = options;

  const [room, setRoom] = useState<Room | null>(null);
  const [memberships, setMemberships] = useState<RoomMembership[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [error, setError] = useState<Error | null>(null);
  const [subscriptionError, setSubscriptionError] = useState<Error | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  
  const roomChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const membershipChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  
  // Retry state for room loading (handles race conditions)
  const loadAttempts = useRef(0);
  const maxLoadAttempts = 3;
  const loadRetryDelayMs = 1000;
  const [isRetrying, setIsRetrying] = useState(false);

  // Derived data
  const myMembership = user ? memberships.find(m => m.userId === user.id) || null : null;
  const isHost = user && room ? room.moderatorIds.includes(user.id) : false;

  const data: RoomData | null = room ? {
    room,
    memberships,
    myMembership,
    isHost,
  } : null;

  // Load room data with retry logic for race conditions
  const loadRoom = useCallback(async (silent = false) => {
    if (!roomId && !roomCode) return;

    try {
      if (!silent) setConnectionStatus("connecting");
      setError(null);
      
      let roomData;
      if (roomCode) {
        roomData = await roomService.getRoom({ code: roomCode });
      } else if (roomId) {
        roomData = await roomService.getRoom({ roomId });
      }

      if (!roomData?.room) {
        // Room not found - check if we should retry
        if (loadAttempts.current < maxLoadAttempts) {
          loadAttempts.current += 1;
          logger.debug(`Room not found, retrying`, { attempt: loadAttempts.current, maxAttempts: maxLoadAttempts });
          setIsRetrying(true);
          
          // Wait and retry
          await new Promise(resolve => setTimeout(resolve, loadRetryDelayMs));
          
          // Recursive retry
          return loadRoom(silent);
        }
        
        // Max retries reached, show error
        setIsRetrying(false);
        throw new Error(roomCode ? `Room code "${roomCode}" not found` : `Room ID "${roomId}" not found`);
      }

      // Success - reset retry counter
      loadAttempts.current = 0;
      setIsRetrying(false);
      setRoom(roomData.room);
      setLastUpdatedAt(Date.now());
      setError(null);
      if (!silent) setConnectionStatus("connected");
    } catch (err) {
      setIsRetrying(false);
      const errorObj = err instanceof Error ? err : new Error('Failed to load room');
      setError(errorObj);
      setConnectionStatus("error");
      console.error('❌ useRoomV2: Error loading room', err);
    }
  }, [roomId, roomCode]);

  // Refresh memberships
  const refreshMembers = useCallback(async () => {
    const targetRoomId = roomId || room?.id;
    if (!targetRoomId) return;

    try {
      const membershipsData = await roomMembershipService.getRoomMembers({ roomId: targetRoomId });
      setMemberships(membershipsData.members);
      setLastUpdatedAt(Date.now());
    } catch (err) {
      console.error('❌ refreshMembers error:', err);
      const errorObj = err instanceof Error ? err : new Error('Failed to load members');
      setSubscriptionError(errorObj);
    }
  }, [roomId, room?.id]);

  // Reconnection logic
  const reconnect = useCallback(() => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      setConnectionStatus("error");
      setError(new Error("Max reconnection attempts reached"));
      return;
    }

    reconnectAttempts.current += 1;
    setConnectionStatus("reconnecting");

    // Cleanup existing channels
    if (roomChannelRef.current) {
      supabase.removeChannel(roomChannelRef.current);
      roomChannelRef.current = null;
    }
    if (membershipChannelRef.current) {
      supabase.removeChannel(membershipChannelRef.current);
      membershipChannelRef.current = null;
    }

    // Retry after delay
    setTimeout(() => {
      loadRoom(true);
    }, 1000 * reconnectAttempts.current);
  }, [loadRoom]);

  // Create room mutation
  const createRoom = useCallback(async (request: CreateRoomRequest): Promise<Room> => {
    setError(null);
    try {
      const newRoom = await roomService.createRoom(request);
      setRoom(newRoom.room);
      setLastUpdatedAt(Date.now());
      return newRoom.room;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to create room');
      setError(errorObj);
      throw errorObj;
    }
  }, []);

  // Join room mutation
  const joinRoom = useCallback(async (request: JoinRoomRequest): Promise<RoomMembership> => {
    setError(null);
    try {
      const membership = await roomMembershipService.joinRoom(request);
      if (membership.room.id === roomId) {
        await refreshMembers();
      }
      return membership.membership;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to join room');
      setError(errorObj);
      throw errorObj;
    }
  }, [roomId, refreshMembers]);

  // Leave room mutation
  const leaveRoom = useCallback(async (): Promise<void> => {
    if (!myMembership || !room) return;
    setError(null);
    try {
      await roomMembershipService.leaveRoom({
        roomId: room.id,
        userId: myMembership.userId
      });
      setRoom(null);
      setMemberships([]);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to leave room');
      setError(errorObj);
      throw errorObj;
    }
  }, [myMembership, room]);

  // Update room mutation
  const updateRoom = useCallback(async (updates: Partial<Room>): Promise<Room> => {
    if (!room || !isHost) {
      throw new Error('Only hosts can update rooms');
    }
    setError(null);
    try {
      const updatedRoom = await roomService.updateRoom({
        roomId: room.id,
        ...updates
      });
      setRoom(updatedRoom.room);
      setLastUpdatedAt(Date.now());
      return updatedRoom.room;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to update room');
      setError(errorObj);
      throw errorObj;
    }
  }, [room, isHost]);

  // Kick member mutation
  const kickMember = useCallback(async (userId: string, reason?: string): Promise<void> => {
    if (!isHost || !room) throw new Error('Only hosts can kick members');
    setError(null);
    try {
      await roomMembershipService.kickMember({ roomId: room.id, userId, reason });
      await refreshMembers();
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to kick member');
      setError(errorObj);
      throw errorObj;
    }
  }, [isHost, room, refreshMembers]);

  // Ban member mutation
  const banMember = useCallback(async (userId: string, reason?: string): Promise<void> => {
    if (!isHost || !room) throw new Error('Only hosts can ban members');
    setError(null);
    try {
      await roomMembershipService.banMember({ roomId: room.id, userId, reason });
      await refreshMembers();
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to ban member');
      setError(errorObj);
      throw errorObj;
    }
  }, [isHost, room, refreshMembers]);

  // Approve member mutation
  const approveMember = useCallback(async (userId: string): Promise<void> => {
    if (!isHost || !room) throw new Error('Only hosts can approve members');
    setError(null);
    try {
      await roomMembershipService.approveMember({ roomId: room.id, userId });
      await refreshMembers();
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to approve member');
      setError(errorObj);
      throw errorObj;
    }
  }, [isHost, room, refreshMembers]);

  // Reject member mutation
  const rejectMember = useCallback(async (userId: string, reason?: string): Promise<void> => {
    if (!isHost || !room) throw new Error('Only hosts can reject members');
    setError(null);
    try {
      await roomMembershipService.rejectMember({ roomId: room.id, userId, reason });
      await refreshMembers();
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to reject member');
      setError(errorObj);
      throw errorObj;
    }
  }, [isHost, room, refreshMembers]);

  // Start session mutation
  const startSession = useCallback(async (sessionSettings: any): Promise<any> => {
    if (!room || !isHost) throw new Error('Only hosts can start sessions');
    setError(null);
    try {
      const result = await roomService.startSessionInRoom({
        roomId: room.id,
        sessionSettings
      });
      return result;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to start session');
      setError(errorObj);
      throw errorObj;
    }
  }, [room, isHost]);

  // End session mutation
  const endSession = useCallback(async (): Promise<void> => {
    if (!room || !isHost || !room.currentSessionId) {
      throw new Error('No active session to end');
    }
    setError(null);
    try {
      await roomService.endSessionInRoom({
        roomId: room.id,
        sessionId: room.currentSessionId
      });
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to end session');
      setError(errorObj);
      throw errorObj;
    }
  }, [room, isHost]);

  // Real-time subscription for room data - GUARDED by auth
  useEffect(() => {
    // GUARD: Don't subscribe until auth is resolved
    if (authLoading) {
      setConnectionStatus("connecting");
      return;
    }

    const targetRoomId = room?.id || roomId;
    if (!targetRoomId) {
      setConnectionStatus("disconnected");
      return;
    }

    logger.debug('Setting up room subscription', { roomId: targetRoomId });
    setConnectionStatus("connecting");

    const channel = supabase
      .channel(`room:${targetRoomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${targetRoomId}`,
        },
        (payload) => {
          logger.debug('Room update received', {
            roomId: targetRoomId,
            newCurrentSessionId: payload.new?.current_session_id,
            oldCurrentSessionId: payload.old?.current_session_id,
          });
          // Immediately update room state with new data from payload
          // This ensures we don't wait for the refetch
          if (payload.new) {
            const newRoom = {
              id: payload.new.id,
              code: payload.new.code,
              name: payload.new.name,
              creatorId: payload.new.creator_id,
              moderatorIds: payload.new.moderator_ids || [],
              currentSessionId: payload.new.current_session_id,
              settings: payload.new.settings || {},
              status: payload.new.status,
              createdAt: payload.new.created_at,
              updatedAt: payload.new.updated_at,
            };
            logger.debug('Updating room state', { roomId: newRoom.id, sessionId: newRoom.currentSessionId });
            setRoom(newRoom as Room);
            setLastUpdatedAt(Date.now());
          }
          // Also trigger a full refresh to ensure consistency
          loadRoom(true);
        }
      )
      .subscribe((status) => {
        logger.debug('Room subscription status', { status, roomId: targetRoomId });
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
          reconnectAttempts.current = 0;
        } else if (status === 'CHANNEL_ERROR') {
          setConnectionStatus('error');
          setSubscriptionError(new Error('Room subscription error'));
        } else if (status === 'TIMED_OUT') {
          reconnect();
        }
      });

    roomChannelRef.current = channel;

    return () => {
      logger.debug('Cleaning up room subscription', { roomId: targetRoomId });
      supabase.removeChannel(channel);
      roomChannelRef.current = null;
    };
  }, [room?.id, roomId, authLoading, loadRoom, reconnect]);

  // Real-time subscription for memberships - GUARDED by auth
  useEffect(() => {
    // GUARD: Don't subscribe until auth is resolved
    if (authLoading) return;

    const targetRoomId = room?.id || roomId;
    if (!targetRoomId) return;

    const channel = supabase
      .channel(`room_memberships:${targetRoomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_memberships',
          filter: `room_id=eq.${targetRoomId}`,
        },
        (payload: any) => {
          // Refresh on all membership changes
          if (payload.eventType === 'DELETE' && payload.old && payload.old.user_id === user?.id) {
            refreshMembers();
          } else if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            refreshMembers();
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
        } else if (status === 'CHANNEL_ERROR') {
          setSubscriptionError(new Error('Membership subscription error'));
        }
      });

    membershipChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      membershipChannelRef.current = null;
    };
  }, [room?.id, roomId, authLoading, refreshMembers, user?.id]);

  // Initial load effect - GUARDED by auth
  useEffect(() => {
    // GUARD: Don't load until auth is resolved
    if (authLoading) return;

    if (roomId || roomCode) {
      loadRoom();
      refreshMembers();
    }
  }, [roomId, roomCode, authLoading, loadRoom, refreshMembers]);

  // Calculate status - includes retry state for better UX
  const getStatus = () => {
    if (authLoading) return "booting" as const;
    if (isRetrying) return "loading" as const; // Show loading during retry, not error
    if (connectionStatus === "connecting") return "loading" as const;
    if (connectionStatus === "reconnecting") return "reconnecting" as const;
    if (connectionStatus === "error") return "error" as const;
    if (connectionStatus === "disconnected") return "degraded" as const;
    if (!data) return "empty" as const;
    
    const isStale = lastUpdatedAt ? Date.now() - lastUpdatedAt > 30000 : false;
    if (isStale) return "stale" as const;
    
    return "ready" as const;
  };

  const isStale = lastUpdatedAt ? Date.now() - lastUpdatedAt > 30000 : false;
  const canInteract = connectionStatus === "connected" || !!data;

  return {
    status: getStatus(),
    data,
    error,
    retry: reconnect,
    lastUpdatedAt,
    isStale,
    isRetrying, // Expose retry state for UI to show "Looking for room..."
    canInteract,
    connectionStatus,
    reconnect,
    subscriptionError,
    // Mutations
    createRoom,
    joinRoom,
    leaveRoom,
    updateRoom,
    kickMember,
    banMember,
    approveMember,
    rejectMember,
    startSession,
    endSession,
    refreshMembers,
  };
}
