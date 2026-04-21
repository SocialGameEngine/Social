-- FIX SOCIALITES REALTIME - Run this in Supabase SQL Editor
-- This will restore real-time updates for socialites

-- Step 1: Drop the broken policy
DROP POLICY IF EXISTS "Users can manage their own socialite" ON socialites;

-- Step 2: Restore the room members policy (enables Realtime)
CREATE POLICY "Room members can view socialites"
  ON socialites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_memberships
      WHERE room_memberships.room_id = socialites.room_id
      AND room_memberships.user_id = auth.uid()
      AND room_memberships.is_banned = FALSE
    )
  );

-- Step 3: Allow users to manage their own socialites
CREATE POLICY "Users can manage their own socialite"
  ON socialites FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage their own socialite"
  ON socialites FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own socialite"
  ON socialites FOR DELETE
  USING (user_id = auth.uid());

-- Step 4: Verify the fix
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'socialites'
ORDER BY policyname;
