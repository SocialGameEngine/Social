# Jeopardy Mode Implementation Guide

## Purpose
This document provides a structured implementation guide for adding Jeopardy mode to the event-platform game. It's designed to maximize AI assistant efficiency by providing clear context, file locations, and implementation order.

---

## Implementation Strategy

### Context Window Optimization
- Implement in **small, focused chunks** (one file/feature at a time)
- Each section includes **exact file paths** and **line references**
- **Test after each phase** before moving to next
- Use **git commits** between phases for rollback safety

### Dependencies & Order
```
Phase 1: Types & Constants (foundation)
  ↓
Phase 2: Utilities (pure functions, no dependencies)
  ↓
Phase 3: Components (UI, depends on types & utils)
  ↓
Phase 4: Business Logic (depends on all above)
  ↓
Phase 5: Backend (Edge functions)
  ↓
Phase 6: Integration & Testing
```

---

## Phase 1: Type System Foundation

### Goal
Add core types without breaking existing code. All changes are **additive only**.

### Files to Modify

#### 1.1 `src/shared/types.ts`
**Location:** Line 53 (SessionStatus type)

**Changes:**
```typescript
// BEFORE:
export type SessionStatus = "lobby" | "answer" | "vote" | "results" | "ended";

// AFTER:
export type SessionStatus = "lobby" | "category-select" | "answer" | "vote" | "results" | "ended";
```

**Location:** Line 55-60 (SessionSettings interface)

**Changes:**
```typescript
// ADD these fields to SessionSettings interface:
export interface SessionSettings {
  answerSecs: number;
  voteSecs: number;
  resultsSecs: number;
  maxTeams: number;
  gameMode?: "classic" | "jeopardy";  // NEW - defaults to "classic"
  categorySelectSecs?: number;  // NEW - defaults to 15
}
```

**Location:** Line 62-66 (RoundGroup interface)

**Changes:**
```typescript
// ADD these fields to RoundGroup interface:
export interface RoundGroup {
  id: string;
  prompt: string;
  teamIds: string[];
  promptLibraryId?: PromptLibraryId;  // NEW - for jeopardy mode
  selectingTeamId?: string;  // NEW - which team chose this category
}
```

**Location:** Line 73-92 (Session interface)

**Changes:**
```typescript
// ADD this field to Session interface (after line 91):
export interface Session {
  // ... existing fields
  categoryGrid?: {  // NEW - only for jeopardy mode
    available: PromptLibraryId[];
    used: PromptLibraryId[];
    totalSlots: number;
  };
}
```

**Location:** Line 3-7 (CreateSessionRequest interface)

**Changes:**
```typescript
// ADD this field to CreateSessionRequest:
export interface CreateSessionRequest {
  teamName: string;
  venueName?: string;
  promptLibraryId?: PromptLibraryId;
  gameMode?: "classic" | "jeopardy";  // NEW
}
```

**Location:** End of file (add new interfaces)

**Changes:**
```typescript
// ADD these new interfaces at the end:
export interface CategorySelectionRequest {
  sessionId: string;
  groupId: string;
  categoryId: PromptLibraryId;
}

export interface CategorySelectionResponse {
  session: Session;
}
```

**Testing:**
- Run `npm run type-check` or `tsc --noEmit`
- Verify no type errors
- Existing code should still compile (all fields are optional)

**Git Checkpoint:** `git commit -m "feat: add jeopardy mode types"`

---

## Phase 2: Pure Utility Functions

### Goal
Create helper functions with **no external dependencies**. Easy to test in isolation.

### Files to Create

#### 2.1 `src/shared/utils/categoryGrid.ts` (NEW FILE)

**Full Implementation:**
```typescript
import type { PromptLibraryId } from "../promptLibraries";

export interface CategoryGrid {
  available: PromptLibraryId[];
  used: PromptLibraryId[];
  totalSlots: number;
}

/**
 * Initialize category grid for jeopardy mode
 * @param availableLibraries - All available prompt library IDs
 * @param estimatedRounds - Expected number of rounds
 * @param groupsPerRound - Number of groups per round
 */
export function initializeCategoryGrid(
  availableLibraries: PromptLibraryId[],
  estimatedRounds: number,
  groupsPerRound: number
): CategoryGrid {
  const totalSlots = estimatedRounds * groupsPerRound;
  
  return {
    available: [...availableLibraries],
    used: [],
    totalSlots,
  };
}

/**
 * Mark a category as used and remove from available
 */
export function markCategoryUsed(
  grid: CategoryGrid,
  categoryId: PromptLibraryId
): CategoryGrid {
  if (!grid.available.includes(categoryId)) {
    return grid; // Already used or doesn't exist
  }
  
  return {
    ...grid,
    available: grid.available.filter(id => id !== categoryId),
    used: [...grid.used, categoryId],
  };
}

/**
 * Check if a category is available for selection
 */
export function isCategoryAvailable(
  grid: CategoryGrid,
  categoryId: PromptLibraryId
): boolean {
  return grid.available.includes(categoryId);
}

/**
 * Get count of remaining categories
 */
export function getRemainingCategories(grid: CategoryGrid): number {
  return grid.available.length;
}

/**
 * Check if grid has enough categories for next round
 */
export function hasEnoughCategories(
  grid: CategoryGrid,
  groupsNeeded: number
): boolean {
  return grid.available.length >= groupsNeeded;
}
```

