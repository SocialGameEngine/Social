-- Check if socialites table is in the realtime publication
SELECT 
  schemaname,
  tablename,
  pubname
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'socialites';
