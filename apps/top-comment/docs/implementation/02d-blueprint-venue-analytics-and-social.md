# Implementation Plan: Venue Analytics Dashboard & Social Features

> **Purpose**: Build the venue analytics dashboard (the "revenue unlock") and foundational social features for player retention.  
> **Prerequisite**: Phases A–B complete (quick wins + moderation). Phase C is independent.  
> **Estimated effort**: 10–14 days total.

---

## Phase D1: Venue Analytics Dashboard (Importance 1 — Revenue Unlock)

**Blueprint priority**: Importance 1 for venue operations  
**Comparison gap**: "Stub — `top_comment_session_analytics` table exists, calculation stubs in place — needs buildout"  
**What it does**: Gives venue owners/hosts a dashboard showing session history, player engagement, peak times, and popular prompts.

### Data Sources (Already Exist)

| Table | Metrics Available |
|-------|-------------------|
| `top_comment_sessions` | Session count, duration, status, rounds played |
| `top_comment_players` | Player count per session, scores |
| `top_comment_answers` | Answer count, answer rate |
| `top_comment_votes` | Vote count, vote rate |
| `top_comment_session_analytics` | Pre-aggregated: joined_count, answer_rate, vote_rate, duration |
| `rooms` | Room creation date, settings, status |
| `room_memberships` | Unique players, return rate, join times |
| `interactions` | Interaction count, response count, type distribution |

### Database: Analytics Views

Create Postgres views for efficient dashboard queries:

```sql
-- Room-level analytics summary
create or replace view room_analytics_summary as
select
  r.id as room_id,
  r.code as room_code,
  r.name as room_name,
  r.created_at as room_created_at,
  count(distinct s.id) as total_sessions,
  count(distinct p.user_id) as unique_players,
  avg(sa.joined_count) as avg_players_per_session,
  avg(sa.answer_rate) as avg_answer_rate,
  avg(sa.vote_rate) as avg_vote_rate,
  avg(sa.duration) as avg_session_duration_sec,
  max(s.started_at) as last_session_at
from rooms r
left join top_comment_sessions s on s.room_id = r.id
left join top_comment_players p on p.session_id = s.id
left join top_comment_session_analytics sa on sa.session_id = s.id
group by r.id, r.code, r.name, r.created_at;

-- Session-level detail view
create or replace view session_detail_view as
select
  s.id as session_id,
  s.code as session_code,
  s.room_id,
  s.status,
  s.round_index as rounds_played,
  s.prompt_library_id,
  s.started_at,
  s.ended_at,
  sa.joined_count,
  sa.answer_rate,
  sa.vote_rate,
  sa.duration as duration_sec,
  extract(dow from s.started_at) as day_of_week,
  extract(hour from s.started_at) as hour_of_day
from top_comment_sessions s
left join top_comment_session_analytics sa on sa.session_id = s.id;

-- Player engagement view (return rate)
create or replace view player_engagement_view as
select
  rm.room_id,
  rm.user_id,
  rm.player_name,
  count(distinct p.session_id) as sessions_played,
  min(p.joined_at) as first_played_at,
  max(p.joined_at) as last_played_at,
  sum(p.score) as total_score
from room_memberships rm
join top_comment_players p on p.user_id = rm.user_id
join top_comment_sessions s on s.id = p.session_id and s.room_id = rm.room_id
group by rm.room_id, rm.user_id, rm.player_name;
```

### Service Layer

```typescript
// src/services/analyticsService.ts
//
// getRoomAnalyticsSummary(roomId): Fetch from room_analytics_summary view
// getSessionHistory(roomId, limit?, offset?): Fetch from session_detail_view
// getPlayerEngagement(roomId, limit?): Fetch from player_engagement_view
// getPeakTimes(roomId): Aggregate day_of_week + hour_of_day from session_detail_view
// getPopularPromptLibraries(roomId): Count prompt_library_id usage
// getRetentionMetrics(roomId): Calculate return rate from player_engagement_view
```

### Hook

```typescript
// src/hooks/useVenueAnalytics.ts
//
// Exposes: {
//   summary: RoomAnalyticsSummary,
//   sessionHistory: SessionDetail[],
//   playerEngagement: PlayerEngagement[],
//   peakTimes: PeakTimeData[],
//   popularLibraries: LibraryUsage[],
//   retention: RetentionMetrics,
//   isLoading: boolean,
//   dateRange: { from: Date, to: Date },
//   setDateRange: (from, to) => void,
// }
```

### UI: Analytics Dashboard Page

**New route**: `/analytics/:roomCode` (or tab within host page)

