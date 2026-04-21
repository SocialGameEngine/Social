-- Fix RLS policies for sociales table to allow real-time events
--
-- BACKGROUND: The sociales table needs RLS policies that allow users to receive
-- real-time events when new Sociales are created in their room.
--
-- SOLUTION: Ensure RLS policies allow users to SELECT sociales they can access
-- so they can receive real-time updates when new Sociales are created.

-- Drop existing policies if they exist (to start fresh)
DROP POLICY IF EXISTS "Users can view sociales in their rooms" ON sociales;
DROP POLICY IF EXISTS "Users can update their own sociales" ON sociales;
DROP POLICY IF EXISTS "Users can insert sociales" ON sociales;

-- Create comprehensive RLS policies for sociales
CREATE POLICY "Users can view sociales in their rooms" ON sociales
  FOR SELECT USING (
    -- Users can view Sociales in rooms they are members of
    room_id IN (
      SELECT room_id FROM room_memberships 
      WHERE user_id = auth.uid() 
      AND is_banned = false 
      AND status IN ('active', 'approved')
    )
    OR
    -- Users can view Sociales they created
    created_by = auth.uid()
  );

CREATE POLICY "Users can update their own sociales" ON sociales
  FOR UPDATE USING (
    created_by = auth.uid() OR
    room_id IN (
      SELECT room_id FROM room_memberships 
      WHERE user_id = auth.uid() 
      AND is_banned = false 
      AND status IN ('active', 'approved')
      AND is_host = true
    )
  );

CREATE POLICY "Users can insert sociales" ON sociales
  FOR INSERT WITH CHECK (
    created_by = auth.uid() OR
    room_id IN (
      SELECT room_id FROM room_memberships 
      WHERE user_id = auth.uid() 
      AND is_banned = false 
      AND status IN ('active', 'approved')
      AND is_host = true
    )
  );

-- Ensure RLS is enabled
ALTER TABLE sociales ENABLE ROW LEVEL SECURITY;

-- Verify policies are created
DO $$
BEGIN
    RAISE NOTICE 'Sociales RLS policies created for real-time access';
END $$;
