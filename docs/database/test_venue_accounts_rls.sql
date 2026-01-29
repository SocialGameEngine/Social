-- Test venue_accounts RLS policies
-- This will help identify if the edge function can access the table

-- Check current policies
SELECT 
  schemaname,
  tablename, 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'venue_accounts'
ORDER BY policyname;

-- Test if service role can access venue_accounts
-- This simulates what the edge function does
DO $$
DECLARE
  test_user_id UUID := gen_random_uuid();
  test_result RECORD;
BEGIN
  -- Try to select from venue_accounts (this should work with service role)
  SELECT COUNT(*) INTO test_result FROM venue_accounts;
  RAISE NOTICE 'Service role can read venue_accounts: % rows', test_result.count;
  
  -- Try to insert a test record (this should work with service role)
  INSERT INTO venue_accounts (
    auth_user_id, 
    email, 
    full_name, 
    role, 
    is_active
  ) VALUES (
    test_user_id::text,
    'test@example.com',
    'Test User',
    'bar_owner',
    true
  );
  
  RAISE NOTICE 'Service role can insert into venue_accounts: SUCCESS';
  
  -- Clean up the test record
  DELETE FROM venue_accounts WHERE auth_user_id = test_user_id::text;
  RAISE NOTICE 'Service role can delete from venue_accounts: SUCCESS';
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Service role access failed: %', SQLERRM;
END $$;
