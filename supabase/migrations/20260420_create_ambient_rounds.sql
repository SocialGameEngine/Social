-- ambient_rounds: shared library of rounds for ambient sociales
-- Each row is fully self-contained - all data needed to run the round lives here.
-- Ambient sociales cycle through these rows using current_round_index, looping endlessly.

CREATE TABLE IF NOT EXISTS ambient_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_index INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('trivia', 'topic')),
  title TEXT NOT NULL,
  content TEXT,
  -- settings JSONB structure mirrors SocialeRoundSettings:
  --   For trivia: { format, snapshot: { prompt, multipleChoice | writtenAnswer }, answerSeconds, revealSeconds, resultsSeconds, pointsCorrect, speedBonusEnabled }
  --   For topic:  { topic, sortBy, allowUpvotes, answerSeconds, votingSeconds, resultsSeconds }
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enforce unique ordering across the library
CREATE UNIQUE INDEX ambient_rounds_order_index_idx ON ambient_rounds (order_index);

-- Fast lookup by index (primary query pattern for the advance function)
CREATE INDEX ambient_rounds_type_idx ON ambient_rounds (type);

-- Allow the advance function (anon key) to read ambient_rounds
ALTER TABLE ambient_rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ambient_rounds_read" ON ambient_rounds
  FOR SELECT USING (true);

-- Only service role can insert/update/delete
CREATE POLICY "ambient_rounds_write" ON ambient_rounds
  FOR ALL USING (auth.role() = 'service_role');
