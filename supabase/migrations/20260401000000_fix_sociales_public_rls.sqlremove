-- =============================================================================
-- FIX SOCIALES RLS FOR PUBLIC VIEWING
-- =============================================================================
-- Allow non-room members to view Sociales (like game lobbies)
-- while keeping creation/editing restricted to room members

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view sociales in their rooms" ON sociales;

-- Create new policy that allows public viewing of Sociales
CREATE POLICY "Anyone can view active sociales" ON sociales
  FOR SELECT USING (
    -- Anyone can view Sociales that are in active/lobby status (like game lobbies)
    status IN ('draft', 'lobby', 'active', 'paused')
    OR
    -- Room members can view all Sociales in their rooms
    room_id IN (
      SELECT room_id FROM room_memberships 
      WHERE user_id = auth.uid() 
      AND is_banned = false 
      AND status IN ('active', 'approved')
    )
    OR
    -- Users can always view Sociales they created
    created_by = auth.uid()
  );

-- Keep existing UPDATE and INSERT policies unchanged
-- These already restrict creation/editing to room members and hosts

-- Verify the policy change
DO $$
BEGIN
    RAISE NOTICE 'Sociales RLS policy updated to allow public viewing of active Sociales';
END $$;
