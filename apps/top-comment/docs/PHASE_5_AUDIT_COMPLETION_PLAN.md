# Phase 5: Refactoring Audit Completion Plan

**Date:** April 15, 2026  
**Status:** Planning  
**Prerequisites:** Phase 3 & 4 Complete ✅  
**Scope:** Complete remaining items from comprehensive refactoring audit

---

## Executive Summary

Phase 3 & 4 achieved **~70% of the audit's goals** with massive HostPage decomposition (2,158 → 1,170 lines, -45%). This plan addresses the **remaining 30%** focusing on critical bugs, code quality, and architectural improvements.

**Total Estimated Duration:** 3-4 weeks  
**Priority:** High-impact, low-risk items first

---

## Phase 5 Objectives

1. ✅ Fix critical bugs (React hooks, Supabase leaks, duplicates)
2. ✅ Improve type safety (remove `any` types)
3. ✅ Standardize error handling and patterns
4. ✅ Clean up dead code and tech debt
5. ✅ Extract shared utilities and constants
6. ✅ Improve architecture (contexts, unified patterns)

---

## Week 1: Critical Bug Fixes & Cleanup 🔴 HIGH PRIORITY

### Day 1: Critical Issue C-2 - Duplicate Handlers & Debug Logs

**Files to Check/Delete:**
```bash
# Check if these duplicates still exist:
features/host/Handlers/kickPlayerHandler.ts
features/host/Handlers/banPlayerHandler.ts

# Keep only:
features/host/Handlers/roomKickBanHandlers.ts
```

**Tasks:**
1. ✅ Verify if duplicate files exist
2. ✅ Delete `kickPlayerHandler.ts` if exists
3. ✅ Delete `banPlayerHandler.ts` if exists
4. ✅ Remove debug emoji logs from `roomKickBanHandlers.ts` (lines 64, 72, 87)
5. ✅ Verify all imports updated to use `roomKickBanHandlers.ts`
6. ✅ Test kick/ban functionality

**Validation:**
```bash
pnpm --filter top-comment exec tsc --noEmit
# Manual test: Kick and ban players in host view
```

---

### Day 2: Critical Issue C-3 - React Hooks Violation

**Problem Location:** `HostPage.tsx` lines 100-131

**Current (WRONG):**
```typescript
const {
  sessionId: storedSessionId,
  code: storedRoomCode,
  // ... other destructuring
} = shouldUseHostHooks ? hostSessionData : { sessionId: null, code: null };
```

**Fix (CORRECT):**
```typescript
// Always destructure from hook
const hostSessionData = useHostState();

// Apply conditions on values
const storedSessionId = shouldUseHostHooks ? hostSessionData.sessionId : null;
const storedRoomCode = shouldUseHostHooks ? hostSessionData.code : null;
// ... etc for all values
```

**Tasks:**
1. ✅ Find the conditional destructuring pattern in HostPage.tsx
2. ✅ Refactor to always destructure, conditionally use values
3. ✅ Verify no other conditional hook patterns exist
4. ✅ Test all hook-dependent features

**Validation:**
```bash
pnpm --filter top-comment exec tsc --noEmit
# Verify no React warnings in console
```

---

### Day 3: Critical Issue C-4 - Supabase Memory Leaks

**Files to Fix:**
- `features/sociale/hooks/useSociale.ts` (lines 32-34)
- `features/sociale/hooks/useSocialeChannel.ts`
- Any other files with `supabase.removeChannel()`

**Current (WRONG):**
```typescript
return () => {
  void supabase.removeChannel(channel);
};
```

**Fix (CORRECT):**
```typescript
return () => {
  channel.unsubscribe();  // ADD THIS FIRST
  void supabase.removeChannel(channel);
};
```

**Tasks:**
1. ✅ Search all files for `removeChannel` without `unsubscribe`
2. ✅ Fix `useSociale.ts`
3. ✅ Fix `useSocialeChannel.ts`
4. ✅ Fix any other Supabase subscription cleanups
5. ✅ Create a code comment template for future subscriptions

