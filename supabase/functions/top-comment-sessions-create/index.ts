// Create a new game session
import { createHandler, cleanTeamName, corsResponse, AppError, verifyVenueAccount } from "../_shared/utils.ts";
import { getPromptLibrary, DEFAULT_PROMPTS, GROUP_SIZE, TOTAL_ROUNDS } from "../_shared/prompts.ts";
import { generateCategoryBonuses } from "../_shared/categoryGrid.ts";
import type { Session } from "../_shared/types.ts";

async function handleCreateSession(req: Request, uid: string, supabase: any): Promise<Response> {
  // Verify venue account is active
  await verifyVenueAccount(uid, supabase);
    const { venueName, promptLibraryId, gameMode, selectedCategories, totalRounds } = await req.json();
    const cleanedVenueName = venueName ? cleanTeamName(venueName) : undefined;
    const libraryId = promptLibraryId || 'classic';
    const mode = gameMode || 'classic';
    
    // Generate unique room code
    const code = await supabase.rpc('ensure_unique_code');
    if (!code.data) {
      throw new Error('Failed to generate room code');
    }
    
    // Get prompts for this library
    const library = await getPromptLibrary(libraryId);
    const promptDeck = [...library.prompts].sort(() => Math.random() - 0.5);
    
    // Initialize category grid for jeopardy mode
    let categoryGrid = null;
    if (mode === 'jeopardy') {
      const allLibraryIds = [
        'classic', 'bar', 'basic', 'halloween', 'selfie', 'victoria',
        'dangerfield', 'medieval', 'anime', 'politics', 'scifi',
        'popculture', 'cinema', 'canucks', 'bc', 'tech',
        'internetculture', 'datingapp', 'remotework', 'adulting',
        'groupchat', 'streaming', 'climateanxiety', 'fictionalworlds'
      ];
      
      // Use host-selected categories or default to 6 (3 per card)
      const selectedCats = selectedCategories && selectedCategories.length === 6
        ? selectedCategories 
        : allLibraryIds.slice(0, 6);
      
      // Validate all selected categories exist
      const validCategories = selectedCats.filter((id: string) => allLibraryIds.includes(id));
      if (validCategories.length !== 6) {
        throw new Error('Invalid category selection: must select exactly 6 categories (3 per card)');
      }
      
      categoryGrid = {
        categories: validCategories.map((id: string) => ({
          id,
          usedPrompts: [],
          promptBonuses: generateCategoryBonuses(),
        })),
        totalSlots: 42, // 6 categories × 7 prompts (max)
        categoriesPerCard: 3, // Fixed: 3 categories per card
      };
      console.log('Creating jeopardy session with 6 categories (3 per card) and shuffled bonuses:', categoryGrid);
    } else {
      console.log('Creating classic session, no category grid');
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
        category_grid: categoryGrid,
        settings: {
          answerSecs: 90,
          voteSecs: 30,
          resultsSecs: 12,
          maxTeams: 10,
          gameMode: mode,
          categorySelectSecs: 15,
          selectedCategories: mode === 'jeopardy' && categoryGrid ? categoryGrid.categories.map((c: { id: string; usedPrompts: number[] }) => c.id) : undefined,
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
