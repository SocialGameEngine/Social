# Phase 3 Implementation Checkpoint

**Date:** April 15, 2026
**Status:** Step 1 of 13 complete
**Next Step:** Step 2 - Extract HostAccountMenu component

---

## Completed Work

### ✅ Step 1: useHostModalState hook (COMPLETE)

**Files Created:**
- `hooks/useHostModalState.ts` (87 lines)

**Files Modified:**
- `hooks/index.ts` - Added export for useHostModalState
- `HostPage.tsx` - Integrated useHostModalState, removed 18 scattered useState calls

**What was extracted:**
- All modal visibility state (18 useState calls)
- Account menu state + ref
- Room modal mode state with backward-compat wrapper
- Sociale modal state
- Side panel state (isRoomMembersOpen)

**Lines removed from HostPage:** ~71-83, ~121-127, ~1341
**Lines added to HostPage:** ~70-105 (consolidated destructuring)

**Validation:** ✅ TypeScript compiles successfully

---

## Remaining Work (Steps 2-13)

### Step 2: Extract HostAccountMenu component (NEXT)

**Create:** `components/HostAccountMenu.tsx`
**Lines to remove from HostPage:** 
- ~271-309 (account button handlers + click-outside effect)
- ~1422-1586 (DUPLICATE unused version in mainContent)
- ~2054-2099 (USED version in return statement)

**Critical:** Remove the duplicate account button code. The mainContent version (lines 1422-1586) is NOT rendered. Only the version in the return statement (lines 2054-2099) is actually displayed.

**Props interface:**
```typescript
interface HostAccountMenuProps {
  user: User | null;
  isAnonymous: boolean;
  isVenueAccount: boolean;
  showAccountMenu: boolean;
  setShowAccountMenu: (show: boolean) => void;
  onPlayerSignIn: () => void;
  onVenueSignIn: () => void;
  onSignOut: () => void;
  accountMenuRef: React.RefObject<HTMLDivElement>;
}
```

**Implementation notes:**
- Move `handlePlayerSignIn`, `handleVenueSignIn`, `handleSignOut` (lines 272-295) into the component
- Move click-outside useEffect (lines 298-309) into the component
- Extract the JSX from lines 2054-2099 (the USED version)
- Delete the duplicate from lines 1422-1586

---

### Step 3: Extract HostPromptLibraryCard component

**Create:** `components/HostPromptLibraryCard.tsx`
**Lines to remove:** ~910-981 (inline `promptLibraryCard` JSX variable)

**Props interface:**
```typescript
interface HostPromptLibraryCardProps {
  session: Session;
  currentPromptLibrary: PromptLibrary | null;
  selectedPromptLibraryId: PromptLibraryId;
  isUpdatingPromptLibrary: boolean;
  isDark: boolean;
  onChangePrompts: () => void;
  onEditLibraries: () => void;
}
```

---

### Step 4: Extract HostControlButtons component

**Create:** `components/HostControlButtons.tsx`
**Lines to remove:** ~983-1088

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

**Implementation:** Component switches between 3 button sets based on session/sociale state.

---

### Step 5: Extract HostSidePanel component

**Create:** `components/HostSidePanel.tsx`
**Lines to remove:** ~1669-1815 (entire aside section)

**Contains:**
- QR code block + shareable link
- Room Members list (collapsible)
- Audience Questions panel

---

### Step 6: Extract HostHeaderCard component

**Create:** `components/HostHeaderCard.tsx`
**Lines to remove:** ~1588-1643

---

### Step 7: Extract HostVenueLoginPrompt component

**Create:** `components/HostVenueLoginPrompt.tsx`
**Lines to remove:** ~1645-1662

---

### Step 8: Extract HostModalsContainer component

**Create:** `components/HostModalsContainer.tsx`
**Lines to remove:** ~1819-2024

**Contains all 12 modals:**
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

---

### Step 9: Extract HostPhaseContent component

**Create:** `components/HostPhaseContent.tsx`
**Lines to remove:** ~1092-1311

**Contains:**
- `renderSocialesPanel`
- `renderHostInteractionsPanel`
- `renderHostMainStack`
- `renderPhaseContent` (the big switch statement)

---

### Step 10: Extract useHostBootstrap hook

