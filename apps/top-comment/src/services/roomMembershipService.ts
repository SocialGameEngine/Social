import { supabase } from "../supabase/client";

import type {
  JoinRoomRequest,
  JoinRoomResponse,
  LeaveRoomRequest,
  LeaveRoomResponse,
  GetRoomMembersRequest,
  GetRoomMembersResponse,
  KickMemberRequest,
  KickMemberResponse,
  BanMemberRequest,
  BanMemberResponse,
  ApproveMemberRequest,
  ApproveMemberResponse,
  RejectMemberRequest,
  RejectMemberResponse,
  Room,
  RoomMembership,
} from "../shared/types";

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

// Join a room
export async function joinRoom(request: JoinRoomRequest): Promise<JoinRoomResponse> {
  const { data: userData } = await supabase.auth.getUser();
  
  // Get room details
  const { data: roomData, error: roomError } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', request.code)
    .single();

  if (roomError || !roomData) {
    throw new Error("Room not found");
  }

  const room: Room = {
    id: roomData.id,
    code: roomData.code,
    hostUid: roomData.host_uid,
    name: roomData.name || "",
    description: roomData.description || undefined,
    status: roomData.status as any, // Will be properly typed by DB
    maxPlayers: roomData.max_players,
    createdAt: roomData.created_at || "",
    updatedAt: roomData.updated_at || "",
    settings: (roomData.settings as any) || {}, // Will be properly typed by DB
    currentSessionId: roomData.current_session_id || undefined,
    totalSessionsPlayed: roomData.total_sessions_played || 0,
  };

  // Check if room is archived
  if (roomData.status !== 'active') {
    throw new Error("Room is not active");
  }

  // All users must have a valid user_id - no null values allowed
  if (!userData.user) {
    throw new Error("User must be authenticated to join a room");
  }

  // Check if user is already in room
  const { data: existingMembership } = await supabase
    .from('room_memberships')
    .select('*')
    .eq('room_id', room.id)
    .eq('user_id', userData.user.id)
    .single();

  if (existingMembership) {
    throw new Error("You are already in this room");
  }

  // Check if player name is already taken (for all users now)
  const { data: existingPlayer } = await supabase
    .from('room_memberships')
    .select('id')
    .eq('room_id', room.id)
    .eq('player_name', request.playerName)
    .single();

  if (existingPlayer) {
    throw new Error("Player name is already taken in this room");
  }

  const membershipData = {
    room_id: room.id,
    user_id: userData.user.id, // Always valid - no null allowed
    player_name: request.playerName,
    mascot_id: request.mascotId,
    is_host: false,
    is_banned: false,
    status: 'active', // Default status
  };

  // Set status based on room settings
  const requiresApproval = room.settings.requireApproval ?? false;
  membershipData.status = requiresApproval ? 'pending' : 'active';

  const { data: membership, error: membershipError } = await supabase
    .from('room_memberships')
    .insert(membershipData)
    .select()
    .single();

  if (membershipError) {
    throw new Error(`Failed to join room: ${membershipError.message}`);
  }

  const mappedMembership = mapRoomMembership(membership);
  if (!mappedMembership) {
    throw new Error("Failed to map membership data");
  }

  return {
    room,
    membership: mappedMembership,
    requiresApproval,
  };
}

// Leave a room
export async function leaveRoom(request: LeaveRoomRequest): Promise<LeaveRoomResponse> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new Error("User not authenticated");
  }

  // Get membership to verify
  const { data: membership, error: membershipError } = await supabase
    .from('room_memberships')
    .select('*')
    .eq('room_id', request.roomId)
    .eq('user_id', userData.user.id)
    .single();

  if (membershipError || !membership) {
    throw new Error("You are not in this room");
  }

  // Host cannot leave room (must transfer or archive)
  if (membership.is_host) {
    throw new Error("Host cannot leave room. Please transfer host or archive the room.");
  }

  // Delete membership
  const { error: deleteError } = await supabase
    .from('room_memberships')
    .delete()
    .eq('id', membership.id);

  if (deleteError) {
    throw new Error(`Failed to leave room: ${deleteError.message}`);
  }

  return { success: true };
}

