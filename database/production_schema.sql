


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."activate_pending_socialites_on_round_advance"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF NEW.current_round_index IS NOT DISTINCT FROM OLD.current_round_index THEN
    RETURN NEW;
  END IF;
  IF NEW.current_round_index IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE public.socialites
  SET
    pending_until_round_index = NULL,
    is_active = TRUE,
    updated_at = NOW()
  WHERE sociale_id = NEW.id
    AND pending_until_round_index IS NOT NULL
    AND pending_until_round_index <= NEW.current_round_index;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."activate_pending_socialites_on_round_advance"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."advance_interaction_to_voting"("p_interaction_id" "uuid", "p_voting_seconds" integer DEFAULT 60) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_current_status TEXT;
BEGIN
  -- Get current status
  SELECT status INTO v_current_status 
  FROM public.interactions 
  WHERE id = p_interaction_id;
  
  -- Can only advance from 'active' to 'voting'
  IF v_current_status != 'active' THEN
    RETURN FALSE;
  END IF;
  
  -- Update to voting phase
  UPDATE public.interactions
  SET 
    status = 'voting',
    voting_ends_at = now() + (p_voting_seconds || ' seconds')::INTERVAL,
    voting_seconds = p_voting_seconds
  WHERE id = p_interaction_id;
  
  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."advance_interaction_to_voting"("p_interaction_id" "uuid", "p_voting_seconds" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."advance_interaction_to_voting_on_answer_timeout"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Only advance if interaction is still in 'active' phase and answer time has expired
  UPDATE public.interactions
  SET 
    status = 'voting',
    voting_ends_at = now() + (COALESCE(answer_seconds, 300) || ' seconds')::INTERVAL,
    voting_seconds = COALESCE(answer_seconds, 300)
  WHERE id = NEW.id
    AND NEW.status = 'active'
    AND NEW.answer_ends_at IS NOT NULL
    AND NEW.answer_ends_at <= now();
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."advance_interaction_to_voting_on_answer_timeout"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_display_name_available"("p_display_name" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'auth', 'public'
    AS $$
BEGIN
  -- Return false if display name is already taken
  IF EXISTS (SELECT 1 FROM player_accounts WHERE display_name = p_display_name) THEN
    RETURN FALSE;
  ELSE
    RETURN TRUE;
  END IF;
END;
$$;


ALTER FUNCTION "public"."check_display_name_available"("p_display_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_room_capacity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    player_count INTEGER;
    max_capacity INTEGER;
BEGIN
    -- Get room capacity
    SELECT max_players INTO max_capacity FROM rooms WHERE id = NEW.room_id;
    
    -- Count current players (excluding banned AND excluding hosts)
    SELECT COUNT(*) INTO player_count
    FROM room_memberships 
    WHERE room_id = NEW.room_id 
    AND is_banned = FALSE
    AND is_host = FALSE;  -- Exclude hosts from player count
    
    -- If this is a host, always allow (hosts don't count against capacity)
    IF NEW.is_host = TRUE THEN
        RETURN NEW;
    END IF;
    
    -- Check if adding this player would exceed capacity
    IF player_count >= max_capacity THEN
        RAISE EXCEPTION 'Room is at maximum capacity';
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_room_capacity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_venue_needs_room"("p_user_id" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'auth', 'public'
    AS $$
DECLARE
    v_room_id UUID;
BEGIN
    -- Get the venue account's room_id
    SELECT room_id INTO v_room_id 
    FROM venue_accounts 
    WHERE auth_user_id = p_user_id AND is_active = true;
    
    -- Return true if room_id is NULL (needs room created)
    RETURN v_room_id IS NULL;
END;
$$;


ALTER FUNCTION "public"."check_venue_needs_room"("p_user_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_guest_memberships"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM room_memberships
    WHERE user_id IS NULL
      AND created_at < NOW() - INTERVAL '48 hours'
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;

  RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_guest_memberships"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_guest_memberships_for_room"("p_room_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM room_memberships
    WHERE room_id = p_room_id
      AND user_id IS NULL
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;

  RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_guest_memberships_for_room"("p_room_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_inactive_rooms"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE rooms 
    SET status = 'archived'
    WHERE status = 'active' 
    AND updated_at < NOW() - INTERVAL '30 days'
    AND id NOT IN (
        SELECT DISTINCT room_id 
        FROM room_memberships 
        WHERE last_active_at > NOW() - INTERVAL '30 days'
    );
END;
$$;


ALTER FUNCTION "public"."cleanup_inactive_rooms"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_orphaned_player_accounts"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Delete player accounts whose users don't exist in auth.users
  DELETE FROM player_accounts 
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = player_accounts.user_id
  );
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_orphaned_player_accounts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_player_account_on_join"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Only create for authenticated users (not anonymous)
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Check if user already has a player account
  IF EXISTS (SELECT 1 FROM player_accounts WHERE user_id = NEW.user_id) THEN
    RETURN NEW;
  END IF;
  
  -- Create new player account
  INSERT INTO player_accounts (
    user_id,
    display_name,
    status
  ) VALUES (
    NEW.user_id,
    COALESCE(
      (SELECT raw_user_meta_data->>'display_name' FROM auth.users WHERE id = NEW.user_id),
      'Player'
    ),
    'active'
  );
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_player_account_on_join"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_trivia_interaction"("p_room_id" "uuid", "p_created_by" "uuid", "p_question_id" "uuid", "p_timing" "jsonb", "p_scoring" "jsonb", "p_policy" "jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_interaction_id UUID;
  v_question_record RECORD;
  v_settings JSONB;
BEGIN
  -- Get question and create snapshot
  SELECT * INTO v_question_record 
  FROM trivia_questions 
  WHERE id = p_question_id AND status = 'published';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Question not found or not published';
  END IF;
  
  -- Build settings with snapshot
  v_settings := jsonb_build_object(
    'format', v_question_record.format,
    'questionId', v_question_record.id,
    'snapshot', jsonb_build_object(
      'prompt', v_question_record.prompt,
      'categoryKey', v_question_record.category_key,
      'difficulty', v_question_record.difficulty,
      'explanation', v_question_record.explanation,
      'hint', v_question_record.hint,
      'media', v_question_record.media
    ),
    'scoring', p_scoring,
    'timing', p_timing,
    'policy', p_policy
  );
  
  -- Add format-specific snapshot data
  IF v_question_record.format = 'multiple_choice' THEN
    v_settings := jsonb_set(
      v_settings,
      '{snapshot,multipleChoice}',
      (SELECT jsonb_build_object(
        'options', jsonb_agg(
          jsonb_build_object(
            'id', option_id,
            'text', option_text
          ) ORDER BY sort_order
        ),
        'correctOptionId', (SELECT option_id FROM trivia_question_options WHERE question_id = p_question_id AND is_correct = true LIMIT 1),
        'shuffleOptions', true
      ) FROM trivia_question_options WHERE question_id = p_question_id)
    );
  ELSIF v_question_record.format = 'written_answer' THEN
    v_settings := jsonb_set(
      v_settings,
      '{snapshot,writtenAnswer}',
      (SELECT jsonb_build_object(
        'acceptedAliases', array_agg(alias_text),
        'normalization', 'standard',
        'allowTypos', true,
        'allowWordOrderVariation', true,
        'maxLength', 200
      ) FROM trivia_question_aliases WHERE question_id = p_question_id)
    );
  END IF;
  
  -- Create interaction
  INSERT INTO interactions (
    room_id, created_by, type, status, question, settings, 
    answer_ends_at, answer_seconds, created_at
  )
  VALUES (
    p_room_id, p_created_by, 'trivia', 'active', 
    v_question_record.prompt, v_settings,
    (p_timing->>'closesAt')::TIMESTAMPTZ,
    EXTRACT(EPOCH FROM ((p_timing->>'closesAt')::TIMESTAMPTZ - NOW()))::INTEGER,
    NOW()
  )
  RETURNING id INTO v_interaction_id;
  
  RETURN v_interaction_id;
END;
$$;


ALTER FUNCTION "public"."create_trivia_interaction"("p_room_id" "uuid", "p_created_by" "uuid", "p_question_id" "uuid", "p_timing" "jsonb", "p_scoring" "jsonb", "p_policy" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrement_response_upvote_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.responses
  SET upvote_count = GREATEST(upvote_count - 1, 0)
  WHERE id = OLD.response_id;
  RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."decrement_response_upvote_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_unique_code"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
    max_attempts INTEGER := 100;
    attempts INTEGER := 0;
BEGIN
    LOOP
        -- Generate a 6-character uppercase code
        new_code := upper(substring(gen_random_bytes(3)::text, 3, 6));
        
        -- Remove any non-alphanumeric characters and ensure it's exactly 6 chars
        new_code := regexp_replace(new_code, '[^A-Z0-9]', '', 'g');
        IF length(new_code) < 6 THEN
            CONTINUE;
        END IF;
        new_code := substring(new_code, 1, 6);
        
        -- Check if code exists in either rooms or top_comment_sessions tables
        SELECT EXISTS(
            SELECT 1 FROM rooms WHERE code = new_code
            UNION
            SELECT 1 FROM top_comment_sessions WHERE code = new_code
        ) INTO code_exists;
        
        IF NOT code_exists THEN
            EXIT;
        END IF;
        
        attempts := attempts + 1;
        IF attempts >= max_attempts THEN
            RAISE EXCEPTION 'Failed to generate unique code after % attempts', max_attempts;
        END IF;
    END LOOP;
    
    RETURN new_code;
END;
$$;


ALTER FUNCTION "public"."ensure_unique_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_room_code"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."generate_room_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_team_codes"("num_codes" integer, "session_uuid" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  i INTEGER;
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  FOR i IN 1..num_codes LOOP
    LOOP
      -- Generate a random 4-character code
      new_code := upper(substring(md5(random()::text) from 1 for 4));
      
      -- Check if code already exists
      SELECT EXISTS(SELECT 1 FROM team_codes WHERE code = new_code) INTO code_exists;
      
      -- If unique, insert and break
      IF NOT code_exists THEN
        INSERT INTO team_codes (code, session_id, is_used)
        VALUES (new_code, session_uuid, false);
        EXIT;
      END IF;
    END LOOP;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."generate_team_codes"("num_codes" integer, "session_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_test_room_code"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..6 LOOP
        result := result || SUBSTRING(chars, FLOOR(RANDOM() * 36) + 1, 1);
    END LOOP;
    RETURN result;
END;
$$;


ALTER FUNCTION "public"."generate_test_room_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_account_type"("p_user_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_is_venue BOOLEAN;
  v_is_player BOOLEAN;
BEGIN
  -- Check both account types
  SELECT EXISTS (SELECT 1 FROM venue_accounts WHERE auth_user_id = p_user_id::text AND is_active = true) INTO v_is_venue;
  SELECT EXISTS (SELECT 1 FROM player_accounts WHERE user_id = p_user_id AND status = 'active') INTO v_is_player;
  
  -- Return combined type if both exist
  IF v_is_venue AND v_is_player THEN
    RETURN 'both';
  ELSIF v_is_venue THEN
    RETURN 'venue';
  ELSIF v_is_player THEN
    RETURN 'player';
  ELSE
    RETURN 'user';
  END IF;
END;
$$;


ALTER FUNCTION "public"."get_account_type"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_or_create_player_account"("p_user_id" "uuid", "p_display_name" "text" DEFAULT NULL::"text", "p_avatar_url" "text" DEFAULT NULL::"text") RETURNS TABLE("account_id" "uuid", "account_user_id" "uuid", "account_display_name" character varying, "account_avatar_url" "text", "account_player_level" integer, "account_total_games_played" integer, "account_total_wins" integer, "account_total_points" integer, "account_favorite_genres" "text"[], "account_preferred_difficulty" character varying, "account_notifications_enabled" boolean, "account_status" character varying, "account_created_at" timestamp with time zone, "account_updated_at" timestamp with time zone, "account_last_login_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'auth', 'public'
    AS $$
DECLARE
  v_display_name TEXT;
  v_user_exists BOOLEAN;
  v_name_is_taken BOOLEAN;
BEGIN
  v_display_name := COALESCE(p_display_name, 'Player');
  
  -- Check if user exists in auth.users with proper schema
  SELECT EXISTS(
    SELECT 1 FROM auth.users 
    WHERE id = p_user_id 
    AND deleted_at IS NULL
  ) INTO v_user_exists;
  
  -- Only create account if user exists
  IF v_user_exists THEN
    -- Check if display name is already taken by another user
    SELECT EXISTS(
      SELECT 1 FROM player_accounts 
      WHERE display_name = v_display_name 
      AND user_id != p_user_id
    ) INTO v_name_is_taken;
    
    -- If name is taken, raise an error
    IF v_name_is_taken THEN
      RAISE EXCEPTION 'Display name "%" is already taken. Please choose a different name.', v_display_name;
    END IF;
    
    INSERT INTO player_accounts (user_id, display_name, avatar_url)
    VALUES (p_user_id, v_display_name, p_avatar_url)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN QUERY 
    SELECT 
      pa.id, 
      pa.user_id, 
      pa.display_name, 
      pa.avatar_url, 
      pa.player_level,
      pa.total_games_played, 
      pa.total_wins, 
      pa.total_points, 
      pa.favorite_genres,
      pa.preferred_difficulty, 
      pa.notifications_enabled, 
      pa.status,
      pa.created_at, 
      pa.updated_at, 
      pa.last_login_at
    FROM player_accounts pa
    WHERE pa.user_id = p_user_id;
  ELSE
    -- Return empty result if user doesn't exist yet
    RETURN;
  END IF;
END;
$$;


ALTER FUNCTION "public"."get_or_create_player_account"("p_user_id" "uuid", "p_display_name" "text", "p_avatar_url" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_player_account_info"("p_user_id" "uuid") RETURNS TABLE("id" "uuid", "display_name" "text", "avatar_url" "text", "player_level" integer, "total_games_played" integer, "total_wins" integer, "total_points" integer, "status" character varying, "last_login_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pa.id, 
    pa.display_name, 
    pa.avatar_url, 
    pa.player_level,
    pa.total_games_played, 
    pa.total_wins, 
    pa.total_points, 
    pa.status, 
    pa.last_login_at
  FROM player_accounts pa
  WHERE pa.user_id = p_user_id;
END;
$$;


ALTER FUNCTION "public"."get_player_account_info"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_sociale_current_round"("p_sociale_id" "uuid") RETURNS TABLE("round_id" "uuid", "round_type" "text", "round_index" integer, "phase" "text", "phase_ends_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sr.id,
    sr.type,
    sr.order_index,
    srs.phase,
    srs.phase_ends_at
  FROM sociales s
  JOIN sociale_rounds sr ON sr.id = s.current_round_id
  LEFT JOIN sociale_round_state srs ON srs.round_id = sr.id
  WHERE s.id = p_sociale_id;
END;
$$;


ALTER FUNCTION "public"."get_sociale_current_round"("p_sociale_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_sociale_scoreboard"("p_sociale_id" "uuid") RETURNS TABLE("socialite_id" "uuid", "display_name" "text", "mascot_id" integer, "score" integer, "rank" integer)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.display_name,
    s.mascot_id,
    s.score,
    RANK() OVER (ORDER BY s.score DESC)::INTEGER
  FROM socialites s
  WHERE s.sociale_id = p_sociale_id
  AND s.is_active = TRUE
  AND s.is_banned = FALSE
  ORDER BY s.score DESC;
END;
$$;


ALTER FUNCTION "public"."get_sociale_scoreboard"("p_sociale_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_votes_from_db"("p_session_id" "text") RETURNS TABLE("track_id" "text", "session_id" "text", "player_id" "text", "vote_type" "text", "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.track_id,
    v.session_id,
    v.player_id,
    v.vote_type,
    v.created_at,
    v.updated_at
  FROM vibex_votes v
  WHERE v.session_id = p_session_id
  ORDER BY v.updated_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_user_votes_from_db"("p_session_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_votes_from_db"("p_room_id" "uuid", "p_membership_id" "uuid") RETURNS TABLE("track_id" "text", "vote_type" "text", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.track_id,
    v.vote_type,
    v.created_at
  FROM public.vibox_votes v
  WHERE v.room_id = p_room_id 
    AND v.membership_id = p_membership_id
  ORDER BY v.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_user_votes_from_db"("p_room_id" "uuid", "p_membership_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_vote_counts_from_db"() RETURNS TABLE("track_id" "text", "upvotes" integer, "downvotes" integer, "total_votes" integer, "net_votes" integer, "last_voted_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.track_id,
    COUNT(*) FILTER (WHERE v.vote_type = 'up')::INTEGER as upvotes,
    COUNT(*) FILTER (WHERE v.vote_type = 'down')::INTEGER as downvotes,
    COUNT(*)::INTEGER as total_votes,
    (COUNT(*) FILTER (WHERE v.vote_type = 'up') - COUNT(*) FILTER (WHERE v.vote_type = 'down'))::INTEGER as net_votes,
    MAX(v.created_at) as last_voted_at
  FROM vibex_votes v
  GROUP BY v.track_id
  ORDER BY last_voted_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_vote_counts_from_db"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_vote_counts_from_db"("p_room_id" "uuid") RETURNS TABLE("track_id" "text", "upvotes" bigint, "downvotes" bigint, "total_votes" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.track_id,
    COUNT(CASE WHEN v.vote_type = 'up' THEN 1 END) as upvotes,
    COUNT(CASE WHEN v.vote_type = 'down' THEN 1 END) as downvotes,
    COUNT(*) as total_votes
  FROM public.vibox_votes v
  WHERE v.room_id = p_room_id
  GROUP BY v.track_id
  ORDER BY total_votes DESC, upvotes DESC;
END;
$$;


ALTER FUNCTION "public"."get_vote_counts_from_db"("p_room_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."grade_trivia_submission"("p_submission_id" "uuid", "p_grader_version" "text" DEFAULT '1.0'::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_evaluation_id UUID;
  v_submission RECORD;
  v_interaction RECORD;
  v_question RECORD;
  v_result TEXT;
  v_points INTEGER;
  v_method TEXT;
  v_confidence REAL;
  v_matched_alias TEXT;
  v_reasoning TEXT;
  v_normalized_answer TEXT;
  v_correct_answer TEXT;
BEGIN
  -- Get submission with interaction
  SELECT s.*, i.settings, i.room_id 
  INTO v_submission
  FROM trivia_submissions s
  JOIN interactions i ON s.interaction_id = i.id
  WHERE s.id = p_submission_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission not found';
  END IF;
  
  -- Extract snapshot data
  v_interaction.settings := v_submission.settings;
  
  -- Get correct answer from snapshot
  IF (v_submission.settings->'snapshot'->>'format') = 'multiple_choice' THEN
    v_correct_answer := v_submission.settings->'snapshot'->'multipleChoice'->>'correctOptionId';
    
    -- Grade multiple choice
    IF (v_submission.payload->>'selectedOptionId') = v_correct_answer THEN
      v_result := 'correct';
      v_points := (v_submission.settings->'scoring'->>'pointsCorrect')::INTEGER;
      v_method := 'exact';
    ELSE
      v_result := 'incorrect';
      v_points := 0;
      v_method := 'exact';
    END IF;
    
  ELSIF (v_submission.settings->'snapshot'->>'format') = 'written_answer' THEN
    -- Get accepted aliases
    SELECT array_agg(alias_text) INTO v_matched_alias
    FROM trivia_question_aliases 
    WHERE question_id = (v_submission.settings->>'questionId')::UUID;
    
    -- Normalize submitted answer
    v_normalized_answer := lower(trim(regexp_replace(v_submission.payload->>'rawText', '[^\w\s]', ' ', 'g')));
    
    -- Check exact match first
    IF v_normalized_answer = ANY(v_matched_alias) THEN
      v_result := 'correct';
      v_points := (v_submission.settings->'scoring'->>'pointsCorrect')::INTEGER;
      v_method := 'exact';
    ELSE
      -- Fuzzy matching with pg_trgm
      SELECT similarity(v_normalized_answer, alias_text), alias_text
      INTO v_confidence, v_matched_alias
      FROM trivia_question_aliases 
      WHERE question_id = (v_submission.settings->>'questionId')::UUID
      ORDER BY similarity(v_normalized_answer, alias_text) DESC
      LIMIT 1;
      
      IF v_confidence > 0.7 THEN
        v_result := 'correct';
        v_points := (v_submission.settings->'scoring'->>'pointsCorrect')::INTEGER;
        v_method := 'fuzzy';
      ELSIF v_confidence > 0.5 THEN
        v_result := 'partial';
        v_points := (v_submission.settings->'scoring'->>'pointsPartial')::INTEGER;
        v_method := 'fuzzy';
      ELSE
        v_result := 'incorrect';
        v_points := 0;
        v_method := 'fuzzy';
      END IF;
    END IF;
  ELSE
    RAISE EXCEPTION 'Unknown trivia format';
  END IF;
  
  -- Create evaluation
  INSERT INTO trivia_evaluations (
    submission_id, interaction_id, room_id, member_id,
    result, points_awarded, method, confidence, matched_alias,
    reasoning_short, grader_version
  )
  VALUES (
    p_submission_id, v_submission.interaction_id, v_submission.room_id, v_submission.member_id,
    v_result, v_points, v_method, v_confidence, v_matched_alias,
    v_reasoning, p_grader_version
  )
  RETURNING id INTO v_evaluation_id;
  
  RETURN v_evaluation_id;
END;
$$;


ALTER FUNCTION "public"."grade_trivia_submission"("p_submission_id" "uuid", "p_grader_version" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_interaction_response_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.interactions
  SET response_count = response_count + 1
  WHERE id = NEW.interaction_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."increment_interaction_response_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_interaction_vote_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.interactions
  SET vote_count = vote_count + 1
  WHERE id = NEW.interaction_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."increment_interaction_vote_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_response_upvote_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.responses
  SET upvote_count = upvote_count + 1
  WHERE id = NEW.response_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."increment_response_upvote_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_room_session_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW.room_id IS NOT NULL AND OLD.status != 'ended' AND NEW.status = 'ended' THEN
        UPDATE rooms 
        SET total_sessions_played = total_sessions_played + 1,
            current_session_id = NULL
        WHERE id = NEW.room_id;
    ELSIF NEW.room_id IS NOT NULL AND OLD.status = 'ended' AND NEW.status != 'ended' THEN
        UPDATE rooms 
        SET current_session_id = NEW.id
        WHERE id = NEW.room_id;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."increment_room_session_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_team_score"("team_id" "uuid", "score_delta" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE teams SET score = score + score_delta WHERE id = team_id;
END;
$$;


ALTER FUNCTION "public"."increment_team_score"("team_id" "uuid", "score_delta" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_top_comment_player_score"("player_id" "uuid", "score_delta" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  update top_comment_players
  set score = score + score_delta
  where id = player_id;
end;
$$;


ALTER FUNCTION "public"."increment_top_comment_player_score"("player_id" "uuid", "score_delta" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_player_account"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM player_accounts 
    WHERE player_accounts.user_id = p_user_id 
    AND status = 'active'
  );
END;
$$;


ALTER FUNCTION "public"."is_player_account"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_venue_account"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM venue_accounts 
    WHERE auth_user_id = p_user_id::text 
    AND is_active = true
  );
END;
$$;


ALTER FUNCTION "public"."is_venue_account"("p_user_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."top_comment_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "host_uid" "uuid" NOT NULL,
    "status" "text" NOT NULL,
    "round_index" integer DEFAULT 0 NOT NULL,
    "rounds" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "vote_group_index" integer,
    "prompt_deck" "jsonb",
    "prompt_cursor" integer DEFAULT 0,
    "prompt_library_id" "text",
    "settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "venue_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "started_at" timestamp with time zone,
    "ended_at" timestamp with time zone,
    "ends_at" timestamp with time zone,
    "paused" boolean DEFAULT false,
    "paused_at" timestamp with time zone,
    "total_paused_ms" integer DEFAULT 0,
    "ended_by_host" boolean DEFAULT false,
    "selected_libraries" "text"[],
    "current_library_index" integer DEFAULT 0,
    "room_id" "uuid",
    "auto_assigned_players" "uuid"[] DEFAULT '{}'::"uuid"[]
);


ALTER TABLE "public"."top_comment_sessions" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."pause_top_comment_session_atomic"("p_session_id" "uuid", "p_pause" boolean, "p_paused_at" timestamp with time zone, "p_ends_at" timestamp with time zone, "p_total_paused_ms" integer) RETURNS SETOF "public"."top_comment_sessions"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."pause_top_comment_session_atomic"("p_session_id" "uuid", "p_pause" boolean, "p_paused_at" timestamp with time zone, "p_ends_at" timestamp with time zone, "p_total_paused_ms" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."remove_vote"("p_track_id" "text", "p_session_id" "text") RETURNS TABLE("success" boolean, "message" "text")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM vibex_votes v
  WHERE v.track_id = p_track_id AND v.session_id = p_session_id;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN QUERY
  SELECT 
    CASE 
      WHEN deleted_count > 0 THEN true
      ELSE false
    END as success,
    CASE 
      WHEN deleted_count > 0 THEN 'Vote removed'::TEXT
      ELSE 'No vote found to remove'::TEXT
    END as message;
END;
$$;


ALTER FUNCTION "public"."remove_vote"("p_track_id" "text", "p_session_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."remove_vote"("p_room_id" "uuid", "p_membership_id" "uuid", "p_track_id" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  DELETE FROM public.vibox_votes 
  WHERE room_id = p_room_id 
    AND membership_id = p_membership_id 
    AND track_id = p_track_id;
END;
$$;


ALTER FUNCTION "public"."remove_vote"("p_room_id" "uuid", "p_membership_id" "uuid", "p_track_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_resolved_round_id"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.resolved_round_id = COALESCE(NEW.round_id, NEW.ambient_round_id);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_resolved_round_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."submit_trivia_answer"("p_interaction_id" "uuid", "p_member_id" "uuid", "p_payload" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_submission_id UUID;
  v_room_id UUID;
  v_interaction RECORD;
  v_is_late BOOLEAN := false;
  v_grading_result JSONB;
  v_is_correct BOOLEAN := false;
  v_correct_answer TEXT;
  v_points_awarded INTEGER := 0;
BEGIN
  -- Verify the authenticated user owns this membership
  IF NOT EXISTS (
    SELECT 1 FROM room_memberships 
    WHERE id = p_member_id 
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Membership not found or access denied';
  END IF;
  
  -- Get interaction details
  SELECT room_id, answer_ends_at, settings, created_at INTO v_interaction
  FROM interactions 
  WHERE id = p_interaction_id AND type = 'trivia';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Interaction not found';
  END IF;
  
  v_room_id := v_interaction.room_id;
  
  -- Check timing
  IF v_interaction.answer_ends_at IS NOT NULL AND NOW() > v_interaction.answer_ends_at THEN
    v_is_late := true;
  END IF;
  
  -- Grade the submission immediately
  -- Extract correct answer from settings based on format
  IF v_interaction.settings->>'format' = 'multiple_choice' THEN
    v_correct_answer := (v_interaction.settings#>>'{snapshot,multipleChoice,correctOptionId}');
  ELSIF v_interaction.settings->>'format' = 'written_answer' THEN
    v_correct_answer := (v_interaction.settings#>>'{snapshot,writtenAnswer,correctAnswer}');
  END IF;
  
  -- Multiple choice grading
  IF p_payload->>'format' = 'multiple_choice' THEN
    v_is_correct := (p_payload->>'selectedOptionId' = v_correct_answer);
  
  -- Written answer grading (deterministic first)
  ELSIF p_payload->>'format' = 'written_answer' THEN
    -- Simple exact match for now
    v_is_correct := (LOWER(TRIM(p_payload->>'rawText')) = LOWER(TRIM(v_correct_answer)));
  END IF;
  
  -- Calculate points
  IF v_is_correct AND NOT v_is_late THEN
    v_points_awarded := 100; -- Base points for correct answer
    -- Could add speed bonuses here later
  END IF;
  
  -- Create or replace submission (store raw data only)
  INSERT INTO trivia_submissions (
    interaction_id, room_id, member_id, payload, 
    status, latency_ms
  )
  VALUES (
    p_interaction_id, v_room_id, p_member_id, p_payload,
    CASE WHEN v_is_late THEN 'late' ELSE 'accepted' END,
    EXTRACT(EPOCH FROM (NOW() - v_interaction.created_at)) * 1000
  )
  ON CONFLICT (interaction_id, member_id) 
  DO UPDATE SET 
    payload = EXCLUDED.payload,
    status = 'replaced',
    submitted_at = NOW(),
    latency_ms = EXCLUDED.latency_ms
  RETURNING id INTO v_submission_id;
  
  -- Build immediate grading result (not stored, just returned)
  v_grading_result := jsonb_build_object(
    'submissionId', v_submission_id,
    'isCorrect', v_is_correct,
    'correctAnswer', v_correct_answer,
    'explanation', COALESCE(v_interaction.settings#>>'{snapshot,explanation}', ''),
    'pointsAwarded', v_points_awarded,
    'isLate', v_is_late,
    'evaluationTime', NOW()
  );
  
  RETURN v_grading_result;
END;
$$;


ALTER FUNCTION "public"."submit_trivia_answer"("p_interaction_id" "uuid", "p_member_id" "uuid", "p_payload" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_trivia_accepted_answers"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  target_question_id UUID;
BEGIN
  -- Handle both INSERT/UPDATE (NEW) and DELETE (OLD)
  IF TG_OP = 'DELETE' THEN
    target_question_id := OLD.question_id;
  ELSE
    target_question_id := NEW.question_id;
  END IF;

  UPDATE public.trivia_questions
  SET accepted_answers = COALESCE((
    SELECT array_agg(alias_text)
    FROM public.trivia_question_aliases
    WHERE question_id = target_question_id
  ), '{}')
  WHERE id = target_question_id;

  RETURN NULL; -- AFTER trigger, return value unused
END;
$$;


ALTER FUNCTION "public"."sync_trivia_accepted_answers"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_cleanup_guests_on_room_archive"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Only fire when status transitions TO 'archived'
  IF NEW.status = 'archived' AND OLD.status IS DISTINCT FROM 'archived' THEN
    PERFORM cleanup_guest_memberships_for_room(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_cleanup_guests_on_room_archive"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_player_stats"("p_user_id" "uuid", "p_games_played" integer DEFAULT 0, "p_wins" integer DEFAULT 0, "p_points" integer DEFAULT 0) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE player_accounts 
  SET 
    total_games_played = total_games_played + p_games_played,
    total_wins = total_wins + p_wins,
    total_points = total_points + p_points,
    updated_at = NOW()
  WHERE player_accounts.user_id = p_user_id;
END;
$$;


ALTER FUNCTION "public"."update_player_stats"("p_user_id" "uuid", "p_games_played" integer, "p_wins" integer, "p_points" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_sociale_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_sociale_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_team_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Handle both answers and votes tables
  IF TG_TABLE_NAME = 'answers' THEN
    UPDATE teams
    SET last_active_at = NOW()
    WHERE id = NEW.team_id;
  ELSIF TG_TABLE_NAME = 'votes' THEN
    UPDATE teams
    SET last_active_at = NOW()
    WHERE id = NEW.voter_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_team_activity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_venue_room_id"("p_user_id" "text", "p_room_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'auth', 'public'
    AS $$
BEGIN
    -- Update the venue account with the new room_id
    UPDATE venue_accounts 
    SET room_id = p_room_id, last_active_at = NOW()
    WHERE auth_user_id = p_user_id AND is_active = true;
    
    -- Return true if update was successful
    RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."update_venue_room_id"("p_user_id" "text", "p_room_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_vote_counts"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- This is just for tracking, actual vote counting done in queries
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_vote_counts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_votes_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_votes_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."vote_on_track"("p_track_id" "text", "p_session_id" "text", "p_vote_type" "text", "p_player_id" "text" DEFAULT NULL::"text") RETURNS TABLE("success" boolean, "message" "text", "vote_id" "uuid", "vote_type" "text", "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  existing_vote_id UUID;
BEGIN
  -- Check if user already voted on this track
  SELECT v.id INTO existing_vote_id
  FROM vibex_votes v
  WHERE v.track_id = p_track_id AND v.session_id = p_session_id;
  
  IF existing_vote_id IS NOT NULL THEN
    -- Update existing vote
    UPDATE vibex_votes v
    SET 
      vote_type = p_vote_type,
      player_id = p_player_id,
      updated_at = NOW()
    WHERE v.id = existing_vote_id;
    
    RETURN QUERY
    SELECT 
      true as success,
      'Vote updated' as message,
      v.id as vote_id,
      v.vote_type as vote_type,
      v.updated_at as updated_at
    FROM vibex_votes v
    WHERE v.id = existing_vote_id;
  ELSE
    -- Insert new vote
    INSERT INTO vibex_votes (
      track_id,
      session_id,
      player_id,
      vote_type,
      created_at,
      updated_at
    ) VALUES (
      p_track_id,
      p_session_id,
      p_player_id,
      p_vote_type,
      NOW(),
      NOW()
    ) RETURNING 
      vibex_votes.id as vote_id,
      vibex_votes.vote_type as vote_type,
      vibex_votes.updated_at
    INTO existing_vote_id;
    
    RETURN QUERY
    SELECT 
      true as success,
      'Vote created' as message,
      existing_vote_id as vote_id,
      p_vote_type as vote_type,
      NOW() as updated_at;
  END IF;
END;
$$;


ALTER FUNCTION "public"."vote_on_track"("p_track_id" "text", "p_session_id" "text", "p_vote_type" "text", "p_player_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."vote_on_track"("p_room_id" "uuid", "p_membership_id" "uuid", "p_track_id" "text", "p_vote_type" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Insert or update vote
  INSERT INTO public.vibox_votes (room_id, membership_id, track_id, vote_type)
  VALUES (p_room_id, p_membership_id, p_track_id, p_vote_type)
  ON CONFLICT (room_id, membership_id, track_id)
  DO UPDATE SET 
    vote_type = p_vote_type,
    updated_at = now();
END;
$$;


ALTER FUNCTION "public"."vote_on_track"("p_room_id" "uuid", "p_membership_id" "uuid", "p_track_id" "text", "p_vote_type" "text") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ambient_packs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "emoji" "text" DEFAULT '📦'::"text",
    "is_default" boolean DEFAULT false NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ambient_packs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ambient_rounds" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_index" integer NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text",
    "settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "explanation" "text",
    "hint" "text",
    "pack_id" "uuid" NOT NULL,
    CONSTRAINT "ambient_rounds_type_check" CHECK (("type" = ANY (ARRAY['trivia'::"text", 'topic'::"text"])))
);


ALTER TABLE "public"."ambient_rounds" OWNER TO "postgres";


COMMENT ON COLUMN "public"."ambient_rounds"."explanation" IS 'Explanation shown after reveal phase (e.g., "Gold''s symbol comes from Latin ''aurum''")';



COMMENT ON COLUMN "public"."ambient_rounds"."hint" IS 'Hint shown during answer phase as a clue';



CREATE TABLE IF NOT EXISTS "public"."answers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "team_id" "uuid" NOT NULL,
    "round_index" integer NOT NULL,
    "group_id" "text" NOT NULL,
    "text" "text" NOT NULL,
    "masked" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."answers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audience_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "room_id" "uuid" NOT NULL,
    "membership_id" "uuid" NOT NULL,
    "question_text" "text" NOT NULL,
    "category" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "rejection_reason" "text",
    "used_in_interaction_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "audience_submissions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text", 'used'::"text"])))
);


ALTER TABLE "public"."audience_submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interaction_votes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "interaction_id" "uuid" NOT NULL,
    "membership_id" "uuid" NOT NULL,
    "response_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."interaction_votes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "room_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "type" "text" DEFAULT 'prompt'::"text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "question" "text" NOT NULL,
    "description" "text",
    "settings" "jsonb" DEFAULT '{}'::"jsonb",
    "response_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "closed_at" timestamp with time zone,
    "voting_ends_at" timestamp with time zone,
    "voting_seconds" integer DEFAULT 300,
    "vote_count" integer DEFAULT 0,
    "answer_ends_at" timestamp with time zone,
    "answer_seconds" integer DEFAULT 300,
    "target_type" "text" DEFAULT 'broadcast'::"text",
    "target_membership_id" "uuid",
    "source_membership_id" "uuid",
    "challenge_status" "text",
    "challenge_expires_at" timestamp with time zone,
    "points_wager" integer DEFAULT 0,
    "poll_options" "jsonb" DEFAULT '[]'::"jsonb",
    "sort_by" "text" DEFAULT 'newest'::"text" NOT NULL,
    CONSTRAINT "interactions_sort_by_check" CHECK (("sort_by" = ANY (ARRAY['newest'::"text", 'upvotes'::"text"]))),
    CONSTRAINT "interactions_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'voting'::"text", 'results'::"text", 'closed'::"text"]))),
    CONSTRAINT "interactions_type_check" CHECK (("type" = ANY (ARRAY['prompt'::"text", 'headline_fibbage'::"text", 'challenge'::"text", 'directed_reaction'::"text", 'audience_question'::"text", 'topic'::"text", 'poll'::"text", 'trivia'::"text"])))
);


ALTER TABLE "public"."interactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."membership_achievements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "membership_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "context" "jsonb" NOT NULL,
    "earned_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."membership_achievements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."player_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "display_name" character varying(100) NOT NULL,
    "avatar_url" "text",
    "player_level" integer DEFAULT 1,
    "total_games_played" integer DEFAULT 0,
    "total_wins" integer DEFAULT 0,
    "total_points" integer DEFAULT 0,
    "favorite_genres" "text"[] DEFAULT ARRAY[]::"text"[],
    "preferred_difficulty" character varying(20) DEFAULT 'medium'::character varying,
    "notifications_enabled" boolean DEFAULT true,
    "status" character varying(20) DEFAULT 'active'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_login_at" timestamp with time zone,
    CONSTRAINT "player_accounts_display_name_check" CHECK ((("length"(("display_name")::"text") >= 2) AND ("length"(("display_name")::"text") <= 100))),
    CONSTRAINT "player_accounts_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'suspended'::character varying])::"text"[])))
);


ALTER TABLE "public"."player_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."player_blocks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "blocker_membership_id" "uuid" NOT NULL,
    "blocked_membership_id" "uuid" NOT NULL,
    "room_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."player_blocks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."room_memberships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "room_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "player_name" character varying(100) NOT NULL,
    "mascot_id" integer,
    "joined_at" timestamp with time zone DEFAULT "now"(),
    "last_active_at" timestamp with time zone DEFAULT "now"(),
    "is_host" boolean DEFAULT false,
    "is_banned" boolean DEFAULT false,
    "ban_reason" "text",
    "banned_at" timestamp with time zone,
    "banned_by" "uuid",
    "status" character varying(20) DEFAULT 'active'::character varying,
    "is_muted" boolean DEFAULT false,
    "muted_at" timestamp with time zone,
    "muted_by" "uuid",
    "mute_expires_at" timestamp with time zone,
    "current_streak" integer DEFAULT 0 NOT NULL,
    "streak_freeze_available" boolean DEFAULT true NOT NULL,
    "last_visit_week" "date",
    "client_key" "text",
    CONSTRAINT "room_memberships_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'active'::character varying])::"text"[])))
);


ALTER TABLE "public"."room_memberships" OWNER TO "postgres";


COMMENT ON TABLE "public"."room_memberships" IS 'Players who are members of rooms, with their status and permissions';



COMMENT ON COLUMN "public"."room_memberships"."player_name" IS 'Display name for the room member (was team_name, renamed for clarity)';



COMMENT ON COLUMN "public"."room_memberships"."is_banned" IS 'Whether the member is banned from the room';



COMMENT ON COLUMN "public"."room_memberships"."status" IS 'pending (awaiting approval), approved (can join sessions), active (in room)';



COMMENT ON COLUMN "public"."room_memberships"."current_streak" IS 'P1-13: weeks-in-a-row attended. Resets if >1 week missed and freeze unused.';



COMMENT ON COLUMN "public"."room_memberships"."streak_freeze_available" IS 'P1-13: single streak-freeze token — auto-consumed on a single missed week.';



COMMENT ON COLUMN "public"."room_memberships"."last_visit_week" IS 'P1-13: Monday of the ISO week the membership last attended.';



COMMENT ON COLUMN "public"."room_memberships"."client_key" IS 'P1-3/P1-18: anonymous device fingerprint for passwordless resume.';



CREATE TABLE IF NOT EXISTS "public"."top_comment_players" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "display_name" "text" NOT NULL,
    "score" integer DEFAULT 0 NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_active_at" timestamp with time zone
);


ALTER TABLE "public"."top_comment_players" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."player_engagement_view" AS
 SELECT "rm"."room_id",
    "rm"."user_id",
    "rm"."player_name",
    "count"(DISTINCT "p"."session_id") AS "sessions_played",
    "min"("p"."joined_at") AS "first_played_at",
    "max"("p"."joined_at") AS "last_played_at",
    "sum"("p"."score") AS "total_score"
   FROM (("public"."room_memberships" "rm"
     JOIN "public"."top_comment_players" "p" ON (("p"."user_id" = "rm"."user_id")))
     JOIN "public"."top_comment_sessions" "s" ON ((("s"."id" = "p"."session_id") AND ("s"."room_id" = "rm"."room_id"))))
  GROUP BY "rm"."room_id", "rm"."user_id", "rm"."player_name";


ALTER VIEW "public"."player_engagement_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."prompt_libraries" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "emoji" "text" NOT NULL,
    "description" "text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."prompt_libraries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."prompts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "library_id" "text" NOT NULL,
    "text" "text" NOT NULL,
    "variant" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "times_shown" integer DEFAULT 0 NOT NULL,
    "times_answered" integer DEFAULT 0 NOT NULL,
    "avg_answer_time_ms" integer,
    "thumbs_up_count" integer DEFAULT 0 NOT NULL,
    "thumbs_down_count" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."prompts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "room_id" "uuid" NOT NULL,
    "reporter_membership_id" "uuid" NOT NULL,
    "reported_membership_id" "uuid",
    "content_type" "text" NOT NULL,
    "content_id" "uuid",
    "reason" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "action_taken" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."responses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "interaction_id" "uuid" NOT NULL,
    "membership_id" "uuid" NOT NULL,
    "text" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "upvote_count" integer DEFAULT 0
);


ALTER TABLE "public"."responses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rooms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" character varying(6) NOT NULL,
    "host_uid" "uuid" NOT NULL,
    "name" character varying(255),
    "description" "text",
    "status" character varying(20) DEFAULT 'active'::character varying,
    "max_players" integer DEFAULT 50 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "settings" "jsonb" DEFAULT '{}'::"jsonb",
    "current_session_id" "uuid",
    "total_sessions_played" integer DEFAULT 0,
    "moderator_ids" "uuid"[] DEFAULT '{}'::"uuid"[],
    "creator_id" "uuid",
    "current_sociale_id" "uuid",
    CONSTRAINT "rooms_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['active'::character varying, 'archived'::character varying, 'suspended'::character varying])::"text"[])))
);

ALTER TABLE ONLY "public"."rooms" REPLICA IDENTITY FULL;


ALTER TABLE "public"."rooms" OWNER TO "postgres";


COMMENT ON TABLE "public"."rooms" IS 'Persistent game rooms that host multiple sessions';



COMMENT ON COLUMN "public"."rooms"."code" IS '6-character unique room code for players to join';



COMMENT ON COLUMN "public"."rooms"."host_uid" IS 'Legacy - use moderator_ids instead';



COMMENT ON COLUMN "public"."rooms"."settings" IS 'JSONB containing room configuration like max players, chat settings, etc.';



COMMENT ON COLUMN "public"."rooms"."moderator_ids" IS 'Array of user IDs who have moderator privileges in this room';



COMMENT ON COLUMN "public"."rooms"."creator_id" IS 'Original room creator (for reference only, no special privileges)';



COMMENT ON COLUMN "public"."rooms"."current_sociale_id" IS 'Pointer to the currently active Sociale in this room (mirrors current_session_id for Sessions)';



CREATE OR REPLACE VIEW "public"."room_analytics_view" AS
 SELECT "r"."id" AS "room_id",
    "r"."code",
    "r"."name",
    "r"."host_uid",
    "r"."status",
    "r"."created_at",
    "r"."updated_at",
    "count"(DISTINCT "rm"."user_id") AS "total_unique_players",
    "count"(DISTINCT "s"."id") AS "total_sessions_played",
    COALESCE("avg"((EXTRACT(epoch FROM ("s"."ended_at" - "s"."started_at")) / (60)::numeric)), (0)::numeric) AS "avg_session_duration_minutes",
    "max"("rm"."last_active_at") AS "last_activity_at",
    "count"(DISTINCT
        CASE
            WHEN ("rm"."is_banned" = false) THEN "rm"."id"
            ELSE NULL::"uuid"
        END) AS "current_active_members"
   FROM (("public"."rooms" "r"
     LEFT JOIN "public"."room_memberships" "rm" ON ((("r"."id" = "rm"."room_id") AND ("rm"."is_banned" = false))))
     LEFT JOIN "public"."top_comment_sessions" "s" ON (("r"."id" = "s"."room_id")))
  GROUP BY "r"."id", "r"."code", "r"."name", "r"."host_uid", "r"."status", "r"."created_at", "r"."updated_at";


ALTER VIEW "public"."room_analytics_view" OWNER TO "postgres";


COMMENT ON VIEW "public"."room_analytics_view" IS 'Aggregated analytics for rooms including player counts and session stats';



CREATE OR REPLACE VIEW "public"."room_member_stats_view" AS
 SELECT "rm"."room_id",
    "rm"."user_id",
    "rm"."player_name",
    "rm"."is_host",
    "rm"."is_banned",
    "rm"."joined_at",
    "rm"."last_active_at",
    "count"(DISTINCT "s"."id") AS "sessions_participated",
    COALESCE("sum"("p"."score"), (0)::bigint) AS "total_score",
    "max"("p"."score") AS "best_session_score"
   FROM (("public"."room_memberships" "rm"
     LEFT JOIN "public"."top_comment_sessions" "s" ON (("rm"."room_id" = "s"."room_id")))
     LEFT JOIN "public"."top_comment_players" "p" ON ((("s"."id" = "p"."session_id") AND ("p"."user_id" = "rm"."user_id"))))
  GROUP BY "rm"."id", "rm"."room_id", "rm"."user_id", "rm"."player_name", "rm"."is_host", "rm"."is_banned", "rm"."joined_at", "rm"."last_active_at";


ALTER VIEW "public"."room_member_stats_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."room_membership_stats" (
    "membership_id" "uuid" NOT NULL,
    "total_score" bigint DEFAULT 0 NOT NULL,
    "games_played" integer DEFAULT 0 NOT NULL,
    "games_won" integer DEFAULT 0 NOT NULL,
    "best_game_score" integer DEFAULT 0 NOT NULL,
    "best_game_at" timestamp with time zone,
    "current_streak" integer DEFAULT 0 NOT NULL,
    "max_streak" integer DEFAULT 0 NOT NULL,
    "last_played_at" timestamp with time zone,
    "tier" "text" DEFAULT 'Bronze'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "room_membership_stats_tier_check" CHECK (("tier" = ANY (ARRAY['Bronze'::"text", 'Silver'::"text", 'Gold'::"text", 'Diamond'::"text"])))
);


ALTER TABLE "public"."room_membership_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."room_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "room_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "membership_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_hidden" boolean DEFAULT false NOT NULL,
    "hidden_by" "uuid",
    "content_type" "text" DEFAULT 'text'::"text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL
);


ALTER TABLE "public"."room_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."season_standings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "season_id" "uuid" NOT NULL,
    "membership_id" "uuid" NOT NULL,
    "total_score" bigint DEFAULT 0 NOT NULL,
    "games_played" integer DEFAULT 0 NOT NULL,
    "games_won" integer DEFAULT 0 NOT NULL,
    "tier" "text" DEFAULT 'Bronze'::"text" NOT NULL,
    "tier_at_start" "text",
    "final_rank" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "season_standings_tier_check" CHECK (("tier" = ANY (ARRAY['Bronze'::"text", 'Silver'::"text", 'Gold'::"text", 'Diamond'::"text"])))
);


ALTER TABLE "public"."season_standings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."seasons" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "starts_at" "date" NOT NULL,
    "ends_at" "date" NOT NULL,
    "status" "text" DEFAULT 'upcoming'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "seasons_status_check" CHECK (("status" = ANY (ARRAY['upcoming'::"text", 'active'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."seasons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sociale_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sociale_id" "uuid" NOT NULL,
    "round_id" "uuid",
    "category" "text" NOT NULL,
    "metric" "text" NOT NULL,
    "value" "jsonb" NOT NULL,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."sociale_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sociale_banter" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sociale_id" "uuid" NOT NULL,
    "socialite_id" "uuid" NOT NULL,
    "membership_id" "uuid",
    "display_name" "text" NOT NULL,
    "content" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "upvote_count" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "moderated_at" timestamp with time zone,
    "moderated_by" "uuid",
    CONSTRAINT "sociale_banter_content_check" CHECK ((("length"("content") >= 1) AND ("length"("content") <= 280))),
    CONSTRAINT "sociale_banter_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text", 'on_tv'::"text"])))
);


ALTER TABLE "public"."sociale_banter" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sociale_banter_upvotes" (
    "banter_id" "uuid" NOT NULL,
    "socialite_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."sociale_banter_upvotes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sociale_chest_upgrades" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sociale_id" "uuid" NOT NULL,
    "socialite_id" "uuid" NOT NULL,
    "applies_to_round" integer NOT NULL,
    "upgrade_id" "text" NOT NULL,
    "upgrade_json" "jsonb" NOT NULL,
    "consumed" boolean DEFAULT false NOT NULL,
    "awarded_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."sociale_chest_upgrades" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sociale_question_stats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sociale_id" "uuid" NOT NULL,
    "round_order_index" integer NOT NULL,
    "round_id" "uuid",
    "ambient_round_id" "uuid",
    "prompt_text" "text",
    "correct_answer" "text",
    "submissions_count" integer DEFAULT 0 NOT NULL,
    "correct_count" integer DEFAULT 0 NOT NULL,
    "avg_response_time_ms" integer,
    "difficulty_flag" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "sociale_question_stats_difficulty_flag_check" CHECK (("difficulty_flag" = ANY (ARRAY['too_easy'::"text", 'too_hard'::"text", 'good'::"text"])))
);


ALTER TABLE "public"."sociale_question_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sociale_responses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sociale_id" "uuid" NOT NULL,
    "round_id" "uuid",
    "socialite_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "value" "jsonb" NOT NULL,
    "is_correct" boolean,
    "score_awarded" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "moderation_status" "text" DEFAULT 'approved'::"text" NOT NULL,
    "moderation_reason" "text",
    "moderated_at" timestamp with time zone,
    "moderated_by" "uuid",
    "ambient_round_id" "uuid",
    "resolved_round_id" "uuid",
    "is_practice" boolean DEFAULT false NOT NULL,
    CONSTRAINT "sociale_responses_moderation_status_check" CHECK (("moderation_status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'scrubbed'::"text"]))),
    CONSTRAINT "sociale_responses_round_source_check" CHECK ((("round_id" IS NOT NULL) OR ("ambient_round_id" IS NOT NULL)))
);


ALTER TABLE "public"."sociale_responses" OWNER TO "postgres";


COMMENT ON COLUMN "public"."sociale_responses"."moderation_status" IS 'P1-24: pending | approved | scrubbed — controls TV visibility';



COMMENT ON COLUMN "public"."sociale_responses"."moderation_reason" IS 'P1-24: optional reason for scrub (profanity, off-topic, etc.)';



CREATE TABLE IF NOT EXISTS "public"."sociale_round_state" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sociale_id" "uuid" NOT NULL,
    "round_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "phase" "text" DEFAULT 'pending'::"text" NOT NULL,
    "started_at" timestamp with time zone,
    "ended_at" timestamp with time zone,
    "phase_started_at" timestamp with time zone,
    "phase_ends_at" timestamp with time zone,
    "answer_ends_at" timestamp with time zone,
    "voting_ends_at" timestamp with time zone,
    "reveal_ends_at" timestamp with time zone,
    "results_ends_at" timestamp with time zone,
    "derived_state" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "paused_remaining_seconds" integer,
    CONSTRAINT "sociale_round_state_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'active'::"text", 'completed'::"text", 'skipped'::"text"])))
);


ALTER TABLE "public"."sociale_round_state" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sociale_rounds" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sociale_id" "uuid" NOT NULL,
    "order_index" integer NOT NULL,
    "type" "text" NOT NULL,
    "title" "text",
    "content" "text",
    "settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "phase_sequence" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "audio_url" "text",
    "audio_kind" "text",
    "audio_start_seconds" integer DEFAULT 0,
    "point_multiplier" numeric DEFAULT 1 NOT NULL,
    "is_final_round" boolean DEFAULT false NOT NULL,
    "round_mode" "text" DEFAULT 'standard'::"text" NOT NULL,
    "predictive_answer" "text",
    CONSTRAINT "sociale_rounds_audio_kind_check" CHECK (("audio_kind" = ANY (ARRAY['mp3'::"text", 'youtube'::"text"]))),
    CONSTRAINT "sociale_rounds_round_mode_check" CHECK (("round_mode" = ANY (ARRAY['standard'::"text", 'predictive'::"text", 'break'::"text"]))),
    CONSTRAINT "sociale_rounds_type_check" CHECK (("type" = ANY (ARRAY['prompt'::"text", 'trivia'::"text", 'topic'::"text", 'poll'::"text", 'custom'::"text"])))
);


ALTER TABLE "public"."sociale_rounds" OWNER TO "postgres";


COMMENT ON COLUMN "public"."sociale_rounds"."audio_url" IS 'P1-12: MP3 URL (question-audio bucket) or YouTube video URL';



COMMENT ON COLUMN "public"."sociale_rounds"."audio_kind" IS 'P1-12: mp3 | youtube';



COMMENT ON COLUMN "public"."sociale_rounds"."audio_start_seconds" IS 'P1-12: start offset in seconds for YouTube clips';



COMMENT ON COLUMN "public"."sociale_rounds"."point_multiplier" IS 'P1-11: score multiplier applied when this round is scored (default 1)';



COMMENT ON COLUMN "public"."sociale_rounds"."is_final_round" IS 'P1-11: explicit final-round flag for scheduler/splash';



COMMENT ON COLUMN "public"."sociale_rounds"."round_mode" IS 'P1-8/P1-19: standard | predictive | break';



COMMENT ON COLUMN "public"."sociale_rounds"."predictive_answer" IS 'P1-19: host-set correct answer for predictive (family-feud) rounds';



CREATE TABLE IF NOT EXISTS "public"."sociale_score_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sociale_id" "uuid" NOT NULL,
    "round_id" "uuid",
    "socialite_id" "uuid" NOT NULL,
    "reason" "text" NOT NULL,
    "points" integer NOT NULL,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ambient_round_id" "uuid",
    "resolved_round_id" "uuid"
);


ALTER TABLE "public"."sociale_score_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sociale_session_stats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sociale_id" "uuid" NOT NULL,
    "socialite_id" "uuid" NOT NULL,
    "membership_id" "uuid",
    "accuracy_rate" numeric(5,2),
    "avg_response_time_ms" integer,
    "streak_max" integer DEFAULT 0,
    "fastest_answer_ms" integer,
    "category_king" "jsonb",
    "round_scores" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."sociale_session_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sociale_votes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sociale_id" "uuid" NOT NULL,
    "round_id" "uuid",
    "socialite_id" "uuid" NOT NULL,
    "target_response_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ambient_round_id" "uuid",
    "resolved_round_id" "uuid",
    "is_practice" boolean DEFAULT false NOT NULL,
    CONSTRAINT "sociale_votes_round_source_check" CHECK ((("round_id" IS NOT NULL) OR ("ambient_round_id" IS NOT NULL)))
);


ALTER TABLE "public"."sociale_votes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sociales" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "room_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "title" "text",
    "description" "text",
    "mode" "text" DEFAULT 'custom'::"text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "current_round_index" integer,
    "current_round_id" "uuid",
    "current_phase" "text",
    "phase_started_at" timestamp with time zone,
    "phase_ends_at" timestamp with time zone,
    "total_rounds" integer DEFAULT 5 NOT NULL,
    "settings" "jsonb" DEFAULT '{"autoAdvance": true, "allowLateJoin": true, "answerSeconds": 90, "revealSeconds": 15, "votingSeconds": 30, "resultsSeconds": 12, "leaderboardEnabled": true, "showInterRoundLeaderboard": true}'::"jsonb" NOT NULL,
    "scoreboard" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "runtime_state" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "started_at" timestamp with time zone,
    "ended_at" timestamp with time zone,
    "legacy_session_id" "uuid",
    "paused_remaining_seconds" integer,
    "ambient_pack_id" "uuid",
    "is_tie_break" boolean DEFAULT false NOT NULL,
    "tie_break_round_number" integer DEFAULT 0 NOT NULL,
    "tie_break_participants" "uuid"[] DEFAULT ARRAY[]::"uuid"[] NOT NULL,
    "chest_every_n_rounds" integer DEFAULT 5 NOT NULL,
    CONSTRAINT "sociales_mode_check" CHECK (("mode" = ANY (ARRAY['topics_only'::"text", 'trivia_only'::"text", 'alternating'::"text", 'custom'::"text", 'ambient'::"text"]))),
    CONSTRAINT "sociales_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'lobby'::"text", 'active'::"text", 'paused'::"text", 'completed'::"text", 'cancelled'::"text"])))
);

ALTER TABLE ONLY "public"."sociales" REPLICA IDENTITY FULL;


ALTER TABLE "public"."sociales" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."socialites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sociale_id" "uuid" NOT NULL,
    "room_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "membership_id" "uuid",
    "display_name" "text" NOT NULL,
    "mascot_id" integer,
    "is_host" boolean DEFAULT false NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "is_banned" boolean DEFAULT false NOT NULL,
    "score" integer DEFAULT 0 NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_seen_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "pending_until_round_index" integer
);

ALTER TABLE ONLY "public"."socialites" REPLICA IDENTITY FULL;


ALTER TABLE "public"."socialites" OWNER TO "postgres";


COMMENT ON COLUMN "public"."socialites"."pending_until_round_index" IS 'If set, socialite is inactive until sociales.current_round_index reaches this value; cleared by trigger on sociales.current_round_index update.';



CREATE TABLE IF NOT EXISTS "public"."top_comment_answers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "player_id" "uuid" NOT NULL,
    "round_index" integer NOT NULL,
    "group_id" "text" NOT NULL,
    "text" "text" NOT NULL,
    "masked" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."top_comment_answers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."top_comment_votes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "player_id" "uuid" NOT NULL,
    "answer_id" "uuid" NOT NULL,
    "round_index" integer NOT NULL,
    "group_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."top_comment_votes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trivia_evaluations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "submission_id" "uuid",
    "interaction_id" "uuid",
    "room_id" "uuid" NOT NULL,
    "member_id" "uuid" NOT NULL,
    "result" "text",
    "points_awarded" integer NOT NULL,
    "method" "text",
    "confidence" real,
    "matched_alias" "text",
    "reasoning_short" "text",
    "grader_version" "text" NOT NULL,
    "judged_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "trivia_evaluations_method_check" CHECK (("method" = ANY (ARRAY['exact'::"text", 'alias'::"text", 'fuzzy'::"text", 'host_override'::"text"]))),
    CONSTRAINT "trivia_evaluations_result_check" CHECK (("result" = ANY (ARRAY['correct'::"text", 'partial'::"text", 'incorrect'::"text", 'needs_review'::"text"])))
);


ALTER TABLE "public"."trivia_evaluations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trivia_question_aliases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "question_id" "uuid",
    "alias_text" "text" NOT NULL,
    "alias_normalized" "text" NOT NULL,
    "match_type" "text",
    CONSTRAINT "trivia_question_aliases_match_type_check" CHECK (("match_type" = ANY (ARRAY['exact'::"text", 'alias'::"text"])))
);


ALTER TABLE "public"."trivia_question_aliases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trivia_question_options" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "question_id" "uuid",
    "option_id" "text" NOT NULL,
    "option_text" "text" NOT NULL,
    "is_correct" boolean NOT NULL,
    "sort_order" integer
);


ALTER TABLE "public"."trivia_question_options" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trivia_question_packs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "status" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "trivia_question_packs_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."trivia_question_packs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trivia_questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pack_id" "uuid",
    "format" "text",
    "category_key" "text" NOT NULL,
    "difficulty" "text",
    "prompt" "text" NOT NULL,
    "explanation" "text",
    "hint" "text",
    "media" "jsonb",
    "status" "text",
    "tags" "text"[],
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "accepted_answers" "text"[] DEFAULT '{}'::"text"[],
    CONSTRAINT "trivia_questions_difficulty_check" CHECK (("difficulty" = ANY (ARRAY['easy'::"text", 'medium'::"text", 'hard'::"text"]))),
    CONSTRAINT "trivia_questions_format_check" CHECK (("format" = ANY (ARRAY['multiple_choice'::"text", 'written_answer'::"text"]))),
    CONSTRAINT "trivia_questions_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."trivia_questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trivia_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "interaction_id" "uuid",
    "room_id" "uuid" NOT NULL,
    "member_id" "uuid" NOT NULL,
    "submitted_at" timestamp with time zone DEFAULT "now"(),
    "latency_ms" integer,
    "payload" "jsonb" NOT NULL,
    "status" "text",
    CONSTRAINT "trivia_submissions_status_check" CHECK (("status" = ANY (ARRAY['accepted'::"text", 'replaced'::"text", 'late'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."trivia_submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."venue_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "auth_user_id" "text" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text" NOT NULL,
    "phone" "text",
    "role" "text" NOT NULL,
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_active_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "room_id" "uuid",
    CONSTRAINT "venue_accounts_role_check" CHECK (("role" = ANY (ARRAY['bar_owner'::"text", 'staff'::"text"])))
);


ALTER TABLE "public"."venue_accounts" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."user_account_info" AS
 SELECT "u"."id" AS "user_id",
    "u"."email",
    "u"."raw_user_meta_data",
    COALESCE("pa"."display_name", NULL::character varying) AS "player_display_name",
    COALESCE("pa"."avatar_url", NULL::"text") AS "player_avatar_url",
    COALESCE("pa"."player_level", 0) AS "player_level",
    COALESCE("pa"."total_games_played", 0) AS "total_games_played",
    COALESCE("pa"."total_wins", 0) AS "total_wins",
    COALESCE("pa"."total_points", 0) AS "total_points",
    COALESCE("pa"."status", 'inactive'::character varying) AS "player_status",
    COALESCE("pa"."last_login_at", "u"."created_at") AS "last_login_at",
    COALESCE("pa"."created_at", "u"."created_at") AS "player_created_at",
    COALESCE("pa"."updated_at", "u"."updated_at") AS "player_updated_at",
    COALESCE("va"."is_active", false) AS "is_venue_active",
    COALESCE("va"."full_name", NULL::"text") AS "venue_full_name",
    COALESCE("va"."role", NULL::"text") AS "venue_role",
    (("pa"."user_id" IS NOT NULL) AND (("pa"."status")::"text" = 'active'::"text")) AS "has_player_account",
    (("va"."auth_user_id" IS NOT NULL) AND ("va"."is_active" = true)) AS "has_venue_account",
    "public"."get_account_type"("u"."id") AS "account_type"
   FROM (("auth"."users" "u"
     LEFT JOIN "public"."player_accounts" "pa" ON (("u"."id" = "pa"."user_id")))
     LEFT JOIN "public"."venue_accounts" "va" ON ((("u"."id")::"text" = "va"."auth_user_id")));


ALTER VIEW "public"."user_account_info" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "auth_user_id" "text",
    "username" "text" NOT NULL,
    "display_name" "text",
    "avatar_url" "text",
    "is_anonymous" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_active_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."venues" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "features" "jsonb" DEFAULT '{"comments": true}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."venues" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vibox_queue" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "room_id" "uuid" NOT NULL,
    "track_id" "text" NOT NULL,
    "track_title" "text" NOT NULL,
    "track_artist" "text",
    "track_album" "text",
    "track_duration_ms" integer,
    "track_artwork_url" "text",
    "added_by_membership_id" "uuid",
    "position" integer DEFAULT 0 NOT NULL,
    "is_played" boolean DEFAULT false NOT NULL,
    "votes" integer DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'queued'::"text" NOT NULL,
    "played_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE ONLY "public"."vibox_queue" REPLICA IDENTITY FULL;


ALTER TABLE "public"."vibox_queue" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vibox_votes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "room_id" "uuid" NOT NULL,
    "membership_id" "uuid" NOT NULL,
    "track_id" "text" NOT NULL,
    "vote_type" "text" DEFAULT 'up'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE ONLY "public"."vibox_votes" REPLICA IDENTITY FULL;


ALTER TABLE "public"."vibox_votes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."votes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "voter_id" "uuid" NOT NULL,
    "answer_id" "uuid" NOT NULL,
    "round_index" integer NOT NULL,
    "group_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."votes" OWNER TO "postgres";


ALTER TABLE ONLY "public"."ambient_packs"
    ADD CONSTRAINT "ambient_packs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ambient_rounds"
    ADD CONSTRAINT "ambient_rounds_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."answers"
    ADD CONSTRAINT "answers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."answers"
    ADD CONSTRAINT "answers_session_team_round_unique" UNIQUE ("session_id", "team_id", "round_index");



ALTER TABLE ONLY "public"."audience_submissions"
    ADD CONSTRAINT "audience_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interaction_votes"
    ADD CONSTRAINT "interaction_votes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interactions"
    ADD CONSTRAINT "interactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."membership_achievements"
    ADD CONSTRAINT "membership_achievements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."player_accounts"
    ADD CONSTRAINT "player_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."player_accounts"
    ADD CONSTRAINT "player_accounts_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."player_blocks"
    ADD CONSTRAINT "player_blocks_blocker_membership_id_blocked_membership_id_key" UNIQUE ("blocker_membership_id", "blocked_membership_id");



ALTER TABLE ONLY "public"."player_blocks"
    ADD CONSTRAINT "player_blocks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prompt_libraries"
    ADD CONSTRAINT "prompt_libraries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prompts"
    ADD CONSTRAINT "prompts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."responses"
    ADD CONSTRAINT "responses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."responses"
    ADD CONSTRAINT "responses_unique_per_interaction" UNIQUE ("interaction_id", "membership_id");



ALTER TABLE ONLY "public"."room_membership_stats"
    ADD CONSTRAINT "room_membership_stats_pkey" PRIMARY KEY ("membership_id");



ALTER TABLE ONLY "public"."room_memberships"
    ADD CONSTRAINT "room_memberships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."room_messages"
    ADD CONSTRAINT "room_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rooms"
    ADD CONSTRAINT "rooms_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."rooms"
    ADD CONSTRAINT "rooms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."season_standings"
    ADD CONSTRAINT "season_standings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."season_standings"
    ADD CONSTRAINT "season_standings_season_id_membership_id_key" UNIQUE ("season_id", "membership_id");



ALTER TABLE ONLY "public"."seasons"
    ADD CONSTRAINT "seasons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."seasons"
    ADD CONSTRAINT "seasons_starts_at_key" UNIQUE ("starts_at");



ALTER TABLE ONLY "public"."sociale_analytics"
    ADD CONSTRAINT "sociale_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sociale_banter"
    ADD CONSTRAINT "sociale_banter_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sociale_banter_upvotes"
    ADD CONSTRAINT "sociale_banter_upvotes_pkey" PRIMARY KEY ("banter_id", "socialite_id");



ALTER TABLE ONLY "public"."sociale_chest_upgrades"
    ADD CONSTRAINT "sociale_chest_upgrades_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sociale_chest_upgrades"
    ADD CONSTRAINT "sociale_chest_upgrades_sociale_id_socialite_id_applies_to_r_key" UNIQUE ("sociale_id", "socialite_id", "applies_to_round");



ALTER TABLE ONLY "public"."sociale_question_stats"
    ADD CONSTRAINT "sociale_question_stats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sociale_question_stats"
    ADD CONSTRAINT "sociale_question_stats_sociale_id_round_order_index_key" UNIQUE ("sociale_id", "round_order_index");



ALTER TABLE ONLY "public"."sociale_responses"
    ADD CONSTRAINT "sociale_responses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sociale_round_state"
    ADD CONSTRAINT "sociale_round_state_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sociale_round_state"
    ADD CONSTRAINT "sociale_round_state_sociale_id_round_id_key" UNIQUE ("sociale_id", "round_id");



ALTER TABLE ONLY "public"."sociale_rounds"
    ADD CONSTRAINT "sociale_rounds_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sociale_rounds"
    ADD CONSTRAINT "sociale_rounds_sociale_id_order_index_key" UNIQUE ("sociale_id", "order_index");



ALTER TABLE ONLY "public"."sociale_score_events"
    ADD CONSTRAINT "sociale_score_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sociale_session_stats"
    ADD CONSTRAINT "sociale_session_stats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sociale_session_stats"
    ADD CONSTRAINT "sociale_session_stats_sociale_id_socialite_id_key" UNIQUE ("sociale_id", "socialite_id");



ALTER TABLE ONLY "public"."sociale_votes"
    ADD CONSTRAINT "sociale_votes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sociale_votes"
    ADD CONSTRAINT "sociale_votes_resolved_round_id_socialite_id_key" UNIQUE ("resolved_round_id", "socialite_id");



ALTER TABLE ONLY "public"."sociales"
    ADD CONSTRAINT "sociales_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."socialites"
    ADD CONSTRAINT "socialites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."socialites"
    ADD CONSTRAINT "socialites_sociale_id_membership_id_key" UNIQUE ("sociale_id", "membership_id");



ALTER TABLE ONLY "public"."top_comment_answers"
    ADD CONSTRAINT "top_comment_answers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."top_comment_answers"
    ADD CONSTRAINT "top_comment_answers_session_id_player_id_round_index_key" UNIQUE ("session_id", "player_id", "round_index");



ALTER TABLE ONLY "public"."top_comment_players"
    ADD CONSTRAINT "top_comment_players_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."top_comment_players"
    ADD CONSTRAINT "top_comment_players_session_id_user_id_key" UNIQUE ("session_id", "user_id");



ALTER TABLE ONLY "public"."top_comment_sessions"
    ADD CONSTRAINT "top_comment_sessions_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."top_comment_sessions"
    ADD CONSTRAINT "top_comment_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."top_comment_votes"
    ADD CONSTRAINT "top_comment_votes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."top_comment_votes"
    ADD CONSTRAINT "top_comment_votes_player_id_round_index_group_id_key" UNIQUE ("player_id", "round_index", "group_id");



ALTER TABLE ONLY "public"."trivia_evaluations"
    ADD CONSTRAINT "trivia_evaluations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trivia_question_aliases"
    ADD CONSTRAINT "trivia_question_aliases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trivia_question_options"
    ADD CONSTRAINT "trivia_question_options_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trivia_question_options"
    ADD CONSTRAINT "trivia_question_options_question_id_option_id_key" UNIQUE ("question_id", "option_id");



ALTER TABLE ONLY "public"."trivia_question_packs"
    ADD CONSTRAINT "trivia_question_packs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trivia_questions"
    ADD CONSTRAINT "trivia_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trivia_submissions"
    ADD CONSTRAINT "trivia_submissions_interaction_id_member_id_key" UNIQUE ("interaction_id", "member_id");



ALTER TABLE ONLY "public"."trivia_submissions"
    ADD CONSTRAINT "trivia_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interaction_votes"
    ADD CONSTRAINT "unique_interaction_membership_vote" UNIQUE ("interaction_id", "membership_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_auth_user_id_key" UNIQUE ("auth_user_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."venue_accounts"
    ADD CONSTRAINT "venue_accounts_auth_user_id_key" UNIQUE ("auth_user_id");



ALTER TABLE ONLY "public"."venue_accounts"
    ADD CONSTRAINT "venue_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."venues"
    ADD CONSTRAINT "venues_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."venues"
    ADD CONSTRAINT "venues_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."vibox_queue"
    ADD CONSTRAINT "vibox_queue_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vibox_votes"
    ADD CONSTRAINT "vibox_votes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vibox_votes"
    ADD CONSTRAINT "vibox_votes_room_id_membership_id_track_id_key" UNIQUE ("room_id", "membership_id", "track_id");



ALTER TABLE ONLY "public"."votes"
    ADD CONSTRAINT "votes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."votes"
    ADD CONSTRAINT "votes_voter_id_round_index_group_id_key" UNIQUE ("voter_id", "round_index", "group_id");



CREATE UNIQUE INDEX "ambient_packs_one_default" ON "public"."ambient_packs" USING "btree" ("is_default") WHERE ("is_default" = true);



CREATE INDEX "ambient_packs_sort_order" ON "public"."ambient_packs" USING "btree" ("sort_order");



CREATE UNIQUE INDEX "ambient_rounds_pack_order_idx" ON "public"."ambient_rounds" USING "btree" ("pack_id", "order_index");



CREATE INDEX "ambient_rounds_type_idx" ON "public"."ambient_rounds" USING "btree" ("type");



CREATE INDEX "idx_achievements_member" ON "public"."membership_achievements" USING "btree" ("membership_id", "earned_at" DESC);



CREATE INDEX "idx_answers_session_id" ON "public"."answers" USING "btree" ("session_id");



CREATE INDEX "idx_answers_session_round" ON "public"."answers" USING "btree" ("session_id", "round_index");



CREATE INDEX "idx_answers_team" ON "public"."answers" USING "btree" ("team_id");



CREATE INDEX "idx_answers_updated_at" ON "public"."answers" USING "btree" ("updated_at");



CREATE INDEX "idx_audience_submissions_membership_id" ON "public"."audience_submissions" USING "btree" ("membership_id");



CREATE INDEX "idx_audience_submissions_room_id" ON "public"."audience_submissions" USING "btree" ("room_id");



CREATE INDEX "idx_audience_submissions_status" ON "public"."audience_submissions" USING "btree" ("status");



CREATE INDEX "idx_banter_sociale_created" ON "public"."sociale_banter" USING "btree" ("sociale_id", "created_at" DESC);



CREATE INDEX "idx_banter_socialite" ON "public"."sociale_banter" USING "btree" ("socialite_id", "created_at" DESC);



CREATE INDEX "idx_banter_status" ON "public"."sociale_banter" USING "btree" ("sociale_id", "status");



CREATE INDEX "idx_banter_upvotes_socialite" ON "public"."sociale_banter_upvotes" USING "btree" ("socialite_id");



CREATE INDEX "idx_chest_upgrades_sociale" ON "public"."sociale_chest_upgrades" USING "btree" ("sociale_id", "applies_to_round");



CREATE INDEX "idx_chest_upgrades_socialite" ON "public"."sociale_chest_upgrades" USING "btree" ("socialite_id", "consumed");



CREATE INDEX "idx_interaction_votes_interaction_id" ON "public"."interaction_votes" USING "btree" ("interaction_id");



CREATE INDEX "idx_interaction_votes_membership_id" ON "public"."interaction_votes" USING "btree" ("membership_id");



CREATE INDEX "idx_interaction_votes_response_id" ON "public"."interaction_votes" USING "btree" ("response_id");



CREATE INDEX "idx_interactions_challenge_status" ON "public"."interactions" USING "btree" ("challenge_status");



CREATE INDEX "idx_interactions_room_active" ON "public"."interactions" USING "btree" ("room_id", "status") WHERE ("status" = 'active'::"text");



CREATE INDEX "idx_interactions_source" ON "public"."interactions" USING "btree" ("source_membership_id");



CREATE INDEX "idx_interactions_target" ON "public"."interactions" USING "btree" ("target_membership_id");



CREATE UNIQUE INDEX "idx_one_active_session_per_room" ON "public"."top_comment_sessions" USING "btree" ("room_id") WHERE (("room_id" IS NOT NULL) AND ("status" <> 'ended'::"text"));



CREATE INDEX "idx_player_accounts_status" ON "public"."player_accounts" USING "btree" ("status");



CREATE INDEX "idx_player_accounts_user_id" ON "public"."player_accounts" USING "btree" ("user_id");



CREATE INDEX "idx_player_blocks_blocker" ON "public"."player_blocks" USING "btree" ("blocker_membership_id");



CREATE INDEX "idx_question_stats_difficulty" ON "public"."sociale_question_stats" USING "btree" ("difficulty_flag") WHERE ("difficulty_flag" IS NOT NULL);



CREATE INDEX "idx_question_stats_sociale" ON "public"."sociale_question_stats" USING "btree" ("sociale_id");



CREATE INDEX "idx_reports_room" ON "public"."reports" USING "btree" ("room_id");



CREATE INDEX "idx_reports_status" ON "public"."reports" USING "btree" ("status");



CREATE INDEX "idx_responses_interaction" ON "public"."responses" USING "btree" ("interaction_id");



CREATE INDEX "idx_responses_practice" ON "public"."sociale_responses" USING "btree" ("sociale_id", "is_practice");



CREATE INDEX "idx_room_memberships_client_key" ON "public"."room_memberships" USING "btree" ("room_id", "client_key") WHERE ("client_key" IS NOT NULL);



CREATE INDEX "idx_room_memberships_is_banned" ON "public"."room_memberships" USING "btree" ("is_banned");



CREATE INDEX "idx_room_memberships_is_host" ON "public"."room_memberships" USING "btree" ("is_host");



CREATE INDEX "idx_room_memberships_joined_at" ON "public"."room_memberships" USING "btree" ("joined_at");



CREATE INDEX "idx_room_memberships_last_active_at" ON "public"."room_memberships" USING "btree" ("last_active_at");



CREATE INDEX "idx_room_memberships_room_id" ON "public"."room_memberships" USING "btree" ("room_id");



CREATE INDEX "idx_room_memberships_status" ON "public"."room_memberships" USING "btree" ("status");



CREATE INDEX "idx_room_memberships_user_id" ON "public"."room_memberships" USING "btree" ("user_id");



CREATE INDEX "idx_room_messages_created_at" ON "public"."room_messages" USING "btree" ("created_at");



CREATE INDEX "idx_room_messages_membership_id" ON "public"."room_messages" USING "btree" ("membership_id");



CREATE INDEX "idx_room_messages_room_id" ON "public"."room_messages" USING "btree" ("room_id");



CREATE INDEX "idx_rooms_code" ON "public"."rooms" USING "btree" ("code");



CREATE INDEX "idx_rooms_created_at" ON "public"."rooms" USING "btree" ("created_at");



CREATE INDEX "idx_rooms_creator_id" ON "public"."rooms" USING "btree" ("creator_id");



CREATE INDEX "idx_rooms_current_sociale_id" ON "public"."rooms" USING "btree" ("current_sociale_id");



CREATE INDEX "idx_rooms_host_uid" ON "public"."rooms" USING "btree" ("host_uid");



CREATE INDEX "idx_rooms_moderator_ids" ON "public"."rooms" USING "gin" ("moderator_ids");



CREATE INDEX "idx_rooms_status" ON "public"."rooms" USING "btree" ("status");



CREATE INDEX "idx_seasons_dates" ON "public"."seasons" USING "btree" ("starts_at", "ends_at");



CREATE INDEX "idx_session_stats_sociale" ON "public"."sociale_session_stats" USING "btree" ("sociale_id");



CREATE INDEX "idx_sessions_room_id" ON "public"."top_comment_sessions" USING "btree" ("room_id");



CREATE INDEX "idx_sociale_analytics_category" ON "public"."sociale_analytics" USING "btree" ("category");



CREATE INDEX "idx_sociale_analytics_sociale_id" ON "public"."sociale_analytics" USING "btree" ("sociale_id");



CREATE INDEX "idx_sociale_responses_moderation" ON "public"."sociale_responses" USING "btree" ("sociale_id", "moderation_status");



CREATE INDEX "idx_sociale_responses_resolved_round_id" ON "public"."sociale_responses" USING "btree" ("resolved_round_id");



CREATE INDEX "idx_sociale_responses_round_id" ON "public"."sociale_responses" USING "btree" ("round_id");



CREATE INDEX "idx_sociale_responses_sociale_id" ON "public"."sociale_responses" USING "btree" ("sociale_id");



CREATE INDEX "idx_sociale_responses_socialite_id" ON "public"."sociale_responses" USING "btree" ("socialite_id");



CREATE INDEX "idx_sociale_round_state_round_id" ON "public"."sociale_round_state" USING "btree" ("round_id");



CREATE INDEX "idx_sociale_round_state_sociale_id" ON "public"."sociale_round_state" USING "btree" ("sociale_id");



CREATE INDEX "idx_sociale_rounds_sociale_id" ON "public"."sociale_rounds" USING "btree" ("sociale_id");



CREATE INDEX "idx_sociale_score_events_resolved_round_id" ON "public"."sociale_score_events" USING "btree" ("resolved_round_id");



CREATE INDEX "idx_sociale_score_events_sociale_id" ON "public"."sociale_score_events" USING "btree" ("sociale_id");



CREATE INDEX "idx_sociale_score_events_socialite_id" ON "public"."sociale_score_events" USING "btree" ("socialite_id");



CREATE INDEX "idx_sociale_votes_resolved_round_id" ON "public"."sociale_votes" USING "btree" ("resolved_round_id");



CREATE INDEX "idx_sociale_votes_round_id" ON "public"."sociale_votes" USING "btree" ("round_id");



CREATE INDEX "idx_sociale_votes_socialite_id" ON "public"."sociale_votes" USING "btree" ("socialite_id");



CREATE INDEX "idx_sociales_created_by" ON "public"."sociales" USING "btree" ("created_by");



CREATE INDEX "idx_sociales_room_id" ON "public"."sociales" USING "btree" ("room_id");



CREATE INDEX "idx_sociales_status" ON "public"."sociales" USING "btree" ("status");



CREATE INDEX "idx_sociales_tie_break" ON "public"."sociales" USING "btree" ("id", "is_tie_break") WHERE ("is_tie_break" = true);



CREATE INDEX "idx_socialites_membership_id" ON "public"."socialites" USING "btree" ("membership_id");



CREATE INDEX "idx_socialites_sociale_id" ON "public"."socialites" USING "btree" ("sociale_id");



CREATE INDEX "idx_socialites_user_id" ON "public"."socialites" USING "btree" ("user_id");



CREATE INDEX "idx_standings_membership" ON "public"."season_standings" USING "btree" ("membership_id", "season_id" DESC);



CREATE INDEX "idx_standings_season_score" ON "public"."season_standings" USING "btree" ("season_id", "total_score" DESC);



CREATE INDEX "idx_top_comment_answers_session" ON "public"."top_comment_answers" USING "btree" ("session_id");



CREATE INDEX "idx_top_comment_players_session" ON "public"."top_comment_players" USING "btree" ("session_id");



CREATE INDEX "idx_top_comment_votes_answer" ON "public"."top_comment_votes" USING "btree" ("answer_id");



CREATE INDEX "idx_top_comment_votes_session" ON "public"."top_comment_votes" USING "btree" ("session_id");



CREATE INDEX "idx_trivia_aliases_normalized" ON "public"."trivia_question_aliases" USING "btree" ("alias_normalized");



CREATE INDEX "idx_trivia_aliases_question_id" ON "public"."trivia_question_aliases" USING "btree" ("question_id");



CREATE INDEX "idx_trivia_evaluations_room_member" ON "public"."trivia_evaluations" USING "btree" ("room_id", "member_id");



CREATE INDEX "idx_trivia_options_question_id" ON "public"."trivia_question_options" USING "btree" ("question_id");



CREATE INDEX "idx_trivia_question_aliases_normalized" ON "public"."trivia_question_aliases" USING "btree" ("alias_normalized");



CREATE INDEX "idx_trivia_questions_accepted_answers" ON "public"."trivia_questions" USING "gin" ("accepted_answers");



CREATE INDEX "idx_trivia_questions_category_difficulty" ON "public"."trivia_questions" USING "btree" ("category_key", "difficulty");



CREATE INDEX "idx_trivia_questions_pack_id" ON "public"."trivia_questions" USING "btree" ("pack_id");



CREATE INDEX "idx_trivia_questions_pack_status" ON "public"."trivia_questions" USING "btree" ("pack_id", "status");



CREATE INDEX "idx_trivia_questions_status" ON "public"."trivia_questions" USING "btree" ("status");



CREATE INDEX "idx_trivia_questions_tags" ON "public"."trivia_questions" USING "gin" ("tags");



CREATE INDEX "idx_trivia_submissions_room_member" ON "public"."trivia_submissions" USING "btree" ("room_id", "member_id");



CREATE UNIQUE INDEX "idx_unique_anonymous_membership" ON "public"."room_memberships" USING "btree" ("room_id", "player_name") WHERE ("user_id" IS NULL);



CREATE UNIQUE INDEX "idx_unique_user_membership" ON "public"."room_memberships" USING "btree" ("room_id", "user_id") WHERE ("user_id" IS NOT NULL);



CREATE INDEX "idx_venue_accounts_active" ON "public"."venue_accounts" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_venue_accounts_auth_user_id" ON "public"."venue_accounts" USING "btree" ("auth_user_id");



CREATE INDEX "idx_venue_accounts_email" ON "public"."venue_accounts" USING "btree" ("email");



CREATE INDEX "idx_venue_accounts_room_id" ON "public"."venue_accounts" USING "btree" ("room_id") WHERE ("room_id" IS NOT NULL);



CREATE INDEX "idx_vibox_queue_is_played" ON "public"."vibox_queue" USING "btree" ("is_played");



CREATE INDEX "idx_vibox_queue_position" ON "public"."vibox_queue" USING "btree" ("position");



CREATE INDEX "idx_vibox_queue_room_id" ON "public"."vibox_queue" USING "btree" ("room_id");



CREATE INDEX "idx_vibox_queue_status" ON "public"."vibox_queue" USING "btree" ("status");



CREATE INDEX "idx_vibox_queue_votes" ON "public"."vibox_queue" USING "btree" ("votes" DESC);



CREATE INDEX "idx_vibox_votes_membership_id" ON "public"."vibox_votes" USING "btree" ("membership_id");



CREATE INDEX "idx_vibox_votes_room_id" ON "public"."vibox_votes" USING "btree" ("room_id");



CREATE INDEX "idx_vibox_votes_track_id" ON "public"."vibox_votes" USING "btree" ("track_id");



CREATE INDEX "idx_votes_answer" ON "public"."votes" USING "btree" ("answer_id");



CREATE INDEX "idx_votes_practice" ON "public"."sociale_votes" USING "btree" ("sociale_id", "is_practice");



CREATE INDEX "idx_votes_session_id" ON "public"."votes" USING "btree" ("session_id");



CREATE INDEX "idx_votes_session_round" ON "public"."votes" USING "btree" ("session_id", "round_index");



CREATE OR REPLACE TRIGGER "answer_updates_activity" AFTER INSERT OR UPDATE ON "public"."answers" FOR EACH ROW EXECUTE FUNCTION "public"."update_team_activity"();



CREATE OR REPLACE TRIGGER "cleanup_guests_on_room_archive" AFTER UPDATE OF "status" ON "public"."rooms" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_cleanup_guests_on_room_archive"();



CREATE OR REPLACE TRIGGER "create_player_account_trigger" AFTER INSERT ON "public"."room_memberships" FOR EACH ROW WHEN (("new"."user_id" IS NOT NULL)) EXECUTE FUNCTION "public"."create_player_account_on_join"();



CREATE OR REPLACE TRIGGER "enforce_room_capacity" BEFORE INSERT ON "public"."room_memberships" FOR EACH ROW EXECUTE FUNCTION "public"."check_room_capacity"();



CREATE OR REPLACE TRIGGER "sociale_responses_set_resolved_round_id" BEFORE INSERT OR UPDATE ON "public"."sociale_responses" FOR EACH ROW EXECUTE FUNCTION "public"."set_resolved_round_id"();



CREATE OR REPLACE TRIGGER "sociale_responses_updated_at" BEFORE UPDATE ON "public"."sociale_responses" FOR EACH ROW EXECUTE FUNCTION "public"."update_sociale_updated_at"();



CREATE OR REPLACE TRIGGER "sociale_round_state_updated_at" BEFORE UPDATE ON "public"."sociale_round_state" FOR EACH ROW EXECUTE FUNCTION "public"."update_sociale_updated_at"();



CREATE OR REPLACE TRIGGER "sociale_rounds_updated_at" BEFORE UPDATE ON "public"."sociale_rounds" FOR EACH ROW EXECUTE FUNCTION "public"."update_sociale_updated_at"();



CREATE OR REPLACE TRIGGER "sociale_score_events_set_resolved_round_id" BEFORE INSERT OR UPDATE ON "public"."sociale_score_events" FOR EACH ROW EXECUTE FUNCTION "public"."set_resolved_round_id"();



CREATE OR REPLACE TRIGGER "sociale_votes_set_resolved_round_id" BEFORE INSERT OR UPDATE ON "public"."sociale_votes" FOR EACH ROW EXECUTE FUNCTION "public"."set_resolved_round_id"();



CREATE OR REPLACE TRIGGER "sociales_activate_pending_socialites" AFTER UPDATE OF "current_round_index" ON "public"."sociales" FOR EACH ROW EXECUTE FUNCTION "public"."activate_pending_socialites_on_round_advance"();



CREATE OR REPLACE TRIGGER "sociales_updated_at" BEFORE UPDATE ON "public"."sociales" FOR EACH ROW EXECUTE FUNCTION "public"."update_sociale_updated_at"();



CREATE OR REPLACE TRIGGER "socialites_updated_at" BEFORE UPDATE ON "public"."socialites" FOR EACH ROW EXECUTE FUNCTION "public"."update_sociale_updated_at"();



CREATE OR REPLACE TRIGGER "trg_sync_accepted_answers" AFTER INSERT OR DELETE OR UPDATE ON "public"."trivia_question_aliases" FOR EACH ROW EXECUTE FUNCTION "public"."sync_trivia_accepted_answers"();



CREATE OR REPLACE TRIGGER "trigger_advance_to_voting_on_answer_timeout" AFTER UPDATE ON "public"."interactions" FOR EACH ROW EXECUTE FUNCTION "public"."advance_interaction_to_voting_on_answer_timeout"();



CREATE OR REPLACE TRIGGER "trigger_increment_response_count" AFTER INSERT ON "public"."responses" FOR EACH ROW EXECUTE FUNCTION "public"."increment_interaction_response_count"();



CREATE OR REPLACE TRIGGER "update_room_session_count" AFTER UPDATE ON "public"."top_comment_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."increment_room_session_count"();



CREATE OR REPLACE TRIGGER "update_rooms_updated_at" BEFORE UPDATE ON "public"."rooms" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_trivia_question_packs_updated_at" BEFORE UPDATE ON "public"."trivia_question_packs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_trivia_questions_updated_at" BEFORE UPDATE ON "public"."trivia_questions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_votes_updated_at" BEFORE UPDATE ON "public"."votes" FOR EACH ROW EXECUTE FUNCTION "public"."update_votes_updated_at"();



CREATE OR REPLACE TRIGGER "vote_updates_activity" AFTER INSERT ON "public"."votes" FOR EACH ROW EXECUTE FUNCTION "public"."update_team_activity"();



ALTER TABLE ONLY "public"."ambient_rounds"
    ADD CONSTRAINT "ambient_rounds_pack_id_fkey" FOREIGN KEY ("pack_id") REFERENCES "public"."ambient_packs"("id");



ALTER TABLE ONLY "public"."audience_submissions"
    ADD CONSTRAINT "audience_submissions_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "public"."room_memberships"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audience_submissions"
    ADD CONSTRAINT "audience_submissions_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."room_memberships"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."audience_submissions"
    ADD CONSTRAINT "audience_submissions_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rooms"
    ADD CONSTRAINT "fk_rooms_current_session" FOREIGN KEY ("current_session_id") REFERENCES "public"."top_comment_sessions"("id");



ALTER TABLE ONLY "public"."interaction_votes"
    ADD CONSTRAINT "interaction_votes_interaction_id_fkey" FOREIGN KEY ("interaction_id") REFERENCES "public"."interactions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interaction_votes"
    ADD CONSTRAINT "interaction_votes_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "public"."room_memberships"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interactions"
    ADD CONSTRAINT "interactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."interactions"
    ADD CONSTRAINT "interactions_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id");



ALTER TABLE ONLY "public"."interactions"
    ADD CONSTRAINT "interactions_source_membership_id_fkey" FOREIGN KEY ("source_membership_id") REFERENCES "public"."room_memberships"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."interactions"
    ADD CONSTRAINT "interactions_target_membership_id_fkey" FOREIGN KEY ("target_membership_id") REFERENCES "public"."room_memberships"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."membership_achievements"
    ADD CONSTRAINT "membership_achievements_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "public"."room_memberships"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_accounts"
    ADD CONSTRAINT "player_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_blocks"
    ADD CONSTRAINT "player_blocks_blocked_membership_id_fkey" FOREIGN KEY ("blocked_membership_id") REFERENCES "public"."room_memberships"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_blocks"
    ADD CONSTRAINT "player_blocks_blocker_membership_id_fkey" FOREIGN KEY ("blocker_membership_id") REFERENCES "public"."room_memberships"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_blocks"
    ADD CONSTRAINT "player_blocks_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prompts"
    ADD CONSTRAINT "prompts_library_id_fkey" FOREIGN KEY ("library_id") REFERENCES "public"."prompt_libraries"("id");



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_reported_membership_id_fkey" FOREIGN KEY ("reported_membership_id") REFERENCES "public"."room_memberships"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_reporter_membership_id_fkey" FOREIGN KEY ("reporter_membership_id") REFERENCES "public"."room_memberships"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."room_memberships"("id");



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."responses"
    ADD CONSTRAINT "responses_interaction_id_fkey" FOREIGN KEY ("interaction_id") REFERENCES "public"."interactions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."responses"
    ADD CONSTRAINT "responses_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "public"."room_memberships"("id");



ALTER TABLE ONLY "public"."room_membership_stats"
    ADD CONSTRAINT "room_membership_stats_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "public"."room_memberships"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."room_memberships"
    ADD CONSTRAINT "room_memberships_banned_by_fkey" FOREIGN KEY ("banned_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."room_memberships"
    ADD CONSTRAINT "room_memberships_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."room_memberships"
    ADD CONSTRAINT "room_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."room_messages"
    ADD CONSTRAINT "room_messages_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "public"."room_memberships"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."room_messages"
    ADD CONSTRAINT "room_messages_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."room_messages"
    ADD CONSTRAINT "room_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rooms"
    ADD CONSTRAINT "rooms_current_sociale_id_fkey" FOREIGN KEY ("current_sociale_id") REFERENCES "public"."sociales"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."rooms"
    ADD CONSTRAINT "rooms_host_uid_fkey" FOREIGN KEY ("host_uid") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."season_standings"
    ADD CONSTRAINT "season_standings_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "public"."room_memberships"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."season_standings"
    ADD CONSTRAINT "season_standings_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sociale_analytics"
    ADD CONSTRAINT "sociale_analytics_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "public"."sociale_rounds"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sociale_analytics"
    ADD CONSTRAINT "sociale_analytics_sociale_id_fkey" FOREIGN KEY ("sociale_id") REFERENCES "public"."sociales"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sociale_banter"
    ADD CONSTRAINT "sociale_banter_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "public"."room_memberships"("id");



ALTER TABLE ONLY "public"."sociale_banter"
    ADD CONSTRAINT "sociale_banter_moderated_by_fkey" FOREIGN KEY ("moderated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."sociale_banter"
    ADD CONSTRAINT "sociale_banter_sociale_id_fkey" FOREIGN KEY ("sociale_id") REFERENCES "public"."sociales"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sociale_banter"
    ADD CONSTRAINT "sociale_banter_socialite_id_fkey" FOREIGN KEY ("socialite_id") REFERENCES "public"."socialites"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sociale_banter_upvotes"
    ADD CONSTRAINT "sociale_banter_upvotes_banter_id_fkey" FOREIGN KEY ("banter_id") REFERENCES "public"."sociale_banter"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sociale_banter_upvotes"
    ADD CONSTRAINT "sociale_banter_upvotes_socialite_id_fkey" FOREIGN KEY ("socialite_id") REFERENCES "public"."socialites"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sociale_chest_upgrades"
    ADD CONSTRAINT "sociale_chest_upgrades_sociale_id_fkey" FOREIGN KEY ("sociale_id") REFERENCES "public"."sociales"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sociale_chest_upgrades"
    ADD CONSTRAINT "sociale_chest_upgrades_socialite_id_fkey" FOREIGN KEY ("socialite_id") REFERENCES "public"."socialites"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sociale_question_stats"
    ADD CONSTRAINT "sociale_question_stats_sociale_id_fkey" FOREIGN KEY ("sociale_id") REFERENCES "public"."sociales"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sociale_responses"
    ADD CONSTRAINT "sociale_responses_ambient_round_id_fkey" FOREIGN KEY ("ambient_round_id") REFERENCES "public"."ambient_rounds"("id");



ALTER TABLE ONLY "public"."sociale_responses"
    ADD CONSTRAINT "sociale_responses_moderated_by_fkey" FOREIGN KEY ("moderated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."sociale_responses"
    ADD CONSTRAINT "sociale_responses_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "public"."sociale_rounds"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sociale_responses"
    ADD CONSTRAINT "sociale_responses_sociale_id_fkey" FOREIGN KEY ("sociale_id") REFERENCES "public"."sociales"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sociale_responses"
    ADD CONSTRAINT "sociale_responses_socialite_id_fkey" FOREIGN KEY ("socialite_id") REFERENCES "public"."socialites"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sociale_round_state"
    ADD CONSTRAINT "sociale_round_state_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "public"."sociale_rounds"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sociale_round_state"
    ADD CONSTRAINT "sociale_round_state_sociale_id_fkey" FOREIGN KEY ("sociale_id") REFERENCES "public"."sociales"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sociale_rounds"
    ADD CONSTRAINT "sociale_rounds_sociale_id_fkey" FOREIGN KEY ("sociale_id") REFERENCES "public"."sociales"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sociale_score_events"
    ADD CONSTRAINT "sociale_score_events_ambient_round_id_fkey" FOREIGN KEY ("ambient_round_id") REFERENCES "public"."ambient_rounds"("id");



ALTER TABLE ONLY "public"."sociale_score_events"
    ADD CONSTRAINT "sociale_score_events_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "public"."sociale_rounds"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sociale_score_events"
    ADD CONSTRAINT "sociale_score_events_sociale_id_fkey" FOREIGN KEY ("sociale_id") REFERENCES "public"."sociales"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sociale_score_events"
    ADD CONSTRAINT "sociale_score_events_socialite_id_fkey" FOREIGN KEY ("socialite_id") REFERENCES "public"."socialites"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sociale_session_stats"
    ADD CONSTRAINT "sociale_session_stats_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "public"."room_memberships"("id");



ALTER TABLE ONLY "public"."sociale_session_stats"
    ADD CONSTRAINT "sociale_session_stats_sociale_id_fkey" FOREIGN KEY ("sociale_id") REFERENCES "public"."sociales"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sociale_session_stats"
    ADD CONSTRAINT "sociale_session_stats_socialite_id_fkey" FOREIGN KEY ("socialite_id") REFERENCES "public"."socialites"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sociale_votes"
    ADD CONSTRAINT "sociale_votes_ambient_round_id_fkey" FOREIGN KEY ("ambient_round_id") REFERENCES "public"."ambient_rounds"("id");



ALTER TABLE ONLY "public"."sociale_votes"
    ADD CONSTRAINT "sociale_votes_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "public"."sociale_rounds"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sociale_votes"
    ADD CONSTRAINT "sociale_votes_sociale_id_fkey" FOREIGN KEY ("sociale_id") REFERENCES "public"."sociales"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sociale_votes"
    ADD CONSTRAINT "sociale_votes_socialite_id_fkey" FOREIGN KEY ("socialite_id") REFERENCES "public"."socialites"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sociale_votes"
    ADD CONSTRAINT "sociale_votes_target_response_id_fkey" FOREIGN KEY ("target_response_id") REFERENCES "public"."sociale_responses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sociales"
    ADD CONSTRAINT "sociales_ambient_pack_id_fkey" FOREIGN KEY ("ambient_pack_id") REFERENCES "public"."ambient_packs"("id");



ALTER TABLE ONLY "public"."sociales"
    ADD CONSTRAINT "sociales_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."sociales"
    ADD CONSTRAINT "sociales_legacy_session_id_fkey" FOREIGN KEY ("legacy_session_id") REFERENCES "public"."top_comment_sessions"("id");



ALTER TABLE ONLY "public"."sociales"
    ADD CONSTRAINT "sociales_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."socialites"
    ADD CONSTRAINT "socialites_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "public"."room_memberships"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."socialites"
    ADD CONSTRAINT "socialites_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."socialites"
    ADD CONSTRAINT "socialites_sociale_id_fkey" FOREIGN KEY ("sociale_id") REFERENCES "public"."sociales"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."socialites"
    ADD CONSTRAINT "socialites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."top_comment_answers"
    ADD CONSTRAINT "top_comment_answers_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."top_comment_players"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."top_comment_answers"
    ADD CONSTRAINT "top_comment_answers_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."top_comment_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."top_comment_players"
    ADD CONSTRAINT "top_comment_players_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."top_comment_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."top_comment_sessions"
    ADD CONSTRAINT "top_comment_sessions_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id");



ALTER TABLE ONLY "public"."trivia_evaluations"
    ADD CONSTRAINT "trivia_evaluations_interaction_id_fkey" FOREIGN KEY ("interaction_id") REFERENCES "public"."interactions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trivia_evaluations"
    ADD CONSTRAINT "trivia_evaluations_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "public"."trivia_submissions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trivia_question_aliases"
    ADD CONSTRAINT "trivia_question_aliases_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."trivia_questions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trivia_question_options"
    ADD CONSTRAINT "trivia_question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."trivia_questions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trivia_question_packs"
    ADD CONSTRAINT "trivia_question_packs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."trivia_questions"
    ADD CONSTRAINT "trivia_questions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."trivia_questions"
    ADD CONSTRAINT "trivia_questions_pack_id_fkey" FOREIGN KEY ("pack_id") REFERENCES "public"."trivia_question_packs"("id");



ALTER TABLE ONLY "public"."trivia_submissions"
    ADD CONSTRAINT "trivia_submissions_interaction_id_fkey" FOREIGN KEY ("interaction_id") REFERENCES "public"."interactions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."venue_accounts"
    ADD CONSTRAINT "venue_accounts_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id");



ALTER TABLE ONLY "public"."vibox_queue"
    ADD CONSTRAINT "vibox_queue_added_by_membership_id_fkey" FOREIGN KEY ("added_by_membership_id") REFERENCES "public"."room_memberships"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."vibox_queue"
    ADD CONSTRAINT "vibox_queue_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vibox_votes"
    ADD CONSTRAINT "vibox_votes_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "public"."room_memberships"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vibox_votes"
    ADD CONSTRAINT "vibox_votes_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."votes"
    ADD CONSTRAINT "votes_answer_id_fkey" FOREIGN KEY ("answer_id") REFERENCES "public"."answers"("id") ON DELETE CASCADE;



CREATE POLICY "Allow hosts to delete room memberships" ON "public"."room_memberships" FOR DELETE USING (((EXISTS ( SELECT 1
   FROM "public"."rooms" "r"
  WHERE (("r"."id" = "room_memberships"."room_id") AND ("r"."host_uid" = "auth"."uid"())))) AND ("user_id" <> "auth"."uid"())));



CREATE POLICY "Allow insert/update of own votes" ON "public"."interaction_votes" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow read access to interaction votes" ON "public"."interaction_votes" FOR SELECT USING (true);



CREATE POLICY "Allow users to view room members" ON "public"."room_memberships" FOR SELECT USING (true);



CREATE POLICY "Anyone can view active rooms" ON "public"."rooms" FOR SELECT USING ((("status")::"text" = 'active'::"text"));



CREATE POLICY "Anyone can view active sociales" ON "public"."sociales" FOR SELECT USING ((("status" = ANY (ARRAY['draft'::"text", 'lobby'::"text", 'active'::"text", 'paused'::"text"])) OR ("room_id" IN ( SELECT "room_memberships"."room_id"
   FROM "public"."room_memberships"
  WHERE (("room_memberships"."user_id" = "auth"."uid"()) AND ("room_memberships"."is_banned" = false) AND (("room_memberships"."status")::"text" = ANY ((ARRAY['active'::character varying, 'approved'::character varying])::"text"[]))))) OR ("created_by" = "auth"."uid"())));



CREATE POLICY "Authenticated users can view player accounts" ON "public"."player_accounts" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Creators can delete their own sociales" ON "public"."sociales" FOR DELETE USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Creators can update their own sociales" ON "public"."sociales" FOR UPDATE USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Enable Realtime for socialites" ON "public"."socialites" USING (true);



CREATE POLICY "Hosts can delete room memberships" ON "public"."room_memberships" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."rooms" "r"
  WHERE (("r"."id" = "room_memberships"."room_id") AND ("r"."host_uid" = "auth"."uid"())))));



CREATE POLICY "Hosts can delete their rooms" ON "public"."rooms" FOR DELETE USING (("auth"."uid"() = "host_uid"));



CREATE POLICY "Hosts can insert room memberships" ON "public"."room_memberships" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."rooms" "r"
  WHERE (("r"."id" = "room_memberships"."room_id") AND ("r"."host_uid" = "auth"."uid"())))));



CREATE POLICY "Hosts can manage their rooms" ON "public"."rooms" USING (("creator_id" = "auth"."uid"()));



CREATE POLICY "Hosts can update room memberships" ON "public"."room_memberships" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."rooms" "r"
  WHERE (("r"."id" = "room_memberships"."room_id") AND ("r"."host_uid" = "auth"."uid"())))));



CREATE POLICY "Hosts can update their rooms" ON "public"."rooms" FOR UPDATE USING (("auth"."uid"() = "host_uid"));



CREATE POLICY "Members can delete their own responses" ON "public"."responses" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."room_memberships" "rm"
  WHERE (("rm"."id" = "responses"."membership_id") AND ("rm"."user_id" = "auth"."uid"())))));



CREATE POLICY "Members can submit responses" ON "public"."responses" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."room_memberships" "rm"
     JOIN "public"."interactions" "i" ON (("i"."room_id" = "rm"."room_id")))
  WHERE (("rm"."id" = "responses"."membership_id") AND ("rm"."user_id" = "auth"."uid"()) AND ("rm"."is_banned" = false) AND ("i"."id" = "responses"."interaction_id") AND ("i"."status" = 'active'::"text")))));



