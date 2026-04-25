-- Create interaction_votes table
CREATE TABLE IF NOT EXISTS public.interaction_votes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    interaction_id uuid NOT NULL REFERENCES public.interactions(id) ON DELETE CASCADE,
    membership_id uuid NOT NULL REFERENCES public.room_memberships(id) ON DELETE CASCADE,
    response_id uuid NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    
    -- Unique constraint to prevent duplicate votes
    CONSTRAINT unique_interaction_membership_vote 
        UNIQUE (interaction_id, membership_id)
);

-- Indexes for performance
CREATE INDEX idx_interaction_votes_interaction_id 
    ON public.interaction_votes(interaction_id);
CREATE INDEX idx_interaction_votes_membership_id 
    ON public.interaction_votes(membership_id);
CREATE INDEX idx_interaction_votes_response_id 
    ON public.interaction_votes(response_id);

-- Enable RLS
ALTER TABLE public.interaction_votes ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Allow read access to interaction votes" 
    ON public.interaction_votes FOR SELECT 
    USING (true);

CREATE POLICY "Allow insert/update of own votes" 
    ON public.interaction_votes FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.interaction_votes;
