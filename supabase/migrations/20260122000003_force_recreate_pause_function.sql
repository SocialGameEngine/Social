-- Force recreate pause_session_atomic function without updated_at

DO $$
BEGIN
  -- Drop all versions of the function
  DROP FUNCTION IF EXISTS public.pause_session_atomic(uuid, boolean, timestamptz, timestamptz, bigint);
  DROP FUNCTION IF EXISTS public.pause_session_atomic(uuid, boolean, timestamptz, timestamptz, integer);
  DROP FUNCTION IF EXISTS public.pause_session_atomic(uuid, boolean, timestamptz, timestamptz);
  
  -- Recreate with correct columns (no updated_at)
  CREATE FUNCTION public.pause_session_atomic(
    p_session_id UUID,
    p_pause BOOLEAN,
    p_paused_at TIMESTAMPTZ,
    p_ends_at TIMESTAMPTZ,
    p_total_paused_ms INTEGER DEFAULT 0
  )
  RETURNS SETOF public.sessions
  LANGUAGE plpgsql
  AS $fn$
  BEGIN
    RETURN QUERY
    UPDATE public.sessions
    SET
      paused = p_pause,
      paused_at = p_paused_at,
      ends_at = p_ends_at,
      total_paused_ms = p_total_paused_ms,
      rounds = rounds
    WHERE id = p_session_id
    RETURNING *;
  END;
  $fn$;
END;
$$;
