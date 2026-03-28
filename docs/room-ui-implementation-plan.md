# Mobile Room UI Implementation Plan
## Session-First Chaos Update for `/room`

**Target**: SWE 1.5 (Windsurf AI Agent)  
**Approach**: Phase-by-phase implementation with atomic, verifiable tasks

This plan implements a mobile room-page upgrade with **custom chaos-styled UI** that makes the Session Panel the unmistakable primary CTA when active.

**Based on**:
- Current `/room` page structure at `apps/top-comment/src/features/room/components/`
- Existing chaos design system in `apps/top-comment/src/index.css`
- Hierarchy issue: Session needs stronger visual priority when forming/active

---

## IMPLEMENTATION PHASES

Each phase is atomic and can be verified independently. Complete phases in order.

---

## PHASE 1: CSS Foundation (30 min)
**Goal**: Add all custom chaos styles without breaking existing UI

### Task 1.1: Add Room Mode CSS
**File**: `apps/top-comment/src/index.css`
**Action**: Append the following CSS at the end of the file (after line 1088)

**Verification**: 
- File compiles without errors
- No visual changes to existing UI
- CSS classes are available but not yet applied

### Task 1.2: Verify CSS Integration
**Action**: 
- Run `pnpm dev` 
- Check browser console for CSS errors
- Confirm no visual regressions

**Success Criteria**: ✅ Development server runs, no CSS errors

---

## PHASE 2: Session Display State Logic (45 min)
**Goal**: Create type-safe state management for session display modes

### Task 2.1: Add SessionDisplayState Type
**File**: `apps/top-comment/src/features/room/components/PhaseController.tsx`
**Action**: Add type definition at top of file

```typescript
export type SessionDisplayState =
  | "idle"
  | "forming"
  | "waiting_on_host"
  | "countdown"
  | "joined"
  | "answer"
  | "vote"
  | "results"
  | "ended";
```

**Verification**: TypeScript compiles without errors

### Task 2.2: Create Display Copy Helper
**File**: `apps/top-comment/src/features/room/utils/sessionDisplayCopy.ts` (NEW FILE)
**Action**: Create utility function (see Section 10 of original plan)

**Verification**: 
- File exports `getSessionDisplayCopy` function
- TypeScript types are correct
- No runtime errors

### Task 2.3: Add isMainEventMode Logic
**File**: `apps/top-comment/src/features/room/components/PhaseController.tsx`
**Action**: Add helper function

```typescript
function getIsMainEventMode(session: Session | null): boolean {
  if (!session) return false;
  const status = session.status;
  return status === 'lobby' || status === 'active' || status === 'starting';
}
```

**Verification**: Function returns boolean correctly

**Success Criteria**: ✅ All TypeScript compiles, helper functions work

---

## PHASE 3: Session Panel Component Update (90 min)
**Goal**: Implement new session panel UI with chaos styling

### Task 3.1: Update SessionPanel Props
**File**: `apps/top-comment/src/features/room/components/layout/SessionPanel.tsx`
**Action**: Add new props to interface

```typescript
interface SessionPanelProps {
  session: Session | null;
  sessionId: string | null;
  memberships: RoomMembership[] | null;
  onOpenLeaderboard: () => void;
  onOpenSelfie: () => void;
  onOpenModal?: (type: 'answer' | 'vote') => void;
  isSticky?: boolean;
  // NEW PROPS
  isMainEventMode?: boolean;
  displayState?: SessionDisplayState;
  onJoinSession?: () => Promise<void>;
}
```

**Verification**: TypeScript compiles

### Task 3.2: Create New Session Button Component
**File**: `apps/top-comment/src/features/room/components/layout/SessionButton.tsx` (NEW FILE)
**Action**: Create component using JSX structure from Section 9

**Key Requirements**:
- Use `chaos-session-button` base class
- Apply conditional modifier classes based on `displayState`
- Implement join feedback states
- Use provided CSS classes exactly

**Verification**:
- Component renders without errors
- All CSS classes apply correctly
- Click handler works

