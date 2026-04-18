# Phase 3 Implementation Progress & Handoff

**Date:** April 15, 2026, 6:30pm
**Status:** Steps 1-2 of 13 complete (15% done)
**Commits:** 2 commits on `kris-branch`

---

## ✅ Completed Work

### Step 1: useHostModalState Hook
- **File Created:** `hooks/useHostModalState.ts` (87 lines)
- **Files Modified:** `hooks/index.ts`, `HostPage.tsx`
- **Lines Removed:** ~18 scattered useState calls
- **Commit:** `e558c9c` - "Phase 3 Step 1: Extract useHostModalState hook"

### Step 2: HostAccountMenu Component
- **File Created:** `components/HostAccountMenu.tsx` (243 lines)
- **Files Modified:** `HostPage.tsx`
- **Lines Removed:** ~251 lines (duplicate account button + handlers)
- **Commit:** `c536934` - "Phase 3 Step 2: Extract HostAccountMenu component"

**Current HostPage.tsx:** ~1,888 lines (down from 2,122 original)

---

## 🚧 Remaining Work (Steps 3-13)

### Step 3: Extract HostPromptLibraryCard Component (NEXT)

**Create:** `components/HostPromptLibraryCard.tsx`
**Lines to extract from HostPage:** ~910-981 (72 lines)

**Props interface:**
```typescript
interface HostPromptLibraryCardProps {
  session: Session;
  currentPromptLibrary: PromptLibrary | null;
  selectedPromptLibraryId: PromptLibraryId;
  isUpdatingPromptLibrary: boolean;
  isDark: boolean;
  onChangePrompts: () => void;    // () => setShowPromptLibraryModal(true)
  onEditLibraries: () => void;     // handleOpenEditModal
}
```

**Implementation:**
1. Read lines 910-981 from HostPage.tsx (the `promptLibraryCard` variable)
2. Extract JSX into new component
3. Replace inline variable with component usage
4. Verify TypeScript compiles

---

### Step 4: Extract HostControlButtons Component

**Create:** `components/HostControlButtons.tsx`
**Lines to extract:** ~983-1088 (106 lines)

**Contains 3 button sets:**
- `sessionControlButtons` (lobby/ended)
- `activePhaseSessionControls` (answer/vote/results)
- `lobbyControls` (no session/sociale)

**Props interface:**
```typescript
interface HostControlButtonsProps {
  session: Session | null;
  activeSociale: Sociale | null;
  storedRoomId: string | null;
  isPerformingAction: boolean;
  isPausingSession: boolean;
  isEndingSession: boolean;
  isUpdatingSession: boolean;
  isDark: boolean;
  onPrimaryClick: () => void;
  onPauseToggle: () => void;
  onEndSession: () => void;
  onCreateNewSession: () => void;
  onOpenEditModal: () => void;
  onJoinModal: () => void;
  onLeaveSession: () => void;
  onOpenSocialeModal: () => void;
  onJoinSocialeModal: () => void;
}
```

**Commit after Steps 3-4:** "Phase 3 Steps 3-4: Extract HostPromptLibraryCard, HostControlButtons"

---

### Step 5: Extract HostSidePanel Component

**Create:** `components/HostSidePanel.tsx`
**Lines to extract:** ~1669-1815 (147 lines)

**Contains:**
- QR code block + shareable link
- Room Members list (collapsible with kick/ban)
- Audience Questions panel

**Large props interface** - see PHASE_3_IMPLEMENTATION_PLAN.md for full details

---

### Step 6: Extract HostHeaderCard Component

**Create:** `components/HostHeaderCard.tsx`
**Lines to extract:** ~1588-1643 (56 lines)

**Contains:**
- Room name / "Host Console" title
- Phase status copy
- Navigation buttons (Presenter View, Analytics, Room Settings, Vibox)

---

### Step 7: Extract HostVenueLoginPrompt Component