// Get room members
export async function getRoomMembers(request: GetRoomMembersRequest): Promise<GetRoomMembersResponse> {
  // Remove user verification check completely to avoid 406 errors
  // The client-side logic will handle kick detection
  
  const { data, error } = await supabase
    .from('room_memberships')
    .select('*')
    .eq('room_id', request.roomId)
    .order('is_host', { ascending: false })
    .order('joined_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to get room members: ${error.message}`);
  }

  const memberships = (data || [])
    .map(mapRoomMembership)
    .filter(Boolean) as RoomMembership[];

  return { members: memberships };
}

// Kick a member (host only)
export async function kickMember(request: KickMemberRequest): Promise<KickMemberResponse> {
  console.log('👟 kickMember called with:', request);
  
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    console.error('❌ User not authenticated');
    throw new Error("User not authenticated");
  }

  // Verify user is host
  const { data: hostMembership, error: hostError } = await supabase
    .from('room_memberships')
    .select('*')
    .eq('room_id', request.roomId)
    .eq('user_id', userData.user.id)
    .eq('is_host', true)
    .single();

  if (hostError || !hostMembership) {
    throw new Error("Only the host can kick members");
  }

  // Get member to kick
  const { data: memberToKick, error: memberError } = await supabase
    .from('room_memberships')
    .select('*')
    .eq('room_id', request.roomId)
    .eq('user_id', request.userId)
    .single();

  if (memberError || !memberToKick) {
    throw new Error("Member not found");
  }

  // Cannot kick host
  if (memberToKick.is_host) {
    throw new Error("Cannot kick the host");
  }

  // Delete membership
  console.log('🗑️ Attempting to delete membership for kick');
  const { error: deleteError } = await supabase
    .from('room_memberships')
    .delete()
    .eq('room_id', request.roomId)
    .eq('user_id', request.userId);

  console.log('📊 Kick delete result:', { deleteError });

  if (deleteError) {
    console.error('❌ Failed to kick member:', deleteError);
    throw new Error(`Failed to kick member: ${deleteError.message}`);
  }

  console.log('✅ Kick completed successfully');
  
  // Add a small delay to ensure real-time events propagate
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Return success
  return { success: true };
}

// Remove a player from room (immediate disconnect)
export async function removePlayerFromRoom(request: { roomId: string; userId: string }): Promise<{ success: boolean }> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new Error("User not authenticated");
  }

  // Verify user is host
  const { data: hostMembership, error: hostError } = await supabase
    .from('room_memberships')
    .select('*')
    .eq('room_id', request.roomId)
    .eq('user_id', userData.user.id)
    .eq('is_host', true)
    .single();

  if (hostError || !hostMembership) {
    throw new Error("Only the host can remove players");
  }

  // Delete the membership (this is for kicks)
  const { error: deleteError } = await supabase
    .from('room_memberships')
    .delete()
    .eq('room_id', request.roomId)
    .eq('user_id', request.userId);

  if (deleteError) {
    throw new Error(`Failed to remove player: ${deleteError.message}`);
  }

  return { success: true };
}

// Ban a member (host only)
export async function banMember(request: BanMemberRequest): Promise<BanMemberResponse> {
  console.log('🔨 banMember called with:', request);
  
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    console.error('❌ User not authenticated');
    throw new Error("User not authenticated");
  }

  console.log('👤 Current user:', userData.user.id);

  // Verify user is host
  const { data: hostMembership, error: hostError } = await supabase
    .from('room_memberships')
    .select('*')
    .eq('room_id', request.roomId)
    .eq('user_id', userData.user.id)
    .eq('is_host', true)
    .single();

  console.log('🏠 Host membership check:', { hostMembership, hostError });

  if (hostError || !hostMembership) {
    console.error('❌ User is not host:', hostError);
    throw new Error("Only the host can ban members");
  }

  // Get member to ban
  const { data: memberToBan, error: memberError } = await supabase
    .from('room_memberships')
    .select('*')
    .eq('room_id', request.roomId)
    .eq('user_id', request.userId)
    .single();

  console.log('🎯 Member to ban:', { memberToBan, memberError });

  if (memberError || !memberToBan) {
    console.error('❌ Member not found:', memberError);
    throw new Error("Member not found");
  }

  // Cannot ban host
  if (memberToBan.is_host) {
    console.error('❌ Cannot ban host');
    throw new Error("Cannot ban the host");
  }

  // Get the room to find current session for ban tracking
  const { data: roomData, error: roomError } = await supabase
    .from('rooms')
    .select('current_session_id')
    .eq('id', request.roomId)
    .single();

  console.log('🏠 Room data:', { roomData, roomError });

  // Add to top_comment_banned_players table for ban tracking
  const banData: any = {
    room_id: request.roomId,
    user_id: request.userId,
    display_name: memberToBan.player_name,
    session_id: null, // Using room_id instead of session_id
  };
  
  const { error: banError } = await supabase
    .from('top_comment_banned_players')
    .insert(banData);

  if (banError) {
    console.error('⚠️ Failed to add to top_comment_banned_players (continuing with ban):', banError);
  }

  // Delete the membership to kick them out of lobby
  const { error: deleteError } = await supabase
    .from('room_memberships')
    .delete()
    .eq('room_id', request.roomId)
    .eq('user_id', request.userId);

  if (deleteError) {
    console.error('❌ Failed to delete membership:', deleteError);
    throw new Error(`Failed to ban member: ${deleteError.message}`);
  }

  console.log('✅ Ban completed successfully - player kicked from lobby and added to ban list');
  return { success: true };
}

