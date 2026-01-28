# Database Complete Guide

## Overview

This comprehensive guide covers the entire Social Game Engine database schema, including all tables, relationships, data flows, and operational procedures. The database supports multiple game modes (Classic, Jeopardy, Top Comment) with team-based gameplay, real-time features, and venue management.

---

## 🏗️ Database Architecture

### Core Design Principles
- **Multi-game support**: Classic, Jeopardy, Top Comment, VIBox modes
- **Team-based gameplay**: Multiple players per team with captain system
- **Real-time capabilities**: WebSocket subscriptions and live updates
- **Venue management**: Multi-venue support with staff permissions
- **Anonymous users**: Guest participation with upgrade paths
- **Analytics tracking**: Comprehensive session and user analytics

### Schema Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Sessions      │    │     Teams       │    │   Team Members  │
│                 │    │                 │    │                 │
│  • id (UUID)    │◄───┤  • id (UUID)    │◄───┤  • id (UUID)    │
│  • code (TEXT)  │    │  • session_id   │    │  • team_id      │
│  • host_uid     │    │  • team_name    │    │  • user_id      │
│  • status       │    │  • captain_id   │    │  • device_id    │
│  • settings     │    │  • score        │    │  • is_captain   │
│  • category_grid│    │  • team_code    │    │  • joined_at    │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                       │
          └──────────────────────┼───────────────────────┘
                                 │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Answers     │    │      Votes      │    │  Prompt Libraries│
│                 │    │                 │    │                 │
│  • id (UUID)    │◄───┤  • id (UUID)    │    │  • id (TEXT)    │
│  • session_id   │    │  • session_id   │    │  • name         │
│  • team_id      │    │  • voter_id     │    │  • emoji        │
│  • round_index  │    │  • answer_id    │    │  • description  │
│  • text         │    │  • round_index  │    │  • is_active    │
│  • masked       │    │  • group_id     │    │  • sort_order   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 📋 Complete Table Schema

### Core Game Tables

#### `sessions` - Game Sessions
**Purpose**: Central table for all game sessions across all game modes

```sql
CREATE TABLE public.sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,                    -- 6-digit session code (ABC123)
  host_uid text NOT NULL,                       -- Host user ID (TEXT for compatibility)
  status text NOT NULL DEFAULT 'lobby',
    CHECK (status IN ('lobby', 'category-select', 'answer', 'vote', 'results', 'ended')),
  round_index integer NOT NULL DEFAULT 0,
  rounds jsonb NOT NULL DEFAULT '[]'::jsonb,    -- Round configuration data
  vote_group_index integer,                     -- Current voting group
  prompt_deck jsonb NOT NULL DEFAULT '[]'::jsonb,
  prompt_cursor integer NOT NULL DEFAULT 0,
  prompt_library_id text NOT NULL DEFAULT 'classic',
  settings jsonb NOT NULL DEFAULT '{"maxTeams": 24, "voteSecs": 30, "answerSecs": 90, "resultsSecs": 12}'::jsonb,
  venue_name text,
  venue_key text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  started_at timestamp with time zone,
  ended_at timestamp with time zone,
  ends_at timestamp with time zone,             -- Timer expiration
  paused boolean DEFAULT false,
  paused_at timestamp with time zone,
  total_paused_ms integer DEFAULT 0,
  ended_by_host boolean NOT NULL DEFAULT false,
  category_grid jsonb,                          -- Jeopardy mode category grid
  max_teams integer DEFAULT 20,                 -- Maximum teams allowed
  CONSTRAINT sessions_pkey PRIMARY KEY (id)
);
```

**Key Features:**
- **Multi-game support**: Works with Classic, Jeopardy, Top Comment modes
- **Real-time timers**: `ends_at`, `paused`, `total_paused_ms` for pause/resume
- **Jeopardy support**: `category_grid` for 6×7 category system
- **Flexible settings**: JSONB settings for game configuration
- **Venue integration**: `venue_name`, `venue_key` for venue-specific sessions

