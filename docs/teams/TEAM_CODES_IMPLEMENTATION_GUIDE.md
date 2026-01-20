# Team Codes & Answer Captain System - Implementation Guide

## Overview
This guide provides a complete implementation plan for adding team codes and the Answer Captain system, allowing multiple devices to join the same team while maintaining game integrity through designated answer submission control.

## System Design

### Current System
- 1 device = 1 team = 1 team name
- Each device creates a new team when joining
- No multi-device collaboration

### New System
- Host creates session with 20 pre-generated team codes
- Multiple devices can join the same team using a 4-digit team code
- First device to join becomes the "Answer Captain"
- Only the captain can submit answers
- All team members can vote and see team progress

## Architecture

### Code Types
1. **Session Code (6 digits)**: e.g., "ABC123" - Used to create new teams
2. **Team Code (4 digits)**: e.g., "1234" - Used to join existing teams

### User Flows

#### Flow 1: Creating a New Team (First Device)
```
1. User enters 6-digit session code + team name
2. System creates new team
3. System assigns unused 4-digit team code to team
4. User becomes Answer Captain
5. User sees team code to share with teammates
```

#### Flow 2: Joining Existing Team (Additional Devices)
```
1. User enters 4-digit team code
2. System finds team by code
3. System adds user as team member
4. User joins as regular member (not captain)
5. User sees captain's name and member count
```

## Database Schema Changes

### Phase 1: Core Tables

#### 1. Update `teams` table
```sql
ALTER TABLE teams 
ADD COLUMN team_code VARCHAR(4) UNIQUE,
ADD COLUMN captain_id UUID REFERENCES auth.users(id),
ADD COLUMN max_teams INTEGER DEFAULT 20;
```

#### 2. Create `team_codes` table
```sql
CREATE TABLE IF NOT EXISTS team_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(4) UNIQUE NOT NULL,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_at TIMESTAMP WITH TIME ZONE,
    is_used BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_team_codes_session ON team_codes(session_id);
CREATE INDEX idx_team_codes_team ON team_codes(team_id);
CREATE INDEX idx_team_codes_code ON team_codes(code);
CREATE INDEX idx_teams_session_code ON teams(session_id, team_code);
```

#### 3. Create `team_members` table
```sql
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_captain BOOLEAN DEFAULT FALSE,
    
    UNIQUE(team_id, user_id, device_id)
);

CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_team_members_device ON team_members(device_id);
CREATE INDEX idx_team_members_captain ON team_members(team_id, is_captain);
```

### Phase 2: Row Level Security (RLS)

```sql
-- Team codes RLS
ALTER TABLE team_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team codes are viewable by session participants" ON team_codes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.session_id = team_codes.session_id
        )
    );

-- Team members RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their team members" ON team_members
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM team_members 
            WHERE team_id = team_members.team_id
        )
    );

CREATE POLICY "Users can join teams" ON team_members
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Captains can manage team members" ON team_members
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT captain_id FROM teams 
            WHERE id = team_id
        )
    );
```

### Phase 3: Database Functions

#### Generate Team Codes
```sql
CREATE OR REPLACE FUNCTION generate_team_codes(session_uuid UUID, num_codes INTEGER DEFAULT 20)
RETURNS VOID AS $$
DECLARE
    i INTEGER;
    new_code VARCHAR(4);
    code_exists BOOLEAN;
BEGIN
    FOR i IN 1..num_codes LOOP
        LOOP
            new_code := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
            
            SELECT EXISTS(
                SELECT 1 FROM team_codes 
                WHERE session_id = session_uuid AND code = new_code
            ) INTO code_exists;
            
            EXIT WHEN NOT code_exists;
        END LOOP;
        
        INSERT INTO team_codes (code, session_id)
        VALUES (new_code, session_uuid);
    END LOOP;
END;
$$ LANGUAGE plpgsql;
```

#### Assign Team Code
```sql
CREATE OR REPLACE FUNCTION assign_team_code(team_uuid UUID)
RETURNS VARCHAR(4) AS $$
DECLARE
    assigned_code VARCHAR(4);
BEGIN
    UPDATE team_codes 
    SET team_id = team_uuid, 
        assigned_at = NOW(), 
        is_used = TRUE
    WHERE id = (
        SELECT id FROM team_codes 
        WHERE session_id = (SELECT session_id FROM teams WHERE id = team_uuid)
        AND is_used = FALSE
        ORDER BY created_at ASC
        LIMIT 1
    )
    RETURNING code INTO assigned_code;
    
    UPDATE teams 
    SET team_code = assigned_code 
    WHERE id = team_uuid;
    
    RETURN assigned_code;
END;
$$ LANGUAGE plpgsql;
```

