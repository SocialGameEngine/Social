-- Phase B1: Reports table
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  reporter_membership_id uuid NOT NULL REFERENCES public.room_memberships(id) ON DELETE CASCADE,
  reported_membership_id uuid REFERENCES public.room_memberships(id) ON DELETE SET NULL,
  content_type text NOT NULL,
  content_id uuid,
  reason text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES public.room_memberships(id),
  reviewed_at timestamptz,
  action_taken text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_room ON public.reports(room_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

-- Phase B1: Player blocks table
CREATE TABLE IF NOT EXISTS public.player_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_membership_id uuid NOT NULL REFERENCES public.room_memberships(id) ON DELETE CASCADE,
  blocked_membership_id uuid NOT NULL REFERENCES public.room_memberships(id) ON DELETE CASCADE,
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(blocker_membership_id, blocked_membership_id)
);

CREATE INDEX IF NOT EXISTS idx_player_blocks_blocker ON public.player_blocks(blocker_membership_id);

-- Phase B3: Add mute support to room_memberships
ALTER TABLE public.room_memberships ADD COLUMN IF NOT EXISTS is_muted boolean DEFAULT false;
ALTER TABLE public.room_memberships ADD COLUMN IF NOT EXISTS muted_at timestamptz;
ALTER TABLE public.room_memberships ADD COLUMN IF NOT EXISTS muted_by uuid;
ALTER TABLE public.room_memberships ADD COLUMN IF NOT EXISTS mute_expires_at timestamptz;

-- Phase B3: Add hidden/flagged support to room_messages
ALTER TABLE public.room_messages ADD COLUMN IF NOT EXISTS is_hidden boolean DEFAULT false;
ALTER TABLE public.room_messages ADD COLUMN IF NOT EXISTS hidden_by uuid;
ALTER TABLE public.room_messages ADD COLUMN IF NOT EXISTS hidden_at timestamptz;

-- RLS for reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Room members can create reports"
  ON public.reports FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.room_memberships rm
      WHERE rm.room_id = reports.room_id
        AND rm.user_id = auth.uid()
        AND rm.status = 'active'
    )
  );

CREATE POLICY "Room hosts can read reports"
  ON public.reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.room_memberships rm
      WHERE rm.room_id = reports.room_id
        AND rm.user_id = auth.uid()
        AND rm.is_host = true
    )
  );

CREATE POLICY "Reporters can read own reports"
  ON public.reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.room_memberships rm
      WHERE rm.id = reports.reporter_membership_id
        AND rm.user_id = auth.uid()
    )
  );

CREATE POLICY "Room hosts can update reports"
  ON public.reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.room_memberships rm
      WHERE rm.room_id = reports.room_id
        AND rm.user_id = auth.uid()
        AND rm.is_host = true
    )
  );

-- RLS for player_blocks
ALTER TABLE public.player_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own blocks"
  ON public.player_blocks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.room_memberships rm
      WHERE rm.id = player_blocks.blocker_membership_id
        AND rm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can read own blocks"
  ON public.player_blocks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.room_memberships rm
      WHERE rm.id = player_blocks.blocker_membership_id
        AND rm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own blocks"
  ON public.player_blocks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.room_memberships rm
      WHERE rm.id = player_blocks.blocker_membership_id
        AND rm.user_id = auth.uid()
    )
  );

-- Enable realtime for reports (host moderation panel)
ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
