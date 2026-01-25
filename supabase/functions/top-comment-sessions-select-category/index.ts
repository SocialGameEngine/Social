// Handle category selection for jeopardy mode
import { createPublicHandler, corsResponse, getUserId } from '../_shared/utils.ts';
import { getPromptLibrary } from '../_shared/prompts.ts';

async function handleSelectCategory(req: Request, supabase: any): Promise<Response> {
  const uid = await getUserId(req);
  const { sessionId, groupId, categoryId, promptIndex } = await req.json();

  // Validate inputs
  if (!sessionId || !groupId || !categoryId) {
    throw new Error('Missing required fields: sessionId, groupId, categoryId');
  }

  // Get current session
  const { data: session, error: fetchError } = await supabase
    .from('top_comment_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (fetchError || !session) {
    throw new Error('Session not found');
  }

  // Validate session is in category-select phase
  if (session.status !== 'category-select') {
    throw new Error('Session is not in category selection phase');
  }

  // Validate category is available
  const categoryGrid = session.category_grid;
  if (!categoryGrid || !categoryGrid.categories) {
    throw new Error('Invalid category grid');
  }

  const category = categoryGrid.categories.find((c: any) => c.id === categoryId);
  if (!category) {
    throw new Error('Category not found in grid');
  }

  // Check if category has available prompts
  const usedPrompts = category.usedPrompts || [];
  if (usedPrompts.length >= 7) {
    throw new Error('No more prompts available in this category');
  }

  // Validate the requested prompt index
  if (promptIndex < 0 || promptIndex > 6) {
    throw new Error(`Invalid prompt index: ${promptIndex}. Must be between 0 and 6.`);
  }

  // Check if the requested prompt is already used
  if (usedPrompts.includes(promptIndex)) {
    throw new Error(`Prompt ${promptIndex} in category ${categoryId} has already been used`);
  }

  // Check if the requested prompt is locked
  const lockedTiles = categoryGrid.lockedTiles || [];
  const isLocked = lockedTiles.some((tile: any) => 
    tile.categoryId === categoryId && tile.promptIndex === promptIndex
  );
  if (isLocked) {
    throw new Error(`Prompt ${promptIndex} in category ${categoryId} is locked`);
  }

  // Use the specific prompt index from the request
  const selectedIndex = promptIndex;

  // Get the actual prompt from the library
  const library = await getPromptLibrary(categoryId);
  if (!library.prompts[selectedIndex]) {
    throw new Error(`Prompt index ${selectedIndex} not found in library ${categoryId}`);
  }
  const selectedPrompt = library.prompts[selectedIndex];

  // Get the bonus for this prompt
  const promptBonuses = category.promptBonuses || [];
  const bonus = promptBonuses.find((b: any) => b.promptIndex === selectedIndex);
  
  if (!bonus) {
    console.warn(`No bonus found for prompt ${selectedIndex} in category ${categoryId}`);
  }

  // Update category grid with used prompt and revealed bonus
  const updatedGrid = {
    ...categoryGrid,
    categories: categoryGrid.categories.map((c: any) =>
      c.id === categoryId
        ? { 
            ...c, 
            usedPrompts: [...usedPrompts, selectedIndex],
            promptBonuses: c.promptBonuses?.map((b: any) =>
              b.promptIndex === selectedIndex ? { ...b, revealed: true } : b
            ) || []
          }
        : c
    ),
  };

  // Update round group with selected category, prompt, and bonus
  const currentRoundIndex = session.round_index ?? 0;
  const rounds = session.rounds || [];
  const updatedRounds = rounds.map((round: any, idx: number) => {
    if (idx !== currentRoundIndex) return round;
    
    return {
      ...round,
      groups: round.groups.map((group: any) =>
        group.id === groupId
          ? { 
              ...group, 
              promptLibraryId: categoryId, 
              prompt: selectedPrompt,
              selectedBonus: bonus ? {
                bonusType: bonus.bonusType,
                bonusValue: bonus.bonusValue
              } : undefined
            }
          : group
      ),
    };
  });

  console.log(`Selected prompt ${selectedIndex} from category ${categoryId} for group ${groupId}`, {
    bonus: bonus ? `${bonus.bonusType === 'points' ? bonus.bonusValue + ' points' : bonus.bonusValue + 'x multiplier'}` : 'none'
  });

  // Update session
  const { data: updatedSession, error: updateError } = await supabase
    .from('top_comment_sessions')
    .update({
      category_grid: updatedGrid,
      rounds: updatedRounds,
    })
    .eq('id', sessionId)
    .select()
    .single();

  if (updateError) {
    console.error('Update error:', updateError);
    throw new Error('Failed to update session');
  }

  console.log('Category selection successful:', {
    categoryId,
    promptIndex: selectedIndex,
    remainingInCategory: 7 - usedPrompts.length - 1,
  });

  return corsResponse({ session: updatedSession });
}

// @ts-ignore - Deno global is available in Supabase Edge Functions runtime
Deno.serve(createPublicHandler(handleSelectCategory));
