-- Dual-Band Stats Migration (P2-17, P2-14)
-- Adds all-time membership stats and per-sociale session stats

-- All-time per-membership rollup (referenced by seasons too)
CREATE TABLE room_membership_stats (
  membership_id     UUID PRIMARY KEY REFERENCES room_memberships(id) ON DELETE CASCADE,
  total_score       BIGINT NOT NULL DEFAULT 0,
  games_played      INTEGER NOT NULL DEFAULT 0,
  games_won         INTEGER NOT NULL DEFAULT 0,
  best_game_score   INTEGER NOT NULL DEFAULT 0,
  best_game_at      TIMESTAMPTZ,
  current_streak    INTEGER NOT NULL DEFAULT 0,
  max_streak        INTEGER NOT NULL DEFAULT 0,
  last_played_at    TIMESTAMPTZ,
  tier              TEXT NOT NULL DEFAULT 'Bronze'
                      CHECK (tier IN ('Bronze','Silver','Gold','Diamond')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Per-sociale, per-socialite computed stats (covers anonymous socialites)
CREATE TABLE sociale_session_stats (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sociale_id           UUID NOT NULL REFERENCES sociales(id) ON DELETE CASCADE,
  socialite_id         UUID NOT NULL REFERENCES socialites(id) ON DELETE CASCADE,
  membership_id        UUID REFERENCES room_memberships(id),
  accuracy_rate        NUMERIC(5,2),
  avg_response_time_ms INTEGER,
  streak_max           INTEGER DEFAULT 0,
  fastest_answer_ms    INTEGER,
  category_king        JSONB,          -- { category, correct }
  round_scores         JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (sociale_id, socialite_id)
);

-- Index for session stats
CREATE INDEX idx_session_stats_sociale ON sociale_session_stats (sociale_id);

-- Achievements/micro-achievements table
CREATE TABLE membership_achievements (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id  UUID NOT NULL REFERENCES room_memberships(id) ON DELETE CASCADE,
  type           TEXT NOT NULL,       -- 'comeback' | 'streak_master' | ...
  context        JSONB NOT NULL,
  earned_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for achievements
CREATE INDEX idx_achievements_member ON membership_achievements (membership_id, earned_at DESC);