#### `teams` - Team Information
**Purpose**: Team data with captain system and scoring

```sql
CREATE TABLE public.teams (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  uid text,                                     -- Legacy captain ID (TEXT)
  team_name text NOT NULL,
  is_host boolean NOT NULL DEFAULT false,
  score integer NOT NULL DEFAULT 0,
  mascot_id integer,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  last_active_at timestamp with time zone NOT NULL DEFAULT now(),
  team_code character varying UNIQUE,           -- 4-digit team code
  captain_id uuid,                              -- Proper captain foreign key
  CONSTRAINT teams_pkey PRIMARY KEY (id),
  CONSTRAINT teams_captain_id_fkey FOREIGN KEY (captain_id) REFERENCES auth.users(id),
  CONSTRAINT teams_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id)
);
```

**Key Features:**
- **Dual captain system**: `uid` (legacy) + `captain_id` (proper FK)
- **Team codes**: 4-digit codes for easy joining
- **Scoring system**: Accumulated points across rounds
- **Activity tracking**: `last_active_at` for timeout management

#### `team_members` - Team Membership
**Purpose**: Individual team members with roles and device tracking

```sql
CREATE TABLE public.team_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  user_id uuid,                                 -- Auth user ID (UUID)
  device_id character varying,                  -- Anonymous user device ID
  joined_at timestamp with time zone DEFAULT now(),
  last_active timestamp with time zone DEFAULT now(),
  is_captain boolean DEFAULT false,
  player_name text,                             -- Display name for anonymous users
  CONSTRAINT team_members_pkey PRIMARY KEY (id),
  CONSTRAINT team_members_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id)
);
```

**Key Features:**
- **Mixed authentication**: Supports both authenticated (`user_id`) and anonymous (`device_id`) users
- **Captain tracking**: `is_captain` flag for role management
- **Activity monitoring**: `last_active` for timeout handling
- **Display names**: `player_name` for anonymous users

#### `team_codes` - Team Code Management
**Purpose**: Pre-generated team codes for session setup

```sql
CREATE TABLE public.team_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code character varying NOT NULL UNIQUE,        -- 4-digit team code
  session_id uuid NOT NULL,
  team_id uuid,                                 -- Assigned team (NULL if unused)
  created_at timestamp with time zone DEFAULT now(),
  assigned_at timestamp with time zone,          -- When code was assigned to team
  is_used boolean DEFAULT false,                -- Whether code is assigned
  CONSTRAINT team_codes_pkey PRIMARY KEY (id),
  CONSTRAINT team_codes_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id),
  CONSTRAINT team_codes_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id)
);
```

### Game Content Tables

#### `prompt_libraries` - Question Categories
**Purpose**: Organized collections of prompts/questions

```sql
CREATE TABLE public.prompt_libraries (
  id text NOT NULL,                             -- Text ID for easy reference
  name text NOT NULL,
  emoji text NOT NULL,                          -- Display emoji
  description text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT prompt_libraries_pkey PRIMARY KEY (id)
);
```

#### `prompts` - Individual Questions
**Purpose**: Individual questions/prompts with analytics

```sql
CREATE TABLE public.prompts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  library_id text NOT NULL,
  text text NOT NULL,
  variant text,                                  -- Question variants
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  times_shown integer NOT NULL DEFAULT 0,        -- Analytics: times displayed
  times_answered integer NOT NULL DEFAULT 0,    -- Analytics: times answered
  avg_answer_time_ms integer,                  -- Analytics: average response time
  thumbs_up_count integer NOT NULL DEFAULT 0,    -- Analytics: user feedback
  thumbs_down_count integer NOT NULL DEFAULT 0,  -- Analytics: user feedback
  CONSTRAINT prompts_pkey PRIMARY KEY (id),
  CONSTRAINT prompts_library_id_fkey FOREIGN KEY (library_id) REFERENCES public.prompt_libraries(id)
);
```

