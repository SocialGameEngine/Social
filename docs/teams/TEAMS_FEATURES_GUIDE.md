# Teams Features Guide

## Overview

This comprehensive features guide covers all team functionality including user join flows, captain system, member management, kick/ban features, and anonymous user support for the Social Game Engine's multi-player team system.

---

## User Experience Flows

### Flow 1: Creating a New Team (First Device)

```
1. User enters 6-digit session code + team name
2. System creates new team
3. System assigns unused 4-digit team code to team
4. User becomes Answer Captain
5. User sees team code to share with teammates
```

**UI Experience:**
- Clean join form with session code and team name inputs
- Real-time validation of codes
- Success screen showing team code and captain status
- Share functionality for team code

### Flow 2: Joining Existing Team (Additional Devices)

```
1. User enters 4-digit team code
2. System finds team by code
3. System adds user as team member
4. User joins as regular member (not captain)
5. User sees captain's name and member count
```

**UI Experience:**
- Simplified join form with just team code
- Team preview showing current members
- Clear indication of member vs captain status
- Real-time member count updates

### Flow 3: Anonymous User Support

```
1. User joins without authentication
2. System creates anonymous user record
3. User can participate with limited features
4. Option to upgrade to full account later
```

---

## Captain System

### Captain Responsibilities

#### Answer Submission Control
- **Only captains can submit answers** during game rounds
- Prevents duplicate submissions from team members
- Ensures team consensus before submission
- Clear UI indication of captain status

#### Team Management
- **Kick team members** (with confirmation)
- **Promote new captain** when leaving
- **Manage team settings** (name, privacy)
- **View team analytics** and performance

#### Captain Privileges
- 👑 Crown icon next to name
- Special UI controls for answer submission
- Team management dashboard
- Priority in team communications

### Captain Promotion Logic

#### Automatic Promotion
```typescript
const promoteNextCaptain = async (teamId: string): Promise<void> => {
  // Get remaining team members (excluding current captain)
  const { data: members } = await supabase
    .from('team_members')
    .select('user_id, joined_at')
    .eq('team_id', teamId)
    .eq('is_captain', false)
    .order('joined_at', { ascending: true })
    .limit(1);

  if (members && members.length > 0) {
    // Promote earliest joined member
    const newCaptain = members[0];
    
    await supabase
      .from('team_members')
      .update({ is_captain: true })
      .eq('team_id', teamId)
      .eq('user_id', newCaptain.user_id);

    await supabase
      .from('teams')
      .update({ uid: newCaptain.user_id })
      .eq('id', teamId);

    // Notify team of captain change
    await notifyCaptainChange(teamId, newCaptain.user_id);
  }
};
```

#### Captain Transfer
- **Voluntary transfer**: Captain can promote another member
- **Automatic transfer**: When captain leaves or is kicked
- **Emergency transfer**: When captain is inactive for 5+ minutes

---

## Team Member Management

### Member Roles

#### Captain (👑)
- Submit answers during rounds
- Kick/promote team members
- Manage team settings
- View detailed analytics

#### Regular Member (👤)
- Vote on answers
- View team progress
- Participate in discussions
- Request to become captain

#### Anonymous Member (👤‍🟦)
- Limited voting rights
- Cannot submit answers
- Can upgrade to full account
- Temporary team participation

### Member Actions

#### Joining Teams
```typescript
interface JoinTeamRequest {
  session_code: string;
  team_code: string;
  team_name?: string;
  user_info: {
    display_name?: string;
    device_type: 'mobile' | 'desktop' | 'tablet';
    user_agent: string;
    ip_address?: string;
  };
}
```

#### Leaving Teams
- **Graceful leave**: Member removes themselves
- **Captain leave**: Promotes successor before leaving
- **Forced leave**: Kicked by captain or host
- **Session end**: All teams disbanded

#### Member Status
- **Active**: Currently participating
- **Away**: Temporarily disconnected
- **Inactive**: No activity for 10+ minutes
- **Banned**: Removed by host

---

## Kick & Ban System

### Kick Functionality

