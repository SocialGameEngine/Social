# Teams Operations Guide

## Overview

This operations guide covers implementation status, troubleshooting procedures, maintenance tasks, and operational checklists for the Social Game Engine's team management system.

---

## 🚀 Quick Start

### Deploy Team System

#### Prerequisites
- Supabase project with RLS enabled
- Node.js 18+ and pnpm
- Vercel deployment (or equivalent)

#### Step 1: Database Setup

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Run migrations in order
-- 1. Create teams table updates
-- 2. Create team_codes table
-- 3. Create team_members table
-- 4. Create banned_users table
-- 5. Set up RLS policies
-- 6. Create database functions
```

#### Step 2: Deploy Functions

```bash
# Deploy team-related edge functions
pnpm deploy:team-functions

# Specific functions to deploy:
# - sessions-create (updated for team codes)
# - teams-join
# - teams-manage
# - teams-kick
# - teams-ban
```

#### Step 3: Test System

```bash
# Create test session
curl -X POST https://your-app.vercel.app/api/sessions/create \
  -H "Content-Type: application/json" \
  -d '{
    "session_name": "Test Session",
    "host_name": "Test Host",
    "host_email": "host@example.com"
  }'

# Test team join
curl -X POST https://your-app.vercel.app/api/teams/join \
  -H "Content-Type: application/json" \
  -d '{
    "session_code": "ABC123",
    "team_code": "1234",
    "team_name": "Test Team",
    "user_info": {
      "display_name": "Test User",
      "device_type": "desktop",
      "user_agent": "Mozilla/5.0..."
    }
  }'
```

---

## 📊 Implementation Status

### Current System Status

#### ✅ Completed Features

**Core Infrastructure:**
- [x] Database schema implementation
- [x] Team code generation system
- [x] Captain assignment logic
- [x] Real-time subscriptions
- [x] Basic RLS policies

**User Flows:**
- [x] Session creation with team codes
- [x] Team join functionality
- [x] Captain promotion system
- [x] Anonymous user support
- [x] Basic kick functionality

**API Endpoints:**
- [x] `POST /api/sessions/create` (updated)
- [x] `POST /api/teams/join`
- [x] `GET /api/teams/:session_id`
- [x] `POST /api/teams/:team_id/kick-member`

#### 🚧 In Progress

**Advanced Features:**
- [ ] Comprehensive ban system
- [ ] Team analytics dashboard
- [ ] Advanced captain controls
- [ ] Mobile PWA features

**UI Components:**
- [ ] Teams management modal
- [ ] Captain dashboard
- [ ] Member management interface
- [ ] Real-time notification system

#### 📋 Planned Features

**Future Enhancements:**
- [ ] Team customization options
- [ ] Advanced voting systems
- [ ] Team chat functionality
- [ ] Performance analytics
- [ ] Multi-language support

### Migration Status

#### Database Migrations
```sql
-- Migration 001: Create team_codes table
CREATE TABLE public.team_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  code text NOT NULL,
  team_id uuid,
  is_used boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT team_codes_pkey PRIMARY KEY (id)
);

-- Migration 002: Update teams table
ALTER TABLE public.teams 
ADD COLUMN team_code text,
ADD COLUMN updated_at timestamp with time zone NOT NULL DEFAULT now();

-- Migration 003: Create team_members table
CREATE TABLE public.team_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  user_id uuid NOT NULL,
  is_captain boolean NOT NULL DEFAULT false,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  device_type text,
  user_agent text,
  ip_address inet,
  CONSTRAINT team_members_pkey PRIMARY KEY (id)
);
```

#### Data Migration
```sql
-- Migrate existing teams to new structure
UPDATE teams t
SET team_code = tc.code
FROM team_codes tc
WHERE t.id = tc.team_id;