### Game Play Tables

#### `answers` - Team Answers
**Purpose**: Team-submitted answers for each round

```sql
CREATE TABLE public.answers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  team_id uuid NOT NULL,
  round_index integer NOT NULL,
  group_id text NOT NULL,                       -- Group identifier for voting
  text text NOT NULL,
  masked boolean NOT NULL DEFAULT false,       -- Whether answer is hidden
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT answers_pkey PRIMARY KEY (id),
  CONSTRAINT answers_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id),
  CONSTRAINT answers_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id)
);
```

#### `votes` - Team Voting
**Purpose**: Team votes on answers

```sql
CREATE TABLE public.votes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  voter_id uuid NOT NULL,                       -- Voting team ID
  answer_id uuid NOT NULL,                       -- Answer being voted on
  round_index integer NOT NULL,
  group_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT votes_pkey PRIMARY KEY (id),
  CONSTRAINT votes_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id),
  CONSTRAINT votes_voter_id_fkey FOREIGN KEY (voter_id) REFERENCES public.teams(id),
  CONSTRAINT votes_answer_id_fkey FOREIGN KEY (answer_id) REFERENCES public.answers(id)
);
```

### Moderation Tables

#### `banned_teams` - Team Bans
**Purpose**: Team banning across sessions

```sql
CREATE TABLE public.banned_teams (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  team_id uuid NOT NULL,
  team_name text NOT NULL,
  banned_at timestamp with time zone DEFAULT now(),
  banned_by uuid,                               -- User who issued ban
  reason text,                                  -- Ban reason
  uid text,                                      -- Legacy user ID field
  CONSTRAINT banned_teams_pkey PRIMARY KEY (id),
  CONSTRAINT banned_teams_banned_by_fkey FOREIGN KEY (banned_by) REFERENCES auth.users(id),
  CONSTRAINT banned_teams_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id)
);
```

### Analytics Tables

#### `session_analytics` - Session Performance
**Purpose**: Session-level analytics and metrics

```sql
CREATE TABLE public.session_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL UNIQUE,
  joined_count integer NOT NULL DEFAULT 0,      -- Total players joined
  answer_rate numeric NOT NULL DEFAULT 0,       -- Answer submission rate
  vote_rate numeric NOT NULL DEFAULT 0,          -- Voting participation rate
  duration integer NOT NULL DEFAULT 0,           -- Session duration in seconds
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT session_analytics_pkey PRIMARY KEY (id),
  CONSTRAINT session_analytics_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id)
);
```

### User Management Tables

#### `users` - User Accounts
**Purpose**: User account management including anonymous users

```sql
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  auth_user_id text UNIQUE,                      -- Supabase Auth user ID
  username text NOT NULL,
  display_name text,
  avatar_url text,
  is_anonymous boolean NOT NULL DEFAULT false,    -- Anonymous user flag
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_active_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,            -- Anonymous user expiration
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
```

### Venue Management Tables

#### `venues` - Venue Information
**Purpose**: Physical venue data for multi-venue support

```sql
CREATE TABLE public.venues (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,                     -- URL-friendly venue identifier
  description text,
  features jsonb DEFAULT '{"comments": true}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT venues_pkey PRIMARY KEY (id)
);
```

#### `venue_accounts` - Venue Staff Accounts
**Purpose**: Venue staff authentication and management

```sql
CREATE TABLE public.venue_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  auth_user_id text NOT NULL UNIQUE,
  email text NOT NULL,
  full_name text NOT NULL,
  phone text,
  role text NOT NULL CHECK (role IN ('bar_owner', 'staff')),
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_active_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT venue_accounts_pkey PRIMARY KEY (id)
);
```

#### `venue_staff` - Venue Staff Permissions
**Purpose**: Staff permissions and venue assignments

