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
} from '../shared/types';
import type { Room, RoomMembership } from '../domain/types/room.types';

// Helper to convert Supabase room to our Room type
function mapRoom(data: any): Room | null {
  if (!data) return null;
  
  return {
    id: data.id,
    code: data.code,
    hostUid: data.host_uid,
    name: data.name || "",
    description: data.description,
    status: data.status,
    maxPlayers: data.max_players,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    settings: data.settings || {},
    currentSessionId: data.current_session_id,
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
    isHost: data.is_host,
    isBanned: data.is_banned,
    banReason: data.ban_reason,
    bannedAt: data.banned_at,
    bannedBy: data.banned_by,
    status: data.status || 'active',
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
    host_uid: userData.user.id,
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
      .single();

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

export const roomService = {
  createRoom,
  getRoom,
  updateRoom,
  getRoomAnalytics,
  startSessionInRoom,
  endSessionInRoom,
  archiveRoom,
};
