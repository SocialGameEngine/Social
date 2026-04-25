-- Migration: Fix vibex_votes typo to vibox_votes throughout the system
-- This corrects the naming inconsistency from vibex_votes -> vibox_votes

-- ============================================================================
-- RENAME TABLE AND FIX REFERENCES
-- ============================================================================

-- Drop the incorrectly named table and recreate with correct name
DROP TABLE IF EXISTS public.vibex_votes CASCADE;

-- Create the correctly named vibox_votes table
CREATE TABLE IF NOT EXISTS public.vibox_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  membership_id uuid NOT NULL REFERENCES public.room_memberships(id) ON DELETE CASCADE,
  track_id text NOT NULL,
  vote_type text NOT NULL DEFAULT 'up',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(room_id, membership_id, track_id)
);

-- Create indexes for vibox_votes
CREATE INDEX IF NOT EXISTS idx_vibox_votes_room_id ON public.vibox_votes(room_id);
CREATE INDEX IF NOT EXISTS idx_vibox_votes_membership_id ON public.vibox_votes(membership_id);
CREATE INDEX IF NOT EXISTS idx_vibox_votes_track_id ON public.vibox_votes(track_id);

-- ============================================================================
-- UPDATE RPC FUNCTIONS TO USE CORRECT TABLE NAME
-- ============================================================================

-- Drop old functions and recreate with correct table name
DROP FUNCTION IF EXISTS get_user_votes_from_db(p_room_id uuid, p_membership_id uuid);
DROP FUNCTION IF EXISTS get_vote_counts_from_db(p_room_id uuid);
DROP FUNCTION IF EXISTS vote_on_track(p_room_id uuid, p_membership_id uuid, p_track_id text, p_vote_type text);
DROP FUNCTION IF EXISTS remove_vote(p_room_id uuid, p_membership_id uuid, p_track_id text);

-- Create updated get_user_votes_from_db function
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

-- Create updated get_vote_counts_from_db function
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

-- Create updated vote_on_track function
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

-- Create updated remove_vote function
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
-- UPDATE ROW LEVEL SECURITY FOR CORRECT TABLE NAME
-- ============================================================================

-- RLS for vibox_votes
ALTER TABLE public.vibox_votes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (from restore migration)
DROP POLICY IF EXISTS "Users can view votes in their room" ON public.vibox_votes;
DROP POLICY IF EXISTS "Users can insert their own votes" ON public.vibox_votes;
DROP POLICY IF EXISTS "Users can update their own votes" ON public.vibox_votes;

-- Recreate policies with correct table name
CREATE POLICY "Users can view votes in their room" ON public.vibox_votes
  FOR SELECT USING (room_id IN (
    SELECT room_id FROM public.room_memberships 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own votes" ON public.vibox_votes
  FOR INSERT WITH CHECK (membership_id IN (
    SELECT id FROM public.room_memberships 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own votes" ON public.vibox_votes
  FOR UPDATE USING (membership_id IN (
    SELECT id FROM public.room_memberships 
    WHERE user_id = auth.uid()
  ));

-- ============================================================================
-- COMPLETION LOG
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'VIBEX_VOTES TYPO CORRECTED TO VIBOX_VOTES';
    RAISE NOTICE 'Table, indexes, RPC functions, and RLS policies updated';
    RAISE NOTICE 'All references now use correct naming: vibox_votes';
END $$;
