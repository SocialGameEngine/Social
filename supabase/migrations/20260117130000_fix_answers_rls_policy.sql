-- Fix the answers RLS policy to allow updates
-- This ensures the resubmission feature works properly

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Teams can submit answers" ON answers;
DROP POLICY IF EXISTS "Teams can submit and update answers" ON answers;

-- Create new policy that allows both insert and update
-- Only create if it doesn't already exist
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
              AND teams.uid = COALESCE(auth.uid()::text, teams.uid)
            )
          )
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM teams
              WHERE teams.id = answers.team_id
              AND teams.uid = COALESCE(auth.uid()::text, teams.uid)
            )
          );
    END IF;
END $$;
