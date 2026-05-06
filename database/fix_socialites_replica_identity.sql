-- Quick fix: Enable REPLICA IDENTITY FULL for socialites table
-- This fixes the "mismatch between server and client bindings" error

ALTER TABLE socialites REPLICA IDENTITY FULL;

-- Verify the setting
SELECT relname, 
       CASE relreplident
           WHEN 'd' THEN 'DEFAULT'
           WHEN 'n' THEN 'NOTHING'
           WHEN 'f' THEN 'FULL'
           WHEN 'i' THEN 'INDEX'
       END as replica_identity
FROM pg_class 
WHERE relname = 'socialites';
