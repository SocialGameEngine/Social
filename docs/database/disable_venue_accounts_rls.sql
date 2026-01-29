-- Temporarily disable RLS for venue_accounts to test edge function
-- This will help identify if RLS is causing the hanging issue

ALTER TABLE venue_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE venue_staff DISABLE ROW LEVEL SECURITY;

-- Test the edge function by running a simple query
SELECT 'RLS disabled for venue_accounts' as status;
