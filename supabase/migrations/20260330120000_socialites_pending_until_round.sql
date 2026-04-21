-- Mid-game join: player is added but only participates from this round index onward.
ALTER TABLE socialites
  ADD COLUMN IF NOT EXISTS pending_until_round_index INTEGER;

COMMENT ON COLUMN socialites.pending_until_round_index IS
  'If set, socialite is inactive until sociales.current_round_index reaches this value; cleared by trigger on sociales.current_round_index update.';

-- Activate pending socialites when the sociale advances to a new round (SECURITY DEFINER bypasses RLS).
CREATE OR REPLACE FUNCTION public.activate_pending_socialites_on_round_advance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.current_round_index IS NOT DISTINCT FROM OLD.current_round_index THEN
    RETURN NEW;
  END IF;
  IF NEW.current_round_index IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE public.socialites
  SET
    pending_until_round_index = NULL,
    is_active = TRUE,
    updated_at = NOW()
  WHERE sociale_id = NEW.id
    AND pending_until_round_index IS NOT NULL
    AND pending_until_round_index <= NEW.current_round_index;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sociales_activate_pending_socialites ON public.sociales;
CREATE TRIGGER sociales_activate_pending_socialites
  AFTER UPDATE OF current_round_index ON public.sociales
  FOR EACH ROW
  EXECUTE FUNCTION public.activate_pending_socialites_on_round_advance();