**Validation:**
```bash
# Search for pattern:
grep -r "removeChannel" --include="*.ts" --include="*.tsx"
# Verify all have .unsubscribe() before removeChannel
```

---

### Day 4: Critical Issue C-5 - Remove `any` Types

**Priority Files:**
1. `components/HostPanelV2.tsx`
   - `sessionPlayers?: any[]` → `sessionPlayers?: SessionPlayer[]`
   - `socialites?: any[]` → `socialites?: Socialite[]`

2. `components/SessionPlayersPanel.tsx`
   - `session: any` → `session: Session | null`

3. `components/CreateRoomModal.tsx`
   - `value: any` → proper event type

4. `hooks/useSocialeResponses.ts`
   - `value: updates.value as any` → proper type

**Tasks:**
1. ✅ Create `SessionPlayer` type in `shared/types`
2. ✅ Create `Socialite` type in `domain/types/sociale.types.ts`
3. ✅ Create `InteractionSettings` type
4. ✅ Replace all `any` types in HostPanelV2.tsx
5. ✅ Replace all `any` types in SessionPlayersPanel.tsx
6. ✅ Replace all `any` types in CreateRoomModal.tsx
7. ✅ Replace all `any` types in useSocialeResponses.ts
8. ✅ Search for remaining `any` types and document them

**Validation:**
```bash
# Search for any types:
grep -r ": any" apps/top-comment/src/features/host --include="*.ts" --include="*.tsx"
grep -r ": any" apps/top-comment/src/features/sociale --include="*.ts" --include="*.tsx"

pnpm --filter top-comment exec tsc --noEmit
```

---

### Day 5: Medium Issue M-1 - Delete Dead Code

**Files to Delete:**
```bash
features/room/RoomPage.example-v2.tsx  # 234 lines - example file
```

**Code to Remove from HostPage.tsx:**
- Lines 14, 50, 53: Commented-out imports
- Lines 393-398: Commented-out function block
- Lines 1112-1126: Commented-out variable

**Tasks:**
1. ✅ Delete `RoomPage.example-v2.tsx`
2. ✅ Remove commented imports from HostPage.tsx
3. ✅ Remove commented function from HostPage.tsx
4. ✅ Remove commented variable from HostPage.tsx
5. ✅ Search for other commented-out code blocks
6. ✅ Verify no references to deleted code

**Validation:**
```bash
pnpm --filter top-comment exec tsc --noEmit
pnpm build
```

---

## Week 2: Service Layer & Constants 🟡 MEDIUM PRIORITY

### Day 1-2: High Issue H-1 - Split socialeService.ts

**Current:** 920 lines monolithic file

**Target Structure:**
```
features/sociale/services/
├── mappers.ts           (~150 lines)
│   ├── mapSociale()
│   ├── mapSocialite()
│   └── mapInteraction()
├── queries.ts           (~300 lines)
│   ├── fetchSociale()
│   ├── fetchSocialites()
│   └── getSocialeById()
├── mutations.ts         (~400 lines)
│   ├── createSociale()
│   ├── updateSociale()
│   ├── startSociale()
│   ├── advanceSociale()
│   └── submitResponse()
└── index.ts             (~70 lines)
    └── Re-export barrel
```

**Tasks:**
1. ✅ Create `services/` directory
2. ✅ Extract mapper functions to `mappers.ts`
3. ✅ Extract fetch/get operations to `queries.ts`
4. ✅ Extract create/update/mutations to `mutations.ts`
5. ✅ Create barrel export in `index.ts`
6. ✅ Update all imports across codebase
7. ✅ Delete old `socialeService.ts`
8. ✅ Test all Sociale functionality

**Validation:**
```bash
pnpm --filter top-comment exec tsc --noEmit
# Manual test: Create, start, advance Sociale
```

---

### Day 3: High Issue H-3 - Extract Magic Numbers

**Create:** `shared/constants/timings.ts`

