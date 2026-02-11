# Implementation Plan: Bugs, Refactoring & Architectural Cleanup

> **Purpose**: Fix known bugs, remove legacy code, and refactor for maintainability.  
> **Approach**: Phased rollout — each phase is independently deployable and testable.  
> **Assumption**: All phases assume the rooms-only architecture (NO TEAMS).

### Implementation Status (Updated Feb 11, 2026)

| Phase | Status | Notes |
|-------|--------|-------|
| **Phase 1** | ✅ Complete | String interpolation fixed, ErrorBoundary created, RootLayout try/catch removed |
| **Phase 2** | ⚠️ Partial | Routes redirected, JoinForm extracted, constants/types/StateMachine cleaned. **Cannot delete `features/team/` or `Team` type** — used by HostPage, Presenter, VoteModal, SelfieModal, DrinkTank, session hooks, domain services. Needs broader refactor. |
| **Phase 3** | ⚠️ Partial | AccountMenu extracted. RoomPage decomposition deferred (needs visual testing). |
| **Phase 4** | ⚠️ Partial | Logger already existed. README updated. `any` removal and console.log gating still pending. |
| **Phase 5** | ❌ Pending | Test foundation not started. |

---

## Phase 1: Critical Bug Fixes (Day 1)

**Goal**: Fix bugs that affect production behavior right now.

### 1.1 String Interpolation Bugs in `roomService.ts`

**File**: `src/services/roomService.ts`  
**Lines**: ~333, ~355  
**Bug**: `error.message}` is missing the `${` prefix, producing broken error messages.

```diff
- throw new Error(`Failed to update room: error.message}`);
+ throw new Error(`Failed to update room: ${error.message}`);

- throw new Error(`Failed to archive room: error.message}`);
+ throw new Error(`Failed to archive room: ${error.message}`);
```

**Test**: Trigger a room update/archive failure and verify the error message includes the actual error text.

### 1.2 Auth Hook Error Swallowing in `RootLayout.tsx`

**File**: `src/app/RootLayout.tsx`  
**Bug**: `useAuth()` is wrapped in a try/catch that silently swallows errors, masking real issues.

**Fix**: Replace with a proper React Error Boundary wrapping the layout, and remove the try/catch.

```tsx
// New file: src/shared/components/ErrorBoundary.tsx
// Standard React error boundary that shows a fallback UI and logs errors.
```

**Steps**:
1. Create `src/shared/components/ErrorBoundary.tsx` with a generic error boundary component
2. Wrap `<RootLayout />` in the error boundary in `router.tsx`
3. Remove the try/catch around `useAuth()` in `RootLayout.tsx`
4. Add error boundaries around each route's element in `router.tsx`

**Test**: Temporarily throw in `AuthProvider` and verify the error boundary catches it instead of a white screen.

---

## Phase 2: Legacy Team Code Removal (Day 2–3)

**Goal**: Remove all legacy team routes, components, and references. This is the single largest source of confusion and dead code.

### 2.1 Remove Legacy Routes

**File**: `src/app/router.tsx`

Remove these routes:
- `team/:roomCode` → `TeamPage`
- `play` → `TeamPage`
- `team` → `TeamPage`

Add redirects for backwards compatibility:
```tsx
{ path: "team/:roomCode", loader: ({ params }) => redirect(`/room/${params.roomCode}`) },
{ path: "team", loader: () => redirect("/join") },
{ path: "play", loader: () => redirect("/join") },
```

**Test**: Visit `/team/ABC123`, `/play`, `/team` and verify they redirect correctly.

### 2.2 Remove Legacy Team Feature Directory

**Files to remove** (after routes are redirected):
- `src/features/team/` — entire directory (~30K+ TeamPage, OldLobbyPhase, useSelfieCamera, useTeamRoom, useTeamSession, etc.)

**Prerequisites**: Verify no non-legacy code imports from `features/team/`. Known dependency:
- `src/features/join/JoinPage.tsx` imports `JoinForm` from `features/team/Phases` — extract `JoinForm` to `src/features/join/JoinForm.tsx` first.

**Steps**:
1. Copy `JoinForm` component from `features/team/Phases.tsx` into `src/features/join/JoinForm.tsx`
2. Update `JoinPage.tsx` import to point to the new location
3. Search for any other imports from `features/team/` and resolve them
4. Delete `src/features/team/` directory
5. Build and verify no import errors

