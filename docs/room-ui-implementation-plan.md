# Mobile Room UI Implementation Plan
## Session-First Chaos Update for `/room`

This plan rewrites the mobile room-page upgrade as an implementation-ready spec for Windsurf, with **custom chaos-styled UI rules and copy-pasteable CSS** included.

It is based on:
- the current `/room` page structure, where the **Session Panel** is the primary mobile focal point when active and Dailies / Interactions / More are secondary surfaces
- the current chaos design system already present in `index.css`, especially the existing `.chaos-session-button` and related loud, chunky, neobrutal styling
- the research conclusion that the current issue is **hierarchy + meaning**, not aesthetic direction

---

## 1. Core directive

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
