-- Spectator/Practice Mode Migration (P2-4)
-- Reuses existing pending_until_round_index for late joiners
-- Adds practice flag to responses/votes for ghost submissions

-- Add practice flag to responses (for ghost/spectator practice submissions)
ALTER TABLE sociale_responses
  ADD COLUMN is_practice BOOLEAN NOT NULL DEFAULT FALSE;

-- Add practice flag to votes (ghosts can vote for social proof)
ALTER TABLE sociale_votes
  ADD COLUMN is_practice BOOLEAN NOT NULL DEFAULT FALSE;

-- Note: We do NOT create a socialite_status enum (none exists).
-- Spectator is derived: socialite is spectator when
--   pending_until_round_index IS NOT NULL AND
--   pending_until_round_index > sociales.current_round_index

-- Index for practice queries
CREATE INDEX idx_responses_practice ON sociale_responses (sociale_id, is_practice);
CREATE INDEX idx_votes_practice ON sociale_votes (sociale_id, is_practice);
