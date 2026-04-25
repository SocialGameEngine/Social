-- Add current_sociale_id column to rooms table for Sessions -> Sociales flow parity
-- This column mirrors current_session_id and provides room pointer management for Sociales

-- Add the column with foreign key constraint (only if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'rooms' 
    AND column_name = 'current_sociale_id'
  ) THEN
    ALTER TABLE public.rooms 
    ADD COLUMN current_sociale_id uuid REFERENCES public.sociales(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_rooms_current_sociale_id ON public.rooms(current_sociale_id);

-- Add comment for documentation
COMMENT ON COLUMN public.rooms.current_sociale_id IS 'Pointer to the currently active Sociale in this room (mirrors current_session_id for Sessions)';