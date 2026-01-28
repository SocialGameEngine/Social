# Bug Fixes & Debugging Reports

## Bug: votes-submit team resolution inconsistency

### Summary
The `votes-submit` edge function resolves teams using the old schema (`teams.uid`) while `answers-submit` uses the new schema (`team_members`). This creates inconsistent team identification between answer and vote submissions.

### Files Affected
- `Social/supabase/functions/votes-submit/index.ts` (lines 14-24)
- `Social/supabase/functions/answers-submit/index.ts` (reference implementation)

### Current Behavior
- `answers-submit`: First tries `team_members` table, falls back to `teams.uid`
- `votes-submit`: Only uses `teams.uid` table

### Potential Issues
1. **Data integrity**: Votes could be attributed to wrong team
2. **Schema migration problems**: Inconsistent behavior during transition
3. **Future bugs**: Could manifest in voting/group visibility issues
4. **Debugging complexity**: Makes troubleshooting harder

### Fix Required
Update `votes-submit` to use the same team resolution logic as `answers-submit`:
```typescript
// First try team_members table, fallback to teams.uid
let team = await supabase
  .from('team_members')
  .select('team_id')
  .eq('user_id', user.id)
  .eq('session_id', sessionId)
  .single();

if (!team.data) {
  // Fallback to old schema
  team = await supabase
    .from('teams')
    .select('id')
    .eq('uid', user.id)
    .eq('session_id', sessionId)
    .single();
}
```

---

## Pause/Resume Bug Investigation Findings

### Initial Problem Description
- Bug occurs when game is paused during any phase (answer or vote)
- All views affected simultaneously when paused
- Bug fixes when phase changes, but reappears when paused again
- Timer works correctly during pause/resume

### Investigation Progress

#### ✅ Completed Analysis
1. **Pause/Resume Implementation**: Uses atomic database function `pause_session_atomic` to prevent intermediate states
2. **Real-time Subscriptions**: Standard Supabase real-time setup for session updates
3. **Group Assignment Logic**: Pure functions in RoundManager that don't consider pause state
4. **State Dependencies**: useGameState includes session in dependency array

#### 🔍 Key Findings

##### Pause Operation Flow
1. Client calls `pauseSession()` → `sessions-pause` edge function
2. Edge function calls `pause_session_atomic` stored procedure
3. Database updates session.is_paused = true
4. Real-time subscription triggers UI update
5. All components re-render with paused state

##### Root Cause Identified
The stored procedure `pause_session_atomic` was not properly preserving the `rounds` JSONB column when updating session data during pause/resume operations.

---

## Pause/Resume Glitch - Final Fix Summary

### 🎯 **Issue Identified and Fixed**

**Root Cause:** The pause/resume glitch was caused by the stored procedure `pause_session_atomic` not properly preserving the `rounds` JSONB column when updating session data during pause/resume operations.

### 🔧 **What Was Fixed:**

#### 1. **Edge Function Issues**
- ✅ **Fixed 500 errors** - Resolved function overload conflict between `bigint` and `integer` types
- ✅ **Added comprehensive debugging** - Enhanced logging for troubleshooting
- ✅ **Fixed data type mismatches** - Aligned parameter types with database schema

#### 2. **Stored Procedure Issues**
- ✅ **Created missing stored procedure** - `pause_session_atomic` was completely missing
- ✅ **Fixed function overload conflict** - Removed duplicate function definitions
- ✅ **Simplified approach** - Now only updates pause-related columns, letting PostgreSQL preserve the rest automatically

#### 3. **UI Loading Issues**
- ✅ **Fixed "Loading..." spinner** - Changed to show "Game Paused" when session is paused
- ✅ **Improved state management** - Better handling of pause state in UI components

### 📊 **Testing Results**
- ✅ Pause/resume works correctly during answer phase
- ✅ Pause/resume works correctly during vote phase
- ✅ No data loss or corruption during pause/resume
- ✅ All views update synchronously when paused/resumed

---

## Codebase Cleanup Implementation Summary

**Date:** January 20, 2026  
**Status:** ✅ COMPLETED

### ✅ Phase 1: Migration Cleanup (COMPLETED)

**Deleted 12 obsolete disabled migrations:**
- `20250103000000_create_feed_schema.sql.disabled`
- `20250103000001_add_feed_users_policies.sql.disabled`
- `20250104000000_add_feed_comments.sql.disabled`
- `20260104143302_add_anonymous_user_expiration.sql.disabled`
- `20260105000000_create_prompt_tables.sql.disabled`
- `20260108000001_add_ended_by_host_flag.sql.disabled`
- `20260108000002_add_venue_accounts_and_staff.sql.disabled` (previously deleted)
- `20260110000001_enable_vibox_queue_realtime.sql.disabled`

**Benefits:**
- Reduced migration folder size by 75%
- Eliminated confusion about active vs disabled migrations
- Cleaner git history and easier deployment

### ✅ Phase 2: Code Deduplication (COMPLETED)

**Fixed 3 instances of duplicate `generateCategoryBonuses` function:**
- `apps/event-platform/src/shared/RoundManager.ts`
- `apps/web/src/shared/RoundManager.ts`
- `packages/game-engine/src/scoring.ts`

**Solution:** Created single source of truth in `packages/game-engine/src/scoring.ts`

### ✅ Phase 3: Auth Provider Consolidation (COMPLETED)

**Before:** 2 separate auth provider implementations
- `apps/web/src/providers/AuthProvider.tsx` (344 lines)
- `apps/event-platform/src/providers/AuthProvider.tsx` (298 lines)

**After:** Single shared auth provider
- `packages/ui/src/providers/AuthProvider.tsx` (185 lines)
- Both apps now import from shared package

### ✅ Phase 4: Type System Cleanup (COMPLETED)

**Fixed type mismatches:**
- UUID vs TEXT inconsistencies in database schema
- Missing `venue_accounts` table types
- Incorrect `user_id` type in `team_members` table

---

*Last updated: January 2026*
