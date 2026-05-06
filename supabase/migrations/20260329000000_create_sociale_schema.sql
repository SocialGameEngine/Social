-- Sociale Schema Migration
-- This creates the foundation for the Sociale system that will replace Sessions

-- =============================================================================
-- 1. SOCIALES TABLE - Main experience record
-- =============================================================================
CREATE TABLE IF NOT EXISTS sociales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  
  -- Identity / Setup
  title TEXT,
  description TEXT,
  mode TEXT NOT NULL DEFAULT 'custom' CHECK (mode IN ('topics_only', 'trivia_only', 'alternating', 'custom')),
  
  -- Lifecycle
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'lobby', 'active', 'paused', 'completed', 'cancelled')),
  
  -- Orchestration ownership
  current_round_index INTEGER,
  current_round_id UUID,
  current_phase TEXT,
  phase_started_at TIMESTAMPTZ,
  phase_ends_at TIMESTAMPTZ,
  
  -- Round sequence metadata
  total_rounds INTEGER NOT NULL DEFAULT 5,
  
  -- Host/runtime settings
  settings JSONB NOT NULL DEFAULT '{
    "answerSeconds": 90,
    "votingSeconds": 30,
    "resultsSeconds": 12,
    "revealSeconds": 15,
    "leaderboardEnabled": true,
    "autoAdvance": true,
    "showInterRoundLeaderboard": true,
    "allowLateJoin": true
  }'::jsonb,
  
  -- Scoreboard / aggregate runtime state
  scoreboard JSONB NOT NULL DEFAULT '{}'::jsonb,
  runtime_state JSONB,
  
  -- Timing
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  
  -- Migration / replacement support (nullable, no FK constraint since table may not exist)
  legacy_session_id UUID
);

-- Index for room lookup
CREATE INDEX IF NOT EXISTS idx_sociales_room_id ON sociales(room_id);
CREATE INDEX IF NOT EXISTS idx_sociales_status ON sociales(status);
CREATE INDEX IF NOT EXISTS idx_sociales_created_by ON sociales(created_by);

-- =============================================================================
-- 2. SOCIALE_ROUNDS TABLE - Round definitions
-- =============================================================================
CREATE TABLE IF NOT EXISTS sociale_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sociale_id UUID NOT NULL REFERENCES sociales(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  
  -- Round identity
  type TEXT NOT NULL CHECK (type IN ('prompt', 'trivia', 'topic', 'poll', 'custom')),
  title TEXT,
  content TEXT,
  
  -- Type-specific config (structure depends on type)
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Optional explicit phase override
  phase_sequence TEXT[],
  
  -- Bookkeeping
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(sociale_id, order_index)
);

-- Index for sociale lookup
CREATE INDEX IF NOT EXISTS idx_sociale_rounds_sociale_id ON sociale_rounds(sociale_id);

-- =============================================================================
-- 3. SOCIALE_ROUND_STATE TABLE - Mutable runtime state per round
-- =============================================================================
CREATE TABLE IF NOT EXISTS sociale_round_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sociale_id UUID NOT NULL REFERENCES sociales(id) ON DELETE CASCADE,
  round_id UUID NOT NULL REFERENCES sociale_rounds(id) ON DELETE CASCADE,
  
  -- Lifecycle
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'skipped')),
  phase TEXT NOT NULL DEFAULT 'pending',
  
  -- Timing
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  phase_started_at TIMESTAMPTZ,
  phase_ends_at TIMESTAMPTZ,
  
  -- Phase-specific end times (for complex rounds)
  answer_ends_at TIMESTAMPTZ,
  voting_ends_at TIMESTAMPTZ,
  reveal_ends_at TIMESTAMPTZ,
  results_ends_at TIMESTAMPTZ,
  
  -- Runtime-derived / round-type-specific state
  derived_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(sociale_id, round_id)
);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_sociale_round_state_sociale_id ON sociale_round_state(sociale_id);
CREATE INDEX IF NOT EXISTS idx_sociale_round_state_round_id ON sociale_round_state(round_id);

