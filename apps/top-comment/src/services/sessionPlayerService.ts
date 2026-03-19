import { supabase } from "../supabase/client";

export interface JoinSessionAsPlayerRequest {
  sessionId: string;
  displayName: string;
}

export interface JoinSessionAsPlayerResponse {
  playerId: string;
  sessionId: string;
}

export interface LeaveSessionAsPlayerRequest {
  sessionId: string;
  playerId: string;
}

export interface LeaveSessionAsPlayerResponse {
  success: boolean;
}

export interface GetSessionPlayerRequest {
  sessionId: string;
  userId: string;
}

export interface SessionPlayer {
  id: string;
  sessionId: string;
  userId: string;
  displayName: string;
  score: number;
  joinedAt: string;
}

/**
 * Join a session as a player (creates a top_comment_players record)
 */
export async function joinSessionAsPlayer(
  request: JoinSessionAsPlayerRequest
): Promise<JoinSessionAsPlayerResponse> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("User not authenticated");
  }

  const { sessionId, displayName } = request;

  // Check if player already exists
  const { data: existingPlayer } = await supabase
    .from("top_comment_players")
    .select("id")
    .eq("session_id", sessionId)
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (existingPlayer) {
    return {
      playerId: existingPlayer.id,
      sessionId,
    };
  }

  // Create new player record
  const { data: newPlayer, error: createError } = await supabase
    .from("top_comment_players")
    .insert({
      session_id: sessionId,
      user_id: userData.user.id,
      display_name: displayName,
      score: 0,
      joined_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (createError) {
    throw new Error(`Failed to join session: ${createError.message}`);
  }

  if (!newPlayer) {
    throw new Error("Failed to create player record");
  }

  return {
    playerId: newPlayer.id,
    sessionId,
  };
}

/**
 * Leave a session as a player (removes top_comment_players record)
 */
export async function leaveSessionAsPlayer(
  request: LeaveSessionAsPlayerRequest
): Promise<LeaveSessionAsPlayerResponse> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("User not authenticated");
  }

  const { sessionId } = request;

  // Delete ALL player records for this user in the session (in case there are duplicates)
  const { error: deleteError } = await supabase
    .from("top_comment_players")
    .delete()
    .eq("session_id", sessionId)
    .eq("user_id", userData.user.id);

  if (deleteError) {
    throw new Error(`Failed to leave session: ${deleteError.message}`);
  }

  return {
    success: true,
  };
}

/**
 * Get the current user's player record for a session
 */
export async function getSessionPlayer(
  request: GetSessionPlayerRequest
): Promise<SessionPlayer | null> {
  const { sessionId, userId } = request;

  const { data, error } = await supabase
    .from("top_comment_players")
    .select("*")
    .eq("session_id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching session player:", error);
    return null;
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    sessionId: data.session_id,
    userId: data.user_id,
    displayName: data.display_name,
    score: data.score || 0,
    joinedAt: data.joined_at,
  };
}

/**
 * Subscribe to session player changes for the current user
 */
export function subscribeToSessionPlayer(
  sessionId: string,
  userId: string,
  callback: (player: SessionPlayer | null) => void
) {
  // Initial fetch
  getSessionPlayer({ sessionId, userId }).then(callback);

  // Subscribe to changes
  const channel = supabase
    .channel(`session-player:${sessionId}:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "top_comment_players",
        filter: `session_id=eq.${sessionId}`,
      },
      () => {
        // Refetch player data
        getSessionPlayer({ sessionId, userId }).then(callback);
      }
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}

export const sessionPlayerService = {
  joinSessionAsPlayer,
  leaveSessionAsPlayer,
  getSessionPlayer,
  subscribeToSessionPlayer,
};
