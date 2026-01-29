# RLS Debug Scripts

## Overview

These SQL scripts were used to debug and fix Row Level Security (RLS) issues with the `venue_accounts` and `venue_staff` tables during authentication troubleshooting.

## Scripts

### 1. disable_venue_accounts_rls.sql
**Purpose**: Temporarily disable RLS for testing edge function access
**Use Case**: Identifying if RLS was causing authentication hanging issues

```sql
-- Temporarily disable RLS for venue_accounts to test edge function
-- This will help identify if RLS is causing the hanging issue

ALTER TABLE venue_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE venue_staff DISABLE ROW LEVEL SECURITY;

-- Test the edge function by running a simple query
SELECT 'RLS disabled for venue_accounts' as status;
```

### 2. fix_venue_accounts_rls.sql
**Purpose**: Fix RLS policies to ensure proper service role access for edge functions
**Use Case**: Resolving edge function authentication issues

```sql
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
WHERE tablename IN ('venue_accounts', 'venue_staff');
```

### 3. test_venue_accounts_rls.sql
**Purpose**: Test RLS policies to verify edge function can access tables
**Use Case**: Validating RLS policy fixes

```sql
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
WHERE tablename IN ('venue_accounts', 'venue_staff');
```

## Usage

### Running the Scripts
1. Open Supabase SQL Editor
2. Copy and paste the desired script
3. Execute to debug or fix RLS issues
4. Monitor edge function logs for improvements

### Expected Results
- **disable_venue_accounts_rls.sql**: Should temporarily resolve hanging issues
- **fix_venue_accounts_rls.sql**: Should provide permanent fix with proper service role access
- **test_venue_accounts_rls.sql**: Should show updated policies working correctly

## Important Notes

- These scripts were created during authentication debugging
- The `disable_venue_accounts_rls.sql` script is temporary and should not be used in production
- Always backup RLS policies before making changes
- Test thoroughly in development before applying to production

---

*Last updated: January 2026*