CREATE POLICY "Players can insert own account" ON "public"."player_accounts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Players can update own account" ON "public"."player_accounts" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Public can view active rooms" ON "public"."rooms" FOR SELECT USING (((("status")::"text" = 'active'::"text") AND ((("settings" ->> 'allowAnonymous'::"text"))::boolean = true)));



CREATE POLICY "Reporters can read own reports" ON "public"."reports" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."room_memberships" "rm"
  WHERE (("rm"."id" = "reports"."reporter_membership_id") AND ("rm"."user_id" = "auth"."uid"())))));



CREATE POLICY "Room host can create interactions" ON "public"."interactions" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."rooms" "r"
  WHERE (("r"."id" = "interactions"."room_id") AND ("r"."host_uid" = "auth"."uid"())))));



CREATE POLICY "Room host can update interactions" ON "public"."interactions" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."rooms" "r"
  WHERE (("r"."id" = "interactions"."room_id") AND ("r"."host_uid" = "auth"."uid"())))));



CREATE POLICY "Room hosts can create sociales" ON "public"."sociales" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."room_memberships"
  WHERE (("room_memberships"."room_id" = "room_memberships"."room_id") AND ("room_memberships"."user_id" = "auth"."uid"()) AND ("room_memberships"."is_host" = true) AND ("room_memberships"."is_banned" = false))))));



