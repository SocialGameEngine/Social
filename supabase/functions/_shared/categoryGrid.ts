export interface PromptBonus {
  promptIndex: number;
  bonusType: 'points' | 'multiplier';
  bonusValue: number;
  revealed: boolean;
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
