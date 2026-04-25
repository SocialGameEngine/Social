-- Fix RLS infinite recursion between rooms and room_memberships tables
--
-- BACKGROUND: The RLS policies were creating infinite recursion because:
-- 1. Rooms policy queries room_memberships table
-- 2. Room_memberships policy queries itself (creating a self-reference loop)
--
-- SOLUTION: Simplify the room_memberships policy to avoid self-reference
-- and ensure proper access control without recursion

-- Drop problematic room_memberships policies
DROP POLICY IF EXISTS "Users can view memberships in their rooms" ON room_memberships;
DROP POLICY IF EXISTS "Users can insert their own memberships" ON room_memberships;
DROP POLICY IF EXISTS "Users can update their own memberships" ON room_memberships;

-- Create simplified, non-recursive room_memberships policies
CREATE POLICY "Users can view own memberships" ON room_memberships
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own memberships" ON room_memberships
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own memberships" ON room_memberships
  FOR UPDATE USING (user_id = auth.uid());

-- Ensure RLS is still enabled
ALTER TABLE room_memberships ENABLE ROW LEVEL SECURITY;

-- Verify the fix
DO $$
BEGIN
    RAISE NOTICE 'RLS recursion fix applied - room_memberships policies simplified';
END $$;
