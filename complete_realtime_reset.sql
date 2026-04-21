-- COMPLETE REALTIME RESET FOR SOCIALITES
-- Run this in Supabase SQL Editor to fix binding mismatch

-- Step 1: Remove ALL sociale-related tables from publication
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS socialites;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS sociales;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS sociale_responses;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS sociale_votes;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS sociale_score_events;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS sociale_rounds;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS sociale_round_state;

-- Step 2: Wait 30 seconds (IMPORTANT: actually wait 30 seconds)
-- Step 3: Add them back in the correct order
ALTER PUBLICATION supabase_realtime ADD TABLE sociales;
ALTER PUBLICATION supabase_realtime ADD TABLE socialites;
ALTER PUBLICATION supabase_realtime ADD TABLE sociale_responses;
ALTER PUBLICATION supabase_realtime ADD TABLE sociale_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE sociale_score_events;
ALTER PUBLICATION supabase_realtime ADD TABLE sociale_rounds;
ALTER PUBLICATION supabase_realtime ADD TABLE sociale_round_state;

-- Step 4: Verify all tables are properly added
SELECT 
  schemaname,
  tablename,
  pubname
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename IN ('sociales', 'socialites', 'sociale_responses', 'sociale_votes', 'sociale_score_events', 'sociale_rounds', 'sociale_round_state')
ORDER BY tablename;