**Test**: `pnpm run build` succeeds; `/join` page still works.

### 2.3 Clean Team References from Domain Types

**Files**:
- `src/domain/types/domain.types.ts` — remove `Team` interface, `teamName` references
- `src/domain/types/room.types.ts` — remove `teamName` from `RoomMemberJoinedEvent`, `maxTeamNameLength` from validation rules
- `src/shared/types.ts` — remove `Team`, `TeamMember` re-exports
- `src/shared/constants.ts` — update copy strings:
  - `"Gather your teams and share the code."` → `"Gather your players and share the code."`
  - `"No voting for your own team."` → `"No voting for your own answer."`

**Test**: `pnpm run type-check` passes; grep for `team` in domain types returns zero results (excluding legitimate uses like "theme").

### 2.4 Clean Team References from SessionStateMachine

**File**: `src/domain/services/SessionStateMachine.ts`

- Rename `teamCount` → `playerCount` in `StateMachineContext`
- Update `buildContext()` to count non-host memberships instead of "teams"
- Update validation messages: `"Need at least 2 teams"` → `"Need at least 2 players"`
- Update all callers of `buildContext()` and `validateTransition()`

**Test**: Session state transitions still work correctly with the renamed fields.

---

## Phase 3: Component Decomposition (Day 4–6)

**Goal**: Break down oversized components into maintainable pieces.

### 3.1 Extract Shared UI Components

Create reusable components from patterns duplicated across mobile/desktop:

| Component | Extract From | New Location |
|-----------|-------------|--------------|
| `AccountMenu` | `RootLayout.tsx`, `RoomPage.tsx` (×3) | `src/shared/components/AccountMenu.tsx` |
| `BottomNav` | `RoomPage.tsx` (×2) | `src/shared/components/BottomNav.tsx` |
| `RoomHeader` | `RoomPage.tsx` (desktop + mobile) | `src/features/room/components/layout/RoomHeader.tsx` |

**Steps per component**:
1. Identify all instances of the duplicated pattern
2. Extract into a single component with props for variant differences
3. Replace all instances with the new component
4. Verify visual parity

**Test**: Visual regression — both mobile and desktop layouts look identical before/after.

### 3.2 Decompose `RoomPage.tsx` (780 lines → ~200 each)

Split into:
- `RoomPage.tsx` — entry point, data loading, provider setup (~100 lines)
- `RoomPageContent.tsx` — layout switching (mobile vs desktop) (~100 lines)
- `RoomDesktopLayout.tsx` — desktop 2-column layout (~150 lines)
- `RoomMobileLayout.tsx` — mobile stacked layout + bottom nav (~150 lines)
- `RoomDrawers.tsx` — drawer state management and rendering (~100 lines)
- `RoomModals.tsx` — lazy-loaded modal rendering (~100 lines)

**Steps**:
1. Extract desktop layout into `RoomDesktopLayout.tsx`
2. Extract mobile layout into `RoomMobileLayout.tsx`
3. Extract drawer management into `RoomDrawers.tsx`
4. Extract modal management into `RoomModals.tsx`
5. Wire everything together in `RoomPageContent.tsx`
6. Keep `RoomPage.tsx` as the thin entry point

**Test**: All room functionality works on both mobile and desktop viewports.

### 3.3 Audit and Remove Empty/Dead Files

**Files to remove**:
- `src/hooks/useAudioPlayback.ts` (0 bytes)
- `src/hooks/useRealtimeQueue.ts` (0 bytes)
- `src/features/player/` (empty directory)

**Files to audit**:
- `src/shared/components/vibox/VIBoxJukebox.tsx` (967 bytes — thin wrapper) — verify it's used
- `src/shared/components/vibox/VIBoxJukeboxInner.tsx` (90K) — flag for future decomposition (out of scope for this phase)

**Test**: `pnpm run build` succeeds.

---

## Phase 4: Type Safety & Code Hygiene (Day 7–8)

**Goal**: Eliminate `any` casts, add proper typing, clean up debug logging.

### 4.1 Remove `any` Type Casts