```sql
CREATE TABLE public.venue_staff (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  venue_account_id uuid NOT NULL,
  venue_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('owner', 'manager', 'staff')),
  permissions jsonb DEFAULT '{"manage_posts": true, "manage_staff": false, "manage_events": true, "view_analytics": true}'::jsonb,
  hired_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT venue_staff_pkey PRIMARY KEY (id),
  CONSTRAINT venue_staff_venue_account_id_fkey FOREIGN KEY (venue_account_id) REFERENCES public.venue_accounts(id),
  CONSTRAINT venue_staff_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venues(id)
);
```

### Social Features Tables

#### `feed_comments` - Social Feed Comments
**Purpose**: Venue social feed with nested comments

```sql
CREATE TABLE public.feed_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,                         -- Parent post (could be venue post)
  author_id uuid NOT NULL,
  parent_comment_id uuid,                        -- For nested comments (NULL = top-level)
  content text NOT NULL,
  like_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT feed_comments_pkey PRIMARY KEY (id),
  CONSTRAINT feed_comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id),
  CONSTRAINT feed_comments_parent_comment_id_fkey FOREIGN KEY (parent_comment_id) REFERENCES public.feed_comments(id)
);
```

#### `feed_comment_likes` - Comment Likes
**Purpose**: Like system for social comments

```sql
CREATE TABLE public.feed_comment_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT feed_comment_likes_pkey PRIMARY KEY (id),
  CONSTRAINT feed_comment_likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.feed_comments(id),
  CONSTRAINT feed_comment_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
```

### Game Mode Specific Tables

#### Top Comment Tables
**Purpose**: Legacy Top Comment game mode support

```sql
-- Top Comment Sessions (similar to regular sessions)
CREATE TABLE public.top_comment_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  host_uid uuid NOT NULL,
  status text NOT NULL,
  round_index integer NOT NULL DEFAULT 0,
  rounds jsonb NOT NULL DEFAULT '[]'::jsonb,
  vote_group_index integer,
  prompt_deck jsonb,
  prompt_cursor integer DEFAULT 0,
  prompt_library_id text,
  category_grid jsonb,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  venue_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  started_at timestamp with time zone,
  ended_at timestamp with time zone,
  ends_at timestamp with time zone,
  paused boolean DEFAULT false,
  paused_at timestamp with time zone,
  total_paused_ms integer DEFAULT 0,
  ended_by_host boolean DEFAULT false,
  CONSTRAINT top_comment_sessions_pkey PRIMARY KEY (id)
);

-- Top Comment Players (individual players, not teams)
CREATE TABLE public.top_comment_players (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  user_id uuid NOT NULL,
  display_name text NOT NULL,
  score integer NOT NULL DEFAULT 0,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  last_active_at timestamp with time zone,
  CONSTRAINT top_comment_players_pkey PRIMARY KEY (id),
  CONSTRAINT top_comment_players_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.top_comment_sessions(id)
);

-- Top Comment Answers
CREATE TABLE public.top_comment_answers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  player_id uuid NOT NULL,
  round_index integer NOT NULL,
  group_id text NOT NULL,
  text text NOT NULL,
  masked boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone,
  CONSTRAINT top_comment_answers_pkey PRIMARY KEY (id),
  CONSTRAINT top_comment_answers_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.top_comment_sessions(id),
  CONSTRAINT top_comment_answers_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.top_comment_players(id)
);

-- Top Comment Votes
CREATE TABLE public.top_comment_votes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  player_id uuid NOT NULL,
  answer_id uuid NOT NULL,
  round_index integer NOT NULL,
  group_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT top_comment_votes_pkey PRIMARY KEY (id),
  CONSTRAINT top_comment_votes_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.top_comment_sessions(id),
  CONSTRAINT top_comment_votes_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.top_comment_players(id),
  CONSTRAINT top_comment_votes_answer_id_fkey FOREIGN KEY (answer_id) REFERENCES public.top_comment_answers(id)
);
```

