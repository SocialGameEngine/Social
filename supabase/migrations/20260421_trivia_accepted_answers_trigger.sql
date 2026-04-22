-- Rebuilds accepted_answers on trivia_questions whenever aliases change.
-- This is the authoritative sync -- service-layer sync is belt-and-suspenders addition.

CREATE OR REPLACE FUNCTION sync_trivia_accepted_answers()
RETURNS TRIGGER AS $$
DECLARE
  target_question_id UUID;
BEGIN
  -- Handle both INSERT/UPDATE (NEW) and DELETE (OLD)
  IF TG_OP = 'DELETE' THEN
    target_question_id := OLD.question_id;
  ELSE
    target_question_id := NEW.question_id;
  END IF;

  UPDATE public.trivia_questions
  SET accepted_answers = COALESCE((
    SELECT array_agg(alias_text)
    FROM public.trivia_question_aliases
    WHERE question_id = target_question_id
  ), '{}')
  WHERE id = target_question_id;

  RETURN NULL; -- AFTER trigger, return value unused
END;
$$ LANGUAGE plpgsql;

-- Drop if exists before recreating (idempotent)
DROP TRIGGER IF EXISTS trg_sync_accepted_answers ON public.trivia_question_aliases;

CREATE TRIGGER trg_sync_accepted_answers
  AFTER INSERT OR UPDATE OR DELETE ON public.trivia_question_aliases
  FOR EACH ROW EXECUTE FUNCTION sync_trivia_accepted_answers();
