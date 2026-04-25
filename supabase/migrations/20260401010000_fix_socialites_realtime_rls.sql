-- Fix socialites RLS policies to restore Realtime functionality
--
-- PROBLEM: Migration 20260331230000_fix_socialites_realtime_delete_v2.sql created
-- an overly restrictive policy that blocks Realtime by only allowing users
-- to see their own socialites. This prevents the host from seeing other
-- players' socialites, breaking Realtime subscriptions.
--
-- SOLUTION: Restore the original working policies:
-- 1. Room members can view all socialites in their room (for Realtime)
-- 2. Users can only manage their own socialites (for security)

-- Drop the broken restrictive policy that blocks Realtime
DROP POLICY IF EXISTS "Users can manage their own socialite" ON socialites;

-- Drop existing policy if it exists (may have been created by earlier migration)
DROP POLICY IF EXISTS "Room members can view socialites" ON socialites;

-- Restore the original working policy that allows room members to see socialites
-- This is required for Realtime to work properly
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

-- Allow users to manage their own socialites (INSERT, UPDATE, DELETE)
-- This maintains security while allowing Realtime to work
-- Drop any existing policies first
DROP POLICY IF EXISTS "Users can insert their own socialite" ON socialites;
DROP POLICY IF EXISTS "Users can update their own socialite" ON socialites;
DROP POLICY IF EXISTS "Users can delete their own socialite" ON socialites;

CREATE POLICY "Users can insert their own socialite"
  ON socialites FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own socialite"
  ON socialites FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own socialite"
  ON socialites FOR DELETE
  USING (user_id = auth.uid());

-- Verify the fix
DO $$
BEGIN
    RAISE NOTICE 'Socialites RLS policies fixed for Realtime functionality';
    RAISE NOTICE '- Room members can view socialites (enables Realtime)';
    RAISE NOTICE '- Users can manage their own socialites (maintains security)';
END $$;