```typescript
export const PHASE_DURATIONS = {
  ANSWER: 60,
  VOTE: 30,
  RESULTS: 15,
  LOBBY: 0, // No timer
} as const;

export const DATA_STALENESS = {
  ROOM: 7 * 24 * 60 * 60 * 1000,      // 7 days
  SESSION: 24 * 60 * 60 * 1000,        // 1 day
  SOCIALE: 24 * 60 * 60 * 1000,        // 1 day
} as const;

export const TIMER_INTERVALS = {
  COUNTDOWN: 1000,        // 1 second
  HEARTBEAT: 5000,        // 5 seconds
} as const;
```

**Files to Update:**
- `hooks/useSessionTimer.ts` (lines 35-41)
- `hooks/useHostRoomV2.ts` (lines 52-53)
- Any other hardcoded durations

**Tasks:**
1. ✅ Create `shared/constants/timings.ts`
2. ✅ Extract all magic numbers
3. ✅ Update `useSessionTimer.ts`
4. ✅ Update `useHostRoomV2.ts`
5. ✅ Search for other hardcoded durations
6. ✅ Update all references

**Validation:**
```bash
# Search for magic numbers:
grep -r "60 \* 60 \* 1000" apps/top-comment/src
grep -r "24 \* 60" apps/top-comment/src

pnpm --filter top-comment exec tsc --noEmit
```

---

### Day 4: High Issue H-4 - Standardize Supabase Error Handling

**Current:** Inconsistent handling of PGRST116 (no rows)

**Create:** `shared/utils/supabase-errors.ts`

```typescript
export const SUPABASE_ERROR_CODES = {
  NO_ROWS: 'PGRST116',
  UNAUTHORIZED: 'PGRST301',
  FORBIDDEN: 'PGRST302',
} as const;

export function isNoRowsError(error: any): boolean {
  return error?.code === SUPABASE_ERROR_CODES.NO_ROWS;
}

export function handleSupabaseError<T>(
  error: any,
  options: {
    returnOnNoRows?: T;
    throwOnNoRows?: boolean;
  } = {}
): T | never {
  if (isNoRowsError(error)) {
    if (options.throwOnNoRows) throw error;
    return options.returnOnNoRows as T;
  }
  throw error;
}
```

**Files to Update:**
- `hooks/useSociale.ts` (lines 48-54)
- `hooks/useSocialeResponses.ts` (lines 39-40)
- All other Supabase fetch hooks

**Tasks:**
1. ✅ Create `shared/utils/supabase-errors.ts`
2. ✅ Update all Supabase hooks to use utility
3. ✅ Standardize error handling pattern
4. ✅ Document the pattern in code comments

**Validation:**
```bash
pnpm --filter top-comment exec tsc --noEmit
# Test: Try to fetch non-existent Sociale
```

---

### Day 5: High Issue H-5 - Unified Error Handling

**Create:** `shared/utils/error-handling.ts`

```typescript
import { logger } from './logger';
import type { Toast } from '../hooks/useToast';

interface ErrorHandlingOptions {
  toast?: Toast;
  logger?: typeof logger;
  context?: string;
  userMessage?: string;
  logLevel?: 'error' | 'warn' | 'info';
}

export async function handleAsyncError(
  error: unknown,
  options: ErrorHandlingOptions = {}
): Promise<void> {
  const {
    toast,
    logger: log = logger,
    context = 'Unknown',
    userMessage,
    logLevel = 'error',
  } = options;

  const errorMessage = getErrorMessage(error);
  
  // Log to console/service
  if (log) {
    log[logLevel](`[${context}] ${errorMessage}`, { error });
  }
  
  // Show user toast
  if (toast) {
    toast({
      title: userMessage || errorMessage,
      variant: 'error',
    });
  }
}
```

**Files to Update:**
- `Handlers/roomKickBanHandlers.ts`
- `Handlers/createSessionHandler.ts`
- `HostPage.tsx` (lines 294-305)
- All other error handling locations

**Tasks:**
1. ✅ Create `shared/utils/error-handling.ts`
2. ✅ Update all handlers to use utility
3. ✅ Ensure consistent error logging + user feedback
4. ✅ Document error handling pattern

**Validation:**
```bash
pnpm --filter top-comment exec tsc --noEmit
# Test: Trigger various errors and verify logging + toasts
```

---

