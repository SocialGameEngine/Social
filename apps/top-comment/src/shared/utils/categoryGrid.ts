import type { PromptLibraryId } from "../promptLibraries";

export interface PromptBonus {
  promptIndex: number;        // 0-6
  bonusType: 'points' | 'multiplier';
  bonusValue: number;         // 100-700 for points, 2 for multiplier
  revealed: boolean;          // true once selected
}

export interface CategoryGrid {
  categories: Array<{
    id: PromptLibraryId;
    usedPrompts: number[];
    promptBonuses: PromptBonus[];
  }>;
  totalSlots: number;
  categoriesPerCard?: number; // Fixed: 3 categories per card
  promptsPerCategory?: number; // Dynamic: calculated based on numGroups × TOTAL_ROUNDS
  lockedTiles?: Array<{
    categoryId: PromptLibraryId;
    promptIndex: number;
  }>;
}

/**
 * Generate shuffled bonuses for a category column (7 prompts)
 * 6 cards with point values (100-700) + 1 card with 2x multiplier
 */
export function generateCategoryBonuses(): PromptBonus[] {
  const pointValues = [100, 200, 300, 400, 500, 600, 700];
  const bonuses: PromptBonus[] = [];
  
  // Add 6 point cards
  for (let i = 0; i < 6; i++) {
    bonuses.push({
      promptIndex: i,
      bonusType: 'points',
      bonusValue: pointValues[i],
      revealed: false
    });
  }
  
  // Add 1 multiplier card
  bonuses.push({
    promptIndex: 6,
    bonusType: 'multiplier',
    bonusValue: 2,
    revealed: false
  });
  
  // Shuffle array using Fisher-Yates algorithm
  for (let i = bonuses.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bonuses[i], bonuses[j]] = [bonuses[j], bonuses[i]];
  }
  
  // Reassign promptIndex after shuffle
  return bonuses.map((bonus, index) => ({ ...bonus, promptIndex: index }));
}

/**
 * Calculate locked tiles based on number of groups and total rounds
 * Simplified for 1 card (3 categories only)
 * Example: 1 group, 1 round = 1 unlocked per card, 2 locked per card
 */
export function calculateLockedTiles(
  selectedCategories: PromptLibraryId[],
  numGroups: number,
  totalRounds: number
): Array<{ categoryId: PromptLibraryId; promptIndex: number }> {
  const unlockedPerCard = numGroups * totalRounds;
  const lockedPerCard = 3 - unlockedPerCard;
  
  const lockedTiles: Array<{ categoryId: PromptLibraryId; promptIndex: number }> = [];
  
  if (lockedPerCard === 0) return lockedTiles;
  
  // Use only first 3 categories (1 card)
  const cardCategories = selectedCategories.slice(0, 3);
  
  // Randomly select categories for locked tiles
  const shuffledCategories = [...cardCategories].sort(() => Math.random() - 0.5);
  const selectedForLocking = shuffledCategories.slice(0, lockedPerCard);
  
  // Lock index 0 for selected categories
  for (const categoryId of selectedForLocking) {
    lockedTiles.push({ categoryId, promptIndex: 0 });
  }
  
  return lockedTiles;
}

/**
 * Initialize category grid for jeopardy mode with 6 categories (2 cards of 3)
 * @param selectedCategories - 6 selected prompt library IDs
 * @param numGroups - Number of groups in the session
 * @param totalRounds - Total number of rounds to play
 */
export function initializeCategoryGrid(
  selectedCategories: PromptLibraryId[],
  numGroups: number = 1,
  totalRounds: number = 1
): CategoryGrid {
  if (selectedCategories.length !== 6) {
    throw new Error('Must select exactly 6 categories (2 cards of 3)');
  }
  
  const lockedTiles = calculateLockedTiles(selectedCategories, numGroups, totalRounds);
  
  return {
    categories: selectedCategories.map(id => ({
      id,
      usedPrompts: [],
      promptBonuses: generateCategoryBonuses(),
    })),
    totalSlots: selectedCategories.length, // Total number of tiles to display
    categoriesPerCard: 3,
    lockedTiles,
  };
}

