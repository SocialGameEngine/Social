-- Cleanup removed apps: pubfeed and event-platform
-- This script removes tables, functions, and data related to deprecated apps

-- First, check what tables actually exist
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    -- Check for pubfeed tables
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'feed_comments'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE 'Dropping feed_comments table';
        DROP TABLE IF EXISTS public.feed_comments CASCADE;
    END IF;
    
    -- Check for other pubfeed tables
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'feed_comment_likes'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE 'Dropping feed_comment_likes table';
        DROP TABLE IF EXISTS public.feed_comment_likes CASCADE;
    END IF;
    
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'feed_posts'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE 'Dropping feed_posts table';
        DROP TABLE IF EXISTS public.feed_posts CASCADE;
    END IF;
    
    -- Check for event-platform tables
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'events'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE 'Dropping events table';
        DROP TABLE IF EXISTS public.events CASCADE;
    END IF;
    
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'event_attendees'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE 'Dropping event_attendees table';
        DROP TABLE IF EXISTS public.event_attendees CASCADE;
    END IF;
    
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'event_teams'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE 'Dropping event_teams table';
        DROP TABLE IF EXISTS public.event_teams CASCADE;
    END IF;
END $$;

-- Clean up interaction types related to removed apps
UPDATE public.interactions 
SET type = 'prompt' 
WHERE type IN ('feed_post', 'feed_comment', 'event_create', 'event_join');

-- Remove orphaned records in responses
DELETE FROM public.responses 
WHERE interaction_id IN (
    SELECT id FROM public.interactions 
    WHERE type IN ('feed_post', 'feed_comment', 'event_create', 'event_join')
);

-- Clean up user preferences (if users table has preferences column)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'preferences'
    ) THEN
        UPDATE public.users 
        SET preferences = preferences - 'feed_enabled' - 'event_notifications'
        WHERE preferences ? 'feed_enabled' OR preferences ? 'event_notifications';
    END IF;
END $$;

-- Drop any related functions
DROP FUNCTION IF EXISTS public.create_feed_comment CASCADE;
DROP FUNCTION IF EXISTS public.like_feed_comment CASCADE;
DROP FUNCTION IF EXISTS public.create_event CASCADE;
DROP FUNCTION IF EXISTS public.join_event CASCADE;

-- Drop any views related to removed apps
DROP VIEW IF EXISTS public.feed_analytics_view CASCADE;
DROP VIEW IF EXISTS public.event_analytics_view CASCADE;

-- Show what interaction types remain
SELECT DISTINCT type FROM public.interactions ORDER BY type;

RAISE NOTICE 'Cleanup of removed apps completed';