#### Captain-Initiated Kicks
```typescript
const kickTeamMember = async (
  teamId: string, 
  memberId: string, 
  captainId: string
): Promise<{ success: boolean; message: string }> => {
  // Verify captain permissions
  const { data: captain } = await supabase
    .from('team_members')
    .select('is_captain')
    .eq('team_id', teamId)
    .eq('user_id', captainId)
    .single();

  if (!captain?.is_captain) {
    return { success: false, message: 'Only captains can kick members' };
  }

  // Cannot kick yourself
  if (memberId === captainId) {
    return { success: false, message: 'Cannot kick yourself' };
  }

  // Remove member
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('user_id', memberId);

  if (error) {
    return { success: false, message: 'Failed to kick member' };
  }

  // Log kick action
  await logTeamAction(teamId, 'member_kicked', {
    kicked_by: captainId,
    kicked_member: memberId,
    timestamp: new Date().toISOString()
  });

  return { success: true, message: 'Member kicked successfully' };
};
```

#### Host-Initiated Kicks
- **Kick individual member**: Remove specific user from team
- **Kick entire team**: Disband team and remove all members
- **Emergency kick**: Immediate removal without confirmation
- **Temporary kick**: 5-minute cooldown before rejoin

### Ban System

#### Ban Types
```typescript
interface BanRecord {
  id: string;
  user_id: string;
  session_id: string;
  ban_type: 'temporary' | 'permanent' | 'until_end';
  reason: string;
  banned_by: string;
  expires_at?: string;
  created_at: string;
}
```

#### Ban Implementation
```typescript
const banUser = async (
  userId: string,
  sessionId: string,
  banType: 'temporary' | 'permanent' | 'until_end',
  reason: string,
  bannedBy: string,
  durationHours?: number
): Promise<void> => {
  const expiresAt = banType === 'temporary' && durationHours
    ? new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString()
    : null;

  await supabase.from('banned_users').insert({
    user_id: userId,
    session_id: sessionId,
    ban_type: banType,
    reason,
    banned_by: bannedBy,
    expires_at: expiresAt,
    created_at: new Date().toISOString()
  });

  // Remove from all teams in session
  await supabase
    .from('team_members')
    .delete()
    .eq('user_id', userId)
    .in('team_id', 
      await getTeamIdsInSession(sessionId)
    );
};
```

### Ban Enforcement

#### Real-time Ban Checking
```typescript
const checkBanStatus = async (
  userId: string, 
  sessionId: string
): Promise<{ isBanned: boolean; ban?: BanRecord }> => {
  const { data: bans } = await supabase
    .from('banned_users')
    .select('*')
    .eq('user_id', userId)
    .eq('session_id', sessionId)
    .or('expires_at.is.null,expires_at.gt.now()');

  if (bans && bans.length > 0) {
    return { isBanned: true, ban: bans[0] };
  }

  return { isBanned: false };
};
```

#### Ban UI Feedback
- **Red banner** indicating banned status
- **Ban reason** and duration display
- **Appeal process** for temporary bans
- **Contact host** for permanent bans

---

## Anonymous User Support

### Anonymous User Features

#### Limited Participation
- **Join teams** with temporary names
- **Vote on team answers** (limited weight)
- **View game progress** and leaderboards
- **Chat with team members** (restricted)

#### Restrictions
- **Cannot submit answers** (captain requirement)
- **Cannot kick members** or manage teams
- **Limited voting power** (0.5x weight)
- **Temporary profile** (session-only)

#### Upgrade Path
```typescript
const upgradeAnonymousUser = async (
  anonymousUserId: string,
  fullUserData: {
    email: string;
    display_name: string;
    password?: string;
  }
): Promise<{ success: boolean; userId: string }> => {
  // Create full user account
  const { data: newUser, error: createError } = await supabase.auth.signUp({
    email: fullUserData.email,
    password: fullUserData.password || generateRandomPassword(),
    options: {
      data: {
        display_name: fullUserData.display_name,
        upgraded_from_anonymous: anonymousUserId
      }
    }
  });

  if (createError) throw createError;

  // Transfer team memberships
  await supabase
    .from('team_members')
    .update({ user_id: newUser.user.id })
    .eq('user_id', anonymousUserId);

  // Update game history
  await supabase
    .from('game_participation')
    .update({ user_id: newUser.user.id })
    .eq('user_id', anonymousUserId);

  // Mark anonymous user as upgraded
  await supabase
    .from('users')
    .update({ 
      is_anonymous: false,
      upgraded_at: new Date().toISOString()
    })
    .eq('id', anonymousUserId);

  return { success: true, userId: newUser.user.id };
};
```

