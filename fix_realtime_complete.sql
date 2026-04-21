-- COMPLETE REALTIME FIX
-- Run this in Supabase SQL Editor

-- Step 1: Reset ALL sociale-related tables from publication
ALTER PUBLICATION supabase_realtime DROP TABLE socialites;
ALTER PUBLICATION supabase_realtime DROP TABLE sociales;
ALTER PUBLICATION supabase_realtime DROP TABLE sociale_responses;
ALTER PUBLICATION supabase_realtime DROP TABLE sociale_votes;
ALTER PUBLICATION supabase_realtime DROP TABLE sociale_score_events;
ALTER PUBLICATION supabase_realtime DROP TABLE sociale_rounds;
ALTER PUBLICATION supabase_realtime DROP TABLE sociale_round_state;

-- Step 2: Wait 30 seconds for changes to propagate
-- (IMPORTANT: Actually wait 30 seconds here)

-- Step 3: Add all tables back to publication
ALTER PUBLICATION supabase_realtime ADD TABLE sociales;
ALTER PUBLICATION supabase_realtime ADD TABLE socialites;
ALTER PUBLICATION supabase_realtime ADD TABLE sociale_responses;
ALTER PUBLICATION supabase_realtime ADD TABLE sociale_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE sociale_score_events;
ALTER PUBLICATION supabase_realtime ADD TABLE sociale_rounds;
ALTER PUBLICATION supabase_realtime ADD TABLE sociale_round_state;

-- Step 4: Verify all tables are in publication
SELECT 
  schemaname,
  tablename,
  pubname
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename IN ('sociales', 'socialites', 'sociale_responses', 'sociale_votes', 'sociale_score_events', 'sociale_rounds', 'sociale_round_state')
ORDER BY tablename;