#### Auto-Assign Captain
```sql
CREATE OR REPLACE FUNCTION assign_team_captain()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM team_members WHERE team_id = NEW.team_id) = 1 THEN
        UPDATE teams 
        SET captain_id = NEW.user_id 
        WHERE id = NEW.team_id;
        
        NEW.is_captain = TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_assign_team_captain
    AFTER INSERT ON team_members
    FOR EACH ROW
    EXECUTE FUNCTION assign_team_captain();
```

#### Transfer Captain
```sql
CREATE OR REPLACE FUNCTION transfer_captain(
    current_team_id UUID,
    new_captain_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    is_member BOOLEAN;
    current_captain UUID;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM team_members 
        WHERE team_id = current_team_id 
        AND user_id = new_captain_user_id
    ) INTO is_member;
    
    IF NOT is_member THEN
        RETURN FALSE;
    END IF;
    
    SELECT captain_id INTO current_captain 
    FROM teams 
    WHERE id = current_team_id;
    
    UPDATE teams 
    SET captain_id = new_captain_user_id 
    WHERE id = current_team_id;
    
    UPDATE team_members 
    SET is_captain = CASE 
        WHEN user_id = new_captain_user_id THEN TRUE
        WHEN user_id = current_captain THEN FALSE
        ELSE is_captain
    END
    WHERE team_id = current_team_id 
    AND user_id IN (new_captain_user_id, current_captain);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

## Backend Implementation

### Phase 1: Update Session Creation

**File**: `supabase/functions/sessions-create/index.ts`

```typescript
// After creating session, generate team codes
const { data: session, error: sessionError } = await supabase
  .from("sessions")
  .insert({
    code,
    host_uid: userId,
    venue_name: venueName || null,
    status: "lobby",
    settings,
    category_grid: categoryGrid,
    max_teams: 20,
  })
  .select()
  .single()