### Anonymous User UI

#### Join Flow
- **Quick join**: No email required
- **Auto-generated name**: "Guest1234" format
- **Optional customization**: Choose display name
- **Clear limitations**: Show what features are restricted

#### Upgrade Prompts
- **Feature unlock**: "Create account to submit answers"
- **Progress saving**: "Keep your stats and achievements"
- **Social features**: "Connect with friends outside session"
- **One-click upgrade**: Pre-filled with existing data

---

## Team Management Interface

### Host Dashboard

#### Teams Modal Overview
```
┌─────────────────────────────────────────────────────────────┐
│ Teams Management                                      [X]    │
├─────────────────────────────────────────────────────────────┤
│ Summary:  [10 Teams] [25 Players] [3 Available Codes]       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ Active Teams (7)                                             │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ 🎯 Team Alpha                            Code: 1234  │  │
│ │ ├─ 👑 Alice (Captain)              [Kick] [Ban]       │  │
│ │ ├─ 👤 Bob                          [Kick] [Ban]       │  │
│ │ ├─ 👤 Charlie                      [Kick] [Ban]       │  │
│ │ └─ 👤‍🟦 Guest (Anonymous)            [Kick] [Ban]       │  │
│ │ Score: 150 pts • 4 members • Active                    │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                               │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ 🎯 Team Beta                             Code: 5678  │  │
│ │ └─ 👑 David (Captain)              [Kick] [Ban]       │  │
│ │ Score: 200 pts • 1 member • Active                    │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                               │
│ Available Codes (3)                                          │
│ [1111] [2222] [3333]                                         │
│                                                               │
│ [Create New Team] [Export Data] [Help]                      │
└─────────────────────────────────────────────────────────────┘
```

#### Team Details Panel
- **Team statistics**: Score, rounds played, win rate
- **Member activity**: Join times, participation rates
- **Communication log**: Chat history, reports
- **Performance metrics**: Answer accuracy, voting patterns

### Captain Dashboard

#### Team Management
```
┌─────────────────────────────────────────────────────────────┐
│ My Team - Alpha                                    [👑]     │
├─────────────────────────────────────────────────────────────┤
│ Team Code: 1234 • Share: [Copy] [QR]                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ Team Members (4)                                              │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ 👑 You (Captain)                                        │  │
│ │ 👤 Bob • Joined 2:15pm • Active                        │  │
│ │ 👤 Charlie • Joined 2:18pm • Active                    │  │
│ │ 👤‍🟦 Guest • Joined 2:20pm • Away                     │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                               │
│ Team Actions:                                                │
│ [Promote Member] [Kick Member] [Transfer Captain]           │
│                                                               │
│ Recent Activity:                                              │
│ • Charlie joined the team                                    │
│ • Team scored 50 points in last round                       │
│ • Bob voted on 3 answers                                     │
└─────────────────────────────────────────────────────────────┘
```

#### Answer Submission Control
- **Submit answer button** (captain only)
- **Team consensus indicator**: Show member agreement
- **Answer preview**: Display before final submission
- **Submission timer**: Countdown to round end

---

## Real-time Features

### Live Team Updates

#### Member Status Changes
```typescript
const subscribeToTeamUpdates = (teamId: string, callbacks: {
  onMemberJoined: (member: TeamMember) => void;
  onMemberLeft: (memberId: string) => void;
  onCaptainChanged: (newCaptain: string) => void;
  onScoreUpdated: (newScore: number) => void;
}) => {
  const subscription = supabase
    .channel(`team-${teamId}`)
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'team_members' },
      (payload) => callbacks.onMemberJoined(payload.new as TeamMember)
    )
    .on('postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'team_members' },
      (payload) => callbacks.onMemberLeft(payload.old.user_id)
    )
    .on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'teams' },
      (payload) => {
        if (payload.new.uid !== payload.old.uid) {
          callbacks.onCaptainChanged(payload.new.uid);
        }
        if (payload.new.score !== payload.old.score) {
          callbacks.onScoreUpdated(payload.new.score);
        }
      }
    )
    .subscribe();

  return subscription;
};
```

