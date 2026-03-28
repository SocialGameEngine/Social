-- Migration: Remove remaining feed tables that weren't cleaned up earlier
-- These tables are from the removed pubfeed app and should not exist

-- Remove any remaining feed-related tables
DROP TABLE IF EXISTS public.feed_comment_likes CASCADE;
DROP TABLE IF EXISTS public.feed_comments CASCADE;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Remaining feed tables cleanup completed';
END $$;
