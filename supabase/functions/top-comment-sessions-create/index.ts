// Create a new game session
import { createHandler, cleanTeamName, corsResponse, AppError, verifyVenueAccount } from "../_shared/utils.ts";
import { getPromptLibrary, TOTAL_ROUNDS } from "../_shared/prompts.ts";
import { requireValidMashupLibraries } from "../_shared/mashup.ts";
import type { Session } from "../_shared/types.ts";

async function handleCreateSession(req: Request, uid: string, supabase: any): Promise<Response> {
  // Verify venue account is active
  await verifyVenueAccount(uid, supabase);
  const { roomId, venueName, promptLibraryId, gameMode, selectedLibraries, totalRounds } = await req.json();
  const cleanedVenueName = venueName ? cleanTeamName(venueName) : undefined;
  const mode = gameMode === 'mashup' ? 'mashup' : 'classic';
    
  let promptDeck: string[] = [];
  const currentLibraryIndex = 0;

  const librariesToRotate =
    mode === "mashup" ? requireValidMashupLibraries(selectedLibraries) : undefined;

  const libraryId =
    mode === "mashup"
      ? librariesToRotate?.[0] || "classic"
      : (promptLibraryId || "classic");

  if (mode === "classic") {
    const library = await getPromptLibrary(libraryId);
    promptDeck = [...library.prompts].sort(() => Math.random() - 0.5);
  }
    
    let room: { id: string; host_uid: string; current_session_id?: string | null; total_sessions_played?: number; code: string } | null = null;
    if (roomId) {
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('id, host_uid, current_session_id, total_sessions_played, code')
        .eq('id', roomId)
        .single();
        
      if (roomError || !roomData) {
        throw new AppError(404, 'Room not found', 'not-found');
      }
      if (roomData.host_uid !== uid) {
        throw new AppError(403, 'Only the host can start a session in this room', 'permission-denied');
      }
      if (roomData.current_session_id) {
        throw new AppError(400, 'Room already has an active session', 'failed-precondition');
      }
      room = roomData;
    }
    
    // Always generate a unique session code to avoid collisions.
    // The room code is the public join code; session codes stay internal.
    const sessionCode = (await supabase.rpc('ensure_unique_code')).data;
    if (!sessionCode) {
      throw new Error('Failed to generate room code');
    }
    
    // Create session
    const { data: session, error: sessionError } = await supabase
      .from('top_comment_sessions')
      .insert({
        code: sessionCode,
        host_uid: uid,
        status: 'lobby',
        round_index: 0,
        rounds: [],
        prompt_deck: promptDeck,
        prompt_cursor: 0,
        prompt_library_id: libraryId,
        selected_libraries: librariesToRotate,
        current_library_index: currentLibraryIndex,
        room_id: roomId || undefined,
        settings: {
          answerSecs: 90,
          voteSecs: 30,
          resultsSecs: 12,
          maxTeams: 10,
          gameMode: mode,
          librarySetupSecs: 30,
          totalRounds: totalRounds || TOTAL_ROUNDS,
        },
        venue_name: cleanedVenueName,
      })
      .select()
      .single();
    
    if (sessionError) throw sessionError;
    
    if (room) {
      const { error: updateRoomError } = await supabase
        .from('rooms')
        .update({
          current_session_id: session.id,
          total_sessions_played: (room.total_sessions_played ?? 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', room.id);
      
      if (updateRoomError) {
        throw updateRoomError;
      }
    }

    // Players must opt-in to join the session - no auto-assignment
    // This allows room members to use other features without being forced into the game
    console.log('🎮 Session created without auto-assignment - players must opt-in');
    
    // Create analytics record
    await supabase
      .from('top_comment_session_analytics')
      .insert({ session_id: session.id });
    
    return corsResponse({
      sessionId: session.id,
      code: session.code,
      session: session as Session,
    });
  }

// @ts-ignore - Deno global is available in Supabase Edge Functions runtime
Deno.serve(createHandler(handleCreateSession));
