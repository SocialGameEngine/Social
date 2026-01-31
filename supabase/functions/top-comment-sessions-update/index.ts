// Update an existing game session's configuration (host-only)
import { createHandler, cleanTeamName, AppError, corsResponse, verifyVenueAccount } from "../_shared/utils.ts";
import { getPromptLibrary, TOTAL_ROUNDS } from "../_shared/prompts.ts";
import { requireValidMashupLibraries } from "../_shared/mashup.ts";

async function handleUpdateSession(req: Request, uid: string, supabase: any): Promise<Response> {
  const { sessionId, venueName, gameMode, selectedLibraries, totalRounds } = await req.json();

  if (!sessionId || typeof sessionId !== "string") {
    throw new AppError(400, "sessionId is required", "invalid-argument");
  }

  // Verify venue account is active
  await verifyVenueAccount(uid, supabase);

  const { data: session, error: sessionError } = await supabase
    .from("top_comment_sessions")
    .select("id, code, host_uid, status, prompt_library_id, settings")
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    throw new AppError(404, "Session not found", "not-found");
  }

  if (session.host_uid !== uid) {
    throw new AppError(403, "Only the host can update the session", "permission-denied");
  }

  // Safety: only allow changes before start
  if (session.status !== "lobby") {
    throw new AppError(409, "Room settings can only be changed before the session starts.", "conflict");
  }

  const cleanedVenueName = venueName ? cleanTeamName(String(venueName)) : null;
  const mode = gameMode === "mashup" ? "mashup" : "classic";

  let promptDeck: string[] = [];
  let promptLibraryId = session.prompt_library_id || "classic";
  let librariesToRotate: string[] | null = null;
  let currentLibraryIndex = 0;

  if (mode === "mashup") {
    const libs = requireValidMashupLibraries(selectedLibraries);
    librariesToRotate = libs;
    promptLibraryId = libs[0];
  } else {
    const library = await getPromptLibrary(promptLibraryId);
    promptDeck = [...library.prompts].sort(() => Math.random() - 0.5);
  }

  const existingSettings = (session.settings ?? {}) as Record<string, unknown>;
  const nextTotalRounds =
    typeof totalRounds === "number"
      ? totalRounds
      : TOTAL_ROUNDS;

  const nextSettings = {
    ...existingSettings,
    gameMode: mode,
    totalRounds: nextTotalRounds,
    librarySetupSecs: typeof existingSettings.librarySetupSecs === "number" ? existingSettings.librarySetupSecs : 30,
  };

  const { data: updatedSession, error: updateError } = await supabase
    .from("top_comment_sessions")
    .update({
      venue_name: cleanedVenueName,
      status: "lobby",
      round_index: 0,
      rounds: [],
      vote_group_index: null,
      prompt_deck: promptDeck,
      prompt_cursor: 0,
      prompt_library_id: promptLibraryId,
      selected_libraries: librariesToRotate,
      current_library_index: currentLibraryIndex,
      settings: nextSettings,
      ended_by_host: false,
      ended_at: null,
    })
    .eq("id", sessionId)
    .select()
    .single();

  if (updateError) {
    console.error("Failed to update session", updateError);
    throw new AppError(500, "Failed to update session", "internal");
  }

  return corsResponse({
    sessionId: updatedSession.id,
    code: updatedSession.code,
    session: updatedSession,
  });
}

// @ts-ignore - Deno global is available in Supabase Edge Functions runtime
Deno.serve(createHandler(handleUpdateSession));

