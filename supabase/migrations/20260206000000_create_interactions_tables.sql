-- Create interactions table (async prompts sent by host to room members)
CREATE TABLE public.interactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL,
  created_by uuid NOT NULL,
  type text NOT NULL DEFAULT 'prompt'
    CHECK (type IN ('prompt')),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'closed')),
  question text NOT NULL,
  description text,
  settings jsonb DEFAULT '{}'::jsonb,
  response_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  CONSTRAINT interactions_pkey PRIMARY KEY (id),
  CONSTRAINT interactions_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE,
  CONSTRAINT interactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

-- Index for fetching active interactions per room
CREATE INDEX idx_interactions_room_active ON public.interactions (room_id, status) WHERE status = 'active';

-- Enable RLS
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

-- RLS: Anyone in the room can read interactions
CREATE POLICY "Room members can view interactions"
  ON public.interactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.room_memberships rm
      WHERE rm.room_id = interactions.room_id
        AND rm.user_id = auth.uid()
        AND rm.is_banned = false
    )
  );

-- RLS: Only the room host can create interactions
CREATE POLICY "Room host can create interactions"
  ON public.interactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rooms r
      WHERE r.id = room_id
        AND r.host_uid = auth.uid()
    )
  );

-- RLS: Only the room host can update (close) interactions
CREATE POLICY "Room host can update interactions"
  ON public.interactions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.rooms r
      WHERE r.id = interactions.room_id
        AND r.host_uid = auth.uid()
    )
  );

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.interactions;


-- Create responses table (member responses to interactions)
CREATE TABLE public.responses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  interaction_id uuid NOT NULL,
  membership_id uuid NOT NULL,
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT responses_pkey PRIMARY KEY (id),
  CONSTRAINT responses_interaction_id_fkey FOREIGN KEY (interaction_id) REFERENCES public.interactions(id) ON DELETE CASCADE,
  CONSTRAINT responses_membership_id_fkey FOREIGN KEY (membership_id) REFERENCES public.room_memberships(id),
  CONSTRAINT responses_unique_per_interaction UNIQUE (interaction_id, membership_id)
);

-- Index for fetching responses per interaction
CREATE INDEX idx_responses_interaction ON public.responses (interaction_id);

-- Enable RLS
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;

-- RLS: Room members can view responses for interactions in their room
CREATE POLICY "Room members can view responses"
  ON public.responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.interactions i
      JOIN public.room_memberships rm ON rm.room_id = i.room_id
      WHERE i.id = responses.interaction_id
        AND rm.user_id = auth.uid()
        AND rm.is_banned = false
    )
  );

-- RLS: Members can submit their own response (one per interaction)
CREATE POLICY "Members can submit responses"
  ON public.responses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.room_memberships rm
      JOIN public.interactions i ON i.room_id = rm.room_id
      WHERE rm.id = membership_id
        AND rm.user_id = auth.uid()
        AND rm.is_banned = false
        AND i.id = interaction_id
        AND i.status = 'active'
    )
  );

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.responses;


-- Function to auto-increment response_count on interactions when a response is inserted
CREATE OR REPLACE FUNCTION public.increment_interaction_response_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.interactions
  SET response_count = response_count + 1
  WHERE id = NEW.interaction_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_increment_response_count
  AFTER INSERT ON public.responses
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_interaction_response_count();
