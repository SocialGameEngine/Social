-- =============================================================================
-- ADD ambient_round_id + resolved_round_id TO RESPONSE/VOTE/SCORE TABLES
-- =============================================================================
-- Ambient sociales store their active round in ambient_rounds, not sociale_rounds.
-- Rather than removing referential integrity, we split round identity:
--
--   round_id          → FK to sociale_rounds  (regular sociales, now nullable)
--   ambient_round_id  → FK to ambient_rounds  (ambient sociales, nullable)
--   resolved_round_id → trigger-maintained COALESCE(round_id, ambient_round_id)
--
-- A CHECK constraint ensures exactly one source is always set.
-- resolved_round_id is a real (non-generated) column so Supabase Realtime can
-- filter on it via postgres_changes.
-- =============================================================================

-- Shared trigger function
CREATE OR REPLACE FUNCTION set_resolved_round_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.resolved_round_id = COALESCE(NEW.round_id, NEW.ambient_round_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- sociale_responses
-- =============================================================================

-- round_id FK was dropped in migration 20260423000001; make it nullable.
ALTER TABLE sociale_responses
  ALTER COLUMN round_id DROP NOT NULL;

-- Add ambient source column first (needed before backfilling orphaned rows)
ALTER TABLE sociale_responses
  ADD COLUMN ambient_round_id UUID REFERENCES ambient_rounds(id);

-- Backfill: rows where round_id references ambient_rounds (not sociale_rounds)
-- were inserted while the FK was dropped. Move those IDs to ambient_round_id.
UPDATE sociale_responses sr
SET
  ambient_round_id = sr.round_id,
  round_id         = NULL
WHERE NOT EXISTS (
  SELECT 1 FROM sociale_rounds WHERE id = sr.round_id
);

-- Now safe to restore the FK — all remaining round_id values are in sociale_rounds.
ALTER TABLE sociale_responses
  ADD CONSTRAINT sociale_responses_round_id_fkey
    FOREIGN KEY (round_id) REFERENCES sociale_rounds(id) ON DELETE CASCADE;

-- Add resolved column
ALTER TABLE sociale_responses
  ADD COLUMN resolved_round_id UUID;

-- Backfill existing rows
UPDATE sociale_responses SET resolved_round_id = round_id;

-- Integrity: one source must always be set
ALTER TABLE sociale_responses
  ADD CONSTRAINT sociale_responses_round_source_check
    CHECK (round_id IS NOT NULL OR ambient_round_id IS NOT NULL);

-- Trigger to keep resolved_round_id current
CREATE TRIGGER sociale_responses_set_resolved_round_id
  BEFORE INSERT OR UPDATE ON sociale_responses
  FOR EACH ROW EXECUTE FUNCTION set_resolved_round_id();

CREATE INDEX idx_sociale_responses_resolved_round_id
  ON sociale_responses(resolved_round_id);

-- =============================================================================
-- sociale_votes
-- =============================================================================

-- Drop the existing unique constraint that includes round_id (will recreate on resolved column)
ALTER TABLE sociale_votes
  DROP CONSTRAINT IF EXISTS sociale_votes_round_id_socialite_id_key;

-- Make round_id nullable and restore FK
ALTER TABLE sociale_votes
  ALTER COLUMN round_id DROP NOT NULL;

-- Add ambient source column
ALTER TABLE sociale_votes
  ADD COLUMN ambient_round_id UUID REFERENCES ambient_rounds(id);

-- Add resolved column
ALTER TABLE sociale_votes
  ADD COLUMN resolved_round_id UUID;

-- Backfill
UPDATE sociale_votes SET resolved_round_id = round_id;

-- Integrity check
ALTER TABLE sociale_votes
  ADD CONSTRAINT sociale_votes_round_source_check
    CHECK (round_id IS NOT NULL OR ambient_round_id IS NOT NULL);

-- Trigger
CREATE TRIGGER sociale_votes_set_resolved_round_id
  BEFORE INSERT OR UPDATE ON sociale_votes
  FOR EACH ROW EXECUTE FUNCTION set_resolved_round_id();

CREATE INDEX idx_sociale_votes_resolved_round_id
  ON sociale_votes(resolved_round_id);

-- Restore uniqueness on the resolved column (one vote per socialite per round)
ALTER TABLE sociale_votes
  ADD CONSTRAINT sociale_votes_resolved_round_id_socialite_id_key
    UNIQUE(resolved_round_id, socialite_id);

-- =============================================================================
-- sociale_score_events
-- =============================================================================
-- round_id is already nullable here; just add the ambient column + resolved.

ALTER TABLE sociale_score_events
  ADD COLUMN ambient_round_id UUID REFERENCES ambient_rounds(id);

ALTER TABLE sociale_score_events
  ADD COLUMN resolved_round_id UUID;

UPDATE sociale_score_events SET resolved_round_id = round_id;

CREATE TRIGGER sociale_score_events_set_resolved_round_id
  BEFORE INSERT OR UPDATE ON sociale_score_events
  FOR EACH ROW EXECUTE FUNCTION set_resolved_round_id();

CREATE INDEX idx_sociale_score_events_resolved_round_id
  ON sociale_score_events(resolved_round_id);
