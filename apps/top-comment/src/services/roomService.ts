import { supabase } from "../supabase/client";

import type {
  CreateRoomRequest,
  CreateRoomResponse,
  UpdateRoomRequest,
  UpdateRoomResponse,
  GetRoomRequest,
  GetRoomResponse,
  GetRoomAnalyticsRequest,
  GetRoomAnalyticsResponse,
  StartSessionInRoomRequest,
  StartSessionInRoomResponse,
  EndSessionInRoomRequest,
  EndSessionInRoomResponse,
  StartSocialeInRoomRequest,
  StartSocialeInRoomResponse,
  EndSocialeInRoomRequest,
  EndSocialeInRoomResponse,
} from '../shared/types';
import type { Room, RoomMembership } from '../domain/types/room.types';

// Helper to convert Supabase room to our Room type
function mapRoom(data: any): Room | null {
  if (!data) return null;
  
  return {
    id: data.id,
    code: data.code,
    moderatorIds: data.moderator_ids || [],
    creatorId: data.creator_id || data.host_uid, // Fallback to host_uid during migration
    name: data.name || "",
    description: data.description,
    status: data.status,
    maxPlayers: data.max_players,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    settings: data.settings || {},
    currentSessionId: data.current_session_id,
    currentSocialeId: data.current_sociale_id ?? null,
    totalSessionsPlayed: data.total_sessions_played || 0,
  };
}

// Helper to convert Supabase room membership to our RoomMembership type
function mapRoomMembership(data: any): RoomMembership | null {
  if (!data) return null;
  
  return {
    id: data.id,
    roomId: data.room_id,
    userId: data.user_id,
    playerName: data.player_name,
    mascotId: data.mascot_id,
    joinedAt: data.joined_at,
    lastActiveAt: data.last_active_at,
    isBanned: data.is_banned,
    banReason: data.ban_reason,
    bannedAt: data.banned_at,
    bannedBy: data.banned_by,
    status: data.status || 'active',
    currentStreak: typeof data.current_streak === 'number' ? data.current_streak : undefined,
  };
}

// Create a new room
export async function createRoom(request: CreateRoomRequest): Promise<CreateRoomResponse> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("User not authenticated");
  }

  // Generate a unique room code
  const roomCode = await generateUniqueRoomCode();

  const roomData = {
    code: roomCode,
    host_uid: userData.user.id, // Legacy field for compatibility
    creator_id: userData.user.id, // New field for creator reference
    moderator_ids: [userData.user.id], // New field: creator is automatically a moderator
    name: request.name,
    description: request.description,
    max_players: request.maxPlayers || 50,
    settings: {
      maxPlayers: request.maxPlayers || 50,
      allowPlayerChat: request.settings?.allowPlayerChat ?? true,
      autoStartSession: request.settings?.autoStartSession ?? false,
      defaultSessionSettings: request.settings?.defaultSessionSettings || {},
      requireApproval: request.settings?.requireApproval ?? false,
      allowAnonymous: request.settings?.allowAnonymous ?? true,
      ...request.settings,
    },
  };

  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .insert(roomData)
    .select()
    .single();

  if (roomError) {
    throw new Error(`Failed to create room: ${roomError.message}`);
  }

  // Create host membership
  const membershipData = {
    room_id: room.id,
    user_id: userData.user.id,
    player_name: "Host",
    is_host: true,
    status: 'active',
  };

  const { data: membership, error: membershipError } = await supabase
    .from('room_memberships')
    .insert(membershipData)
    .select()
    .single();

  if (membershipError) {
    // Rollback room creation if membership fails
    await supabase.from('rooms').delete().eq('id', room.id);
    throw new Error(`Failed to create host membership: ${membershipError.message}`);
  }

  const mappedRoom = mapRoom(room);
  const mappedMembership = mapRoomMembership(membership);

  if (!mappedRoom || !mappedMembership) {
    throw new Error("Failed to map created room or membership");
  }

  return {
    room: mappedRoom,
    membership: mappedMembership,
  };
}

