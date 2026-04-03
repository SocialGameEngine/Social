-- FIX REALTIME BINDING MISMATCH
-- Run this in Supabase SQL Editor to fix the "mismatch between server and client bindings" error

-- Step 1: Remove socialites from publication
ALTER PUBLICATION supabase_realtime DROP TABLE socialites;

-- Step 2: Wait a moment for the change to propagate
-- (You may need to wait 10-30 seconds here)

-- Step 3: Add socialites back to publication
ALTER PUBLICATION supabase_realtime ADD TABLE socialites;

-- Step 4: Ensure REPLICA IDENTITY is FULL
ALTER TABLE socialites REPLICA IDENTITY FULL;

-- Step 5: Verify the publication includes socialites
SELECT 
  schemaname,
  tablename,
  pubname
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'socialites';