### Task 3.3: Integrate SessionButton into SessionPanel
**File**: `apps/top-comment/src/features/room/components/layout/SessionPanel.tsx`
**Action**: Replace existing PhaseController with new SessionButton when appropriate

**Verification**:
- Session panel displays correctly
- No layout breaks
- Existing phases still work

**Success Criteria**: ✅ New session button renders with chaos styling

---

## PHASE 4: Room Mode State Management (60 min)
**Goal**: Wire up isMainEventMode to parent components

### Task 4.1: Update RoomPageContent
**File**: `apps/top-comment/src/features/room/components/RoomPageContent.tsx`
**Action**: 
- Calculate `isMainEventMode` from session state
- Pass to SessionPanel
- Apply `room-main-event-mode` class to main container

```typescript
const isMainEventMode = session && 
  (session.status === 'lobby' || session.status === 'active' || session.status === 'starting');

// In JSX:
<div className={cn("flex-1 overflow-hidden relative z-10 flex flex-col", 
  isMainEventMode && "room-main-event-mode")}>
```

**Verification**:
- Class applies when session is active
- Class removes when session inactive

### Task 4.2: Add Section Classes
**Files**: 
- `apps/top-comment/src/features/room/components/layout/InteractionsGrid.tsx`
- `apps/top-comment/src/features/room/components/layout/MiscSection.tsx`
- `apps/top-comment/src/features/room/components/interactions/InteractionSection.tsx`

**Action**: Add appropriate wrapper classes

```typescript
// InteractionsGrid.tsx
<div className="dailies-section px-4 pb-4">

// MiscSection.tsx  
<div className="misc-section px-4 pb-4">

// InteractionSection.tsx
<div className="interaction-section relative z-10 w-2xl mb-8">
```

**Verification**: CSS selectors target sections correctly

**Success Criteria**: ✅ Room mode toggles visual hierarchy correctly

---

## PHASE 5: Join Session Interaction (45 min)
**Goal**: Implement join session flow with feedback

### Task 5.1: Add Join Handler
**File**: `apps/top-comment/src/features/room/components/RoomPageContent.tsx`
**Action**: Create join session handler

```typescript
const [isJoining, setIsJoining] = useState(false);
const [joinSuccess, setJoinSuccess] = useState(false);

const handleJoinSession = useCallback(async () => {
  if (!room?.code || hasMembership) return;
  
  setIsJoining(true);
  try {
    await roomMembershipService.joinRoom({
      code: room.code,
      playerName: user?.user_metadata?.display_name || 'Player',
    });
    setJoinSuccess(true);
    setTimeout(() => setJoinSuccess(false), 2000);
  } catch (error) {
    console.error('Join failed:', error);
  } finally {
    setIsJoining(false);
  }
}, [room?.code, hasMembership, user]);
```

**Verification**: Join flow works without errors

### Task 5.2: Wire Join Handler to SessionButton
**Action**: Pass handler and states as props

**Verification**: 
- Button shows "JOINING..." state
- Success state shows "YOU'RE IN"
- Error handling works

**Success Criteria**: ✅ Join interaction provides immediate feedback

---

## PHASE 6: Player Stack & Meta Chips (45 min)
**Goal**: Add player count and avatar stack

### Task 6.1: Create Player Stack Component
**File**: `apps/top-comment/src/features/room/components/layout/PlayerStack.tsx` (NEW FILE)
**Action**: Create component using CSS from Section 8

**Requirements**:
- Show first 3 player initials
- Show "+X" for additional players
- Use `chaos-player-token` and `chaos-player-stack-more` classes

**Verification**: Component renders correctly

### Task 6.2: Add to SessionButton
**Action**: Integrate PlayerStack into SessionButton footer

**Verification**: Player stack displays when appropriate

**Success Criteria**: ✅ Player count and avatars display correctly

---

## PHASE 7: Floating Elements Adjustment (30 min)
**Goal**: Reduce prominence of competing CTAs during main event mode

