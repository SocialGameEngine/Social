-- Add explanation and hint columns to ambient_rounds table
-- These columns provide parity with trivia_questions table for rendering on TV/room pages

ALTER TABLE public.ambient_rounds
  ADD COLUMN IF NOT EXISTS explanation text,
  ADD COLUMN IF NOT EXISTS hint text;

-- Add comment for documentation
COMMENT ON COLUMN public.ambient_rounds.explanation IS 'Explanation shown after reveal phase (e.g., "Gold''s symbol comes from Latin ''aurum''")';
COMMENT ON COLUMN public.ambient_rounds.hint IS 'Hint shown during answer phase as a clue';
