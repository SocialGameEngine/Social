# Asynchronous Interactions System

## Overview
A flexible system that lets hosts send on-demand engagements (prompts, polls, trivia) to room members, independent of the structured session system. Uses existing room + membership architecture.

## Core Design Principles
1. **Session-Independent**: Operates alongside structured sessions without interference
2. **Room-Scoped**: Interactions belong to a room, linked via `room_memberships` (not teams/sessions)
3. **Real-time**: Uses existing Supabase Realtime (postgres_changes) for live updates
4. **Type-Extensible**: Phase 1 is prompts only; schema supports future types via `type` column + JSONB

## Key Differences from Sessions

| Aspect | Sessions (Synchronous) | Interactions (Async) |
|---|---|---|
| Structure | Multi-round, phased (lobby→answer→vote→results) | Single prompt, no phases |
| Timing | Timed phases with countdowns | No time limits — respond when ready |
| Participation | All participate simultaneously | Respond at own pace |
| Scope | One active session per room | Multiple active interactions per room |
| Identity | `top_comment_players` (session-scoped) | `room_memberships` (room-scoped) |

---

## Phase 1 Scope (Current Focus)

Phase 1 implements **prompts only**: host sends a text question, members submit text responses, host views responses in real-time. No voting, no time limits, no trivia/polls.

### What Phase 1 Includes
- `interactions` + `responses` tables (no votes table yet)
- Host: create prompt, view responses, close prompt
- Participant: see active prompt, submit response
- Real-time subscriptions for both tables
- Interaction cards in SessionPanel area
- Simple send-prompt modal (manual text input + quick suggestions)

### What Phase 1 Does NOT Include
- Voting on responses
- Trivia / polls / user-submitted prompts
- Time limits or scheduled interactions
- Notification system (no push/browser notifications)
- Prompt library management UI
- "Waiting for prompt" participant state (no signal before send)

---

## Database Schema

### `interactions` table (NEW — no prefix per naming convention)
```sql
CREATE TABLE public.interactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL,
  created_by uuid NOT NULL,              -- auth.users.id (host who created it)
  type text NOT NULL DEFAULT 'prompt',   -- 'prompt' for Phase 1; future: 'trivia', 'poll'
  status text NOT NULL DEFAULT 'active'  -- 'active' | 'closed'
    CHECK (status IN ('active', 'closed')),
  question text NOT NULL,                -- the prompt text
  description text,                      -- optional context/subtitle
  settings jsonb DEFAULT '{}'::jsonb,    -- future: anonymous responses, show count, etc.
  response_count integer DEFAULT 0,      -- denormalized for quick display
  created_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  CONSTRAINT interactions_pkey PRIMARY KEY (id),
  CONSTRAINT interactions_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE,
  CONSTRAINT interactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

-- Index for fetching active interactions per room
CREATE INDEX idx_interactions_room_active ON public.interactions (room_id, status) WHERE status = 'active';

-- Enable RLS
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

-- RLS: Anyone in the room can read interactions
CREATE POLICY "Room members can view interactions"
  ON public.interactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.room_memberships rm
      WHERE rm.room_id = interactions.room_id
        AND rm.user_id = auth.uid()
        AND rm.is_banned = false
    )
  );

-- RLS: Only the room host can create interactions
CREATE POLICY "Room host can create interactions"
  ON public.interactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rooms r
      WHERE r.id = room_id
        AND r.host_uid = auth.uid()
    )
  );

-- RLS: Only the room host can update (close) interactions
CREATE POLICY "Room host can update interactions"
  ON public.interactions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.rooms r
      WHERE r.id = interactions.room_id
        AND r.host_uid = auth.uid()
    )
  );

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.interactions;
```

### `responses` table (NEW — no prefix per naming convention)
```sql
CREATE TABLE public.responses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  interaction_id uuid NOT NULL,
  membership_id uuid NOT NULL,           -- room_memberships.id (room-scoped identity)
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT responses_pkey PRIMARY KEY (id),
  CONSTRAINT responses_interaction_id_fkey FOREIGN KEY (interaction_id) REFERENCES public.interactions(id) ON DELETE CASCADE,
  CONSTRAINT responses_membership_id_fkey FOREIGN KEY (membership_id) REFERENCES public.room_memberships(id),
  CONSTRAINT responses_unique_per_interaction UNIQUE (interaction_id, membership_id)
);

-- Index for fetching responses per interaction
CREATE INDEX idx_responses_interaction ON public.responses (interaction_id);

-- Enable RLS
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;

-- RLS: Room members can view responses for interactions in their room
CREATE POLICY "Room members can view responses"
  ON public.responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.interactions i
      JOIN public.room_memberships rm ON rm.room_id = i.room_id
      WHERE i.id = responses.interaction_id
        AND rm.user_id = auth.uid()
        AND rm.is_banned = false
    )
  );

-- RLS: Members can insert their own response (one per interaction)
CREATE POLICY "Members can submit responses"
  ON public.responses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.room_memberships rm
      JOIN public.interactions i ON i.room_id = rm.room_id
      WHERE rm.id = membership_id
        AND rm.user_id = auth.uid()
        AND rm.is_banned = false
        AND i.id = interaction_id
        AND i.status = 'active'
    )
  );

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.responses;
```

