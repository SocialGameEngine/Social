-- Rollback the accepted_answers field addition
-- This removes the column and index that were added

-- Remove the index first
DROP INDEX IF EXISTS idx_trivia_questions_accepted_answers;

-- Remove the column
ALTER TABLE public.trivia_questions 
DROP COLUMN IF EXISTS accepted_answers;
