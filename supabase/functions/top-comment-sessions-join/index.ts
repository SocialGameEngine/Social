// @ts-nocheck - Deno runtime types not available in IDE
import { createHandler, corsResponse, AppError } from "../_shared/utils.ts"

interface JoinSessionRequest {
  code: string;
  teamName: string;
  playerName?: string;
}

async function handleJoinSession(req: Request, userId: string, supabase: any): Promise<Response> {
  const body = await req.json();
  const { code, teamName }: JoinSessionRequest = body;

  if (!code || !teamName) {
    console.error("Missing required fields:", { code, teamName })
    throw new AppError(400, "code and display name are required");
  }

  // Normalize inputs
  const normalizedCode = code.trim().toUpperCase()
  const normalizedDisplayName = teamName.trim()

  if (normalizedCode.length !== 6) {
    throw new AppError(400, "Invalid code format");
  }

  console.log("Starting join lookup for code:", normalizedCode);

  let sessionId: string | null = null;
  const { data: roomData } = await supabase
    .from("rooms")
    .select("id, code, status, current_session_id, settings")
    .eq("code", normalizedCode)
    .maybeSingle();

  if (roomData) {
    if (roomData.status === "archived") {
      throw new AppError(403, "Room is archived");
    }
    if (!roomData.current_session_id) {
      throw new AppError(404, "No active session in this room yet");
    }
    sessionId = roomData.current_session_id;

    const { data: existingMembership } = await supabase
      .from("room_memberships")
      .select("*")
      .eq("room_id", roomData.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (existingMembership?.is_banned) {
      throw new AppError(403, "You are banned from this room");
    }

    if (!existingMembership) {
      const requiresApproval = roomData.settings?.requireApproval ?? false;
      const status = requiresApproval ? "pending" : "active";
      const { error: membershipError } = await supabase
        .from("room_memberships")
        .insert({
          room_id: roomData.id,
          user_id: userId,
          team_name: normalizedDisplayName,
          is_host: false,
          is_banned: false,
          status,
        });

      if (membershipError) {
        throw new AppError(500, membershipError.message || "Failed to join room");
      }

      if (requiresApproval) {
        throw new AppError(403, "Waiting for host approval");
      }
    }
  }

  if (!sessionId) {
    const { data: sessionByCode, error: sessionError } = await supabase
      .from("top_comment_sessions")
      .select("id")
      .eq("code", normalizedCode)
      .single();

    if (sessionError || !sessionByCode) {
      console.error("Session not found:", sessionError);
      throw new AppError(404, "Session not found");
    }
    sessionId = sessionByCode.id;
  }

  const { data: session, error: sessionError } = await supabase
    .from("top_comment_sessions")
    .select("id, code, status, settings, ended_by_host, room_id")
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    console.error("Session not found:", sessionError);
    throw new AppError(404, "Session not found");
  }

  console.log("Session found:", { id: session.id, status: session.status })

  if (session.room_id) {
    const { data: membership, error: membershipError } = await supabase
      .from("room_memberships")
      .select("id, is_banned, status")
      .eq("room_id", session.room_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (membershipError) {
      throw new AppError(500, membershipError.message || "Failed to verify room membership");
    }

    if (membership?.is_banned) {
      throw new AppError(403, "You are banned from this room");
    }

    if (membership?.status === "pending") {
      throw new AppError(403, "Waiting for host approval");
    }

    if (!membership) {
      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .select("settings")
        .eq("id", session.room_id)
        .single();

      if (roomError) {
        throw new AppError(500, roomError.message || "Failed to load room");
      }

      const requiresApproval = roomData?.settings?.requireApproval ?? false;
      const status = requiresApproval ? "pending" : "active";
      const { error: createMembershipError } = await supabase
        .from("room_memberships")
        .insert({
          room_id: session.room_id,
          user_id: userId,
          team_name: normalizedDisplayName,
          is_host: false,
          is_banned: false,
          status,
        });

      if (createMembershipError) {
        throw new AppError(500, createMembershipError.message || "Failed to join room");
      }

      if (requiresApproval) {
        throw new AppError(403, "Waiting for host approval");
      }
    }
  }

  // Check if player already exists
  const { data: existingPlayer } = await supabase
    .from("top_comment_players")
    .select("id, display_name, user_id")
    .eq("session_id", session.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingPlayer) {
    console.log("Existing player found, updating display name if needed");
    if (normalizedDisplayName && normalizedDisplayName !== existingPlayer.display_name) {
      await supabase
        .from("top_comment_players")
        .update({ display_name: normalizedDisplayName })
        .eq("id", existingPlayer.id);
    }

    return corsResponse({
      sessionId: session.id,
      session: {
        id: session.id,
        code: session.code,
        status: session.status,
        settings: session.settings,
        endedByHost: session.ended_by_host || false
      },
      team: {
        id: existingPlayer.id,
        teamName: normalizedDisplayName || existingPlayer.display_name,
        uid: userId
      }
    });
  }

  // Check if this user is banned
  try {
    const { data: bannedUsers, error: bannedError } = await supabase
      .from("top_comment_banned_players")
      .select("id")
      .eq("session_id", session.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (bannedUsers) {
      throw new AppError(403, "You were banned from this session and cannot rejoin.");
    }
    
    if (bannedError) {
      console.log("Banned check error (table might not exist yet):", bannedError)
    }
  } catch (banCheckError) {
    if (banCheckError instanceof AppError) throw banCheckError;
    console.log("Ban check failed, continuing join:", banCheckError)
  }

  console.log("Creating player record for user:", userId);

  // Try to insert new player
  const { data: newPlayers, error: createError } = await supabase
    .from("top_comment_players")
    .insert({
      session_id: session.id,
      user_id: userId,
      display_name: normalizedDisplayName,
      score: 0,
      joined_at: new Date().toISOString(),
    })
    .select("id, display_name, user_id");

  if (createError) {
    // Handle race condition: if player was created between our check and insert
    if (createError.code === '23505') {
      console.log("Race condition: player created between check and insert, fetching again");
      const { data: retryPlayer, error: retryError } = await supabase
        .from("top_comment_players")
        .select("id, display_name, user_id")
        .eq("session_id", session.id)
        .eq("user_id", userId)
        .single();
      
      if (retryError || !retryPlayer) {
        console.error("Failed to fetch player after race condition:", retryError);
        throw new AppError(500, "Failed to join session (retry failed)");
      }

      return corsResponse({
        sessionId: session.id,
        session: {
          id: session.id,
          code: session.code,
          status: session.status,
          settings: session.settings,
          endedByHost: session.ended_by_host || false
        },
        team: {
          id: retryPlayer.id,
          teamName: normalizedDisplayName || retryPlayer.display_name,
          uid: userId
        }
      });
    }

    console.error("Failed to create player record. Error:", JSON.stringify(createError));
    throw new AppError(500, `Failed to join session: ${createError.message || 'unknown error'}`);
  }

  const newPlayer = newPlayers?.[0];
  if (!newPlayer) {
    console.error("No player data returned after insert. Data:", JSON.stringify(newPlayers));
    throw new AppError(500, "Failed to join session (no data returned)");
  }

  console.log(`Player ${newPlayer.display_name} joined session ${session.id}`)

  return corsResponse({
    sessionId: session.id,
    session: {
      id: session.id,
      code: session.code,
      status: session.status,
      settings: session.settings,
      endedByHost: session.ended_by_host || false
    },
    team: {
      id: newPlayer.id,
      teamName: newPlayer.display_name,
      uid: newPlayer.user_id
    }
  });
}

Deno.serve(createHandler(handleJoinSession));

