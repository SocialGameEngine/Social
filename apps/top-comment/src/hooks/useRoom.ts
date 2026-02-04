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

interface UseRoomOptions {
  roomId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useRoom(options: UseRoomOptions = {}) {
  const { user } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [memberships, setMemberships] = useState<RoomMembership[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { roomId, autoRefresh = true, refreshInterval = 5000 } = options;

  // Get my membership
  const myMembership = user ? memberships.find(m => m.userId === user.id) : null;

  // Debug myMembership calculation (only log when there are issues)
  if (!user && memberships.length > 0) {
    console.log('🔍 myMembership calculation: User not authenticated but memberships exist', {
      membershipsCount: memberships.length,
      memberships: memberships.map(m => ({ id: m.id, userId: m.userId, playerName: m.playerName }))
    });
  }

  const isHost = myMembership?.isHost || false;

  // Load room data
  const loadRoom = useCallback(async (roomId: string) => {
    if (!roomId) return;

    try {
      setIsLoading(true);
      const roomData = await roomService.getRoom({ roomId });
      setRoom(roomData.room);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load room');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh memberships
  const refreshMembers = useCallback(async () => {
    if (!roomId) return;

        
    try {
      const membershipsData = await roomMembershipService.getRoomMembers({ roomId });
            setMemberships(membershipsData.members);
    } catch (err) {
      console.error('❌ refreshMembers error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load members');
    }
  }, [roomId]);

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
        await loadRoom(roomId);
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
  }, [roomId, loadRoom, refreshMembers]);

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
      await loadRoom(room.id);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start session';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [room, isHost, loadRoom]);

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
      await loadRoom(room.id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to end session';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [room, isHost, loadRoom]);

  // Real-time subscription for room memberships
  useEffect(() => {
    if (!roomId) return;

    
    const channel = supabase
      .channel(`room_memberships:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_memberships',
          filter: `room_id=eq.${roomId}`,
        },
        (payload: any) => {
                    
          // Check if this is a DELETE event for the current user
          if (payload.eventType === 'DELETE' && payload.old && payload.old.user_id === user?.id) {
                        refreshMembers(); // Only refresh on DELETE events for current user
          } else if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            refreshMembers(); // Refresh on INSERT/UPDATE events
          }
          // Don't refresh on other events to avoid race conditions
        }
      )
      .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                  } else if (status === 'TIMED_OUT' || status === 'CLOSED') {
                  }
      });

    return () => {
            supabase.removeChannel(channel);
    };
  }, [roomId, refreshMembers]);

  // Auto-refresh effect
  useEffect(() => {
    if (!roomId || !autoRefresh) return;

    const interval = setInterval(() => {
      loadRoom(roomId);
      refreshMembers();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [roomId, autoRefresh, refreshInterval, loadRoom, refreshMembers]);

  // Initial load effect
  useEffect(() => {
    if (roomId) {
      loadRoom(roomId);
      refreshMembers();
    }
  }, [roomId, loadRoom, refreshMembers]);

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