**Testing:**
```typescript
// Quick manual test (can add to a test file later)
const grid = initializeCategoryGrid(['classic', 'bar', 'tech'], 5, 4);
console.assert(grid.available.length === 3);
console.assert(grid.used.length === 0);

const updated = markCategoryUsed(grid, 'classic');
console.assert(updated.available.length === 2);
console.assert(updated.used.length === 1);
```

#### 2.2 `src/shared/utils/teamSelection.ts` (NEW FILE)

**Full Implementation:**
```typescript
import type { Team } from "../types";

/**
 * Select a random team from a list
 * @returns Random team or null if list is empty
 */
export function selectRandomTeam(teams: Team[]): Team | null {
  if (teams.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * teams.length);
  return teams[randomIndex];
}

/**
 * Select one random team per group for category selection
 * @param groups - Array of groups with teamIds
 * @param allTeams - All teams in the session
 * @returns Map of groupId to selected teamId
 */
export function selectTeamsForGroups(
  groups: { id: string; teamIds: string[] }[],
  allTeams: Team[]
): Map<string, string> {
  const selections = new Map<string, string>();
  
  groups.forEach(group => {
    const groupTeams = allTeams.filter(t => group.teamIds.includes(t.id));
    const selectedTeam = selectRandomTeam(groupTeams);
    if (selectedTeam) {
      selections.set(group.id, selectedTeam.id);
    }
  });
  
  return selections;
}

/**
 * Check if a team is the selecting team for their group
 */
export function isSelectingTeam(
  teamId: string,
  groupSelectingTeamId: string | undefined
): boolean {
  return groupSelectingTeamId === teamId;
}
```

**Testing:**
```typescript
// Quick manual test
const mockTeams = [
  { id: 't1', teamName: 'Team 1' },
  { id: 't2', teamName: 'Team 2' },
];
const team = selectRandomTeam(mockTeams);
console.assert(team !== null);
console.assert(['t1', 't2'].includes(team.id));
```

**Git Checkpoint:** `git commit -m "feat: add category grid and team selection utilities"`

---

## Phase 3: UI Components

### Goal
Build reusable UI components that can be tested in isolation.

### Files to Create

#### 3.1 `src/shared/components/CategoryGrid.tsx` (NEW FILE)

**Full Implementation:**
```typescript
import { PromptLibrary } from "../promptLibraries";
import type { CategoryGrid as CategoryGridType } from "../utils/categoryGrid";
import { useTheme } from "../providers/ThemeProvider";
import { isCategoryAvailable } from "../utils/categoryGrid";

interface CategoryGridProps {
  libraries: PromptLibrary[];
  categoryGrid: CategoryGridType;
  selectedCategory?: string;
  onSelect?: (categoryId: string) => void;
  disabled?: boolean;
  canSelect?: boolean;
  highlightUsed?: boolean;
}

export function CategoryGrid({
  libraries,
  categoryGrid,
  selectedCategory,
  onSelect,
  disabled = false,
  canSelect = false,
  highlightUsed = true,
}: CategoryGridProps) {
  const { isDark } = useTheme();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {libraries.map((library) => {
        const isUsed = categoryGrid.used.includes(library.id);
        const isSelected = selectedCategory === library.id;
        const isAvailable = isCategoryAvailable(categoryGrid, library.id);
        const isClickable = canSelect && isAvailable && !disabled;

        return (
          <button
            key={library.id}
            onClick={() => isClickable && onSelect?.(library.id)}
            disabled={!isClickable}
            className={`
              relative rounded-xl p-4 text-center transition-all
              ${isUsed && highlightUsed ? 'opacity-30 cursor-not-allowed' : ''}
              ${isSelected ? 'ring-4 ring-brand-primary scale-105 shadow-lg' : ''}
              ${isClickable ? 'hover:scale-105 hover:shadow-md cursor-pointer' : ''}
              ${!isDark ? 'bg-white shadow-md' : 'bg-slate-800 shadow-lg'}
              ${!isClickable && !isUsed ? 'cursor-not-allowed' : ''}
            `}
          >
            <div className="text-3xl mb-2">{library.emoji}</div>
            <div className={`text-sm font-semibold ${!isDark ? 'text-slate-900' : 'text-cyan-100'}`}>
              {library.name}
            </div>
            {isUsed && highlightUsed && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-xl">
                <span className="text-4xl opacity-50">✓</span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
```

**Dependencies Check:**
- ✅ Uses existing `PromptLibrary` type
- ✅ Uses existing `useTheme` hook
- ✅ Uses new `CategoryGrid` type from utils
- ✅ Uses new `isCategoryAvailable` function