**Dashboard Layout**:
```
┌──────────────────────────────────────────────────┐
│ Room: [ROOM_CODE] — [Room Name]    [Date Range ▼] │
├──────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────┐ │
│ │ Sessions │ │ Players  │ │ Avg Rate │ │ Avg  │ │
│ │   42     │ │  187     │ │  78%     │ │ 23m  │ │
│ │ total    │ │ unique   │ │ answer   │ │ dur. │ │
│ └──────────┘ └──────────┘ └──────────┘ └──────┘ │
├──────────────────────────────────────────────────┤
│ Session History                                   │
│ ┌──────────────────────────────────────────────┐ │
│ │ [Session table: date, players, rounds,       │ │
│ │  answer rate, vote rate, duration, status]    │ │
│ └──────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────┤
│ Peak Times              │ Popular Prompt Packs    │
│ ┌──────────────────────┐│ ┌────────────────────┐ │
│ │ [Heatmap: day × hour]││ │ [Bar chart]        │ │
│ └──────────────────────┘│ └────────────────────┘ │
├──────────────────────────────────────────────────┤
│ Top Players (Return Rate)                         │
│ ┌──────────────────────────────────────────────┐ │
│ │ [Table: name, sessions played, total score,  │ │
│ │  first visit, last visit]                     │ │
│ └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

**Components**:
| Component | Purpose |
|-----------|---------|
| `AnalyticsDashboard.tsx` | Page layout + data orchestration |
| `StatCards.tsx` | Top-level KPI cards (sessions, players, rates, duration) |
| `SessionHistoryTable.tsx` | Sortable/filterable session list |
| `PeakTimesHeatmap.tsx` | Day-of-week × hour heatmap |
| `PromptLibraryChart.tsx` | Bar chart of library usage |
| `PlayerEngagementTable.tsx` | Top returning players |
| `DateRangePicker.tsx` | Filter by date range |

### Access Control

- Only accessible to the room host or venue account holders
- Check `isHost` or `isVenueAccount` before rendering
- Add route guard in router

### Files to Create
| File | Purpose |
|------|---------|
| `database/002_analytics_views.sql` | Postgres views |
| `src/services/analyticsService.ts` | Analytics queries |
| `src/hooks/useVenueAnalytics.ts` | Data hook |
| `src/features/analytics/AnalyticsDashboard.tsx` | Dashboard page |
| `src/features/analytics/components/StatCards.tsx` | KPI cards |
| `src/features/analytics/components/SessionHistoryTable.tsx` | Session list |
| `src/features/analytics/components/PeakTimesHeatmap.tsx` | Heatmap |
| `src/features/analytics/components/PromptLibraryChart.tsx` | Bar chart |
| `src/features/analytics/components/PlayerEngagementTable.tsx` | Player table |
| `src/features/analytics/components/DateRangePicker.tsx` | Date filter |

### Files to Modify
| File | Change |
|------|--------|
| `src/app/router.tsx` | Add `/analytics/:roomCode` route |
| `RoomSidebar.tsx` or `RoomHeader.tsx` | Add "Analytics" link for hosts |
| `HostPage.tsx` | Add "View Analytics" button per room |

### Test
- Host navigates to analytics → sees summary stats
- Session history shows all past sessions with correct metrics
- Peak times heatmap reflects actual session start times
- Player engagement shows returning players sorted by sessions played
- Date range filter narrows all data correctly

---

## Phase D2: Player Badges & Achievements (Importance 3 — Retention)

**Blueprint priority**: Importance 3, Complexity High  
**Comparison gap**: "Badges / achievements — not implemented — retention driver"  
**What it does**: Award badges for gameplay milestones. Displayed on player profiles in the lobby.

### Database Schema

```sql
-- Badge definitions (static, seeded)
create table if not exists badge_definitions (
  id text primary key,                    -- e.g., 'first_win', 'streak_3', 'social_butterfly'
  name text not null,
  description text not null,
  emoji text not null,                    -- Display emoji
  category text not null,                 -- 'gameplay', 'social', 'loyalty', 'special'
  criteria_type text not null,            -- 'count', 'streak', 'milestone'
  criteria_value integer not null,        -- e.g., 1 for first_win, 3 for streak_3
  criteria_metric text not null,          -- 'wins', 'sessions_played', 'challenges_won', 'reactions_sent'
  rarity text not null default 'common',  -- 'common', 'rare', 'epic', 'legendary'
  created_at timestamptz not null default now()
);

-- Player badge awards
create table if not exists player_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  room_id uuid not null references rooms(id) on delete cascade,
  badge_id text not null references badge_definitions(id),
  awarded_at timestamptz not null default now(),
  unique(user_id, room_id, badge_id)
);

