-- Add support for answer resubmission
-- Adds updated_at column and unique constraint to allow UPSERT operations

-- Add updated_at column to track answer modifications
ALTER TABLE answers 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Set default for existing rows (use created_at as initial value)
UPDATE answers 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Make updated_at default to NOW() for new rows
ALTER TABLE answers 
ALTER COLUMN updated_at SET DEFAULT NOW();

-- Remove duplicate answers before adding unique constraint
-- Keep the most recent answer for each (session_id, team_id, round_index) combination
DELETE FROM answers a1 USING (
    SELECT session_id, team_id, round_index, MAX(created_at) as latest_created_at
    FROM answers
    GROUP BY session_id, team_id, round_index
    HAVING COUNT(*) > 1
) a2
WHERE a1.session_id = a2.session_id 
  AND a1.team_id = a2.team_id 
  AND a1.round_index = a2.round_index
  AND a1.created_at != a2.latest_created_at;

-- Add unique constraint to enable UPSERT (one answer per team per round)
-- Skip if already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'answers_session_team_round_unique'
    ) THEN
        ALTER TABLE answers 
        ADD CONSTRAINT answers_session_team_round_unique 
        UNIQUE (session_id, team_id, round_index);
    END IF;
END $$;

-- Create index for performance on updated_at queries
CREATE INDEX IF NOT EXISTS idx_answers_updated_at ON answers(updated_at);

-- Update RLS policy to allow updates (not just inserts)
DROP POLICY IF EXISTS "Teams can submit answers" ON answers;

-- Only create policy if it doesn't already exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'answers' 
        AND policyname = 'Teams can submit and update answers'
    ) THEN
        CREATE POLICY "Teams can submit and update answers"
          ON answers FOR ALL
          TO authenticated, anon
          USING (
            EXISTS (
              SELECT 1 FROM teams
              WHERE teams.id = answers.team_id
              AND teams.uid = auth.uid()::text
            )
          )
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM teams
              WHERE teams.id = answers.team_id
              AND teams.uid = auth.uid()::text
            )
          );
    END IF;
END $$;

-- Update trigger to handle both INSERT and UPDATE
DROP TRIGGER IF EXISTS answer_updates_activity ON answers;

CREATE TRIGGER answer_updates_activity
  AFTER INSERT OR UPDATE ON answers
  FOR EACH ROW
  EXECUTE FUNCTION update_team_activity();
