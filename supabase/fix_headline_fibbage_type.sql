-- Fix the type constraint to allow headline_fibbage
ALTER TABLE public.interactions 
  DROP CONSTRAINT IF EXISTS interactions_type_check,
  ADD CONSTRAINT interactions_type_check 
    CHECK (type IN ('prompt', 'headline_fibbage'));
