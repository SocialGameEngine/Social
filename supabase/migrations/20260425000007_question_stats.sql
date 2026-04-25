-- Question Stats Migration (P2-13)
-- Adds per-question analytics for CSV export

CREATE TABLE sociale_question_stats (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sociale_id           UUID NOT NULL REFERENCES sociales(id) ON DELETE CASCADE,
  round_order_index    INTEGER NOT NULL,
  round_id             UUID,
  ambient_round_id     UUID,
  prompt_text          TEXT,
  correct_answer       TEXT,
  submissions_count    INTEGER NOT NULL DEFAULT 0,
  correct_count        INTEGER NOT NULL DEFAULT 0,
  avg_response_time_ms INTEGER,
  difficulty_flag      TEXT CHECK (difficulty_flag IN ('too_easy','too_hard','good')),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (sociale_id, round_order_index)
);

-- Indexes for analytics queries
CREATE INDEX idx_question_stats_sociale ON sociale_question_stats (sociale_id);
CREATE INDEX idx_question_stats_difficulty ON sociale_question_stats (difficulty_flag) WHERE difficulty_flag IS NOT NULL;
