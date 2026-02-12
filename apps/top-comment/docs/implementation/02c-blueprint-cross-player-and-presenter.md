# Implementation Plan: Cross-Player Interactions & Presenter Hardening

> **Purpose**: Implement the blueprint's core differentiator (peer-to-peer interactions) and harden the presenter view for real venue conditions.  
> **Prerequisite**: Phases A1–A2 (reactions, profanity filter) and B1 (report/block) should be complete.  
> **Estimated effort**: 8–12 days total.

---

## Phase C1: Cross-Player Targeting Layer (The Core Differentiator)

**Blueprint priority**: Importance 1–2 across multiple features  
**Comparison insight**: "What you're missing is the cross-player targeting layer — the ability for Player A to direct an action at Player B or a group."  
**What it does**: Extends the existing `interactions` table with a `target` concept, enabling directed challenges, reactions, and future rivalry mechanics.

### Database Schema Changes

```sql
-- Extend interactions table with targeting
alter table interactions add column if not exists target_type text default 'broadcast';
  -- 'broadcast' = host → all players (existing behavior)
  -- 'player'    = player → specific player
  -- 'challenge' = player → player (competitive, with accept/decline)

alter table interactions add column if not exists target_membership_id uuid references room_memberships(id) on delete set null;
  -- null for broadcast; set for player-targeted interactions

alter table interactions add column if not exists source_membership_id uuid references room_memberships(id) on delete set null;
  -- Who initiated this interaction (null = host, set = player)

alter table interactions add column if not exists challenge_status text;
  -- null for non-challenges; 'pending', 'accepted', 'declined', 'expired'

alter table interactions add column if not exists challenge_expires_at timestamptz;
  -- Auto-expire challenges after N seconds

alter table interactions add column if not exists points_wager integer default 0;
  -- Virtual points wagered on this challenge (0 = no wager)

create index idx_interactions_target on interactions(target_membership_id);
create index idx_interactions_source on interactions(source_membership_id);
create index idx_interactions_challenge_status on interactions(challenge_status);
```

### New Interaction Types

```typescript
// Extend InteractionType in src/domain/types/interaction.types.ts
export type InteractionType = 
  | 'prompt'              // existing: host sends prompt
  | 'headline_fibbage'    // existing: fill-in-the-blank
  | 'challenge'           // NEW: player challenges another player
  | 'directed_reaction'   // NEW: player sends targeted reaction to another
  | 'audience_question';  // NEW: player submits a question for host review
```

### Service Layer

```typescript
// src/services/challengeService.ts
//
// sendChallenge(params: {
//   roomId: string,
//   sourceMembershipId: string,
//   targetMembershipId: string,
//   question: string,           // The challenge prompt
//   pointsWager?: number,       // Virtual points to wager
//   expiresInSeconds?: number,  // Default: 30 seconds
// }): Promise<Interaction>
//
// respondToChallenge(interactionId: string, membershipId: string, accept: boolean): Promise<void>
//   - If accepted: challenge_status = 'accepted', both players answer
//   - If declined: challenge_status = 'declined', no point change
//   - If expired: challenge_status = 'expired' (handled by a check on read)
//
// getChallengesForPlayer(roomId: string, membershipId: string): Promise<Interaction[]>
//   - Returns challenges where target_membership_id = membershipId AND status = 'pending'
//
// resolveChallenge(interactionId: string): Promise<{ winnerId: string, loserId: string, points: number }>
//   - Compare responses, determine winner, update scores
```

### Hook

```typescript
// src/hooks/useChallenges.ts
//
// Subscribes to interactions where:
//   target_membership_id = myMembershipId AND challenge_status = 'pending'
//
// Exposes:
//   { 
//     pendingChallenges: Interaction[],
//     sentChallenges: Interaction[],
//     sendChallenge(targetMembershipId, question, pointsWager?),
//     acceptChallenge(interactionId),
//     declineChallenge(interactionId),
//     pendingCount: number,
//   }
//
// Real-time: subscribe to interactions table filtered by target_membership_id
```

### UI Components

**Challenge Button** (`src/features/room/components/challenges/ChallengeButton.tsx`):
- Appears next to player names in the lobby/roster
- "Challenge [PlayerName]" → opens challenge creation modal
- Not shown for self or for the host

**Challenge Creation Modal** (`src/features/room/components/challenges/ChallengeModal.tsx`):
- Select a prompt (from prompt library or type custom)
- Optional: wager virtual points (slider: 0–100)
- "Send Challenge" → creates the interaction
- Shows "Waiting for [PlayerName] to respond..." with countdown

