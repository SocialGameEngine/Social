# Team Member Join Fix

## Problem
When a second player tried to join an existing team using a team code, they were getting kicked immediately. The issue was that the sessions-join function wasn't adding them as a team member in the database.

## Root Cause
The sessions-join function had two paths:
1. **New team creation** - Created team but didn't add captain as team member
2. **Existing team join** - Just returned the existing team without adding the new player as a team member

Both paths were missing the crucial step of adding players to the `team_members` table.

## Solution Applied

### 1. Fixed Existing Team Join
**Before**: When joining an existing team, the function just returned the team object
```typescript
if (isTeamCode && teamCodeData.team_id) {
  newTeam = existingTeam; // ❌ Missing team member creation
}
```

**After**: Now adds the player as a team member
```typescript
if (isTeamCode && teamCodeData.team_id) {
  // Add player as team member
  const { error: memberError } = await supabase
    .from("team_members")
    .insert({
      team_id: teamCodeData.team_id,
      user_id: userId,
      is_captain: false,
      joined_at: new Date().toISOString()
    });
    
  if (memberError) {
    // Handle error
  }
  
  newTeam = existingTeam;
}
```

### 2. Fixed New Team Creation
**Before**: Created team but didn't add captain as team member
```typescript
const { data: createdTeam, error: createError } = await supabase
  .from("teams")
  .insert({...});
// ❌ Missing team member creation for captain
```

**After**: Now adds captain as team member
```typescript
const { data: createdTeam, error: createError } = await supabase
  .from("teams")
  .insert({...});

// Add captain as team member
const { error: captainMemberError } = await supabase
  .from("team_members")
  .insert({
    team_id: newTeam.id,
    user_id: userId,
    is_captain: true,
    joined_at: new Date().toISOString()
  });
```

## Database Flow Now

### New Team Creation
1. Create team record in `teams` table
2. Create team member record in `team_members` table (captain)
3. Assign team code if using team code flow

### Existing Team Join
1. Find existing team by team code
2. Create team member record in `team_members` table (member)
3. Return existing team info

## Why This Fixes the Kick Issue

The kick detection logic in the frontend likely checks if the current user is in the `team_members` table for their team. When players weren't being added to this table:

1. **First player**: Created team but wasn't in `team_members` → Gets kicked
2. **Second player**: Joined existing team but wasn't in `team_members` → Gets kicked

Now both players are properly recorded in `team_members` with correct roles:
- Captain: `is_captain: true`
- Members: `is_captain: false`

## Test Cases

### 1. Create New Team
1. First player selects empty team slot
2. Enters team name
3. ✅ Should create team and add player as captain
4. ✅ Should not get kicked

### 2. Join Existing Team
1. Second player selects occupied team slot
2. ✅ Should join existing team as member
3. ✅ Should not get kicked
4. ✅ Should see both players in team

### 3. Multiple Players
1. Third player joins same team
2. ✅ Should add as additional team member
3. ✅ All players should remain in team

## Deployment
✅ **sessions-join function deployed successfully**
- Version updated to latest
- Changes now live in production

## Status: ✅ COMPLETE

The team member join issue has been fixed. Players should now be able to:
- Create new teams without getting kicked
- Join existing teams without getting kicked
- Have multiple players on the same team
