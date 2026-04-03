-- Fix Realtime DELETE events for socialites table
-- RLS policies were blocking Realtime from broadcasting DELETE events
-- This policy allows Realtime to broadcast all changes to socialites

CREATE POLICY "Enable Realtime for socialites"
  ON socialites FOR ALL
  USING (true);