-- =============================================================================
-- 4. SOCIALITES TABLE - Participants in a Sociale
-- =============================================================================
CREATE TABLE IF NOT EXISTS socialites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sociale_id UUID NOT NULL REFERENCES sociales(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  membership_id UUID REFERENCES room_memberships(id),
  
  -- Identity shown in gameplay
  display_name TEXT NOT NULL,
  mascot_id INTEGER,
  
  -- Role / permissions
  is_host BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_banned BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Scoring / participation
  score INTEGER NOT NULL DEFAULT 0,
  
  -- Timing
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(sociale_id, membership_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_socialites_sociale_id ON socialites(sociale_id);
CREATE INDEX IF NOT EXISTS idx_socialites_user_id ON socialites(user_id);
CREATE INDEX IF NOT EXISTS idx_socialites_membership_id ON socialites(membership_id);

-- =============================================================================
-- 5. SOCIALE_RESPONSES TABLE - Submissions for rounds
-- =============================================================================
CREATE TABLE IF NOT EXISTS sociale_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sociale_id UUID NOT NULL REFERENCES sociales(id) ON DELETE CASCADE,
  round_id UUID NOT NULL REFERENCES sociale_rounds(id) ON DELETE CASCADE,
  socialite_id UUID NOT NULL REFERENCES socialites(id) ON DELETE CASCADE,
  
  -- Response data (flexible for different round types)
  type TEXT NOT NULL,
  value JSONB NOT NULL,
  
  -- Evaluation
  is_correct BOOLEAN,
  score_awarded INTEGER,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sociale_responses_sociale_id ON sociale_responses(sociale_id);
CREATE INDEX IF NOT EXISTS idx_sociale_responses_round_id ON sociale_responses(round_id);
CREATE INDEX IF NOT EXISTS idx_sociale_responses_socialite_id ON sociale_responses(socialite_id);

-- =============================================================================
-- 6. SOCIALE_VOTES TABLE - Voting for rounds that support it
-- =============================================================================
CREATE TABLE IF NOT EXISTS sociale_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sociale_id UUID NOT NULL REFERENCES sociales(id) ON DELETE CASCADE,
  round_id UUID NOT NULL REFERENCES sociale_rounds(id) ON DELETE CASCADE,
  socialite_id UUID NOT NULL REFERENCES socialites(id) ON DELETE CASCADE,
  target_response_id UUID NOT NULL REFERENCES sociale_responses(id) ON DELETE CASCADE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- One vote per socialite per round
  UNIQUE(round_id, socialite_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sociale_votes_round_id ON sociale_votes(round_id);
CREATE INDEX IF NOT EXISTS idx_sociale_votes_socialite_id ON sociale_votes(socialite_id);

-- =============================================================================
-- 7. SOCIALE_SCORE_EVENTS TABLE - Normalized score events
-- =============================================================================
CREATE TABLE IF NOT EXISTS sociale_score_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sociale_id UUID NOT NULL REFERENCES sociales(id) ON DELETE CASCADE,
  round_id UUID REFERENCES sociale_rounds(id) ON DELETE CASCADE,
  socialite_id UUID NOT NULL REFERENCES socialites(id) ON DELETE CASCADE,
  
  reason TEXT NOT NULL,
  points INTEGER NOT NULL,
  metadata JSONB,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sociale_score_events_sociale_id ON sociale_score_events(sociale_id);
CREATE INDEX IF NOT EXISTS idx_sociale_score_events_socialite_id ON sociale_score_events(socialite_id);

-- =============================================================================
-- 8. SOCIALE_ANALYTICS TABLE - Analytics rows
-- =============================================================================
CREATE TABLE IF NOT EXISTS sociale_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sociale_id UUID NOT NULL REFERENCES sociales(id) ON DELETE CASCADE,
  round_id UUID REFERENCES sociale_rounds(id) ON DELETE CASCADE,
  
  category TEXT NOT NULL,
  metric TEXT NOT NULL,
  value JSONB NOT NULL,
  metadata JSONB,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sociale_analytics_sociale_id ON sociale_analytics(sociale_id);
CREATE INDEX IF NOT EXISTS idx_sociale_analytics_category ON sociale_analytics(category);

-- =============================================================================
-- 9. ENABLE REALTIME
-- =============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE sociales;
ALTER PUBLICATION supabase_realtime ADD TABLE sociale_rounds;
ALTER PUBLICATION supabase_realtime ADD TABLE sociale_round_state;
ALTER PUBLICATION supabase_realtime ADD TABLE socialites;
ALTER PUBLICATION supabase_realtime ADD TABLE sociale_responses;
ALTER PUBLICATION supabase_realtime ADD TABLE sociale_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE sociale_score_events;

-- =============================================================================
-- 10. ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE sociales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sociale_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE sociale_round_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE socialites ENABLE ROW LEVEL SECURITY;
ALTER TABLE sociale_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sociale_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sociale_score_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sociale_analytics ENABLE ROW LEVEL SECURITY;

-- Sociales: Room members can read, creators can write
CREATE POLICY "Room members can view sociales"
  ON sociales FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_memberships
      WHERE room_memberships.room_id = sociales.room_id
      AND room_memberships.user_id = auth.uid()
      AND room_memberships.is_banned = FALSE
    )
  );

CREATE POLICY "Creators can manage sociales"
  ON sociales FOR ALL
  USING (created_by = auth.uid());

-- Sociale rounds: Readable by room members
CREATE POLICY "Room members can view sociale rounds"
  ON sociale_rounds FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sociales
      JOIN room_memberships ON room_memberships.room_id = sociales.room_id
      WHERE sociales.id = sociale_rounds.sociale_id
      AND room_memberships.user_id = auth.uid()
      AND room_memberships.is_banned = FALSE
    )
  );

-- Socialites: Readable by room members, users can manage their own
CREATE POLICY "Room members can view socialites"
  ON socialites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_memberships
      WHERE room_memberships.room_id = socialites.room_id
      AND room_memberships.user_id = auth.uid()
      AND room_memberships.is_banned = FALSE
    )
  );

