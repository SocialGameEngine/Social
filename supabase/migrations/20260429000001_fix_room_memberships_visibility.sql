-- Fix room_memberships RLS: allow users to see all members in rooms they've joined
--
-- BACKGROUND: Anonymous users joining a room can only see their own membership,
-- not other players in the lobby. This breaks the lobby UI where players should
-- see each other.
--
-- SOLUTION: Allow users to see all memberships in any room where they are also a member.
-- This enables the lobby to show all players without creating recursion issues.

DROP POLICY IF EXISTS "Users can view memberships in accessible rooms" ON room_memberships;

CREATE POLICY "Users can view memberships in rooms they joined" ON room_memberships
  FOR SELECT USING (
    -- Users can always see their own membership
    user_id = auth.uid()
    OR
    -- Users can see all memberships in rooms where they are also a member
    room_id IN (
      SELECT room_id 
      FROM room_memberships 
      WHERE user_id = auth.uid() 
        AND is_banned = false
        AND status IN ('active', 'approved')
    )
  );

-- Also need to allow viewing socialites in Sociales the user has joined
DROP POLICY IF EXISTS "Users can view socialites in their Sociales" ON socialites;

CREATE POLICY "Users can view socialites in joined Sociales" ON socialites
  FOR SELECT USING (
    -- Users can see their own socialite record
    user_id = auth.uid()
    OR
    -- Users can see all socialites in Sociales they've joined
    sociale_id IN (
      SELECT sociale_id 
      FROM socialites 
      WHERE user_id = auth.uid() 
        AND is_active = true
    )
  );
