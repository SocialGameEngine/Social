import { useState, useCallback, useEffect } from 'react';
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
import { throttle } from '../shared/utils/realtimeThrottle';

interface UseRoomOptions {
  roomId?: string;
  roomCode?: string;
}

export function useRoom(options: UseRoomOptions = {}) {
  const { user } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [memberships, setMemberships] = useState<RoomMembership[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { roomId, roomCode } = options;

  // Get my membership
  const myMembership = user ? memberships.find(m => m.userId === user.id) : null;

  const isHost = user ? room?.moderatorIds.includes(user.id) || room?.creatorId === user.id : false;

  // Load room data
  const loadRoom = useCallback(async (overrideRoomId?: string, silent = false) => {
    const targetRoomId = overrideRoomId || roomId;
    const targetRoomCode = overrideRoomId ? undefined : roomCode;
    
    if (!targetRoomId && !targetRoomCode) return;

    try {
      if (!silent) setIsLoading(true);
      setError(null);
      
      let roomData;
      if (targetRoomCode) {
        // NEW: Load room by roomCode
        roomData = await roomService.getRoom({ code: targetRoomCode });
      } else if (targetRoomId) {
        // EXISTING: Load room by roomId
        roomData = await roomService.getRoom({ roomId: targetRoomId });
      }

      if (!roomData?.room) {
        throw new Error(targetRoomCode ? `Room code "${targetRoomCode}" not found` : `Room ID "${targetRoomId}" not found`);
      }

      setRoom(roomData.room);
      setError(null);
      if (!silent) setIsLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load room';
      setError(errorMessage);
      console.error('❌ useRoom: Error loading room', err);
      if (!silent) setIsLoading(false);
    }
  }, [roomId, roomCode]);

  // Refresh memberships
  const refreshMembers = useCallback(async () => {
    const targetRoomId = roomId || room?.id;
    
    if (!targetRoomId) {
      return;
    }

    try {
      const membershipsData = await roomMembershipService.getRoomMembers({ roomId: targetRoomId });
      setMemberships(membershipsData.members);
    } catch (err) {
      console.error('❌ refreshMembers error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load members');
    }
  }, [roomId, room?.id]);

  // Create room
  const createRoom = useCallback(async (request: CreateRoomRequest): Promise<Room> => {
    setIsLoading(true);
    setError(null);

    try {
      const newRoom = await roomService.createRoom(request);
      setRoom(newRoom.room);
      return newRoom.room;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create room';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Join room
  const joinRoom = useCallback(async (request: JoinRoomRequest): Promise<RoomMembership> => {
    setIsLoading(true);
    setError(null);

    try {
      const membership = await roomMembershipService.joinRoom(request);
      
      // Update room data if we joined successfully
      if (membership.room.id === roomId) {
        await refreshMembers();
      }
      
      return membership.membership;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join room';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [roomId, refreshMembers]);

  // Leave room
  const leaveRoom = useCallback(async (): Promise<void> => {
    if (!myMembership) return;

    setIsLoading(true);
    setError(null);

    try {
      await roomMembershipService.leaveRoom({
        roomId: room!.id,
        userId: myMembership.userId
      });
      
      // Clear local state
      setRoom(null);
      setMemberships([]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to leave room';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [myMembership]);

  // Update room
  const updateRoom = useCallback(async (updates: Partial<Room>): Promise<Room> => {
    if (!room || !isHost) {
      throw new Error('Only hosts can update rooms');
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedRoom = await roomService.updateRoom({
        roomId: room.id,
        ...updates
      });
      setRoom(updatedRoom.room);
      return updatedRoom.room;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update room';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [room, isHost]);

  // Kick member
  const kickMember = useCallback(async (userId: string, reason?: string): Promise<void> => {
    if (!isHost) {
      throw new Error('Only hosts can kick members');
    }

    setIsLoading(true);
    setError(null);

    try {
      await roomMembershipService.kickMember({
        roomId: room!.id,
        userId,
        reason
      });
      await refreshMembers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to kick member';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isHost, refreshMembers]);

  // Ban member
  const banMember = useCallback(async (userId: string, reason?: string): Promise<void> => {
    if (!isHost) {
      throw new Error('Only hosts can ban members');
    }

    setIsLoading(true);
    setError(null);

    try {
      await roomMembershipService.banMember({
        roomId: room!.id,
        userId,
        reason
      });
      await refreshMembers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to ban member';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isHost, refreshMembers]);

  // Approve member
  const approveMember = useCallback(async (userId: string): Promise<void> => {
    if (!isHost) {
      throw new Error('Only hosts can approve members');
    }

    setIsLoading(true);
    setError(null);

    try {
      await roomMembershipService.approveMember({
        roomId: room!.id,
        userId
      });
      await refreshMembers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve member';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isHost, refreshMembers]);

  // Reject member
  const rejectMember = useCallback(async (userId: string, reason?: string): Promise<void> => {
    if (!isHost) {
      throw new Error('Only hosts can reject members');
    }

    setIsLoading(true);
    setError(null);

    try {
      await roomMembershipService.rejectMember({
        roomId: room!.id,
        userId,
        reason
      });
      await refreshMembers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject member';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isHost, refreshMembers]);

  // Start session
  const startSession = useCallback(async (sessionSettings: any): Promise<any> => {
    if (!room || !isHost) {
      throw new Error('Only hosts can start sessions');
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await roomService.startSessionInRoom({
        roomId: room.id,
        sessionSettings
      });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start session';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [room, isHost]);

  // End session
  const endSession = useCallback(async (): Promise<void> => {
    if (!room || !isHost || !room.currentSessionId) {
      throw new Error('No active session to end');
    }

    setIsLoading(true);
    setError(null);

    try {
      await roomService.endSessionInRoom({
        roomId: room.id,
        sessionId: room.currentSessionId
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to end session';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [room, isHost]);

  // UNIFIED real-time subscription for room data + memberships
  // Consolidates 2 channels into 1 to reduce egress.
  useEffect(() => {
    const targetRoomId = room?.id || roomId;
    if (!targetRoomId) return;

    // Throttle membership refreshes to at most once per 2 seconds
    const throttledRefresh = throttle(() => refreshMembers(), 2000);

    const channel = supabase
      .channel(`room-unified:${targetRoomId}`)
      // Room table updates
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${targetRoomId}`,
        },
        () => {
          loadRoom(undefined, true); // Silent refresh - no loading state
        }
      )
      // Room memberships changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_memberships',
          filter: `room_id=eq.${targetRoomId}`,
        },
        (payload: any) => {
          if (payload.eventType === 'DELETE' && payload.old && payload.old.user_id === user?.id) {
            throttledRefresh();
          } else if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            throttledRefresh();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      throttledRefresh.cancel();
    };
  }, [room?.id, roomId, loadRoom, refreshMembers, user?.id]);

  // Initial load effect
  useEffect(() => {
    if (roomId || roomCode) {
      loadRoom();
      refreshMembers();
    }
  }, [roomId, roomCode, loadRoom, refreshMembers]);

  return {
    room,
    memberships,
    myMembership,
    isHost,
    isLoading,
    error,
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
