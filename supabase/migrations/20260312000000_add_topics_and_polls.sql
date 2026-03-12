-- Add Topics and Polls support to interactions system
-- This migration extends the existing interactions table to support two new types:
-- 1. Topics: Open-ended questions where users submit responses and upvote others
-- 2. Polls: Multiple choice questions where users vote on predefined options

-- Update interactions table to support new types
ALTER TABLE public.interactions 
DROP CONSTRAINT IF EXISTS interactions_type_check;

ALTER TABLE public.interactions 
ADD CONSTRAINT interactions_type_check 
CHECK (type IN ('prompt', 'headline_fibbage', 'challenge', 'directed_reaction', 'audience_question', 'topic', 'poll'));

-- Add poll-specific columns to interactions table
ALTER TABLE public.interactions 
ADD COLUMN IF NOT EXISTS poll_options jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS sort_by text DEFAULT 'newest' CHECK (sort_by IN ('newest', 'upvotes'));

-- Create topic_upvotes table for upvoting topic responses
CREATE TABLE IF NOT EXISTS public.topic_upvotes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  response_id uuid NOT NULL,
  membership_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT topic_upvotes_pkey PRIMARY KEY (id),
  CONSTRAINT topic_upvotes_response_id_fkey FOREIGN KEY (response_id) REFERENCES public.responses(id) ON DELETE CASCADE,
  CONSTRAINT topic_upvotes_membership_id_fkey FOREIGN KEY (membership_id) REFERENCES public.room_memberships(id) ON DELETE CASCADE,
  CONSTRAINT topic_upvotes_unique UNIQUE (response_id, membership_id)
);

-- Create index for fast upvote lookups
CREATE INDEX IF NOT EXISTS idx_topic_upvotes_response ON public.topic_upvotes(response_id);
CREATE INDEX IF NOT EXISTS idx_topic_upvotes_membership ON public.topic_upvotes(membership_id);

-- Enable RLS on topic_upvotes
ALTER TABLE public.topic_upvotes ENABLE ROW LEVEL SECURITY;

-- RLS: Room members can view upvotes for responses in their room
CREATE POLICY "Room members can view topic upvotes"
  ON public.topic_upvotes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.responses r
      JOIN public.interactions i ON i.id = r.interaction_id
      JOIN public.room_memberships rm ON rm.room_id = i.room_id
      WHERE r.id = topic_upvotes.response_id
        AND rm.user_id = auth.uid()
        AND rm.is_banned = false
    )
  );

-- RLS: Members can add their own upvotes
CREATE POLICY "Members can add topic upvotes"
  ON public.topic_upvotes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.room_memberships rm
      JOIN public.responses r ON r.interaction_id IN (
        SELECT i.id FROM public.interactions i WHERE i.room_id = rm.room_id
      )
      WHERE rm.id = membership_id
        AND rm.user_id = auth.uid()
        AND rm.is_banned = false
        AND r.id = response_id
    )
  );

-- RLS: Members can remove their own upvotes
CREATE POLICY "Members can remove their own topic upvotes"
  ON public.topic_upvotes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.room_memberships rm
      WHERE rm.id = membership_id
        AND rm.user_id = auth.uid()
    )
  );

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.topic_upvotes;

-- Create poll_votes table for poll responses
CREATE TABLE IF NOT EXISTS public.poll_votes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  interaction_id uuid NOT NULL,
  membership_id uuid NOT NULL,
  selected_option integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT poll_votes_pkey PRIMARY KEY (id),
  CONSTRAINT poll_votes_interaction_id_fkey FOREIGN KEY (interaction_id) REFERENCES public.interactions(id) ON DELETE CASCADE,
  CONSTRAINT poll_votes_membership_id_fkey FOREIGN KEY (membership_id) REFERENCES public.room_memberships(id) ON DELETE CASCADE,
  CONSTRAINT poll_votes_unique_per_interaction UNIQUE (interaction_id, membership_id)
);

-- Create indexes for fast poll vote lookups
CREATE INDEX IF NOT EXISTS idx_poll_votes_interaction ON public.poll_votes(interaction_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_membership ON public.poll_votes(membership_id);

-- Enable RLS on poll_votes
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- RLS: Room members can view poll votes for interactions in their room
CREATE POLICY "Room members can view poll votes"
  ON public.poll_votes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.interactions i
      JOIN public.room_memberships rm ON rm.room_id = i.room_id
      WHERE i.id = poll_votes.interaction_id
        AND rm.user_id = auth.uid()
        AND rm.is_banned = false
    )
  );

-- RLS: Members can submit/update their poll votes
CREATE POLICY "Members can vote on polls"
  ON public.poll_votes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.room_memberships rm
      JOIN public.interactions i ON i.room_id = rm.room_id
      WHERE rm.id = membership_id
        AND rm.user_id = auth.uid()
        AND rm.is_banned = false
        AND i.id = interaction_id
        AND i.status IN ('active', 'closed')
        AND i.type = 'poll'
    )
  );

-- RLS: Members can update their own poll votes
CREATE POLICY "Members can update their poll votes"
  ON public.poll_votes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.room_memberships rm
      WHERE rm.id = membership_id
        AND rm.user_id = auth.uid()
    )
  );

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_votes;

-- Function to auto-increment upvote count (stored in response metadata)
-- We'll track this client-side for now to avoid complex triggers

-- Add RLS policy for deleting own responses (for topics)
DROP POLICY IF EXISTS "Members can delete their own responses" ON public.responses;
CREATE POLICY "Members can delete their own responses"
  ON public.responses FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.room_memberships rm
      WHERE rm.id = membership_id
        AND rm.user_id = auth.uid()
    )
  );

-- Comment documenting the new interaction types
COMMENT ON COLUMN public.interactions.type IS 'Type of interaction: prompt (async question), headline_fibbage (fill-in-the-blank game), challenge (player vs player), directed_reaction (targeted emoji), audience_question (Q&A), topic (open discussion with upvotes), poll (multiple choice voting)';
COMMENT ON COLUMN public.interactions.poll_options IS 'For poll type: array of option strings (max 5)';
COMMENT ON COLUMN public.interactions.sort_by IS 'For topic type: how to sort responses (newest or upvotes)';
COMMENT ON TABLE public.topic_upvotes IS 'Upvotes on topic responses - users can upvote any response except their own';
COMMENT ON TABLE public.poll_votes IS 'Poll votes - users can vote on one option and change their vote';
