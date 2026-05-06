-- Banter Channel Migration (P2-5)
-- Adds real-time chat with upvoting and moderation

CREATE TABLE sociale_banter (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sociale_id     UUID NOT NULL REFERENCES sociales(id) ON DELETE CASCADE,
  socialite_id   UUID NOT NULL REFERENCES socialites(id) ON DELETE CASCADE,
  membership_id  UUID REFERENCES room_memberships(id),
  display_name   TEXT NOT NULL,                 -- snapshot for attribution
  content        TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 280),
  status         TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','rejected','on_tv')),
  upvote_count   INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  moderated_at   TIMESTAMPTZ,
  moderated_by   UUID REFERENCES auth.users(id)
);

-- Indexes for efficient queries
CREATE INDEX idx_banter_sociale_created ON sociale_banter (sociale_id, created_at DESC);
CREATE INDEX idx_banter_status          ON sociale_banter (sociale_id, status);
CREATE INDEX idx_banter_socialite       ON sociale_banter (socialite_id, created_at DESC);

-- Upvotes table (many-to-many)
CREATE TABLE sociale_banter_upvotes (
  banter_id     UUID NOT NULL REFERENCES sociale_banter(id) ON DELETE CASCADE,
  socialite_id  UUID NOT NULL REFERENCES socialites(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (banter_id, socialite_id)
);

-- Index for upvote queries
CREATE INDEX idx_banter_upvotes_socialite ON sociale_banter_upvotes (socialite_id);

-- Enable RLS
ALTER TABLE sociale_banter ENABLE ROW LEVEL SECURITY;
ALTER TABLE sociale_banter_upvotes ENABLE ROW LEVEL SECURITY;

-- Policies for banter
CREATE POLICY banter_read   ON sociale_banter FOR SELECT USING (TRUE);
CREATE POLICY banter_insert ON sociale_banter FOR INSERT WITH CHECK (TRUE);
CREATE POLICY banter_update ON sociale_banter FOR UPDATE
  USING (auth.role() = 'service_role');

-- Policies for upvotes
CREATE POLICY upvote_read   ON sociale_banter_upvotes FOR SELECT USING (TRUE);
CREATE POLICY upvote_insert ON sociale_banter_upvotes FOR INSERT WITH CHECK (TRUE);