create index idx_player_badges_user on player_badges(user_id);
create index idx_player_badges_room on player_badges(room_id);
```

### Seed Data: Initial Badge Set

```typescript
// src/shared/data/badges.ts
export const BADGE_DEFINITIONS = [
  // Gameplay
  { id: 'first_win', name: 'First Victory', emoji: '🏆', category: 'gameplay', criteria: { type: 'count', metric: 'wins', value: 1 }, rarity: 'common' },
  { id: 'win_streak_3', name: 'Hot Streak', emoji: '🔥', category: 'gameplay', criteria: { type: 'streak', metric: 'wins', value: 3 }, rarity: 'rare' },
  { id: 'top_scorer', name: 'Top Scorer', emoji: '⭐', category: 'gameplay', criteria: { type: 'milestone', metric: 'total_score', value: 1000 }, rarity: 'epic' },
  
  // Social
  { id: 'social_butterfly', name: 'Social Butterfly', emoji: '🦋', category: 'social', criteria: { type: 'count', metric: 'chat_messages', value: 50 }, rarity: 'common' },
  { id: 'challenger', name: 'Challenger', emoji: '⚔️', category: 'social', criteria: { type: 'count', metric: 'challenges_sent', value: 10 }, rarity: 'rare' },
  { id: 'crowd_favorite', name: 'Crowd Favorite', emoji: '👏', category: 'social', criteria: { type: 'count', metric: 'reactions_received', value: 100 }, rarity: 'epic' },
  
  // Loyalty
  { id: 'regular', name: 'Regular', emoji: '🍺', category: 'loyalty', criteria: { type: 'count', metric: 'sessions_played', value: 5 }, rarity: 'common' },
  { id: 'veteran', name: 'Veteran', emoji: '🎖️', category: 'loyalty', criteria: { type: 'count', metric: 'sessions_played', value: 20 }, rarity: 'rare' },
  { id: 'legend', name: 'Legend', emoji: '👑', category: 'loyalty', criteria: { type: 'count', metric: 'sessions_played', value: 50 }, rarity: 'legendary' },
  
  // Special
  { id: 'question_author', name: 'Question Author', emoji: '✍️', category: 'special', criteria: { type: 'count', metric: 'submissions_approved', value: 1 }, rarity: 'rare' },
  { id: 'fibbage_master', name: 'Fibbage Master', emoji: '🎭', category: 'special', criteria: { type: 'count', metric: 'fibbage_fools', value: 10 }, rarity: 'epic' },
];
```

### Badge Evaluation Engine

```typescript
// src/domain/services/BadgeEvaluator.ts
//
// evaluateBadges(userId, roomId): Check all badge criteria against player stats
// Returns: Badge[] — newly earned badges (not yet awarded)
//
// Called after:
//   - Session ends (gameplay + loyalty badges)
//   - Challenge resolved (social badges)
//   - Chat message sent (social badges)
//   - Audience submission approved (special badges)
//
// Implementation: query player stats, compare against badge criteria, INSERT new awards
```

### UI Components

**Badge Display** (`src/shared/components/BadgeDisplay.tsx`):
- Row of emoji badges shown next to player names in the lobby
- Hover/tap shows badge name + description
- Rarity indicated by border color (common=gray, rare=blue, epic=purple, legendary=gold)

**Badge Award Toast**:
- When a player earns a new badge, show a celebratory toast: "🏆 New Badge: First Victory!"
- Animate the badge emoji

**Badge Collection Modal** (`src/shared/components/BadgeCollectionModal.tsx`):
- Accessible from player profile / account menu
- Grid of all possible badges, earned ones highlighted, unearned ones grayed out
- Progress bars for badges close to being earned

### Files to Create
| File | Purpose |
|------|---------|
| `database/003_badges_schema.sql` | Badge tables |
| `src/shared/data/badges.ts` | Badge definitions |
| `src/domain/services/BadgeEvaluator.ts` | Badge evaluation logic |
| `src/services/badgeService.ts` | Badge CRUD |
| `src/hooks/useBadges.ts` | Player badges hook |
| `src/shared/components/BadgeDisplay.tsx` | Badge row display |
| `src/shared/components/BadgeCollectionModal.tsx` | Full badge grid |

### Files to Modify
| File | Change |
|------|--------|
| `LobbyPanel.tsx` | Show badges next to player names |
| `AccountMenu.tsx` | Add "My Badges" link |
| `PresenterPage.tsx` | Show top badges on leaderboard |

### Test
- Play 5 sessions → earn "Regular" badge
- Badge appears next to player name in lobby
- Open badge collection → see progress toward unearned badges
- Toast appears when badge is newly earned

---

## Phase D3: Auto-Generated Player Names (Importance 2 — Quick Win)

**Blueprint priority**: Importance 1 (team formation UX)  
**Comparison gap**: "Auto-generated nicknames to reduce inappropriate names — gap"  
**What it does**: Offers fun auto-generated name suggestions on the join page, reducing typing and moderation burden.

### Implementation

```typescript
// src/shared/utils/nameGenerator.ts
//
// generatePlayerName(): string
// Returns a fun two-word name like "Cosmic Penguin", "Neon Taco", "Turbo Sloth"
//
// Format: [Adjective] [Noun]
// Adjectives: ~50 fun/safe words (Cosmic, Neon, Turbo, Fuzzy, Spicy, etc.)
// Nouns: ~50 fun/safe words (Penguin, Taco, Sloth, Wizard, Pickle, etc.)
// Total combinations: 2,500+ unique names
//
// generatePlayerNames(count: number): string[]
// Returns N unique suggestions
```

### UI Integration

In `JoinForm.tsx` (after extraction from team directory):
- Below the player name input, show 3 auto-generated name suggestions as tappable chips
- "Or try:" [Cosmic Penguin] [Neon Taco] [Turbo Sloth]
- Tapping a chip fills the input
- "Shuffle" button generates 3 new suggestions
- Player can still type a custom name

### Files to Create
| File | Purpose |
|------|---------|
| `src/shared/utils/nameGenerator.ts` | Name generation logic |
| `src/shared/data/name-adjectives.json` | Adjective word list |
| `src/shared/data/name-nouns.json` | Noun word list |

### Files to Modify
| File | Change |
|------|--------|
| `src/features/join/JoinForm.tsx` | Add name suggestion chips |

### Test
- Open join page → 3 name suggestions appear below the input
- Tap a suggestion → input fills with that name
- Tap "Shuffle" → 3 new suggestions appear
- Custom names still work

---

## Deployment Order

```
D3 (Name Generator)       →  independent, quick win, ship first
D1 (Analytics Dashboard)  →  independent, highest business value
D2 (Badges)               →  depends on C1 (challenges) for social badges, but gameplay/loyalty badges can ship independently