### Task 7.1: Update Submit Question Button
**File**: `apps/top-comment/src/features/room/components/submissions/SubmitQuestionButton.tsx`
**Action**: Add `submit-question-button` class to wrapper

**Verification**: Button recedes during main event mode

### Task 7.2: Verify No Overlaps
**Action**: Test on mobile viewport
- Session button doesn't overlap other elements
- Floating buttons don't obscure session panel

**Success Criteria**: ✅ No visual conflicts in main event mode

---

## PHASE 8: Testing & Polish (60 min)
**Goal**: Verify all states and transitions

### Task 8.1: Test All Display States
**Action**: Manually trigger each state:
- idle
- forming  
- waiting_on_host
- countdown
- joined
- answer
- vote
- results
- ended

**Verification**: Each state displays correct copy and styling

### Task 8.2: Test Transitions
**Action**: Verify smooth transitions between states

**Verification**: No jarring visual jumps

### Task 8.3: Mobile Testing
**Action**: Test on actual mobile device or DevTools mobile view
- Touch targets are large enough
- Text is readable
- Animations perform well

### Task 8.4: Accessibility Check
**Action**: 
- Verify reduced motion preferences respected
- Check keyboard navigation
- Test screen reader compatibility

**Success Criteria**: ✅ All states work correctly, accessible, performant

---

## 1. Core Design Directive

Do **not** redesign this page into a generic app.

Any new component must feel like it was designed by the same person who designed the current chaos UI:
- thick black borders
- hard black drop shadows
- loud gradients
- high contrast
- slightly oversized rounded corners
- compact uppercase microcopy
- a bit of sticker energy
- occasional slight rotation
- expressive but controlled glow
- mobile-first spacing

New components must visually rhyme with the current style system, especially:
- `.chaos-session-button`
- chaos chips / pills
- section buttons
- the current Dailies cards

---

## 2. Product goal

When a session is **forming**, **starting**, or **active**, the **Session Panel** should become the unmistakable primary CTA on mobile.

It should communicate in under 1–2 seconds:
1. **What is happening**
2. **Why the user should tap now**
3. **Whether others are already in**
4. **Whether the game is just forming or truly about to start**

When the session is **inactive**, Interactions and Dailies should regain prominence.

---

## 3. Page behavior model

### A. Freeplay mode
Use when no session is actively forming or running.

Priority:
1. Interactions
2. Dailies
3. Session Panel as a quieter ready surface
4. More

### B. Main Event mode
Use when session is:
- forming
- waiting on host
- counting down
- actively running

Priority:
1. Session Panel
2. Interactions
3. Dailies
4. More

In Main Event mode:
- Session Panel gains stronger contrast / glow / status messaging
- Dailies visually recedes
- Interactions recedes slightly
- More recedes hardest
- floating competing CTAs quiet down or move away from the hero panel

---

## 4. Implementation overview

### Files to update
- `apps/top-comment/src/features/room/components/layout/SessionPanel.tsx`
- `apps/top-comment/src/features/room/components/layout/PhaseController.tsx`
- `apps/top-comment/src/features/room/components/layout/InteractionsGrid.tsx`
- `apps/top-comment/src/features/room/components/interactions/InteractionSection.tsx`
- `apps/top-comment/src/features/room/components/layout/MiscSection.tsx`
- `apps/top-comment/src/features/room/components/submissions/SubmitQuestionButton.tsx`
- `apps/top-comment/src/index.css`

### Optional helper components
Only create these if they improve cleanliness. Do **not** use generic library badges.
- `SessionStatusBadge.tsx`
- `SessionPlayerStack.tsx`
- `SessionSupportLine.tsx`

---

## 5. Session panel content model

### Session display states

#### Idle lobby
Use when a session exists but is not actively pulling attention.

- Badge: `LOBBY`
- Headline: `GAME READY`
- Support: `WAITING FOR PLAYERS`

#### Forming
Use when players are beginning to gather.

- Badge: `FORMING NOW`
- Headline: `JOIN GAME`
- Support: `4 PLAYERS IN • DON’T MISS ROUND 1`