CREATE POLICY "Room hosts can insert sociale round state" ON "public"."sociale_round_state" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."sociales" "s"
     JOIN "public"."room_memberships" "rm" ON (("rm"."room_id" = "s"."room_id")))
  WHERE (("s"."id" = "sociale_round_state"."sociale_id") AND ("rm"."user_id" = "auth"."uid"()) AND ("rm"."is_host" = true) AND ("rm"."is_banned" = false)))));



CREATE POLICY "Room hosts can read reports" ON "public"."reports" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."room_memberships" "rm"
  WHERE (("rm"."room_id" = "reports"."room_id") AND ("rm"."user_id" = "auth"."uid"()) AND ("rm"."is_host" = true)))));



CREATE POLICY "Room hosts can update reports" ON "public"."reports" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."room_memberships" "rm"
  WHERE (("rm"."room_id" = "reports"."room_id") AND ("rm"."user_id" = "auth"."uid"()) AND ("rm"."is_host" = true)))));



CREATE POLICY "Room hosts can update sociale round state" ON "public"."sociale_round_state" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."sociales" "s"
     JOIN "public"."room_memberships" "rm" ON (("rm"."room_id" = "s"."room_id")))
  WHERE (("s"."id" = "sociale_round_state"."sociale_id") AND ("rm"."user_id" = "auth"."uid"()) AND ("rm"."is_host" = true) AND ("rm"."is_banned" = false))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."sociales" "s"
     JOIN "public"."room_memberships" "rm" ON (("rm"."room_id" = "s"."room_id")))
  WHERE (("s"."id" = "sociale_round_state"."sociale_id") AND ("rm"."user_id" = "auth"."uid"()) AND ("rm"."is_host" = true) AND ("rm"."is_banned" = false)))));



