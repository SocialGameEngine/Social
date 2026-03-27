-- Migration: Fix Vibox RPC functions to use room-based architecture
-- Update the RPC functions to work with room_id + membership_id instead of session_id

-- ============================================================================
-- UPDATE RPC FUNCTIONS FOR ROOM-BASED ARCHITECTURE
-- ============================================================================

-- Drop the old session-based functions
DROP FUNCTION IF EXISTS get_user_votes_from_db(p_room_id uuid, p_membership_id uuid);
DROP FUNCTION IF EXISTS get_vote_counts_from_db(p_room_id uuid);

-- Create updated get_user_votes_from_db function for room-based architecture
CREATE OR REPLACE FUNCTION get_user_votes_from_db(p_room_id uuid, p_membership_id uuid)
RETURNS TABLE (
  track_id text,
  vote_type text,
  created_at timestamptz
) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create updated get_vote_counts_from_db function for room-based architecture
CREATE OR REPLACE FUNCTION get_vote_counts_from_db(p_room_id uuid)
RETURNS TABLE (
  track_id text,
  upvotes bigint,
  downvotes bigint,
  total_votes bigint
) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a new function for voting on tracks in room-based architecture
CREATE OR REPLACE FUNCTION vote_on_track(
  p_room_id uuid,
  p_membership_id uuid, 
  p_track_id text,
  p_vote_type text
)
RETURNS void AS $$
BEGIN
  -- Insert or update vote
  INSERT INTO public.vibox_votes (room_id, membership_id, track_id, vote_type)
  VALUES (p_room_id, p_membership_id, p_track_id, p_vote_type)
  ON CONFLICT (room_id, membership_id, track_id)
  DO UPDATE SET 
    vote_type = p_vote_type,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a function to remove a vote
CREATE OR REPLACE FUNCTION remove_vote(
  p_room_id uuid,
  p_membership_id uuid,
  p_track_id text
)
RETURNS void AS $$
BEGIN
  DELETE FROM public.vibox_votes 
  WHERE room_id = p_room_id 
    AND membership_id = p_membership_id 
    AND track_id = p_track_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMPLETION LOG
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'VIBOX RPC FUNCTIONS UPDATED FOR ROOM-BASED ARCHITECTURE';
    RAISE NOTICE 'Functions now use room_id + membership_id instead of session_id';
    RAISE NOTICE 'Added vote_on_track and remove_vote functions';
END $$;
