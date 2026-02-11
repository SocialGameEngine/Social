-- Add headline_fibbage support to interactions table
-- Update type constraint to include headline_fibbage
ALTER TABLE public.interactions 
  DROP CONSTRAINT IF EXISTS interactions_type_check,
  ADD CONSTRAINT interactions_type_check 
    CHECK (type IN ('prompt', 'headline_fibbage'));

-- Update status constraint to include voting and results phases
ALTER TABLE public.interactions 
  DROP CONSTRAINT IF EXISTS interactions_status_check,
  ADD CONSTRAINT interactions_status_check 
    CHECK (status IN ('active', 'voting', 'results', 'closed'));

-- Add new columns for headline fibbage timing
ALTER TABLE public.interactions 
  ADD COLUMN IF NOT EXISTS answer_seconds integer,
  ADD COLUMN IF NOT EXISTS answer_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS voting_seconds integer,
  ADD COLUMN IF NOT EXISTS voting_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS vote_count integer DEFAULT 0;

-- Create interaction_votes table for voting phase
CREATE TABLE IF NOT EXISTS public.interaction_votes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  interaction_id uuid NOT NULL,
  membership_id uuid NOT NULL,
  response_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT interaction_votes_pkey PRIMARY KEY (id),
  CONSTRAINT interaction_votes_interaction_id_fkey FOREIGN KEY (interaction_id) REFERENCES public.interactions(id) ON DELETE CASCADE,
  CONSTRAINT interaction_votes_membership_id_fkey FOREIGN KEY (membership_id) REFERENCES public.room_memberships(id),
  CONSTRAINT interaction_votes_response_id_fkey FOREIGN KEY (response_id) REFERENCES public.responses(id),
  CONSTRAINT interaction_votes_unique_per_interaction UNIQUE (interaction_id, membership_id)
);

-- Index for fetching votes per interaction
CREATE INDEX IF NOT EXISTS idx_interaction_votes_interaction ON public.interaction_votes(interaction_id);

-- Enable RLS for interaction_votes
ALTER TABLE public.interaction_votes ENABLE ROW LEVEL SECURITY;

-- RLS: Room members can view votes for interactions in their room
CREATE POLICY IF NOT EXISTS "Room members can view interaction votes"
  ON public.interaction_votes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.interactions i
      JOIN public.room_memberships rm ON rm.room_id = i.room_id
      WHERE i.id = interaction_votes.interaction_id
        AND rm.user_id = auth.uid()
        AND rm.is_banned = false
    )
  );

-- RLS: Members can submit their own vote (one per interaction)
CREATE POLICY IF NOT EXISTS "Members can submit interaction votes"
  ON public.interaction_votes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.room_memberships rm
      JOIN public.interactions i ON i.room_id = rm.room_id
      WHERE rm.id = membership_id
        AND rm.user_id = auth.uid()
        AND rm.is_banned = false
        AND i.id = interaction_id
        AND i.status = 'voting'
    )
  );

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.interaction_votes;

-- Function to auto-increment vote_count on interactions when a vote is inserted
CREATE OR REPLACE FUNCTION public.increment_interaction_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.interactions
  SET vote_count = vote_count + 1
  WHERE id = NEW.interaction_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for vote counting
DROP TRIGGER IF EXISTS trigger_increment_vote_count ON public.interaction_votes;
CREATE TRIGGER trigger_increment_vote_count
  AFTER INSERT ON public.interaction_votes
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_interaction_vote_count();

-- RPC function to advance interaction to voting phase
CREATE OR REPLACE FUNCTION public.advance_interaction_to_voting(
  p_interaction_id uuid,
  p_voting_seconds integer DEFAULT 300
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room_id uuid;
  v_host_uid uuid;
  v_current_status text;
BEGIN
  -- Get interaction details and verify host permissions
  SELECT i.room_id, r.host_uid, i.status
  INTO v_room_id, v_host_uid, v_current_status
  FROM public.interactions i
  JOIN public.rooms r ON r.id = i.room_id
  WHERE i.id = p_interaction_id;
  
  -- Check if interaction exists and user is host
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Interaction not found';
  END IF;
  
  IF v_host_uid != auth.uid() THEN
    RAISE EXCEPTION 'Only room host can advance interaction';
  END IF;
  
  -- Check if interaction is in active status
  IF v_current_status != 'active' THEN
    RAISE EXCEPTION 'Interaction must be in active status to advance to voting';
  END IF;
  
  -- Update interaction to voting status
  UPDATE public.interactions
  SET status = 'voting',
      voting_seconds = p_voting_seconds,
      voting_ends_at = now() + (p_voting_seconds || ' seconds')::interval
  WHERE id = p_interaction_id;
  
  RETURN true;
END;
$$;
