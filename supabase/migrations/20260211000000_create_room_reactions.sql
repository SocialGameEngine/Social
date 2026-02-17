-- Create room_reactions table for live emoji reactions
CREATE TABLE IF NOT EXISTS public.room_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL,
  membership_id uuid NOT NULL,
  emoji text NOT NULL,
  context_type text NOT NULL DEFAULT 'general',
  context_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT room_reactions_pkey PRIMARY KEY (id),
  CONSTRAINT room_reactions_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE,
  CONSTRAINT room_reactions_membership_id_fkey FOREIGN KEY (membership_id) REFERENCES public.room_memberships(id) ON DELETE CASCADE
);

-- Index for fast room reaction lookups
CREATE INDEX IF NOT EXISTS idx_room_reactions_room_id_created ON public.room_reactions(room_id, created_at DESC);

-- Note: Burst detection will be handled at the application level
-- since time-based predicates in indexes must be IMMUTABLE

-- Enable RLS
ALTER TABLE public.room_reactions ENABLE ROW LEVEL SECURITY;

-- Policy: Members of the room can read reactions
CREATE POLICY "Room members can read reactions"
  ON public.room_reactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.room_memberships rm
      WHERE rm.room_id = room_reactions.room_id
        AND rm.user_id = auth.uid()
        AND rm.status = 'active'
    )
  );

-- Policy: Members of the room can insert reactions
CREATE POLICY "Room members can send reactions"
  ON public.room_reactions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.room_memberships rm
      WHERE rm.room_id = room_reactions.room_id
        AND rm.user_id = auth.uid()
        AND rm.status = 'active'
        AND rm.id = room_reactions.membership_id
    )
  );

-- Enable realtime for room_reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_reactions;
