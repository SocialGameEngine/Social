-- Fix socialites RLS policies to allow Realtime to work properly
-- Run this in Supabase SQL Editor

-- Drop the restrictive policy that blocks Realtime
DROP POLICY IF EXISTS "Users can manage their own socialite" ON socialites;

-- Recreate the original room members policy that allows Realtime
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

-- Allow users to manage their own socialite (INSERT, UPDATE, DELETE)
CREATE POLICY "Users can manage their own socialite"
  ON socialites FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage their own socialite"
  ON socialites FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own socialite"
  ON socialites FOR DELETE
  USING (user_id = auth.uid());
