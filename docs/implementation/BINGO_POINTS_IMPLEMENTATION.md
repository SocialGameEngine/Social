# Bingo Card Hidden Points Implementation Plan

## Overview
Implement a hidden point value system for the Jeopardy bingo grid where each card has shuffled point values (100-700) and one multiplier card per column. Points are revealed when selected and awarded to the vote winner.

## System Design

### Point Distribution Per Column (3 categories × 2 cards = 6 columns total)
- Each column has 7 cards with values: **100, 200, 300, 400, 500, 600, 700**
- Values are **randomly shuffled** within each column
- **1 card per column** is a **2x multiplier** instead of points
- Cards show **"?"** until selected
- Once selected, value is **revealed** and stored

### Bonus Award Flow
1. Team selects card → value revealed
2. Team answers prompt
3. Voting occurs
4. **Vote winner** receives the revealed bonus:
   - **Point cards**: Add 100-700 to team score
   - **Multiplier card**: Apply 2x to round voting score

### Strategic Elements
- Teams can **track revealed values** to deduce remaining cards
- Example: If 100, 200, 300 revealed → remaining cards likely high value
- Creates **risk/reward** decision making

## Data Structure Changes

### CategoryGrid Interface Update
```typescript
export interface CategoryGrid {
  categories: Array<{
    id: PromptLibraryId;
    usedPrompts: number[];
    promptBonuses: Array<{
      promptIndex: number;        // 0-6
      bonusType: 'points' | 'multiplier';
      bonusValue: number;         // 100-700 for points, 2 for multiplier
      revealed: boolean;          // true once selected
    }>;
  }>;
  totalSlots: number;
}
```

### RoundGroup Update
```typescript
interface RoundGroup {
  // ... existing fields
  selectedBonus?: {
    bonusType: 'points' | 'multiplier';
    bonusValue: number;
  };
}
```

## Implementation Steps

### 1. Backend - Session Creation
**File**: `a:\Social\Social\supabase\functions\sessions-create\index.ts`

- Generate shuffled bonuses for each category when creating jeopardy session
- For each of 6 categories:
  - Create array of 7 bonuses
  - 6 cards with point values (100-700, shuffled)
  - 1 card with multiplier (2x)
  - Shuffle the array
  - Assign to promptIndex 0-6

```typescript
function generateCategoryBonuses(): Array<{promptIndex: number, bonusType: string, bonusValue: number, revealed: boolean}> {
  const pointValues = [100, 200, 300, 400, 500, 600, 700];
  const bonuses = [];
  
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
  
  // Shuffle array
  return bonuses.sort(() => Math.random() - 0.5)
    .map((bonus, index) => ({ ...bonus, promptIndex: index }));
}
```

### 2. Backend - Category Selection
**File**: `a:\Social\Social\supabase\functions\sessions-select-category\index.ts`

- When category/prompt selected, mark bonus as revealed
- Store bonus in the RoundGroup for later award
- Return updated session with revealed bonus

```typescript
// Find the bonus for this prompt
const category = categoryGrid.categories.find(c => c.id === categoryId);
const bonus = category.promptBonuses.find(b => b.promptIndex === promptIndex);

// Mark as revealed
const updatedBonuses = category.promptBonuses.map(b => 
  b.promptIndex === promptIndex ? { ...b, revealed: true } : b
);

// Store in round group
const updatedGroup = {
  ...group,
  selectedBonus: {
    bonusType: bonus.bonusType,
    bonusValue: bonus.bonusValue
  }
};
```

### 3. Frontend - CategoryGrid Component
**File**: `a:\Social\Social\apps\event-platform\src\shared\components\CategoryGrid.tsx`

- Display "?" on unrevealed cards
- Display point value or "2x" on revealed cards
- Add reveal animation when card is selected
- Show visual indicator for multiplier cards (different color/icon)

```tsx
{/* Prompt Card Display */}
<button className="...">
  <div className="text-lg mb-1">{library.emoji}</div>
  
  {/* Bonus Display */}
  {bonus.revealed ? (
    <div className="text-xl font-bold">
      {bonus.bonusType === 'points' ? `${bonus.bonusValue}` : '2x'}
    </div>
  ) : (
    <div className="text-2xl opacity-50">?</div>
  )}
  
  <div className="text-xs">{promptIndex + 1}</div>
</button>
```

### 4. Backend - Voting/Results
**File**: `a:\Social\Social\supabase\functions\sessions-advance\index.ts`

- When calculating vote results, check if winner has selectedBonus
- Apply bonus to winner's score:
  - **Points**: Add bonusValue to team score
  - **Multiplier**: Multiply round voting score by bonusValue