-- Create team member records for existing team captains
INSERT INTO team_members (team_id, user_id, is_captain, joined_at)
SELECT id, uid, true, joined_at
FROM teams
WHERE uid IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM team_members tm 
  WHERE tm.team_id = teams.id AND tm.user_id = teams.uid
);
```

---

## 🔧 Troubleshooting Guide

### Common Issues & Solutions

#### Team Code Problems

**Issue: "Invalid team code" error**
```sql
-- Debug query to check team code
SELECT tc.code, t.team_name, tc.is_used, t.session_id
FROM team_codes tc
LEFT JOIN teams t ON tc.team_id = t.id
WHERE tc.session_id = 'your-session-id'
ORDER BY tc.code;

-- Check if code exists and is assigned
SELECT EXISTS(
  SELECT 1 FROM team_codes tc
  JOIN teams t ON tc.team_id = t.id
  WHERE tc.session_id = $1 
  AND tc.code = $2
  AND tc.is_used = true
);
```

**Solution:**
1. Verify session ID is correct
2. Check if team code was generated
3. Ensure code is assigned to a team
4. Confirm code format (4 digits)

#### Captain Assignment Issues

**Issue: No captain assigned to team**
```sql
-- Check team captain status
SELECT 
  t.id as team_id,
  t.team_name,
  t.uid as captain_user_id,
  COUNT(tm.id) as member_count,
  COUNT(CASE WHEN tm.is_captain = true THEN 1 END) as captain_count
FROM teams t
LEFT JOIN team_members tm ON t.id = tm.team_id
WHERE t.session_id = $1
GROUP BY t.id, t.team_name, t.uid;
```

**Solution:**
```sql
-- Assign first member as captain
UPDATE team_members
SET is_captain = true
WHERE id = (
  SELECT id FROM team_members
  WHERE team_id = $1
  ORDER BY joined_at ASC
  LIMIT 1
);

-- Update teams table with captain ID
UPDATE teams
SET uid = (
  SELECT user_id FROM team_members
  WHERE team_id = teams.id
  AND is_captain = true
  LIMIT 1
)
WHERE id = $1;
```

#### Real-time Subscription Issues

**Issue: Team updates not appearing in real-time**
```typescript
// Debug subscription
const debugSubscription = supabase
  .channel('debug-teams')
  .on('system', {}, (payload) => {
    console.log('System event:', payload);
  })
  .subscribe((status) => {
    console.log('Subscription status:', status);
  });

// Check publication status
const checkPublication = async () => {
  const { data } = await supabase
    .from('pg_publication_tables')
    .select('*')
    .eq('pubname', 'supabase_realtime');
  
  console.log('Published tables:', data);
};
```

**Solution:**
1. Verify Supabase project has realtime enabled
2. Check RLS policies allow subscription
3. Ensure tables are added to publication
4. Test with different user permissions

#### Performance Issues

**Issue: Slow team loading**
```sql
-- Analyze slow queries
SELECT 
  query,
  mean_time,
  calls,
  total_time
FROM pg_stat_statements
WHERE query LIKE '%team_members%'
ORDER BY mean_time DESC
LIMIT 10;

-- Check missing indexes
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE tablename IN ('teams', 'team_members', 'team_codes')
AND attname IN ('session_id', 'team_id', 'user_id');
```

**Solution:**
```sql
-- Create performance indexes
CREATE INDEX CONCURRENTLY idx_team_members_team_user 
ON team_members(team_id, user_id);

CREATE INDEX CONCURRENTLY idx_teams_session 
ON teams(session_id);

CREATE INDEX CONCURRENTLY idx_team_codes_session_used 
ON team_codes(session_id, is_used);
```

### Error Diagnosis

#### Database Errors

**Connection Pool Exhaustion**
```sql
-- Check connection usage
SELECT 
  state,
  COUNT(*) as connection_count,
  AVG(EXTRACT(EPOCH FROM (now() - query_start))) as avg_duration
FROM pg_stat_activity
WHERE application_name LIKE '%team%'
GROUP BY state;

-- Monitor over time
SELECT 
  time,
  max_connections,
  active_connections,
  waiting_connections