#### VIBox Tables
**Purpose**: VIBox jukebox music queue system

```sql
-- VIBox Queue (music queue management)
CREATE TABLE public.vibox_queue (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  track_id text NOT NULL,
  track_title text NOT NULL,
  track_artist text NOT NULL,
  track_url text NOT NULL,
  track_genre text,
  track_duration integer,
  primary_vibe text,
  secondary_vibe text,
  position integer,
  is_played boolean DEFAULT false,
  played_at timestamp without time zone,
  added_by text NOT NULL,
  added_by_user_id uuid,
  added_at timestamp without time zone DEFAULT now(),
  device_type text,
  user_agent text,
  ip_address inet,
  session_id text,
  time_in_queue integer,
  skip_count integer DEFAULT 0,
  was_skipped boolean DEFAULT false,
  play_duration integer,
  completion_percentage numeric,
  queue_length_when_added integer,
  time_of_day time without time zone,
  day_of_week integer,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT vibox_queue_pkey PRIMARY KEY (id)
);

-- VIBox Votes (music voting system)
CREATE TABLE public.vibex_votes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  track_id text NOT NULL,
  session_id text NOT NULL,
  player_id text,
  vote_type text NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT vibex_votes_pkey PRIMARY KEY (id)
);
```

---

## 🔗 Data Relationships & Flows

### Core Game Flow

#### Session Creation → Team Formation → Game Play
```
1. Create Session (sessions table)
   ↓
2. Generate Team Codes (team_codes table, 20 codes)
   ↓
3. Players Join → Create Teams (teams table)
   ↓
4. Add Team Members (team_members table)
   ↓
5. Start Game → Create Rounds (sessions.rounds JSONB)
   ↓
6. Submit Answers (answers table)
   ↓
7. Vote on Answers (votes table)
   ↓
8. Update Analytics (session_analytics table)
```

### User Identity Flow

#### Authenticated User Flow
```
auth.users(id) → users.auth_user_id → team_members.user_id
                                            ↓
                                   teams.captain_id (if captain)
```

#### Anonymous User Flow
```
Device ID → team_members.device_id → users.is_anonymous = true
                                            ↓
                                   Can upgrade to authenticated user
```

### Team Captain System

#### Captain Assignment Logic
```sql
-- First member becomes captain
UPDATE team_members 
SET is_captain = true 
WHERE id = (
  SELECT id FROM team_members 
  WHERE team_id = $1 
  ORDER BY joined_at ASC 
  LIMIT 1
);

-- Update teams table with captain reference
UPDATE teams 
SET captain_id = (
  SELECT user_id FROM team_members 
  WHERE team_id = $1 AND is_captain = true 
  LIMIT 1
)
WHERE id = $1;
```

---

## 🎯 Game Mode Implementations

### Classic Mode
- **Simple flow**: Lobby → Answer → Vote → Results → Repeat
- **Team-based**: Multiple players per team
- **Captain system**: Captain submits final answer
- **Standard scoring**: Points based on votes

### Jeopardy Mode
- **Category selection**: 6×7 grid with host/team selection
- **Strategic gameplay**: Categories deplete as used
- **Enhanced scoring**: Point values and multipliers
- **Extended flow**: Lobby → Category-Select → Answer → Vote → Results

#### Jeopardy Category Grid Structure
```json
{
  "categories": [
    {
      "id": "popculture",
      "usedPrompts": [0, 2, 5],
      "promptBonuses": [
        {
          "promptIndex": 0,
          "bonusType": "points",
          "bonusValue": 100,
          "revealed": true
        },
        {
          "promptIndex": 1,
          "bonusType": "multiplier",
          "bonusValue": 2,
          "revealed": false
        }
      ]
    }
  ],
  "totalSlots": 42
}
```

### Top Comment Mode
- **Individual players**: No teams, direct player competition
- **Social voting**: Players vote on individual answers
- **Legacy support**: Maintained for backward compatibility
- **Separate tables**: Dedicated top_comment_* tables