CREATE POLICY "Room members can add to queue" ON "public"."vibox_queue" FOR INSERT WITH CHECK (("added_by_membership_id" IN ( SELECT "room_memberships"."id"
   FROM "public"."room_memberships"
  WHERE ("room_memberships"."user_id" = "auth"."uid"()))));



CREATE POLICY "Room members can create reports" ON "public"."reports" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."room_memberships" "rm"
  WHERE (("rm"."room_id" = "reports"."room_id") AND ("rm"."user_id" = "auth"."uid"()) AND (("rm"."status")::"text" = 'active'::"text")))));



CREATE POLICY "Room members can view analytics" ON "public"."sociale_analytics" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."sociales"
     JOIN "public"."room_memberships" ON (("room_memberships"."room_id" = "sociales"."room_id")))
  WHERE (("sociales"."id" = "sociale_analytics"."sociale_id") AND ("room_memberships"."user_id" = "auth"."uid"()) AND ("room_memberships"."is_banned" = false)))));



CREATE POLICY "Room members can view interactions" ON "public"."interactions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."room_memberships" "rm"
  WHERE (("rm"."room_id" = "interactions"."room_id") AND ("rm"."user_id" = "auth"."uid"()) AND ("rm"."is_banned" = false)))));



CREATE POLICY "Room members can view responses" ON "public"."responses" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."interactions" "i"
     JOIN "public"."room_memberships" "rm" ON (("rm"."room_id" = "i"."room_id")))
  WHERE (("i"."id" = "responses"."interaction_id") AND ("rm"."user_id" = "auth"."uid"()) AND ("rm"."is_banned" = false)))));



