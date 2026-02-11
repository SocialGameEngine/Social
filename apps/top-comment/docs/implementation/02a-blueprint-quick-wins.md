# Implementation Plan: Blueprint Quick Wins (Low Effort, High Impact)

> **Purpose**: Implement the fastest-to-ship features from the Competitive Blueprint comparison.  
> **Prerequisite**: Phase 1–2 of `01-bugs-and-refactoring.md` should be complete (bugs fixed, legacy team code removed).  
> **Estimated effort**: 3–5 days total for all items below.

---

## Phase A1: Live Reactions (Emoji Bursts)

**Blueprint priority**: Importance 1 (highest), Complexity Low  
**Comparison gap**: "High-value, low-complexity gap"  
**What it does**: Players tap predefined emoji reactions during results/between rounds. Reactions aggregate in real-time on all clients and the presenter view.

### Database Schema

```sql
-- New table: room_reactions
create table if not exists room_reactions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  membership_id uuid not null references room_memberships(id) on delete cascade,
  emoji text not null,                    -- e.g., '🔥', '😂', '👏', '💀', '🎉'
  context_type text not null default 'general',  -- 'general', 'results', 'answer_reveal'
  context_id text,                        -- optional: interaction_id or session_id
  created_at timestamptz not null default now()
);

create index idx_room_reactions_room on room_reactions(room_id);
create index idx_room_reactions_created on room_reactions(created_at);

-- Auto-expire old reactions (optional cleanup function)
-- Reactions older than 1 hour can be purged by a cron job
```

### Allowed Emoji Set (Hardcoded)

```typescript
// src/shared/constants/reactions.ts
export const REACTION_EMOJIS = ['🔥', '😂', '👏', '💀', '🎉', '😮'] as const;
export type ReactionEmoji = typeof REACTION_EMOJIS[number];

// Throttle: max 1 reaction per player per 2 seconds
export const REACTION_THROTTLE_MS = 2000;
```

### Service Layer

```typescript
// src/services/reactionService.ts
// - submitReaction(roomId, membershipId, emoji): INSERT into room_reactions
// - getRecentReactions(roomId, sinceSeconds): SELECT last N seconds of reactions
```

### Hook

```typescript
// src/hooks/useReactions.ts
// - Subscribe to room_reactions INSERT events via Supabase Realtime
// - Maintain a rolling window of recent reactions (last 5 seconds)
// - Expose: { reactions, sendReaction, reactionCounts }
// - Client-side throttle: ignore rapid taps within REACTION_THROTTLE_MS
```

### UI Components

**Reaction Bar** (`src/features/room/components/ReactionBar.tsx`):
- Horizontal row of emoji buttons, fixed at bottom of screen (above bottom nav on mobile)
- Each button shows the emoji + a small count badge if reactions are active
- Tap sends reaction; button briefly pulses/scales on tap
- Visible during `results` phase and between interactions

**Reaction Overlay** (`src/features/room/components/ReactionOverlay.tsx`):
- Floating emoji animations that rise from bottom of screen when reactions come in
- CSS animations only (no JS animation library needed)
- Aggregate: if 5+ of the same emoji in 2 seconds, show a "burst" effect
- Position: absolute overlay on top of main content, pointer-events: none

**Presenter View Integration**:
- Show reaction counts as a heatmap bar or floating emojis on the presenter screen
- Aggregate counts per emoji, update every 1 second

### Integration Points

- Add `<ReactionBar />` to `RoomPageContent` (both mobile and desktop layouts)
- Add `<ReactionOverlay />` as a portal/overlay in `RoomPage`
- Add reaction display to `PresenterPage`

### Files to Create
| File | Purpose |
|------|---------|
| `src/shared/constants/reactions.ts` | Emoji set, throttle config |
| `src/services/reactionService.ts` | Supabase CRUD |
| `src/hooks/useReactions.ts` | Realtime hook |
| `src/features/room/components/ReactionBar.tsx` | Emoji button row |
| `src/features/room/components/ReactionOverlay.tsx` | Floating animation |

### Files to Modify
| File | Change |
|------|--------|
| `RoomPageContent.tsx` | Add ReactionBar + ReactionOverlay |
| `PresenterPage.tsx` | Add reaction display |

### Test
- Two browser tabs in the same room; tap 🔥 in one → see floating 🔥 in both
- Rapid tapping is throttled (max 1 per 2s)
- Presenter view shows aggregated counts

---

## Phase A2: System-Wide Profanity Filtering

**Blueprint priority**: Importance 2, Complexity Medium  
**Comparison gap**: "Exists in Headline Fibbage settings — needs to be system-wide"  
**What it does**: Filter profanity from all user-generated text (chat messages, prompt responses, player names, interaction responses).

### Architecture

Create a shared utility that wraps a word-list-based filter. Apply it at the service layer (before INSERT) so it works for all features.

### Implementation

```typescript
// src/shared/utils/profanityFilter.ts
// 
// - loadWordList(): Load a profanity word list (ship a static JSON file)
// - containsProfanity(text: string): boolean
// - censorText(text: string): string — replaces bad words with '***'
// - Configurable strictness levels: 'strict' | 'moderate' | 'off'
// - Room-level setting: rooms.settings.profanityFilter = 'strict' | 'moderate' | 'off'
```

