# Implementation Plan: Moderation & Safety Systems

> **Purpose**: Implement the report/block system, rate limiting, and host moderation tools required by the blueprint.  
> **Blueprint context**: "Moderation is non-optional for UGC distribution" — Importance 1 across multiple blueprint sections.  
> **Prerequisite**: Phase A2 (profanity filter) from `02a-blueprint-quick-wins.md` should be complete.  
> **Estimated effort**: 5–7 days total.

---

## Phase B1: Report & Block System (Importance 1)

**Blueprint requirement**: "In-app report + block — required for app store distribution"  
**What it does**: Any player can report another player or a piece of content (chat message, response). Reported players can be blocked (hidden from the reporter's view). Hosts see a moderation queue.

### Database Schema

```sql
-- Reports table
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  reporter_membership_id uuid not null references room_memberships(id) on delete cascade,
  reported_membership_id uuid references room_memberships(id) on delete set null,
  content_type text not null,             -- 'player', 'chat_message', 'response', 'interaction'
  content_id uuid,                        -- ID of the reported content (message ID, response ID, etc.)
  reason text not null,                   -- 'inappropriate', 'spam', 'harassment', 'cheating', 'other'
  description text,                       -- Optional free-text from reporter
  status text not null default 'pending', -- 'pending', 'reviewed', 'actioned', 'dismissed'
  reviewed_by uuid references room_memberships(id),
  reviewed_at timestamptz,
  action_taken text,                      -- 'none', 'warned', 'muted', 'kicked', 'banned'
  created_at timestamptz not null default now()
);

create index idx_reports_room on reports(room_id);
create index idx_reports_status on reports(status);

-- Player blocks (client-side filtering)
create table if not exists player_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_membership_id uuid not null references room_memberships(id) on delete cascade,
  blocked_membership_id uuid not null references room_memberships(id) on delete cascade,
  room_id uuid not null references rooms(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(blocker_membership_id, blocked_membership_id)
);

create index idx_player_blocks_blocker on player_blocks(blocker_membership_id);
```

### Service Layer

```typescript
// src/services/reportService.ts
//
// submitReport(params): INSERT into reports
// getReportsForRoom(roomId, status?): SELECT reports with reporter/reported names
// reviewReport(reportId, action, reviewerMembershipId): UPDATE status + action_taken
// dismissReport(reportId, reviewerMembershipId): UPDATE status = 'dismissed'
//
// blockPlayer(blockerMembershipId, blockedMembershipId, roomId): INSERT into player_blocks
// unblockPlayer(blockerMembershipId, blockedMembershipId): DELETE from player_blocks
// getBlockedPlayers(membershipId): SELECT blocked membership IDs
```

### Hook

```typescript
// src/hooks/useBlocks.ts
//
// Loads blocked player IDs for the current user's membership.
// Exposes: { blockedIds, blockPlayer, unblockPlayer, isBlocked(membershipId) }
// Used by chat and interaction components to filter out blocked players' content.
```

```typescript
// src/hooks/useReports.ts (host-only)
//
// Loads pending reports for the room.
// Exposes: { reports, reviewReport, dismissReport, pendingCount }
// Real-time subscription on reports table for new reports.
```

### UI Components

**Report Button** (`src/shared/components/ReportButton.tsx`):
- Small flag icon button, appears on:
  - Chat messages (long-press on mobile, hover on desktop)
  - Player names in the lobby/roster
  - Interaction responses
- Opens a report modal with reason selection + optional description

**Report Modal** (`src/shared/components/ReportModal.tsx`):
- Reason picker: Inappropriate, Spam, Harassment, Cheating, Other
- Optional text description
- Submit → toast confirmation "Report submitted"
- After reporting a player, offer "Block this player?" toggle

**Block Confirmation** (`src/shared/components/BlockConfirmation.tsx`):
- "Block [PlayerName]? You won't see their messages or responses."
- Confirm / Cancel

**Host Moderation Panel** (`src/features/room/components/moderation/ModerationPanel.tsx`):
- Accessible from host sidebar or a new "Mod" button in the room header
- Shows pending reports with:
  - Reporter name, reported player/content, reason, timestamp
  - Quick actions: Dismiss, Warn, Mute (future), Kick, Ban
- Badge count on the Mod button showing pending report count

### Integration Points

| Component | Change |
|-----------|--------|
| `ChatPanel.tsx` | Add ReportButton on each message; filter out blocked players' messages |
| `LobbyPanel.tsx` | Add ReportButton on player names |
| `InteractionCard.tsx` | Add ReportButton on responses |
| `RoomSidebar.tsx` (desktop) | Add ModerationPanel tab for hosts |
| `BottomNav.tsx` (mobile) | Add Mod button with badge for hosts |
| `useRoomChat.ts` | Filter messages from blocked players before rendering |
| `useInteractions.ts` | Filter responses from blocked players |

### Files to Create
| File | Purpose |
|------|---------|
| `src/services/reportService.ts` | Report CRUD |
| `src/hooks/useReports.ts` | Host report queue hook |
| `src/hooks/useBlocks.ts` | Player block hook |
| `src/shared/components/ReportButton.tsx` | Report trigger |
| `src/shared/components/ReportModal.tsx` | Report form |
| `src/shared/components/BlockConfirmation.tsx` | Block confirmation |
| `src/features/room/components/moderation/ModerationPanel.tsx` | Host moderation queue |

### Test
- Player A reports Player B's chat message → report appears in host's moderation panel
- Player A blocks Player B → Player B's messages disappear from Player A's view
- Host reviews report → can kick/ban the reported player directly from the panel
- Unblocking restores visibility

---

## Phase B2: Rate Limiting (Importance 1)

**Blueprint requirement**: "Rate limiting on submissions — security gap"  
**What it does**: Prevents spam floods on chat, reactions, responses, and join attempts.

### Architecture

Implement **client-side throttling** (immediate UX feedback) + **server-side RLS policies** (security enforcement).

### Client-Side Throttling

```typescript
// src/shared/utils/rateLimiter.ts
//
// createRateLimiter(maxActions: number, windowMs: number)
// Returns: { canAct(): boolean, reset(): void }
//
// Usage:
//   const chatLimiter = createRateLimiter(5, 10_000); // 5 messages per 10 seconds
//   if (!chatLimiter.canAct()) { toast("Slow down!"); return; }
```

### Rate Limit Configuration

```typescript
// src/shared/constants/rateLimits.ts
export const RATE_LIMITS = {
  chat: { maxActions: 5, windowMs: 10_000 },       // 5 messages per 10s
  reaction: { maxActions: 1, windowMs: 2_000 },     // 1 reaction per 2s
  response: { maxActions: 3, windowMs: 30_000 },    // 3 response edits per 30s
  vote: { maxActions: 2, windowMs: 10_000 },         // 2 vote changes per 10s
  join: { maxActions: 3, windowMs: 60_000 },         // 3 join attempts per 60s
  report: { maxActions: 3, windowMs: 300_000 },      // 3 reports per 5 minutes
} as const;
```

### Server-Side (Supabase RLS / Edge Functions)

For critical paths (join, vote, answer submission), add Supabase RLS policies or Edge Functions that enforce rate limits:

```sql
-- Example: Prevent rapid join attempts
-- This would be an Edge Function or a Postgres function that checks
-- the count of recent room_memberships inserts for the same user_id
-- within the last 60 seconds.
```

**Recommendation**: Start with client-side only. Add server-side enforcement as an Edge Function for the `joinRoom` and `submitResponse` paths in a follow-up.

### Integration Points

| Service/Hook | Rate Limit |
|-------------|------------|
| `useRoomChat.ts` → `sendMessage()` | Chat limiter |
| `useReactions.ts` → `sendReaction()` | Reaction limiter |
| `interactionService.ts` → `submitResponse()` | Response limiter |
| `interactionService.ts` → `submitVote()` | Vote limiter |
| `roomMembershipService.ts` → `joinRoom()` | Join limiter |
| `reportService.ts` → `submitReport()` | Report limiter |

### Files to Create
| File | Purpose |
|------|---------|
| `src/shared/utils/rateLimiter.ts` | Rate limiter utility |
| `src/shared/constants/rateLimits.ts` | Rate limit config |

### Files to Modify
| File | Change |
|------|--------|
| `src/hooks/useRoomChat.ts` | Add chat rate limiter |
| `src/hooks/useReactions.ts` | Add reaction rate limiter |
| `src/services/interactionService.ts` | Add response/vote rate limiters |
| `src/services/roomMembershipService.ts` | Add join rate limiter |

### Test
- Send 6 chat messages in 10 seconds → 6th is blocked with "Slow down" toast
- Rapid-tap reactions → only 1 per 2 seconds goes through
- Try joining 4 times in 60 seconds → 4th attempt blocked

---

## Phase B3: Host Moderation Controls (Importance 1–2)

**Blueprint requirement**: "Host moderation console — queues, approvals, mutes"  
**What it does**: Extends existing kick/ban with mute and message-level moderation.

### Database Changes

```sql
-- Add mute support to room_memberships
alter table room_memberships add column if not exists is_muted boolean default false;
alter table room_memberships add column if not exists muted_at timestamptz;
alter table room_memberships add column if not exists muted_by uuid references room_memberships(id);
alter table room_memberships add column if not exists mute_expires_at timestamptz; -- null = permanent until unmuted

-- Add hidden/flagged support to room_messages
alter table room_messages add column if not exists is_hidden boolean default false;
alter table room_messages add column if not exists hidden_by uuid references room_memberships(id);
alter table room_messages add column if not exists hidden_at timestamptz;
```

### Service Layer Extensions

```typescript
// src/services/roomMembershipService.ts — add:
// muteMember(roomId, membershipId, mutedBy, expiresAt?): UPDATE is_muted = true
// unmuteMember(roomId, membershipId): UPDATE is_muted = false
```

```typescript
// src/services/chatModerationService.ts — new:
// hideMessage(messageId, hiddenBy): UPDATE is_hidden = true
// unhideMessage(messageId): UPDATE is_hidden = false
// getHiddenMessages(roomId): SELECT hidden messages for review
```

### UI Changes

**Mute button** in player roster (host-only):
- Next to existing Kick/Ban buttons
- Shows duration picker: 5 min, 15 min, 30 min, Permanent
- Muted players see "You are muted" when trying to send chat messages

**Message moderation** in chat panel (host-only):
- Hover/long-press on any message → "Hide" button
- Hidden messages show as "[Message hidden by host]" for all players
- Host can unhide from the moderation panel

**"Slow mode" toggle** in room settings:
- When enabled, all players are rate-limited to 1 message per 10 seconds (overrides default rate limit)
- Add `slowMode: boolean` to `RoomSettings`

### Files to Create
| File | Purpose |
|------|---------|
| `src/services/chatModerationService.ts` | Message hide/unhide |

### Files to Modify
| File | Change |
|------|--------|
| `src/services/roomMembershipService.ts` | Add mute/unmute |
| `src/domain/types/room.types.ts` | Add `isMuted`, `mutedAt`, `muteExpiresAt` to `RoomMembership`; add `slowMode` to `RoomSettings` |
| `src/hooks/useRoomChat.ts` | Check `isMuted` before sending; filter hidden messages |
| `ChatPanel.tsx` | Show "Hide" button for host; show "[Hidden]" placeholder |
| `LobbyPanel.tsx` | Add Mute button next to Kick/Ban |

### Test
- Host mutes Player A → Player A sees "You are muted" when trying to chat
- Host hides a message → all players see "[Message hidden by host]"
- Mute with 5-min expiry → player can chat again after 5 minutes
- Slow mode on → all players limited to 1 message per 10 seconds

---

## Deployment Order

```
B1 (Report/Block)  →  B2 (Rate Limiting)  →  B3 (Host Moderation)

B1 and B2 are independent and can be done in parallel.
B3 depends on B1 (moderation panel) and B2 (rate limiting infrastructure).
```

---

## Verification Checklist

| Check | How |
|-------|-----|
| Report flow works end-to-end | Player reports → host sees in panel → host actions |
| Block hides content | Blocked player's messages/responses not visible |
| Rate limits enforce | Rapid actions are throttled with user feedback |
| Mute prevents chat | Muted player cannot send messages |
| Message hiding works | Hidden messages show placeholder for all players |
| No regressions | Existing kick/ban still works; chat still works for non-muted players |
