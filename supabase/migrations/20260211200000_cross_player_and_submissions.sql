-- Phase C1: Add targeting columns to interactions table
ALTER TABLE public.interactions ADD COLUMN IF NOT EXISTS target_type text DEFAULT 'broadcast';
ALTER TABLE public.interactions ADD COLUMN IF NOT EXISTS target_membership_id uuid REFERENCES public.room_memberships(id) ON DELETE SET NULL;
ALTER TABLE public.interactions ADD COLUMN IF NOT EXISTS source_membership_id uuid REFERENCES public.room_memberships(id) ON DELETE SET NULL;
ALTER TABLE public.interactions ADD COLUMN IF NOT EXISTS challenge_status text;
ALTER TABLE public.interactions ADD COLUMN IF NOT EXISTS challenge_expires_at timestamptz;
ALTER TABLE public.interactions ADD COLUMN IF NOT EXISTS points_wager integer DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_interactions_target ON public.interactions(target_membership_id);
CREATE INDEX IF NOT EXISTS idx_interactions_source ON public.interactions(source_membership_id);
CREATE INDEX IF NOT EXISTS idx_interactions_challenge_status ON public.interactions(challenge_status);

-- Phase C2: Audience question submissions table
CREATE TABLE IF NOT EXISTS public.audience_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  membership_id uuid NOT NULL REFERENCES public.room_memberships(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  category text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES public.room_memberships(id),
  reviewed_at timestamptz,
  rejection_reason text,
  used_in_interaction_id uuid REFERENCES public.interactions(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audience_submissions_room ON public.audience_submissions(room_id);
CREATE INDEX IF NOT EXISTS idx_audience_submissions_status ON public.audience_submissions(status);

-- RLS for audience_submissions
ALTER TABLE public.audience_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Room members can submit questions"
  ON public.audience_submissions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.room_memberships rm
      WHERE rm.room_id = audience_submissions.room_id
        AND rm.user_id = auth.uid()
        AND rm.status = 'active'
    )
  );

CREATE POLICY "Room members can read submissions"
  ON public.audience_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.room_memberships rm
      WHERE rm.room_id = audience_submissions.room_id
        AND rm.user_id = auth.uid()
        AND rm.status = 'active'
    )
  );

CREATE POLICY "Room hosts can update submissions"
  ON public.audience_submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.room_memberships rm
      WHERE rm.room_id = audience_submissions.room_id
        AND rm.user_id = auth.uid()
        AND rm.is_host = true
    )
  );

-- Enable realtime for audience_submissions
ALTER PUBLICATION supabase_realtime ADD TABLE public.audience_submissions;
