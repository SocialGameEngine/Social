-- Fix rooms RLS: allow any authenticated user to view active rooms
--
-- BACKGROUND: The cleanup migration (20260427000004) removed the "Anyone can view active rooms"
-- policy and replaced it with "Users can view rooms they created" which broke room joining.
-- New users trying to join by room code get a 406 because they can't SELECT the room at all.
--
-- SOLUTION: Re-add a public SELECT policy for active rooms so players can find and join rooms.
-- Also broaden room_memberships SELECT so the host can see all members in their room.

-- Allow any authenticated user to view active rooms (needed for join-by-code)
DROP POLICY IF EXISTS "Anyone can view active rooms" ON rooms;
CREATE POLICY "Anyone can view active rooms" ON rooms
  FOR SELECT USING (status = 'active');

-- Replace the overly-restrictive "own rows only" membership SELECT with one that also
-- lets the room creator (host) see every membership in their room.
-- This avoids the infinite-recursion pattern by joining rooms (not room_memberships) to check ownership.
DROP POLICY IF EXISTS "Users can view own memberships" ON room_memberships;
CREATE POLICY "Users can view memberships in accessible rooms" ON room_memberships
  FOR SELECT USING (
    user_id = auth.uid()
    OR room_id IN (SELECT id FROM rooms WHERE creator_id = auth.uid())
  );
