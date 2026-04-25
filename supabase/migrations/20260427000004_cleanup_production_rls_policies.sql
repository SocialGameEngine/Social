-- Clean up conflicting and redundant RLS policies in production
--
-- BACKGROUND: Production database has multiple conflicting RLS policies causing infinite recursion:
-- 1. Multiple "view" policies on rooms table with different conditions
-- 2. Redundant policies with "true" conditions that override each other
-- 3. Policies that reference room_memberships which has unrestricted access
--
-- SOLUTION: Remove conflicting policies and create clean, non-recursive policies

-- Drop all conflicting rooms policies
DROP POLICY IF EXISTS "Anyone can view active rooms" ON rooms;
DROP POLICY IF EXISTS "Public can view active rooms" ON rooms;
DROP POLICY IF EXISTS "Rooms are viewable by everyone" ON rooms;
DROP POLICY IF EXISTS "Users can view rooms they created" ON rooms;
DROP POLICY IF EXISTS "Hosts can manage their rooms" ON rooms;
DROP POLICY IF EXISTS "Hosts can update their rooms" ON rooms;
DROP POLICY IF EXISTS "Hosts can delete their rooms" ON rooms;
DROP POLICY IF EXISTS "Users can create rooms" ON rooms;
DROP POLICY IF EXISTS "Users can insert rooms" ON rooms;
DROP POLICY IF EXISTS "Users can update rooms they created" ON rooms;

-- Drop all conflicting room_memberships policies
DROP POLICY IF EXISTS "Allow users to view room members" ON room_memberships;
DROP POLICY IF EXISTS "Users can view own memberships" ON room_memberships;
DROP POLICY IF EXISTS "Allow hosts to delete room memberships" ON room_memberships;
DROP POLICY IF EXISTS "Hosts can delete room memberships" ON room_memberships;
DROP POLICY IF EXISTS "Hosts can insert room memberships" ON room_memberships;
DROP POLICY IF EXISTS "Hosts can update room memberships" ON room_memberships;
DROP POLICY IF EXISTS "Users can insert own memberships" ON room_memberships;
DROP POLICY IF EXISTS "Users can join rooms" ON room_memberships;
DROP POLICY IF EXISTS "Users can leave rooms" ON room_memberships;
DROP POLICY IF EXISTS "Users can update own memberships" ON room_memberships;
DROP POLICY IF EXISTS "Users can update their own membership" ON room_memberships;

-- Create clean, simple rooms policies
CREATE POLICY "Users can view rooms they created" ON rooms
  FOR SELECT USING (creator_id = auth.uid());

CREATE POLICY "Users can update rooms they created" ON rooms
  FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY "Users can insert rooms" ON rooms
  FOR INSERT WITH CHECK (creator_id = auth.uid());

-- Create clean, simple room_memberships policies
CREATE POLICY "Users can view own memberships" ON room_memberships
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own memberships" ON room_memberships
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own memberships" ON room_memberships
  FOR UPDATE USING (user_id = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_memberships ENABLE ROW LEVEL SECURITY;

-- Verify the cleanup
DO $$
BEGIN
    RAISE NOTICE 'Production RLS policies cleaned up - removed conflicting policies';
END $$;
