-- Top Comment (teamless) schema
-- This schema is isolated for the top-comment app and avoids team-based tables.

create table if not exists top_comment_sessions (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  host_uid uuid not null,
  status text not null,
  round_index integer not null default 0,
  rounds jsonb not null default '[]'::jsonb,
  vote_group_index integer,
  prompt_deck jsonb,
  prompt_cursor integer default 0,
  prompt_library_id text,
  category_grid jsonb,
  settings jsonb not null default '{}'::jsonb,
  venue_name text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  ended_at timestamptz,
  ends_at timestamptz,
  paused boolean default false,
  paused_at timestamptz,
  total_paused_ms integer default 0,
  ended_by_host boolean default false
);

create table if not exists top_comment_players (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references top_comment_sessions(id) on delete cascade,
  user_id uuid not null,
  display_name text not null,
  score integer not null default 0,
  joined_at timestamptz not null default now(),
  last_active_at timestamptz,
  unique(session_id, user_id)
);

create table if not exists top_comment_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references top_comment_sessions(id) on delete cascade,
  player_id uuid not null references top_comment_players(id) on delete cascade,
  round_index integer not null,
  group_id text not null,
  text text not null,
  masked boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  unique(session_id, player_id, round_index)
);

create table if not exists top_comment_votes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references top_comment_sessions(id) on delete cascade,
  player_id uuid not null references top_comment_players(id) on delete cascade,
  answer_id uuid not null references top_comment_answers(id) on delete cascade,
  round_index integer not null,
  group_id text not null,
  created_at timestamptz not null default now(),
  unique(player_id, round_index, group_id)
);

create table if not exists top_comment_banned_players (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references top_comment_sessions(id) on delete cascade,
  user_id uuid not null,
  display_name text,
  created_at timestamptz not null default now(),
  unique(session_id, user_id)
);

create table if not exists top_comment_session_analytics (
  session_id uuid primary key references top_comment_sessions(id) on delete cascade,
  joined_count integer not null default 0,
  answer_rate numeric not null default 0,
  vote_rate numeric not null default 0,
  duration integer
);

create index if not exists idx_top_comment_players_session on top_comment_players(session_id);
create index if not exists idx_top_comment_answers_session on top_comment_answers(session_id);
create index if not exists idx_top_comment_votes_session on top_comment_votes(session_id);
create index if not exists idx_top_comment_votes_answer on top_comment_votes(answer_id);

create or replace function increment_top_comment_player_score(
  player_id uuid,
  score_delta integer
)
returns void as $$
begin
  update top_comment_players
  set score = score + score_delta
  where id = player_id;
end;
$$ language plpgsql security definer;

create or replace function pause_top_comment_session_atomic(
  p_session_id uuid,
  p_pause boolean,
  p_paused_at timestamptz,
  p_ends_at timestamptz,
  p_total_paused_ms integer
)
returns setof top_comment_sessions as $$
begin
  return query
  update top_comment_sessions
  set 
    paused = p_pause,
    paused_at = p_paused_at,
    ends_at = p_ends_at,
    total_paused_ms = p_total_paused_ms
  where id = p_session_id
  returning *;
end;
$$ language plpgsql security definer;
