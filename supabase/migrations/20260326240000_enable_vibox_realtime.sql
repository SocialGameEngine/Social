-- Migration: Enable realtime for VIBox tables
-- This allows realtime subscriptions to work for queue updates

-- ============================================================================
-- ENABLE REALTIME FOR VIBOX TABLES
-- ============================================================================

-- Enable realtime for vibox_queue table
ALTER TABLE public.vibox_queue REPLICA IDENTITY FULL;

-- Enable realtime for vibox_votes table
ALTER TABLE public.vibox_votes REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.vibox_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vibox_votes;

-- ============================================================================
-- COMPLETION LOG
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'REALTIME ENABLED FOR VIBOX TABLES';
    RAISE NOTICE 'Tables added to realtime: vibox_queue, vibox_votes';
    RAISE NOTICE 'Realtime subscriptions should now work properly';
END $$;