## Week 3: Architecture Improvements 🟢 LOWER PRIORITY

### Day 1-2: High Issue H-2 - Create HostGameContext

**Problem:** HostPanelV2 receives 18 props (prop drilling)

**Create:** `features/host/context/HostGameContext.tsx`

```typescript
interface HostGameContextValue {
  // Session state
  session: Session | null;
  sessionId: string | null;
  
  // Room state
  room: Room | null;
  roomMemberships: RoomMembership[];
  roomCode: string;
  
  // Sociale state
  activeSociale: Sociale | null;
  
  // Players
  sessionPlayers: SessionPlayer[];
  
  // Computed
  playerCount: number;
  isLoading: boolean;
}

export const HostGameContext = createContext<HostGameContextValue | null>(null);

export function useHostGame() {
  const context = useContext(HostGameContext);
  if (!context) throw new Error('useHostGame must be used within HostGameProvider');
  return context;
}
```

**Tasks:**
1. ✅ Create `context/HostGameContext.tsx`
2. ✅ Wrap HostPage content in provider
3. ✅ Update HostPanelV2 to use context instead of props
4. ✅ Remove prop drilling from HostPage
5. ✅ Test all context-dependent features

**Validation:**
```bash
pnpm --filter top-comment exec tsc --noEmit
# Verify HostPanelV2 works with context
```

---

### Day 3: Medium Issue M-2 - Remove Version Suffixes

**Files to Rename:**
```bash
# Find old versions and delete:
HostPanelV2.tsx → HostPanel.tsx (delete old HostPanel.tsx if exists)
useHostRoomV2.ts → useHostRoom.ts (delete old useHostRoom.ts if exists)
useHostSessionV2.ts → useHostSession.ts (delete old if exists)
RoomPageContentNew.tsx → RoomPageContent.tsx (delete old if exists)
```

**Tasks:**
1. ✅ Search for files with V2/New suffixes
2. ✅ Verify old versions are not in use
3. ✅ Delete old versions
4. ✅ Rename V2/New files to clean names
5. ✅ Update all imports
6. ✅ Search for any remaining version references

**Validation:**
```bash
# Search for version suffixes:
find apps/top-comment/src -name "*V2*" -o -name "*New*"

pnpm --filter top-comment exec tsc --noEmit
pnpm build
```

---

### Day 4: Medium Issue M-3 - Create SocialeGameContext

**Model after:** `features/room/context/RoomPageContext.tsx`

**Create:** `features/sociale/context/SocialeGameContext.tsx`

```typescript
interface SocialeGameState {
  sociale: Sociale | null;
  socialites: Socialite[];
  currentPhase: GamePhase;
  responses: SocialeResponse[];
  isLoading: boolean;
  error: Error | null;
}

type SocialeGameAction =
  | { type: 'SET_SOCIALE'; payload: Sociale }
  | { type: 'UPDATE_PHASE'; payload: GamePhase }
  | { type: 'ADD_RESPONSE'; payload: SocialeResponse }
  | { type: 'SET_ERROR'; payload: Error };

function socialeGameReducer(
  state: SocialeGameState,
  action: SocialeGameAction
): SocialeGameState {
  // Reducer logic
}

export const SocialeGameContext = createContext<{
  state: SocialeGameState;
  dispatch: Dispatch<SocialeGameAction>;
} | null>(null);
```

**Tasks:**
1. ✅ Create `context/SocialeGameContext.tsx`
2. ✅ Implement reducer pattern
3. ✅ Update Sociale hooks to use context
4. ✅ Coordinate state across Sociale components
5. ✅ Test Sociale functionality

**Validation:**
```bash
pnpm --filter top-comment exec tsc --noEmit
# Test: Create and play through Sociale
```

---

### Day 5: Medium Issue M-4 - Unify Pause/Resume Logic

**Create:** `shared/hooks/usePauseManager.ts`

