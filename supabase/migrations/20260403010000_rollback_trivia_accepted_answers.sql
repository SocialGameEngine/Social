-- Rollback the accepted_answers field addition
-- This removes the column and index that were added
-- Only runs if the table exists

DO $$ 
BEGIN
  -- Check if table exists before attempting to modify it
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'trivia_questions'
  ) THEN
    -- Remove the index first
    DROP INDEX IF EXISTS idx_trivia_questions_accepted_answers;
    
    -- Remove the column
    ALTER TABLE public.trivia_questions 
    DROP COLUMN IF EXISTS accepted_answers;
  END IF;
END $$;