#### Real-time Notifications
- **Member joined**: "Bob joined Team Alpha!"
- **Captain changed**: "Alice is now the captain"
- **Score updated**: "Team scored 25 points!"
- **Member kicked**: "Charlie was removed from the team"

### Live Answer Submission

#### Captain Answer Interface
```typescript
const AnswerSubmissionPanel: React.FC<{ teamId: string; isCaptain: boolean }> = ({ 
  teamId, 
  isCaptain 
}) => {
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [teamConsensus, setTeamConsensus] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(60);

  // Subscribe to team member votes
  useEffect(() => {
    const subscription = supabase
      .channel(`answer-consensus-${teamId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'answer_votes' },
        () => loadConsensus()
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, [teamId]);

  const handleSubmitAnswer = async () => {
    if (!isCaptain) return;

    const { error } = await supabase
      .from('answers')
      .insert({
        team_id: teamId,
        text: currentAnswer,
        round_index: getCurrentRound(),
        created_at: new Date().toISOString()
      });

    if (error) {
      toast.error('Failed to submit answer');
    } else {
      toast.success('Answer submitted!');
      setCurrentAnswer('');
    }
  };

  return (
    <div className="answer-submission-panel">
      {isCaptain ? (
        <div className="captain-controls">
          <div className="consensus-indicator">
            Team Agreement: {teamConsensus}%
          </div>
          <textarea
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            placeholder="Enter your team's answer..."
            maxLength={200}
          />
          <div className="submission-controls">
            <span className="timer">⏱️ {timeRemaining}s</span>
            <button
              onClick={handleSubmitAnswer}
              disabled={!currentAnswer.trim() || timeRemaining === 0}
              className="submit-answer-btn"
            >
              Submit Answer
            </button>
          </div>
        </div>
      ) : (
        <div className="member-view">
          <p>Only the captain can submit answers.</p>
          <p>Current captain: {captainName}</p>
          <div className="suggestion-box">
            <textarea
              placeholder="Suggest an answer to your captain..."
              onChange={(e) => sendSuggestion(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
```

---

## Analytics & Insights

### Team Performance Metrics

#### Engagement Analytics
```typescript
interface TeamAnalytics {
  team_id: string;
  session_id: string;
  metrics: {
    total_members: number;
    active_members: number;
    average_session_duration: number;
    answer_submission_rate: number;
    voting_participation: number;
    communication_frequency: number;
  };
  performance: {
    total_score: number;
    average_round_score: number;
    win_rate: number;
    answer_accuracy: number;
    speed_bonus_earned: number;
  };
  trends: {
    growth_rate: number;
    retention_rate: number;
    churn_rate: number;
    engagement_trend: 'increasing' | 'stable' | 'decreasing';
  };
}
```

#### Real-time Dashboard
- **Live team count**: Currently active teams
- **Member distribution**: Average team size
- **Engagement heatmap**: Activity throughout session
- **Performance leaderboard**: Top performing teams

### User Behavior Tracking

#### Join Patterns
- **Peak joining times**: When most users join teams
- **Team size preferences**: Ideal team composition
- **Code sharing effectiveness**: Viral coefficient
- **Drop-off points**: Where users abandon the process

#### Collaboration Metrics
- **Captain effectiveness**: Score under different captains
- **Member participation**: Voting and suggestion rates
- **Team cohesion**: How well teams work together
- **Communication patterns**: Chat frequency and sentiment

---

## Mobile Experience

### Responsive Design

#### Mobile Join Flow
```typescript
const MobileTeamJoin: React.FC = () => {
  return (
    <div className="mobile-join-container">
      <div className="join-header">
        <h1>Join a Team</h1>
        <p>Enter your team code to start playing</p>
      </div>
      
      <div className="code-input-section">
        <div className="session-code-input">
          <input
            type="text"
            placeholder="Session Code"
            maxLength={6}
            className="mobile-input"
          />
        </div>
        
        <div className="team-code-input">
          <input
            type="text"
            placeholder="Team Code"
            maxLength={4}
            className="mobile-input large"
            autoFocus
          />
        </div>
      </div>
      
      <div className="quick-actions">
        <button className="scan-qr-btn">
          📷 Scan QR Code
        </button>
        <button className="join-btn primary">
          Join Team
        </button>
      </div>
      
      <div className="help-section">
        <a href="/help/team-codes">How do I find my team code?</a>
      </div>
    </div>
  );
};
```

#### Touch-Optimized Controls
- **Large tap targets**: Minimum 44px touch areas
- **Gesture support**: Swipe to navigate teams
- **Haptic feedback**: Vibration on actions
- **Offline capability**: Basic functionality without internet

### PWA Features

#### Install Prompts
```typescript
const installPWA = async () => {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    // Register service worker
    const registration = await navigator.serviceWorker.register('/sw.js');
    
    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: VAPID_PUBLIC_KEY
    });
    
    // Save subscription for team notifications
    await savePushSubscription(subscription);
  }
};
```

#### Push Notifications
- **Team invitations**: "You've been invited to join Team Alpha!"
- **Captain promotions**: "You're now the captain of your team"
- **Game reminders**: "Your team is about to start a new round"
- **Score updates**: "Your team just scored 50 points!"

---

## Accessibility Features

### Inclusive Design

#### Screen Reader Support
```typescript
const AccessibleTeamInterface: React.FC = () => {
  return (
    <div role="main" aria-label="Team Management">
      <h1>Team Management</h1>
      
      <section aria-label="Team Information">
        <h2>Your Team</h2>
        <div 
          role="group" 
          aria-label={`Team ${teamName}, code ${teamCode}`}
        >
          <p>Team Name: {teamName}</p>
          <p>Team Code: {teamCode}</p>
          <p>Your Role: {isCaptain ? 'Captain' : 'Member'}</p>
        </div>
      </section>
      
      <section aria-label="Team Members">
        <h2>Team Members ({memberCount})</h2>
        <ul role="list">
          {members.map(member => (
            <li key={member.id} role="listitem">
              {member.is_captain && <span aria-label="Captain">👑</span>}
              {member.display_name}
              {member.is_anonymous && <span aria-label="Anonymous user">(Guest)</span>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};
```

#### Keyboard Navigation
- **Tab order**: Logical navigation through interface
- **Keyboard shortcuts**: Quick access to common actions
- **Focus indicators**: Clear visual feedback
- **Skip links**: Jump to main content

#### Visual Accessibility
- **High contrast mode**: Enhanced color contrast
- **Text scaling**: Support for 200% zoom
- **Color blind friendly**: Not color-dependent
- **Reduced motion**: Respect user preferences

---

## Internationalization

### Multi-language Support

#### Team Code Localization
```typescript
const getLocalizedTeamMessages = (locale: string) => {
  const messages = {
    'en': {
      team_code: 'Team Code',
      join_team: 'Join Team',
      captain: 'Captain',
      member: 'Member',
      anonymous: 'Guest'
    },
    'es': {
      team_code: 'Código de Equipo',
      join_team: 'Unirse al Equipo',
      captain: 'Capitán',
      member: 'Miembro',
      anonymous: 'Invitado'
    },
    'fr': {
      team_code: 'Code d\'Équipe',
      join_team: 'Rejoindre l\'Équipe',
      captain: 'Capitaine',
      member: 'Membre',
      anonymous: 'Invité'
    }
  };
  
  return messages[locale] || messages['en'];
};
```

#### Cultural Adaptations
- **Team naming**: Different naming conventions
- **Captain terminology**: Cultural equivalents
- **Privacy settings**: Regional preferences
- **Communication styles**: Direct vs indirect

---

## Best Practices

### User Experience Guidelines

#### Onboarding Flow
1. **Clear value proposition**: Why join a team?
2. **Simple entry points**: Minimal friction
3. **Progressive disclosure**: Reveal features gradually
4. **Success confirmation**: Clear feedback

#### Error Handling
- **Graceful degradation**: Functionality without breaking
- **Clear error messages**: User-friendly explanations
- **Recovery options**: How to fix problems
- **Contextual help**: Relevant assistance

#### Performance Optimization
- **Lazy loading**: Load team data as needed
- **Efficient updates**: Batch real-time changes
- **Offline support**: Basic functionality without connection
- **Background sync**: Update when connection restored

---

*This features guide provides comprehensive coverage of all team functionality, from user join flows to advanced management features and accessibility considerations.*
