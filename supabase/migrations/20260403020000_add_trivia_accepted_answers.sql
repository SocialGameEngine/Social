-- =============================================================================
-- ADD accepted_answers TO trivia_questions
-- =============================================================================
-- Phase 2: Trivia Data Correctness
-- Written-answer trivia must use this column for answer validation.
-- Only runs if the table exists

DO $$ 
BEGIN
  -- Check if table exists before attempting to modify it
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'trivia_questions'
  ) THEN
    -- Add the column
    ALTER TABLE public.trivia_questions
    ADD COLUMN IF NOT EXISTS accepted_answers TEXT[] DEFAULT '{}';
    
    -- Backfill from trivia_question_aliases where possible
    UPDATE public.trivia_questions tq
    SET accepted_answers = alias_agg.aliases
    FROM (
      SELECT question_id, array_agg(alias_text) AS aliases
      FROM public.trivia_question_aliases
      GROUP BY question_id
    ) alias_agg
    WHERE tq.id = alias_agg.question_id
      AND (tq.accepted_answers IS NULL OR tq.accepted_answers = '{}');
    
    -- Index for queries that filter on accepted_answers presence
    CREATE INDEX IF NOT EXISTS idx_trivia_questions_accepted_answers
    ON public.trivia_questions USING gin (accepted_answers);
  END IF;
END $$;