FROM pg_stat_database
WHERE datname = current_database();
```

**RLS Policy Violations**
```sql
-- Check RLS policy performance
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM team_members
WHERE team_id = 'some-team-id';

-- Test policy with different users
SET ROLE authenticated;
SELECT COUNT(*) FROM team_members WHERE team_id = $1;
SET ROLE anon;
SELECT COUNT(*) FROM team_members WHERE team_id = $1;
```

#### API Errors

**Rate Limiting Issues**
```typescript
// Monitor rate limiting
const rateLimitStats = new Map<string, {
  requests: number;
  lastReset: number;
  blocked: boolean;
}>();

const checkRateLimit = (identifier: string): boolean => {
  const now = Date.now();
  const stats = rateLimitStats.get(identifier) || {
    requests: 0,
    lastReset: now,
    blocked: false
  };

  // Reset window if expired
  if (now - stats.lastReset > 60000) {
    stats.requests = 0;
    stats.lastReset = now;
    stats.blocked = false;
  }

  // Check limit
  if (stats.requests >= 100) {
    stats.blocked = true;
    return false;
  }

  stats.requests++;
  rateLimitStats.set(identifier, stats);
  return true;
};
```

---

## 📋 Maintenance Procedures

### Daily Tasks

#### System Health Checks

**Morning Checklist (9:00 AM)**
- [ ] Check team creation success rate
- [ ] Verify team code generation working
- [ ] Monitor real-time subscription health
- [ ] Review error logs for team operations

**Automated Health Check Script**
```typescript
const dailyHealthCheck = async () => {
  const checks = {
    teamCreation: await checkTeamCreation(),
    codeGeneration: await checkCodeGeneration(),
    realTimeSubscriptions: await checkRealTimeSubscriptions(),
    databasePerformance: await checkDatabasePerformance()
  };

  const report = {
    timestamp: new Date().toISOString(),
    status: Object.values(checks).every(check => check.healthy) ? 'healthy' : 'unhealthy',
    checks
  };

  await sendHealthReport(report);
  return report;
};
```

#### Data Cleanup

**Daily Cleanup Tasks**
```sql
-- Remove expired temporary bans
DELETE FROM banned_users
WHERE ban_type = 'temporary'
AND expires_at < NOW();

-- Clean up orphaned team members
DELETE FROM team_members
WHERE team_id NOT IN (SELECT id FROM teams);

-- Archive old session data
INSERT INTO sessions_archive
SELECT * FROM sessions
WHERE created_at < NOW() - INTERVAL '30 days'
AND status = 'completed';
```

### Weekly Tasks

#### Performance Optimization

**Wednesday Performance Review**
- [ ] Analyze team query performance
- [ ] Review database index efficiency
- [ ] Check real-time subscription load
- [ ] Optimize slow team operations

**Query Performance Analysis**
```sql
-- Identify slow team queries
SELECT 
  query,
  mean_exec_time,
  calls,
  total_exec_time,
  stddev_exec_time
FROM pg_stat_statements
WHERE query LIKE '%team%' OR query LIKE '%member%'
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename IN ('teams', 'team_members', 'team_codes')
ORDER BY idx_scan DESC;
```

#### Security Audit

**Friday Security Review**
- [ ] Review team access permissions
- [ ] Check for unauthorized team access
- [ ] Verify RLS policy effectiveness
- [ ] Audit captain privilege usage

**Security Audit Queries**
```sql
-- Check for suspicious team activity
SELECT 
  t.session_id,
  COUNT(DISTINCT tm.user_id) as unique_users,
  COUNT(*) as total_memberships,
  COUNT(CASE WHEN tm.is_captain = true THEN 1 END) as captain_changes
FROM teams t
LEFT JOIN team_members tm ON t.id = tm.team_id
WHERE tm.created_at > NOW() - INTERVAL '7 days'
GROUP BY t.session_id
HAVING COUNT(DISTINCT tm.user_id) > 10;

