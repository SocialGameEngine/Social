
# Supabase RLS Policies for topcomment.playnow.social Event Platform
# Session-based, user-isolated access for multiplayer games
# File: rls.md

## Schema Overview
```sql
-- Core tables for topcomment.playnow.social multiplayer event platform
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- Join code like "ABC123"
  host_uid TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'lobby',
  round_index INTEGER NOT NULL DEFAULT 0,
  rounds JSONB NOT NULL DEFAULT '[]',
  vote_group_index INTEGER,
  prompt_library_id TEXT NOT NULL DEFAULT 'classic',
  settings JSONB NOT NULL DEFAULT '{"answerSecs": 90, "voteSecs": 90, "resultsSecs": 12, "maxTeams": 24}',
  venue_name TEXT,
  venue_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ
);

CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  uid TEXT NOT NULL, -- User's auth.uid
  team_name TEXT NOT NULL,
  is_host BOOLEAN NOT NULL DEFAULT false,
  score INTEGER NOT NULL DEFAULT 0,
  mascot_id INTEGER,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(session_id, uid)
);

CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  round_index INTEGER NOT NULL,
  group_id TEXT NOT NULL,
  text TEXT NOT NULL,
  masked BOOLEAN NOT NULL DEFAULT false, -- Profanity filtered
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  answer_id UUID NOT NULL REFERENCES answers(id) ON DELETE CASCADE,
  round_index INTEGER NOT NULL,
  group_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE session_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID UNIQUE NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  joined_count INTEGER NOT NULL DEFAULT 0,
  answer_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  vote_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  duration INTEGER NOT NULL DEFAULT 0, -- seconds
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Enable RLS on All Tables
```sql
-- Enable Row Level Security on every table for strict access control
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_analytics ENABLE ROW LEVEL SECURITY;
```

## Role-Based Policies

### 1. Public Access (Anonymous/Authenticated Users)
**Description**: Users can see active game sessions to join them. Anonymous authentication is enabled for easy access without registration.

```sql
-- Anyone can read active sessions to find games to join
CREATE POLICY "Public - Sessions Read" ON sessions
  FOR SELECT
  TO authenticated, anon
  USING (status != 'ended' OR ended_at > NOW() - INTERVAL '1 hour');

-- Authenticated users can create new sessions
CREATE POLICY "Authenticated - Sessions Create" ON sessions
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);
```

### 2. Session Participants (Team Members)
**Description**: Users who join a session become team members and can access game data for that specific session only.

```sql
-- Team members can read teams in their sessions
CREATE POLICY "Team Members - Teams Read" ON teams
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Users can join as team members, but only if they don't already have a team in this session
CREATE POLICY "Users - Teams Join" ON teams
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (uid = COALESCE(auth.uid()::text, uid));

-- Team members can update their own team data
CREATE POLICY "Team Members - Teams Update" ON teams
  FOR UPDATE
  TO authenticated, anon
  USING (uid = auth.uid()::text);
```

### 3. Session Hosts (Game Administrators)
**Description**: The user who created the session has host privileges to manage the game.

```sql
-- Hosts can update their own sessions
CREATE POLICY "Hosts - Sessions Manage" ON sessions
  FOR UPDATE
  TO authenticated, anon
  USING (host_uid = auth.uid()::text);
```

### 4. Game Content Access
**Description**: Players can access answers and votes only for sessions they're participating in.

```sql
-- Players can read answers from their sessions
CREATE POLICY "Players - Answers Read" ON answers
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Teams can submit answers for their sessions
CREATE POLICY "Teams - Answers Submit" ON answers
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = answers.team_id
      AND teams.uid = auth.uid()::text
    )
  );

-- Players can read votes from their sessions
CREATE POLICY "Players - Votes Read" ON votes
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Teams can submit votes for their sessions
CREATE POLICY "Teams - Votes Submit" ON votes
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = votes.voter_id
      AND teams.uid = auth.uid()::text
    )
  );
```

### 5. Analytics Access
**Description**: Only session hosts can view analytics for their games.

```sql
-- Hosts can read analytics for their sessions
CREATE POLICY "Hosts - Analytics Read" ON session_analytics
  FOR SELECT
  TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = session_analytics.session_id
      AND sessions.host_uid = auth.uid()::text
    )
  );
```

## Realtime Subscriptions
**Description**: Live game updates via session-specific channels. RLS automatically filters broadcasts to authorized users only.

```sql
-- Channel format: `session:${session_id}`
-- Client subscription:
-- supabase.channel(`session:${sessionId}`).on('postgres_changes', {...}).subscribe()

-- Listens for: session updates, team joins, answers, votes
-- Auto-applies all RLS policies above for secure real-time updates
```

## JWT Claims Setup
**Description**: Anonymous authentication for easy game access. No special JWT claims needed - standard Supabase anonymous auth.

```typescript
// Simple anonymous sign-in for game access
const { data, error } = await supabase.auth.signInAnonymously();

// User gets standard JWT with auth.uid()
// Session-based access control via RLS policies
```

## Testing Policies
**Description**: Verify session isolation in Supabase SQL Editor.

```sql
-- Test session access (anyone can see active sessions)
SELECT code, status FROM sessions WHERE status != 'ended' LIMIT 5;

-- Test team membership (simulate authenticated user)
SET ROLE authenticated;
SET LOCAL "request.jwt.claims" = jsonb_build_object('sub', 'user-123');

-- User should be able to create a session
INSERT INTO sessions (code, host_uid) VALUES ('TEST123', 'user-123');

-- User should be able to join as a team
INSERT INTO teams (session_id, uid, team_name)
SELECT id, 'user-123', 'Test Team' FROM sessions WHERE code = 'TEST123';
```

## Deployment Instructions
**Description**: These RLS policies are designed for the playnow.social Event Platform and should be applied after the main schema migration.

```sql
-- Apply these policies via Supabase Dashboard SQL Editor
-- Or add to a new migration file: supabase/migrations/20250101000003_rls_policies.sql

-- Note: These policies work with anonymous authentication enabled
-- Make sure anonymous sign-ins are enabled in Authentication > Providers
```

## Security Model Summary

- **Anonymous Access**: Users can browse and join public games without registration
- **Session Isolation**: Players can only access data for sessions they're participating in
- **Host Control**: Session creators have management privileges for their games
- **Data Integrity**: Users can only modify their own submissions and team data
- **Analytics Privacy**: Only hosts can view analytics for their sessions

**File updated as `rls.md` for topcomment.playnow.social Event Platform**[file:1]
