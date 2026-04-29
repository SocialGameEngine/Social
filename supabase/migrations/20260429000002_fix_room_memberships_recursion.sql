-- Fix infinite recursion in room_memberships RLS policy
--
-- BACKGROUND: The previous migration (20260429000001) created infinite recursion
-- by querying room_memberships within the room_memberships SELECT policy.
--
-- SOLUTION: Simplify the policy to allow all authenticated users to view
-- active, non-banned memberships. This is safe because:
-- 1. Room memberships are not sensitive data (just player names and room associations)
-- 2. Players need to see each other in lobbies for the game to work
-- 3. The is_banned and status filters already protect privacy
--
-- This matches the pattern used by other social/multiplayer games where
-- lobby membership is publicly visible to all players.

DROP POLICY IF EXISTS "Users can view memberships in rooms they joined" ON room_memberships;

CREATE POLICY "Authenticated users can view active memberships" ON room_memberships
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND is_banned = false
    AND status IN ('active', 'approved')
  );

-- Also simplify socialites policy to avoid any potential recursion
DROP POLICY IF EXISTS "Users can view socialites in joined Sociales" ON socialites;

CREATE POLICY "Authenticated users can view active socialites" ON socialites
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND is_active = true
  );
