# Team Management System Implementation Plan

## Executive Summary

Replace the current "Team Codes" modal with a comprehensive "Teams" modal that provides full visibility and management capabilities for all teams in a session. This affects the kick/ban system significantly due to the new captain + multi-player team structure.

## Current System Analysis

### Existing Components
- **Team Codes Modal** (`TeamCodesManager.tsx`): Shows available/used team codes with basic team info
- **Kick Player** (`sessions-kick-player`): Deletes entire team (designed for 1 player = 1 team)
- **Ban Player** (`sessions-ban-player`): Deletes team and adds UID to banned list
- **Banned Teams Manager**: Shows banned players with unban functionality

### Critical Issues with Current System
1. **Kick function deletes entire team** - With multi-player teams, this kicks ALL players, not just one
2. **No captain promotion logic** - Kicking captain doesn't promote next member
3. **No individual player visibility** - Can't see who's on each team
4. **No captain-initiated kicks** - Captains can't manage their own team members
5. **Ban system uses team UID** - Works for captain but doesn't track individual banned players

## New System Design

### 1. Teams Modal (Host View)

#### UI Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Teams Management                                      [X]    │
├─────────────────────────────────────────────────────────────┤
│ Summary:  [10 Teams] [25 Players] [3 Available Codes]       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ Active Teams (7)                                             │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ 🎯 Team 1                                    Code: 1234│  │
│ │ ├─ 👑 Alice (Captain)              [Kick] [Ban]       │  │
│ │ ├─ 👤 Bob                          [Kick] [Ban]       │  │
│ │ └─ 👤 Charlie                      [Kick] [Ban]       │  │
│ │ Score: 150 pts                                         │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                               │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ 🎯 Team 2                                    Code: 5678│  │
│ │ └─ 👑 David (Captain)              [Kick] [Ban]       │  │
│ │ Score: 200 pts                                         │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                               │
│ Available Codes (3)                                          │
│ [1111] [2222] [3333]                                         │
│                                                               │
│ [Copy All Codes] [Refresh] [View Banned Players]            │
└─────────────────────────────────────────────────────────────┘
```

#### Features
- **Team Cards**: Expandable/collapsible showing all members
- **Captain Badge**: Visual indicator for team captain
- **Per-Player Actions**: Individual kick/ban buttons for each player
- **Team Info**: Team name, code, score, member count
- **Available Codes**: Quick access to unused team codes
- **Real-time Updates**: Subscribe to team_members changes

### 2. Captain Team Management (Team View)

#### UI Addition to Team Page
```
┌─────────────────────────────────────────────────────────────┐
│ Team Members (Captain Controls)                             │
├─────────────────────────────────────────────────────────────┤
│ 👑 You (Captain)                                             │
│ 👤 Bob                                            [Remove]   │
│ 👤 Charlie                                        [Remove]   │
│                                                               │
│ Team Code: 1234                              [Copy Code]     │
└─────────────────────────────────────────────────────────────┘
```

#### Features
- **Only visible to captain** - Regular members don't see this
- **Remove button** - Captain can kick team members (not ban)
- **Team code display** - Easy sharing for inviting more players
- **Member list** - See all current team members

### 3. Updated Edge Functions

#### A. `sessions-kick-player` (Enhanced)

**Current Behavior**: Deletes entire team
**New Behavior**: Removes individual player from team

```typescript
interface KickPlayerRequest {
  sessionId: string;
  teamId: string;
  userId: string;  // NEW: Specific user to kick
}

Flow:
1. Verify host permissions
2. Get team and check it's not the host team
3. Remove user from team_members table
4. If kicked user was captain:
   a. Check remaining members
   b. If members exist: Promote first member to captain
   c. If no members: Clear captain_id and uid (team becomes invisible)
5. Return success
```

**Key Changes**:
- Add `userId` parameter to specify who to kick
- Don't delete team, only remove from team_members
- Handle captain promotion logic
- Clear uid if team becomes empty

#### B. `sessions-ban-player` (Enhanced)

**Current Behavior**: Bans team captain by UID
**New Behavior**: Bans individual player and removes from team

```typescript
interface BanPlayerRequest {
  sessionId: string;
  teamId: string;
  userId: string;  // NEW: Specific user to ban
}

