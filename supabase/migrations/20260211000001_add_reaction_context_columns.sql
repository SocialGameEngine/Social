-- Add context columns to room_reactions table
ALTER TABLE public.room_reactions 
ADD COLUMN IF NOT EXISTS context_type text NOT NULL DEFAULT 'general',
ADD COLUMN IF NOT EXISTS context_id text;