**Testing:**
- Component should render without errors
- Click handlers should work when `canSelect={true}`
- Used categories should show checkmark
- Selected category should have ring highlight

#### 3.2 Export Component

**File:** `src/shared/components/index.ts`

**Changes:**
```typescript
// ADD this export:
export { CategoryGrid } from './CategoryGrid';
```

**Git Checkpoint:** `git commit -m "feat: add CategoryGrid component"`

---

## Phase 4: Phase Components (Host & Team)

### Goal
Create phase-specific components for category selection.

### Files to Create

#### 4.1 `src/features/host/Phases/CategorySelectPhase.tsx` (NEW FILE)

**Full Implementation:**
```typescript
import { Card, Timer } from "@social/ui";
import { CategoryGrid } from "../../../shared/components/CategoryGrid";
import { usePromptLibraries } from "../../../shared/hooks";
import type { Session, Team, RoundGroup } from "../../../shared/types";
import { useTheme } from "../../../shared/providers/ThemeProvider";
import { getRemainingCategories } from "../../../shared/utils/categoryGrid";

interface CategorySelectPhaseProps {
  session: Session;
  roundGroups: RoundGroup[];
  teams: Team[];
  sessionEndsAt?: string;
  categorySelectSecs: number;
  sessionPaused?: boolean;
}

export function CategorySelectPhase({
  session,
  roundGroups,
  teams,
  sessionEndsAt,
  categorySelectSecs,
  sessionPaused,
}: CategorySelectPhaseProps) {
  const { isDark } = useTheme();
  const { data: libraries } = usePromptLibraries();

  if (!libraries || !session.categoryGrid) {
    return (
      <Card isDark={isDark}>
        <p className={`text-center ${!isDark ? 'text-slate-600' : 'text-cyan-300'}`}>
          Loading category grid...
        </p>
      </Card>
    );
  }

  const remainingCategories = getRemainingCategories(session.categoryGrid);
  const selectedCount = roundGroups.filter(g => g.promptLibraryId).length;
  const totalGroups = roundGroups.length;

  return (
    <Card isDark={isDark}>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className={`text-2xl font-bold ${!isDark ? 'text-slate-900' : 'text-pink-400'}`}>
            Category Selection
          </h2>
          <p className={`text-sm ${!isDark ? 'text-slate-600' : 'text-cyan-300'}`}>
            Teams are choosing categories for Round {session.roundIndex + 1}
          </p>
          <p className={`text-xs mt-1 ${!isDark ? 'text-slate-500' : 'text-cyan-400'}`}>
            {selectedCount} of {totalGroups} groups selected • {remainingCategories} categories remaining
          </p>
        </div>

        {/* Timer */}
        {sessionEndsAt && !sessionPaused && (
          <Timer
            endsAt={sessionEndsAt}
            totalSeconds={categorySelectSecs}
            label="Selection time"
          />
        )}

        {/* Group Status */}
        <div className="space-y-3">
          {roundGroups.map((group, index) => {
            const selectingTeam = teams.find(t => t.id === group.selectingTeamId);
            const groupTeams = teams.filter(t => group.teamIds.includes(t.id));
            const selectedLibrary = libraries.find(l => l.id === group.promptLibraryId);

            return (
              <div
                key={group.id}
                className={`rounded-xl p-4 ${!isDark ? 'bg-slate-50' : 'bg-slate-800'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-semibold ${!isDark ? 'text-slate-900' : 'text-cyan-100'}`}>
                    Group {index + 1}
                  </span>
                  {selectingTeam && !selectedLibrary && (
                    <span className={`text-sm ${!isDark ? 'text-slate-600' : 'text-cyan-300'}`}>
                      🎯 {selectingTeam.teamName} is choosing...
                    </span>
                  )}
                  {selectedLibrary && (
                    <span className="text-sm font-semibold text-brand-primary">
                      ✓ {selectedLibrary.emoji} {selectedLibrary.name}
                    </span>
                  )}
                </div>
                <div className={`text-xs ${!isDark ? 'text-slate-500' : 'text-cyan-400'}`}>
                  Teams: {groupTeams.map(t => t.teamName).join(", ")}
                </div>
              </div>
            );
          })}
        </div>

        {/* Category Grid */}
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${!isDark ? 'text-slate-500' : 'text-cyan-400'}`}>
            Available Categories
          </p>
          <CategoryGrid
            libraries={libraries}
            categoryGrid={session.categoryGrid}
            disabled={true}
            canSelect={false}
            highlightUsed={true}
          />
        </div>
      </div>
    </Card>
  );
}
```

#### 4.2 `src/features/team/Phases/CategorySelectPhase.tsx` (NEW FILE)

**Full Implementation:**
```typescript
import { Card, Timer } from "@social/ui";
import { CategoryGrid } from "../../../shared/components/CategoryGrid";
import { usePromptLibraries } from "../../../shared/hooks";
import type { Session, Team, RoundGroup } from "../../../shared/types";
import { useTheme } from "../../../shared/providers/ThemeProvider";
import { isSelectingTeam } from "../../../shared/utils/teamSelection";

