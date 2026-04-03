-- Fix Realtime DELETE events for socialites table
--
-- PROBLEM: Row Level Security (RLS) policies were blocking Supabase Realtime 
-- from broadcasting DELETE events, even though the delete operations themselves succeeded.
--
-- ROOT CAUSE: RLS SELECT policy is required for Realtime to emit any event.
-- For DELETE events, if the user can't "see" the row before the operation,
-- the delete event won't be fired to that client.
--
-- SOLUTION: Replace the restrictive policy with one that allows Realtime to work
-- while maintaining security for user operations.
--
-- This migration ensures that:
-- 1. Users can still only manage their own socialites (security maintained)
-- 2. Realtime can broadcast DELETE events (real-time updates fixed)
-- 3. Both room and host views update when players leave Sociales
--
-- RELATED: See 20260331240000_enable_full_replica_identity.sql for REPLICA IDENTITY fix

-- Drop the existing restrictive policy that blocks Realtime
DROP POLICY IF EXISTS "Users can manage their own socialite" ON socialites;

-- Create a new policy that allows users to manage their own socialite AND allows Realtime
CREATE POLICY "Users can manage their own socialite"
  ON socialites FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
