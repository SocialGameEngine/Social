# Teams Technical Guide

## Overview

This comprehensive technical guide covers the team codes system, database architecture, API implementation, and technical specifications for the Social Game Engine's multi-player team functionality.

---

## System Architecture

### Current vs New System

#### Original System
- **1 device = 1 team = 1 team name**
- Each device creates a new team when joining
- No multi-device collaboration
- Simple session management

#### Enhanced System
- **Host creates session with 20 pre-generated team codes**
- **Multiple devices can join the same team using 4-digit team code**
- **First device to join becomes the "Answer Captain"**
- **Only the captain can submit answers**
- **All team members can vote and see team progress**

### Code Types

1. **Session Code (6 digits)**: e.g., "ABC123" - Used to create new teams
2. **Team Code (4 digits)**: e.g., "1234" - Used to join existing teams

---

## Database Schema

### Core Tables

#### `teams` Table (Updated)

```sql
CREATE TABLE public.teams (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  team_name text NOT NULL,
  uid uuid, -- Captain's user ID (null until first join)
  is_host boolean NOT NULL DEFAULT false,
  score integer NOT NULL DEFAULT 0,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  mascot_id integer NOT NULL,
  team_code text, -- 4-digit team code
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT teams_pkey PRIMARY KEY (id),
  CONSTRAINT teams_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id),
  CONSTRAINT teams_uid_fkey FOREIGN KEY (uid) REFERENCES public.users(id)
);
```

#### `team_codes` Table (New)

```sql
CREATE TABLE public.team_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  code text NOT NULL, -- 4-digit code
  team_id uuid, -- Assigned team (null initially)
  is_used boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT team_codes_pkey PRIMARY KEY (id),
  CONSTRAINT team_codes_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id),
  CONSTRAINT team_codes_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id),
  CONSTRAINT team_codes_code_session_unique UNIQUE (code, session_id)
);
```

#### `team_members` Table (Updated)

```sql
CREATE TABLE public.team_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  user_id uuid NOT NULL,
  is_captain boolean NOT NULL DEFAULT false,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  device_type text,
  user_agent text,
  ip_address inet,
  CONSTRAINT team_members_pkey PRIMARY KEY (id),
  CONSTRAINT team_members_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id),
  CONSTRAINT team_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT team_members_team_user_unique UNIQUE (team_id, user_id)
);
```

### Database Functions

#### `generate_team_codes` Function

```sql
CREATE OR REPLACE FUNCTION generate_team_codes(
  session_uuid uuid,
  num_codes integer DEFAULT 20
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  i integer;
  new_code text;
  code_exists boolean;
BEGIN
  FOR i IN 1..num_codes LOOP
    LOOP
      -- Generate 4-digit code
      new_code := LPAD(floor(random() * 10000)::text, 4, '0');
      
      -- Check if code already exists for this session
      SELECT EXISTS(
        SELECT 1 FROM team_codes 
        WHERE session_id = session_uuid AND code = new_code
      ) INTO code_exists;
      
      EXIT WHEN NOT code_exists;
    END LOOP;
    
    -- Insert the new code
    INSERT INTO team_codes (session_id, code)
    VALUES (session_uuid, new_code);
  END LOOP;
END;
$$;
```

#### `join_team_with_code` Function

```sql
CREATE OR REPLACE FUNCTION join_team_with_code(
  session_uuid uuid,
  team_code text,
  user_uuid uuid,
  team_name text DEFAULT NULL,
  device_type text DEFAULT NULL,
  user_agent text DEFAULT NULL,
  ip_address inet DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  team_record teams%ROWTYPE;
  is_new_team boolean := false;
  is_captain boolean := false;
  member_count integer;
BEGIN
  -- Find team by code
  SELECT t.* INTO team_record
  FROM teams t
  JOIN team_codes tc ON t.id = tc.team_id
  WHERE tc.session_id = session_uuid AND tc.code = team_code;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid team code');
  END IF;
  
  -- Check if team has captain
  SELECT COUNT(*) INTO member_count
  FROM team_members
  WHERE team_id = team_record.id AND is_captain = true;
  
  IF member_count = 0 THEN
    -- First member becomes captain
    is_captain := true;
    
    -- Update team with captain info
    UPDATE teams
    SET uid = user_uuid,
        team_name = COALESCE(team_name, team_name),
        updated_at = now()
    WHERE id = team_record.id;
  END IF;
  
  -- Add user as team member
  INSERT INTO team_members (team_id, user_id, is_captain, device_type, user_agent, ip_address)
  VALUES (team_record.id, user_uuid, is_captain, device_type, user_agent, ip_address)
  ON CONFLICT (team_id, user_id) DO NOTHING;
  
  RETURN json_build_object(
    'success', true,
    'team_id', team_record.id,
    'team_name', team_record.team_name,
    'team_code', team_code,
    'is_captain', is_captain,
    'member_count', (
      SELECT COUNT(*) FROM team_members WHERE team_id = team_record.id
    )
  );
END;
$$;
```