```typescript
// After determining vote winner
if (winningGroup.selectedBonus) {
  const bonus = winningGroup.selectedBonus;
  
  if (bonus.bonusType === 'points') {
    // Add flat points
    winnerTeam.score += bonus.bonusValue;
  } else if (bonus.bonusType === 'multiplier') {
    // Apply multiplier to round score
    const roundScore = votesReceived; // or however round score is calculated
    winnerTeam.score += roundScore * (bonus.bonusValue - 1); // 2x means add 1x more
  }
}
```

### 5. Frontend - Results Display
**File**: `a:\Social\Social\apps\event-platform\src\features\team\Phases\ResultsPhase.tsx`

- Show bonus award animation for vote winner
- Display "+500 BONUS!" or "2x MULTIPLIER!" message
- Animate score increase

### 6. Utility Functions
**File**: `a:\Social\Social\apps\event-platform\src\shared\utils\categoryGrid.ts`

Add helper functions:
```typescript
export function getPromptBonus(
  grid: CategoryGrid,
  categoryId: PromptLibraryId,
  promptIndex: number
) {
  const category = grid.categories.find(c => c.id === categoryId);
  return category?.promptBonuses.find(b => b.promptIndex === promptIndex);
}

export function getRevealedBonuses(
  grid: CategoryGrid,
  categoryId: PromptLibraryId
) {
  const category = grid.categories.find(c => c.id === categoryId);
  return category?.promptBonuses.filter(b => b.revealed) || [];
}

export function getRemainingBonusRange(
  grid: CategoryGrid,
  categoryId: PromptLibraryId
): { min: number; max: number; hasMultiplier: boolean } {
  const revealed = getRevealedBonuses(grid, categoryId);
  const category = grid.categories.find(c => c.id === categoryId);
  
  const unrevealed = category?.promptBonuses.filter(b => !b.revealed) || [];
  const pointBonuses = unrevealed.filter(b => b.bonusType === 'points');
  
  return {
    min: Math.min(...pointBonuses.map(b => b.bonusValue)),
    max: Math.max(...pointBonuses.map(b => b.bonusValue)),
    hasMultiplier: unrevealed.some(b => b.bonusType === 'multiplier')
  };
}
```

## UI/UX Enhancements

### Visual Design
- **Unrevealed cards**: Show "?" with subtle glow/pulse
- **Revealed point cards**: Show value with color gradient (green=low, gold=high)
- **Revealed multiplier cards**: Show "2x" with special icon/color (purple/rainbow)
- **Used cards**: Fade out, show checkmark

### Animations
- **Card selection**: Flip animation revealing the bonus
- **Bonus award**: Points/multiplier fly to team score with particle effects
- **Score update**: Animated counter incrementing

### Strategic Info Display
- Show revealed bonuses for each column
- Display remaining value range (e.g., "200-700 remaining")
- Highlight columns with multiplier still available

## Testing Checklist

- [ ] Session creation assigns random bonuses to all 42 prompts (6 categories × 7 prompts)
- [ ] Each column has exactly one 2x multiplier
- [ ] Point values 100-700 are shuffled within each column
- [ ] Cards show "?" before selection
- [ ] Selecting a card reveals its bonus value
- [ ] Bonus is stored in RoundGroup
- [ ] Vote winner receives correct bonus (points or multiplier)
- [ ] Revealed bonuses persist across rounds
- [ ] Strategic info (remaining values) displays correctly
- [ ] Animations work smoothly
- [ ] Mobile and desktop layouts work

## Files to Modify

### Backend
1. `supabase/functions/sessions-create/index.ts` - Generate bonuses
2. `supabase/functions/sessions-select-category/index.ts` - Reveal bonus, store in group
3. `supabase/functions/sessions-advance/index.ts` - Award bonus to vote winner

### Frontend
4. `apps/event-platform/src/shared/types.ts` - Update CategoryGrid and RoundGroup interfaces
5. `apps/event-platform/src/shared/utils/categoryGrid.ts` - Add bonus utility functions
6. `apps/event-platform/src/shared/components/CategoryGrid.tsx` - Display bonuses, reveal animation
7. `apps/event-platform/src/features/team/Phases/ResultsPhase.tsx` - Show bonus award
8. `apps/event-platform/src/features/presenter/PresenterPage.tsx` - Display bonuses on presenter view

## Rollout Strategy

### Phase 1: Data Structure (Backend)
- Update types
- Generate bonuses on session creation
- Store and reveal bonuses on selection

### Phase 2: Basic Display (Frontend)
- Show "?" on unrevealed cards
- Show values on revealed cards
- Update CategoryGrid component

### Phase 3: Bonus Award (Backend + Frontend)
- Award bonuses to vote winners
- Display bonus in results

### Phase 4: Polish (Frontend)
- Add animations
- Add strategic info display
- Improve visual design

## Success Metrics

- Teams actively track revealed bonuses
- Selection decisions show strategic thinking
- Bonus awards create excitement in results phase
- System is easy to understand for new players
