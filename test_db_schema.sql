-- Test SQL to check current constraints and apply updates
-- Run this in the Supabase SQL Editor

-- 1. Check current constraints
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.interactions'::regclass;

-- 2. Update type constraint to include headline_fibbage
ALTER TABLE public.interactions 
  DROP CONSTRAINT IF EXISTS interactions_type_check,
  ADD CONSTRAINT interactions_type_check 
    CHECK (type IN ('prompt', 'headline_fibbage'));

-- 3. Update status constraint to include voting and results
ALTER TABLE public.interactions 
  DROP CONSTRAINT IF EXISTS interactions_status_check,
  ADD CONSTRAINT interactions_status_check 
    CHECK (status IN ('active', 'voting', 'results', 'closed'));

-- 4. Add new columns for headline fibbage timing
ALTER TABLE public.interactions 
  ADD COLUMN IF NOT EXISTS answer_seconds integer,
  ADD COLUMN IF NOT EXISTS answer_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS voting_seconds integer,
  ADD COLUMN IF NOT EXISTS voting_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS vote_count integer DEFAULT 0;

-- 5. Create interaction_votes table if it doesn't exist
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

-- 6. Enable RLS for interaction_votes
ALTER TABLE public.interaction_votes ENABLE ROW LEVEL SECURITY;

-- 7. Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.interaction_votes;

-- 8. Create vote counting function and trigger
CREATE OR REPLACE FUNCTION public.increment_interaction_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.interactions
  SET vote_count = vote_count + 1
  WHERE id = NEW.interaction_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_increment_vote_count ON public.interaction_votes;
CREATE TRIGGER trigger_increment_vote_count
  AFTER INSERT ON public.interaction_votes
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_interaction_vote_count();

-- 9. Create RPC function for advancing to voting
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