---

## API Implementation

### Session Creation with Team Codes

#### Endpoint: `POST /api/sessions/create`

```typescript
// File: supabase/functions/sessions-create/index.ts

export default async function handler(req: Request) {
  const { session_name, host_name, host_email } = await req.json();
  
  try {
    // Create session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        session_name,
        host_name,
        host_email,
        status: 'active',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (sessionError) throw sessionError;

    // Generate team codes
    const { error: codesError } = await supabase.rpc('generate_team_codes', {
      session_uuid: session.id,
      num_codes: 20
    });

    if (codesError) throw codesError;

    // Fetch generated codes and create teams
    const { data: teamCodes } = await supabase
      .from('team_codes')
      .select('code')
      .eq('session_id', session.id)
      .eq('is_used', false)
      .limit(20);

    const teamsToCreate = teamCodes.map((code, index) => ({
      session_id: session.id,
      team_name: `Team ${index + 1}`,
      uid: null, // Will be set when first user joins
      is_host: false,
      score: 0,
      joined_at: new Date().toISOString(),
      mascot_id: Math.floor(Math.random() * 6) + 1
    }));

    const { data: createdTeams } = await supabase
      .from('teams')
      .insert(teamsToCreate)
      .select();

    // Assign team codes to teams
    for (let i = 0; i < createdTeams.length; i++) {
      await supabase
        .from('team_codes')
        .update({ team_id: createdTeams[i].id, is_used: true })
        .eq('session_id', session.id)
        .eq('code', teamCodes[i].code);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        session: {
          ...session,
          teams: createdTeams.map((team, index) => ({
            ...team,
            team_code: teamCodes[index].code
          }))
        }
      }),
      { status: 200 }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500 }
    );
  }
}
```

### Team Join Endpoint

#### Endpoint: `POST /api/teams/join`

```typescript
// File: supabase/functions/teams-join/index.ts

export default async function handler(req: Request) {
  const { session_code, team_code, team_name, user_info } = await req.json();
  
  try {
    // Validate session code
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id')
      .eq('session_code', session_code)
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid session code' }),
        { status: 400 }
      );
    }

    // Create or get user
    let user;
    if (user_info.user_id) {
      // Existing user
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', user_info.user_id)
        .single();
      user = existingUser;
    } else {
      // Anonymous user
      const { data: newUser } = await supabase
        .from('users')
        .insert({
          display_name: user_info.display_name || 'Anonymous',
          is_anonymous: true,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      user = newUser;
    }

    // Join team with code
    const { data: result, error: joinError } = await supabase.rpc('join_team_with_code', {
      session_uuid: session.id,
      team_code: team_code,
      user_uuid: user.id,
      team_name: team_name,
      device_type: user_info.device_type,
      user_agent: user_info.user_agent,
      ip_address: user_info.ip_address
    });

    if (joinError) throw joinError;

    return new Response(
      JSON.stringify({ 
        success: true, 
        user,
        team: result 
      }),
      { status: 200 }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500 }
    );
  }
}
```

### Team Management Endpoints

#### `GET /api/teams/:session_id`

```typescript
export default async function handler(req: Request, { params }: { params: { session_id: string } }) {
  try {
    const { data: teams } = await supabase
      .from('teams')
      .select(`
        *,
        team_codes!inner(code),
        team_members(
          id,
          user_id,
          is_captain,
          joined_at,
          users(display_name, is_anonymous)
        )
      `)
      .eq('session_id', params.session_id)
      .order('created_at');

    return new Response(
      JSON.stringify({ success: true, teams }),
      { status: 200 }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500 }
    );
  }
}
```