-- Review ban patterns
SELECT 
  ban_type,
  COUNT(*) as ban_count,
  AVG(EXTRACT(EPOCH FROM (NOW() - created_at))/3600) as avg_hours_active
FROM banned_users
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY ban_type;
```

### Monthly Tasks

#### Data Analytics

**Monthly Analytics Report**
```typescript
const generateMonthlyReport = async () => {
  const analytics = {
    teamMetrics: await getTeamMetrics(),
    userEngagement: await getUserEngagementMetrics(),
    systemPerformance: await getSystemPerformanceMetrics(),
    businessInsights: await getBusinessInsights()
  };

  const report = {
    period: getLastMonthRange(),
    summary: generateSummary(analytics),
    detailed: analytics,
    recommendations: generateRecommendations(analytics)
  };

  await saveMonthlyReport(report);
  return report;
};
```

#### Capacity Planning

**Monthly Capacity Review**
- [ ] Analyze team growth trends
- [ ] Review database storage usage
- [ ] Plan for scaling team operations
- [ ] Budget for infrastructure upgrades

**Capacity Analysis**
```sql
-- Team growth analysis
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(DISTINCT id) as new_teams,
  COUNT(DISTINCT session_id) as active_sessions,
  AVG(team_size) as avg_team_size
FROM teams
WHERE created_at > NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month;

-- Storage usage analysis
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('teams', 'team_members', 'team_codes', 'banned_users')
ORDER BY size_bytes DESC;
```

---

## 🚨 Incident Response

### Severity Levels

#### Critical (P0) - Team System Down
- **Impact**: No teams can be created or joined
- **Response Time**: 15 minutes
- **Escalation**: Immediate engineering response

**Response Procedure:**
1. **Immediate Assessment** (0-5 min)
   ```bash
   # Check system status
   curl -f https://your-app.vercel.app/api/health
   curl -f https://your-app.vercel.app/api/teams/health
   ```

2. **Root Cause Analysis** (5-10 min)
   ```sql
   -- Check database connectivity
   SELECT 1;
   
   -- Check team operations
   SELECT COUNT(*) FROM teams WHERE created_at > NOW() - INTERVAL '1 hour';
   ```

3. **Emergency Fix** (10-15 min)
   - Restart affected services
   - Failover to backup systems
   - Implement temporary workaround

#### High (P1) - Major Feature Broken
- **Impact**: Team creation/joining partially broken
- **Response Time**: 1 hour
- **Escalation**: Senior engineer notification

#### Medium (P2) - Minor Issues
- **Impact**: Some team features not working
- **Response Time**: 4 hours
- **Escalation**: Team lead notification

#### Low (P3) - Cosmetic Issues
- **Impact**: UI problems, documentation issues
- **Response Time**: 24 hours
- **Escalation**: Regular backlog

### Incident Playbooks

#### Team Code Generation Failure

**Detection:**
```typescript
// Monitor team code generation success rate
const monitorCodeGeneration = async () => {
  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, created_at')
    .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

  for (const session of sessions) {
    const { data: codes } = await supabase
      .from('team_codes')
      .select('code')
      .eq('session_id', session.id);

    if (codes.length !== 20) {
      alertTeamCodeFailure(session.id, codes.length);
    }
  }
};
```

**Resolution Steps:**
1. **Verify function exists**: `SELECT * FROM pg_proc WHERE proname = 'generate_team_codes'`
2. **Check permissions**: Ensure function has SECURITY DEFINER
3. **Test manually**: `SELECT generate_team_codes('test-session-id', 5)`
4. **Regenerate codes**: Run for affected sessions
5. **Monitor**: Watch for recurrence

#### Captain Promotion Issues

**Detection:**
```sql
-- Find teams without captains
SELECT t.id, t.team_name, COUNT(tm.id) as member_count
FROM teams t
LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.is_captain = true
WHERE t.session_id = $1
AND t.uid IS NULL
GROUP BY t.id, t.team_name;
```

**Resolution Steps:**
1. **Identify affected teams**
2. **Promote first member**: Use automatic promotion logic
3. **Verify promotion**: Check captain assignment
4. **Notify users**: Inform of captain change
5. **Monitor**: Watch for recurrence

---

## 📈 Monitoring & Alerting

### Key Performance Indicators

#### Team System Metrics

**Operational Metrics:**
```typescript
interface TeamMetrics {
  teamCreationRate: number; // Teams created per hour
  teamJoinRate: number; // Users joining teams per hour
  averageTeamSize: number; // Average members per team
  captainPromotionRate: number; // Captain changes per hour
  codeGenerationSuccess: number; // % successful code generation
  realTimeSubscriptionHealth: number; % active subscriptions
}
```

**Performance Metrics:**
```typescript
interface PerformanceMetrics {
  teamLoadTime: number; // Average time to load team data
  joinResponseTime: number; // Team join API response time
  realTimeLatency: number; // Real-time update latency
  databaseQueryTime: number; // Average team query time
  memoryUsage: number; // Team system memory usage
  errorRate: number; // Error rate for team operations
}
```

#### Alert Configuration

**Critical Alerts:**
```yaml
- alert: TEAM_CREATION_FAILURE
  expr: team_creation_success_rate < 0.95
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "Team creation failure rate > 5%"
    runbook: "https://docs.company.com/runbooks/team-creation"