interface CategorySelectPhaseProps {
  session: Session;
  currentTeam: Team | null;
  myGroup: RoundGroup | null;
  onSelectCategory: (categoryId: string) => void;
  isSubmitting: boolean;
}

export function CategorySelectPhase({
  session,
  currentTeam,
  myGroup,
  onSelectCategory,
  isSubmitting,
}: CategorySelectPhaseProps) {
  const { isDark } = useTheme();
  const { data: libraries } = usePromptLibraries();

  if (!libraries || !session.categoryGrid || !currentTeam || !myGroup) {
    return (
      <Card isDark={isDark}>
        <p className={`text-center ${!isDark ? 'text-slate-600' : 'text-cyan-300'}`}>
          Loading...
        </p>
      </Card>
    );
  }

  const isMyTurnToSelect = isSelectingTeam(currentTeam.id, myGroup.selectingTeamId);
  const hasSelected = !!myGroup.promptLibraryId;
  const selectedLibrary = libraries.find(l => l.id === myGroup.promptLibraryId);

  return (
    <Card isDark={isDark}>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className={`text-2xl font-bold ${!isDark ? 'text-slate-900' : 'text-pink-400'}`}>
            {isMyTurnToSelect && !hasSelected ? "🎯 Choose a Category!" : "Category Selection"}
          </h2>
          <p className={`text-sm ${!isDark ? 'text-slate-600' : 'text-cyan-300'}`}>
            Round {session.roundIndex + 1}
          </p>
          {session.endsAt && (
            <div className="mt-3">
              <Timer
                endsAt={session.endsAt}
                totalSeconds={session.settings.categorySelectSecs ?? 15}
                label="Time remaining"
              />
            </div>
          )}
        </div>

        {/* Selection State */}
        {isMyTurnToSelect && !hasSelected ? (
          <div className="space-y-4">
            <p className={`text-center ${!isDark ? 'text-slate-600' : 'text-cyan-300'}`}>
              Pick a category for your group to answer!
            </p>
            <CategoryGrid
              libraries={libraries}
              categoryGrid={session.categoryGrid}
              selectedCategory={myGroup.promptLibraryId}
              onSelect={onSelectCategory}
              disabled={isSubmitting}
              canSelect={true}
              highlightUsed={true}
            />
            {isSubmitting && (
              <p className="text-center text-sm text-brand-primary">
                Submitting selection...
              </p>
            )}
          </div>
        ) : hasSelected ? (
          <div className={`text-center rounded-xl p-6 ${!isDark ? 'bg-brand-light' : 'bg-cyan-900/30'}`}>
            <p className="text-lg font-semibold text-brand-primary mb-2">
              ✓ Category Selected!
            </p>
            <div className="text-4xl mb-2">{selectedLibrary?.emoji}</div>
            <p className={`text-lg font-bold ${!isDark ? 'text-slate-900' : 'text-cyan-100'}`}>
              {selectedLibrary?.name}
            </p>
            <p className={`text-sm mt-2 ${!isDark ? 'text-slate-600' : 'text-cyan-300'}`}>
              Get ready to answer!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className={`text-center ${!isDark ? 'text-slate-600' : 'text-cyan-300'}`}>
              Another team in your group is choosing...
            </p>
            <CategoryGrid
              libraries={libraries}
              categoryGrid={session.categoryGrid}
              disabled={true}
              canSelect={false}
              highlightUsed={true}
            />
          </div>
        )}
      </div>
    </Card>
  );
}
```

#### 4.3 Export Phase Components

**File:** `src/features/host/Phases/index.ts`

**Changes:**
```typescript
// ADD this export:
export { CategorySelectPhase } from './CategorySelectPhase';
```

**File:** `src/features/team/Phases/index.ts` (create if doesn't exist)

**Changes:**
```typescript
// ADD this export:
export { CategorySelectPhase } from './CategorySelectPhase';
```

**Git Checkpoint:** `git commit -m "feat: add category selection phase components"`

---

## Phase 5: Constants & Labels

### Goal
Update all phase-related constants to include category-select.

### Files to Modify

#### 5.1 `src/shared/constants.ts`

**Location:** Find `phaseCopy` object

**Changes:**
```typescript
export const phaseCopy: Record<SessionStatus, string> = {
  lobby: "Waiting for teams to join...",
  "category-select": "Teams are selecting categories...",  // ADD
  answer: "Teams are writing their answers...",
  vote: "Teams are voting on answers...",
  results: "Showing round results...",
  ended: "Game complete!",
};
```

**Location:** Find `actionLabel` object

**Changes:**
```typescript
export const actionLabel: Record<SessionStatus, string> = {
  lobby: "Start game",
  "category-select": "Skip to answers",  // ADD
  answer: "End answering",
  vote: "Next group",
  results: "Next round",
  ended: "View results",
};
```

**Location:** Find `statusHeadline` object

**Changes:**
```typescript
export const statusHeadline: Record<SessionStatus, string> = {
  lobby: "Lobby",
  "category-select": "Category Selection",  // ADD
  answer: "Answer Time",
  vote: "Voting Time",
  results: "Round Results",
  ended: "Game Over",
};
```

**Git Checkpoint:** `git commit -m "feat: add category-select to constants"`

---

## Phase 6: Integration Points

### Goal
Wire up the new phase into existing host and team pages.

### Files to Modify

#### 6.1 `src/features/host/HostPage.tsx`

**Location:** Line ~353 (inside `renderPhaseContent` switch statement)

**Changes:**
```typescript
// ADD this case after "lobby":
case "category-select":
  return (
    <CategorySelectPhase
      session={session}
      roundGroups={roundGroups}
      teams={teams}
      sessionEndsAt={session.endsAt}
      categorySelectSecs={session.settings.categorySelectSecs ?? 15}
      sessionPaused={session.paused}
    />
  );
