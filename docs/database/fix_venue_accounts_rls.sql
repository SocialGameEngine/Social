-- Fix venue_accounts RLS policies for service role access
-- This ensures edge functions can work properly

-- First, let's see what policies exist
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

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own venue account" ON venue_accounts;
DROP POLICY IF EXISTS "Users can insert own venue account" ON venue_accounts;
DROP POLICY IF EXISTS "Users can update own venue account" ON venue_accounts;
DROP POLICY IF EXISTS "Service role full access to venue_accounts" ON venue_accounts;
DROP POLICY IF EXISTS "Service role full access" ON venue_accounts;
DROP POLICY IF EXISTS "Venue accounts can view own staff assignments" ON venue_staff;
DROP POLICY IF EXISTS "Service role full access to venue_staff" ON venue_staff;

-- Create proper RLS policies for venue_accounts
-- 1. Users can view their own venue account
CREATE POLICY "Users can view own venue account" ON venue_accounts
    FOR SELECT USING (auth.uid()::text = auth_user_id);

-- 2. Users can insert their own venue account
CREATE POLICY "Users can insert own venue account" ON venue_accounts
    FOR INSERT WITH CHECK (auth.uid()::text = auth_user_id);

-- 3. Users can update their own venue account
CREATE POLICY "Users can update own venue account" ON venue_accounts
    FOR UPDATE USING (auth.uid()::text = auth_user_id);

-- 4. Service role can do everything (for edge functions)
CREATE POLICY "Service role full access to venue_accounts" ON venue_accounts
    FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Create proper RLS policies for venue_staff
-- 1. Venue accounts can view their own staff assignments
CREATE POLICY "Venue accounts can view own staff assignments" ON venue_staff
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM venue_accounts 
            WHERE id = venue_account_id 
            AND auth.uid()::text = venue_accounts.auth_user_id
        )
    );

-- 2. Service role can do everything on venue_staff
CREATE POLICY "Service role full access to venue_staff" ON venue_staff
    FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