#### Waiting on host
Use when players can join but the host has not started the countdown.

- Badge: `WAITING ON HOST`
- Headline: `JOIN GAME`
- Support: `3 PLAYERS IN`

#### Countdown
Only use when the start timing is real.

- Badge: `STARTING`
- Headline: `JOIN NOW`
- Support: `STARTING IN 5`

#### Joined
Use after the current user has joined but before the round starts.

- Badge: `YOU'RE IN`
- Headline: `GET READY`
- Support: `WAITING FOR ROUND 1`

#### Active phase
Use the existing phase-based logic, but keep the stronger hierarchy if the session is the main event.

Examples:
- Badge: `ANSWER`
- Headline: `SUBMIT NOW`
- Support: `12 SECONDS LEFT`

- Badge: `VOTE`
- Headline: `PICK A WINNER`
- Support: `2 RESPONSES UP`

---

## 6. Session panel layout spec

Inside the existing large chaos card, use this vertical structure:

```text
┌────────────────────────────────────────────┐
│ [FORMING NOW ●]                            │
│                                            │
│ JOIN GAME                           ▶      │
│ 4 PLAYERS IN • DON’T MISS ROUND 1          │
│                                            │
│ [K] [A] [J] +4      [4/12 JOINED]          │
└────────────────────────────────────────────┘
```

### Required layers
1. **Status badge**
2. **Primary CTA headline**
3. **Supporting line**
4. **Existing play/arrow affordance**
5. **Optional player stack / joined chip**
6. **Immediate feedback states after tap**

### Rules
- The entire card remains the primary hit target
- Avoid tiny secondary tap targets inside the card
- If player stack is shown, keep it compact and decorative, not dominant
- Support line must replace generic helper text like “Click to join the session”

---

## 7. Windsurf implementation tasks

### A. `SessionPanel.tsx`
Implement:
- rendering for the new badge / support / player stack layers
- state-driven content selection
- `isMainEventMode`
- tap feedback states:
  - `JOINING...`
  - then `YOU'RE IN ✓`
- optional participant summary
- a full-card tap target
- avoid generic button-within-card patterns

### B. `PhaseController.tsx`
Derive the display model:

```ts
type SessionDisplayState =
  | "idle"
  | "forming"
  | "waiting_on_host"
  | "countdown"
  | "joined"
  | "answer"
  | "vote"
  | "results"
  | "ended";
```

Compute:
- `isMainEventMode`
- `statusBadgeText`
- `headlineText`
- `supportText`
- `joinedCountText`
- `countdownText`
- `showPlayerStack`

### C. `InteractionsGrid.tsx`
Add receded state during Main Event mode:
- lower saturation
- smaller badge prominence
- slightly reduce emphasis
- optionally collapse lower rows if needed on very short screens

### D. `InteractionSection.tsx`
Keep readable, but make it clearly secondary during Main Event mode:
- lower contrast slightly
- reduce animation
- lower badge intensity

### E. `MiscSection.tsx`
Dim more strongly than Interactions during Main Event mode.

### F. `SubmitQuestionButton.tsx`
During Main Event mode:
- reduce glow/pulse
- move away from the session card zone if overlap risk exists
- ensure it never steals the hero CTA visually

---

## 8. Custom chaos styles to copy into `index.css`

These styles are intentionally designed to match the existing chaos aesthetic rather than a generic component library.

> **Important:** Keep the current `.chaos-session-button` and extend it. Do not replace its existing phase color logic.

