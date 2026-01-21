// Start a game session and generate first round
import { createHandler, requireString, corsResponse, getSession, AppError, shuffleArray } from '../_shared/utils.ts';
import { GROUP_SIZE, TOTAL_ROUNDS } from '../_shared/prompts.ts';
import { createTeamGroups } from '../_shared/grouping.ts';
import type { Session, Round, RoundGroup } from '../_shared/types.ts';

/**
 * Seeded RNG for consistent random values across all clients
 */
function seededRandom(seed: string, index: number): number {
  let hash = 0;
  const str = seed + index.toString();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) / 2147483647; // Normalize to 0-1
}

/**
 * Generate locked tiles for the grid
 * Rules:
 * - At most 1 locked tile per column
 * - Locked tiles randomly placed in rows within their column
 * - Uses seeded RNG for consistency across all clients
 */
function generateLockedTiles(
  sessionId: string,
  categories: Array<{ id: string }>,
  tilesToLock: number,
  rows: number
): Array<{ categoryId: string; promptIndex: number }> {
  if (tilesToLock === 0) return [];
  
  const lockedTiles: Array<{ categoryId: string; promptIndex: number }> = [];
  
  // Determine which columns (categories) get locks
  // For tilesToLock = 1: pick 1 column
  // For tilesToLock = 2: pick 2 columns
  const columnsToLock: number[] = [];
  for (let i = 0; i < tilesToLock; i++) {
    const rand = seededRandom(sessionId, i);
    const columnIndex = Math.floor(rand * 3); // 0-2 for first card columns
    if (!columnsToLock.includes(columnIndex)) {
      columnsToLock.push(columnIndex);
    } else {
      // If column already selected, try next column
      const nextColumn = (columnIndex + 1) % 3;
      columnsToLock.push(nextColumn);
    }
  }
  
  // For each selected column, pick a random row
  columnsToLock.forEach((columnIndex, lockIndex) => {
    const rand = seededRandom(sessionId, 100 + lockIndex); // Different seed offset
    const rowIndex = Math.floor(rand * rows);
    
    // Card 1 categories (0-2)
    const card1CategoryId = categories[columnIndex]?.id;
    if (card1CategoryId) {
      lockedTiles.push({
        categoryId: card1CategoryId,
        promptIndex: rowIndex,
      });
    }
    
    // Card 2 categories (3-5) - mirror the lock pattern
    const card2CategoryId = categories[columnIndex + 3]?.id;
    if (card2CategoryId) {
      lockedTiles.push({
        categoryId: card2CategoryId,
        promptIndex: rowIndex,
      });
    }
  });
  
  return lockedTiles;
}

