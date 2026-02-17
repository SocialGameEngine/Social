-- Phase D1: Analytics Views + Phase D2: Badge Tables
-- Migration: 20260212000000_analytics_views_and_badges.sql

-------------------------------------------------------
-- D1: Analytics Views
-------------------------------------------------------

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

-------------------------------------------------------
-- D2: Badge Tables
-------------------------------------------------------

-- Badge definitions (static, seeded)
create table if not exists badge_definitions (
  id text primary key,
  name text not null,
  description text not null,
  emoji text not null,
  category text not null,
  criteria_type text not null,
  criteria_value integer not null,
  criteria_metric text not null,
  rarity text not null default 'common',
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

create index if not exists idx_player_badges_user on player_badges(user_id);
create index if not exists idx_player_badges_room on player_badges(room_id);

-- RLS for badge tables
alter table badge_definitions enable row level security;
alter table player_badges enable row level security;

-- Badge definitions are readable by everyone
create policy "badge_definitions_select" on badge_definitions
  for select using (true);

-- Players can read their own badges
create policy "player_badges_select_own" on player_badges
  for select using (auth.uid() = user_id);

-- Players can read badges of others in the same room
create policy "player_badges_select_room" on player_badges
  for select using (
    exists (
      select 1 from room_memberships rm
      where rm.room_id = player_badges.room_id
      and rm.user_id = auth.uid()
    )
  );

-- Only the system (service role) can insert badges, but allow authenticated users
-- to trigger badge evaluation via RPC
create policy "player_badges_insert" on player_badges
  for insert with check (auth.uid() = user_id);

-- Seed badge definitions
insert into badge_definitions (id, name, description, emoji, category, criteria_type, criteria_value, criteria_metric, rarity) values
  -- Gameplay
  ('first_win', 'First Victory', 'Win your first round', '🏆', 'gameplay', 'count', 1, 'wins', 'common'),
  ('win_streak_3', 'Hot Streak', 'Win 3 rounds in a row', '🔥', 'gameplay', 'streak', 3, 'wins', 'rare'),
  ('top_scorer', 'Top Scorer', 'Accumulate 1000 total points', '⭐', 'gameplay', 'milestone', 1000, 'total_score', 'epic'),
  -- Social
  ('social_butterfly', 'Social Butterfly', 'Send 50 chat messages', '🦋', 'social', 'count', 50, 'chat_messages', 'common'),
  ('challenger', 'Challenger', 'Send 10 challenges', '⚔️', 'social', 'count', 10, 'challenges_sent', 'rare'),
  ('crowd_favorite', 'Crowd Favorite', 'Receive 100 reactions', '👏', 'social', 'count', 100, 'reactions_received', 'epic'),
  -- Loyalty
  ('regular', 'Regular', 'Play 5 sessions', '🍺', 'loyalty', 'count', 5, 'sessions_played', 'common'),
  ('veteran', 'Veteran', 'Play 20 sessions', '🎖️', 'loyalty', 'count', 20, 'sessions_played', 'rare'),
  ('legend', 'Legend', 'Play 50 sessions', '👑', 'loyalty', 'count', 50, 'sessions_played', 'legendary'),
  -- Special
  ('question_author', 'Question Author', 'Get a submitted question approved', '✍️', 'special', 'count', 1, 'submissions_approved', 'rare'),
  ('fibbage_master', 'Fibbage Master', 'Fool 10 players in Headline Fibbage', '🎭', 'special', 'count', 10, 'fibbage_fools', 'epic')
on conflict (id) do nothing;