```css
/* =========================================================
   ROOM MODE
   ========================================================= */

.room-main-event-mode {
  --room-recede-opacity: 0.68;
  --room-recede-saturate: 0.82;
  --room-recede-scale: 0.985;
  --room-chaos-black: rgba(0,0,0,0.92);
}

.room-main-event-mode .dailies-section,
.room-main-event-mode .misc-section {
  opacity: var(--room-recede-opacity);
  filter: saturate(var(--room-recede-saturate));
  transform: scale(var(--room-recede-scale));
  transition: opacity 160ms ease, filter 160ms ease, transform 160ms ease;
}

.room-main-event-mode .interaction-section {
  opacity: 0.82;
  filter: saturate(0.9);
  transition: opacity 160ms ease, filter 160ms ease, transform 160ms ease;
}

.room-main-event-mode .dailies-section .section-button,
.room-main-event-mode .misc-section .section-button {
  box-shadow: 0 10px 0 #000, 0 0 12px rgba(0,0,0,0.16);
}

.room-main-event-mode .submit-question-button {
  opacity: 0.82;
  transform: translateY(6px) scale(0.96);
  transition: opacity 160ms ease, transform 160ms ease;
}

/* =========================================================
   SESSION PANEL EXTENSIONS
   ========================================================= */

.chaos-session-button {
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

.chaos-session-button::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 18% 16%, rgba(255,255,255,0.22), transparent 28%),
    radial-gradient(circle at 82% 78%, rgba(255,255,255,0.10), transparent 22%);
  pointer-events: none;
  z-index: 0;
}

.chaos-session-button > * {
  position: relative;
  z-index: 1;
}

.chaos-session-button--main-event {
  box-shadow:
    0 16px 0 #000,
    0 0 24px rgba(250,204,21,0.24),
    0 0 0 4px rgba(255,255,255,0.08);
}

.chaos-session-button--forming {
  animation: chaosSessionGlow 2.1s ease-in-out infinite;
}

.chaos-session-button--starting {
  animation: chaosSessionUrgentGlow 900ms ease-in-out infinite;
}

.chaos-session-button--joined {
  box-shadow:
    0 16px 0 #000,
    0 0 24px rgba(34,197,94,0.24),
    0 0 0 4px rgba(255,255,255,0.08);
}

.chaos-session-button--quiet {
  box-shadow:
    0 16px 0 #000,
    0 0 14px rgba(0,0,0,0.14);
}

@keyframes chaosSessionGlow {
  0%, 100% {
    box-shadow:
      0 16px 0 #000,
      0 0 18px rgba(250,204,21,0.18),
      0 0 0 4px rgba(255,255,255,0.05);
  }
  50% {
    box-shadow:
      0 16px 0 #000,
      0 0 34px rgba(250,204,21,0.34),
      0 0 0 4px rgba(255,255,255,0.11);
  }
}

@keyframes chaosSessionUrgentGlow {
  0%, 100% {
    box-shadow:
      0 16px 0 #000,
      0 0 18px rgba(236,72,153,0.22),
      0 0 0 4px rgba(255,255,255,0.06);
  }
  50% {
    box-shadow:
      0 16px 0 #000,
      0 0 32px rgba(236,72,153,0.38),
      0 0 0 4px rgba(255,255,255,0.13);
  }
}

/* =========================================================
   SESSION CONTENT LAYOUT
   ========================================================= */

.chaos-session-inner {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 10px;
  padding: 10px 2px 2px;
}

.chaos-session-topline {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  min-height: 34px;
}

.chaos-session-mainline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.chaos-session-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.chaos-session-headline {
  margin: 0;
  font-weight: 900;
  letter-spacing: -0.03em;
  line-height: 0.92;
  text-transform: uppercase;
  font-size: clamp(2rem, 8vw, 3.25rem);
  text-wrap: balance;
}

.chaos-session-support {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  line-height: 1.15;
  opacity: 0.9;
  max-width: 18rem;
}

.chaos-session-arrow {
  flex: 0 0 auto;
  width: 44px;
  height: 44px;
  border-radius: 999px;
  border: 3px solid rgba(0,0,0,0.9);
  background: rgba(255,255,255,0.18);
  box-shadow: 0 5px 0 #000;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transform: rotate(-6deg);
}

.chaos-session-button:active .chaos-session-arrow {
  transform: rotate(-6deg) translateY(2px);
  box-shadow: 0 3px 0 #000;
}

/* =========================================================
   SESSION BADGE
   ========================================================= */

.chaos-session-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  border: 3px solid rgba(0,0,0,0.88);
  box-shadow: 0 5px 0 #000;
  font-size: 0.74rem;
  font-weight: 1000;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  line-height: 1;
  color: #000;
  width: fit-content;
  max-width: 100%;
  transform: rotate(-2deg);
}

.chaos-session-badge--forming {
  background: linear-gradient(135deg, rgba(34,211,238,0.98), rgba(125,211,252,0.94));
}

.chaos-session-badge--starting {
  background: linear-gradient(135deg, rgba(244,114,182,0.98), rgba(251,146,60,0.95));
}

.chaos-session-badge--live {
  background: linear-gradient(135deg, rgba(250,204,21,0.98), rgba(253,224,71,0.94));
}

.chaos-session-badge--joined {
  background: linear-gradient(135deg, rgba(74,222,128,0.98), rgba(134,239,172,0.94));
}

.chaos-session-badge--quiet {
  color: #fff;
  background: linear-gradient(135deg, rgba(17,24,39,0.95), rgba(55,65,81,0.94));
}

.chaos-live-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #ff2e88;
  border: 2px solid rgba(0,0,0,0.9);
  box-shadow: 0 0 0 2px rgba(255,255,255,0.15);
  animation: chaosLiveDotPulse 1.1s ease-in-out infinite;
  flex: 0 0 auto;
}

.chaos-live-dot--yellow {
  background: #facc15;
}

.chaos-live-dot--green {
  background: #22c55e;
}

@keyframes chaosLiveDotPulse {
  0%, 100% {
    opacity: 0.65;
    transform: scale(0.94);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}

/* =========================================================
   PLAYER STACK + META CHIP
   ========================================================= */

.chaos-session-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  min-height: 34px;
}

.chaos-player-stack {
  display: inline-flex;
  align-items: center;
  padding-left: 2px;
}

.chaos-player-token,
.chaos-player-stack-more {
  width: 28px;
  height: 28px;
  margin-left: -8px;
  border-radius: 999px;
  border: 3px solid rgba(0,0,0,0.9);
  box-shadow: 0 4px 0 #000;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: 1000;
  text-transform: uppercase;
  background: linear-gradient(135deg, rgba(255,255,255,0.96), rgba(226,232,240,0.96));
}

.chaos-player-token:first-child,
.chaos-player-stack-more:first-child {
  margin-left: 0;
}

.chaos-player-stack-more {
  background: linear-gradient(135deg, rgba(192,132,252,0.98), rgba(244,114,182,0.96));
  color: #000;
}

.chaos-session-meta-chip {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  border: 3px solid rgba(0,0,0,0.88);
  box-shadow: 0 4px 0 #000;
  background: rgba(255,255,255,0.18);
  backdrop-filter: blur(3px);
  font-size: 0.7rem;
  font-weight: 1000;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  line-height: 1;
}

/* =========================================================
   JOIN FEEDBACK
   ========================================================= */

.chaos-session-support--success {
  color: rgba(22,101,52,1);
}

.chaos-session-feedback-pop {
  animation: chaosFeedbackPop 180ms ease-out;
}

@keyframes chaosFeedbackPop {
  0% {
    transform: scale(0.98);
  }
  100% {
    transform: scale(1);
  }
}

/* =========================================================
   OPTIONAL DAILIES COLLAPSE STATE
   ========================================================= */

.room-main-event-mode .dailies-section--compact .section-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  max-height: 196px;
  overflow: hidden;
}

.room-main-event-mode .dailies-section--compact .section-button:nth-child(n + 4) {
  opacity: 0.78;
}

/* =========================================================
   REDUCED MOTION
   ========================================================= */

@media (prefers-reduced-motion: reduce) {
  .chaos-session-button--forming,
  .chaos-session-button--starting,
  .chaos-live-dot,
  .chaos-session-feedback-pop {
    animation: none !important;
  }

  .room-main-event-mode .dailies-section,
  .room-main-event-mode .misc-section,
  .room-main-event-mode .interaction-section,
  .room-main-event-mode .submit-question-button,
  .chaos-session-button,
  .chaos-session-arrow {
    transition: none !important;
  }
}
```

