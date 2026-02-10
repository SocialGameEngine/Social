-- Create room_messages table for real-time room chat
CREATE TABLE IF NOT EXISTS public.room_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL,
  user_id uuid NOT NULL,
  membership_id uuid NOT NULL,
  display_name text NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT room_messages_pkey PRIMARY KEY (id),
  CONSTRAINT room_messages_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE,
  CONSTRAINT room_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT room_messages_membership_id_fkey FOREIGN KEY (membership_id) REFERENCES public.room_memberships(id) ON DELETE CASCADE
);

-- Index for fast room message lookups
CREATE INDEX IF NOT EXISTS idx_room_messages_room_id_created ON public.room_messages(room_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Members of the room can read messages
CREATE POLICY "Room members can read messages"
  ON public.room_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.room_memberships rm
      WHERE rm.room_id = room_messages.room_id
        AND rm.user_id = auth.uid()
        AND rm.status = 'active'
    )
  );

-- Policy: Members of the room can insert messages
CREATE POLICY "Room members can send messages"
  ON public.room_messages
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.room_memberships rm
      WHERE rm.room_id = room_messages.room_id
        AND rm.user_id = auth.uid()
        AND rm.status = 'active'
    )
  );

-- Enable realtime for room_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages;
