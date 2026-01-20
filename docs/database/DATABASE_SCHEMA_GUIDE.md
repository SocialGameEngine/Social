# Database Schema & ID Relationships Guide

## Overview

This document clarifies the confusing ID relationships across all tables in the game database. The system has evolved from a simple "1 player = 1 team" model to a complex "multi-player teams with captains" model, leading to overlapping and sometimes redundant ID fields.

## The ID Confusion Problem

### Multiple User Identifiers
- `auth.users(id)` - Supabase Auth UUID (the "real" user ID)
- `teams.uid` - TEXT field storing user ID (legacy, now captain ID)
- `teams.captain_id` - UUID referencing auth.users(id) (new, proper foreign key)
- `team_members.user_id` - UUID referencing auth.users(id) (proper foreign key)
- `sessions.host_uid` - TEXT field storing host's user ID (legacy)
- `banned_teams.uid` - TEXT field storing banned user ID (legacy)

### Multiple Team Identifiers
- `teams.id` - UUID, primary key
- `teams.team_code` - VARCHAR(4), the 4-digit join code
- `team_codes.code` - VARCHAR(4), same as team_code
- `team_codes.team_id` - UUID referencing teams(id)

**Why the confusion?** The system started with TEXT fields for user IDs, then added proper UUID foreign keys, but kept both for backwards compatibility.

## Core Tables

### 1. `sessions` - Game Sessions

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY,                    -- Session identifier
  code TEXT UNIQUE NOT NULL,              -- 6-digit session code (e.g., "ABC123")
  host_uid TEXT NOT NULL,                 -- ⚠️ TEXT! Host's user ID (should be UUID)
  status TEXT NOT NULL,                   -- 'lobby', 'answer', 'vote', 'results', 'ended'
  round_index INTEGER DEFAULT 0,          -- Current round number
  rounds JSONB DEFAULT '[]',              -- Array of round data
  vote_group_index INTEGER,               -- Current voting group
  settings JSONB,                         -- Game settings
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,                    -- Timer expiration
  paused BOOLEAN DEFAULT false,
  max_teams INTEGER DEFAULT 20            -- Max teams allowed
);
```

**Key Points**:
- `id`: Session UUID - used everywhere to reference this session
- `code`: Human-readable 6-digit code for joining (e.g., "ABC123")
- `host_uid`: **TEXT field** storing the host's `auth.users(id)` - should be UUID but isn't
- `rounds`: JSONB array containing all round/group data

**Relationships**:
- One session → Many teams
- One session → Many team_codes
- One session → Many answers
- One session → Many votes

---

### 2. `teams` - Game Teams

```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY,                           -- Team identifier
  session_id UUID REFERENCES sessions(id),       -- Which session this team belongs to
  uid TEXT,                                      -- ⚠️ Captain's user ID (legacy, duplicates captain_id)
  captain_id UUID REFERENCES auth.users(id),    -- ✅ Proper captain reference (NEW)
  team_name TEXT NOT NULL,                       -- Display name (e.g., "Team 1")
  team_code VARCHAR(4) UNIQUE,                   -- 4-digit join code (e.g., "1234")
  is_host BOOLEAN DEFAULT false,                 -- Is this the host's team?
  score INTEGER DEFAULT 0,                       -- Team's total score
  mascot_id INTEGER,                             -- Visual mascot
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW()
);
```

**The Captain ID Confusion**:
- `uid` (TEXT): Legacy field, stores captain's user ID as text
- `captain_id` (UUID): New field, proper foreign key to auth.users(id)
- **Both should have the same value** when a captain exists
- **Both are NULL** when team has no captain (empty team)

**Why both exist?**
1. `uid` was original design (before multi-player teams)
2. `captain_id` added for proper foreign key constraints
3. Both kept for backwards compatibility
4. Database filter uses `uid IS NOT NULL` to find teams with captains

**Key Points**:
- `id`: Team UUID - used in answers, votes, team_members
- `session_id`: Links team to its session
- `team_code`: 4-digit code players use to join THIS specific team
- `uid` + `captain_id`: Both identify the captain (should be same value)

**Relationships**:
- One team → Many team_members (NEW: multi-player support)
- One team → Many answers (one per round)
- One team → Many votes (voting for other teams' answers)
- One team → One team_code (via team_codes table)

---

### 3. `team_members` - Individual Players on Teams

```sql
CREATE TABLE team_members (
  id UUID PRIMARY KEY,                           -- Member record identifier
  team_id UUID REFERENCES teams(id),             -- Which team they're on
  user_id UUID REFERENCES auth.users(id),        -- ✅ Proper user reference
  device_id VARCHAR,                             -- For anonymous users (future)
  player_name TEXT,                              -- Display name
  is_captain BOOLEAN DEFAULT false,              -- Is this member the captain?
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW()
);
```

**This is the NEW table** that enables multi-player teams.

**Key Points**:
- `id`: Unique identifier for this membership record
- `team_id`: Which team this player is on
- `user_id`: Which user this is (proper UUID foreign key)
- `is_captain`: Boolean flag (should match `teams.captain_id`)

**The Captain Relationship**:
```
team_members.user_id (where is_captain = true) 
  === teams.captain_id 
  === teams.uid