CREATE POLICY "Users can manage their own socialite"
  ON socialites FOR ALL
  USING (user_id = auth.uid());

-- Responses: Readable by room members, users can manage their own
CREATE POLICY "Room members can view responses"
  ON sociale_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM socialites
      JOIN room_memberships ON room_memberships.room_id = socialites.room_id
      WHERE socialites.id = sociale_responses.socialite_id
      AND room_memberships.user_id = auth.uid()
      AND room_memberships.is_banned = FALSE
    )
  );

CREATE POLICY "Socialites can submit responses"
  ON sociale_responses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM socialites
      WHERE socialites.id = sociale_responses.socialite_id
      AND socialites.user_id = auth.uid()
    )
  );

-- Votes: Similar pattern
CREATE POLICY "Room members can view votes"
  ON sociale_votes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM socialites
      JOIN room_memberships ON room_memberships.room_id = socialites.room_id
      WHERE socialites.id = sociale_votes.socialite_id
      AND room_memberships.user_id = auth.uid()
      AND room_memberships.is_banned = FALSE
    )
  );

CREATE POLICY "Socialites can submit votes"
  ON sociale_votes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM socialites
      WHERE socialites.id = sociale_votes.socialite_id
      AND socialites.user_id = auth.uid()
    )
  );

-- Score events: Readable by room members
CREATE POLICY "Room members can view score events"
  ON sociale_score_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM socialites
      JOIN room_memberships ON room_memberships.room_id = socialites.room_id
      WHERE socialites.id = sociale_score_events.socialite_id
      AND room_memberships.user_id = auth.uid()
      AND room_memberships.is_banned = FALSE
    )
  );

-- Round state: Readable by room members
CREATE POLICY "Room members can view round state"
  ON sociale_round_state FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sociales
      JOIN room_memberships ON room_memberships.room_id = sociales.room_id
      WHERE sociales.id = sociale_round_state.sociale_id
      AND room_memberships.user_id = auth.uid()
      AND room_memberships.is_banned = FALSE
    )
  );

-- Analytics: Readable by room members
CREATE POLICY "Room members can view analytics"
  ON sociale_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sociales
      JOIN room_memberships ON room_memberships.room_id = sociales.room_id
      WHERE sociales.id = sociale_analytics.sociale_id
      AND room_memberships.user_id = auth.uid()
      AND room_memberships.is_banned = FALSE
    )
  );

-- =============================================================================
-- 11. UPDATED_AT TRIGGERS
-- =============================================================================

-- Function for updating updated_at
CREATE OR REPLACE FUNCTION update_sociale_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER sociales_updated_at
  BEFORE UPDATE ON sociales
  FOR EACH ROW EXECUTE FUNCTION update_sociale_updated_at();

CREATE TRIGGER sociale_rounds_updated_at
  BEFORE UPDATE ON sociale_rounds
  FOR EACH ROW EXECUTE FUNCTION update_sociale_updated_at();

CREATE TRIGGER sociale_round_state_updated_at
  BEFORE UPDATE ON sociale_round_state
  FOR EACH ROW EXECUTE FUNCTION update_sociale_updated_at();

CREATE TRIGGER socialites_updated_at
  BEFORE UPDATE ON socialites
  FOR EACH ROW EXECUTE FUNCTION update_sociale_updated_at();

CREATE TRIGGER sociale_responses_updated_at
  BEFORE UPDATE ON sociale_responses
  FOR EACH ROW EXECUTE FUNCTION update_sociale_updated_at();

-- =============================================================================
-- 12. HELPER FUNCTIONS
-- =============================================================================

-- Get current round for a sociale
CREATE OR REPLACE FUNCTION get_sociale_current_round(p_sociale_id UUID)
RETURNS TABLE (
  round_id UUID,
  round_type TEXT,
  round_index INTEGER,
  phase TEXT,
  phase_ends_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sr.id,
    sr.type,
    sr.order_index,
    srs.phase,
    srs.phase_ends_at
  FROM sociales s
  JOIN sociale_rounds sr ON sr.id = s.current_round_id
  LEFT JOIN sociale_round_state srs ON srs.round_id = sr.id
  WHERE s.id = p_sociale_id;
END;
$$ LANGUAGE plpgsql;

-- Get scoreboard for a sociale
CREATE OR REPLACE FUNCTION get_sociale_scoreboard(p_sociale_id UUID)
RETURNS TABLE (
  socialite_id UUID,
  display_name TEXT,
  mascot_id INTEGER,
  score INTEGER,
  rank INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.display_name,
    s.mascot_id,
    s.score,
    RANK() OVER (ORDER BY s.score DESC)::INTEGER
  FROM socialites s
  WHERE s.sociale_id = p_sociale_id
  AND s.is_active = TRUE
  AND s.is_banned = FALSE
  ORDER BY s.score DESC;
END;
$$ LANGUAGE plpgsql;