**Create:** `components/HostVenueLoginPrompt.tsx`
**Lines to extract:** ~1645-1662 (18 lines)

**Simple conditional card** - "Venue login required"

**Commit after Steps 5-7:** "Phase 3 Steps 5-7: Extract HostSidePanel, HostHeaderCard, HostVenueLoginPrompt"

---

### Step 8: Extract HostModalsContainer Component

**Create:** `components/HostModalsContainer.tsx`
**Lines to extract:** ~1819-2024 (206 lines)

**Contains ALL 12 modals:**
1. CreateRoomModal
2. SocialeCreateModal
3. CreateSessionModal (create mode)
4. CreateSessionModal (edit mode)
5. JoinSessionModal
6. JoinSocialeModal
7. PromptLibraryModal
8. EndSessionModal
9. BannedPlayersManager
10. VIBoxJukebox
11. VenueAuthPromptModal
12. PlayerAuthModal + VenueAuthModal
13. VenueRoomChecker

**Large props interface** - consolidates all modal state + handlers

**Commit after Step 8:** "Phase 3 Step 8: Extract HostModalsContainer with all 12 modals"

---

### Step 9: Extract HostPhaseContent Component

**Create:** `components/HostPhaseContent.tsx`
**Lines to extract:** ~1092-1311 (220 lines)

**Contains:**
- `renderSocialesPanel` helper
- `renderHostInteractionsPanel` helper
- `renderHostMainStack` helper
- `renderPhaseContent` - THE BIG SWITCH (186 lines)

**This is the core layout logic** - switches between:
- Loading state
- No session state
- Lobby phase
- Answer phase
- Vote phase
- Results phase
- Ended phase

**Commit after Step 9:** "Phase 3 Step 9: Extract HostPhaseContent with phase switch"

---

### Step 10: Extract useHostBootstrap Hook

**Create:** `hooks/useHostBootstrap.ts`
**Lines to extract:** ~60-68, ~93-120, ~172-188, ~244-269, ~427-486

**Consolidates:**
- Auth + venue account resolution
- useHostSessionV2/useHostRoomV2 destructuring
- Room recovery
- Bootstrap completion logic
- All sync effects (6 useEffect calls)

**Estimated size:** ~120 lines

---

### Step 11: Extract useHostGameData Hook

**Create:** `hooks/useHostGameData.ts`
**Lines to extract:** ~192-360, ~494-546

**Consolidates:**
- useSessionOrchestrator
- useGameState
- useRoomV2
- All Sociale queries
- useSessionPlayers, useSocialites
- useAudienceSubmissions
- All useMemo computed values
- useHostComputations
- usePlayerLookup
- transformRoundSummariesForUI

**Estimated size:** ~180 lines

---

### Step 12: Extract useHostHandlers Hook

**Create:** `hooks/useHostHandlers.ts`
**Lines to extract:** ~361-908 (548 lines!)

**Consolidates:**
- requireVenueAccount
- handleRoomCreateSuccess
- All modal open handlers
- All 10 handler factory calls
- handlePauseToggle, handleLeaveSession, handlePromptLibrarySelect
- handlePrimaryClick, handleOpenEditModal, handleCreateModalClose
- handleJoinSession, handleJoinSociale
- Keyboard shortcuts setup

**Estimated size:** ~350 lines

**Commit after Steps 10-12:** "Phase 3 Steps 10-12: Extract useHostBootstrap, useHostGameData, useHostHandlers"

---

### Step 13: Final HostPage Cleanup

**Target:** ~150-200 lines