CREATE POLICY "Room members can view responses" ON "public"."sociale_responses" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."socialites"
     JOIN "public"."room_memberships" ON (("room_memberships"."room_id" = "socialites"."room_id")))
  WHERE (("socialites"."id" = "sociale_responses"."socialite_id") AND ("room_memberships"."user_id" = "auth"."uid"()) AND ("room_memberships"."is_banned" = false)))));



CREATE POLICY "Room members can view round state" ON "public"."sociale_round_state" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."sociales"
     JOIN "public"."room_memberships" ON (("room_memberships"."room_id" = "sociales"."room_id")))
  WHERE (("sociales"."id" = "sociale_round_state"."sociale_id") AND ("room_memberships"."user_id" = "auth"."uid"()) AND ("room_memberships"."is_banned" = false)))));



CREATE POLICY "Room members can view score events" ON "public"."sociale_score_events" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."socialites"
     JOIN "public"."room_memberships" ON (("room_memberships"."room_id" = "socialites"."room_id")))
  WHERE (("socialites"."id" = "sociale_score_events"."socialite_id") AND ("room_memberships"."user_id" = "auth"."uid"()) AND ("room_memberships"."is_banned" = false)))));



CREATE POLICY "Room members can view sociale rounds" ON "public"."sociale_rounds" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."sociales"
     JOIN "public"."room_memberships" ON (("room_memberships"."room_id" = "sociales"."room_id")))
  WHERE (("sociales"."id" = "sociale_rounds"."sociale_id") AND ("room_memberships"."user_id" = "auth"."uid"()) AND ("room_memberships"."is_banned" = false)))));



