-- Disable ALL RLS policies to identify the source of recursion
-- This will help us pinpoint which table is causing the issue

-- Disable RLS on all tables that might reference room_memberships
ALTER TABLE rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE room_memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE interactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE sociales DISABLE ROW LEVEL SECURITY;
ALTER TABLE socialites DISABLE ROW LEVEL SECURITY;
ALTER TABLE audience_submissions DISABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    RAISE NOTICE 'All RLS policies disabled for debugging';
END $$;
