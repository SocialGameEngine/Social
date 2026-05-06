-- Seasonal Leagues Migration (P2-14)
-- Adds cross-venue seasonal competition system

CREATE TABLE seasons (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,           -- e.g. "April 2026"
  description  TEXT,
  starts_at    DATE NOT NULL,           -- 1st of month local
  ends_at      DATE NOT NULL,           -- last day of month
  status       TEXT NOT NULL DEFAULT 'upcoming'
                CHECK (status IN ('upcoming','active','completed')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (starts_at)
);

CREATE TABLE season_standings (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id      UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  membership_id  UUID NOT NULL REFERENCES room_memberships(id) ON DELETE CASCADE,
  total_score    BIGINT NOT NULL DEFAULT 0,
  games_played   INTEGER NOT NULL DEFAULT 0,
  games_won      INTEGER NOT NULL DEFAULT 0,
  tier           TEXT NOT NULL DEFAULT 'Bronze'
                CHECK (tier IN ('Bronze','Silver','Gold','Diamond')),
  tier_at_start  TEXT,
  final_rank     INTEGER,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (season_id, membership_id)
);

-- Indexes for season queries
CREATE INDEX idx_standings_season_score ON season_standings (season_id, total_score DESC);
CREATE INDEX idx_standings_membership ON season_standings (membership_id, season_id DESC);
CREATE INDEX idx_seasons_dates ON seasons (starts_at, ends_at);
