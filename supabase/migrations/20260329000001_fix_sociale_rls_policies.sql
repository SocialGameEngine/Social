-- =============================================================================
-- FIX SOCIALE RLS POLICIES
-- =============================================================================
-- Fix RLS policies to allow room hosts to create Sociales

-- Drop existing policies
DROP POLICY IF EXISTS "Room members can view sociales" ON sociales;
DROP POLICY IF EXISTS "Creators can manage sociales" ON sociales;

-- Create corrected policies
CREATE POLICY "Room members can view sociales"
  ON sociales FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_memberships
      WHERE room_memberships.room_id = sociales.room_id
      AND room_memberships.user_id = auth.uid()
      AND room_memberships.is_banned = FALSE
    )
  );

CREATE POLICY "Room members can create sociales"
  ON sociales FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM room_memberships
      WHERE room_memberships.room_id = room_id
      AND room_memberships.user_id = auth.uid()
      AND room_memberships.is_banned = FALSE
    )
  );

CREATE POLICY "Creators can update their own sociales"
  ON sociales FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Creators can delete their own sociales"
  ON sociales FOR DELETE
  USING (created_by = auth.uid());