---

## 9. JSX structure for the new session content

Windsurf can use this structure directly inside the existing session card.

```tsx
<button
  className={cn(
    "chaos-session-button",
    isMainEventMode && "chaos-session-button--main-event",
    displayState === "forming" && "chaos-session-button--forming",
    displayState === "countdown" && "chaos-session-button--starting",
    displayState === "joined" && "chaos-session-button--joined",
    !isMainEventMode && "chaos-session-button--quiet",
    isJoining && "chaos-session-feedback-pop"
  )}
  data-phase={phase}
  onClick={handleJoin}
>
  <div className="chaos-session-inner">
    <div className="chaos-session-topline">
      <div
        className={cn(
          "chaos-session-badge",
          displayState === "forming" && "chaos-session-badge--forming",
          displayState === "waiting_on_host" && "chaos-session-badge--forming",
          displayState === "countdown" && "chaos-session-badge--starting",
          displayState === "joined" && "chaos-session-badge--joined",
          displayState === "idle" && "chaos-session-badge--quiet",
          (displayState === "answer" || displayState === "vote" || displayState === "results") &&
            "chaos-session-badge--live"
        )}
      >
        {(displayState === "forming" || displayState === "countdown" || displayState === "joined") && (
          <span
            className={cn(
              "chaos-live-dot",
              displayState === "joined" && "chaos-live-dot--green",
              displayState !== "joined" && displayState !== "countdown" && "chaos-live-dot--yellow"
            )}
          />
        )}
        <span>{statusBadgeText}</span>
      </div>
    </div>

    <div className="chaos-session-mainline">
      <div className="chaos-session-copy">
        <h2 className="chaos-session-headline">{headlineText}</h2>
        <p
          className={cn(
            "chaos-session-support",
            joinSuccess && "chaos-session-support--success"
          )}
        >
          {supportText}
        </p>
      </div>

      <div className="chaos-session-arrow" aria-hidden="true">
        ▶
      </div>
    </div>

    {(showPlayerStack || joinedCountText) && (
      <div className="chaos-session-footer">
        {showPlayerStack ? (
          <div className="chaos-player-stack" aria-hidden="true">
            {playerInitials.slice(0, 3).map((initials) => (
              <span key={initials} className="chaos-player-token">
                {initials}
              </span>
            ))}
            {extraPlayers > 0 && (
              <span className="chaos-player-stack-more">+{extraPlayers}</span>
            )}
          </div>
        ) : (
          <span />
        )}

        {joinedCountText ? (
          <div className="chaos-session-meta-chip">{joinedCountText}</div>
        ) : null}
      </div>
    )}
  </div>
</button>
```

