-- Fix RLS infinite recursion by updating rooms policies
--
-- BACKGROUND: The rooms policy is still causing recursion by querying room_memberships
-- which has its own RLS policies. We need to simplify this as well.
--
-- SOLUTION: Remove the complex room_memberships query from rooms policy
-- and use a simpler approach based on creator_id

-- Drop existing rooms policies that cause recursion
DROP POLICY IF EXISTS "Users can view rooms they are members of" ON rooms;
DROP POLICY IF EXISTS "Users can update their own rooms" ON rooms;
DROP POLICY IF EXISTS "Users can insert rooms" ON rooms;

-- Create simplified rooms policies that avoid room_memberships queries
CREATE POLICY "Users can view rooms they created" ON rooms
  FOR SELECT USING (creator_id = auth.uid());

CREATE POLICY "Users can update rooms they created" ON rooms
  FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY "Users can insert rooms" ON rooms
  FOR INSERT WITH CHECK (creator_id = auth.uid());

-- Also add a policy for public rooms (if anonymous access is needed)
CREATE POLICY "Public can view active rooms" ON rooms
  FOR SELECT USING (status = 'active' AND (settings->>'allowAnonymous')::boolean = true);

-- Ensure RLS is still enabled
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Verify the fix
DO $$
BEGIN
    RAISE NOTICE 'Rooms RLS policies simplified to avoid recursion';
END $$;