**Word list source**: Use an open-source profanity list (e.g., `bad-words` npm package list, or a curated JSON file). Ship as a static JSON import — no runtime dependency.

### Integration Points

Apply `censorText()` at these service-layer insertion points:

| Service | Function | Field to Filter |
|---------|----------|-----------------|
| `roomMembershipService.ts` | `joinRoom()` | `playerName` |
| `interactionService.ts` | `submitResponse()` | response `text` |
| `useRoomChat.ts` | `sendMessage()` | `content` |
| `interactionService.ts` | `createInteraction()` | `question` |
| `interactionService.ts` | `createHeadlineInteraction()` | headline text |

### Room Settings Extension

Add to `RoomSettings` type:
```typescript
profanityFilter?: 'strict' | 'moderate' | 'off';
```

Default: `'moderate'` for new rooms. Host can toggle in room settings.

### Files to Create
| File | Purpose |
|------|---------|
| `src/shared/utils/profanityFilter.ts` | Filter logic |
| `src/shared/data/profanity-wordlist.json` | Word list |

### Files to Modify
| File | Change |
|------|--------|
| `src/services/roomMembershipService.ts` | Filter player names |
| `src/services/interactionService.ts` | Filter responses and prompts |
| `src/hooks/useRoomChat.ts` | Filter chat messages |
| `src/domain/types/room.types.ts` | Add `profanityFilter` to `RoomSettings` |

### Test
- Join a room with a profane player name → name is censored
- Send a chat message with profanity → message is censored
- Submit a prompt response with profanity → response is censored
- Host sets filter to `'off'` → no censoring

---

## Phase A3: PWA Manifest & Install Prompts

**Blueprint priority**: Importance 1 (architecture), Complexity Low  
**Comparison gap**: "Web-first SPA on Vercel; no PWA manifest mentioned"  
**What it does**: Enables "Add to Home Screen" on mobile devices, giving the app an app-like presence.

### Implementation

**1. Create `public/manifest.json`**:
```json
{
  "name": "Pub Söcial",
  "short_name": "Söcial",
  "description": "Live crowd-powered games for bars and pubs",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#ff00ff",
  "orientation": "portrait",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

**2. Add manifest link to `index.html`**:
```html
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#ff00ff" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<link rel="apple-touch-icon" href="/icons/icon-192.png" />
```

**3. Generate icons**: Create 192×192 and 512×512 PNG versions of the logo. Place in `public/icons/`.

**4. Optional: Basic service worker** (cache app shell only — NOT offline gameplay yet):
```typescript
// public/sw.js
// Precache: index.html, main JS/CSS bundles, logo, manifest
// Strategy: network-first for API calls, cache-first for static assets
// This is a minimal shell cache — full offline support is a separate phase
```

Register in `main.tsx`:
```typescript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

### Files to Create
| File | Purpose |
|------|---------|
| `public/manifest.json` | PWA manifest |
| `public/icons/icon-192.png` | App icon |
| `public/icons/icon-512.png` | App icon |
| `public/icons/icon-maskable-512.png` | Maskable icon |
| `public/sw.js` | Minimal service worker (shell cache only) |

### Files to Modify
| File | Change |
|------|--------|
| `index.html` | Add manifest link, meta tags, apple-touch-icon |
| `src/main.tsx` | Register service worker |

### Test
- Open app on mobile Chrome → "Add to Home Screen" prompt appears
- Open app on iOS Safari → "Add to Home Screen" via share sheet works
- App launches in standalone mode from home screen
- Lighthouse PWA audit passes basic checks

---

## Phase A4: Keyboard Shortcuts for Host

**Blueprint priority**: Importance 1 (host dashboard), Complexity Low  
**Comparison gap**: "Keyboard shortcuts for host speed — not mentioned"  
**What it does**: Lets hosts control game flow without mouse clicks.

### Implementation

```typescript
// src/hooks/useHostKeyboardShortcuts.ts
// 
// Listens for keyboard events when user is host.
// Only active when host is on the RoomPage or HostPage.
//
// Shortcuts:
//   Space     → Primary action (Start Game / Lock Answers / Lock Votes / Next Round)
//   Escape    → Close active modal
//   P         → Pause/Resume session
//   N         → Send new prompt
//   L         → Toggle leaderboard
//   ?         → Toggle help drawer
//
// Guard: Only fires if no input/textarea is focused (prevent conflicts with typing)
```

### Integration

- Import and call `useHostKeyboardShortcuts()` in `RoomPageContent.tsx` (or wherever host actions are dispatched)
- Pass the relevant action handlers as callbacks
- Show shortcut hints in the Help drawer

### Files to Create
| File | Purpose |
|------|---------|
| `src/hooks/useHostKeyboardShortcuts.ts` | Keyboard shortcut hook |

### Files to Modify
| File | Change |
|------|--------|
| `RoomPageContent.tsx` (or equivalent) | Wire up the hook |
| `HelpDrawer.tsx` | Add keyboard shortcut reference section |

### Test
- As host, press Space → primary action fires
- While typing in chat, Space does NOT trigger action
- Press `?` → help drawer toggles

---

## Deployment Order

```
A1 (Reactions)  →  can ship independently
A2 (Profanity)  →  can ship independently
A3 (PWA)        →  can ship independently
A4 (Shortcuts)  →  can ship independently

All four are independent — ship in any order or in parallel.
```