Recommended: D3 → D1 → D2
```

---

## Verification Checklist

| Check | How |
|-------|-----|
| Analytics loads for host | Host navigates to analytics page, sees data |
| Analytics access control | Non-host cannot access analytics route |
| Badge evaluation fires | After session end, new badges are awarded |
| Badge display works | Badges appear next to names in lobby |
| Name generator produces unique names | Generate 100 names, verify no duplicates |
| Name suggestions are tappable | Tap chip → input fills |

---

## Implementation Status

### Phase D3: Auto-Generated Player Names ✅
- **Utility**: `src/shared/utils/nameGenerator.ts` — 50 adjectives × 50 nouns = 2,500+ unique combos
- **Integration**: `JoinForm.tsx` — 3 tappable name suggestion chips below display name input, shuffle button for new suggestions
- **UX**: Chips styled with theme-aware colors, fills input on tap

### Phase D1: Venue Analytics Dashboard ✅
- **Database**: `20260212000000_analytics_views_and_badges.sql` — `room_analytics_summary`, `session_detail_view`, `player_engagement_view` views
- **Service**: `analyticsService.ts` — `getRoomAnalyticsSummary`, `getSessionHistory`, `getPlayerEngagement`, `getPeakTimes`, `getPopularPromptLibraries`, `getRetentionMetrics`
- **Hook**: `useVenueAnalytics.ts` — fetches all analytics data with date range state
- **UI Components**:
  - `AnalyticsDashboard.tsx` — full page layout with access control (host/venue only)
  - `StatCards.tsx` — KPI cards (sessions, players, answer rate, duration)
  - `SessionHistoryTable.tsx` — sortable session list with all metrics
  - `PeakTimesHeatmap.tsx` — day × hour heatmap with intensity colors
  - `PromptLibraryChart.tsx` — horizontal bar chart of library usage
  - `PlayerEngagementTable.tsx` — top returning players with retention metrics
  - `DateRangePicker.tsx` — 7d/30d/90d/All preset buttons
- **Route**: `/analytics/:roomCode` added to router
- **Integration**: "Analytics" button added to HostPage header

### Phase D2: Player Badges & Achievements ✅
- **Database**: Same migration — `badge_definitions` table (seeded with 11 badges), `player_badges` table with RLS
- **Data**: `src/shared/data/badges.ts` — badge definitions, rarity colors, helper functions
- **Service**: `badgeService.ts` — `getPlayerBadges`, `getRoomBadges`, `awardBadge`, `evaluateBadges` (full evaluation engine checking player stats)
- **Hook**: `useBadges.ts` — fetch badges, evaluate, track newly awarded
- **UI Components**:
  - `BadgeDisplay.tsx` — compact emoji row shown next to player names
  - `BadgeCollectionModal.tsx` — full grid of all badges organized by category, earned/locked states, rarity indicators
- **Integration**: `LobbyPanel.tsx` — badges shown next to player names (accepts `roomBadges` prop)