**Challenge Notification** (`src/features/room/components/challenges/ChallengeNotification.tsx`):
- Toast-style notification that slides in when a challenge is received
- Shows: "[PlayerName] challenges you! [prompt preview]"
- Buttons: Accept / Decline
- Auto-expires after 30 seconds with visual countdown
- If accepted, opens the answer modal for both players

**Challenge Results** (`src/features/room/components/challenges/ChallengeResults.tsx`):
- After both players answer and vote (or host judges):
  - Winner gets wagered points
  - Loser loses wagered points (or 0 if no wager)
  - Show "🏆 [Winner] wins [X] points!"

### Integration Points

| Component | Change |
|-----------|--------|
| `LobbyPanel.tsx` | Add ChallengeButton next to each player name |
| `RoomPageContent.tsx` | Add ChallengeNotification overlay |
| `useInteractions.ts` | Extend to handle challenge-type interactions |
| `InteractionSection.tsx` | Show active challenges in the interaction feed |
| `PresenterPage.tsx` | Show active challenges on the big screen |

### Files to Create
| File | Purpose |
|------|---------|
| `src/services/challengeService.ts` | Challenge CRUD + resolution |
| `src/hooks/useChallenges.ts` | Real-time challenge hook |
| `src/features/room/components/challenges/ChallengeButton.tsx` | Trigger |
| `src/features/room/components/challenges/ChallengeModal.tsx` | Creation form |
| `src/features/room/components/challenges/ChallengeNotification.tsx` | Incoming notification |
| `src/features/room/components/challenges/ChallengeResults.tsx` | Outcome display |

### Files to Modify
| File | Change |
|------|--------|
| `src/domain/types/interaction.types.ts` | Add new interaction types |
| `src/services/interactionService.ts` | Handle challenge fields in mappers |
| `src/hooks/useInteractions.ts` | Filter/include challenge interactions |
| `LobbyPanel.tsx` | Add challenge buttons |
| `RoomPageContent.tsx` | Add challenge notification layer |
| `PresenterPage.tsx` | Show challenges |

### Test
- Player A challenges Player B → B receives notification
- B accepts → both see the prompt and can answer
- B declines → challenge dismissed, no point change
- Challenge expires after 30s if no response
- Points transfer correctly on resolution
- Challenge appears on presenter view

---

## Phase C2: Audience-Sourced Question Submission (Importance 2)

**Blueprint requirement**: "Audience-sourced question submission — builds community ownership"  
**Comparison insight**: "Your async interaction system is essentially this infrastructure — foundation exists"  
**What it does**: Players can submit questions/prompts that the host can review and use in future rounds.

### Database Schema

```sql
-- Audience question submissions
create table if not exists audience_submissions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  membership_id uuid not null references room_memberships(id) on delete cascade,
  question_text text not null,
  category text,                          -- optional category tag
  status text not null default 'pending', -- 'pending', 'approved', 'rejected', 'used'
  reviewed_by uuid references room_memberships(id),
  reviewed_at timestamptz,
  rejection_reason text,
  used_in_session_id uuid references top_comment_sessions(id),
  created_at timestamptz not null default now()
);

create index idx_audience_submissions_room on audience_submissions(room_id);
create index idx_audience_submissions_status on audience_submissions(status);
```

### Service Layer

```typescript
// src/services/audienceSubmissionService.ts
//
// submitQuestion(roomId, membershipId, questionText, category?): INSERT
// getSubmissions(roomId, status?): SELECT with submitter name
// approveSubmission(submissionId, reviewerMembershipId): UPDATE status = 'approved'
// rejectSubmission(submissionId, reviewerMembershipId, reason?): UPDATE status = 'rejected'
// markUsed(submissionId, sessionId): UPDATE status = 'used'
// getApprovedSubmissions(roomId): SELECT approved, unused submissions
```

### Hook

```typescript
// src/hooks/useAudienceSubmissions.ts
//
// For players: { submitQuestion, mySubmissions }
// For hosts: { submissions, approveSubmission, rejectSubmission, pendingCount }
// Real-time: subscribe to audience_submissions for the room
```

### UI Components

**Submit Question Button** (player-facing):
- Appears in the room canvas area or as a floating action
- Opens a simple form: text input + optional category dropdown
- After submit: "Your question has been submitted for review!"
- Show "My Submissions" list with status badges (pending/approved/rejected)

**Submission Review Panel** (host-facing):
- Tab in the host sidebar or moderation panel
- Shows pending submissions with:
  - Submitter name, question text, category, timestamp
  - Quick actions: Approve, Reject (with optional reason), Edit & Approve
- Approved submissions appear in the host's prompt selection when starting a new round
- Badge count on the tab showing pending submissions

### Integration with Existing Prompt System

When host starts a new session or sends a new prompt:
- Show an "Audience Submissions" section alongside the prompt library picker
- Approved submissions appear as selectable prompts
- Using a submission marks it as `used` and attributes it: "Submitted by [PlayerName]"

