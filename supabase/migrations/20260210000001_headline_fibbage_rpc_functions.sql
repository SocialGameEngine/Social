-- RPC function to get voting options for headline fibbage
-- Returns shuffled options including real answer and lies, excluding player's own lie
CREATE OR REPLACE FUNCTION public.get_headline_voting_options(
  p_interaction_id uuid,
  p_membership_id uuid
)
RETURNS TABLE (
  id uuid,
  text text,
  is_real_answer boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room_id uuid;
  v_real_answer text;
  v_settings jsonb;
BEGIN
  -- Get interaction details and verify permissions
  SELECT i.room_id, i.settings
  INTO v_room_id, v_settings
  FROM public.interactions i
  WHERE i.id = p_interaction_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Interaction not found';
  END IF;
  
  -- Check if user is a member of the room
  IF NOT EXISTS (
    SELECT 1 FROM public.room_memberships rm
    WHERE rm.id = p_membership_id
      AND rm.room_id = v_room_id
      AND rm.is_banned = false
  ) THEN
    RAISE EXCEPTION 'User is not a member of this room';
  END IF;
  
  -- Get the real answer from settings
  v_real_answer := (v_settings->>'realAnswer')::text;
  
  IF v_real_answer IS NULL OR v_real_answer = '' THEN
    RAISE EXCEPTION 'Real answer not found in interaction settings';
  END IF;
  
  -- Return shuffled voting options
  RETURN QUERY
  WITH all_options AS (
    -- Real answer
    SELECT 
      gen_random_uuid() as id,
      v_real_answer as text,
      true as is_real_answer
    
    UNION ALL
    
    -- All lies except the player's own lie
    SELECT 
      gen_random_uuid() as id,
      r.text,
      false as is_real_answer
    FROM public.responses r
    WHERE r.interaction_id = p_interaction_id
      AND r.membership_id != p_membership_id
  )
  SELECT 
    id,
    text,
    is_real_answer
  FROM all_options
  ORDER BY random();
END;
$$;

-- RPC function to get headline fibbage results
-- Returns real answer, vote counts, and player scores
CREATE OR REPLACE FUNCTION public.get_headline_results(
  p_interaction_id uuid,
  p_membership_id uuid
)
RETURNS TABLE (
  real_answer text,
  vote_results jsonb,
  player_score integer,
  player_voted_for_real boolean,
  player_submitted_lie text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room_id uuid;
  v_settings jsonb;
  v_real_answer text;
  v_player_lie text;
  v_player_vote_response_id uuid;
  v_player_voted_for_real boolean;
  v_player_score integer;
BEGIN
  -- Get interaction details and verify permissions
  SELECT i.room_id, i.settings
  INTO v_room_id, v_settings
  FROM public.interactions i
  WHERE i.id = p_interaction_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Interaction not found';
  END IF;
  
  -- Check if user is a member of the room
  IF NOT EXISTS (
    SELECT 1 FROM public.room_memberships rm
    WHERE rm.id = p_membership_id
      AND rm.room_id = v_room_id
      AND rm.is_banned = false
  ) THEN
    RAISE EXCEPTION 'User is not a member of this room';
  END IF;
  
  -- Get the real answer from settings
  v_real_answer := (v_settings->>'realAnswer')::text;
  
  -- Get player's submitted lie (if any)
  SELECT r.text INTO v_player_lie
  FROM public.responses r
  WHERE r.interaction_id = p_interaction_id
    AND r.membership_id = p_membership_id;
  
  -- Get player's vote (if any)
  SELECT iv.response_id INTO v_player_vote_response_id
  FROM public.interaction_votes iv
  WHERE iv.interaction_id = p_interaction_id
    AND iv.membership_id = p_membership_id;
  
  -- Determine if player voted for real answer
  SELECT EXISTS (
    SELECT 1 FROM public.responses r
    WHERE r.interaction_id = p_interaction_id
      AND r.id = v_player_vote_response_id
      AND r.text = v_real_answer
  ) INTO v_player_voted_for_real;
  
  -- Calculate player score
  -- +2 points if they submitted a lie
  -- +3 points if they voted for the real answer
  -- +1 bonus point for each person who voted for their lie
  v_player_score := 0;
  
  -- +2 points for submitting a lie
  IF v_player_lie IS NOT NULL THEN
    v_player_score := v_player_score + 2;
  END IF;
  
  -- +3 points for voting for real answer
  IF v_player_voted_for_real THEN
    v_player_score := v_player_score + 3;
  END IF;
  
  -- +1 bonus point for each vote on their lie
  IF v_player_lie IS NOT NULL THEN
    v_player_score := v_player_score + (
      SELECT COUNT(*)
      FROM public.interaction_votes iv
      JOIN public.responses r ON iv.response_id = r.id
      WHERE iv.interaction_id = p_interaction_id
        AND r.text = v_player_lie
    );
  END IF;
  
  -- Build vote results JSON
  RETURN QUERY
  SELECT 
    v_real_answer,
    (
      SELECT json_agg(
        json_build_object(
          'text', r.text,
          'votes', COUNT(iv.id),
          'isRealAnswer', (r.text = v_real_answer)
        ) ORDER BY COUNT(iv.id) DESC, r.text
      )
      FROM public.responses r
      LEFT JOIN public.interaction_votes iv ON r.id = iv.response_id
      WHERE r.interaction_id = p_interaction_id
      GROUP BY r.id, r.text
    ) as vote_results,
    v_player_score,
    v_player_voted_for_real,
    v_player_lie;
END;
$$;

-- RPC function to submit a vote for headline fibbage
CREATE OR REPLACE FUNCTION public.submit_headline_vote(
  p_interaction_id uuid,
  p_membership_id uuid,
  p_response_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room_id uuid;
  v_interaction_status text;
BEGIN
  -- Get interaction details and verify permissions
  SELECT i.room_id, i.status
  INTO v_room_id, v_interaction_status
  FROM public.interactions i
  WHERE i.id = p_interaction_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Interaction not found';
  END IF;
  
  -- Check if user is a member of the room
  IF NOT EXISTS (
    SELECT 1 FROM public.room_memberships rm
    WHERE rm.id = p_membership_id
      AND rm.room_id = v_room_id
      AND rm.is_banned = false
  ) THEN
    RAISE EXCEPTION 'User is not a member of this room';
  END IF;
  
  -- Check if interaction is in voting phase
  IF v_interaction_status != 'voting' THEN
    RAISE EXCEPTION 'Interaction is not in voting phase';
  END IF;
  
  -- Check if response belongs to this interaction
  IF NOT EXISTS (
    SELECT 1 FROM public.responses r
    WHERE r.id = p_response_id
      AND r.interaction_id = p_interaction_id
  ) THEN
    RAISE EXCEPTION 'Response does not belong to this interaction';
  END IF;
  
  -- Insert or update vote (UPSERT)
  INSERT INTO public.interaction_votes (interaction_id, membership_id, response_id)
  VALUES (p_interaction_id, p_membership_id, p_response_id)
  ON CONFLICT (interaction_id, membership_id) 
  DO UPDATE SET response_id = EXCLUDED.response_id;
  
  RETURN true;
END;
$$;
