-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.answers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  team_id uuid NOT NULL,
  round_index integer NOT NULL,
  group_id text NOT NULL,
  text text NOT NULL,
  masked boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT answers_pkey PRIMARY KEY (id),
  CONSTRAINT answers_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id),
  CONSTRAINT answers_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id)
);
CREATE TABLE public.banned_teams (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  team_id uuid NOT NULL,
  team_name text NOT NULL,
  banned_at timestamp with time zone DEFAULT now(),
  banned_by uuid,
  reason text,
  uid text,
  CONSTRAINT banned_teams_pkey PRIMARY KEY (id),
  CONSTRAINT banned_teams_banned_by_fkey FOREIGN KEY (banned_by) REFERENCES auth.users(id),
  CONSTRAINT banned_teams_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id)
);
CREATE TABLE public.feed_comment_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT feed_comment_likes_pkey PRIMARY KEY (id),
  CONSTRAINT feed_comment_likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.feed_comments(id),
  CONSTRAINT feed_comment_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.feed_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  author_id uuid NOT NULL,
  parent_comment_id uuid,
  content text NOT NULL,
  like_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT feed_comments_pkey PRIMARY KEY (id),
  CONSTRAINT feed_comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id),
  CONSTRAINT feed_comments_parent_comment_id_fkey FOREIGN KEY (parent_comment_id) REFERENCES public.feed_comments(id)
);
CREATE TABLE public.prompt_libraries (
  id text NOT NULL,
  name text NOT NULL,
  emoji text NOT NULL,
  description text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT prompt_libraries_pkey PRIMARY KEY (id)
);
CREATE TABLE public.prompts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  library_id text NOT NULL,
  text text NOT NULL,
  variant text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  times_shown integer NOT NULL DEFAULT 0,
  times_answered integer NOT NULL DEFAULT 0,
  avg_answer_time_ms integer,
  thumbs_up_count integer NOT NULL DEFAULT 0,
  thumbs_down_count integer NOT NULL DEFAULT 0,
  CONSTRAINT prompts_pkey PRIMARY KEY (id),
  CONSTRAINT prompts_library_id_fkey FOREIGN KEY (library_id) REFERENCES public.prompt_libraries(id)
);
CREATE TABLE public.room_memberships (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL,
  user_id uuid NOT NULL,
  player_name character varying NOT NULL,
  mascot_id integer,
  joined_at timestamp with time zone DEFAULT now(),
  last_active_at timestamp with time zone DEFAULT now(),
  is_host boolean DEFAULT false,
  is_banned boolean DEFAULT false,
  ban_reason text,
  banned_at timestamp with time zone,
  banned_by uuid,
  status character varying DEFAULT 'active'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'approved'::character varying, 'active'::character varying]::text[])),
  CONSTRAINT room_memberships_pkey PRIMARY KEY (id),
  CONSTRAINT room_memberships_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id),
  CONSTRAINT room_memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT room_memberships_banned_by_fkey FOREIGN KEY (banned_by) REFERENCES auth.users(id)
);
CREATE TABLE public.rooms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code character varying NOT NULL UNIQUE,
  host_uid uuid NOT NULL,
  name character varying,
  description text,
  status character varying DEFAULT 'active'::character varying CHECK (status::text = ANY (ARRAY['active'::character varying, 'archived'::character varying, 'suspended'::character varying]::text[])),
  max_players integer NOT NULL DEFAULT 50,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  settings jsonb DEFAULT '{}'::jsonb,
  current_session_id uuid,
  total_sessions_played integer DEFAULT 0,
  CONSTRAINT rooms_pkey PRIMARY KEY (id),
  CONSTRAINT rooms_host_uid_fkey FOREIGN KEY (host_uid) REFERENCES auth.users(id),
  CONSTRAINT fk_rooms_current_session FOREIGN KEY (current_session_id) REFERENCES public.top_comment_sessions(id)
);
CREATE TABLE public.session_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL UNIQUE,
  joined_count integer NOT NULL DEFAULT 0,
  answer_rate numeric NOT NULL DEFAULT 0,
  vote_rate numeric NOT NULL DEFAULT 0,
  duration integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT session_analytics_pkey PRIMARY KEY (id),
  CONSTRAINT session_analytics_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id)
);
CREATE TABLE public.sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  host_uid text NOT NULL,
  status text NOT NULL DEFAULT 'lobby'::text CHECK (status = ANY (ARRAY['lobby'::text, 'category-select'::text, 'answer'::text, 'vote'::text, 'results'::text, 'ended'::text])),
  round_index integer NOT NULL DEFAULT 0,
  rounds jsonb NOT NULL DEFAULT '[]'::jsonb,
  vote_group_index integer,
  prompt_deck jsonb NOT NULL DEFAULT '[]'::jsonb,
  prompt_cursor integer NOT NULL DEFAULT 0,
  prompt_library_id text NOT NULL DEFAULT 'classic'::text,
  settings jsonb NOT NULL DEFAULT '{"maxTeams": 24, "voteSecs": 30, "answerSecs": 90, "resultsSecs": 12}'::jsonb,
  venue_name text,
  venue_key text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  started_at timestamp with time zone,
  ended_at timestamp with time zone,
  ends_at timestamp with time zone,
  paused boolean DEFAULT false,
  paused_at timestamp with time zone,
  total_paused_ms integer DEFAULT 0,
  ended_by_host boolean NOT NULL DEFAULT false,
  category_grid jsonb,
  max_teams integer DEFAULT 20,
  CONSTRAINT sessions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.team_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code character varying NOT NULL UNIQUE,
  session_id uuid NOT NULL,
  team_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  assigned_at timestamp with time zone,
  is_used boolean DEFAULT false,
  CONSTRAINT team_codes_pkey PRIMARY KEY (id),
  CONSTRAINT team_codes_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id),
  CONSTRAINT team_codes_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id)
);
CREATE TABLE public.team_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  user_id uuid,
  device_id character varying,
  joined_at timestamp with time zone DEFAULT now(),
  last_active timestamp with time zone DEFAULT now(),
  is_captain boolean DEFAULT false,
  player_name text,
  CONSTRAINT team_members_pkey PRIMARY KEY (id),
  CONSTRAINT team_members_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id)
);
CREATE TABLE public.teams (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  uid text,
  team_name text NOT NULL,
  is_host boolean NOT NULL DEFAULT false,
  score integer NOT NULL DEFAULT 0,
  mascot_id integer,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  last_active_at timestamp with time zone NOT NULL DEFAULT now(),
  team_code character varying UNIQUE,
  captain_id uuid,
  CONSTRAINT teams_pkey PRIMARY KEY (id),
  CONSTRAINT teams_captain_id_fkey FOREIGN KEY (captain_id) REFERENCES auth.users(id),
  CONSTRAINT teams_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id)
);
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
CREATE TABLE public.top_comment_banned_players (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid,
  user_id uuid NOT NULL,
  display_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  room_id uuid NOT NULL,
  CONSTRAINT top_comment_banned_players_pkey PRIMARY KEY (id),
  CONSTRAINT top_comment_banned_players_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id),
  CONSTRAINT top_comment_banned_players_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.top_comment_sessions(id)
);
CREATE TABLE public.top_comment_jeopardy_backup (
  id uuid,
  code text,
  host_uid uuid,
  status text,
  round_index integer,
  rounds jsonb,
  vote_group_index integer,
  prompt_deck jsonb,
  prompt_cursor integer,
  prompt_library_id text,
  category_grid jsonb,
  settings jsonb,
  venue_name text,
  created_at timestamp with time zone,
  started_at timestamp with time zone,
  ended_at timestamp with time zone,
  ends_at timestamp with time zone,
  paused boolean,
  paused_at timestamp with time zone,
  total_paused_ms integer,
  ended_by_host boolean
);
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
CREATE TABLE public.top_comment_session_analytics (
  session_id uuid NOT NULL,
  joined_count integer NOT NULL DEFAULT 0,
  answer_rate numeric NOT NULL DEFAULT 0,
  vote_rate numeric NOT NULL DEFAULT 0,
  duration integer,
  CONSTRAINT top_comment_session_analytics_pkey PRIMARY KEY (session_id),
  CONSTRAINT top_comment_session_analytics_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.top_comment_sessions(id)
);
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
  selected_libraries ARRAY,
  current_library_index integer DEFAULT 0,
  room_id uuid,
  auto_assigned_players ARRAY DEFAULT '{}'::uuid[],
  CONSTRAINT top_comment_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT top_comment_sessions_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id)
);
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
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  auth_user_id text UNIQUE,
  username text NOT NULL,
  display_name text,
  avatar_url text,
  is_anonymous boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_active_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.venue_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  auth_user_id text NOT NULL UNIQUE,
  email text NOT NULL,
  full_name text NOT NULL,
  phone text,
  role text NOT NULL CHECK (role = ANY (ARRAY['bar_owner'::text, 'staff'::text])),
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_active_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT venue_accounts_pkey PRIMARY KEY (id)
);
CREATE TABLE public.venue_staff (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  venue_account_id uuid NOT NULL,
  venue_id uuid NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['owner'::text, 'manager'::text, 'staff'::text])),
  permissions jsonb DEFAULT '{"manage_posts": true, "manage_staff": false, "manage_events": true, "view_analytics": true}'::jsonb,
  hired_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT venue_staff_pkey PRIMARY KEY (id),
  CONSTRAINT venue_staff_venue_account_id_fkey FOREIGN KEY (venue_account_id) REFERENCES public.venue_accounts(id),
  CONSTRAINT venue_staff_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venues(id)
);
CREATE TABLE public.venues (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  features jsonb DEFAULT '{"comments": true}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT venues_pkey PRIMARY KEY (id)
);
CREATE TABLE public.vibex_votes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  track_id text NOT NULL,
  session_id text NOT NULL,
  player_id text,
  vote_type text NOT NULL CHECK (vote_type = ANY (ARRAY['up'::text, 'down'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT vibex_votes_pkey PRIMARY KEY (id)
);
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
CREATE TABLE public.votes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  voter_id uuid NOT NULL,
  answer_id uuid NOT NULL,
  round_index integer NOT NULL,
  group_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT votes_pkey PRIMARY KEY (id),
  CONSTRAINT votes_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id),
  CONSTRAINT votes_voter_id_fkey FOREIGN KEY (voter_id) REFERENCES public.teams(id),
  CONSTRAINT votes_answer_id_fkey FOREIGN KEY (answer_id) REFERENCES public.answers(id)
);