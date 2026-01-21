// Update an existing game session's configuration (host-only)
import { createHandler, cleanTeamName, AppError, corsResponse, verifyVenueAccount } from "../_shared/utils.ts";
import { getPromptLibrary, TOTAL_ROUNDS } from "../_shared/prompts.ts";
import { generateCategoryBonuses } from "../_shared/categoryGrid.ts";

async function handleUpdateSession(req: Request, uid: string, supabase: any): Promise<Response> {
  const { sessionId, venueName, gameMode, selectedCategories, totalRounds } = await req.json();

  if (!sessionId || typeof sessionId !== "string") {
    throw new AppError(400, "sessionId is required", "invalid-argument");
  }

  // Verify venue account is active
  await verifyVenueAccount(uid, supabase);

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
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
  const mode = gameMode === "jeopardy" ? "jeopardy" : "classic";

  // Regenerate prompt deck based on current library (we keep prompt_library_id stable here)
  const libraryId = session.prompt_library_id || "classic";
  const library = await getPromptLibrary(libraryId);
  const promptDeck = [...library.prompts].sort(() => Math.random() - 0.5);

  // Initialize category grid for jeopardy mode
  let categoryGrid = null;
  if (mode === "jeopardy") {
    const allLibraryIds = [
      "classic", "bar", "basic", "halloween", "selfie", "victoria",
      "dangerfield", "medieval", "anime", "politics", "scifi",
      "popculture", "cinema", "canucks", "bc", "tech",
      "internetculture", "datingapp", "remotework", "adulting",
      "groupchat", "streaming", "climateanxiety", "fictionalworlds",
    ];

    // Use host-selected categories or default to 6 (3 per card)
    const selectedCats = Array.isArray(selectedCategories) && selectedCategories.length === 6
      ? selectedCategories
      : allLibraryIds.slice(0, 6);

    // Validate all selected categories exist
    const validCategories = selectedCats.filter((id: string) => allLibraryIds.includes(id));
    if (validCategories.length !== 6) {
      throw new AppError(400, "Invalid category selection: must select exactly 6 categories (3 per card)", "invalid-argument");
    }

    categoryGrid = {
      categories: validCategories.map((id: string) => ({
        id,
        usedPrompts: [],
        promptBonuses: generateCategoryBonuses(),
      })),
      totalSlots: 42, // 6 categories × 7 prompts (max)
      categoriesPerCard: 3,
    };
  }

  const existingSettings = (session.settings ?? {}) as Record<string, unknown>;
  const nextTotalRounds =
    typeof totalRounds === "number"
      ? totalRounds
      : mode === "jeopardy"
        ? 1
        : TOTAL_ROUNDS;

  const nextSettings = {
    ...existingSettings,
    gameMode: mode,
    totalRounds: nextTotalRounds,
    selectedCategories:
      mode === "jeopardy" && categoryGrid
        ? categoryGrid.categories.map((c: { id: string }) => c.id)
        : undefined,
  };

  const { data: updatedSession, error: updateError } = await supabase
    .from("sessions")
    .update({
      venue_name: cleanedVenueName,
      status: "lobby",
      round_index: 0,
      rounds: [],
      vote_group_index: null,
      prompt_deck: promptDeck,
      prompt_cursor: 0,
      category_grid: categoryGrid,
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

