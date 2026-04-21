-- Fix RLS policies for rooms table to allow real-time events
--
-- BACKGROUND: RLS policies can block real-time events if they don't properly
-- allow users to receive updates. Users need SELECT permission to receive
-- real-time events for a table.
--
-- SOLUTION: Ensure RLS policies allow users to SELECT rooms they are members of
-- so they can receive real-time updates when current_sociale_id changes.

-- Drop existing policies if they exist (to start fresh)
DROP POLICY IF EXISTS "Users can view rooms they are members of" ON rooms;
DROP POLICY IF EXISTS "Users can update their own rooms" ON rooms;
DROP POLICY IF EXISTS "Users can insert rooms" ON rooms;

-- Create comprehensive RLS policies for rooms
CREATE POLICY "Users can view rooms they are members of" ON rooms
  FOR SELECT USING (
    -- Users can view rooms they are members of
    id IN (
      SELECT room_id FROM room_memberships 
      WHERE user_id = auth.uid() 
      AND is_banned = false 
      AND status IN ('active', 'approved')
    )
    OR
    -- Users can view rooms they created
    creator_id = auth.uid()
    OR
    -- Rooms are public (if applicable)
    (settings->>'allowAnonymous')::boolean = true
  );

CREATE POLICY "Users can update their own rooms" ON rooms
  FOR UPDATE USING (
    creator_id = auth.uid() OR
    id IN (
      SELECT room_id FROM room_memberships 
      WHERE user_id = auth.uid() 
      AND is_banned = false 
      AND status IN ('active', 'approved')
      AND is_host = true
    )
  );

CREATE POLICY "Users can insert rooms" ON rooms
  FOR INSERT WITH CHECK (creator_id = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Verify policies are created
DO $$
BEGIN
    RAISE NOTICE 'Rooms RLS policies created for real-time access';
END $$;
