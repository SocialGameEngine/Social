import { createHandler, requireString, corsResponse, AppError } from '../_shared/utils.ts';

async function handleKickPlayer(req: Request, uid: string, supabase: any): Promise<Response> {
  const { roomId, userId } = await req.json();
  
  requireString(roomId, 'roomId');
  requireString(userId, 'userId');
  
  // Get and validate room
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('id, host_uid')
    .eq('id', roomId)
    .single();
  
  if (roomError || !room) {
    throw new AppError(404, 'Room not found', 'not-found');
  }
  
  // Verify the requester is the host
  if (room.host_uid !== uid) {
    throw new AppError(403, 'Only the host can kick players', 'permission-denied');
  }
  
  // Get the room membership by userId + roomId
  const { data: membership, error: membershipError } = await supabase
    .from('room_memberships')
    .select('id, is_host, user_id')
    .eq('user_id', userId)
    .eq('room_id', roomId)
    .maybeSingle();
  
  if (membershipError) {
    throw new AppError(500, 'Failed to lookup membership', 'internal');
  }
  
  if (!membership) {
    throw new AppError(404, 'Player not found in room', 'not-found');
  }
  
  // Can't kick the host
  if (membership.is_host) {
    throw new AppError(400, 'Cannot kick the host', 'failed-precondition');
  }
  
  // Can't kick yourself
  if (membership.user_id === uid) {
    throw new AppError(400, 'Cannot kick yourself', 'failed-precondition');
  }
  
  // Remove the room membership
  const { error: deleteError } = await supabase
    .from('room_memberships')
    .delete()
    .eq('id', membership.id);
  
  if (deleteError) {
    console.error('Failed to kick player:', deleteError);
    throw new AppError(500, 'Failed to kick player', 'internal');
  }
  
  // Remove player from any active session in this room
  const { data: activeSession } = await supabase
    .from('top_comment_sessions')
    .select('id')
    .eq('room_id', roomId)
    .neq('status', 'ended')
    .maybeSingle();
  
  if (activeSession) {
    // Remove player from session - use user_id if available, otherwise player_name
    let playerQuery;
    
    if (membership.user_id) {
      // For authenticated users, use user_id
      playerQuery = supabase
        .from('top_comment_players')
        .delete()
        .eq('session_id', activeSession.id)
        .eq('user_id', membership.user_id);
    } else {
      // For anonymous users, use team_name
      const { data: membershipDetails } = await supabase
        .from('room_memberships')
        .select('team_name')
        .eq('id', membership.id)
        .single();
      
      if (membershipDetails?.team_name) {
        playerQuery = supabase
          .from('top_comment_players')
          .delete()
          .eq('session_id', activeSession.id)
          .eq('team_name', membershipDetails.team_name);
      }
    }
    
    if (playerQuery) {
      await playerQuery;
    }
  }
  
  return corsResponse({ success: true, message: 'Player kicked successfully' });
}

// @ts-ignore - Deno global is available in Supabase Edge Functions runtime
Deno.serve(createHandler(handleKickPlayer));
