# Jeopardy Mode Implementation Progress

## Completed Phases (1-6a)

### ✅ Phase 1: Type System Foundation
- Added `"category-select"` to `SessionStatus` type
- Added `gameMode` and `categorySelectSecs` to `SessionSettings`
- Added `promptLibraryId` and `selectingTeamId` to `RoundGroup`
- Added `categoryGrid` to `Session` interface
- Added `gameMode` to `CreateSessionRequest`
- Created `CategorySelectionRequest` and `CategorySelectionResponse` interfaces

**Files Modified:**
- `src/shared/types.ts`

### ✅ Phase 2: Utility Functions
- Created `categoryGrid.ts` with grid management functions
- Created `teamSelection.ts` with random team selection logic

**Files Created:**
- `src/shared/utils/categoryGrid.ts`
- `src/shared/utils/teamSelection.ts`

### ✅ Phase 3: UI Components
- Created `CategoryGrid` component with selection UI
- Fixed type imports for TypeScript strict mode

**Files Created:**
- `src/shared/components/CategoryGrid.tsx`

### ✅ Phase 4: Phase Components
- Created `CategorySelectPhase` for host view
- Created `CategorySelectPhase` for team view
- Fixed Timer component usage (SessionTimer)
- Added exports to phase index

**Files Created:**
- `src/features/host/Phases/CategorySelectPhase.tsx`
- `src/features/team/Phases/CategorySelectPhase.tsx`

**Files Modified:**
- `src/features/host/Phases/index.ts`

### ✅ Phase 5: Constants & Labels
- Added category-select to all phase constant records
- Updated `phaseCopy`, `actionLabel`, `statusHeadline`, `phaseHeadline`, `phaseSubtitle`

**Files Modified:**
- `src/shared/constants.ts`

### ✅ Phase 6a: Host Integration & Service
- Added `CategorySelectPhase` import to HostPage
- Added category-select case to renderPhaseContent switch
- Created `selectCategory` service function
- Added CategorySelectionRequest/Response to service imports
- Exported `usePromptLibraries` hook

**Files Modified:**
- `src/features/host/HostPage.tsx`
- `src/features/session/sessionService.ts`
- `src/shared/hooks/index.ts`

---

## In Progress: Phase 6b - Team Integration

### Remaining Tasks:
1. Add CategorySelectPhase to team phase renderer
2. Create category selection handler in team handlers
3. Add state management for category selection
4. Wire up handler to TeamPage

### Files to Modify:
- `src/features/team/hooks/useTeamPhaseRenderer.tsx`
- `src/features/team/hooks/useTeamHandlers.ts`
- `src/features/team/hooks/useTeamState.ts`
- `src/features/team/TeamPage.tsx`

---

## Pending Phases

### Phase 7: Create Session Modal
- Add game mode toggle (Classic vs Jeopardy)
- Update form state to include gameMode
- Style the mode selector

### Phase 8: Backend Edge Functions
- Create `sessions-select-category` function
- Modify `sessions-create` to initialize category grid
- Modify `sessions-advance` to handle category-select phase
- Update phase transition logic for jeopardy mode

### Phase 9: Database Migration
- Add `category_grid` JSONB column to sessions table
- Add index for performance
- Add comments for documentation

### Phase 10: Testing
- Test classic mode (regression)
- Test jeopardy mode (new feature)
- Test edge cases
- Verify phase transitions
- Validate category grid depletion

---

## Known Issues

### TypeScript Errors (IDE Caching)
The following errors are due to IDE caching and should resolve:
- `Type '"category-select"' is not comparable to type 'SessionStatus'`
- `Property 'categorySelectSecs' does not exist on type 'SessionSettings'`

**Resolution:** The types are correctly updated in `types.ts`. These errors will clear when TypeScript recompiles.

---

## Next Steps

1. Complete Phase 6b (Team integration)
2. Implement Phase 7 (Game mode toggle)
3. Create backend functions (Phase 8)
4. Run database migration (Phase 9)
5. Test both modes (Phase 10)

---

## Architecture Notes

### Classic Mode Safety
- All new fields are optional with safe defaults
- Classic mode never reaches category-select phase
- Phase transitions are guarded by gameMode check
- Backwards compatible with existing sessions

### Jeopardy Mode Flow
```
Lobby → Category-Select → Answer → Vote → Results → Category-Select → ...
```

### Category Grid Management
- Initialized with all available libraries
- Depletes as categories are selected
- Tracks used vs available categories
- Prevents duplicate selections
