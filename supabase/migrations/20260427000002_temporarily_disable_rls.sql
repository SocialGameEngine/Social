-- Temporarily disable RLS to test if the query works without policies
-- This is a diagnostic step to confirm RLS is the issue

ALTER TABLE rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE room_memberships DISABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    RAISE NOTICE 'RLS temporarily disabled for testing';
END $$;