---

## 10. Suggested state-to-copy mapping

```ts
function getSessionDisplayCopy(state: SessionDisplayState, ctx: {
  joinedCount?: number;
  totalSlots?: number;
  countdown?: number | null;
  hasJoined?: boolean;
}) {
  const joined = ctx.joinedCount ?? 0;
  const total = ctx.totalSlots ?? 12;

  switch (state) {
    case "idle":
      return {
        statusBadgeText: "LOBBY",
        headlineText: "GAME READY",
        supportText: "WAITING FOR PLAYERS",
        joinedCountText: joined > 0 ? `${joined}/${total} JOINED` : null,
      };

    case "forming":
      return {
        statusBadgeText: "FORMING NOW",
        headlineText: "JOIN GAME",
        supportText: joined > 0
          ? `${joined} PLAYERS IN • DON’T MISS ROUND 1`
          : "DON’T MISS ROUND 1",
        joinedCountText: `${joined}/${total} JOINED`,
      };

    case "waiting_on_host":
      return {
        statusBadgeText: "WAITING ON HOST",
        headlineText: "JOIN GAME",
        supportText: joined > 0 ? `${joined} PLAYERS IN` : "PLAYERS ARE JOINING",
        joinedCountText: `${joined}/${total} JOINED`,
      };

    case "countdown":
      return {
        statusBadgeText: "STARTING",
        headlineText: "JOIN NOW",
        supportText: ctx.countdown ? `STARTING IN ${ctx.countdown}` : "STARTING SOON",
        joinedCountText: `${joined}/${total} JOINED`,
      };

    case "joined":
      return {
        statusBadgeText: "YOU'RE IN",
        headlineText: "GET READY",
        supportText: "WAITING FOR ROUND 1",
        joinedCountText: `${joined}/${total} JOINED`,
      };

    case "answer":
      return {
        statusBadgeText: "ANSWER",
        headlineText: "SUBMIT NOW",
        supportText: "ROUND IS LIVE",
        joinedCountText: null,
      };

    case "vote":
      return {
        statusBadgeText: "VOTE",
        headlineText: "PICK A WINNER",
        supportText: "THE ROOM IS VOTING",
        joinedCountText: null,
      };

    case "results":
      return {
        statusBadgeText: "RESULTS",
        headlineText: "SEE WHO WON",
        supportText: "ROUND COMPLETE",
        joinedCountText: null,
      };

    case "ended":
      return {
        statusBadgeText: "ENDED",
        headlineText: "PLAY AGAIN",
        supportText: "READY FOR ANOTHER ROUND?",
        joinedCountText: null,
      };
  }
}
```