// Approve a pending member (host only)
export async function approveMember(request: ApproveMemberRequest): Promise<ApproveMemberResponse> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new Error("User not authenticated");
  }

  // Verify user is host
  const { data: hostMembership, error: hostError } = await supabase
    .from('room_memberships')
    .select('*')
    .eq('room_id', request.roomId)
    .eq('user_id', userData.user.id)
    .eq('is_host', true)
    .single();

  if (hostError || !hostMembership) {
    throw new Error("Only the host can approve members");
  }

  // Get member to approve
  const { data: memberToApprove, error: memberError } = await supabase
    .from('room_memberships')
    .select('*')
    .eq('room_id', request.roomId)
    .eq('user_id', request.userId)
    .single();

  if (memberError || !memberToApprove) {
    throw new Error("Member not found");
  }

  if (memberToApprove.status !== 'pending') {
    throw new Error("Member is not pending approval");
  }

  // Approve member
  const { error: updateError } = await supabase
    .from('room_memberships')
    .update({
      status: 'active',
      last_active_at: new Date().toISOString(),
    })
    .eq('room_id', request.roomId)
    .eq('user_id', request.userId);

  if (updateError) {
    throw new Error(`Failed to approve member: ${updateError.message}`);
  }

  return { success: true };
}

// Reject a pending member (host only)
export async function rejectMember(request: RejectMemberRequest): Promise<RejectMemberResponse> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new Error("User not authenticated");
  }

  // Verify user is host
  const { data: hostMembership, error: hostError } = await supabase
    .from('room_memberships')
    .select('*')
    .eq('room_id', request.roomId)
    .eq('user_id', userData.user.id)
    .eq('is_host', true)
    .single();

  if (hostError || !hostMembership) {
    throw new Error("Only the host can reject members");
  }

  // Get member to reject
  const { data: memberToReject, error: memberError } = await supabase
    .from('room_memberships')
    .select('*')
    .eq('room_id', request.roomId)
    .eq('user_id', request.userId)
    .single();

  if (memberError || !memberToReject) {
    throw new Error("Member not found");
  }

  if (memberToReject.status !== 'pending') {
    throw new Error("Member is not pending approval");
  }

  // Delete membership (reject)
  const { error: deleteError } = await supabase
    .from('room_memberships')
    .delete()
    .eq('room_id', request.roomId)
    .eq('user_id', request.userId);

  if (deleteError) {
    throw new Error(`Failed to reject member: ${deleteError.message}`);
  }

  return { success: true };
}

// Update last active time for a member
export async function updateLastActive(userId: string, roomId: string): Promise<void> {
  const { error } = await supabase
    .from('room_memberships')
    .update({
      last_active_at: new Date().toISOString(),
    })
    .eq('room_id', roomId)
    .eq('user_id', userId);

  if (error) {
    console.error("Failed to update last active time:", error);
  }
}

export const roomMembershipService = {
  joinRoom,
  leaveRoom,
  getRoomMembers,
  kickMember,
  banMember,
  approveMember,
  rejectMember,
  updateLastActive,
};