### Future: `interaction_votes` table (Phase 2 — NOT built in Phase 1)
Named `interaction_votes` to avoid collision with existing `votes` table.

---

## TypeScript Types

### Domain Types
```typescript
// Add to: src/domain/types/interaction.types.ts

export type InteractionType = 'prompt'; // Phase 2: | 'trivia' | 'poll'
export type InteractionStatus = 'active' | 'closed';

export interface Interaction {
  id: string;
  roomId: string;
  createdBy: string;        // auth user ID
  type: InteractionType;
  status: InteractionStatus;
  question: string;
  description?: string;
  settings: Record<string, unknown>;
  responseCount: number;
  createdAt: string;
  closedAt?: string;
}

export interface InteractionResponse {
  id: string;
  interactionId: string;
  membershipId: string;     // room_memberships.id
  text: string;
  createdAt: string;
}
```

### Mapper Functions
```typescript
// Add to: src/services/interactionService.ts

function mapInteraction(data: any): Interaction {
  return {
    id: data.id,
    roomId: data.room_id,
    createdBy: data.created_by,
    type: data.type,
    status: data.status,
    question: data.question,
    description: data.description,
    settings: data.settings || {},
    responseCount: data.response_count || 0,
    createdAt: data.created_at,
    closedAt: data.closed_at,
  };
}

function mapResponse(data: any): InteractionResponse {
  return {
    id: data.id,
    interactionId: data.interaction_id,
    membershipId: data.membership_id,
    text: data.text,
    createdAt: data.created_at,
  };
}
```

---

## Service Layer

```typescript
// src/services/interactionService.ts

import { supabase } from '../supabase/client';

// Create a new interaction (host only)
async function createInteraction(roomId: string, question: string, description?: string) {
  const { data, error } = await supabase
    .from('interactions')
    .insert({ room_id: roomId, question, description, created_by: (await supabase.auth.getUser()).data.user?.id })
    .select()
    .single();
  if (error) throw error;
  return mapInteraction(data);
}

// Close an interaction (host only)
async function closeInteraction(interactionId: string) {
  const { error } = await supabase
    .from('interactions')
    .update({ status: 'closed', closed_at: new Date().toISOString() })
    .eq('id', interactionId);
  if (error) throw error;
}

// Submit a response (member)
async function submitResponse(interactionId: string, membershipId: string, text: string) {
  const { data, error } = await supabase
    .from('responses')
    .upsert(
      { interaction_id: interactionId, membership_id: membershipId, text },
      { onConflict: 'interaction_id,membership_id' }
    )
    .select()
    .single();
  if (error) throw error;
  return mapResponse(data);
}

// Fetch active interactions for a room
async function getActiveInteractions(roomId: string) {
  const { data, error } = await supabase
    .from('interactions')
    .select('*')
    .eq('room_id', roomId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapInteraction);
}

// Fetch responses for an interaction
async function getResponses(interactionId: string) {
  const { data, error } = await supabase
    .from('responses')
    .select('*, room_memberships:membership_id(player_name, mascot_id)')
    .eq('interaction_id', interactionId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(mapResponse);
}
```

---

## Real-time Subscriptions

Follow the same pattern as `useRoom.ts` (postgres_changes on Supabase channels):

```typescript
// src/hooks/useInteractions.ts

// Subscribe to interactions table for a room
const channel = supabase
  .channel(`interactions:${roomId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'interactions',
    filter: `room_id=eq.${roomId}`,
  }, () => {
    refreshInteractions(); // re-fetch active interactions
  })
  .subscribe();