### VIBox Mode
- **Music queue**: Track selection and voting
- **Vibe system**: Primary/secondary music categorization
- **Analytics**: Detailed play statistics and user preferences
- **Real-time updates**: Queue position and voting status

---

## 🔐 Security & Access Control

### Row Level Security (RLS) Policies

#### Session Access
```sql
-- Users can only see sessions they're in
CREATE POLICY "Users can view their sessions" ON sessions
FOR SELECT USING (
  id IN (
    SELECT session_id FROM team_members 
    WHERE user_id = auth.uid()
  )
  OR host_uid = auth.uid()::text
);

-- Hosts can update their sessions
CREATE POLICY "Hosts can update sessions" ON sessions
FOR UPDATE USING (host_uid = auth.uid()::text);
```

#### Team Management
```sql
-- Team members can view their team
CREATE POLICY "Team members can view team" ON teams
FOR SELECT USING (
  id IN (
    SELECT team_id FROM team_members 
    WHERE user_id = auth.uid()
  )
);

-- Captains can update team settings
CREATE POLICY "Captains can update team" ON teams
FOR UPDATE USING (
  captain_id = auth.uid()
);
```

#### Answer & Vote Security
```sql
-- Teams can only submit answers for their session
CREATE POLICY "Teams can submit answers" ON answers
FOR INSERT WITH CHECK (
  session_id IN (
    SELECT session_id FROM team_members 
    WHERE user_id = auth.uid()
  )
);

-- Teams can only vote in their session
CREATE POLICY "Teams can vote" ON votes
FOR INSERT WITH CHECK (
  session_id IN (
    SELECT session_id FROM team_members 
    WHERE user_id = auth.uid()
  )
);
```

### Data Validation

#### Input Sanitization
```sql
-- Validate session codes
ALTER TABLE sessions 
ADD CONSTRAINT valid_session_code 
CHECK (code ~ '^[A-Z0-9]{6}$');

-- Validate team codes
ALTER TABLE teams 
ADD CONSTRAINT valid_team_code 
CHECK (team_code ~ '^[0-9]{4}$');

-- Validate answer content length
ALTER TABLE answers 
ADD CONSTRAINT valid_answer_length 
CHECK (length(text) > 0 AND length(text) <= 500);
```

---

## 📊 Performance Optimization

### Indexing Strategy

#### Primary Indexes
```sql
-- Session lookups
CREATE INDEX idx_sessions_code ON sessions(code);
CREATE INDEX idx_sessions_host ON sessions(host_uid);
CREATE INDEX idx_sessions_status ON sessions(status);

-- Team lookups
CREATE INDEX idx_teams_session ON teams(session_id);
CREATE INDEX idx_teams_code ON teams(team_code);
CREATE INDEX idx_teams_captain ON teams(captain_id);

-- Team member lookups
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_team_members_device ON team_members(device_id);
```

#### Performance Indexes
```sql
-- Answer voting queries
CREATE INDEX idx_answers_session_round ON answers(session_id, round_index);
CREATE INDEX idx_votes_session_round ON votes(session_id, round_index);

-- Analytics queries
CREATE INDEX idx_session_analytics_session ON session_analytics(session_id);

-- Social feed queries
CREATE INDEX idx_feed_comments_post ON feed_comments(post_id);
CREATE INDEX idx_feed_comments_author ON feed_comments(author_id);
CREATE INDEX idx_feed_comment_likes_comment ON feed_comment_likes(comment_id);
```

#### JSONB Indexes
```sql
-- Jeopardy category grid
CREATE INDEX idx_sessions_category_grid ON sessions 
USING GIN(category_grid) 
WHERE category_grid IS NOT NULL;

-- Session settings
CREATE INDEX idx_sessions_settings ON sessions 
USING GIN(settings);
```

### Query Optimization