```

**Location:** Top of file (imports section)

**Changes:**
```typescript
// ADD to existing import from "./Phases":
import {
  LobbyPhase,
  AnswerPhase,
  VotePhase,
  ResultsPhase,
  EndedPhase,
  CreateSessionModal,
  CategorySelectPhase,  // ADD
} from "./Phases";
```

#### 6.2 `src/features/team/hooks/useTeamPhaseRenderer.tsx`

**Location:** Inside the `useMemo` that returns phase content

**Changes:**
```typescript
// ADD this condition before the switch statement or as first case:
if (session.status === "category-select") {
  return (
    <CategorySelectPhase
      session={session}
      currentTeam={currentTeam}
      myGroup={myGroup}
      onSelectCategory={handleSelectCategory}
      isSubmitting={isSubmittingCategorySelection}
    />
  );
}
```

**Location:** Top of file (imports)

**Changes:**
```typescript
// ADD import:
import { CategorySelectPhase } from "../Phases/CategorySelectPhase";
```

**Location:** Props interface

**Changes:**
```typescript
// ADD these props to interface:
interface UseTeamPhaseRendererProps {
  // ... existing props
  handleSelectCategory: (categoryId: string) => void;  // ADD
  isSubmittingCategorySelection: boolean;  // ADD
}
```

#### 6.3 `src/features/team/hooks/useTeamState.ts`

**Location:** State declarations section

**Changes:**
```typescript
// ADD this state:
const [isSubmittingCategorySelection, setIsSubmittingCategorySelection] = useState(false);
```

**Location:** Return statement

**Changes:**
```typescript
// ADD to return object:
return {
  // ... existing returns
  isSubmittingCategorySelection,
  setIsSubmittingCategorySelection,
};
```

#### 6.4 `src/features/team/hooks/useTeamHandlers.ts`

**Location:** Inside the hook function

**Changes:**
```typescript
// ADD new handler:
const handleSelectCategory = useCallback(
  async (categoryId: string) => {
    if (!session || !myGroup) return;
    
    setIsSubmittingCategorySelection(true);
    try {
      await selectCategory({
        sessionId: session.id,
        groupId: myGroup.id,
        categoryId,
      });
      
      toast({
        title: "Category selected!",
        variant: "success",
      });
    } catch (error) {
      console.error("Category selection error:", error);
      toast({
        title: "Failed to select category",
        variant: "error",
      });
    } finally {
      setIsSubmittingCategorySelection(false);
    }
  },
  [session, myGroup, toast, setIsSubmittingCategorySelection]
);
```

**Location:** Top of file (imports)

**Changes:**
```typescript
// ADD import:
import { selectCategory } from "../../session/sessionService";
```

**Location:** Props interface

**Changes:**
```typescript
// ADD to interface:
interface UseTeamHandlersProps {
  // ... existing props
  setIsSubmittingCategorySelection: (submitting: boolean) => void;  // ADD
}
```

**Location:** Return statement

**Changes:**
```typescript
// ADD to return object:
return {
  // ... existing returns
  handleSelectCategory,
};
```

#### 6.5 `src/features/team/TeamPage.tsx`

**Location:** Where `useTeamHandlers` is called

**Changes:**
```typescript
// ADD to destructured returns:
const {
  // ... existing
  handleSelectCategory,
} = useTeamHandlers({
  // ... existing props
  setIsSubmittingCategorySelection,
});
```

**Location:** Where `useTeamPhaseRenderer` is called

**Changes:**
```typescript
// ADD to props:
const renderGameContent = useTeamPhaseRenderer({
  // ... existing props
  handleSelectCategory,
  isSubmittingCategorySelection,
});
```

#### 6.6 `src/features/session/sessionService.ts`

**Location:** End of file (add new function)

**Changes:**
```typescript
// ADD new service function:
export const selectCategory = async (
  payload: CategorySelectionRequest
): Promise<CategorySelectionResponse> => {
  const { data, error } = await supabase.functions.invoke<CategorySelectionResponse>(
    "sessions-select-category",
    { body: payload }
  );

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("No data returned from category selection");
  }

  return data;
};
```

**Location:** Top of file (imports)

**Changes:**
```typescript
// ADD to type imports:
import type {
  // ... existing imports
  CategorySelectionRequest,
  CategorySelectionResponse,
} from "../../shared/types";
```

**Git Checkpoint:** `git commit -m "feat: integrate category selection phase into host and team flows"`

---

## Phase 7: Create Session Modal Updates

### Goal
Add game mode toggle to session creation.

### Files to Modify

#### 7.1 `src/features/host/Phases/CreateSessionModal.tsx`

**Location:** Find the form state interface or where `createForm` is defined

**Changes:**
```typescript
// ADD gameMode to form:
interface CreateForm {
  teamName: string;
  venueName: string;
  gameMode: "classic" | "jeopardy";  // ADD with default
}