if (sessionError || !session) {
  return new Response(
    JSON.stringify({ error: "Failed to create session" }),
    { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  )
}

// Generate team codes for this session
const { error: codesError } = await supabase.rpc('generate_team_codes', {
  session_uuid: session.id,
  num_codes: 20
})

if (codesError) {
  console.error("Failed to generate team codes:", codesError)
  // Non-fatal error, continue with session creation
}
```

### Phase 2: Update Join Session Logic

**File**: `supabase/functions/sessions-join/index.ts`

```typescript
interface JoinSessionRequest {
  code: string; // Can be 6-digit session code OR 4-digit team code
  teamName?: string; // Only required for session codes
  deviceId?: string; // For team member tracking
}

serve(async (req) => {
  const { code, teamName, deviceId }: JoinSessionRequest = await req.json()
  
  // Get authenticated user
  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')
  const { data: { user } } = await supabase.auth.getUser(token)
  
  if (!user) {
    return new Response(
      JSON.stringify({ error: "Authentication required" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
  
  const normalizedCode = code.trim().toUpperCase()
  const isSessionCode = normalizedCode.length === 6
  const isTeamCode = normalizedCode.length === 4
  
  if (isSessionCode) {
    // EXISTING LOGIC: Create new team
    if (!teamName) {
      return new Response(
        JSON.stringify({ error: "Team name required for session codes" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }
    
    // ... existing session join logic ...
    // After creating team, add creator as team member
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: newTeam.id,
        user_id: user.id,
        device_id: deviceId || 'default',
        is_captain: true
      })
    
    return new Response(
      JSON.stringify({
        success: true,
        sessionId: session.id,
        teamId: newTeam.id,
        teamName: newTeam.team_name,
        teamCode: newTeam.team_code,
        isCaptain: true,
        session: { /* session data */ },
        team: { /* team data */ }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
    
  } else if (isTeamCode) {
    // NEW LOGIC: Join existing team
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select("id, team_name, session_id, captain_id, sessions!inner(code, status)")
      .eq("team_code", normalizedCode)
      .single()
    
    if (teamError || !team) {
      return new Response(
        JSON.stringify({ error: "Team code not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }
    
    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', team.id)
      .eq('user_id', user.id)
      .eq('device_id', deviceId || 'default')
      .single()
    
    if (existingMember) {
      // User already joined, just return team info
      return new Response(
        JSON.stringify({
          success: true,
          sessionId: team.session_id,
          teamId: team.id,
          teamName: team.team_name,
          teamCode: normalizedCode,
          isCaptain: team.captain_id === user.id,
          isMember: true,
          alreadyJoined: true
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }
    
    // Add user as team member
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: user.id,
        device_id: deviceId || 'default',
        is_captain: false
      })
    
    if (memberError) {
      console.error("Error adding team member:", memberError)
      return new Response(
        JSON.stringify({ error: "Failed to join team" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        sessionId: team.session_id,
        teamId: team.id,
        teamName: team.team_name,
        teamCode: normalizedCode,
        isCaptain: false,
        isMember: true,
        session: { /* session data */ },
        team: { /* team data */ }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
    
  } else {
    return new Response(
      JSON.stringify({ error: "Invalid code format" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
```

## Frontend Implementation

### Phase 1: Team Codes Manager Component

**File**: `apps/event-platform/src/features/host/components/TeamCodesManager.tsx`

**Features**:
- Display all team codes (available and used)
- Show team name and member count for used codes
- Copy individual codes or all available codes
- Real-time refresh capability
- Summary statistics (available/used/total)

**Key Functions**:
```typescript
const fetchTeamCodes = async () => {
  const { data: codes } = await supabase
    .from('team_codes')
    .select('*, teams(team_name)')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
  
  // Get member counts for each team
  const codesWithMembers = await Promise.all(
    codes.map(async (code) => {
      if (code.team_id) {
        const { count } = await supabase
          .from('team_members')
          .select('*', { count: 'exact', head: true })
          .eq('team_id', code.team_id)
        return { ...code, memberCount: count }
      }
      return code
    })
  )
  
  setTeamCodes(codesWithMembers)
}

const copyAllCodes = () => {
  const availableCodes = teamCodes
    .filter(code => !code.isUsed)
    .map(code => code.code)
    .join('\n')
  
  navigator.clipboard.writeText(availableCodes)
  toast({ title: "Team codes copied", variant: "success" })
}
```

### Phase 2: Update Join Form

**File**: `apps/event-platform/src/features/team/Phases/JoinForm.tsx`

```typescript
const handleJoin = async () => {
  const code = joinForm.code.trim()
  
  if (code.length === 6) {
    // Session code - need team name
    if (!joinForm.teamName.trim()) {
      setJoinErrors({ teamName: "Team name required" })
      return
    }
    await attemptJoin({ 
      code, 
      teamName: joinForm.teamName,
      deviceId: getDeviceId() 
    })
  } else if (code.length === 4) {
    // Team code - no team name needed
    await attemptJoin({ 
      code,
      deviceId: getDeviceId() 
    })
  } else {
    setJoinErrors({ code: "Code must be 4 or 6 characters" })
  }
}

// Update UI to show different instructions
<div className="space-y-2">
  <label>Enter Code</label>
  <input 
    value={joinForm.code}
    onChange={(e) => setJoinForm({ ...joinForm, code: e.target.value })}
    placeholder="Session code (6 digits) or Team code (4 digits)"
  />
  
  {joinForm.code.length === 6 && (
    <>
      <label>Team Name</label>
      <input 
        value={joinForm.teamName}
        onChange={(e) => setJoinForm({ ...joinForm, teamName: e.target.value })}
        placeholder="Choose your team name"
      />
    </>
  )}
  
  {joinForm.code.length === 4 && (
    <p className="text-sm text-slate-600">
      Joining existing team with code {joinForm.code}
    </p>
  )}
</div>
```

### Phase 3: Captain vs Member Views

**File**: `apps/event-platform/src/features/team/Phases/AnswerPhase.tsx`

```typescript
interface AnswerPhaseProps {
  // ... existing props
  isCaptain: boolean;
  captainName?: string;
  memberCount: number;
  teamCode: string;
}

export function AnswerPhase({ 
  isCaptain, 
  captainName, 
  memberCount,
  teamCode,
  // ... other props
}: AnswerPhaseProps) {
  
  if (isCaptain) {
    // CAPTAIN VIEW: Full answer controls
    return (
      <Card>
        <div className="space-y-4">
          {/* Captain Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">👑</span>
              <span className="font-semibold">You are the Answer Captain</span>
            </div>
            <div className="text-sm text-slate-600">
              {memberCount} team member{memberCount !== 1 ? 's' : ''}
            </div>
          </div>
          
          {/* Team Code Display */}
          <div className="p-3 bg-slate-100 rounded-lg">
            <div className="text-xs text-slate-600 mb-1">Team Code</div>
            <div className="font-mono text-2xl font-bold text-slate-900">
              {teamCode}
            </div>
            <button 
              onClick={() => copyTeamCode(teamCode)}
              className="text-xs text-blue-600 mt-1"
            >
              Copy to share with teammates
            </button>
          </div>
          
          {/* Answer Input */}
          <div>
            <label>Your Answer</label>
            <textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Type your answer here..."
              className="w-full p-3 border rounded-lg"
            />
          </div>
          
          <Button onClick={submitAnswer} disabled={isSubmitting}>
            Submit Answer
          </Button>
          
          {/* Transfer Captain Button */}
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowTransferModal(true)}
          >
            Transfer Captain Role
          </Button>
        </div>
      </Card>
    )
  } else {
    // MEMBER VIEW: Read-only with captain info
    return (
      <Card>
        <div className="space-y-4">
          {/* Member Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">👥</span>
              <span className="font-semibold">Team Member</span>
            </div>
            <div className="text-sm text-slate-600">
              {memberCount} member{memberCount !== 1 ? 's' : ''}
            </div>
          </div>
          
          {/* Team Code Display */}
          <div className="p-3 bg-slate-100 rounded-lg">
            <div className="text-xs text-slate-600 mb-1">Team Code</div>
            <div className="font-mono text-2xl font-bold text-slate-900">
              {teamCode}
            </div>
          </div>
          
          {/* Captain Info */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">👑</span>
              <span className="font-semibold text-blue-900">
                {captainName} is the Answer Captain
              </span>
            </div>
            <p className="text-sm text-blue-700">
              Only the captain can submit answers for your team. 
              You can still vote and see all team progress!
            </p>
          </div>
          
          {/* Request Captain Button */}
          <Button 
            variant="secondary"
            onClick={() => requestCaptainRole()}
          >
            Request Captain Role
          </Button>
        </div>
      </Card>
    )
  }
}
```

### Phase 4: Captain Transfer Modal

**File**: `apps/event-platform/src/features/team/components/TransferCaptainModal.tsx`

```typescript
export function TransferCaptainModal({ 
  isOpen, 
  onClose, 
  teamId, 
  currentMembers 
}: TransferCaptainModalProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [isTransferring, setIsTransferring] = useState(false)
  
  const handleTransfer = async () => {
    if (!selectedMemberId) return
    
    setIsTransferring(true)
    try {
      const { data, error } = await supabase.rpc('transfer_captain', {
        current_team_id: teamId,
        new_captain_user_id: selectedMemberId
      })
      
      if (error) throw error
      
      toast({ 
        title: "Captain role transferred successfully", 
        variant: "success" 
      })
      onClose()
    } catch (error) {
      toast({ 
        title: "Failed to transfer captain role", 
        variant: "error" 
      })
    } finally {
      setIsTransferring(false)
    }
  }
  
  return (
    <Modal open={isOpen} onClose={onClose} title="Transfer Captain Role">
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Select a team member to transfer the Answer Captain role to:
        </p>
        
        <div className="space-y-2">
          {currentMembers.map((member) => (
            <button
              key={member.id}
              onClick={() => setSelectedMemberId(member.userId)}
              className={`w-full p-3 rounded-lg border text-left transition ${
                selectedMemberId === member.userId
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-300 hover:border-slate-400'
              }`}
            >
              <div className="font-semibold">{member.userName}</div>
              <div className="text-xs text-slate-500">
                Joined {formatTimeAgo(member.joinedAt)}
              </div>
            </button>
          ))}
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={handleTransfer} 
            disabled={!selectedMemberId || isTransferring}
            isLoading={isTransferring}
          >
            Transfer Captain Role
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  )
}
```

### Phase 5: Update Team State Management

**File**: `apps/event-platform/src/features/team/hooks/useTeamState.ts`

```typescript
// Add to team state
interface TeamState {
  // ... existing state
  isCaptain: boolean;
  captainId: string | null;
  captainName: string | null;
  memberCount: number;
  teamCode: string | null;
  teamMembers: TeamMember[];
}

// Fetch team members
const fetchTeamMembers = async (teamId: string) => {
  const { data, error } = await supabase
    .from('team_members')
    .select('*, users(display_name)')
    .eq('team_id', teamId)
    .order('joined_at', { ascending: true })
  
  if (error) {
    console.error('Error fetching team members:', error)
    return []
  }
  
  return data
}

// Subscribe to team member changes
useEffect(() => {
  if (!teamId) return
  
  const channel = supabase
    .channel(`team-members:${teamId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'team_members',
        filter: `team_id=eq.${teamId}`
      },
      () => {
        // Refetch team members when changes occur
        fetchTeamMembers(teamId).then(setTeamMembers)
      }
    )
    .subscribe()
  
  return () => {
    channel.unsubscribe()
  }
}, [teamId])
```

## Testing Checklist

### Database Tests
- [ ] Team codes are generated on session creation (20 codes)
- [ ] Team codes are unique within a session
- [ ] Team code assignment works correctly
- [ ] Captain is auto-assigned to first team member
- [ ] Captain transfer function works
- [ ] RLS policies prevent unauthorized access
- [ ] Triggers fire correctly on team member insert

### Backend Tests
- [ ] Session creation generates team codes
- [ ] Join with 6-digit code creates new team
- [ ] Join with 4-digit code joins existing team
- [ ] Cannot join with invalid team code
- [ ] Cannot join team twice with same device
- [ ] Team member count updates correctly
- [ ] Captain status is tracked correctly

### Frontend Tests
- [ ] Team Codes Manager displays correctly
- [ ] Copy codes functionality works
- [ ] Join form detects code type (4 vs 6 digits)
- [ ] Captain view shows answer input
- [ ] Member view shows read-only state
- [ ] Team code is displayed to all members
- [ ] Member count updates in real-time
- [ ] Captain transfer modal works
- [ ] Request captain functionality works

### Integration Tests
- [ ] Full flow: Create session → Generate codes → Join team → Add members
- [ ] Multiple devices can join same team
- [ ] Only captain can submit answers
- [ ] All members can vote
- [ ] Captain transfer updates UI for all members
- [ ] Team member disconnect/reconnect works
- [ ] Session end cleans up team members

### Edge Cases
- [ ] What happens if captain disconnects?
- [ ] Can handle 20+ teams in a session?
- [ ] Team code exhaustion (all 20 used)
- [ ] Rapid team member joins
- [ ] Captain transfer during answer phase
- [ ] Team member joins during active game

## Deployment Plan

### Pre-deployment
1. **Database Migration**
   - Run all SQL migrations in staging
   - Verify tables and indexes created
   - Test RLS policies
   - Verify functions work correctly

2. **Backend Deployment**
   - Deploy updated edge functions
   - Test session creation
   - Test join flows (both code types)
   - Monitor error logs

3. **Frontend Deployment**
   - Deploy TeamCodesManager component
   - Deploy updated join form
   - Deploy captain/member views
   - Test in staging environment

### Deployment Steps
1. Deploy database migrations
2. Deploy backend edge functions
3. Deploy frontend changes
4. Monitor error rates
5. Test with real users in staging
6. Deploy to production
7. Monitor metrics and user feedback

### Post-deployment
1. Monitor team code generation
2. Track join success rates
3. Monitor captain transfers
4. Gather user feedback
5. Track multi-device usage patterns

## Rollback Plan

If issues arise:

1. **Database**: Keep old schema, new columns nullable
2. **Backend**: Feature flag to disable team codes
3. **Frontend**: Fallback to single-device teams
4. **Communication**: Notify users of temporary change

## Future Enhancements

### Phase 2 Features
1. **Auto-promote captain** if original captain disconnects
2. **Captain voting** - team votes on captain
3. **Co-captain role** - backup answer submitter
4. **Team chat** - communication between members
5. **Activity indicators** - show who's online
6. **Team statistics** - track member contributions
7. **Custom team codes** - let teams choose their code
8. **QR code generation** - easy team joining

### Analytics
- Track average team size
- Monitor captain transfer frequency
- Measure multi-device adoption rate
- Track team collaboration patterns

## Summary

This implementation enables:
- ✅ **Multi-device teams** - Multiple players per team
- ✅ **Answer Captain system** - Controlled answer submission
- ✅ **Team code management** - Host visibility and control
- ✅ **Scalable architecture** - Supports 20 teams per session
- ✅ **Real-time updates** - Live member count and status
- ✅ **Captain transfer** - Flexible team leadership
- ✅ **Clean separation** - Captain vs member permissions

**Estimated Implementation Time**: 20-30 hours
**Complexity**: High
**Impact**: Transformative - enables true team collaboration

## Support & Maintenance

### Common Issues
- **Issue**: Team code not working
  - **Fix**: Check if code is assigned and not expired
  
- **Issue**: Captain can't submit
  - **Fix**: Verify captain_id matches user_id
  
- **Issue**: Member count incorrect
  - **Fix**: Refresh team_members query

### Monitoring
- Set up alerts for team code exhaustion
- Monitor captain transfer success rates
- Track team member connection issues
- Log all team code operations