#### `POST /api/teams/:team_id/kick-member`

```typescript
export default async function handler(req: Request, { params }: { params: { team_id: string } }) {
  const { user_id, kicked_by } = await req.json();
  
  try {
    // Check if kicker is captain or host
    const { data: kicker } = await supabase
      .from('team_members')
      .select('is_captain')
      .eq('team_id', params.team_id)
      .eq('user_id', kicked_by)
      .single();

    if (!kicker?.is_captain) {
      return new Response(
        JSON.stringify({ success: false, error: 'Only captains can kick members' }),
        { status: 403 }
      );
    }

    // Remove member
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', params.team_id)
      .eq('user_id', user_id);

    if (error) throw error;

    // If captain was kicked, promote next member
    const { data: remainingMembers } = await supabase
      .from('team_members')
      .select('user_id')
      .eq('team_id', params.team_id)
      .eq('is_captain', false)
      .limit(1);

    if (remainingMembers.length > 0) {
      await supabase
        .from('team_members')
        .update({ is_captain: true })
        .eq('team_id', params.team_id)
        .eq('user_id', remainingMembers[0].user_id);

      await supabase
        .from('teams')
        .update({ uid: remainingMembers[0].user_id })
        .eq('id', params.team_id);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200 }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500 }
    );
  }
}
```

---

## Frontend Implementation

### React Components

#### `TeamJoinForm.tsx`

```typescript
import React, { useState } from 'react';
import { supabase } from '../supabase/client';

interface TeamJoinFormProps {
  onJoinSuccess: (team: any) => void;
}

export const TeamJoinForm: React.FC<TeamJoinFormProps> = ({ onJoinSuccess }) => {
  const [sessionCode, setSessionCode] = useState('');
  const [teamCode, setTeamCode] = useState('');
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/teams/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_code: sessionCode.toUpperCase(),
          team_code: teamCode,
          team_name: teamName || undefined,
          user_info: {
            display_name: teamName || 'Anonymous',
            device_type: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop',
            user_agent: navigator.userAgent,
            ip_address: null // Will be set by server
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        onJoinSuccess(result.team);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to join team');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">
          Session Code (6 digits)
        </label>
        <input
          type="text"
          value={sessionCode}
          onChange={(e) => setSessionCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          className="w-full p-2 border rounded"
          placeholder="ABC123"
          maxLength={6}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Team Code (4 digits)
        </label>
        <input
          type="text"
          value={teamCode}
          onChange={(e) => setTeamCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
          className="w-full p-2 border rounded"
          placeholder="1234"
          maxLength={4}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Your Name (optional)
        </label>
        <input
          type="text"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="Enter your name"
        />
      </div>

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Joining...' : 'Join Team'}
      </button>
    </form>
  );
};
```

#### `TeamsManager.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';

interface Team {
  id: string;
  team_name: string;
  team_code: string;
  score: number;
  team_members: Array<{
    id: string;
    user_id: string;
    is_captain: boolean;
    users: {
      display_name: string;
      is_anonymous: boolean;
    };
  }>;
}