// In the component, initialize with default:
const [createForm, setCreateForm] = useState({
  teamName: "",
  venueName: "",
  gameMode: "classic" as const,  // ADD
});
```

**Location:** Inside the modal form (before submit button)

**Changes:**
```typescript
// ADD game mode selector:
<div className="space-y-2">
  <label className={`text-sm font-semibold ${!isDark ? 'text-slate-700' : 'text-cyan-100'}`}>
    Game Mode
  </label>
  <div className="grid grid-cols-2 gap-3">
    <button
      type="button"
      onClick={() => setCreateForm({ ...createForm, gameMode: "classic" })}
      className={`
        p-4 rounded-xl border-2 text-left transition-all
        ${createForm.gameMode === "classic"
          ? "border-brand-primary bg-brand-light"
          : !isDark ? "border-slate-300 bg-white" : "border-slate-600 bg-slate-800"
        }
      `}
    >
      <div className={`font-semibold mb-1 ${!isDark ? 'text-slate-900' : 'text-cyan-100'}`}>
        Classic
      </div>
      <div className={`text-xs ${!isDark ? 'text-slate-600' : 'text-cyan-300'}`}>
        Traditional gameplay with one prompt library
      </div>
    </button>
    <button
      type="button"
      onClick={() => setCreateForm({ ...createForm, gameMode: "jeopardy" })}
      className={`
        p-4 rounded-xl border-2 text-left transition-all
        ${createForm.gameMode === "jeopardy"
          ? "border-brand-primary bg-brand-light"
          : !isDark ? "border-slate-300 bg-white" : "border-slate-600 bg-slate-800"
        }
      `}
    >
      <div className={`font-semibold mb-1 ${!isDark ? 'text-slate-900' : 'text-cyan-100'}`}>
        Jeopardy
      </div>
      <div className={`text-xs ${!isDark ? 'text-slate-600' : 'text-cyan-300'}`}>
        Teams select categories each round
      </div>
    </button>
  </div>
</div>
```

**Git Checkpoint:** `git commit -m "feat: add game mode selector to create session modal"`

---

## Phase 8: Backend Edge Functions

### Goal
Create backend logic for category selection and modify session creation.

### Files to Create/Modify

#### 8.1 Create Category Selection Function

**File:** `supabase/functions/sessions-select-category/index.ts` (NEW)

**Full Implementation:**
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { sessionId, groupId, categoryId } = await req.json();

    // Validate inputs
    if (!sessionId || !groupId || !categoryId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get current session
    const { data: session, error: fetchError } = await supabaseClient
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (fetchError || !session) {
      return new Response(
        JSON.stringify({ error: "Session not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate session is in category-select phase
    if (session.status !== "category-select") {
      return new Response(
        JSON.stringify({ error: "Session is not in category selection phase" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate category is available
    const categoryGrid = session.category_grid;
    if (!categoryGrid || !categoryGrid.available.includes(categoryId)) {
      return new Response(
        JSON.stringify({ error: "Category not available" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update category grid
    const updatedGrid = {
      ...categoryGrid,
      available: categoryGrid.available.filter((id: string) => id !== categoryId),
      used: [...categoryGrid.used, categoryId],
    };

    // Update round group with selected category
    const currentRoundIndex = session.round_index ?? 0;
    const rounds = session.rounds || [];
    const updatedRounds = rounds.map((round: any, idx: number) => {
      if (idx !== currentRoundIndex) return round;
      
      return {
        ...round,
        groups: round.groups.map((group: any) =>
          group.id === groupId
            ? { ...group, promptLibraryId: categoryId }
            : group
        ),
      };
    });

    // Update session
    const { data: updatedSession, error: updateError } = await supabaseClient
      .from("sessions")
      .update({
        category_grid: updatedGrid,
        rounds: updatedRounds,
      })
      .eq("id", sessionId)
      .select()
      .single();

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update session" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ session: updatedSession }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

#### 8.2 Modify Session Creation Function

**File:** `supabase/functions/sessions-create/index.ts`

**Location:** Where session is created (look for `.insert()` call)

**Changes:**
```typescript
// ADD gameMode extraction from request:
const { teamName, venueName, promptLibraryId, gameMode = "classic" } = await req.json();

