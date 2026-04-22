-- =============================================================================
-- P1 BACKLOG WAVE — SCHEMA EXTENSIONS
-- =============================================================================
-- Columns, indexes, and storage bucket required by the Wave-0 foundations of
-- the P1 backlog implementation plan. One migration so all downstream waves
-- can land in parallel PRs without schema contention.
--
-- Items touched:
--   P1-12  per-question audio (MP3 upload + YouTube)
--   P1-11  final-round point multiplier
--   P1-8   drinks-break round mode
--   P1-19  predictive (family-feud) round mode
--   P1-24  moderation status on open-text responses
--   P1-13  cross-week streak on room memberships
--   P1-3   persistent device client_key on room memberships
--   P1-18  welcome-back resume via client_key
--
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. sociale_rounds: audio, multiplier, mode, predictive answer
-- -----------------------------------------------------------------------------
ALTER TABLE sociale_rounds
  ADD COLUMN IF NOT EXISTS audio_url TEXT,
  ADD COLUMN IF NOT EXISTS audio_kind TEXT CHECK (audio_kind IN ('mp3', 'youtube')),
  ADD COLUMN IF NOT EXISTS audio_start_seconds INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS point_multiplier NUMERIC NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_final_round BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS round_mode TEXT NOT NULL DEFAULT 'standard'
    CHECK (round_mode IN ('standard', 'predictive', 'break')),
  ADD COLUMN IF NOT EXISTS predictive_answer TEXT;

COMMENT ON COLUMN sociale_rounds.audio_url IS 'P1-12: MP3 URL (question-audio bucket) or YouTube video URL';
COMMENT ON COLUMN sociale_rounds.audio_kind IS 'P1-12: mp3 | youtube';
COMMENT ON COLUMN sociale_rounds.audio_start_seconds IS 'P1-12: start offset in seconds for YouTube clips';
COMMENT ON COLUMN sociale_rounds.point_multiplier IS 'P1-11: score multiplier applied when this round is scored (default 1)';
COMMENT ON COLUMN sociale_rounds.is_final_round IS 'P1-11: explicit final-round flag for scheduler/splash';
COMMENT ON COLUMN sociale_rounds.round_mode IS 'P1-8/P1-19: standard | predictive | break';
COMMENT ON COLUMN sociale_rounds.predictive_answer IS 'P1-19: host-set correct answer for predictive (family-feud) rounds';

-- -----------------------------------------------------------------------------
-- 2. sociale_responses: moderation status + reason
-- -----------------------------------------------------------------------------
ALTER TABLE sociale_responses
  ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'approved'
    CHECK (moderation_status IN ('pending', 'approved', 'scrubbed')),
  ADD COLUMN IF NOT EXISTS moderation_reason TEXT,
  ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES auth.users(id);

COMMENT ON COLUMN sociale_responses.moderation_status IS 'P1-24: pending | approved | scrubbed — controls TV visibility';
COMMENT ON COLUMN sociale_responses.moderation_reason IS 'P1-24: optional reason for scrub (profanity, off-topic, etc.)';

CREATE INDEX IF NOT EXISTS idx_sociale_responses_moderation
  ON sociale_responses(sociale_id, moderation_status);

-- -----------------------------------------------------------------------------
-- 3. room_memberships: streak + client_key
-- -----------------------------------------------------------------------------
ALTER TABLE room_memberships
  ADD COLUMN IF NOT EXISTS current_streak INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_freeze_available BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS last_visit_week DATE,
  ADD COLUMN IF NOT EXISTS client_key TEXT;

COMMENT ON COLUMN room_memberships.current_streak IS 'P1-13: weeks-in-a-row attended. Resets if >1 week missed and freeze unused.';
COMMENT ON COLUMN room_memberships.streak_freeze_available IS 'P1-13: single streak-freeze token — auto-consumed on a single missed week.';
COMMENT ON COLUMN room_memberships.last_visit_week IS 'P1-13: Monday of the ISO week the membership last attended.';
COMMENT ON COLUMN room_memberships.client_key IS 'P1-3/P1-18: anonymous device fingerprint for passwordless resume.';

CREATE INDEX IF NOT EXISTS idx_room_memberships_client_key
  ON room_memberships(room_id, client_key)
  WHERE client_key IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 4. question-audio storage bucket with host-only RLS
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'question-audio',
    'question-audio',
    TRUE,
    10485760, -- 10 MB
    ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm']
  )
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Public READ (so /tv and /room can stream the audio element directly).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'question-audio public read'
  ) THEN
    CREATE POLICY "question-audio public read"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'question-audio');
  END IF;
END $$;

-- Host-only WRITE: must be authenticated + marked is_host on at least one room.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'question-audio host insert'
  ) THEN
    CREATE POLICY "question-audio host insert"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'question-audio'
        AND EXISTS (
          SELECT 1 FROM room_memberships
          WHERE room_memberships.user_id = auth.uid()
            AND room_memberships.is_host = TRUE
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'question-audio host update'
  ) THEN
    CREATE POLICY "question-audio host update"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'question-audio'
        AND EXISTS (
          SELECT 1 FROM room_memberships
          WHERE room_memberships.user_id = auth.uid()
            AND room_memberships.is_host = TRUE
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'question-audio host delete'
  ) THEN
    CREATE POLICY "question-audio host delete"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'question-audio'
        AND EXISTS (
          SELECT 1 FROM room_memberships
          WHERE room_memberships.user_id = auth.uid()
            AND room_memberships.is_host = TRUE
        )
      );
  END IF;
END $$;
