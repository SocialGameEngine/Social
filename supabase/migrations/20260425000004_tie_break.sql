-- Tie-Break Mode Migration (P2-7)
-- Adds fields for sudden death tie-breaking

ALTER TABLE sociales
  ADD COLUMN is_tie_break             BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN tie_break_round_number   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN tie_break_participants   UUID[] NOT NULL DEFAULT ARRAY[]::UUID[];

-- Index for tie-break queries
CREATE INDEX idx_sociales_tie_break ON sociales (id, is_tie_break) WHERE is_tie_break = TRUE;