// Get a room by ID or code
export async function getRoom(request: GetRoomRequest): Promise<GetRoomResponse> {
  let query = supabase.from('rooms').select(`
    *,
    room_memberships (*)
  `);

  if (request.roomId) {
    query = query.eq('id', request.roomId);
  } else if (request.code) {
    query = query.eq('code', request.code);
  } else {
    throw new Error("Either roomId or code must be provided");
  }

  const { data, error } = await query.single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error("Room not found");
    }
    throw new Error(`Failed to get room: ${error.message}`);
  }

  const mappedRoom = mapRoom(data);
  if (!mappedRoom) {
    throw new Error("Failed to map room data");
  }

  return {
    room: mappedRoom,
  };
}

// Update room settings
export async function updateRoom(request: UpdateRoomRequest): Promise<UpdateRoomResponse> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("User not authenticated");
  }

  // Verify user is host
  const { data: roomData, error: roomError } = await supabase
    .from('rooms')
    .select('host_uid')
    .eq('id', request.roomId)
    .single();

  if (roomError || !roomData) {
    throw new Error("Room not found");
  }

  if (roomData.host_uid !== userData.user.id) {
    throw new Error("Only the host can update room settings");
  }

  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (request.name !== undefined) {
    updateData.name = request.name;
  }

  if (request.description !== undefined) {
    updateData.description = request.description;
  }

  if (request.settings) {
    updateData.settings = request.settings;
  }

  const { data, error } = await supabase
    .from('rooms')
    .update(updateData)
    .eq('id', request.roomId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update room: ${error.message}`);
  }

  const mappedRoom = mapRoom(data);
  if (!mappedRoom) {
    throw new Error("Failed to map updated room");
  }

  return {
    room: mappedRoom,
  };
}

// Get room analytics
export async function getRoomAnalytics(request: GetRoomAnalyticsRequest): Promise<GetRoomAnalyticsResponse> {
  // This would calculate room analytics
  // For now, return basic analytics
  const { data: sessions } = await supabase
    .from('top_comment_sessions')
    .select('id, created_at, ended_at')
    .eq('room_id', request.roomId);

  const { data: memberships } = await supabase
    .from('room_memberships')
    .select('user_id, joined_at')
    .eq('room_id', request.roomId)
    .eq('is_banned', false);

  const analytics = {
    roomId: request.roomId,
    totalSessionsPlayed: sessions?.length || 0,
    totalUniquePlayers: new Set(memberships?.map(m => m.user_id).filter(Boolean)).size,
    averageSessionDuration: 0, // Would calculate from session data
    mostActivePlayers: [], // Would calculate from participation data
    lastActivityAt: new Date().toISOString(),
  };

  return {
    analytics,
  };
}

// Generate a unique room code
export async function generateUniqueRoomCode(): Promise<string> {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // Check if code is already taken
    const { data } = await supabase
      .from('rooms')
      .select('code')
      .eq('code', code)
      .maybeSingle();

    if (!data) {
      return code;
    }

    attempts++;
  }

  throw new Error("Failed to generate unique room code after multiple attempts");
}

// Archive a room
export async function archiveRoom(roomId: string): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("User not authenticated");
  }

  // Verify user is host
  const { data: roomData, error: roomError } = await supabase
    .from('rooms')
    .select('host_uid')
    .eq('id', roomId)
    .single();

  if (roomError || !roomData) {
    throw new Error("Room not found");
  }

  if (roomData.host_uid !== userData.user.id) {
    throw new Error("Only the host can archive the room");
  }

  const { error } = await supabase
    .from('rooms')
    .update({ 
      status: 'archived',
      updated_at: new Date().toISOString(),
    })
    .eq('id', roomId);

  if (error) {
    throw new Error(`Failed to archive room: ${error.message}`);
  }
}

// Start a session in a room
export async function startSessionInRoom(request: StartSessionInRoomRequest): Promise<StartSessionInRoomResponse> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("User not authenticated");
  }

  // Call the Supabase function
  const { data, error } = await supabase.functions.invoke('rooms-start-session', {
    body: {
      roomId: request.roomId,
      sessionSettings: request.sessionSettings,
    },
  });

  if (error) {
    throw new Error(`Failed to start session: ${error.message}`);
  }

  return data;
}

// End a session in a room
export async function endSessionInRoom(request: EndSessionInRoomRequest): Promise<EndSessionInRoomResponse> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("User not authenticated");
  }

  // Call the Supabase function
  const { data, error } = await supabase.functions.invoke('rooms-end-session', {
    body: {
      roomId: request.roomId,
      sessionId: request.sessionId,
    },
  });

  if (error) {
    throw new Error(`Failed to end session: ${error.message}`);
  }

  return data;
}

// Start a Sociale in a room (pointer-aware orchestration)
export async function startSocialeInRoom(
  request: StartSocialeInRoomRequest,
  queryClient?: any
): Promise<StartSocialeInRoomResponse> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase.functions.invoke<StartSocialeInRoomResponse>('rooms-start-sociale', {
    body: {
      roomId: request.roomId,
      socialeSettings: request.socialeSettings,
    },
  });

  if (error) {
    // Try to parse the error context for more details
    let errorMessage = `Failed to start Sociale: ${error.message}`;
    let errorDetails = null;
    
    try {
      if (error.context && typeof error.context === 'string') {
        const parsed = JSON.parse(error.context);
        if (parsed.error || parsed.details) {
          errorMessage = parsed.error || errorMessage;
          errorDetails = parsed.details;
        }
      }
    } catch (e) {
      // If parsing fails, use the original error
    }
    
    const fullError = new Error(errorMessage);
    if (errorDetails) {
      (fullError as any).details = errorDetails;
    }
    throw fullError;
  }

  // OPTIMISTIC UPDATE: Immediately invalidate queries so UI updates from edge function response
  // This eliminates dependency on real-time event timing
  if (queryClient && data) {
    console.log('🔥 OPTIMISTIC UPDATE: Invalidating queries for room', request.roomId);
    
    // Invalidate room query to pick up the new currentSocialeId
    queryClient.invalidateQueries({ queryKey: ['room', request.roomId] });
    queryClient.invalidateQueries({ queryKey: ['rooms'] });
    
    // Invalidate Sociales list to include the newly started Sociale
    console.log('🔥 OPTIMISTIC UPDATE: Invalidating Sociales list for room', request.roomId);
    queryClient.invalidateQueries({ queryKey: ['sociales', 'room', request.roomId] });
    
    // If the response includes the Sociale, we could also set it directly
    if (data.sociale) {
      console.log('🔥 OPTIMISTIC UPDATE: Invalidating specific Sociale', data.sociale.id);
      queryClient.invalidateQueries({ queryKey: ['sociale', data.sociale.id] });
    }
    
    console.log('🔥 OPTIMISTIC UPDATE: All queries invalidated, UI should update now');
  }

  return data as StartSocialeInRoomResponse;
}

// End or cancel a Sociale in a room (clears pointer)
export async function endSocialeInRoom(request: EndSocialeInRoomRequest): Promise<EndSocialeInRoomResponse> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase.functions.invoke<EndSocialeInRoomResponse>('rooms-end-sociale', {
    body: {
      roomId: request.roomId,
      socialeId: request.socialeId,
      mode: request.mode ?? 'end',
    },
  });

  if (error) {
    throw new Error(`Failed to end Sociale: ${error.message}`);
  }

  return data as EndSocialeInRoomResponse;
}

async function deleteRoom(roomId: string): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error('User not authenticated');

  // Delete legacy sessions (FK: top_comment_sessions_room_id_fkey → rooms.id, no cascade)
  await supabase
    .from('top_comment_sessions' as any)
    .delete()
    .eq('room_id', roomId);

  // Null out venue_accounts.room_id (FK: venue_accounts_room_id_fkey → rooms.id, no cascade)
  await supabase
    .from('venue_accounts' as any)
    .update({ room_id: null })
    .eq('room_id', roomId);

  // Explicit cleanup for socialites (FK: socialites_membership_id_fkey → room_memberships.id)
  // which does not cascade from the rooms table directly.
  const { data: memberships } = await supabase
    .from('room_memberships')
    .select('id')
    .eq('room_id', roomId);

  if (memberships?.length) {
    for (const m of memberships) {
      await supabase.from('socialites').delete().eq('membership_id', m.id);
    }
  }

  const { error } = await supabase
    .from('rooms')
    .delete()
    .eq('id', roomId)
    .eq('host_uid', userData.user.id);

  if (error) throw new Error(`Failed to delete room: ${error.message}`);
}

export const roomService = {
  createRoom,
  getRoom,
  updateRoom,
  getRoomAnalytics,
  startSessionInRoom,
  endSessionInRoom,
  startSocialeInRoom,
  endSocialeInRoom,
  archiveRoom,
  deleteRoom,
};
