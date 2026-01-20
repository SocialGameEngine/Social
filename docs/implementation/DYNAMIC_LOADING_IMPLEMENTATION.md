# Dynamic Prompt Library Loading - Implementation Complete

## Overview

The app now loads prompt libraries dynamically from the Supabase database instead of requiring redeployment for new libraries.

## What Changed

### ✅ New Files Created

1. **`src/shared/dynamicPromptLibraries.ts`**
   - Fetches libraries from `prompt_libraries` table
   - Fetches prompts from `prompts` table
   - Graceful fallback to static JSON files if database fails
   - Functions: `getPromptLibraries()`, `getPromptLibrary()`, etc.

2. **`src/shared/hooks/usePromptLibraries.ts`**
   - React Query hook for fetching libraries
   - 5-minute cache to reduce database calls
   - Hooks: `usePromptLibraries()`, `usePromptLibrary()`, `useDefaultPromptLibrary()`

3. **`DYNAMIC_LOADING_IMPLEMENTATION.md`** (this file)
   - Documentation for the new system

### ✅ Updated Files

1. **`src/features/host/components/PromptLibrarySelector.tsx`**
   - Now uses `usePromptLibraries()` hook
   - Shows loading state while fetching
   - Shows "No libraries found" if empty

2. **`src/features/host/hooks/useHostComputations.ts`**
   - Now uses `usePromptLibraries()` hook
   - Dynamically builds library map from database

3. **`src/shared/constants.ts`**
   - Added exports for dynamic loading functions
   - Kept static exports for backward compatibility

## How It Works

### Before (Static)
```typescript
// Hardcoded imports - requires redeployment
import medievalPrompts from "./medievalPrompts.json";
import animePrompts from "./animePrompts.json";

const promptFileMap = {
  "medievalPrompts.json": medievalPrompts,
  "animePrompts.json": animePrompts,
};
```

### After (Dynamic)
```typescript
// Loads from database - no redeployment needed
const { data: libraries } = usePromptLibraries();

// Libraries automatically include all active libraries from database
// New libraries appear immediately after SQL migration
```

## Benefits

✅ **No Redeployment Needed** - Add libraries via SQL only
✅ **Instant Updates** - Changes appear immediately in production
✅ **Better Performance** - React Query caching reduces database calls
✅ **Graceful Fallback** - Falls back to static files if database fails
✅ **Backward Compatible** - Old code still works

## How to Add New Libraries Now

### Option 1: SQL Only (No Code Changes)

1. **Insert library metadata:**
```sql
INSERT INTO prompt_libraries (id, name, emoji, description, sort_order)
VALUES ('mynew', 'My New Pack', '🎯', 'Description here', 25);
```

2. **Insert prompts:**
```sql
INSERT INTO prompts (library_id, text, sort_order) VALUES
  ('mynew', 'First prompt', 1),
  ('mynew', 'Second prompt', 2),
  ('mynew', 'Third prompt', 3);
```

3. **Done!** Library appears in app immediately (within 5 min cache)

### Option 2: With JSON Files (For Version Control)

1. Create `myNewPrompts.json`
2. Update `promptLibraries.meta.json`
3. Update `promptLibraries.ts` imports
4. Run `node scripts/generate-prompt-migration.js`
5. Apply SQL migration
6. Commit JSON files to git

## Migration Path

### Current State
- ✅ Dynamic loading implemented
- ✅ React Query hooks created
- ✅ Components updated
- ✅ Backward compatible

### To Deploy
1. **Apply database migration** (if not already done)
2. **Deploy this code** to production
3. **Test** that existing libraries still work
4. **Add new libraries** via SQL only

### After Deployment
- New libraries can be added via SQL
- No code changes or redeployment needed
- JSON files become optional (for version control only)

## Caching Strategy

- **Cache Duration**: 5 minutes (staleTime)
- **Garbage Collection**: 10 minutes (gcTime)
- **Refetch on Focus**: Disabled
- **Manual Refresh**: Call `queryClient.invalidateQueries(['promptLibraries'])`

## Fallback Behavior

If database fetch fails:
1. Logs error to console
2. Returns empty array from `fetchPromptLibraries()`
3. `getPromptLibraries()` detects empty array
4. Falls back to static `promptLibraries` import
5. App continues working with bundled libraries

## Testing Checklist

- [ ] Existing libraries load correctly
- [ ] New libraries appear after SQL insert
- [ ] Loading state shows while fetching
- [ ] Empty state shows if no libraries
- [ ] Fallback works if database is down
- [ ] Cache works (no repeated fetches)
- [ ] Search/filter still works

## Performance Impact

**Before:**
- Bundle size: Includes all JSON files (~50KB)
- Load time: Instant (bundled)
- Updates: Requires redeployment

**After:**
- Bundle size: Same (JSON files kept as fallback)
- Load time: ~100-200ms initial fetch, then cached
- Updates: Instant via SQL

## Troubleshooting

**Libraries not appearing:**
1. Check `is_active = true` in database
2. Check browser console for errors
3. Verify Supabase connection
4. Clear React Query cache

**Old libraries still showing:**
1. Wait 5 minutes for cache to expire
2. Or manually invalidate cache
3. Or hard refresh browser

**TypeScript errors:**
1. Ensure `PromptLibraryId` type includes new library IDs
2. May need to add new IDs to type union
3. Or use `string` type for dynamic IDs

## Future Enhancements

- [ ] Admin UI for adding libraries
- [ ] A/B testing with `variant` field
- [ ] Analytics tracking (times_shown, times_answered)
- [ ] Thumbs up/down feedback
- [ ] Real-time updates via Supabase subscriptions
- [ ] Library preview before activation
- [ ] Scheduled library activation

## Files Reference

**Dynamic Loading:**
- `src/shared/dynamicPromptLibraries.ts` - Core fetching logic
- `src/shared/hooks/usePromptLibraries.ts` - React Query hooks

**Updated Components:**
- `src/features/host/components/PromptLibrarySelector.tsx`
- `src/features/host/hooks/useHostComputations.ts`

**Static Files (Fallback):**
- `src/shared/promptLibraries.ts` - Static imports
- `src/shared/promptLibraries.meta.json` - Metadata
- `src/shared/*.json` - Individual prompt files

**Database:**
- `supabase/migrations/20260108000000_add_new_prompt_libraries.sql`
- Tables: `prompt_libraries`, `prompts`