Flow:
1. Verify host permissions
2. Get user info from team_members
3. Remove user from team_members table
4. Add user to banned_teams table (by user_id, not team UID)
5. If banned user was captain:
   a. Promote next member OR clear captain if no members
6. Return success
```

**Key Changes**:
- Ban by `user_id` instead of team `uid`
- Allow multiple bans per session (different users)
- Handle captain promotion
- Update banned_teams schema to track user_id

#### C. `captain-kick-member` (NEW)

**Purpose**: Allow captains to remove members from their own team

```typescript
interface CaptainKickRequest {
  sessionId: string;
  teamId: string;
  userIdToKick: string;
}

Flow:
1. Verify caller is captain of the team
2. Verify userIdToKick is not the captain (can't kick self)
3. Verify userIdToKick is member of this team
4. Remove user from team_members
5. Return success
```

**Security**:
- Captain can only kick from their own team
- Captain cannot kick themselves
- Captain cannot ban (only host can ban)

#### D. `sessions-join` (Update)

**Add check for banned users**:

```typescript
// After getting userId, before joining team
const { data: isBanned } = await supabase
  .from('banned_teams')
  .select('id')
  .eq('session_id', sessionId)
  .eq('user_id', userId)
  .single();

if (isBanned) {
  throw new AppError(403, 'You are banned from this session', 'forbidden');
}
```

### 4. Database Schema Updates

#### Update `banned_teams` table
```sql
-- Add user_id column for individual player bans
ALTER TABLE banned_teams 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Update to allow multiple bans per session (remove unique constraint on uid)
-- Keep uid for backwards compatibility but add user_id as primary ban identifier

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_banned_teams_user_session 
ON banned_teams(user_id, session_id);
```

### 5. Component Implementation

#### A. `TeamsManager.tsx` (NEW - Replaces TeamCodesManager)

**Location**: `apps/event-platform/src/features/host/components/TeamsManager.tsx`

**Key Features**:
```typescript
interface TeamWithMembers {
  id: string;
  teamName: string;
  teamCode: string;
  score: number;
  captain: {
    id: string;
    name: string;
    userId: string;
  };
  members: Array<{
    id: string;
    name: string;
    userId: string;
    isCaptain: boolean;
    joinedAt: string;
  }>;
}

// ✅ OPTIMAL: Single query with all data (no need for team_codes table)
const fetchTeams = async () => {
  const { data } = await supabase
    .from('teams')
    .select(`
      id, team_name, team_code, score, uid, captain_id,
      team_members(
        id, user_id, player_name, is_captain, joined_at
      )
    `)
    .eq('session_id', sessionId)
    .order('joined_at', { ascending: true });
  
  // Separate available codes from active teams
  const availableCodes = data?.filter(t => t.uid === null) || [];
  const activeTeams = data?.filter(t => t.uid !== null) || [];
  
  return { availableCodes, activeTeams };
};

// Real-time subscription to teams and team_members
useEffect(() => {
  const teamsChannel = supabase
    .channel(`teams-management:${sessionId}`)
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'teams', filter: `session_id=eq.${sessionId}` },
      handleTeamChange
    )
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'team_members' },
      handleMemberChange
    )
    .subscribe();
    
  return () => { teamsChannel.unsubscribe(); };
}, [sessionId]);
```

**Note**: This approach **eliminates the need for the `team_codes` table** in queries. Available codes are simply teams where `uid IS NULL`.

**Actions**:
- `handleKickPlayer(teamId, userId)` - Calls sessions-kick-player
- `handleBanPlayer(teamId, userId)` - Calls sessions-ban-player
- `copyTeamCode(code)` - Copy individual code
- `copyAllCodes()` - Copy all available codes

#### B. `TeamMembersPanel.tsx` (NEW - For Captain View)

**Location**: `apps/event-platform/src/features/team/components/TeamMembersPanel.tsx`

**Key Features**:
```typescript
interface TeamMembersPanelProps {
  teamId: string;
  currentUserId: string;
  isCaptain: boolean;
}