CREATE POLICY "Room members can view sociales" ON "public"."sociales" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."room_memberships"
  WHERE (("room_memberships"."room_id" = "sociales"."room_id") AND ("room_memberships"."user_id" = "auth"."uid"()) AND ("room_memberships"."is_banned" = false)))));



CREATE POLICY "Room members can view socialites" ON "public"."socialites" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."room_memberships"
  WHERE (("room_memberships"."room_id" = "socialites"."room_id") AND ("room_memberships"."user_id" = "auth"."uid"()) AND ("room_memberships"."is_banned" = false)))));



CREATE POLICY "Room members can view votes" ON "public"."sociale_votes" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."socialites"
     JOIN "public"."room_memberships" ON (("room_memberships"."room_id" = "socialites"."room_id")))
  WHERE (("socialites"."id" = "sociale_votes"."socialite_id") AND ("room_memberships"."user_id" = "auth"."uid"()) AND ("room_memberships"."is_banned" = false)))));



CREATE POLICY "Rooms are viewable by everyone" ON "public"."rooms" FOR SELECT USING (true);



CREATE POLICY "Service role full access" ON "public"."venue_accounts" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role full access to venue_accounts" ON "public"."venue_accounts" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Sociale creators can insert rounds" ON "public"."sociale_rounds" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."sociales"
  WHERE (("sociales"."id" = "sociale_rounds"."sociale_id") AND ("sociales"."created_by" = "auth"."uid"())))));