```

All three should point to the same user when a captain exists.

**Relationships**:
- Many team_members → One team
- Many team_members → One user (a user can be on multiple teams in different sessions)

---

### 4. `team_codes` - Join Codes for Teams

```sql
CREATE TABLE team_codes (
  id UUID PRIMARY KEY,                           -- Code record identifier
  code VARCHAR(4) UNIQUE NOT NULL,               -- 4-digit code (e.g., "1234")
  session_id UUID REFERENCES sessions(id),       -- Which session this code belongs to
  team_id UUID REFERENCES teams(id),             -- Which team this code is assigned to
  is_used BOOLEAN DEFAULT false,                 -- Has this code been assigned?
  created_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_at TIMESTAMPTZ                        -- When it was assigned to a team
);
```

**Key Points**:
- `code`: The actual 4-digit code (globally unique)
- `session_id`: Codes are generated per session
- `team_id`: NULL when available, set when assigned to a team
- `is_used`: Tracks if code has been assigned

**The Code Duplication**:
```
team_codes.code === teams.team_code (when assigned)
```

**Why separate table?**
- Codes are pre-generated when session is created (10 codes for 10 teams)
- Codes are assigned when first player joins a team
- Allows tracking available vs. used codes

**⚠️ REDUNDANCY WARNING**:
This is **over-engineered**. The same functionality can be achieved with just the `teams` table:

```sql
-- Single table approach (simpler)
SELECT team_code FROM teams 
WHERE session_id = ? AND uid IS NULL;  -- Available codes

