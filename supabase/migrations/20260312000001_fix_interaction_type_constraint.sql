-- Fix interaction type constraint to include topic and poll
-- This ensures the constraint properly allows the new interaction types

ALTER TABLE public.interactions 
DROP CONSTRAINT IF EXISTS interactions_type_check;

ALTER TABLE public.interactions 
ADD CONSTRAINT interactions_type_check 
CHECK (type IN ('prompt', 'headline_fibbage', 'challenge', 'directed_reaction', 'audience_question', 'topic', 'poll'));