CREATE POLICY "Socialites can insert their own score events" ON "public"."sociale_score_events" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."socialites"
  WHERE (("socialites"."id" = "sociale_score_events"."socialite_id") AND ("socialites"."user_id" = "auth"."uid"())))));



CREATE POLICY "Socialites can submit responses" ON "public"."sociale_responses" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."socialites"
  WHERE (("socialites"."id" = "sociale_responses"."socialite_id") AND ("socialites"."user_id" = "auth"."uid"())))));



CREATE POLICY "Socialites can submit votes" ON "public"."sociale_votes" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."socialites"
  WHERE (("socialites"."id" = "sociale_votes"."socialite_id") AND ("socialites"."user_id" = "auth"."uid"())))));



CREATE POLICY "Socialites can update their own response" ON "public"."sociale_responses" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."socialites"
  WHERE (("socialites"."id" = "sociale_responses"."socialite_id") AND ("socialites"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."socialites"
  WHERE (("socialites"."id" = "sociale_responses"."socialite_id") AND ("socialites"."user_id" = "auth"."uid"())))));



CREATE POLICY "Trivia question aliases - All" ON "public"."trivia_question_aliases" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Trivia question aliases - Select" ON "public"."trivia_question_aliases" FOR SELECT USING (true);



CREATE POLICY "Trivia question options - All" ON "public"."trivia_question_options" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Trivia question options - Select" ON "public"."trivia_question_options" FOR SELECT USING (true);



CREATE POLICY "Trivia question packs - All" ON "public"."trivia_question_packs" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Trivia question packs - Select" ON "public"."trivia_question_packs" FOR SELECT USING (true);



CREATE POLICY "Trivia questions - All" ON "public"."trivia_questions" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Trivia questions - Select" ON "public"."trivia_questions" FOR SELECT USING (true);



CREATE POLICY "Users can create own blocks" ON "public"."player_blocks" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."room_memberships" "rm"
  WHERE (("rm"."id" = "player_blocks"."blocker_membership_id") AND ("rm"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can create rooms" ON "public"."rooms" FOR INSERT WITH CHECK (("auth"."uid"() = "host_uid"));



CREATE POLICY "Users can delete own blocks" ON "public"."player_blocks" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."room_memberships" "rm"
  WHERE (("rm"."id" = "player_blocks"."blocker_membership_id") AND ("rm"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete own interactions" ON "public"."interactions" FOR DELETE USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Users can delete their own messages" ON "public"."room_messages" FOR DELETE USING ((("user_id" = "auth"."uid"()) OR ("room_id" IN ( SELECT "room_memberships"."room_id"
   FROM "public"."room_memberships"
  WHERE (("room_memberships"."user_id" = "auth"."uid"()) AND ("room_memberships"."is_banned" = false) AND (("room_memberships"."status")::"text" = ANY ((ARRAY['active'::character varying, 'approved'::character varying])::"text"[])) AND ("room_memberships"."is_host" = true))))));



CREATE POLICY "Users can insert interactions" ON "public"."interactions" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can insert messages in their rooms" ON "public"."room_messages" FOR INSERT WITH CHECK ((("room_id" IN ( SELECT "room_memberships"."room_id"
   FROM "public"."room_memberships"
  WHERE (("room_memberships"."user_id" = "auth"."uid"()) AND ("room_memberships"."is_banned" = false) AND (("room_memberships"."status")::"text" = ANY ((ARRAY['active'::character varying, 'approved'::character varying])::"text"[]))))) AND ("user_id" = "auth"."uid"()) AND ("membership_id" IN ( SELECT "room_memberships"."id"
   FROM "public"."room_memberships"
  WHERE (("room_memberships"."user_id" = "auth"."uid"()) AND ("room_memberships"."room_id" = "room_memberships"."room_id"))))));



CREATE POLICY "Users can insert own memberships" ON "public"."room_memberships" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert own venue account" ON "public"."venue_accounts" FOR INSERT WITH CHECK ((("auth"."uid"())::"text" = "auth_user_id"));



CREATE POLICY "Users can insert responses" ON "public"."responses" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."interactions" "i"
     JOIN "public"."room_memberships" "rm" ON (("rm"."room_id" = "i"."room_id")))
  WHERE (("rm"."id" = "responses"."membership_id") AND ("rm"."user_id" = "auth"."uid"()) AND ("rm"."is_banned" = false) AND ("i"."id" = "responses"."interaction_id") AND ("i"."status" = 'active'::"text")))));



CREATE POLICY "Users can insert rooms" ON "public"."rooms" FOR INSERT WITH CHECK (("creator_id" = "auth"."uid"()));



CREATE POLICY "Users can insert sociales" ON "public"."sociales" FOR INSERT WITH CHECK ((("created_by" = "auth"."uid"()) OR ("room_id" IN ( SELECT "room_memberships"."room_id"
   FROM "public"."room_memberships"
  WHERE (("room_memberships"."user_id" = "auth"."uid"()) AND ("room_memberships"."is_banned" = false) AND (("room_memberships"."status")::"text" = ANY ((ARRAY['active'::character varying, 'approved'::character varying])::"text"[])) AND ("room_memberships"."is_host" = true))))));



