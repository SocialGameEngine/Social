# Host + Room Code Quality Audit

Date: 2026-03-26  
Scope: `apps/top-comment/src/features/host` and `apps/top-comment/src/features/room`  
Goal: identify cleanup/refactor opportunities to simplify the system while preserving functionality.

## Priority Findings

### High

- **Monolithic host orchestration**
  - **File:** `features/host/HostPage.tsx`
  - **Issue:** UI rendering, data access, auth/recovery, modal orchestration, and phase control are all in one large component.
  - **Impact:** high regression risk and hard onboarding.
  - **Refactor:** split into `useHostPageController` + focused presentational sections.

- **Monolithic room orchestration**
  - **File:** `features/room/components/RoomPageContentNew.tsx`
  - **Issue:** combines data hooks, interaction grouping, sheet/modal state, challenge flow, timers, and mobile/desktop rendering.
  - **Impact:** brittle changes and poor testability.
  - **Refactor:** extract `useRoomInteractionsData`, `useRoomOverlaysState`, and separate mobile/desktop scaffold components.

- **Legacy + live room page implementations coexist**
  - **Files:** `features/room/components/RoomPageContent.tsx`, `features/room/components/RoomPage.example-v2.tsx`, `features/room/components/index.ts`
  - **Issue:** multiple implementations of the same feature path.
  - **Impact:** drift, confusion, and duplicated maintenance.
  - **Refactor:** keep one canonical room page and remove/archive obsolete variants.

- **Duplicated interaction implementations**
  - **Files:** `interactions/PollModal.tsx`, `PollCard.tsx`, `TopicModal.tsx`, `TopicCard.tsx`
  - **Issue:** duplicated vote/fetch/render logic with small visual differences.
  - **Impact:** bug fixes must be repeated in multiple places.
  - **Refactor:** shared interaction hooks + shared content components wrapped by modal/card shells.

- **Host question manager has suspicious logic**
  - **File:** `features/host/components/HostQuestionPackManager.tsx`
  - **Issue:** branch semantics around confirm/delete and pack selection appear fragile.
  - **Impact:** high chance of incorrect behavior and future regressions.
  - **Refactor:** simplify delete flow and add focused tests.

### Medium

- **Potential dead/unwired files add cognitive load**
  - **Host candidates:** `components/HostHeader.tsx`, `components/HostSidebar.tsx`, `components/RoomSettingsModal.tsx`, older host hooks.
  - **Room candidates:** `components/RoomBottomNav.tsx`, `TabNavigation.tsx`, `JoinSessionButton.tsx`, `HeroSessionButton.tsx`, `RoomPageLoading.tsx`, `layout/LobbyDrawer.tsx`, multiple `widgets/*`.
  - **Refactor:** verify usage, then remove or move under explicit `experimental/` boundary.

- **Duplicate handler families in host**
  - **Files:** `Handlers/kickPlayerHandler.ts`, `banPlayerHandler.ts`, `roomKickBanHandlers.ts`
  - **Issue:** same domain behavior implemented with overlapping patterns.
  - **Refactor:** consolidate into one typed membership-actions factory.

- **Typing gaps (`any`) in critical flows**
  - **Files:** host recovery/hooks and several room interaction components.
  - **Issue:** weak contracts around interaction/session settings.
  - **Refactor:** introduce discriminated union types for interaction payloads and remove `any` in hot paths first.

- **Ad-hoc console logging in runtime paths**
  - **Issue:** noisy logs and inconsistent debugging strategy.
  - **Refactor:** central logger utility with environment-gated debug output.

- **Repeated capability logic**
  - **Issue:** repeated `isMember` / `isModerator` checks across room components.
  - **Refactor:** create `useRoomCapabilities(...)` and consume a single capability object.

### Low

- **Naming collision**
  - **Files:** `components/VoteModal.tsx` and `components/interactions/VoteModal.tsx`
  - **Issue:** same semantic name for different domains.
  - **Refactor:** rename to domain-specific names.

- **Dead state in active files**
  - **Files:** `features/room/components/RoomPage.tsx`, `RoomPageContentNew.tsx`
  - **Issue:** state fields and UI flags with no active call path.
  - **Refactor:** remove stale state and reintroduce only when wired.

- **Hard navigation/reload patterns still present**
  - **Issue:** `window.location.*` and reload usage bypass predictable app-state transitions.
  - **Refactor:** prefer router navigation + explicit cache/state invalidation.

## Quick Wins (<1 day)

- Remove/deprecate confirmed dead files in host/room.
- Extract duplicated host “Interactions Panel” into one reusable component.
- Remove dead state/handlers in active room pages.
- Replace ad-hoc console logs with a centralized logger.
- Resolve `VoteModal` naming collisions.

## Larger Refactors (multi-day)

- Decompose `HostPage.tsx` into controller + presentational sections.
- Decompose `RoomPageContentNew.tsx` into orchestrator hooks + scaffolds.
- Unify poll/topic behavior via shared hooks/components.
- Introduce strong interaction schema typing and eliminate `any`.
- Consolidate host session and membership action handlers into shared mutation utilities.

## Assumptions / Notes

- This audit is static (code-structure based) rather than runtime profiling.
- “Unused” candidates should be confirmed before deletion if feature-flagged or dynamically imported externally.