// Only render if user is captain
if (!isCaptain) return null;

// Show team members with remove buttons
// Call captain-kick-member Edge Function
```

#### C. Update `HostPage.tsx`

```typescript
// Replace TeamCodesManager with TeamsManager
import { TeamsManager } from './components/TeamsManager';

// Change state variable name
const [showTeamsModal, setShowTeamsModal] = useState(false);

// Update button
<Button onClick={() => setShowTeamsModal(true)}>
  Teams
</Button>

// Update modal
<TeamsManager
  sessionId={sessionId}
  isOpen={showTeamsModal}
  onClose={() => setShowTeamsModal(false)}
  toast={addToast}
/>
```

#### D. Update `TeamPage.tsx`

```typescript
import { TeamMembersPanel } from './components/TeamMembersPanel';

// Add panel for captains
{currentTeam && (
  <TeamMembersPanel
    teamId={currentTeam.id}
    currentUserId={user?.id}
    isCaptain={currentTeam.uid === user?.id}
  />
)}
```

### 6. Service Layer Updates

#### A. `sessionService.ts` - Add new functions

```typescript
export async function kickPlayerFromTeam(
  sessionId: string,
  teamId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase.functions.invoke('sessions-kick-player', {
    body: { sessionId, teamId, userId }
  });
  if (error) throw error;
}

export async function banPlayerFromSession(
  sessionId: string,
  teamId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase.functions.invoke('sessions-ban-player', {
    body: { sessionId, teamId, userId }
  });
  if (error) throw error;
}