// Subscribe to responses for a specific interaction
const responsesChannel = supabase
  .channel(`responses:${interactionId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'responses',
    filter: `interaction_id=eq.${interactionId}`,
  }, () => {
    refreshResponses(); // re-fetch responses
  })
  .subscribe();
```

---

## UI Integration

### Existing Layout (No Renames)
The existing `SessionPanel` / `PhaseController` / `RoomCanvas` / `RoomInfoRail` structure stays as-is. Interaction UI is **added alongside**, not replacing anything.

### Where Interactions Appear
- **Below SessionPanel** (desktop: in the main column, above the divider)
- **Below SessionPanel** (mobile: in the shrink-0 area, before the widget overlay)
- When no session is active, interactions are the primary content in that area

### New Components (Phase 1)

| Component | Location | Purpose |
|---|---|---|
| `InteractionSection` | `RoomPage.tsx` — below `<SessionPanel>` | Container: shows active interactions or empty state |
| `InteractionCard` | Inside `InteractionSection` | Single interaction: question + response count + CTA |
| `SendPromptModal` | Lazy-loaded modal | Host: text input + quick suggestions + send button |
| `RespondModal` | Lazy-loaded modal | Participant: text input to submit response |
| `ResponsesDrawer` | Lazy-loaded modal/drawer | Host: view all responses for an interaction |

### Desktop Layout
```
┌──────────────────────────────────────────────────────┐
│ Header: Room Code                          [Leave]   │
├──────────────────────┬───────────────────────────────┤
│ Main Column          │ RoomInfoRail                  │
│                      │                               │
│ ┌──────────────────┐ │                               │
│ │ SessionPanel     │ │                               │
│ │ (PhaseController)│ │                               │
│ └──────────────────┘ │                               │
│                      │                               │
│ ┌──────────────────┐ │                               │
│ │ InteractionSection│ │                               │
│ │ (cards or empty) │ │                               │
│ └──────────────────┘ │                               │
│                      │                               │
│ ── divider ───────── │                               │
│                      │                               │
│ ┌──────────────────┐ │                               │
│ │ RoomCanvas       │ │                               │
│ │ (widgets)        │ │                               │
│ └──────────────────┘ │                               │
└──────────────────────┴───────────────────────────────┘
```

### Host States in InteractionSection

**No session, no interactions (empty state):**
- Welcome message + [Send Quick Prompt] + [Start Session] buttons

**Active interactions (no session):**
- Stack of InteractionCards, each showing: question, response count, [View Responses] / [Close]
- [Send Another Prompt] button at bottom

**Active session + interactions:**
- SessionPanel shows session as normal (top priority)
- InteractionCards appear below, more compact
- [Send Prompt] button available

### Participant States in InteractionSection

**No session, no interactions:**
- "Waiting for host..." message

**Active interaction:**
- InteractionCard with question + [Respond] button (or "Responded" checkmark if already submitted)

**Active session + interaction:**
- Session takes priority in SessionPanel
- Interaction card below, compact, with [Respond] CTA

### Send Prompt Modal (Phase 1 — Simple)
```
┌─────────────────────────────────────────┐
│ Send Quick Prompt                       │
├─────────────────────────────────────────┤
│                                         │
│ Question:                               │
│ ┌─────────────────────────────────────┐ │
│ │ [Type your prompt here...]         │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Quick ideas:                            │
│  "How's everyone feeling?"              │
│  "Ready to start?"                      │
│  "What should we play next?"            │
│                                         │
│               [Cancel] [Send Prompt]    │
└─────────────────────────────────────────┘
```

### Response View (Host)
```
┌─────────────────────────────────────────┐
│ Responses: "How's everyone feeling?"    │
├─────────────────────────────────────────┤
│ 5 responses                             │
│                                         │
│ Player1: "Great! Ready to play!"        │
│ Player2: "A bit tired but excited"      │
│ Player3: "Feeling good!"               │
│ Player4: "Ready when you are!"          │
│ Player5: "Let's do this!"              │
│                                         │
│         [Close Prompt] [Send Another]   │
└─────────────────────────────────────────┘
```

---

## Implementation Checklist (Phase 1)

### 1. Database Migration
- [ ] Create `interactions` table with RLS policies
- [ ] Create `responses` table with RLS policies
- [ ] Add both tables to Supabase realtime publication
- [ ] Test RLS: host can create/update interactions, members can read, members can insert responses

### 2. Types & Service Layer
- [ ] Create `src/domain/types/interaction.types.ts`
- [ ] Create `src/services/interactionService.ts` with CRUD + mappers
- [ ] Re-export types from `src/shared/types.ts`

### 3. Hook
- [ ] Create `src/hooks/useInteractions.ts` — fetches active interactions + realtime subscription
- [ ] Create `src/hooks/useResponses.ts` — fetches responses for a given interaction + realtime subscription

### 4. UI Components
- [ ] `InteractionSection` — container in RoomPage
- [ ] `InteractionCard` — single interaction display
- [ ] `SendPromptModal` — host prompt creation
- [ ] `RespondModal` — participant response submission
- [ ] `ResponsesDrawer` — host views responses

### 5. Integration
- [ ] Add `InteractionSection` to `RoomPage.tsx` (both mobile + desktop layouts)
- [ ] Wire up host actions (send prompt, close prompt, view responses)
- [ ] Wire up participant actions (respond to prompt)
- [ ] Test coexistence with active session

---

## Future Phases (Deferred)

### Phase 2: Voting, Trivia, Polls
- `interaction_votes` table
- `type` column expansion: `'trivia'`, `'poll'`
- JSONB `settings` for type-specific config (correct answer, poll options, etc.)
- Type selector in creation modal
- Prompt library management UI

### Phase 3: Advanced
- Scheduled/recurring interactions
- User-submitted prompt queue with moderation
- Multimedia support
- Analytics dashboard