async function handleStartSession(req: Request, uid: string, supabase: any): Promise<Response> {
    const { sessionId } = await req.json();

    requireString(sessionId, 'sessionId');
    
  // Get and validate session (also checks host permissions)
  const session = await getSession(supabase, sessionId);

  if (session.host_uid !== uid) {
    throw new AppError(403, 'Only the host can start the game', 'permission-denied');
  }

  // Session already validated by getSession() and validateSessionPhase()

  // Get all non-host teams
  const { data: teams } = await supabase
    .from('teams')
    .select('id, captain_id')
    .eq('session_id', sessionId)
    .eq('is_host', false);
    
  if (!teams || teams.length === 0) {
    throw new AppError(400, 'Need at least one player to start', 'failed-precondition');
  }
  
  // Remove empty teams (teams without captains) before starting the game
  const teamsWithCaptains = teams?.filter(t => t.captain_id) || [];
  const emptyTeamIds = teams?.filter(t => !t.captain_id).map(t => t.id) || [];
  
  if (emptyTeamIds.length > 0) {
    console.log(`Removing ${emptyTeamIds.length} empty teams:`, emptyTeamIds);
    
    // Delete team members for empty teams
    await supabase
      .from('team_members')
      .delete()
      .in('team_id', emptyTeamIds);
    
    // Delete the empty teams
    await supabase
      .from('teams')
      .delete()
      .in('id', emptyTeamIds);
    
    // Delete associated team codes
    await supabase
      .from('team_codes')
      .delete()
      .in('team_id', emptyTeamIds);
    
    console.log(`Cleaned up ${emptyTeamIds.length} empty teams`);
  }
  
  if (teamsWithCaptains.length === 0) {
    throw new AppError(400, 'Need at least one player to start', 'failed-precondition');
  }
    
    // Shuffle teams
    const shuffledTeamIds: string[] = shuffleArray(teamsWithCaptains.map((t: { id: string }) => t.id));
    
    // Determine game mode
    const isJeopardyMode = session.settings?.gameMode === 'jeopardy';
    
    // Generate rounds with groups
    const rounds: Round[] = [];
    let promptCursor = session.prompt_cursor || 0;
    const promptDeck = session.prompt_deck || [];
    
    // Use session's totalRounds setting
    // For Jeopardy mode, double the rounds to account for both cards (Card 1 and Card 2)
    const baseTotalRounds = session.settings?.totalRounds;
    if (!baseTotalRounds) {
      throw new Error("totalRounds setting is required");
    }
    const totalRounds = isJeopardyMode ? baseTotalRounds * 2 : baseTotalRounds;
    
    for (let i = 0; i < totalRounds; i++) {
      const groups: RoundGroup[] = [];
      
      // Create groups using new algorithm
      console.log(`Round ${i}: Creating groups for ${shuffledTeamIds.length} teams`);
      const teamGroups = createTeamGroups(shuffledTeamIds);
      console.log(`Round ${i}: createTeamGroups returned ${teamGroups.length} groups:`, teamGroups.map(g => g.length));
      
      // Create RoundGroup objects for each team group
      teamGroups.forEach((groupTeamIds, index) => {
        const groupId = `g${index}`;
        
        // Get next prompt
        if (promptCursor >= promptDeck.length) {
          promptCursor = 0;
        }
        const prompt = promptDeck[promptCursor] || "What's your hot take?";
        promptCursor++;
        
        console.log(`Round ${i}, Group ${index}: ${groupTeamIds.length} teams`);
        groups.push({
          id: groupId,
          prompt,
          teamIds: groupTeamIds,
        });
      });
      
      console.log(`Round ${i}: Created ${groups.length} groups total`);
      rounds.push({
        prompt: groups[0]?.prompt,
        groups,
      });
    }
    
    // Determine initial phase based on game mode
    const initialStatus = isJeopardyMode ? 'category-select' : 'answer';
    
    console.log('Starting session with mode:', session.settings?.gameMode, 'initialStatus:', initialStatus);
    
    // Configure dynamic grid based on numGroups × totalRounds
    let updatedCategoryGrid = session.category_grid;
    if (isJeopardyMode && session.category_grid && rounds.length > 0) {
      const numGroups = rounds[0].groups.length;
      const categoriesPerCard = 3; // Fixed: 3 categories per card
      
      // Calculate per card: totalActiveTiles = numGroups × baseTotalRounds (rounds per card)
      // Since totalRounds is already doubled for Jeopardy, divide by 2 to get rounds per card
      const roundsPerCard = totalRounds / 2;
      const totalActiveTiles = numGroups * roundsPerCard;
      const rows = Math.ceil(totalActiveTiles / 3);
      const totalTilesPerCard = rows * 3;
      const tilesToLock = totalTilesPerCard - totalActiveTiles; // 0-2
      
      // Generate locked tiles using seeded RNG (session ID as seed)
      const lockedTiles = generateLockedTiles(session.id, session.category_grid.categories, tilesToLock, rows);
      
      updatedCategoryGrid = {
        ...session.category_grid,
        categoriesPerCard: categoriesPerCard,
        promptsPerCategory: rows,
        totalSlots: totalTilesPerCard * 2, // Both cards
        lockedTiles: lockedTiles,
      };
      
      console.log(`Dynamic grid: ${numGroups} groups × ${totalRounds} rounds = ${totalActiveTiles} active tiles per card`);
      console.log(`Grid size: ${rows} rows × 3 cols = ${totalTilesPerCard} tiles per card (${tilesToLock} locked)`);
      console.log(`Locked tiles:`, lockedTiles);
    }
    
    // Select random team for each group in jeopardy mode
    if (isJeopardyMode && rounds.length > 0) {
      try {
        rounds[0].groups = rounds[0].groups.map(group => ({
          ...group,
          selectingTeamId: group.teamIds[Math.floor(Math.random() * group.teamIds.length)],
        }));
        console.log('Selected random teams for groups:', rounds[0].groups.map(g => ({ id: g.id, selectingTeamId: g.selectingTeamId })));
      } catch (err) {
        console.error('Error selecting random teams:', err);
        throw err;
      }
    }
    
    // Calculate phase end time
    const phaseSecs = isJeopardyMode 
      ? (session.settings?.categorySelectSecs || 15)
      : (session.settings?.answerSecs || 90);
    const endsAt = new Date(Date.now() + phaseSecs * 1000).toISOString();
    
    console.log('Updating session to status:', initialStatus, 'with', rounds.length, 'rounds');
    
    // Update session
    const { data: updatedSession, error: updateError } = await supabase
      .from('sessions')
      .update({
        status: initialStatus,
        category_grid: updatedCategoryGrid,
        round_index: 0,
        rounds,
        prompt_cursor: promptCursor,
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

Deno.serve(createHandler(handleStartSession));