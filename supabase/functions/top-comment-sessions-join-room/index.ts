// Join a session as a room member (opt-in)
import { createHandler, corsResponse, AppError } from "../_shared/utils.ts";

interface JoinRoomSessionRequest {
  sessionId: string;
  roomId: string;
  playerName?: string;
}

async function handleJoinRoomSession(req: Request, userId: string, supabase: any): Promise<Response> {
  const body = await req.json();
  const { sessionId, roomId, playerName }: JoinRoomSessionRequest = body;

  if (!sessionId || !roomId) {
    throw new AppError(400, "sessionId and roomId are required");
  }

  console.log("Room member joining session:", { userId, sessionId, roomId });

  // Verify user is an active room member
  const { data: membership, error: membershipError } = await supabase
    .from("room_memberships")
    .select("id, player_name, is_banned, status")
    .eq("room_id", roomId)
    .eq("user_id", userId)
    .eq("is_banned", false)
    .in('status', ['active', 'approved'])
    .single();

  if (membershipError || !membership) {
    throw new AppError(403, "You must be an active room member to join the session");
  }

  // Verify session exists and is in this room
  const { data: session, error: sessionError } = await supabase
    .from("top_comment_sessions")
    .select("id, status, room_id")
    .eq("id", sessionId)
    .eq("room_id", roomId)
    .single();

  if (sessionError || !session) {
    throw new AppError(404, "Session not found or not in this room");
  }

  if (session.status === 'ended') {
    throw new AppError(403, "Cannot join a session that has ended");
  }

  // Check if already joined
  const { data: existingPlayer } = await supabase
    .from("top_comment_players")
    .select("id, display_name")
    .eq("session_id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingPlayer) {
    return corsResponse({
      success: true,
      message: "Already in session",
      player: existingPlayer
    });
  }

  // Join the session
  const { data: newPlayer, error: joinError } = await supabase
    .from("top_comment_players")
    .insert({
      id: crypto.randomUUID(),
      session_id: sessionId,
      user_id: userId,
      display_name: playerName || membership.player_name,
      score: 0,
      joined_at: new Date().toISOString(),
    })
    .select("id, display_name, score, joined_at")
    .single();

  if (joinError) {
    throw new AppError(500, `Failed to join session: ${joinError.message}`);
  }

  console.log(`Room member ${userId} joined session ${sessionId}`);

  return corsResponse({
    success: true,
    message: "Joined session successfully",
    player: newPlayer
  });
}

// @ts-ignore - Deno global is available in Supabase Edge Functions runtime
Deno.serve(createHandler(handleJoinRoomSession));