### Files to Create
| File | Purpose |
|------|---------|
| `src/services/audienceSubmissionService.ts` | Submission CRUD |
| `src/hooks/useAudienceSubmissions.ts` | Real-time hook |
| `src/features/room/components/submissions/SubmitQuestionButton.tsx` | Player trigger |
| `src/features/room/components/submissions/SubmitQuestionModal.tsx` | Submission form |
| `src/features/room/components/submissions/SubmissionReviewPanel.tsx` | Host review |
| `src/features/room/components/submissions/MySubmissions.tsx` | Player's own submissions |

### Files to Modify
| File | Change |
|------|--------|
| `RoomPageContent.tsx` | Add SubmitQuestionButton for players |
| `RoomSidebar.tsx` | Add SubmissionReviewPanel tab for hosts |
| `SendPromptModal.tsx` | Add "Audience Submissions" section |
| `InteractionSection.tsx` | Show "Submitted by [Player]" attribution |

### Test
- Player submits a question → appears in host's review panel
- Host approves → question appears in prompt selection
- Host rejects with reason → player sees rejection status
- Host uses approved question → attributed to submitter

---

## Phase C3: Presenter View Hardening (Importance 1)

**Blueprint requirement**: "Auto-reconnection, local caching of current state — gap for venue reliability"  
**What it does**: Makes the presenter view resilient to network drops, auto-reconnects, and caches the last known state.

### Architecture

The presenter view needs three reliability layers:
1. **Auto-reconnect** — detect disconnection and re-establish Supabase Realtime channels
2. **Local state cache** — persist the last known room/session state to `localStorage`
3. **Stale indicator** — show "Reconnecting..." overlay when disconnected

### Implementation

**1. Connection Health Monitor** (`src/shared/hooks/useConnectionHealth.ts`):
```typescript
// Monitors Supabase Realtime connection status
// Exposes: { isConnected, lastConnectedAt, reconnectAttempts }
// On disconnect: increment reconnectAttempts, show indicator
// On reconnect: refresh all data, clear indicator
// Uses exponential backoff for reconnection attempts
```

**2. Local State Cache** (`src/shared/utils/presenterCache.ts`):
```typescript
// Persists presenter state to localStorage:
//   - Current session (status, round, prompt, timer)
//   - Current leaderboard
//   - Active interactions
//   - Room info (code, name)
//
// On load: read from cache first, then fetch fresh data
// On each state update: write to cache
// Cache key: `presenter_${sessionId}`
// TTL: 24 hours (auto-clear old caches)
```

**3. Reconnection Overlay** (`src/features/presenter/components/ReconnectionOverlay.tsx`):
```typescript
// Full-screen semi-transparent overlay shown when disconnected
// Shows: "Reconnecting..." with a spinner
// Shows: "Last updated X seconds ago"
// Below the overlay, the last cached state is still visible
// Auto-dismisses when connection is restored
```

**4. Presenter Page Updates** (`src/features/presenter/PresenterPage.tsx`):
- Integrate `useConnectionHealth` hook
- On mount: load from cache, then fetch fresh
- On each Realtime event: update state + write to cache
- On disconnect: show overlay, keep displaying cached state
- On reconnect: full refresh, dismiss overlay
- Add `visibilitychange` listener: when tab becomes visible again, force refresh

### Files to Create
| File | Purpose |
|------|---------|
| `src/shared/hooks/useConnectionHealth.ts` | Connection monitoring |
| `src/shared/utils/presenterCache.ts` | localStorage cache |
| `src/features/presenter/components/ReconnectionOverlay.tsx` | Disconnect UI |

### Files to Modify
| File | Change |
|------|--------|
| `src/features/presenter/PresenterPage.tsx` | Integrate cache, health monitor, overlay |

### Test
- Open presenter view → shows current state
- Kill network (DevTools offline mode) → "Reconnecting..." overlay appears, last state still visible
- Restore network → overlay dismisses, data refreshes
- Close and reopen presenter tab → loads cached state instantly, then refreshes

---

## Phase C4: Complete Headline Fibbage Backend (Importance 2)

**Blueprint context**: Deep analysis identified this as "80% done but uses mock data"  
**What it does**: Replace mock/hardcoded data in Headline Fibbage voting and results with real Supabase queries.

### Current State (Mock Functions to Replace)

From the deep analysis, these functions return hardcoded data:
- `getVotingOptions()` — returns mock voting options
- `getHeadlineResults()` — returns mock results
- `submitHeadlineVote()` — console.log no-op

### Implementation

