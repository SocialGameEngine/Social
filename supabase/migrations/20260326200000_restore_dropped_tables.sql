-- Migration: Restore tables incorrectly dropped by cleanup migration
-- These tables are still actively used and need to be restored

-- ============================================================================
-- RESTORE VIbox VOTING AND QUEUE TABLES (ACTIVELY USED BY VIBOX)
-- ============================================================================

-- Restore vibox_votes table (used by ViboxVotingContext)
CREATE TABLE IF NOT EXISTS public.vibox_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL,
  membership_id uuid NOT NULL,
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

-- Restore vibox_queue table (used by vibox-get-queue function)
CREATE TABLE IF NOT EXISTS public.vibox_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL,
  track_id text NOT NULL,
  track_title text NOT NULL,
  track_artist text,
  track_album text,
  track_duration_ms integer,
  track_artwork_url text,
  added_by_membership_id uuid,
  position integer NOT NULL DEFAULT 0,
  is_played boolean NOT NULL DEFAULT false,
  votes integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'queued',
  played_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for vibox_queue
CREATE INDEX IF NOT EXISTS idx_vibox_queue_room_id ON public.vibox_queue(room_id);
CREATE INDEX IF NOT EXISTS idx_vibox_queue_status ON public.vibox_queue(status);
CREATE INDEX IF NOT EXISTS idx_vibox_queue_votes ON public.vibox_queue(votes DESC);
CREATE INDEX IF NOT EXISTS idx_vibox_queue_position ON public.vibox_queue(position);
CREATE INDEX IF NOT EXISTS idx_vibox_queue_is_played ON public.vibox_queue(is_played);

-- ============================================================================
-- RESTORE TOP COMMENT TABLES
-- ============================================================================

-- Restore top_comment_votes table (used by top-comment app)
CREATE TABLE IF NOT EXISTS public.top_comment_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  player_id uuid NOT NULL,
  answer_id uuid NOT NULL,
  round_index integer NOT NULL,
  group_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(player_id, round_index, group_id)
);

-- Create indexes for top_comment_votes
CREATE INDEX IF NOT EXISTS idx_top_comment_votes_session ON public.top_comment_votes(session_id);
CREATE INDEX IF NOT EXISTS idx_top_comment_votes_answer ON public.top_comment_votes(answer_id);

-- ============================================================================
-- RESTORE AUDIENCE SUBMISSIONS TABLE (USED BY QUESTION SUBMISSION FEATURE)
-- ============================================================================

-- Restore audience_submissions table (used by audience question submission feature)
CREATE TABLE IF NOT EXISTS public.audience_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL,
  membership_id uuid NOT NULL,
  question_text text NOT NULL,
  category text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'used')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  rejection_reason text,
  used_in_interaction_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for audience_submissions
CREATE INDEX IF NOT EXISTS idx_audience_submissions_room_id ON public.audience_submissions(room_id);
CREATE INDEX IF NOT EXISTS idx_audience_submissions_membership_id ON public.audience_submissions(membership_id);
CREATE INDEX IF NOT EXISTS idx_audience_submissions_status ON public.audience_submissions(status);

-- ============================================================================
-- RESTORE RPC FUNCTIONS FOR VIBEX VOTING
-- ============================================================================

-- Restore get_user_votes_from_db function
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
  FROM public.vibex_votes v
  WHERE v.room_id = p_room_id 
    AND v.membership_id = p_membership_id
  ORDER BY v.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Restore get_vote_counts_from_db function
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
  FROM public.vibex_votes v
  WHERE v.room_id = p_room_id
  GROUP BY v.track_id
  ORDER BY total_votes DESC, upvotes DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- RLS for vibox_votes
ALTER TABLE public.vibox_votes ENABLE ROW LEVEL SECURITY;

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

-- RLS for vibox_queue
ALTER TABLE public.vibox_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view queue in their room" ON public.vibox_queue
  FOR SELECT USING (room_id IN (
    SELECT room_id FROM public.room_memberships 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Room members can add to queue" ON public.vibox_queue
  FOR INSERT WITH CHECK (added_by_membership_id IN (
    SELECT id FROM public.room_memberships 
    WHERE user_id = auth.uid()
  ));

-- RLS for audience_submissions
ALTER TABLE public.audience_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view submissions in their room" ON public.audience_submissions
  FOR SELECT USING (room_id IN (
    SELECT room_id FROM public.room_memberships 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own submissions" ON public.audience_submissions
  FOR INSERT WITH CHECK (membership_id IN (
    SELECT id FROM public.room_memberships 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own submissions" ON public.audience_submissions
  FOR UPDATE USING (membership_id IN (
    SELECT id FROM public.room_memberships 
    WHERE user_id = auth.uid()
  ));

-- ============================================================================
-- COMPLETION LOG
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'RESTORATION MIGRATION COMPLETED SUCCESSFULLY';
    RAISE NOTICE 'Restored tables: vibox_votes, vibox_queue, top_comment_votes, audience_submissions';
    RAISE NOTICE 'Restored RPC functions: get_user_votes_from_db, get_vote_counts_from_db';
    RAISE NOTICE 'All indexes and RLS policies created';
    RAISE NOTICE 'Vibox voting/queue system and audience question submissions restored';
END $$;
