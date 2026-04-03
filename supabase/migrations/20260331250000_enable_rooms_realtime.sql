-- Enable Realtime for rooms table and set full replica identity
--
-- BACKGROUND: The rooms table needs REPLICA IDENTITY FULL for the room subscription
-- to receive complete UPDATE event data when current_sociale_id changes. Without this,
-- room pages won't update in real-time when a host creates a Sociale.
--
-- SOLUTION: Set REPLICA IDENTITY FULL to include all column data in UPDATE events
-- The rooms table is already in the supabase_realtime publication.

-- Set full replica identity for rooms table
ALTER TABLE rooms REPLICA IDENTITY FULL;

-- Verify the change
DO $$
BEGIN
    RAISE NOTICE 'Rooms table REPLICA IDENTITY set to FULL for real-time updates';
END $$;
