-- FIX REALTIME BINDING MISMATCH (Simplified)
-- Run this in Supabase SQL Editor

-- Step 1: Remove socialites from publication
ALTER PUBLICATION supabase_realtime DROP TABLE socialites;

-- Step 2: Wait a moment for the change to propagate
-- (Wait 10-30 seconds here)

-- Step 3: Add socialites back to publication
ALTER PUBLICATION supabase_realtime ADD TABLE socialites;

-- Step 4: Verify the publication includes socialites
SELECT 
  schemaname,
  tablename,
  pubname
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'socialites';
