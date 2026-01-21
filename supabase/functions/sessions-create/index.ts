// Create a new game session
import { createHandler, cleanTeamName, corsResponse, AppError, verifyVenueAccount } from "../_shared/utils.ts";
import { getPromptLibrary, DEFAULT_PROMPTS, GROUP_SIZE, TOTAL_ROUNDS } from "../_shared/prompts.ts";
import { generateCategoryBonuses } from "../_shared/categoryGrid.ts";
import type { Session, Team } from "../_shared/types.ts";

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
      .from('sessions')
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
    
    // Generate team codes for this session
    console.log("Generating team codes for session:", session.id);
    try {
      const { error: codesError } = await supabase.rpc('generate_team_codes', {
        session_uuid: session.id,
        num_codes: 10
      });
      
      if (codesError) {
        console.error('Failed to generate team codes:', codesError);
        console.error('Error details:', JSON.stringify(codesError));
        throw codesError;
      }
      
      console.log('Team codes generated successfully');
    } catch (error) {
      console.error('Exception during team code generation:', error);
      throw error;
    }
    
    // Now fetch the generated team codes
    console.log('Fetching generated team codes for session:', session.id);
    let teamCodes;
    try {
      const { data, error: fetchError } = await supabase
        .from('team_codes')
        .select('code')
        .eq('session_id', session.id)
        .eq('is_used', false)
        .limit(10);
      
      if (fetchError) {
        console.error('Failed to fetch team codes:', fetchError);
        console.error('Fetch error details:', JSON.stringify(fetchError));
        throw fetchError;
      }
      
      teamCodes = data;
      
      if (!teamCodes || teamCodes.length === 0) {
        console.error('No team codes found after generation');
        throw new Error('Failed to fetch generated team codes');
      }
      
      console.log('Successfully fetched', teamCodes.length, 'team codes for session:', session.id);
    } catch (error) {
      console.error('Exception during team code fetch:', error);
      throw error;
    }
    
    // Create teams for each team code
    console.log('Creating teams for session:', session.id);
    let createdTeams;
    try {
      const teamsToCreate = teamCodes.map((code: any, index: number) => {
        // Let Postgres generate the UUID automatically by not specifying id
        return {
          session_id: session.id,
          team_name: `Team ${index + 1}`,
          uid: null, // Will be set when first user joins
          is_host: false,
          score: 0,
          joined_at: new Date().toISOString(),
          mascot_id: Math.floor(Math.random() * 6) + 1
        };
      });
      
      console.log('Inserting', teamsToCreate.length, 'teams into database');
      
      const { data, error: teamsError } = await supabase
        .from('teams')
        .insert(teamsToCreate)
        .select();
      
      if (teamsError) {
        console.error('Failed to create teams:', teamsError);
        console.error('Teams error details:', JSON.stringify(teamsError));
        throw teamsError;
      }
      
      createdTeams = data;
      console.log(`Successfully created ${createdTeams.length} teams for session:`, session.id);
    } catch (error) {
      console.error('Exception during team creation:', error);
      throw error;
    }
    
    // Assign team codes to teams
    console.log('Assigning team codes to teams');
    const codeAssignments = teamCodes.map((code: any, index: number) => ({
      code: code.code,
      team_id: createdTeams[index].id,
      session_id: session.id,
      is_used: false,
      assigned_at: new Date().toISOString()
    }));
    
    const { error: assignmentError } = await supabase
      .from('team_codes')
      .upsert(codeAssignments, { onConflict: 'code' });
    
    if (assignmentError) {
      console.error('Failed to assign team codes:', assignmentError);
      throw assignmentError;
    }
    
    console.log('Successfully assigned team codes to teams');
    
    // Create analytics record
    await supabase
      .from('session_analytics')
      .insert({ session_id: session.id });
    
    return corsResponse({
      sessionId: session.id,
      code: session.code,
      session: session as Session,
    });
  }

// @ts-ignore - Deno global is available in Supabase Edge Functions runtime
Deno.serve(createHandler(handleCreateSession));