export const TeamsManager: React.FC<{ sessionId: string }> = ({ sessionId }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeams();
    
    // Subscribe to real-time updates
    const subscription = supabase
      .channel(`teams-${sessionId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'team_members' },
        () => loadTeams()
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, [sessionId]);

  const loadTeams = async () => {
    try {
      const response = await fetch(`/api/teams/${sessionId}`);
      const result = await response.json();
      
      if (result.success) {
        setTeams(result.teams);
      }
    } catch (error) {
      console.error('Failed to load teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKickMember = async (teamId: string, userId: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/kick-member`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, kicked_by: 'host-user-id' })
      });

      const result = await response.json();
      
      if (result.success) {
        // Team will be updated via real-time subscription
      }
    } catch (error) {
      console.error('Failed to kick member:', error);
    }
  };

  if (loading) return <div>Loading teams...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Teams Management</h2>
      
      <div className="grid gap-4">
        {teams.map((team) => (
          <div key={team.id} className="border rounded p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold">{team.team_name}</h3>
                <p className="text-sm text-gray-600">Code: {team.team_code}</p>
                <p className="text-sm">Score: {team.score} pts</p>
              </div>
            </div>
            
            <div className="space-y-1">
              {team.team_members.map((member) => (
                <div key={member.id} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <span>{member.is_captain ? '👑' : '👤'}</span>
                    <span>{member.users.display_name}</span>
                    {member.users.is_anonymous && <span className="text-gray-500">(Guest)</span>}
                  </div>
                  <button
                    onClick={() => handleKickMember(team.id, member.user_id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Kick
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## Real-time Implementation

### Supabase Real-time Subscriptions

#### Team Updates

```typescript
// Subscribe to team changes
const subscribeToTeamUpdates = (sessionId: string, callback: (teams: Team[]) => void) => {
  const subscription = supabase
    .channel(`teams-${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'team_members',
        filter: `team_id=eq.${sessionId}`
      },
      async (payload) => {
        // Refresh teams data
        const response = await fetch(`/api/teams/${sessionId}`);
        const result = await response.json();
        
        if (result.success) {
          callback(result.teams);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'teams',
        filter: `session_id=eq.${sessionId}`
      },
      async (payload) => {
        // Refresh teams data
        const response = await fetch(`/api/teams/${sessionId}`);
        const result = await response.json();
        
        if (result.success) {
          callback(result.teams);
        }
      }
    )
    .subscribe();

  return subscription;
};
```

#### Captain Status Updates

```typescript
// Monitor captain changes
const subscribeToCaptainChanges = (teamId: string, callback: (captain: string | null) => void) => {
  const subscription = supabase
    .channel(`captain-${teamId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'teams',
        filter: `id=eq.${teamId}`
      },
      (payload) => {
        if (payload.new && 'uid' in payload.new) {
          callback(payload.new.uid);
        }
      }
    )
    .subscribe();

  return subscription;
};
```

---

## Security Considerations

### Row Level Security (RLS)

#### Teams Table RLS

```sql
-- Allow users to see teams in their session
CREATE POLICY "Users can view teams in their session" ON teams
  FOR SELECT USING (
    session_id IN (
      SELECT id FROM sessions WHERE status = 'active'
    )
  );

-- Allow team captains to update their team
CREATE POLICY "Captains can update their team" ON teams
  FOR UPDATE USING (
    uid = auth.uid()
  );
```

#### Team Members Table RLS

```sql
-- Allow users to see members of teams in their session
CREATE POLICY "Users can view team members in their session" ON team_members
  FOR SELECT USING (
    team_id IN (
      SELECT id FROM teams WHERE session_id IN (
        SELECT id FROM sessions WHERE status = 'active'
      )
    )
  );

-- Allow users to join teams
CREATE POLICY "Users can join teams" ON team_members
  FOR INSERT WITH CHECK (true);

-- Allow captains to remove members from their team
CREATE POLICY "Captains can remove team members" ON team_members
  FOR DELETE USING (
    team_id IN (
      SELECT id FROM teams WHERE uid = auth.uid()
    )
  );
```

### Input Validation

#### Team Code Validation

```typescript
const validateTeamCode = (code: string): boolean => {
  // Must be exactly 4 digits
  return /^\d{4}$/.test(code);
};

const validateSessionCode = (code: string): boolean => {
  // Must be exactly 6 alphanumeric characters
  return /^[A-Z0-9]{6}$/.test(code.toUpperCase());
};
```

#### Rate Limiting

```typescript
// Implement rate limiting for team joins
const joinAttempts = new Map<string, { count: number; lastAttempt: number }>();

const checkRateLimit = (identifier: string, maxAttempts = 5, windowMs = 60000): boolean => {
  const now = Date.now();
  const attempts = joinAttempts.get(identifier) || { count: 0, lastAttempt: 0 };
  
  if (now - attempts.lastAttempt > windowMs) {
    // Reset window
    joinAttempts.set(identifier, { count: 1, lastAttempt: now });
    return true;
  }
  
  if (attempts.count >= maxAttempts) {
    return false;
  }
  
  joinAttempts.set(identifier, { 
    count: attempts.count + 1, 
    lastAttempt: now 
  });
  
  return true;
};
```

---

## Performance Optimization

### Database Indexes

```sql
-- Performance indexes for team operations
CREATE INDEX CONCURRENTLY idx_teams_session_id ON teams(session_id);
CREATE INDEX CONCURRENTLY idx_teams_uid ON teams(uid);
CREATE INDEX CONCURRENTLY idx_team_codes_session_code ON team_codes(session_id, code);
CREATE INDEX CONCURRENTLY idx_team_members_team_id ON team_members(team_id);
CREATE INDEX CONCURRENTLY idx_team_members_user_id ON team_members(user_id);
CREATE INDEX CONCURRENTLY idx_team_members_captain ON team_members(is_captain) WHERE is_captain = true;
```

### Query Optimization

```typescript
// Optimized team loading with single query
const loadTeamsOptimized = async (sessionId: string) => {
  const { data } = await supabase
    .from('teams')
    .select(`
      id,
      team_name,
      team_code:team_codes!inner(code),
      score,
      team_members(
        id,
        user_id,
        is_captain,
        users(display_name, is_anonymous)
      )
    `)
    .eq('session_id', sessionId)
    .order('created_at');

  return data;
};
```

### Caching Strategy

```typescript
// Cache team data for 30 seconds
const teamCache = new Map<string, { data: Team[]; timestamp: number }>();

const getCachedTeams = (sessionId: string): Team[] | null => {
  const cached = teamCache.get(sessionId);
  const now = Date.now();
  
  if (cached && (now - cached.timestamp) < 30000) {
    return cached.data;
  }
  
  return null;
};

const setCachedTeams = (sessionId: string, data: Team[]): void => {
  teamCache.set(sessionId, { data, timestamp: Date.now() });
};
```

---

## Testing Strategy

### Unit Tests

```typescript
describe('Team Code Generation', () => {
  it('should generate unique 4-digit codes', async () => {
    const sessionId = 'test-session-id';
    
    const { data: codes } = await supabase.rpc('generate_team_codes', {
      session_uuid: sessionId,
      num_codes: 20
    });
    
    expect(codes).toHaveLength(20);
    
    // Check all codes are unique
    const uniqueCodes = new Set(codes.map(c => c.code));
    expect(uniqueCodes.size).toBe(20);
    
    // Check all codes are 4 digits
    codes.forEach(code => {
      expect(/^\d{4}$/.test(code.code)).toBe(true);
    });
  });
});
```

### Integration Tests

```typescript
describe('Team Join Flow', () => {
  let session: any;
  let teams: any[];

  beforeAll(async () => {
    // Create test session with teams
    session = await createTestSession();
    teams = await generateTestTeams(session.id);
  });

  it('should allow first user to become captain', async () => {
    const user = await createTestUser();
    const teamCode = teams[0].code;
    
    const result = await joinTeam(session.session_code, teamCode, user);
    
    expect(result.success).toBe(true);
    expect(result.team.is_captain).toBe(true);
    expect(result.team.member_count).toBe(1);
  });

  it('should allow additional users to join as members', async () => {
    const captain = await createTestUser();
    const member = await createTestUser();
    const teamCode = teams[1].code;
    
    // Captain joins first
    await joinTeam(session.session_code, teamCode, captain);
    
    // Member joins
    const result = await joinTeam(session.session_code, teamCode, member);
    
    expect(result.success).toBe(true);
    expect(result.team.is_captain).toBe(false);
    expect(result.team.member_count).toBe(2);
  });
});
```

---

## Troubleshooting

### Common Issues

#### Team Code Not Found
```sql
-- Check if team code exists
SELECT tc.code, t.team_name, tc.is_used
FROM team_codes tc
LEFT JOIN teams t ON tc.team_id = t.id
WHERE tc.session_id = $1 AND tc.code = $2;
```

#### Captain Promotion Issues
```sql
-- Check team captain status
SELECT t.uid as captain_id, tm.user_id, tm.is_captain
FROM teams t
LEFT JOIN team_members tm ON t.id = tm.team_id
WHERE t.id = $1;
```

#### Real-time Updates Not Working
```typescript
// Debug subscription
supabase
  .channel('debug')
  .on('system', {}, (payload) => {
    console.log('System event:', payload);
  })
  .subscribe();
```

---

*This technical guide provides comprehensive coverage of the team system implementation, from database design to frontend components and real-time functionality.*
