-- Enable REPLICA IDENTITY FULL for socialites table
-- Run this manually in Supabase SQL Editor if migrations are blocked

ALTER TABLE socialites REPLICA IDENTITY FULL;