**Create:** `hooks/useHostBootstrap.ts`
**Lines to remove:** ~60-68, ~93-120, ~172-188, ~244-269, ~427-486

**Consolidates:**
- Auth + venue account resolution
- useHostSessionV2/useHostRoomV2 with conditional values
- Room recovery
- Bootstrap completion
- All sync effects (sessionId, roomCode, socialeId, signout, venue load, auto-open modal, sessionRef)

---

### Step 11: Extract useHostGameData hook

**Create:** `hooks/useHostGameData.ts`
**Lines to remove:** ~192-360, ~494-546

**Consolidates:**
- useSessionOrchestrator
- useGameState
- useRoomV2
- Sociale queries
- useSessionPlayers
- useSocialites
- useAudienceSubmissions
- All useMemo computed values
- Game state extractions
- useHostComputations
- usePlayerLookup
- transformRoundSummariesForUI

---

### Step 12: Extract useHostHandlers hook

**Create:** `hooks/useHostHandlers.ts`
**Lines to remove:** ~361-908

**Consolidates all handler instantiations and callbacks:**
- requireVenueAccount
- handleRoomCreateSuccess
- All modal open handlers
- All 10 handler factory calls
- handlePauseToggle, handleLeaveSession, handlePromptLibrarySelect
- handlePrimaryClick, handleOpenEditModal, handleCreateModalClose
- handleJoinSession, handleJoinSociale
- Keyboard shortcuts setup

---

### Step 13: Final HostPage cleanup

**Target:** ~150-200 lines

**Structure:**
```typescript
export function HostPage() {
  // Core dependencies
  const { toast } = useToast();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State hooks
  const modalState = useHostModalState();
  const hostState = useHostState(/* ... */);

  // Bootstrap
  const bootstrap = useHostBootstrap(modalState, hostState);

  // Game data
  const gameData = useHostGameData(bootstrap, hostState, modalState);

  // Handlers
  const handlers = useHostHandlers({ bootstrap, gameData, hostState, modalState, toast, navigate, queryClient, isDark });

  // Session machine + command palette
  const sessionMachine = useSessionMachine(gameData.session, gameData.roomMemberships.length);
  const commandPalette = useCommandPalette();
  const commands = useMemo(() => [...], [/* deps */]);

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

---

## Validation Checklist (Run after each step)

```powershell
# TypeScript compile check
pnpm --filter top-comment exec tsc --noEmit

# Start dev server (if not running)
pnpm --filter top-comment dev

# Navigate to /host and verify:
# - No runtime errors
# - Visual parity with before
# - Modals open/close correctly
# - All buttons work
# - Realtime updates work
```

---

## Commit Points

1. ✅ **After Step 1** - "Phase 3 Step 1: Extract useHostModalState hook"
2. **After Steps 2-4** - "Phase 3 Steps 2-4: Extract HostAccountMenu, HostPromptLibraryCard, HostControlButtons"
3. **After Steps 5-7** - "Phase 3 Steps 5-7: Extract HostSidePanel, HostHeaderCard, HostVenueLoginPrompt"
4. **After Step 8** - "Phase 3 Step 8: Extract HostModalsContainer with all 12 modals"
5. **After Step 9** - "Phase 3 Step 9: Extract HostPhaseContent with phase switch"
6. **After Steps 10-12** - "Phase 3 Steps 10-12: Extract useHostBootstrap, useHostGameData, useHostHandlers"
7. **After Step 13** - "Phase 3 COMPLETE: HostPage decomposition (2122 → ~200 lines)"

---

## Important Notes

- **CRITICAL:** Step 2 must remove the DUPLICATE account button (lines 1422-1586 in mainContent). This code is never rendered.
- **Line numbers are approximate** - verify before editing as they may shift after Step 1 changes
- **Always verify TypeScript compiles** after each step before proceeding
- **Preserve all functionality** - this is a refactor, not a rewrite
- **No new dependencies** - only reorganize existing code
- **Keep existing comments** - move them with the code

---

## Current File State (After Step 1)

**HostPage.tsx:**
- Total lines: ~2,122 (unchanged from original, just reorganized)
- Modal state: Now uses `useHostModalState()` hook
- Lines 70-105: Consolidated modal state destructuring
- Lines 71-83, 121-127, 1341: Removed (now in useHostModalState)

**Next action:** Begin Step 2 - Extract HostAccountMenu component