**Priority files** (search for `as any`):
- `src/shared/providers/AuthProvider.tsx` line 48 — `(supabase as any).from('venue_accounts')` → use proper Supabase typed client or add a type assertion for the table
- `src/hooks/useRoomChat.ts` line 43 — `data.map((msg: any)` → define a `RoomMessageRow` interface
- `src/services/roomService.ts` — `mapRoom(data: any)` → type the Supabase response
- `src/services/roomMembershipService.ts` — `mapRoomMembership(data: any)` → type the Supabase response
- `src/services/interactionService.ts` — mapper functions use `any`

**Approach**: Define row-level types matching the Supabase table schemas, then use them in mapper functions.

```typescript
// src/domain/types/database.types.ts
interface RoomRow {
  id: string;
  code: string;
  host_uid: string;
  name: string;
  // ... all columns
}
```

**Test**: `pnpm run type-check` passes with no `any` in service/hook files.

### 4.2 Gate Debug Logging

**Problem**: Emoji-prefixed console.logs (`🔍`, `🚀`, `✅`, `❌`, `🚫`) throughout production code.

**Fix**: Create a simple debug logger utility:

```typescript
// src/shared/utils/logger.ts
const isDev = import.meta.env.DEV;

export const logger = {
  debug: (...args: unknown[]) => isDev && console.log(...args),
  warn: (...args: unknown[]) => console.warn(...args),
  error: (...args: unknown[]) => console.error(...args),
};
```

**Steps**:
1. Create `src/shared/utils/logger.ts`
2. Replace all `console.log` calls in services/hooks with `logger.debug`
3. Keep `console.error` and `console.warn` calls (or replace with `logger.error`/`logger.warn`)

**Test**: In production build, no debug logs appear in console. In dev, they still show.

### 4.3 Fix README

**File**: `README.md`

- Update "Side Bets client" → "Pub Söcial (Top Comment)"
- Update `VITE_FIREBASE_*` reference → `VITE_SUPABASE_*` (or whatever the actual env vars are)
- Add monorepo context and workspace dependency info

---

## Phase 5: Test Foundation (Day 9–10)

**Goal**: Establish a testing baseline for the most critical code paths.

### 5.1 Unit Tests for Domain Services

**Files to test**:
- `src/domain/services/SessionStateMachine.ts` — all transition validations, phase logic
- `src/domain/services/LeaderboardCalculator.ts` — scoring and ranking
- `src/domain/services/VotingEngine.ts` — vote counting
- `src/domain/services/RoundManager.ts` — round progression

**Framework**: Vitest (already configured)

**Target**: 100% branch coverage on `SessionStateMachine` (it's pure logic, no dependencies).

### 5.2 Integration Tests for Key Hooks

**Files to test** (with mocked Supabase):
- `src/hooks/useRoom.ts` — room loading, membership sync
- `src/hooks/useInteractions.ts` — interaction CRUD
- `src/hooks/useKickDetection.ts` — kick/ban detection

**Approach**: Use `vitest` with `@testing-library/react` and mock the Supabase client.

### 5.3 E2E Smoke Tests

**File**: `tests/e2e/smoke.spec.ts`

Cover the critical happy path:
1. Landing page loads
2. Navigate to `/join`
3. Enter room code + name → join room
4. Room page renders with correct room code
5. Host can send a prompt
6. Player can respond to prompt

**Framework**: Playwright (already configured)

---

## Verification Checklist (Per Phase)

| Check | Command |
|-------|---------|
| TypeScript compiles | `pnpm run type-check` |
| Build succeeds | `pnpm run build` |
| Unit tests pass | `pnpm run test` |
| E2E tests pass | `pnpm run test:e2e` |
| No `team` in domain types | `grep -ri "team" src/domain/types/` (should be empty) |
| No `any` in services | `grep -r "as any" src/services/` (should be empty) |
| No debug console.log | `grep -r "console.log" src/services/ src/hooks/` (should be empty) |

---

## Risk Notes

- **Phase 2 (team removal)** is the highest-risk phase — the `JoinForm` extraction must be done carefully since it's the only live dependency on the legacy `team/` directory.
- **Phase 3 (decomposition)** should be done with visual regression testing. If no visual regression tool is set up, manually test both mobile (375px) and desktop (1280px) viewports.
- **Phase 4 (type safety)** may surface hidden bugs where `any` was masking type mismatches. Fix these as they appear.