/**
 * Update category grid with locked tiles based on current group count and rounds
 * This should be called when the game starts to lock tiles appropriately
 */
export function updateCategoryGridLocks(
  grid: CategoryGrid,
  numGroups: number,
  totalRounds: number
): CategoryGrid {
  const selectedCategories = grid.categories.map(c => c.id);
  const lockedTiles = calculateLockedTiles(selectedCategories, numGroups, totalRounds);
  
  return {
    ...grid,
    lockedTiles,
  };
}

/**
 * Mark a prompt as used in a category
 */
export function markPromptUsed(
  grid: CategoryGrid,
  categoryId: PromptLibraryId,
  promptIndex: number
): CategoryGrid {
  return {
    ...grid,
    categories: grid.categories.map(cat => 
      cat.id === categoryId
        ? { ...cat, usedPrompts: [...cat.usedPrompts, promptIndex] }
        : cat
    ),
  };
}

/**
 * Check if a category has available prompts
 */
export function canSelectPrompt(
  grid: CategoryGrid,
  categoryId: PromptLibraryId
): boolean {
  const category = grid.categories.find(c => c.id === categoryId);
  // For Jeopardy mode, we only display 1 tile per category (index 0)
  // Check if index 0 is not locked and not used
  const isIndex0Locked = grid.lockedTiles?.some(t => t.categoryId === categoryId && t.promptIndex === 0) || false;
  const isIndex0Used = category?.usedPrompts.includes(0) || false;
  return !isIndex0Locked && !isIndex0Used;
}

/**
 * Get count of remaining prompts in a category
 * For Jeopardy mode, only 1 tile per category (index 0)
 */
export function getRemainingPrompts(
  grid: CategoryGrid,
  categoryId: PromptLibraryId
): number {
  const isIndex0Locked = grid.lockedTiles?.some(t => t.categoryId === categoryId && t.promptIndex === 0) || false;
  const category = grid.categories.find(c => c.id === categoryId);
  const isIndex0Used = category?.usedPrompts.includes(0) || false;
  
  return (!isIndex0Locked && !isIndex0Used) ? 1 : 0;
}

/**
 * Get total remaining prompts across all categories
 * For Jeopardy mode, only count tiles that are actually displayed (not locked)
 */
export function getTotalRemainingPrompts(grid: CategoryGrid, roundIndex?: number, totalRounds?: number): number {
  // Get the active card categories
  const activeCard = getActiveCard(grid, roundIndex, totalRounds);
  const cardCategories = getCardCategories(grid, activeCard);
  
  return cardCategories.reduce((sum, cat) => {
    // For Jeopardy mode, we only display 1 tile per category (index 0)
    // So we only count that tile if it's not locked and not used
    const isIndex0Locked = grid.lockedTiles?.some(t => t.categoryId === cat.id && t.promptIndex === 0) || false;
    const isIndex0Used = cat.usedPrompts.includes(0);
    
    // If index 0 is not locked and not used, count it as remaining
    const remaining = (!isIndex0Locked && !isIndex0Used) ? 1 : 0;
    
    return sum + remaining;
  }, 0);
}

/**
 * Get remaining prompts for a specific card
 * For Jeopardy mode, only count index 0 tiles
 */
export function getCardRemainingPrompts(grid: CategoryGrid, cardNumber: 1 | 2): number {
  const cardCategories = getCardCategories(grid, cardNumber);
  
  return cardCategories.reduce((sum, cat) => {
    // For Jeopardy mode, check if index 0 is locked or used
    const isIndex0Locked = grid.lockedTiles?.some(t => t.categoryId === cat.id && t.promptIndex === 0) || false;
    const isIndex0Used = cat.usedPrompts.includes(0);
    
    // Count as remaining only if index 0 is not locked and not used
    const remaining = (!isIndex0Locked && !isIndex0Used) ? 1 : 0;
    
    return sum + remaining;
  }, 0);
}

/**
 * Check if a specific prompt is locked
 */
export function isPromptLocked(
  grid: CategoryGrid,
  categoryId: PromptLibraryId,
  promptIndex: number
): boolean {
  if (!grid.lockedTiles) return false;
  return grid.lockedTiles.some(
    tile => tile.categoryId === categoryId && tile.promptIndex === promptIndex
  );
}