#### Common Query Patterns
```sql
-- Get session with teams and members
SELECT 
  s.*,
  t.id as team_id,
  t.team_name,
  t.score,
  tm.user_id,
  tm.is_captain,
  tm.player_name
FROM sessions s
LEFT JOIN teams t ON s.id = t.session_id
LEFT JOIN team_members tm ON t.id = tm.team_id
WHERE s.id = $1;

-- Get round answers with vote counts
SELECT 
  a.*,
  COUNT(v.id) as vote_count
FROM answers a
LEFT JOIN votes v ON a.id = v.answer_id
WHERE a.session_id = $1 
  AND a.round_index = $2
GROUP BY a.id;

-- Get team performance analytics
SELECT 
  t.team_name,
  t.score,
  COUNT(a.id) as answers_submitted,
  COUNT(v.id) as votes_cast,
  AVG(EXTRACT(EPOCH FROM (v.created_at - a.created_at))) as avg_vote_time
FROM teams t
LEFT JOIN answers a ON t.id = a.team_id
LEFT JOIN votes v ON a.id = v.answer_id
WHERE t.session_id = $1
GROUP BY t.id, t.team_name, t.score;
```

---

## 🔄 Real-time Subscriptions

### WebSocket Channel Patterns

#### Session Updates
```typescript
// Subscribe to session changes
const sessionSubscription = supabase
  .channel(`session-${sessionId}`)
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'sessions' },
    (payload) => handleSessionUpdate(payload)
  )
  .subscribe();
```

#### Team Updates
```typescript
// Subscribe to team changes
const teamSubscription = supabase
  .channel(`teams-${sessionId}`)
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'teams' },
    (payload) => handleTeamUpdate(payload)
  )
  .subscribe();
```

#### Game Play Updates
```typescript
// Subscribe to answers and votes
const gameSubscription = supabase
  .channel(`game-${sessionId}`)
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'answers' },
    (payload) => handleNewAnswer(payload)
  )
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'votes' },
    (payload) => handleNewVote(payload)
  )
  .subscribe();
```

---

## 🧪 Testing & Development

### Test Data Management

#### Test Session Creation
```sql
-- Create test session
INSERT INTO sessions (
  code, host_uid, status, settings
) VALUES (
  'TEST123', 
  'test-user-123', 
  'lobby',
  '{"maxTeams": 4, "voteSecs": 30, "answerSecs": 60}'
) RETURNING id;
```

#### Test Team Generation
```sql
-- Generate test teams
INSERT INTO teams (session_id, team_name, team_code)
SELECT 
  $1,  -- session_id
  'Test Team ' || generate_series(1, 4),
  LPAD(generate_series(1, 4)::text, 4, '0')
RETURNING id;
```

### Development Procedures

#### Schema Migrations
```sql
-- Migration template
BEGIN;

-- Add new column
ALTER TABLE sessions 
ADD COLUMN new_feature jsonb DEFAULT '{}';

-- Update existing data
UPDATE sessions 
SET new_feature = '{"enabled": true}'
WHERE created_at > NOW() - INTERVAL '30 days';

-- Add constraint
ALTER TABLE sessions 
ADD CONSTRAINT valid_new_feature 
CHECK (jsonb_typeof(new_feature) = 'object');

-- Create index
CREATE INDEX idx_sessions_new_feature ON sessions 
USING GIN(new_feature);

COMMIT;
```

---

## 📈 Analytics & Monitoring

### Performance Metrics

#### Database Performance
```sql
-- Slow query analysis
SELECT 
  query,
  mean_exec_time,
  calls,
  total_exec_time,
  stddev_exec_time
FROM pg_stat_statements
WHERE query LIKE '%sessions%'
ORDER BY mean_exec_time DESC
LIMIT 10;
```