```typescript
interface UsePauseManagerOptions {
  id: string;
  type: 'session' | 'sociale';
  onPause?: () => void;
  onResume?: () => void;
}

export function usePauseManager(options: UsePauseManagerOptions) {
  const { id, type, onPause, onResume } = options;
  const [isPausing, setIsPausing] = useState(false);
  const { toast } = useToast();
  
  const togglePause = useCallback(async (currentlyPaused: boolean) => {
    setIsPausing(true);
    try {
      if (type === 'session') {
        await pauseSession({ sessionId: id, pause: !currentlyPaused });
      } else {
        await pauseSociale(id, !currentlyPaused);
      }
      
      toast({
        title: currentlyPaused ? 'Resumed' : 'Paused',
        variant: 'success',
      });
      
      if (currentlyPaused) {
        onResume?.();
      } else {
        onPause?.();
      }
    } catch (error) {
      await handleAsyncError(error, {
        toast,
        context: `Pause ${type}`,
      });
    } finally {
      setIsPausing(false);
    }
  }, [id, type, toast, onPause, onResume]);
  
  return { togglePause, isPausing };
}
```

**Tasks:**
1. ✅ Create `shared/hooks/usePauseManager.ts`
2. ✅ Update HostPage to use hook
3. ✅ Update Sociale components to use hook
4. ✅ Remove duplicate pause logic
5. ✅ Test pause/resume for both types

**Validation:**
```bash
pnpm --filter top-comment exec tsc --noEmit
# Test: Pause/resume Session and Sociale
```

---

## Week 4: Cross-Cutting Concerns & Polish 🔵 OPTIONAL

### Day 1-2: Unified Subscription Pattern

**Create:** `shared/hooks/useSupabaseSubscription.ts`

```typescript
interface UseSupabaseSubscriptionOptions<T> {
  channelName: string;
  event?: string;
  schema?: string;
  table?: string;
  filter?: string;
  onPayload: (payload: T) => void;
  onError?: (error: Error) => void;
}

export function useSupabaseSubscription<T>(
  options: UseSupabaseSubscriptionOptions<T>
) {
  const {
    channelName,
    event = '*',
    schema = 'public',
    table,
    filter,
    onPayload,
    onError,
  } = options;
  
  useEffect(() => {
    const channel = supabase.channel(channelName);
    
    if (table) {
      channel.on(
        'postgres_changes',
        { event, schema, table, filter },
        (payload) => onPayload(payload.new as T)
      );
    }
    
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        logger.info(`Subscribed to ${channelName}`);
      }
    });
    
    return () => {
      channel.unsubscribe();
      void supabase.removeChannel(channel);
    };
  }, [channelName, event, schema, table, filter, onPayload, onError]);
}
```

**Tasks:**
1. ✅ Create `shared/hooks/useSupabaseSubscription.ts`
2. ✅ Migrate Host subscriptions to use hook
3. ✅ Migrate Room subscriptions to use hook
4. ✅ Migrate Sociale subscriptions to use hook
5. ✅ Delete old subscription code
6. ✅ Test real-time updates

**Validation:**
```bash
pnpm --filter top-comment exec tsc --noEmit
# Test: Real-time updates across all features
```

---

### Day 3: Type Consistency - Shared GamePhase

**Create:** `shared/types/game.types.ts`

```typescript
export type GamePhase = 
  | 'lobby'
  | 'answer'
  | 'vote'
  | 'results'
  | 'ended';

export type SessionStatus = GamePhase; // Alias for backward compatibility

// Update Sociale to use GamePhase instead of string
export interface Sociale {
  // ... other fields
  currentPhase: GamePhase; // was: string
}
```

**Tasks:**
1. ✅ Create shared `GamePhase` type
2. ✅ Update Session to use `GamePhase`
3. ✅ Update Sociale to use `GamePhase`
4. ✅ Update all phase comparisons
5. ✅ Remove string-based phase logic

**Validation:**
```bash
pnpm --filter top-comment exec tsc --noEmit
# Verify type safety for all phase logic
```

---

### Day 4: Medium Issue M-5 - Add Missing Memoization

**Files to Update:**
- `HostPage.tsx` - Wrap callbacks in `useCallback`
- `HostPanelV2.tsx` - Add `React.memo`
- `HostSidePanel.tsx` - Add `React.memo`
- `HostControlButtons.tsx` - Add `React.memo`

