# Database Schema Analysis

## Key Findings

### 1. team_members Table
**Actual Schema:**
```sql
CREATE TABLE public.team_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  user_id uuid,  -- References auth.users(id), NOT TEXT
  device_id character varying,
  joined_at timestamp with time zone DEFAULT now(),
  last_active timestamp with time zone DEFAULT now(),
  is_captain boolean DEFAULT false
);
```

**Issues Found:**
- ❌ `user_id` is **UUID**, not TEXT (our edge function uses TEXT)
- ❌ No `player_name` column (we tried to query it)
- ✅ Has `is_captain` column
- ✅ Has `device_id` for anonymous users

### 2. teams Table
**Actual Schema:**
```sql
CREATE TABLE public.teams (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  uid text,  -- TEXT, nullable ✅
  team_name text NOT NULL,
  is_host boolean NOT NULL DEFAULT false,
  score integer NOT NULL DEFAULT 0,
  mascot_id integer,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  last_active_at timestamp with time zone NOT NULL DEFAULT now(),
  team_code character varying UNIQUE,
  captain_id uuid  -- References auth.users(id)
);
```

**Issues Found:**
- ✅ `uid` is TEXT and nullable (correct)
- ⚠️ Has `captain_id` UUID field (should we use this instead of `uid`?)
- ⚠️ Has `team_code` field (should we use this instead of team_codes table?)

### 3. team_codes Table
**Actual Schema:**
```sql
CREATE TABLE public.team_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code character varying NOT NULL UNIQUE,
  session_id uuid NOT NULL,
  team_id uuid,  -- Can be NULL
  created_at timestamp with time zone DEFAULT now(),
  assigned_at timestamp with time zone,
  is_used boolean DEFAULT false
);
```

**Status:** ✅ Matches our implementation

---

## Critical Issues to Fix

### Issue 1: user_id Type Mismatch
**Current:** Edge function treats `user_id` as TEXT
**Actual:** `user_id` is UUID

**Impact:** 
- Team member insertion fails
- User matching fails

**Fix Required:**
```typescript
// In sessions-join edge function
const { data: { user } } = await supabase.auth.getUser(token)
const userId = user?.id  // This is already UUID, don't convert to text

// Insert team member
await supabase
  .from("team_members")
  .insert({
    team_id: teamCodeData.team_id,
    user_id: userId,  // UUID, not text
    device_id: null,
    is_captain: !teamData.uid,
    joined_at: new Date().toISOString()
  });
```

### Issue 2: Captain ID vs UID
**Current:** We use `teams.uid` (TEXT) for captain
**Available:** `teams.captain_id` (UUID) exists

**Question:** Should we use `captain_id` instead of `uid`?

**Recommendation:** Use `captain_id` for authenticated users, keep `uid` for backward compatibility

---

## Recommended Fixes

### 1. Update sessions-join Edge Function
```typescript
// Don't convert userId to text
const userId = user?.id  // Keep as UUID

// Set captain using captain_id instead of uid
if (!teamData.captain_id && userId) {
  await supabase
    .from('teams')
    .update({ captain_id: userId })
    .eq('id', teamCodeData.team_id);
}

// Insert team member with UUID
await supabase
  .from('team_members')
  .insert({
    team_id: teamCodeData.team_id,
    user_id: userId,  // UUID
    device_id: null,
    is_captain: !teamData.captain_id,
    joined_at: new Date().toISOString()
  });
```

### 2. Update Frontend Team Finding
```typescript
// In TeamPage.tsx - use captain_id instead of uid
const currentTeam = useMemo(() => {
  if (gameState.userTeam) {
    return activeTeams.find(team => team.id === gameState.userTeam?.id) ?? null;
  }
  
  // Primary: Use teamId from session
  if (teamSession?.teamId && activeTeams.length > 0) {
    return activeTeams.find(team => team.id === teamSession.teamId) ?? null;
  }
  
  // Fallback: Check if user is captain
  if (user?.id && activeTeams.length > 0) {
    return activeTeams.find(team => team.captain_id === user.id) ?? null;
  }
  
  return null;
}, [gameState.userTeam, activeTeams, teamSession?.teamId, user?.id]);
```

### 3. Simplified RLS Policy
```sql
-- team_members RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all team members
CREATE POLICY "Authenticated users can view team members" ON team_members
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Allow users to insert themselves
CREATE POLICY "Users can insert themselves" ON team_members
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND 
        (user_id = auth.uid() OR user_id IS NULL)
    );

-- Allow users to update their own records
CREATE POLICY "Users can update own records" ON team_members
    FOR UPDATE USING (user_id = auth.uid());

-- Allow users to delete their own records
CREATE POLICY "Users can delete own records" ON team_members
    FOR DELETE USING (user_id = auth.uid());
```

---

## Schema Inconsistencies

### teams Table
- Has both `uid` (TEXT) and `captain_id` (UUID)
- Has both `team_code` (VARCHAR) and uses `team_codes` table
- **Recommendation:** Standardize on `captain_id` and `team_codes` table

### Anonymous Users
- `team_members.user_id` is UUID (can't store "anon-123")
- Should use `device_id` for anonymous user tracking
- **Recommendation:** Use `device_id` for anonymous users, leave `user_id` NULL

---

## Action Plan

1. ✅ Remove TEXT conversion in edge functions (use UUID directly)
2. ✅ Use `captain_id` instead of `uid` for captain tracking
3. ✅ Use `device_id` for anonymous users
4. ✅ Apply simplified RLS policies
5. ✅ Update frontend to use `captain_id`
6. ✅ Test complete flow