#### Usage Analytics
```sql
-- Session statistics
SELECT 
  DATE_TRUNC('day', created_at) as day,
  COUNT(*) as sessions_created,
  AVG(EXTRACT(EPOCH FROM (ended_at - started_at))/60) as avg_duration_minutes,
  COUNT(DISTINCT host_uid) as unique_hosts
FROM sessions
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY day
ORDER BY day;
```

#### Team Analytics
```sql
-- Team formation statistics
SELECT 
  COUNT(*) as total_teams,
  AVG(team_size) as avg_team_size,
  MAX(team_size) as max_team_size,
  COUNT(CASE WHEN team_size = 1 THEN 1 END) as solo_teams,
  COUNT(CASE WHEN team_size > 3 THEN 1 END) as large_teams
FROM (
  SELECT 
    t.id,
    COUNT(tm.id) as team_size
  FROM teams t
  LEFT JOIN team_members tm ON t.id = tm.team_id
  GROUP BY t.id
) team_stats;
```

---

## 🚨 Troubleshooting Guide

### Common Issues

#### Orphaned Team Members
```sql
-- Find team members without valid teams
SELECT tm.id, tm.user_id, tm.team_id
FROM team_members tm
LEFT JOIN teams t ON tm.team_id = t.id
WHERE t.id IS NULL;

-- Clean up orphaned members
DELETE FROM team_members
WHERE team_id NOT IN (SELECT id FROM teams);
```

#### Invalid Captain References
```sql
-- Find teams with invalid captain references
SELECT t.id, t.team_name, t.captain_id
FROM teams t
LEFT JOIN auth.users u ON t.captain_id = u.id
WHERE t.captain_id IS NOT NULL AND u.id IS NULL;

-- Fix invalid captain references
UPDATE teams 
SET captain_id = NULL 
WHERE captain_id NOT IN (SELECT id FROM auth.users);
```

#### Session State Inconsistencies
```sql
-- Find sessions stuck in old states
SELECT id, code, status, created_at, started_at
FROM sessions
WHERE status IN ('answer', 'vote') 
  AND started_at < NOW() - INTERVAL '2 hours';

-- Reset stuck sessions
UPDATE sessions 
SET status = 'lobby', 
    started_at = NULL,
    ended_at = NULL
WHERE status IN ('answer', 'vote') 
  AND started_at < NOW() - INTERVAL '2 hours';
```

### Performance Issues

#### High Memory Usage
```sql
-- Check large JSONB fields
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
```

#### Slow Queries
```sql
-- Identify slow queries
SELECT 
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  stddev_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 1000  -- > 1 second
ORDER BY mean_exec_time DESC;
```

---

## 🔮 Future Schema Evolution

### Planned Enhancements

#### Game Mode Expansion
```sql
-- Future: Game modes table
CREATE TABLE game_modes (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  settings_schema jsonb,
  is_active boolean DEFAULT true
);

-- Future: Session game mode reference
ALTER TABLE sessions 
ADD COLUMN game_mode text REFERENCES game_modes(id);
```

#### Advanced Analytics
```sql
-- Future: Detailed user analytics
CREATE TABLE user_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  session_id uuid REFERENCES sessions(id),
  event_type text NOT NULL,
  event_data jsonb,
  created_at timestamp with time zone DEFAULT now()
);
```

#### Enhanced Social Features
```sql
-- Future: User friendships
CREATE TABLE user_friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  friend_id uuid REFERENCES users(id),
  status text CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at timestamp with time zone DEFAULT now()
);
```

### Migration Strategy

#### Backward Compatibility
- **Never remove columns** without migration period
- **Use default values** for new required fields
- **Maintain legacy fields** alongside new implementations
- **Provide migration scripts** for data transformation

#### Version Control
- **Schema versioning** with migration tracking
- **Rollback procedures** for failed migrations
- **Testing environments** with production data clones
- **Documentation updates** with each schema change

---

*This complete database guide provides comprehensive coverage of the entire Social Game Engine database schema, including all tables, relationships, security policies, performance optimization, and operational procedures.*
