-- Enable REPLICA IDENTITY FULL for socialites table
--
-- BACKGROUND: Supabase Realtime events need full row data to work properly
-- with client-side filtering. Without REPLICA IDENTITY FULL, UPDATE/DELETE
-- events only return primary key data, which breaks real-time subscriptions.
--
-- SOLUTION: Set REPLICA IDENTITY FULL for socialites table to include
-- all column data in real-time events.

ALTER TABLE socialites REPLICA IDENTITY FULL;

-- Verify the change
DO $$
BEGIN
    RAISE NOTICE 'Socialites table REPLICA IDENTITY set to FULL for real-time updates';
END $$;
