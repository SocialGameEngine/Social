-- Final fix for interaction type constraint
-- This ensures all interaction types are properly allowed
-- This migration runs after all previous migrations to ensure the constraint is correct

-- Drop any existing constraint
ALTER TABLE public.interactions 
DROP CONSTRAINT IF EXISTS interactions_type_check;

-- Add the complete constraint with all types
ALTER TABLE public.interactions 
ADD CONSTRAINT interactions_type_check 
CHECK (type IN ('prompt', 'headline_fibbage', 'challenge', 'directed_reaction', 'audience_question', 'topic', 'poll'));