**Final structure:**
```typescript
export function HostPage() {
  // Core dependencies (5 lines)
  const { toast } = useToast();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State hooks (3 lines)
  const modalState = useHostModalState();
  const hostState = useHostState(/* ... */);

  // Bootstrap (1 line)
  const bootstrap = useHostBootstrap(modalState, hostState);

  // Game data (1 line)
  const gameData = useHostGameData(bootstrap, hostState, modalState);

  // Handlers (1 line)
  const handlers = useHostHandlers({ bootstrap, gameData, hostState, modalState, toast, navigate, queryClient, isDark });

  // Session machine + command palette (3 lines)
  const sessionMachine = useSessionMachine(gameData.session, gameData.roomMemberships.length);
  const commandPalette = useCommandPalette();
  const commands = useMemo(() => [...], [/* deps */]);

  // Return JSX (~30 lines)
  return (
    <>
      <HostPanelV2 {...panelProps}>
        <HostAccountMenu {...accountMenuProps} />
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
          <HostHeaderCard {...headerProps} />
          <HostVenueLoginPrompt {...loginPromptProps} />
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,_2fr)_minmax(0,_1fr)]">
            <HostPhaseContent {...phaseContentProps} />
            <HostSidePanel {...sidePanelProps} />
          </section>
        </div>
        <HostModalsContainer {...modalProps} />
      </HostPanelV2>
      <CommandPalette {...commandPaletteProps} />
    </>
  );
}
```

**Commit after Step 13:** "Phase 3 COMPLETE: HostPage decomposition (2122 → ~200 lines)"

---

## Validation Checklist (After Each Step)

```powershell
# TypeScript compile
pnpm --filter top-comment exec tsc --noEmit

# Visual check
pnpm --filter top-comment dev
# Navigate to /host
# Verify no runtime errors
# Check visual parity
# Test modals, buttons, realtime updates
```

---

## Files Created (When Complete)

```
NEW FILES (12 total):
  hooks/useHostModalState.ts       ✅ DONE (87 lines)
  hooks/useHostBootstrap.ts        ⏳ TODO (~120 lines)
  hooks/useHostGameData.ts         ⏳ TODO (~180 lines)
  hooks/useHostHandlers.ts         ⏳ TODO (~350 lines)
  components/HostAccountMenu.tsx   ✅ DONE (243 lines)
  components/HostHeaderCard.tsx    ⏳ TODO (~70 lines)
  components/HostVenueLoginPrompt.tsx  ⏳ TODO (~30 lines)
  components/HostPhaseContent.tsx  ⏳ TODO (~200 lines)
  components/HostSidePanel.tsx     ⏳ TODO (~130 lines)
  components/HostModalsContainer.tsx   ⏳ TODO (~220 lines)
  components/HostControlButtons.tsx    ⏳ TODO (~120 lines)
  components/HostPromptLibraryCard.tsx ⏳ TODO (~80 lines)

MODIFIED FILES:
  HostPage.tsx                     (2122 → ~1888 → target ~200 lines)
  hooks/index.ts                   (add new hook exports)
```

---

## Important Notes for Continuation

1. **Line numbers shift** after each extraction - always verify current line numbers before editing
2. **TypeScript must compile** after each step before proceeding
3. **Preserve all functionality** - this is a refactor, not a rewrite
4. **No new dependencies** - only reorganize existing code
5. **Keep existing comments** - move them with the code
6. **pnpm only** - never npm or yarn
7. **PowerShell** - never use `&&` for command chaining

---

## Next Actions

**For Claude Sonnet (or continuation):**

1. Start with Step 3 (HostPromptLibraryCard) - simplest remaining component
2. Work through Steps 3-9 (component extractions) first
3. Then tackle Steps 10-12 (large hook extractions)
4. Finally Step 13 (cleanup and wire everything together)
5. Commit at the recommended points (after 3-4, 5-7, 8, 9, 10-12, 13)

**Estimated time remaining:** 6-8 hours of focused work

---

## Reference Documents

- Full implementation plan: `PHASE_3_IMPLEMENTATION_PLAN.md`
- Detailed checkpoint: `PHASE_3_CHECKPOINT.md`
- This progress handoff: `PHASE_3_PROGRESS_HANDOFF.md`