SELECT * FROM teams 
WHERE session_id = ? AND uid IS NOT NULL;  -- Active teams
```

**Why keep both tables?**
- Historical: System evolved from simple to complex
- Migration effort: Changing would require updating all code
- Minor benefit: Tracks `assigned_at` timestamp separately

**Recommendation**: Future refactor should consolidate to single table.

**Relationships**:
- Many team_codes → One session
- One team_code → One team (when assigned)

---

### 5. `answers` - Team Answers

```sql
CREATE TABLE answers (
  id UUID PRIMARY KEY,                           -- Answer identifier
  session_id UUID REFERENCES sessions(id),       -- Which session
  team_id UUID REFERENCES teams(id),             -- Which team submitted this
  round_index INTEGER NOT NULL,                  -- Which round (0-based)
  group_id TEXT NOT NULL,                        -- Which group in the round (e.g., "g0")
  text TEXT NOT NULL,                            -- The actual answer text
  masked BOOLEAN DEFAULT false,                  -- For profanity filtering
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Points**:
- `team_id`: References the TEAM, not individual player
- Only captain submits, but answer belongs to whole team
- One answer per team per round

**Relationships**:
- Many answers → One session
- Many answers → One team
- One answer → Many votes (other teams vote on it)

---

### 6. `votes` - Team Votes

```sql
CREATE TABLE votes (
  id UUID PRIMARY KEY,                           -- Vote identifier
  session_id UUID REFERENCES sessions(id),       -- Which session
  voter_id UUID REFERENCES teams(id),            -- ⚠️ Which TEAM voted (not user!)
  answer_id UUID REFERENCES answers(id),         -- Which answer they voted for
  round_index INTEGER NOT NULL,                  -- Which round
  group_id TEXT NOT NULL,                        -- Which voting group
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Points**:
- `voter_id`: References TEAM, not individual user
- Captain votes on behalf of entire team
- One vote per team per voting group

**Relationships**:
- Many votes → One session
- Many votes → One team (as voter)
- Many votes → One answer (being voted for)

---

### 7. `banned_teams` - Banned Players

```sql
CREATE TABLE banned_teams (
  id UUID PRIMARY KEY,                           -- Ban record identifier
  session_id UUID REFERENCES sessions(id),       -- Which session they're banned from
  team_id UUID NOT NULL,                         -- ⚠️ Team ID (not FK, team may be deleted)
  team_name TEXT NOT NULL,                       -- Team name at time of ban
  uid TEXT,                                      -- ⚠️ TEXT! Banned user's ID (legacy)
  user_id UUID REFERENCES auth.users(id),        -- ✅ Proper user reference (TO BE ADDED)
  banned_at TIMESTAMPTZ DEFAULT NOW(),
  banned_by UUID,                                -- Who banned them (host)
  reason TEXT
);
```

**Current Issues**:
- `uid`: TEXT field storing banned user's ID (legacy)
- `user_id`: **DOESN'T EXIST YET** - needs to be added
- `team_id`: Not a foreign key (team may be deleted after ban)

**Planned Fix**:
```sql
ALTER TABLE banned_teams 
ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Then ban by user_id instead of uid
```

**Relationships**:
- Many banned_teams → One session
- Many banned_teams → One user (when user_id is added)

---

## ID Relationship Flowchart

```
Session (id: UUID)
  └─ code: "ABC123" (6-digit session code)
  └─ host_uid: TEXT (should be UUID)
  │
  ├─→ Teams (session_id → sessions.id)
  │     └─ id: UUID
  │     └─ uid: TEXT (captain, legacy)
  │     └─ captain_id: UUID → auth.users(id) (captain, new)
  │     └─ team_code: "1234" (4-digit team code)
  │     │
  │     ├─→ Team Members (team_id → teams.id)
  │     │     └─ id: UUID
  │     │     └─ user_id: UUID → auth.users(id) ✅
  │     │     └─ is_captain: BOOLEAN
  │     │
  │     ├─→ Answers (team_id → teams.id)
  │     │     └─ id: UUID
  │     │     └─ round_index: INTEGER
  │     │     └─ group_id: TEXT
  │     │
  │     └─→ Votes (voter_id → teams.id)
  │           └─ id: UUID
  │           └─ answer_id → answers.id
  │
  ├─→ Team Codes (session_id → sessions.id)
  │     └─ id: UUID
  │     └─ code: "1234" (same as teams.team_code)
  │     └─ team_id: UUID → teams.id (when assigned)
  │
  └─→ Banned Teams (session_id → sessions.id)
        └─ id: UUID
        └─ uid: TEXT (legacy) ⚠️
        └─ user_id: UUID → auth.users(id) (to be added) ✅
```

## Common Queries & ID Usage

### 1. Find all teams in a session
```sql
SELECT * FROM teams 
WHERE session_id = 'session-uuid'
AND uid IS NOT NULL;  -- Only teams with captains
```

### 2. Find all members of a team
```sql
SELECT * FROM team_members 
WHERE team_id = 'team-uuid'
ORDER BY joined_at ASC;
```

### 3. Find team captain
```sql
-- Method 1: From teams table
SELECT captain_id FROM teams WHERE id = 'team-uuid';

-- Method 2: From team_members table
SELECT user_id FROM team_members 
WHERE team_id = 'team-uuid' AND is_captain = true;

-- Both should return the same user_id
```

### 4. Check if user is banned from session
```sql
-- Current (using TEXT uid)
SELECT * FROM banned_teams 
WHERE session_id = 'session-uuid' 
AND uid = 'user-id-as-text';

-- Future (using UUID user_id)
SELECT * FROM banned_teams 
WHERE session_id = 'session-uuid' 
AND user_id = 'user-uuid';
```

### 5. Find team by team code
```sql
-- Method 1: Direct from teams
SELECT * FROM teams WHERE team_code = '1234';

-- Method 2: Via team_codes table
SELECT t.* FROM teams t
JOIN team_codes tc ON tc.team_id = t.id
WHERE tc.code = '1234';

-- Both should return the same team
```

### 6. Get all answers for a team
```sql
SELECT * FROM answers 
WHERE team_id = 'team-uuid'
ORDER BY round_index ASC;
```

### 7. Get all votes by a team
```sql
SELECT * FROM votes 
WHERE voter_id = 'team-uuid'  -- Note: voter_id is team, not user!
ORDER BY round_index ASC;
```

## Data Integrity Rules

### Captain Consistency
When a user is captain of a team, these MUST all be true:
```sql
teams.uid = user_id (as TEXT)
teams.captain_id = user_id (as UUID)
team_members.user_id = user_id WHERE is_captain = true
```

### Empty Team State
When a team has no captain:
```sql
teams.uid = NULL
teams.captain_id = NULL
-- No team_members records with is_captain = true
```

### Team Code Assignment
When a team code is assigned:
```sql
team_codes.code = teams.team_code
team_codes.team_id = teams.id
team_codes.is_used = true
team_codes.assigned_at IS NOT NULL
```

## Migration Path: TEXT → UUID

### Current State (Legacy)
- `sessions.host_uid` → TEXT
- `teams.uid` → TEXT
- `banned_teams.uid` → TEXT

### Target State (Proper)
- `sessions.host_uid` → Should be UUID (breaking change)
- `teams.uid` → Keep for backwards compatibility, but always sync with captain_id
- `teams.captain_id` → UUID (already exists) ✅
- `banned_teams.user_id` → UUID (needs to be added)

### Why Not Migrate Everything?
1. **Breaking changes**: Frontend code expects TEXT in some places
2. **Backwards compatibility**: Existing data uses TEXT
3. **Dual approach**: Keep both TEXT and UUID, sync them

### Recommended Approach
1. ✅ Add proper UUID foreign keys (captain_id, user_id in banned_teams)
2. ✅ Always set both TEXT and UUID fields when creating/updating
3. ✅ Use UUID fields in new code
4. ⚠️ Eventually deprecate TEXT fields (major version bump)

## Common Pitfalls

### 1. Forgetting to Set Both uid and captain_id
```typescript
// ❌ WRONG - Only sets captain_id
await supabase.from('teams').update({ captain_id: userId });

// ✅ CORRECT - Sets both
await supabase.from('teams').update({ 
  captain_id: userId,
  uid: userId 
});
```

### 2. Filtering by Wrong Field
```typescript
// ❌ WRONG - captain_id might be NULL even with captain
const teams = await supabase
  .from('teams')
  .select('*')
  .not('captain_id', 'is', null);

// ✅ CORRECT - uid is the reliable field
const teams = await supabase
  .from('teams')
  .select('*')
  .not('uid', 'is', null);
```

### 3. Confusing team_id with user_id
```typescript
// ❌ WRONG - voter_id is team, not user
const votes = await supabase
  .from('votes')
  .select('*')
  .eq('voter_id', userId);  // This won't work!

// ✅ CORRECT - Get user's team first, then votes
const team = await getTeamForUser(userId);
const votes = await supabase
  .from('votes')
  .select('*')
  .eq('voter_id', team.id);
```

### 4. Not Handling Captain Promotion
```typescript
// ❌ WRONG - Just delete team member
await supabase.from('team_members').delete().eq('id', memberId);

// ✅ CORRECT - Check if captain, promote if needed
const member = await supabase.from('team_members').select('*').eq('id', memberId).single();
await supabase.from('team_members').delete().eq('id', memberId);

if (member.is_captain) {
  // Get next member
  const nextMember = await supabase
    .from('team_members')
    .select('*')
    .eq('team_id', member.team_id)
    .order('joined_at', { ascending: true })
    .limit(1)
    .single();
    
  if (nextMember) {
    // Promote to captain
    await supabase.from('teams').update({
      captain_id: nextMember.user_id,
      uid: nextMember.user_id
    }).eq('id', member.team_id);
    
    await supabase.from('team_members').update({
      is_captain: true
    }).eq('id', nextMember.id);
  } else {
    // No members left, clear captain
    await supabase.from('teams').update({
      captain_id: null,
      uid: null
    }).eq('id', member.team_id);
  }
}
```

## Performance & Query Optimization

### Fetching Teams with Members (Recommended)

For the new Teams modal, use a **single query with joins** instead of multiple queries:

```typescript
// ✅ OPTIMAL - Single query with all data
const { data: teams } = await supabase
  .from('teams')
  .select(`
    id, team_name, score, uid, captain_id, team_code,
    team_members(
      id, user_id, player_name, is_captain, joined_at
    )
  `)
  .eq('session_id', sessionId)
  .not('uid', 'is', null)
  .order('joined_at', { ascending: true });

// ❌ INEFFICIENT - Multiple queries
const teams = await supabase.from('teams').select('*').eq('session_id', sessionId);
const codes = await supabase.from('team_codes').select('*').eq('session_id', sessionId);
const members = await supabase.from('team_members').select('*').in('team_id', teamIds);
```

### Avoiding team_codes Table

Since `teams.team_code` contains the same data as `team_codes.code`, you can skip the join:

```typescript
// ✅ SIMPLER - Use teams.team_code directly
const { data: teams } = await supabase
  .from('teams')
  .select('id, team_name, team_code, uid')
  .eq('session_id', sessionId);

// Available codes
const availableCodes = teams.filter(t => t.uid === null).map(t => t.team_code);

// Active teams
const activeTeams = teams.filter(t => t.uid !== null);
```

This eliminates the need for `team_codes` table entirely in most queries.

## Summary

### The Core Confusion
1. **Multiple user ID formats**: TEXT vs UUID
2. **Duplicate captain tracking**: uid vs captain_id vs is_captain
3. **Duplicate team codes**: team_code vs team_codes.code (REDUNDANT)
4. **Team vs User**: votes/answers reference teams, not users

### The Solution
1. **Always set both TEXT and UUID fields** for captains
2. **Use UUID fields in new code** (captain_id, user_id)
3. **Filter teams by uid IS NOT NULL** (most reliable)
4. **Remember: votes/answers are team-level**, not user-level
5. **Handle captain promotion** when removing team members
6. **Use single queries with joins** for better performance
7. **Skip team_codes table** - use teams.team_code directly

### Quick Reference
- **User ID**: `auth.users(id)` - UUID
- **Captain ID**: `teams.uid` (TEXT) + `teams.captain_id` (UUID) - BOTH should be set
- **Team ID**: `teams.id` - UUID
- **Session ID**: `sessions.id` - UUID
- **Team Code**: `teams.team_code` (VARCHAR) - Use this, skip `team_codes` table
- **Voter**: `votes.voter_id` → `teams.id` (NOT user!)
- **Answer Submitter**: `answers.team_id` → `teams.id` (NOT user!)

### Future Refactoring Recommendations

1. **Eliminate team_codes table** - Redundant with teams.team_code
2. **Migrate TEXT fields to UUID** - sessions.host_uid, teams.uid
3. **Add user_id to banned_teams** - Replace TEXT uid field
4. **Consolidate captain tracking** - Choose either uid or captain_id (not both)