**Tasks:**
1. ✅ Wrap `handleCopyLink` in `useCallback`
2. ✅ Wrap `handlePauseToggle` in `useCallback` (if not in hook)
3. ✅ Wrap `handleLeaveSession` in `useCallback`
4. ✅ Wrap `handlePromptLibrarySelect` in `useCallback`
5. ✅ Add `React.memo` to pure components
6. ✅ Test for performance improvements

**Validation:**
```bash
# Use React DevTools Profiler to measure re-renders
pnpm --filter top-comment exec tsc --noEmit
```

---

### Day 5: Enable Strict TypeScript

**Update:** `tsconfig.json`

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

**Tasks:**
1. ✅ Enable `strict: true` in tsconfig
2. ✅ Fix all new TypeScript errors
3. ✅ Ensure all `any` types are documented/justified
4. ✅ Run full type check
5. ✅ Run full build

**Validation:**
```bash
pnpm --filter top-comment exec tsc --noEmit
pnpm build
```

---

## Validation Checklist

After each week, verify:

### ✅ Code Quality
- [ ] TypeScript compiles without errors
- [ ] No console warnings in dev mode
- [ ] No React hooks violations
- [ ] No memory leaks (Supabase subscriptions)

### ✅ Functionality
- [ ] All features work as before
- [ ] No regressions introduced
- [ ] Real-time updates working
- [ ] Error handling working

### ✅ Build & Deploy
- [ ] `pnpm build` succeeds
- [ ] Bundle size acceptable
- [ ] No build warnings

---

## Success Criteria

Phase 5 is complete when:

1. ✅ All critical bugs fixed (C-1 to C-5)
2. ✅ All high-priority issues resolved (H-1 to H-5)
3. ✅ Most medium-priority issues resolved (M-1 to M-5)
4. ✅ TypeScript strict mode enabled
5. ✅ No `any` types without justification
6. ✅ Unified patterns across features
7. ✅ All tests passing
8. ✅ Documentation updated

---

## Risk Mitigation

### Low Risk ✅
- Week 1 tasks (bug fixes, cleanup)
- Constants extraction
- Error handling utilities

### Medium Risk ⚠️
- Service splitting (H-1)
- Context creation (H-2, M-3)
- Subscription unification

### High Risk 🔴
- Strict TypeScript (may reveal hidden bugs)
- Version suffix removal (ensure old code deleted)

### Mitigation Strategies
1. **One change at a time** - Don't combine risky changes
2. **Test after each change** - Catch regressions early
3. **Keep backups** - Can rollback individual changes
4. **Document decisions** - Why certain patterns chosen
5. **Incremental rollout** - Enable strict mode gradually

---

## Estimated Impact

### Code Quality
- **Type Safety:** 90%+ → 98%+ (strict mode)
- **Error Handling:** Inconsistent → Standardized
- **Code Duplication:** Reduced by ~500 lines
- **Memory Leaks:** Fixed (Supabase subscriptions)

### Maintainability
- **Service Layer:** 920-line file → 4 focused files
- **Prop Drilling:** 18 props → Context-based
- **Magic Numbers:** Hardcoded → Constants
- **Dead Code:** Removed (~500+ lines)

### Developer Experience
- **Better IntelliSense** - Proper types everywhere
- **Easier Debugging** - Unified error handling
- **Faster Onboarding** - Clear patterns
- **Less Confusion** - No version suffixes

---

## Final Deliverables

1. **Code Changes**
   - All critical bugs fixed
   - Service layer refactored
   - Contexts created
   - Utilities extracted

2. **Documentation**
   - Error handling patterns
   - Subscription patterns
   - Context usage guide
   - Constants reference

3. **Testing**
   - Manual test checklist
   - Regression test results
   - Performance benchmarks

4. **Summary Report**
   - What was changed
   - What was improved
   - Remaining tech debt
   - Future recommendations

---

**Status:** Ready to begin  
**Recommended Start:** Week 1, Day 1 - Critical bug fixes  
**Total Duration:** 3-4 weeks (can be parallelized)