**1. Verify/create database tables for headline fibbage**:
```sql
-- These may already exist in the interactions system.
-- Headline fibbage responses are stored in the `responses` table.
-- Headline fibbage votes are stored in the `interaction_votes` table.
-- Verify the schema supports:
--   - response.text = the player's fill-in-the-blank answer
--   - interaction.settings = { headlineBlank, sourceName, publishedAt, ... }
--   - interaction_votes.response_id = the response being voted for
```

**2. Replace mock functions in `HeadlineVoteModal.tsx`**:
- Fetch real responses from `interactionService.getResponses(interactionId)`
- Include the "real" answer as one of the options (from interaction settings)
- Shuffle options so the real answer isn't always in the same position

**3. Replace mock functions in `HeadlineResultsModal.tsx`**:
- Fetch real votes from `interactionService.getVotes(interactionId)`
- Calculate which players were "fooled" (voted for a fake answer)
- Calculate scores: points for fooling others + points for guessing correctly

**4. Implement `submitHeadlineVote()`**:
- Call `interactionService.submitVote(interactionId, membershipId, responseId)`
- Same as regular interaction votes — the infrastructure exists

### Files to Modify
| File | Change |
|------|--------|
| `src/features/room/components/interactions/HeadlineVoteModal.tsx` | Replace mock `getVotingOptions` with real data fetch |
| `src/features/room/components/interactions/HeadlineResultsModal.tsx` | Replace mock `getHeadlineResults` with real vote aggregation |
| `src/services/interactionService.ts` | Add/verify `getVotesForInteraction()` if not present |

### Test
- Host sends Headline Fibbage → players see the blank headline
- Players submit fill-in-the-blank answers
- Voting phase: all answers (including the real one) appear shuffled
- Players vote → votes are persisted
- Results: show who was fooled, who guessed correctly, point awards

---

## Implementation Status

**✅ COMPLETED** - All phases implemented on Feb 11, 2026

### Phase C1: Cross-Player Targeting ✅
- **Database**: `20260211200000_cross_player_and_submissions.sql` - added `target_type`, `target_membership_id`, `source_membership_id`, `challenge_status`, `challenge_expires_at`, `points_wager` to interactions table
- **Types**: Extended `InteractionType` with `challenge`, `directed_reaction`, `audience_question`; added `ChallengeStatus`, `TargetType`; added targeting fields to `Interaction` interface
- **Service**: `challengeService.ts` - send/accept/decline/resolve challenges with rate limiting
- **Hook**: `useChallenges.ts` - real-time subscription for pending/sent challenges with auto-expiry
- **UI**: `ChallengeButton.tsx`, `ChallengeModal.tsx` (prompt + wager slider), `ChallengeNotification.tsx` (toast with countdown), `ChallengeResults.tsx`
- **Integration**: LobbyPanel (challenge button per player), RoomPage (notification overlay + modal), interactionService mapper updated

### Phase C2: Audience-Sourced Question Submission ✅
- **Database**: `audience_submissions` table with RLS policies + realtime enabled (same migration)
- **Service**: `audienceSubmissionService.ts` - submit/approve/reject/markUsed with rate limiting
- **Hook**: `useAudienceSubmissions.ts` - real-time for both players and hosts
- **UI**: `SubmitQuestionButton.tsx`, `SubmitQuestionModal.tsx` (with categories), `SubmissionReviewPanel.tsx` (host review with approve/reject)
- **Integration**: RoomPage (floating submit button for non-hosts), RoomSidebar (Q's tab for hosts with badge count)

### Phase C3: Presenter View Hardening ✅
- **Hook**: `useConnectionHealth.ts` - monitors Supabase realtime connection, tracks reconnect attempts, visibility change handler
- **Utility**: `presenterCache.ts` - localStorage cache with 24h TTL, save/load/clear
- **UI**: `ReconnectionOverlay.tsx` - "Reconnecting..." overlay with spinner and stale timer
- **Integration**: PresenterPage - cache on state change, load from cache on mount, show overlay on disconnect, auto-refresh on reconnect/tab focus

### Phase C4: Complete Headline Fibbage Backend ✅
- **Replaced**: `getVotingOptions()` - now fetches real responses + real answer, shuffles options, excludes own response
- **Replaced**: `getHeadlineResults()` - now fetches real votes, calculates vote counts and fooled counts per option
- **Replaced**: `submitHeadlineVote()` - now calls real `submitVote()` instead of console.log no-op
- **Fixed**: `fooledTeams` → `fooledCount` rename across types and components

## Deployment Order

```
✅ C1 (Cross-Player Targeting)  ──→  DEPLOYED
✅ C2 (Audience Submissions)    ──→  DEPLOYED
✅ C3 (Presenter Hardening)     ──→  DEPLOYED
✅ C4 (Headline Fibbage)        ──→  DEPLOYED

All four phases are complete and ready for testing.
```
