// Start a game session and generate first round
import { createHandler, requireString, corsResponse, AppError, shuffleArray } from '../_shared/utils.ts';
import { getTopCommentSession, getActiveTopCommentPlayers } from '../_shared/top-comment-utils.ts';
import { getPromptLibrary } from '../_shared/prompts.ts';
import { getMashupLibraryForRound, requireValidMashupLibraries } from '../_shared/mashup.ts';
import { createTeamGroups } from '../_shared/grouping.ts';
import type { Session, Round, RoundGroup } from '../_shared/types.ts';

async function handleStartSession(req: Request, uid: string, supabase: any): Promise<Response> {
    const { sessionId } = await req.json();

    requireString(sessionId, 'sessionId');
    
  // Get and validate session (also checks host permissions)
  const session = await getTopCommentSession(supabase, sessionId);

  if (session.host_uid !== uid) {
    throw new AppError(403, 'Only the host can start the game', 'permission-denied');
  }

  // Session already validated by getSession() and validateSessionPhase()

  // Only include "active" players (players with user_id set).
  // This prevents inactive players from being grouped.
  const activeTeamIds = await getActiveTopCommentPlayers(supabase, sessionId);

  if (activeTeamIds.length === 0) {
    throw new AppError(400, 'Need at least one player to start', 'failed-precondition');
  }
    
    // Shuffle teams
    const shuffledTeamIds: string[] = shuffleArray(activeTeamIds);
    
  // Determine game mode
  const isMashupMode = session.settings?.gameMode === 'mashup';
    
    // Generate rounds with groups
    const rounds: Round[] = [];
  let promptCursor = session.prompt_cursor || 0;
  const promptDeck = session.prompt_deck || [];
    
  // Use session's totalRounds setting
    const baseTotalRounds = session.settings?.totalRounds;
    if (!baseTotalRounds) {
      throw new Error("totalRounds setting is required");
    }
  const totalRounds = baseTotalRounds;

  const selectedLibraries = isMashupMode
    ? requireValidMashupLibraries(session.selected_libraries)
    : [];
  const currentLibraryIndex = typeof session.current_library_index === 'number' ? session.current_library_index : 0;
  const libraryDecks = new Map<string, { prompts: string[]; cursor: number }>();

  const getLibraryDeck = async (
    libraryId: string,
  ): Promise<{ prompts: string[]; cursor: number }> => {
    const existing = libraryDecks.get(libraryId);
    if (existing) return existing;
    const library = await getPromptLibrary(libraryId);
    const shuffled = shuffleArray(library.prompts);
    const deck = { prompts: shuffled, cursor: 0 };
    libraryDecks.set(libraryId, deck);
    return deck;
  };
    
    for (let i = 0; i < totalRounds; i++) {
      const groups: RoundGroup[] = [];
      
      // Create groups using new algorithm
      console.log(`Round ${i}: Creating groups for ${shuffledTeamIds.length} teams`);
      const teamGroups = createTeamGroups(shuffledTeamIds);
      console.log(`Round ${i}: createTeamGroups returned ${teamGroups.length} groups:`, teamGroups.map(g => g.length));

      const roundLibraryId = isMashupMode
        ? getMashupLibraryForRound(selectedLibraries, currentLibraryIndex, i).libraryId
        : (session.prompt_library_id || 'classic');
      
      // Create RoundGroup objects for each team group
      for (let index = 0; index < teamGroups.length; index++) {
        const groupTeamIds = teamGroups[index];
        const groupId = `g${index}`;

        let prompt = "What's your hot take?";
        if (isMashupMode) {
          const deck = await getLibraryDeck(roundLibraryId);
          if (deck.cursor >= deck.prompts.length) {
            deck.cursor = 0;
          }
          prompt = deck.prompts[deck.cursor] || prompt;
          deck.cursor += 1;
        } else {
          if (promptCursor >= promptDeck.length) {
            promptCursor = 0;
          }
          prompt = promptDeck[promptCursor] || prompt;
          promptCursor += 1;
        }

        console.log(`Round ${i}, Group ${index}: ${groupTeamIds.length} teams`);
        groups.push({
          id: groupId,
          prompt,
          teamIds: groupTeamIds,
          promptLibraryId: roundLibraryId,
        });
      }
      
      console.log(`Round ${i}: Created ${groups.length} groups total`);
      rounds.push({
        prompt: groups[0]?.prompt,
        groups,
      });
    }
    
  // Determine initial phase based on game mode
  const initialStatus = 'answer';
    
  console.log('Starting session with mode:', session.settings?.gameMode, 'initialStatus:', initialStatus);
    
    // Calculate phase end time
  const phaseSecs = session.settings?.answerSecs || 90;
    const endsAt = new Date(Date.now() + phaseSecs * 1000).toISOString();
    
    console.log('Updating session to status:', initialStatus, 'with', rounds.length, 'rounds');
    
    // Update session
    const { data: updatedSession, error: updateError } = await supabase
      .from('top_comment_sessions')
      .update({
      status: initialStatus,
        round_index: 0,
        rounds,
      prompt_cursor: isMashupMode ? 0 : promptCursor,
      prompt_library_id: isMashupMode ? selectedLibraries[currentLibraryIndex] : session.prompt_library_id,
      current_library_index: isMashupMode ? currentLibraryIndex : null,
        started_at: new Date().toISOString(),
        ends_at: endsAt,
      })
      .eq('id', sessionId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Session update error:', updateError);
      throw updateError;
    }
    
    console.log('Session started successfully with status:', updatedSession.status);
    
    return corsResponse({ session: updatedSession as Session });
}

// @ts-ignore - Deno global is available in Supabase Edge Functions runtime
Deno.serve(createHandler(handleStartSession));