ALTER TABLE sociales ADD COLUMN IF NOT EXISTS paused_remaining_seconds INTEGER DEFAULT NULL;

ALTER TABLE sociale_round_state ADD COLUMN IF NOT EXISTS paused_remaining_seconds INTEGER DEFAULT NULL;