/**
 * Get available prompt indices for a category (excluding locked tiles)
 * For Jeopardy mode, only index 0 is displayed
 */
export function getAvailablePromptIndices(
  grid: CategoryGrid,
  categoryId: PromptLibraryId
): number[] {
  const category = grid.categories.find(c => c.id === categoryId);
  if (!category) return [];
  
  // For Jeopardy mode, only check index 0
  const isIndex0Locked = isPromptLocked(grid, categoryId, 0);
  const isIndex0Used = category.usedPrompts.includes(0);
  
  return (!isIndex0Locked && !isIndex0Used) ? [0] : [];
}

/**
 * Get which card (1 or 2) should be displayed based on round index or Card 1 completion
 * Card 2 appears when we're in the second half of rounds OR when 2+ categories in Card 1 are exhausted
 * For Jeopardy mode, a category is exhausted when index 0 is used
 */
export function getActiveCard(grid: CategoryGrid, roundIndex?: number, totalRounds?: number): 1 | 2 {
  const categoriesPerCard = grid.categoriesPerCard || 3;
  
  // If round info is provided, use it to determine card
  // Second half of rounds = Card 2
  if (roundIndex !== undefined && totalRounds !== undefined && totalRounds > 0) {
    const halfwayPoint = Math.floor(totalRounds / 2);
    if (roundIndex >= halfwayPoint) {
      return 2;
    }
  }
  
  // Fallback: Check if Card 1 categories are exhausted
  const card1Categories = grid.categories.slice(0, categoriesPerCard);
  const exhaustedInCard1 = card1Categories.filter(cat => cat.usedPrompts.includes(0)).length;
  
  // Switch to Card 2 when 2 or more categories in Card 1 are exhausted
  return exhaustedInCard1 >= 2 ? 2 : 1;
}

/**
 * Get categories for a specific card (1 or 2)
 */
export function getCardCategories(grid: CategoryGrid, cardNumber: 1 | 2) {
  const categoriesPerCard = grid.categoriesPerCard;
  if (!categoriesPerCard) {
    throw new Error("categoriesPerCard is required");
  }
  const startIndex = cardNumber === 1 ? 0 : categoriesPerCard;
  const endIndex = cardNumber === 1 ? categoriesPerCard : categoriesPerCard * 2;
  return grid.categories.slice(startIndex, endIndex);
}

/**
 * Get the bonus for a specific prompt
 */
export function getPromptBonus(
  grid: CategoryGrid,
  categoryId: PromptLibraryId,
  promptIndex: number
): PromptBonus | undefined {
  const category = grid.categories.find(c => c.id === categoryId);
  if (!category?.promptBonuses) return undefined;
  return category.promptBonuses.find(b => b.promptIndex === promptIndex);
}

/**
 * Get all revealed bonuses for a category
 */
export function getRevealedBonuses(
  grid: CategoryGrid,
  categoryId: PromptLibraryId
): PromptBonus[] {
  const category = grid.categories.find(c => c.id === categoryId);
  if (!category?.promptBonuses) return [];
  return category.promptBonuses.filter(b => b.revealed);
}

/**
 * Get remaining bonus range for strategic decision making
 */
export function getRemainingBonusRange(
  grid: CategoryGrid,
  categoryId: PromptLibraryId
): { min: number; max: number; hasMultiplier: boolean } {
  const category = grid.categories.find(c => c.id === categoryId);
  if (!category?.promptBonuses) {
    return { min: 0, max: 0, hasMultiplier: false };
  }
  
  const unrevealed = category.promptBonuses.filter(b => !b.revealed);
  const pointBonuses = unrevealed.filter(b => b.bonusType === 'points');
  
  if (pointBonuses.length === 0) {
    return { min: 0, max: 0, hasMultiplier: unrevealed.some(b => b.bonusType === 'multiplier') };
  }
  
  return {
    min: Math.min(...pointBonuses.map(b => b.bonusValue)),
    max: Math.max(...pointBonuses.map(b => b.bonusValue)),
    hasMultiplier: unrevealed.some(b => b.bonusType === 'multiplier')
  };
}
