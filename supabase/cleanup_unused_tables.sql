-- Cleanup unused tables - safe removal with verification
-- These tables are NOT referenced by any active apps

-- Team-based tables (deprecated architecture - NO TEAMS used)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teams') THEN
        RAISE NOTICE 'Dropping teams table (deprecated - NO TEAMS architecture)';
        DROP TABLE IF EXISTS public.teams CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_members') THEN
        RAISE NOTICE 'Dropping team_members table (deprecated - NO TEAMS architecture)';
        DROP TABLE IF EXISTS public.team_members CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_codes') THEN
        RAISE NOTICE 'Dropping team_codes table (deprecated - NO TEAMS architecture)';
        DROP TABLE IF EXISTS public.team_codes CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'banned_teams') THEN
        RAISE NOTICE 'Dropping banned_teams table (deprecated - NO TEAMS architecture)';
        DROP TABLE IF EXISTS public.banned_teams CASCADE;
    END IF;
END $$;

-- Legacy session tables (replaced by interactions system)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sessions') THEN
        RAISE NOTICE 'Dropping sessions table (legacy - replaced by interactions)';
        DROP TABLE IF EXISTS public.sessions CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'session_analytics') THEN
        RAISE NOTICE 'Dropping session_analytics table (legacy analytics)';
        DROP TABLE IF EXISTS public.session_analytics CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audience_submissions') THEN
        RAISE NOTICE 'Dropping audience_submissions table (legacy submission system)';
        DROP TABLE IF EXISTS public.audience_submissions CASCADE;
    END IF;
END $$;

-- Unused game feature tables
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'badge_definitions') THEN
        RAISE NOTICE 'Dropping badge_definitions table (no badge system implemented)';
        DROP TABLE IF EXISTS public.badge_definitions CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'player_badges') THEN
        RAISE NOTICE 'Dropping player_badges table (no badge system implemented)';
        DROP TABLE IF EXISTS public.player_badges CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'poll_votes') THEN
        RAISE NOTICE 'Dropping poll_votes table (no polling system active)';
        DROP TABLE IF EXISTS public.poll_votes CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'topic_upvotes') THEN
        RAISE NOTICE 'Dropping topic_upvotes table (no topic voting active)';
        DROP TABLE IF EXISTS public.topic_upvotes CASCADE;
    END IF;
END $$;

-- Analytics and backup tables
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'top_comment_jeopardy_backup') THEN
        RAISE NOTICE 'Dropping top_comment_jeopardy_backup table (backup table)';
        DROP TABLE IF EXISTS public.top_comment_jeopardy_backup CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'top_comment_session_analytics') THEN
        RAISE NOTICE 'Dropping top_comment_session_analytics table (legacy analytics)';
        DROP TABLE IF EXISTS public.top_comment_session_analytics CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'top_comment_banned_players') THEN
        RAISE NOTICE 'Dropping top_comment_banned_players table (duplicate of player_blocks)';
        DROP TABLE IF EXISTS public.top_comment_banned_players CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'top_comment_votes') THEN
        RAISE NOTICE 'Dropping top_comment_votes table (duplicate of votes table)';
        DROP TABLE IF EXISTS public.top_comment_votes CASCADE;
    END IF;
END $$;

-- Other unused tables
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'room_messages') THEN
        RAISE NOTICE 'Dropping room_messages table (no chat system active)';
        DROP TABLE IF EXISTS public.room_messages CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'room_reactions') THEN
        RAISE NOTICE 'Dropping room_reactions table (no reaction system active)';
        DROP TABLE IF EXISTS public.room_reactions CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'interaction_votes') THEN
        RAISE NOTICE 'Dropping interaction_votes table (duplicate functionality)';
        DROP TABLE IF EXISTS public.interaction_votes CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vibex_votes') THEN
        RAISE NOTICE 'Dropping vibex_votes table (unused voting system)';
        DROP TABLE IF EXISTS public.vibex_votes CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vibox_queue') THEN
        RAISE NOTICE 'Dropping vibox_queue table (unused queue system)';
        DROP TABLE IF EXISTS public.vibox_queue CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'venue_staff') THEN
        RAISE NOTICE 'Dropping venue_staff table (no staff management)';
        DROP TABLE IF EXISTS public.venue_staff CASCADE;
    END IF;
END $$;

-- Show remaining tables count
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public';
    
    RAISE NOTICE 'Cleanup completed. Remaining tables: %', table_count;
END $$;

-- List remaining tables for verification
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
