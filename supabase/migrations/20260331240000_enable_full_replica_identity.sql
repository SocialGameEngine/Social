-- Enable full replica identity for socialites table
-- 
-- BACKGROUND: Supabase Realtime DELETE events only return the primary key by default.
-- This causes issues with client-side filtering because the deleted row no longer
-- satisfies filter criteria that reference other columns.
--
-- SOLUTION: REPLICA IDENTITY FULL makes DELETE events include all column data,
-- allowing client-side filtering to work properly for real-time updates.
--
-- This migration fixes the issue where host view wasn't updating when players left Sociales.
-- Combined with client-side filtering logic in useSocialites hook, this ensures
-- both room and host views receive real-time DELETE event updates.
--
-- See also: 20260331230000_fix_socialites_realtime_delete_v2.sql for RLS policy updates

ALTER TABLE socialites REPLICA IDENTITY FULL;