CREATE POLICY "Users can insert their own submissions" ON "public"."audience_submissions" FOR INSERT WITH CHECK (("membership_id" IN ( SELECT "room_memberships"."id"
   FROM "public"."room_memberships"
  WHERE ("room_memberships"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can insert their own votes" ON "public"."vibox_votes" FOR INSERT WITH CHECK (("membership_id" IN ( SELECT "room_memberships"."id"
   FROM "public"."room_memberships"
  WHERE ("room_memberships"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can join rooms" ON "public"."room_memberships" FOR INSERT WITH CHECK (((NOT "is_banned") AND (("user_id" = "auth"."uid"()) OR ("user_id" IS NULL))));



CREATE POLICY "Users can leave rooms" ON "public"."room_memberships" FOR DELETE USING ((("user_id" = "auth"."uid"()) AND (NOT "is_host")));



CREATE POLICY "Users can manage their own socialite" ON "public"."socialites" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can read interactions in their room" ON "public"."interactions" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can read own blocks" ON "public"."player_blocks" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."room_memberships" "rm"
  WHERE (("rm"."id" = "player_blocks"."blocker_membership_id") AND ("rm"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update own interactions" ON "public"."interactions" FOR UPDATE USING (("created_by" = "auth"."uid"())) WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Users can update own memberships" ON "public"."room_memberships" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own responses" ON "public"."responses" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."interactions" "i"
     JOIN "public"."room_memberships" "rm" ON (("rm"."room_id" = "i"."room_id")))
  WHERE (("rm"."id" = "responses"."membership_id") AND ("rm"."user_id" = "auth"."uid"()) AND ("rm"."is_banned" = false) AND ("i"."id" = "responses"."interaction_id") AND ("i"."status" = 'active'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."interactions" "i"
     JOIN "public"."room_memberships" "rm" ON (("rm"."room_id" = "i"."room_id")))
  WHERE (("rm"."id" = "responses"."membership_id") AND ("rm"."user_id" = "auth"."uid"()) AND ("rm"."is_banned" = false) AND ("i"."id" = "responses"."interaction_id") AND ("i"."status" = 'active'::"text")))));



CREATE POLICY "Users can update own venue account" ON "public"."venue_accounts" FOR UPDATE USING ((("auth"."uid"())::"text" = "auth_user_id"));



CREATE POLICY "Users can update rooms they created" ON "public"."rooms" FOR UPDATE USING (("creator_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own membership" ON "public"."room_memberships" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own messages" ON "public"."room_messages" FOR UPDATE USING ((("user_id" = "auth"."uid"()) OR ("room_id" IN ( SELECT "room_memberships"."room_id"
   FROM "public"."room_memberships"
  WHERE (("room_memberships"."user_id" = "auth"."uid"()) AND ("room_memberships"."is_banned" = false) AND (("room_memberships"."status")::"text" = ANY ((ARRAY['active'::character varying, 'approved'::character varying])::"text"[])) AND ("room_memberships"."is_host" = true))))));



CREATE POLICY "Users can update their own sociales" ON "public"."sociales" FOR UPDATE USING ((("created_by" = "auth"."uid"()) OR ("room_id" IN ( SELECT "room_memberships"."room_id"
   FROM "public"."room_memberships"
  WHERE (("room_memberships"."user_id" = "auth"."uid"()) AND ("room_memberships"."is_banned" = false) AND (("room_memberships"."status")::"text" = ANY ((ARRAY['active'::character varying, 'approved'::character varying])::"text"[])) AND ("room_memberships"."is_host" = true))))));



CREATE POLICY "Users can update their own submissions" ON "public"."audience_submissions" FOR UPDATE USING (("membership_id" IN ( SELECT "room_memberships"."id"
   FROM "public"."room_memberships"
  WHERE ("room_memberships"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update their own votes" ON "public"."vibox_votes" FOR UPDATE USING (("membership_id" IN ( SELECT "room_memberships"."id"
   FROM "public"."room_memberships"
  WHERE ("room_memberships"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view messages in their rooms" ON "public"."room_messages" FOR SELECT USING (("room_id" IN ( SELECT "room_memberships"."room_id"
   FROM "public"."room_memberships"
  WHERE (("room_memberships"."user_id" = "auth"."uid"()) AND ("room_memberships"."is_banned" = false) AND (("room_memberships"."status")::"text" = ANY ((ARRAY['active'::character varying, 'approved'::character varying])::"text"[]))))));



CREATE POLICY "Users can view own memberships" ON "public"."room_memberships" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own venue account" ON "public"."venue_accounts" FOR SELECT USING ((("auth"."uid"())::"text" = "auth_user_id"));



CREATE POLICY "Users can view queue in their room" ON "public"."vibox_queue" FOR SELECT USING (("room_id" IN ( SELECT "room_memberships"."room_id"
   FROM "public"."room_memberships"
  WHERE ("room_memberships"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view responses" ON "public"."responses" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."interactions" "i"
     JOIN "public"."room_memberships" "rm" ON (("rm"."room_id" = "i"."room_id")))
  WHERE (("i"."id" = "responses"."interaction_id") AND ("rm"."user_id" = "auth"."uid"()) AND ("rm"."is_banned" = false)))));



CREATE POLICY "Users can view rooms they created" ON "public"."rooms" FOR SELECT USING (("creator_id" = "auth"."uid"()));



CREATE POLICY "Users can view submissions in their room" ON "public"."audience_submissions" FOR SELECT USING (("room_id" IN ( SELECT "room_memberships"."room_id"
   FROM "public"."room_memberships"
  WHERE ("room_memberships"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view votes in their room" ON "public"."vibox_votes" FOR SELECT USING (("room_id" IN ( SELECT "room_memberships"."room_id"
   FROM "public"."room_memberships"
  WHERE ("room_memberships"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."ambient_packs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ambient_packs_read" ON "public"."ambient_packs" FOR SELECT USING (true);



CREATE POLICY "ambient_packs_write" ON "public"."ambient_packs" USING (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."ambient_rounds" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ambient_rounds_read" ON "public"."ambient_rounds" FOR SELECT USING (true);



CREATE POLICY "ambient_rounds_write" ON "public"."ambient_rounds" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "banter_insert" ON "public"."sociale_banter" FOR INSERT WITH CHECK (true);



CREATE POLICY "banter_read" ON "public"."sociale_banter" FOR SELECT USING (true);



CREATE POLICY "banter_update" ON "public"."sociale_banter" FOR UPDATE USING (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."interaction_votes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."player_accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."player_blocks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."responses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."room_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sociale_analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sociale_banter" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sociale_banter_upvotes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sociale_responses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sociale_round_state" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sociale_rounds" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sociale_score_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sociale_votes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trivia_evaluations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "trivia_evaluations_read" ON "public"."trivia_evaluations" FOR SELECT USING (("room_id" IN ( SELECT "room_memberships"."room_id"
   FROM "public"."room_memberships"
  WHERE ("room_memberships"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."trivia_question_aliases" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "trivia_question_aliases_read" ON "public"."trivia_question_aliases" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."trivia_questions"
  WHERE (("trivia_questions"."id" = "trivia_question_aliases"."question_id") AND (("trivia_questions"."status" = 'published'::"text") OR ("trivia_questions"."created_by" = "auth"."uid"()))))));



CREATE POLICY "trivia_question_aliases_write" ON "public"."trivia_question_aliases" USING ((EXISTS ( SELECT 1
   FROM "public"."trivia_questions"
  WHERE (("trivia_questions"."id" = "trivia_question_aliases"."question_id") AND ("trivia_questions"."created_by" = "auth"."uid"())))));



ALTER TABLE "public"."trivia_question_options" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "trivia_question_options_read" ON "public"."trivia_question_options" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."trivia_questions"
  WHERE (("trivia_questions"."id" = "trivia_question_options"."question_id") AND (("trivia_questions"."status" = 'published'::"text") OR ("trivia_questions"."created_by" = "auth"."uid"()))))));



CREATE POLICY "trivia_question_options_write" ON "public"."trivia_question_options" USING ((EXISTS ( SELECT 1
   FROM "public"."trivia_questions"
  WHERE (("trivia_questions"."id" = "trivia_question_options"."question_id") AND ("trivia_questions"."created_by" = "auth"."uid"())))));



ALTER TABLE "public"."trivia_question_packs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "trivia_question_packs_read" ON "public"."trivia_question_packs" FOR SELECT USING ((("status" = 'published'::"text") OR ("created_by" = "auth"."uid"())));



CREATE POLICY "trivia_question_packs_write" ON "public"."trivia_question_packs" USING (("created_by" = "auth"."uid"()));



ALTER TABLE "public"."trivia_questions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "trivia_questions_read" ON "public"."trivia_questions" FOR SELECT USING ((("status" = 'published'::"text") OR ("created_by" = "auth"."uid"())));



CREATE POLICY "trivia_questions_write" ON "public"."trivia_questions" USING (("created_by" = "auth"."uid"()));



ALTER TABLE "public"."trivia_submissions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "trivia_submissions_read" ON "public"."trivia_submissions" FOR SELECT USING (("room_id" IN ( SELECT "room_memberships"."room_id"
   FROM "public"."room_memberships"
  WHERE ("room_memberships"."user_id" = "auth"."uid"()))));



CREATE POLICY "trivia_submissions_write" ON "public"."trivia_submissions" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "upvote_insert" ON "public"."sociale_banter_upvotes" FOR INSERT WITH CHECK (true);



CREATE POLICY "upvote_read" ON "public"."sociale_banter_upvotes" FOR SELECT USING (true);



ALTER TABLE "public"."venue_accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vibox_queue" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vibox_votes" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."activate_pending_socialites_on_round_advance"() TO "anon";
GRANT ALL ON FUNCTION "public"."activate_pending_socialites_on_round_advance"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."activate_pending_socialites_on_round_advance"() TO "service_role";



GRANT ALL ON FUNCTION "public"."advance_interaction_to_voting"("p_interaction_id" "uuid", "p_voting_seconds" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."advance_interaction_to_voting"("p_interaction_id" "uuid", "p_voting_seconds" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."advance_interaction_to_voting"("p_interaction_id" "uuid", "p_voting_seconds" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."advance_interaction_to_voting_on_answer_timeout"() TO "anon";
GRANT ALL ON FUNCTION "public"."advance_interaction_to_voting_on_answer_timeout"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."advance_interaction_to_voting_on_answer_timeout"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_display_name_available"("p_display_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_display_name_available"("p_display_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_display_name_available"("p_display_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_room_capacity"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_room_capacity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_room_capacity"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_venue_needs_room"("p_user_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_venue_needs_room"("p_user_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_venue_needs_room"("p_user_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_guest_memberships"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_guest_memberships"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_guest_memberships"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_guest_memberships_for_room"("p_room_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_guest_memberships_for_room"("p_room_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_guest_memberships_for_room"("p_room_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_inactive_rooms"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_inactive_rooms"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_inactive_rooms"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_orphaned_player_accounts"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_orphaned_player_accounts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_orphaned_player_accounts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_player_account_on_join"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_player_account_on_join"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_player_account_on_join"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_trivia_interaction"("p_room_id" "uuid", "p_created_by" "uuid", "p_question_id" "uuid", "p_timing" "jsonb", "p_scoring" "jsonb", "p_policy" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_trivia_interaction"("p_room_id" "uuid", "p_created_by" "uuid", "p_question_id" "uuid", "p_timing" "jsonb", "p_scoring" "jsonb", "p_policy" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_trivia_interaction"("p_room_id" "uuid", "p_created_by" "uuid", "p_question_id" "uuid", "p_timing" "jsonb", "p_scoring" "jsonb", "p_policy" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."decrement_response_upvote_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."decrement_response_upvote_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrement_response_upvote_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_unique_code"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_unique_code"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_unique_code"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_room_code"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_room_code"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_room_code"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_team_codes"("num_codes" integer, "session_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_team_codes"("num_codes" integer, "session_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_team_codes"("num_codes" integer, "session_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_test_room_code"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_test_room_code"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_test_room_code"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_account_type"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_account_type"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_account_type"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_or_create_player_account"("p_user_id" "uuid", "p_display_name" "text", "p_avatar_url" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_or_create_player_account"("p_user_id" "uuid", "p_display_name" "text", "p_avatar_url" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_or_create_player_account"("p_user_id" "uuid", "p_display_name" "text", "p_avatar_url" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_player_account_info"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_player_account_info"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_player_account_info"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_sociale_current_round"("p_sociale_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_sociale_current_round"("p_sociale_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_sociale_current_round"("p_sociale_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_sociale_scoreboard"("p_sociale_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_sociale_scoreboard"("p_sociale_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_sociale_scoreboard"("p_sociale_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_votes_from_db"("p_session_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_votes_from_db"("p_session_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_votes_from_db"("p_session_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_votes_from_db"("p_room_id" "uuid", "p_membership_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_votes_from_db"("p_room_id" "uuid", "p_membership_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_votes_from_db"("p_room_id" "uuid", "p_membership_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_vote_counts_from_db"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_vote_counts_from_db"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_vote_counts_from_db"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_vote_counts_from_db"("p_room_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_vote_counts_from_db"("p_room_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_vote_counts_from_db"("p_room_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."grade_trivia_submission"("p_submission_id" "uuid", "p_grader_version" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."grade_trivia_submission"("p_submission_id" "uuid", "p_grader_version" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."grade_trivia_submission"("p_submission_id" "uuid", "p_grader_version" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_interaction_response_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."increment_interaction_response_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_interaction_response_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_interaction_vote_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."increment_interaction_vote_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_interaction_vote_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_response_upvote_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."increment_response_upvote_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_response_upvote_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_room_session_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."increment_room_session_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_room_session_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_team_score"("team_id" "uuid", "score_delta" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."increment_team_score"("team_id" "uuid", "score_delta" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_team_score"("team_id" "uuid", "score_delta" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_top_comment_player_score"("player_id" "uuid", "score_delta" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."increment_top_comment_player_score"("player_id" "uuid", "score_delta" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_top_comment_player_score"("player_id" "uuid", "score_delta" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."is_player_account"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_player_account"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_player_account"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_venue_account"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_venue_account"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_venue_account"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."top_comment_sessions" TO "anon";
GRANT ALL ON TABLE "public"."top_comment_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."top_comment_sessions" TO "service_role";



GRANT ALL ON FUNCTION "public"."pause_top_comment_session_atomic"("p_session_id" "uuid", "p_pause" boolean, "p_paused_at" timestamp with time zone, "p_ends_at" timestamp with time zone, "p_total_paused_ms" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."pause_top_comment_session_atomic"("p_session_id" "uuid", "p_pause" boolean, "p_paused_at" timestamp with time zone, "p_ends_at" timestamp with time zone, "p_total_paused_ms" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."pause_top_comment_session_atomic"("p_session_id" "uuid", "p_pause" boolean, "p_paused_at" timestamp with time zone, "p_ends_at" timestamp with time zone, "p_total_paused_ms" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."remove_vote"("p_track_id" "text", "p_session_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."remove_vote"("p_track_id" "text", "p_session_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."remove_vote"("p_track_id" "text", "p_session_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."remove_vote"("p_room_id" "uuid", "p_membership_id" "uuid", "p_track_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."remove_vote"("p_room_id" "uuid", "p_membership_id" "uuid", "p_track_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."remove_vote"("p_room_id" "uuid", "p_membership_id" "uuid", "p_track_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_resolved_round_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_resolved_round_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_resolved_round_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."submit_trivia_answer"("p_interaction_id" "uuid", "p_member_id" "uuid", "p_payload" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."submit_trivia_answer"("p_interaction_id" "uuid", "p_member_id" "uuid", "p_payload" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."submit_trivia_answer"("p_interaction_id" "uuid", "p_member_id" "uuid", "p_payload" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_trivia_accepted_answers"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_trivia_accepted_answers"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_trivia_accepted_answers"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_cleanup_guests_on_room_archive"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_cleanup_guests_on_room_archive"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_cleanup_guests_on_room_archive"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_player_stats"("p_user_id" "uuid", "p_games_played" integer, "p_wins" integer, "p_points" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."update_player_stats"("p_user_id" "uuid", "p_games_played" integer, "p_wins" integer, "p_points" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_player_stats"("p_user_id" "uuid", "p_games_played" integer, "p_wins" integer, "p_points" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_sociale_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_sociale_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_sociale_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_team_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_team_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_team_activity"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_venue_room_id"("p_user_id" "text", "p_room_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."update_venue_room_id"("p_user_id" "text", "p_room_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_venue_room_id"("p_user_id" "text", "p_room_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_vote_counts"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_vote_counts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_vote_counts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_votes_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_votes_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_votes_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."vote_on_track"("p_track_id" "text", "p_session_id" "text", "p_vote_type" "text", "p_player_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."vote_on_track"("p_track_id" "text", "p_session_id" "text", "p_vote_type" "text", "p_player_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vote_on_track"("p_track_id" "text", "p_session_id" "text", "p_vote_type" "text", "p_player_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."vote_on_track"("p_room_id" "uuid", "p_membership_id" "uuid", "p_track_id" "text", "p_vote_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."vote_on_track"("p_room_id" "uuid", "p_membership_id" "uuid", "p_track_id" "text", "p_vote_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vote_on_track"("p_room_id" "uuid", "p_membership_id" "uuid", "p_track_id" "text", "p_vote_type" "text") TO "service_role";



GRANT ALL ON TABLE "public"."ambient_packs" TO "anon";
GRANT ALL ON TABLE "public"."ambient_packs" TO "authenticated";
GRANT ALL ON TABLE "public"."ambient_packs" TO "service_role";



GRANT ALL ON TABLE "public"."ambient_rounds" TO "anon";
GRANT ALL ON TABLE "public"."ambient_rounds" TO "authenticated";
GRANT ALL ON TABLE "public"."ambient_rounds" TO "service_role";



GRANT ALL ON TABLE "public"."answers" TO "anon";
GRANT ALL ON TABLE "public"."answers" TO "authenticated";
GRANT ALL ON TABLE "public"."answers" TO "service_role";



GRANT ALL ON TABLE "public"."audience_submissions" TO "anon";
GRANT ALL ON TABLE "public"."audience_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."audience_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."interaction_votes" TO "anon";
GRANT ALL ON TABLE "public"."interaction_votes" TO "authenticated";
GRANT ALL ON TABLE "public"."interaction_votes" TO "service_role";



GRANT ALL ON TABLE "public"."interactions" TO "anon";
GRANT ALL ON TABLE "public"."interactions" TO "authenticated";
GRANT ALL ON TABLE "public"."interactions" TO "service_role";



GRANT ALL ON TABLE "public"."membership_achievements" TO "anon";
GRANT ALL ON TABLE "public"."membership_achievements" TO "authenticated";
GRANT ALL ON TABLE "public"."membership_achievements" TO "service_role";



GRANT ALL ON TABLE "public"."player_accounts" TO "anon";
GRANT ALL ON TABLE "public"."player_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."player_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."player_blocks" TO "anon";
GRANT ALL ON TABLE "public"."player_blocks" TO "authenticated";
GRANT ALL ON TABLE "public"."player_blocks" TO "service_role";



GRANT ALL ON TABLE "public"."room_memberships" TO "anon";
GRANT ALL ON TABLE "public"."room_memberships" TO "authenticated";
GRANT ALL ON TABLE "public"."room_memberships" TO "service_role";



GRANT ALL ON TABLE "public"."top_comment_players" TO "anon";
GRANT ALL ON TABLE "public"."top_comment_players" TO "authenticated";
GRANT ALL ON TABLE "public"."top_comment_players" TO "service_role";



GRANT ALL ON TABLE "public"."player_engagement_view" TO "anon";
GRANT ALL ON TABLE "public"."player_engagement_view" TO "authenticated";
GRANT ALL ON TABLE "public"."player_engagement_view" TO "service_role";



GRANT ALL ON TABLE "public"."prompt_libraries" TO "anon";
GRANT ALL ON TABLE "public"."prompt_libraries" TO "authenticated";
GRANT ALL ON TABLE "public"."prompt_libraries" TO "service_role";



GRANT ALL ON TABLE "public"."prompts" TO "anon";
GRANT ALL ON TABLE "public"."prompts" TO "authenticated";
GRANT ALL ON TABLE "public"."prompts" TO "service_role";



GRANT ALL ON TABLE "public"."reports" TO "anon";
GRANT ALL ON TABLE "public"."reports" TO "authenticated";
GRANT ALL ON TABLE "public"."reports" TO "service_role";



GRANT ALL ON TABLE "public"."responses" TO "anon";
GRANT ALL ON TABLE "public"."responses" TO "authenticated";
GRANT ALL ON TABLE "public"."responses" TO "service_role";



GRANT ALL ON TABLE "public"."rooms" TO "anon";
GRANT ALL ON TABLE "public"."rooms" TO "authenticated";
GRANT ALL ON TABLE "public"."rooms" TO "service_role";



GRANT ALL ON TABLE "public"."room_analytics_view" TO "anon";
GRANT ALL ON TABLE "public"."room_analytics_view" TO "authenticated";
GRANT ALL ON TABLE "public"."room_analytics_view" TO "service_role";



GRANT ALL ON TABLE "public"."room_member_stats_view" TO "anon";
GRANT ALL ON TABLE "public"."room_member_stats_view" TO "authenticated";
GRANT ALL ON TABLE "public"."room_member_stats_view" TO "service_role";



GRANT ALL ON TABLE "public"."room_membership_stats" TO "anon";
GRANT ALL ON TABLE "public"."room_membership_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."room_membership_stats" TO "service_role";



GRANT ALL ON TABLE "public"."room_messages" TO "anon";
GRANT ALL ON TABLE "public"."room_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."room_messages" TO "service_role";



GRANT ALL ON TABLE "public"."season_standings" TO "anon";
GRANT ALL ON TABLE "public"."season_standings" TO "authenticated";
GRANT ALL ON TABLE "public"."season_standings" TO "service_role";



GRANT ALL ON TABLE "public"."seasons" TO "anon";
GRANT ALL ON TABLE "public"."seasons" TO "authenticated";
GRANT ALL ON TABLE "public"."seasons" TO "service_role";



GRANT ALL ON TABLE "public"."sociale_analytics" TO "anon";
GRANT ALL ON TABLE "public"."sociale_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."sociale_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."sociale_banter" TO "anon";
GRANT ALL ON TABLE "public"."sociale_banter" TO "authenticated";
GRANT ALL ON TABLE "public"."sociale_banter" TO "service_role";



GRANT ALL ON TABLE "public"."sociale_banter_upvotes" TO "anon";
GRANT ALL ON TABLE "public"."sociale_banter_upvotes" TO "authenticated";
GRANT ALL ON TABLE "public"."sociale_banter_upvotes" TO "service_role";



GRANT ALL ON TABLE "public"."sociale_chest_upgrades" TO "anon";
GRANT ALL ON TABLE "public"."sociale_chest_upgrades" TO "authenticated";
GRANT ALL ON TABLE "public"."sociale_chest_upgrades" TO "service_role";



GRANT ALL ON TABLE "public"."sociale_question_stats" TO "anon";
GRANT ALL ON TABLE "public"."sociale_question_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."sociale_question_stats" TO "service_role";



GRANT ALL ON TABLE "public"."sociale_responses" TO "anon";
GRANT ALL ON TABLE "public"."sociale_responses" TO "authenticated";
GRANT ALL ON TABLE "public"."sociale_responses" TO "service_role";



GRANT ALL ON TABLE "public"."sociale_round_state" TO "anon";
GRANT ALL ON TABLE "public"."sociale_round_state" TO "authenticated";
GRANT ALL ON TABLE "public"."sociale_round_state" TO "service_role";



GRANT ALL ON TABLE "public"."sociale_rounds" TO "anon";
GRANT ALL ON TABLE "public"."sociale_rounds" TO "authenticated";
GRANT ALL ON TABLE "public"."sociale_rounds" TO "service_role";



GRANT ALL ON TABLE "public"."sociale_score_events" TO "anon";
GRANT ALL ON TABLE "public"."sociale_score_events" TO "authenticated";
GRANT ALL ON TABLE "public"."sociale_score_events" TO "service_role";



GRANT ALL ON TABLE "public"."sociale_session_stats" TO "anon";
GRANT ALL ON TABLE "public"."sociale_session_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."sociale_session_stats" TO "service_role";



GRANT ALL ON TABLE "public"."sociale_votes" TO "anon";
GRANT ALL ON TABLE "public"."sociale_votes" TO "authenticated";
GRANT ALL ON TABLE "public"."sociale_votes" TO "service_role";



GRANT ALL ON TABLE "public"."sociales" TO "anon";
GRANT ALL ON TABLE "public"."sociales" TO "authenticated";
GRANT ALL ON TABLE "public"."sociales" TO "service_role";



GRANT ALL ON TABLE "public"."socialites" TO "anon";
GRANT ALL ON TABLE "public"."socialites" TO "authenticated";
GRANT ALL ON TABLE "public"."socialites" TO "service_role";



GRANT ALL ON TABLE "public"."top_comment_answers" TO "anon";
GRANT ALL ON TABLE "public"."top_comment_answers" TO "authenticated";
GRANT ALL ON TABLE "public"."top_comment_answers" TO "service_role";



GRANT ALL ON TABLE "public"."top_comment_votes" TO "anon";
GRANT ALL ON TABLE "public"."top_comment_votes" TO "authenticated";
GRANT ALL ON TABLE "public"."top_comment_votes" TO "service_role";



GRANT ALL ON TABLE "public"."trivia_evaluations" TO "anon";
GRANT ALL ON TABLE "public"."trivia_evaluations" TO "authenticated";
GRANT ALL ON TABLE "public"."trivia_evaluations" TO "service_role";



GRANT ALL ON TABLE "public"."trivia_question_aliases" TO "anon";
GRANT ALL ON TABLE "public"."trivia_question_aliases" TO "authenticated";
GRANT ALL ON TABLE "public"."trivia_question_aliases" TO "service_role";



GRANT ALL ON TABLE "public"."trivia_question_options" TO "anon";
GRANT ALL ON TABLE "public"."trivia_question_options" TO "authenticated";
GRANT ALL ON TABLE "public"."trivia_question_options" TO "service_role";



GRANT ALL ON TABLE "public"."trivia_question_packs" TO "anon";
GRANT ALL ON TABLE "public"."trivia_question_packs" TO "authenticated";
GRANT ALL ON TABLE "public"."trivia_question_packs" TO "service_role";



GRANT ALL ON TABLE "public"."trivia_questions" TO "anon";
GRANT ALL ON TABLE "public"."trivia_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."trivia_questions" TO "service_role";



GRANT ALL ON TABLE "public"."trivia_submissions" TO "anon";
GRANT ALL ON TABLE "public"."trivia_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."trivia_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."venue_accounts" TO "anon";
GRANT ALL ON TABLE "public"."venue_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."venue_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."user_account_info" TO "anon";
GRANT ALL ON TABLE "public"."user_account_info" TO "authenticated";
GRANT ALL ON TABLE "public"."user_account_info" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."venues" TO "anon";
GRANT ALL ON TABLE "public"."venues" TO "authenticated";
GRANT ALL ON TABLE "public"."venues" TO "service_role";



GRANT ALL ON TABLE "public"."vibox_queue" TO "anon";
GRANT ALL ON TABLE "public"."vibox_queue" TO "authenticated";
GRANT ALL ON TABLE "public"."vibox_queue" TO "service_role";



GRANT ALL ON TABLE "public"."vibox_votes" TO "anon";
GRANT ALL ON TABLE "public"."vibox_votes" TO "authenticated";
GRANT ALL ON TABLE "public"."vibox_votes" TO "service_role";



GRANT ALL ON TABLE "public"."votes" TO "anon";
GRANT ALL ON TABLE "public"."votes" TO "authenticated";
GRANT ALL ON TABLE "public"."votes" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