- alert: CAPTAIN_ASSIGNMENT_FAILURE
  expr: teams_without_captain > 0
  for: 2m
  labels:
    severity: high
  annotations:
    summary: "Teams exist without assigned captains"

- alert: REAL_TIME_SUBSCRIPTION_FAILURE
  expr: realtime_subscription_health < 0.9
  for: 3m
  labels:
    severity: high
  annotations:
    summary: "Real-time subscription health degraded"
```

### Monitoring Dashboard

#### Real-time Dashboard
```typescript
const TeamMonitoringDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<TeamMetrics>();
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const data = await fetchTeamMetrics();
      setMetrics(data);
      
      const activeAlerts = await getActiveAlerts();
      setAlerts(activeAlerts);
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="monitoring-dashboard">
      <div className="metrics-grid">
        <MetricCard 
          title="Team Creation Rate" 
          value={metrics?.teamCreationRate} 
          unit="/hr"
          status={metrics?.teamCreationRate > 10 ? 'good' : 'warning'}
        />
        <MetricCard 
          title="Average Team Size" 
          value={metrics?.averageTeamSize} 
          unit="members"
          status={metrics?.averageTeamSize > 2 ? 'good' : 'warning'}
        />
        <MetricCard 
          title="Real-time Health" 
          value={metrics?.realTimeSubscriptionHealth} 
          unit="%"
          status={metrics?.realTimeSubscriptionHealth > 95 ? 'good' : 'critical'}
        />
      </div>
      
      <div className="alerts-section">
        <h2>Active Alerts</h2>
        {alerts.map(alert => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
      </div>
    </div>
  );
};
```

---

## 🧪 Testing & Validation

### Automated Testing

#### Unit Tests
```typescript
describe('Team Code Generation', () => {
  it('should generate unique 4-digit codes', async () => {
    const sessionId = 'test-session';
    
    const result = await supabase.rpc('generate_team_codes', {
      session_uuid: sessionId,
      num_codes: 20
    });
    
    expect(result.error).toBeNull();
    
    // Verify uniqueness
    const { data: codes } = await supabase
      .from('team_codes')
      .select('code')
      .eq('session_id', sessionId);
    
    const uniqueCodes = new Set(codes?.map(c => c.code));
    expect(uniqueCodes.size).toBe(20);
  });

  it('should handle captain promotion correctly', async () => {
    const teamId = 'test-team';
    const members = [
      { user_id: 'user1', is_captain: true },
      { user_id: 'user2', is_captain: false },
      { user_id: 'user3', is_captain: false }
    ];

    // Remove captain
    await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', 'user1');

    // Check promotion
    const { data: newCaptain } = await supabase
      .from('team_members')
      .select('user_id')
      .eq('team_id', teamId)
      .eq('is_captain', true)
      .single();

    expect(newCaptain?.user_id).toBe('user2');
  });
});
```

#### Integration Tests
```typescript
describe('Team Join Flow Integration', () => {
  let session: any;
  let teamCodes: string[];

  beforeAll(async () => {
    // Create test session
    session = await createTestSession();
    teamCodes = await generateTeamCodes(session.id);
  });

  it('should allow complete team join flow', async () => {
    const captain = await createTestUser();
    const member = await createTestUser();

    // Captain joins first
    const captainResult = await joinTeam(
      session.session_code, 
      teamCodes[0], 
      captain
    );
    expect(captainResult.success).toBe(true);
    expect(captainResult.team.is_captain).toBe(true);

    // Member joins
    const memberResult = await joinTeam(
      session.session_code, 
      teamCodes[0], 
      member
    );
    expect(memberResult.success).toBe(true);
    expect(memberResult.team.is_captain).toBe(false);
    expect(memberResult.team.member_count).toBe(2);
  });
});
```

### Load Testing

#### Team Creation Load Test
```typescript
const loadTestTeamCreation = async (concurrentUsers = 100) => {
  const promises = [];
  
  for (let i = 0; i < concurrentUsers; i++) {
    promises.push(
      createSession({
        session_name: `Load Test Session ${i}`,
        host_name: `Load Test Host ${i}`,
        host_email: `host${i}@test.com`
      })
    );
  }

  const startTime = Date.now();
  const results = await Promise.allSettled(promises);
  const endTime = Date.now();

  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  const duration = endTime - startTime;

  return {
    totalRequests: concurrentUsers,
    successful,
    failed,
    duration,
    requestsPerSecond: concurrentUsers / (duration / 1000),
    successRate: successful / concurrentUsers
  };
};
```

---

## 📚 Documentation Maintenance

### Documentation Standards

#### API Documentation
- **OpenAPI specifications** for all team endpoints
- **Request/response examples** for each endpoint
- **Error code documentation** with troubleshooting
- **Authentication requirements** clearly stated

#### User Documentation
- **Getting started guides** for team features
- **Video tutorials** for complex flows
- **FAQ sections** for common issues
- **Glossary** of team-related terms

#### Developer Documentation
- **Database schema documentation**
- **Real-time subscription guides**
- **Testing procedures**
- **Deployment checklists**

### Review Schedule

#### Weekly Reviews
- [ ] Update API documentation
- [ ] Review user guides for accuracy
- [ ] Check troubleshooting guides
- [ ] Update error code references

#### Monthly Reviews
- [ ] Comprehensive documentation audit
- [ ] Update architectural diagrams
- [ ] Review security documentation
- [ ] Update compliance documentation

---

## 🔮 Future Planning

### Roadmap Items

#### Q1 2024
- **Advanced team analytics**: Detailed engagement metrics
- **Team customization**: Names, colors, avatars
- **Enhanced mobile experience**: PWA improvements
- **Performance optimization**: Query optimization

#### Q2 2024
- **Team chat system**: In-team communication
- **Advanced voting**: Weighted voting, consensus mechanisms
- **Multi-language support**: International team features
- **API v2**: Enhanced team management APIs

#### Q3 2024
- **AI team recommendations**: Smart team formation
- **Advanced moderation**: Automated content filtering
- **Team competitions**: Inter-team challenges
- **Enterprise features**: Advanced team management

### Technology Planning

#### Database Evolution
- **Read replicas**: Improved query performance
- **Partitioning**: Large dataset management
- **Advanced indexing**: Optimized query patterns
- **Data archiving**: Long-term storage strategy

#### Infrastructure Scaling
- **Microservices**: Team service isolation
- **Event sourcing**: Audit trail and replay capability
- **Caching layers**: Redis integration
- **CDN deployment**: Global team system availability

---

*This operations guide provides comprehensive procedures for maintaining, troubleshooting, and scaling the team management system in production environments.*
