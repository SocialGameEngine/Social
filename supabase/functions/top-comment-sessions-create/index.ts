// Create a new game session
import { createHandler, cleanTeamName, corsResponse, AppError, verifyVenueAccount } from "../_shared/utils.ts";
import { getPromptLibrary, TOTAL_ROUNDS } from "../_shared/prompts.ts";
import { requireValidMashupLibraries } from "../_shared/mashup.ts";
import type { Session } from "../_shared/types.ts";

async function handleCreateSession(req: Request, uid: string, supabase: any): Promise<Response> {
  // Verify venue account is active
  await verifyVenueAccount(uid, supabase);
  const { venueName, promptLibraryId, gameMode, selectedLibraries, totalRounds } = await req.json();
  const cleanedVenueName = venueName ? cleanTeamName(venueName) : undefined;
  const mode = gameMode === 'mashup' ? 'mashup' : 'classic';
    
    // Generate unique room code
    const code = await supabase.rpc('ensure_unique_code');
    if (!code.data) {
      throw new Error('Failed to generate room code');
    }
    
  let promptDeck: string[] = [];
  const currentLibraryIndex = 0;

  const librariesToRotate =
    mode === "mashup" ? requireValidMashupLibraries(selectedLibraries) : undefined;

  const libraryId =
    mode === "mashup"
      ? librariesToRotate[0]
      : (promptLibraryId || "classic");

  if (mode === "classic") {
    const library = await getPromptLibrary(libraryId);
    promptDeck = [...library.prompts].sort(() => Math.random() - 0.5);
  }
    
    // Create session
    const { data: session, error: sessionError } = await supabase
      .from('top_comment_sessions')
      .insert({
        code: code.data,
        host_uid: uid,
        status: 'lobby',
        round_index: 0,
        rounds: [],
        prompt_deck: promptDeck,
        prompt_cursor: 0,
        prompt_library_id: libraryId,
        selected_libraries: librariesToRotate,
        current_library_index: currentLibraryIndex,
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