// ADD category grid initialization for jeopardy mode:
let categoryGrid = null;
if (gameMode === "jeopardy") {
  // Get all available library IDs
  const allLibraryIds = [
    "classic", "bar", "basic", "halloween", "selfie", "victoria",
    "dangerfield", "medieval", "anime", "politics", "scifi",
    "pop-culture", "cinema", "canucks", "bc", "tech",
    "internet-culture", "dating-app", "remote-work", "adulting",
    "group-chat", "streaming", "climate-anxiety", "fictional-worlds"
  ];
  
  categoryGrid = {
    available: allLibraryIds,
    used: [],
    totalSlots: 40, // 10 rounds × 4 groups
  };
}

// MODIFY settings to include gameMode:
const settings = {
  answerSecs: 90,
  voteSecs: 90,
  resultsSecs: 12,
  maxTeams: 24,
  gameMode,  // ADD
  categorySelectSecs: 15,  // ADD
};

// MODIFY insert to include category_grid:
const { data: session, error: insertError } = await supabaseClient
  .from("sessions")
  .insert({
    // ... existing fields
    settings,
    category_grid: categoryGrid,  // ADD
  })
  .select()
  .single();
```

#### 8.3 Modify Advance Phase Function

**File:** `supabase/functions/sessions-advance/index.ts`

**Location:** Where phase transitions are handled

**Changes:**
```typescript
// ADD handling for category-select phase:
if (session.status === "category-select") {
  const currentRound = session.rounds[session.round_index];
  
  // Check if all groups have selected categories
  const allSelected = currentRound.groups.every((g: any) => g.promptLibraryId);
  
  // Auto-select for groups that didn't choose
  if (!allSelected) {
    const updatedGroups = currentRound.groups.map((group: any) => {
      if (!group.promptLibraryId && session.category_grid.available.length > 0) {
        // Pick first available category
        const randomCategory = session.category_grid.available[0];
        // Update category grid
        session.category_grid.available = session.category_grid.available.filter(
          (id: string) => id !== randomCategory
        );
        session.category_grid.used.push(randomCategory);
        return { ...group, promptLibraryId: randomCategory };
      }
      return group;
    });
    
    currentRound.groups = updatedGroups;
  }
  
  // Generate prompts for each group based on their selected category
  // (This requires fetching prompt libraries - implement based on your setup)
  const groupsWithPrompts = await Promise.all(
    currentRound.groups.map(async (group: any) => {
      // Fetch prompts for this library
      // For now, use placeholder - you'll need to implement prompt fetching
      const prompt = `Prompt from ${group.promptLibraryId}`;
      return { ...group, prompt };
    })
  );
  
  // Update to answer phase
  const { error: updateError } = await supabaseClient
    .from("sessions")
    .update({
      status: "answer",
      rounds: session.rounds.map((r: any, i: number) =>
        i === session.round_index
          ? { ...r, groups: groupsWithPrompts }
          : r
      ),
      category_grid: session.category_grid,
      ends_at: new Date(Date.now() + session.settings.answerSecs * 1000).toISOString(),
    })
    .eq("id", sessionId);
    
  if (updateError) throw updateError;
  
  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// MODIFY results -> next round logic:
if (session.status === "results") {
  const nextRoundIndex = session.round_index + 1;
  const isJeopardyMode = session.settings?.gameMode === "jeopardy";
  
  // Determine next status
  let nextStatus = "answer";
  if (isJeopardyMode) {
    nextStatus = "category-select";
  }
  
  // Generate next round
  // ... existing round generation logic
  // For jeopardy mode, include selectingTeamId for each group
  
  // Update session
  // ... existing update logic with nextStatus
}
```

**Git Checkpoint:** `git commit -m "feat: add backend edge functions for jeopardy mode"`

---

## Phase 9: Database Migration

### Goal
Add database columns for jeopardy mode support.

### Files to Create

#### 9.1 Create Migration File

**File:** `supabase/migrations/YYYYMMDD_add_jeopardy_mode.sql` (NEW)

**Full Implementation:**
```sql
-- Add category_grid column to sessions table
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS category_grid JSONB DEFAULT NULL;

-- Add index for performance on category_grid queries
CREATE INDEX IF NOT EXISTS idx_sessions_category_grid 
ON sessions USING GIN (category_grid);

-- Add comment for documentation
COMMENT ON COLUMN sessions.category_grid IS 
'Jeopardy mode: tracks available and used categories. Structure: {available: string[], used: string[], totalSlots: number}';

-- Note: gameMode and categorySelectSecs are stored in settings JSONB column
-- Note: promptLibraryId and selectingTeamId are stored in rounds JSONB column
-- No additional schema changes needed for those fields
```

**Apply Migration:**
```bash
# Run migration
supabase db push

# Or if using migration files:
supabase migration up
```

**Git Checkpoint:** `git commit -m "feat: add database migration for jeopardy mode"`

---

## Phase 10: Testing & Validation

### Goal
Systematically test both game modes.

### Testing Checklist

#### Classic Mode (Regression Testing)
```
□ Create session with classic mode
□ Verify no category-select phase appears
□ Lobby → Answer → Vote → Results flow works
□ Multiple rounds work correctly
□ Prompt library selection in lobby works
□ All prompts come from selected library
□ Pause/resume works
□ End session works
□ Team kick works
```

#### Jeopardy Mode (New Feature Testing)
```
□ Create session with jeopardy mode
□ Verify category grid initializes
□ Lobby → Category-Select → Answer → Vote → Results flow works
□ Category grid displays correctly for host
□ Category grid displays correctly for teams
□ Random team selection per group works
□ Selected team sees "Choose a Category" UI
□ Non-selected teams see "Waiting" UI
□ Category selection saves correctly
□ Selected categories grey out
□ Multiple groups can select simultaneously
□ Timer auto-advances after expiration
□ Prompts generated from correct library per group
□ Answer phase works with different prompts per group
□ Vote phase works normally
□ Results phase works normally
□ Next round returns to category-select
□ Category grid depletes over rounds
□ Game handles running out of categories
□ Pause/resume works during category-select
□ Host can manually advance during category-select
```

#### Edge Cases
```
□ Selecting team disconnects during selection
□ Timer expires with no selections made
□ All categories used up
□ Single team in group (still works)
□ Very large number of groups (UI scales)
□ Very small number of categories (handles depletion)
□ Switch between modes in different sessions
```

### Manual Testing Script

```typescript
// Test 1: Classic Mode
// 1. Create session with classic mode
// 2. Join with 2+ teams
// 3. Start game
// 4. Verify goes to Answer phase (not category-select)
// 5. Complete full round
// 6. Verify next round goes to Answer again

// Test 2: Jeopardy Mode
// 1. Create session with jeopardy mode
// 2. Join with 4+ teams (to create multiple groups)
// 3. Start game
// 4. Verify goes to Category-Select phase
// 5. Check that random teams are highlighted
// 6. Select categories as highlighted teams
// 7. Verify categories grey out
// 8. Wait for timer or advance manually
// 9. Verify Answer phase has different prompts per group
// 10. Complete voting
// 11. Verify next round returns to Category-Select
// 12. Verify previously used categories stay greyed out
```

**Git Checkpoint:** `git commit -m "test: validate jeopardy mode implementation"`

---

## Rollback Plan

If issues arise, rollback in reverse order:

```bash
# Rollback to before jeopardy mode
git revert HEAD~N  # Where N is number of commits since start

# Or reset to specific commit
git reset --hard <commit-hash-before-jeopardy>

# Rollback database migration
supabase migration down
```

---

## Performance Considerations

### Potential Bottlenecks
1. **Category Grid Updates**: Real-time updates when categories selected
   - Solution: Optimistic UI updates
   
2. **Prompt Generation**: Fetching prompts from multiple libraries
   - Solution: Cache prompt libraries in memory
   
3. **Large Category Grids**: Many libraries to display
   - Solution: Virtualized grid for 50+ categories

### Optimization Opportunities
- Lazy load prompt libraries
- Debounce category selection clicks
- Preload next round's prompts during voting

---

## Future Enhancements

### Phase 11+ (Optional)
- Daily Double mechanic (random high-value questions)
- Point wagering system
- Final Jeopardy round
- Category preview on hover
- Category difficulty indicators
- Team statistics per category
- Custom category creation
- Tournament bracket mode

---

## Success Criteria

✅ **Implementation Complete When:**
1. Both game modes work without errors
2. No regression in classic mode
3. All phase transitions work correctly
4. Real-time sync works for category selection
5. UI is responsive and intuitive
6. Edge cases handled gracefully
7. Code is type-safe (no TypeScript errors)
8. Git history is clean with logical commits

---

## Notes for AI Implementation

### Context Window Management
- Implement one phase at a time
- Commit after each phase
- Reference this document for file paths
- Use exact line numbers when possible
- Test incrementally

### Common Pitfalls to Avoid
- Don't modify existing phase logic unnecessarily
- Keep classic mode completely unchanged
- Ensure all new fields are optional for backwards compatibility
- Don't forget to export new components
- Always handle loading/error states

### When to Ask for Help
- If existing code structure differs significantly from assumptions
- If TypeScript errors can't be resolved
- If real-time sync isn't working as expected
- If testing reveals fundamental design issues

---

## Implementation Checklist

- [ ] Phase 1: Types & Constants
- [ ] Phase 2: Utilities
- [ ] Phase 3: UI Components
- [ ] Phase 4: Phase Components
- [ ] Phase 5: Constants & Labels
- [ ] Phase 6: Integration Points
- [ ] Phase 7: Create Session Modal
- [ ] Phase 8: Backend Functions
- [ ] Phase 9: Database Migration
- [ ] Phase 10: Testing & Validation

**Estimated Total Time:** 2-3 days (with testing)
**Estimated Lines of Code:** ~1500 new, ~200 modified