---

## 11. Secondary section behavior

### Interactions section
During Main Event mode:
- keep readable
- reduce saturation slightly
- reduce animation emphasis
- let Session Panel keep the strongest contrast and glow

Recommended wrapper class:
```tsx
<section className={cn("interaction-section", isMainEventMode && "interaction-section--receded")}>
```

### Dailies section
During Main Event mode:
- visually recede harder than Interactions
- keep card style
- shrink emphasis of participant badges
- optionally cap height on very short screens

Recommended wrapper class:
```tsx
<section className={cn("dailies-section", isMainEventMode && "dailies-section--compact")}>
```

### More section
During Main Event mode:
- lowest emphasis
- dim hardest
- no flashy animations

---

## 12. Floating elements rules

### Submit Question button
When the session is forming:
- reduce pulse / glow
- shift a little lower or farther from the hero panel
- never overlap the session card edge

### Reaction overlays
Keep them, but do not let them stack visually over the card copy area.

### Challenge notifications
Do not anchor them over the session CTA if avoidable.

---

## 13. Join interaction behavior

When the user taps the Session Panel:
1. card immediately visually depresses
2. support text changes to `JOINING...`
3. on success:
   - badge becomes `YOU'RE IN`
   - headline becomes `GET READY`
   - support becomes `WAITING FOR ROUND 1`
4. player count updates live if possible

This is important because party environments are noisy and users will double-tap if the UI feels inert.

---

## 14. Metrics to add

Track:
- Session Panel impression in viewport
- Session Panel taps
- join success rate
- time-to-join after forming state begins
- joined-before-countdown vs joined-during-countdown
- whether Main Event mode increased join conversion vs previous baseline

---

## 15. Final implementation instructions for Windsurf

Use this exactly:

```md
Implement the `/room` mobile UI update using the included custom chaos styles.

Important:
- Do not redesign the page into a generic modern web app
- Do not use default component-library badges, pills, or cards
- Extend the existing chaos language already present in `index.css`
- Keep the Session Panel as the hero surface
- Use the included CSS classes directly or very close to directly
- Reuse the JSX structure and state model from this plan
- Make new components feel like they belong next to the existing `.chaos-session-button`, not next to a generic SaaS dashboard

Primary outcome:
When a session is forming, starting, or active, the Session Panel should become the unmistakable primary CTA on mobile.
```

---

## 16. Final recommendation

Use **status + action + proof/timing** as the default structure:
- Badge: `FORMING NOW`
- Headline: `JOIN GAME`
- Support: `4 PLAYERS IN • DON’T MISS ROUND 1`

Then layer in:
- honest countdown only when real
- immediate join feedback
- secondary section recession
- safe chaos motion

That gives you a stronger, more current 2026 fun-web-app feel without flattening your existing visual identity.