export async function captainKickMember(
  sessionId: string,
  teamId: string,
  userIdToKick: string
): Promise<void> {
  const { error } = await supabase.functions.invoke('captain-kick-member', {
    body: { sessionId, teamId, userIdToKick }
  });
  if (error) throw error;
}
```

## Implementation Phases

### Phase 1: Backend Foundation (Critical)
**Priority**: HIGH - Must be done first to prevent breaking changes

1. ✅ Update `banned_teams` schema with `user_id` column
2. ✅ Update `sessions-kick-player` to handle individual players
3. ✅ Update `sessions-ban-player` to ban by user_id
4. ✅ Create `captain-kick-member` Edge Function
5. ✅ Update `sessions-join` to check user_id bans
6. ✅ Add captain promotion logic to kick/ban functions

**Testing**: Verify kick/ban works without breaking existing teams

### Phase 2: Teams Modal (Host View)
**Priority**: HIGH - Main feature

1. ✅ Create `TeamsManager.tsx` component
2. ✅ Implement team fetching with members
3. ✅ Add real-time subscriptions
4. ✅ Implement kick/ban UI actions
5. ✅ Add team code management
6. ✅ Replace `TeamCodesManager` in `HostPage.tsx`

**Testing**: Host can see all teams, kick/ban individual players

### Phase 3: Captain Controls (Team View)
**Priority**: MEDIUM - Nice to have

1. ✅ Create `TeamMembersPanel.tsx` component
2. ✅ Add to `TeamPage.tsx` (captain only)
3. ✅ Implement captain kick functionality
4. ✅ Add team code display/copy

**Testing**: Captain can remove team members

### Phase 4: Polish & Edge Cases
**Priority**: LOW - Refinements

1. ✅ Add confirmation dialogs for kick/ban
2. ✅ Add loading states
3. ✅ Add error handling and toasts
4. ✅ Add animations for team member changes
5. ✅ Update banned teams modal to show user names
6. ✅ Add "promote to captain" button for host

## Edge Cases & Considerations

### 1. Kicking the Last Player
- If captain is last player and gets kicked → Team becomes invisible (uid = NULL)
- Team slot becomes available for new players
- Team is NOT deleted (preserves history)

### 2. Captain Leaves vs Kicked
- **Leaves**: Promotes next member automatically
- **Kicked by host**: Promotes next member automatically
- **Banned by host**: Promotes next member, adds to banned list

### 3. Mid-Game Kicks
- If kicked during answer phase: Answer is preserved (already submitted)
- If kicked during vote phase: Vote is preserved
- Team continues with remaining members
- If all members kicked: Team score frozen, no longer participates

### 4. Ban Persistence
- Bans are session-specific (user can join other sessions)
- Banned user cannot rejoin same session
- Ban survives team deletion
- Host can unban from Banned Teams modal

### 5. Captain Promotion Priority
- First member by `joined_at` timestamp
- If tie: First by `id` (UUID sort)
- New captain gets `is_captain = true` in team_members
- Team `captain_id` and `uid` updated

### 6. Race Conditions
- Use database transactions for kick + promote
- Real-time updates may show stale data briefly
- UI should handle missing team members gracefully

## Security Considerations

### Host Permissions
- Only session host can kick/ban players
- Verify `session.host_uid === caller_uid`
- Cannot kick/ban themselves

### Captain Permissions
- Only team captain can kick members
- Verify `team.captain_id === caller_uid`
- Cannot kick themselves
- Cannot ban (only host can ban)

### Player Permissions
- Regular members cannot kick anyone
- Can only leave voluntarily

### RLS Policies
- `team_members` table has RLS disabled (already done)
- `banned_teams` needs read access for join checks
- Edge Functions use service role for admin operations

## Migration Strategy

### Backwards Compatibility
1. Keep existing `TeamCodesManager` during development
2. Add new `TeamsManager` as separate component
3. Feature flag to switch between old/new
4. Test thoroughly before removing old component

### Data Migration
1. `banned_teams.user_id` is nullable initially
2. Backfill existing bans: `UPDATE banned_teams SET user_id = uid WHERE user_id IS NULL`
3. After backfill, make `user_id` NOT NULL

### Rollout Plan
1. Deploy backend changes first (kick/ban updates)
2. Test with old UI (should still work)
3. Deploy new Teams modal
4. Monitor for issues
5. Remove old TeamCodesManager after 1 week

## Success Metrics

### Functionality
- ✅ Host can see all team members
- ✅ Host can kick individual players
- ✅ Host can ban individual players
- ✅ Captain can remove team members
- ✅ Captain promotion works automatically
- ✅ Banned users cannot rejoin

### UX
- ✅ Real-time updates (< 1 second)
- ✅ Clear visual hierarchy (captain vs members)
- ✅ Intuitive kick/ban actions
- ✅ Confirmation dialogs prevent accidents
- ✅ Toast notifications for all actions

### Performance
- ✅ Modal loads in < 500ms
- ✅ Handles 50+ players smoothly
- ✅ Real-time updates don't cause lag

## Open Questions

1. **Should captains be able to ban?** 
   - Recommendation: No, only kick. Bans are host-level moderation.

2. **Should there be a "promote to captain" button for hosts?**
   - Recommendation: Yes, add in Phase 4 for manual captain changes.

3. **What happens if captain is kicked mid-answer?**
   - Recommendation: Answer is preserved, new captain can't re-submit.

4. **Should we show player join timestamps?**
   - Recommendation: Yes, helpful for debugging and captain promotion order.

5. **Limit on team size?**
   - Recommendation: No hard limit, but UI should handle 10+ members gracefully.

## Conclusion

This implementation transforms the team management system from a simple code distribution tool into a comprehensive team administration interface. The captain + multi-player system requires careful handling of kick/ban operations to maintain team integrity while providing granular control over individual players.

**Estimated Development Time**: 
- Phase 1 (Backend): 4-6 hours
- Phase 2 (Teams Modal): 6-8 hours  
- Phase 3 (Captain Controls): 3-4 hours
- Phase 4 (Polish): 2-3 hours
- **Total**: 15-21 hours

**Risk Level**: Medium
- Backend changes affect core game flow
- Real-time updates add complexity
- Captain promotion logic must be bulletproof
