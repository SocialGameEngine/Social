-- Direct fix for interaction type constraint
-- Run this directly on the database to fix the constraint issue

-- First, let's see what the current constraint looks like
SELECT conname, consrc 
FROM pg_constraint 
WHERE conrelid = 'public.interactions' 
AND conname = 'interactions_type_check';

-- Drop the existing constraint if it exists
ALTER TABLE public.interactions DROP CONSTRAINT IF EXISTS interactions_type_check;

-- Add the correct constraint that includes topic and poll
ALTER TABLE public.interactions 
ADD CONSTRAINT interactions_type_check 
CHECK (type IN ('prompt', 'headline_fibbage', 'challenge', 'directed_reaction', 'audience_question', 'topic', 'poll'));

-- Verify the constraint was added correctly
SELECT conname, consrc 
FROM pg_constraint 
WHERE conrelid = 'public.interactions' 
AND conname = 'interactions_type_check';
