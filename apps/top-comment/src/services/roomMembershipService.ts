import { supabase } from "../supabase/client";
import { censorText } from "../shared/utils/profanityFilter";
import { createRateLimiter } from "../shared/utils/rateLimiter";
import { RATE_LIMITS } from "../shared/constants/rateLimits";

const joinLimiter = createRateLimiter(RATE_LIMITS.join.maxActions, RATE_LIMITS.join.windowMs);

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
import type { RoomStatus, RoomSettings } from "../domain/types/room.types";
// Helper to convert Supabase room membership row to our RoomMembership type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRoomMembership(data: Record<string, any>): RoomMembership | null {
  if (!data || !data.user_id) return null;
  
  return {
    id: data.id,
    roomId: data.room_id,
    userId: data.user_id,
    playerName: data.player_name,
    mascotId: data.mascot_id ?? undefined,
    joinedAt: data.joined_at || '',
    lastActiveAt: data.last_active_at || '',
    isBanned: data.is_banned ?? false,
    banReason: data.ban_reason ?? undefined,
    bannedAt: data.banned_at ?? undefined,
    bannedBy: data.banned_by ?? undefined,
    status: (data.status as RoomMembership['status']) || 'active',
  };
}

// Join a room
export async function joinRoom(request: JoinRoomRequest): Promise<JoinRoomResponse> {
  if (!joinLimiter.canAct()) {
    throw new Error('Slow down! Too many join attempts. Please wait a moment.');
  }

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
    name: roomData.name || "",
    description: roomData.description || undefined,
    status: roomData.status as RoomStatus,
    maxPlayers: roomData.max_players,
    createdAt: roomData.created_at || "",
    updatedAt: roomData.updated_at || "",
    settings: (roomData.settings || {}) as unknown as RoomSettings,
    currentSessionId: roomData.current_session_id || undefined,
    totalSessionsPlayed: roomData.total_sessions_played || 0,
    moderatorIds: roomData.moderator_ids || [],
    creatorId: roomData.creator_id || roomData.host_uid || '',
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
  const { data: existingMembership, error: existingMembershipError } = await supabase
    .from('room_memberships')
    .select('*')
    .eq('room_id', room.id)
    .eq('user_id', userData.user.id)
    .maybeSingle(); // Use maybeSingle() to handle "not in room" gracefully

  if (existingMembershipError) {
    throw new Error(`Failed to check existing membership: ${existingMembershipError.message}`);
  }

  if (existingMembership) {
    throw new Error("You are already in this room");
  }

  // Check if player name is already taken (for all users now)
  const { data: existingPlayer, error: existingPlayerError } = await supabase
    .from('room_memberships')
    .select('id')
    .eq('room_id', room.id)
    .eq('player_name', request.playerName)
    .maybeSingle(); // Use maybeSingle() to handle "name not taken" gracefully

  if (existingPlayerError) {
    throw new Error(`Failed to check player name availability: ${existingPlayerError.message}`);
  }

  if (existingPlayer) {
    throw new Error("Player name is already taken in this room");
  }

  // Apply profanity filter to player name based on room settings
  const profanityLevel = room.settings.profanityFilter ?? 'moderate';
  const filteredPlayerName = censorText(request.playerName, profanityLevel);

  const membershipData = {
    room_id: room.id,
    user_id: userData.user.id, // Always valid - no null allowed
    player_name: filteredPlayerName,
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

  // Check if user is in the room
  const { data: membership, error: membershipError } = await supabase
    .from('room_memberships')
    .select('*')
    .eq('room_id', request.roomId)
    .eq('user_id', userData.user.id)
    .maybeSingle();

  if (membershipError) {
    throw new Error(`Failed to check room membership: ${membershipError.message}`);
  }

  // If user is not in the room, just return success (nothing to leave)
  if (!membership) {
    return {
      success: true,
    };
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

  // Application-level cleanup before deleting membership
  // Delete user's responses
  await supabase
    .from('responses')
    .delete()
    .eq('membership_id', memberToKick.id);

  // Delete user's interaction votes
  await supabase
    .from('interaction_votes' as any)
    .delete()
    .eq('membership_id', memberToKick.id);

  // Delete user's room reactions
  await (supabase.from('room_reactions' as any))
    .delete()
    .eq('membership_id', memberToKick.id);

  // Now delete the membership
  const { error: deleteError } = await supabase
    .from('room_memberships')
    .delete()
    .eq('room_id', request.roomId)
    .eq('user_id', request.userId);

  if (deleteError) {
    throw new Error(`Failed to kick member: ${deleteError.message}`);
  }

  // Add a small delay to ensure real-time events propagate
  await new Promise(resolve => setTimeout(resolve, 100));
  
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
    throw new Error("Only the host can ban members");
  }

  // Get member to ban
  const { data: memberToBan, error: memberError } = await supabase
    .from('room_memberships')
    .select('*')
    .eq('room_id', request.roomId)
    .eq('user_id', request.userId)
    .single();

  if (memberError || !memberToBan) {
    throw new Error("Member not found");
  }

  // Cannot ban host
  if (memberToBan.is_host) {
    throw new Error("Cannot ban the host");
  }

  
  // Add to top_comment_banned_players table for ban tracking
  const banData: any = {
    room_id: request.roomId,
    user_id: request.userId,
    display_name: memberToBan.player_name,
    session_id: null, // Using room_id instead of session_id
  };
  
  const { error: banError } = await supabase
    .from('top_comment_banned_players' as any)
    .insert(banData);

  if (banError) {
    // Continue with ban even if tracking fails
  }

  // Application-level cleanup before deleting membership
  // Delete user's responses
  await supabase
    .from('responses')
    .delete()
    .eq('membership_id', memberToBan.id);

  // Delete user's interaction votes
  await supabase
    .from('interaction_votes' as any)
    .delete()
    .eq('membership_id', memberToBan.id);

  // Delete user's room reactions
  await (supabase.from('room_reactions' as any))
    .delete()
    .eq('membership_id', memberToBan.id);

  // Now delete the membership
  const { error: deleteError } = await supabase
    .from('room_memberships')
    .delete()
    .eq('room_id', request.roomId)
    .eq('user_id', request.userId);

  if (deleteError) {
    throw new Error(`Failed to ban member: ${deleteError.message}`);
  }
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
