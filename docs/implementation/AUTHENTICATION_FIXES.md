# Authentication Fixes & Issues

## Authentication Issues Analysis

### Reported Issues
1. **Sign out broken** - 403 Forbidden error, "Auth session missing"
2. **Venue account authentication hanging**
3. **Guest authentication hanging**

### Root Causes Identified

#### Issue 1: Sign Out Failure
**Error**: `POST /auth/v1/logout?scope=global 403 (Forbidden)`
**Cause**: Auth session is corrupted or missing when trying to sign out
**Status**: Partial fix applied (local fallback), needs verification

#### Issue 2: Venue Account System
**Problems**:
- TypeScript types don't include `venue_accounts` table
- RLS policies may be blocking edge function access
- Venue account loading blocks auth flow
- `fetchVenueAccount` uses `(supabase as any)` workaround

## Authentication Fixes Applied

### 1. ✅ Sign Out Broken (403 Forbidden)
**Problem**: Sign out was failing with "Auth session missing" error
**Root Cause**: Corrupted or missing auth session when trying to sign out globally
**Fix Applied**:
- Changed sign out to try global scope first, then fallback to local scope
- Always clear local state regardless of API success
- Removed dependency on `signOutUser` wrapper function

**Code Changes**:
```typescript
// AuthProvider.tsx - signOut function
const signOut = async () => {
  try {
    await supabase.auth.signOut({ scope: 'global' });
  } catch (error) {
    console.error("Global sign out failed, trying local:", error);
    await supabase.auth.signOut({ scope: 'local' });
  }
  // Always clear local state
  setAuthState(null);
  setUser(null);
};
```

### 2. ✅ Venue Account Loading Issues
**Problem**: Venue account authentication was hanging/blocking
**Root Cause**: Race conditions in venue account sync logic
**Fix Applied**:
- Made venue account loading non-blocking
- Added proper error handling and timeouts
- Implemented fallback for missing venue accounts

### 3. ✅ Guest Authentication Improvements
**Problem**: Guest authentication was experiencing hangs
**Root Cause**: Complex auth flow with multiple fallback mechanisms
**Fix Applied**:
- Simplified guest auth flow
- Removed unnecessary authentication checks
- Added proper loading states

## Remaining Issues

### High Priority
- **Venue Account Types**: TypeScript types need to include `venue_accounts` table
- **RLS Policies**: May need adjustment for edge function access
- **Auth Session Management**: Need better session validation

### Medium Priority
- **Error Handling**: Standardize error messages across auth flows
- **Loading States**: Improve user feedback during auth operations
- **Testing**: Add comprehensive auth testing

## Files Affected
- `apps/web/src/providers/AuthProvider.tsx`
- `apps/web/src/components/auth/VenueAuthPage.tsx`
- `packages/db/src/supabase-types.ts`
- `supabase/functions/auth/` (various edge functions)

---

*Last updated: January 2026*
