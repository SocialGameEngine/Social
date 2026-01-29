# Database Operations Guide

## Overview

This operations guide covers database maintenance, performance monitoring, troubleshooting procedures, and operational workflows for the Social Game Engine database system.

---

## 📊 Database Health Monitoring

### Daily Health Checks

#### Automated Health Assessment
```sql
-- Daily health check script
WITH health_metrics AS (
  -- Connection health
  SELECT 'connection_count' as metric, count(*) as value
  FROM pg_stat_activity
  WHERE state = 'active'
  
  UNION ALL
  
  -- Table sizes
  SELECT 'total_table_size_mb' as metric, 
         pg_size_pretty(sum(pg_total_relation_size(schemaname||'.'||tablename)))::numeric as value
  FROM pg_tables
  WHERE schemaname = 'public'
  
  UNION ALL
  
  -- Active sessions
  SELECT 'active_sessions' as metric, count(*) as value
  FROM sessions
  WHERE status IN ('lobby', 'answer', 'vote')
  
  UNION ALL
  
  -- Recent errors
  SELECT 'recent_errors' as metric, count(*) as value
  FROM pg_stat_statements
  WHERE calls > 0 AND mean_exec_time > 5000
)
SELECT * FROM health_metrics;
```

#### Performance Metrics Dashboard
```typescript
interface DatabaseHealth {
  connections: {
    active: number;
    idle: number;
    max: number;
  };
  performance: {
    avgQueryTime: number;
    slowQueries: number;
    cacheHitRate: number;
  };
  storage: {
    totalSize: string;
    tableSizes: Record<string, string>;
    indexSizes: Record<string, string>;
  };
  activity: {
    activeSessions: number;
    activeTeams: number;
    recentOperations: number;
  };
}
```

### Weekly Performance Review

#### Query Performance Analysis
```sql
-- Identify slow queries (weekly review)
SELECT 
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  stddev_exec_time,
  rows,
  100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
WHERE mean_exec_time > 100  -- queries > 100ms
ORDER BY mean_exec_time DESC
LIMIT 20;
```

#### Index Usage Analysis
```sql
-- Check index efficiency
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE idx_scan < 100  -- indexes used less than 100 times
ORDER BY idx_scan ASC;
```

### Monthly Maintenance

#### Data Cleanup Procedures
```sql
-- Monthly cleanup script
BEGIN;

-- Clean up old anonymous users (older than 30 days)
DELETE FROM users 
WHERE is_anonymous = true 
  AND expires_at < NOW() - INTERVAL '30 days'
  AND id NOT IN (
    SELECT DISTINCT user_id FROM team_members 
    WHERE user_id IS NOT NULL
  );

-- Archive old session analytics (older than 90 days)
CREATE TABLE IF NOT EXISTS session_analytics_archive AS
SELECT * FROM session_analytics
WHERE updated_at < NOW() - INTERVAL '90 days';

DELETE FROM session_analytics
WHERE updated_at < NOW() - INTERVAL '90 days';

-- Clean up expired sessions (older than 7 days, not ended)
DELETE FROM sessions
WHERE status IN ('lobby', 'answer', 'vote')
  AND created_at < NOW() - INTERVAL '7 days'
  AND ended_at IS NULL;

-- Update table statistics
ANALYZE;

COMMIT;
```

---

## 🔧 Performance Optimization

### Query Optimization

#### Common Performance Issues

#### 1. N+1 Query Problems
```sql
-- Problem: Multiple queries for team members
-- Bad approach:
SELECT * FROM teams WHERE session_id = $1;
-- Then for each team: SELECT * FROM team_members WHERE team_id = $team_id;

-- Solution: Single query with joins
SELECT 
  t.id as team_id,
  t.team_name,
  t.score,
  tm.user_id,
  tm.is_captain,
  tm.player_name,
  u.display_name
FROM teams t
LEFT JOIN team_members tm ON t.id = tm.team_id
LEFT JOIN users u ON tm.user_id = u.id
WHERE t.session_id = $1
ORDER BY t.id, tm.joined_at;
```

#### 2. Missing Indexes
```sql
-- Identify missing indexes through query analysis
EXPLAIN (ANALYZE, BUFFERS)
SELECT s.*, t.team_name, COUNT(tm.id) as member_count
FROM sessions s
LEFT JOIN teams t ON s.id = t.session_id
LEFT JOIN team_members tm ON t.id = tm.team_id
WHERE s.status = 'lobby'
GROUP BY s.id, t.id;

-- Create missing indexes based on analysis
CREATE INDEX CONCURRENTLY idx_sessions_status_lobby 
ON sessions(status) WHERE status = 'lobby';

CREATE INDEX CONCURRENTLY idx_teams_session_member_count 
ON teams(session_id) INCLUDE (team_name, score);
```

#### 3. JSONB Query Optimization
```sql
-- Problem: Slow JSONB queries without proper indexes
-- Bad: SELECT * FROM sessions WHERE settings->>'maxTeams' = '20';

-- Solution: GIN index for JSONB
CREATE INDEX CONCURRENTLY idx_sessions_settings_gin 
ON sessions USING GIN(settings);

-- For specific JSONB paths, use expression indexes
CREATE INDEX CONCURRENTLY idx_sessions_settings_maxteams 
ON sessions ((settings->>'maxTeams')::int);
```

### Index Management

#### Index Creation Strategy
```sql
-- Create indexes concurrently to avoid blocking
CREATE INDEX CONCURRENTLY idx_teams_session_active 
ON teams(session_id) 
WHERE last_active_at > NOW() - INTERVAL '24 hours';

-- Partial indexes for frequently filtered data
CREATE INDEX CONCURRENTLY idx_answers_recent 
ON answers(session_id, round_index) 
WHERE created_at > NOW() - INTERVAL '7 days';

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY idx_votes_session_round_answer 
ON votes(session_id, round_index, answer_id);
```

#### Index Maintenance
```sql
-- Identify unused indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Safely drop unused indexes (after verification)
DROP INDEX CONCURRENTLY IF EXISTS idx_unused_index_name;
```

### Connection Pool Optimization

#### Connection Pool Configuration
```typescript
// Supabase connection pool settings
const connectionConfig = {
  maxConnections: 20,        // Maximum connections
  minConnections: 5,         // Minimum connections
  idleTimeout: 30000,        // 30 seconds
  connectionTimeout: 10000,  // 10 seconds
  acquireTimeout: 60000,     // 1 minute
  reapInterval: 1000,         // 1 second
  createTimeout: 30000       // 30 seconds
};
```

#### Connection Monitoring
```sql
-- Monitor connection usage
SELECT 
  state,
  count(*) as connection_count,
  avg(EXTRACT(EPOCH FROM (now() - query_start))) as avg_query_time
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY state
ORDER BY connection_count DESC;
```

---

## 🚨 Incident Response

### Database Incident Types

#### P0 - Critical Incidents
- **Database outage**: Complete loss of connectivity
- **Data corruption**: Inconsistent or lost data
- **Performance degradation**: >10 second query times
- **Security breach**: Unauthorized data access

#### P1 - High Priority Incidents
- **Slow queries**: >5 second response times
- **Connection exhaustion**: Max connections reached
- **Replication lag**: >30 seconds behind primary
- **Storage full**: >90% disk usage

#### P2 - Medium Priority Incidents
- **Index corruption**: Invalid index structures
- **Query plan changes**: Sudden performance drops
- **Memory pressure**: High memory usage
- **Lock contention**: Long-running locks

### Incident Response Procedures

#### Database Outage Response
```sql
-- Step 1: Diagnose connectivity
SELECT 
  pg_is_in_recovery() as is_replica,
  pg_last_xact_replay_timestamp() as last_replay,
  pg_is_wal_replay_paused() as replay_paused;

-- Step 2: Check for long-running queries
SELECT 
  pid,
  now() - pg_stat_activity.query_start AS duration,
  query,
  state
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes'
ORDER BY duration DESC;

-- Step 3: Terminate problematic connections if needed
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'active' 
  AND query LIKE '%problematic_query%';
```

#### Performance Degradation Response
```sql
-- Identify blocking locks
SELECT 
  blocked_locks.pid AS blocked_pid,
  blocked_activity.usename AS blocked_user,
  blocking_locks.pid AS blocking_pid,
  blocking_activity.usename AS blocking_user,
  blocked_activity.query AS blocked_statement,
  blocking_activity.query AS current_statement_in_blocking_process
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;
```

#### Data Recovery Procedures
```sql
-- Point-in-time recovery setup
-- Ensure WAL archiving is enabled
SHOW archive_mode;
SHOW archive_command;

-- Create recovery point
SELECT pg_create_restore_point('before_major_update');

-- Restore from backup (if needed)
-- 1. Stop database service
-- 2. Restore from base backup
-- 3. Configure recovery.conf
-- 4. Start database with recovery mode
```

### Monitoring & Alerting

#### Critical Alerts Configuration
```typescript
const databaseAlerts = {
  connectionExhaustion: {
    threshold: 0.9, // 90% of max connections
    window: '5m',
    action: 'scale_connections',
    escalation: '10m'
  },
  slowQueries: {
    threshold: 5000, // 5 seconds
    window: '1m',
    action: 'analyze_queries',
    escalation: '5m'
  },
  storageFull: {
    threshold: 0.85, // 85% disk usage
    window: '1m',
    action: 'cleanup_data',
    escalation: '5m'
  },
  replicationLag: {
    threshold: 30, // 30 seconds
    window: '1m',
    action: 'check_replication',
    escalation: '5m'
  }
};
```

#### Automated Response Scripts
```typescript
// Auto-response for connection exhaustion
const handleConnectionExhaustion = async () => {
  // Kill idle connections
  await sql`
    SELECT pg_terminate_backend(pid)
    FROM pg_stat_activity
    WHERE state = 'idle'
    AND query_start < now() - interval '10 minutes'
  `;
  
  // Scale connection pool
  await scaleConnectionPool(1.5); // Increase by 50%
  
  // Alert operations team
  await alertOpsTeam('Connection pool scaled due to exhaustion');
};
```

---

## 🔐 Security Operations

### Daily Security Checks

#### Access Control Validation
```sql
-- Check for unexpected superuser accounts
SELECT usename, usesuper, usecreatedb, valuntil
FROM pg_user
WHERE usesuper = true
  AND usename != 'postgres'
  AND usename != 'rdsadmin';

-- Review recent privilege changes
SELECT 
  grantee,
  table_schema,
  table_name,
  privilege_type,
  grantor,
  is_grantable
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND grantee != 'postgres'
ORDER BY table_name, privilege_type;
```

#### RLS Policy Validation
```sql
-- Check RLS is enabled on sensitive tables
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('sessions', 'teams', 'team_members', 'answers')
  AND rowsecurity = false;

-- Test RLS policies
SET ROLE authenticated;
SELECT count(*) FROM sessions WHERE id = 'test-session-id';
RESET ROLE;
```

### Security Incident Response

#### Data Breach Response
```sql
-- 1. Identify affected accounts
SELECT DISTINCT user_id, auth_user_id
FROM team_members
WHERE user_id IN (
  SELECT id FROM users 
  WHERE last_active_at > NOW() - INTERVAL '24 hours'
);

-- 2. Audit recent data access
SELECT 
  schemaname,
  tablename,
  usesysid,
  usename,
  query
FROM pg_stat_activity
WHERE state = 'active'
  AND query LIKE '%sensitive_table%';

-- 3. Revoke suspicious access
REVOKE ALL ON sessions FROM suspicious_user;
REVOKE ALL ON teams FROM suspicious_user;
```

#### SQL Injection Prevention
```sql
-- Monitor for suspicious query patterns
SELECT 
  query,
  calls,
  mean_exec_time,
  rows
FROM pg_stat_statements
WHERE query LIKE '%UNION%'
   OR query LIKE '%SELECT%'
   OR query LIKE '%INSERT%'
   OR query LIKE '%DELETE%'
   OR query LIKE '%DROP%'
ORDER BY calls DESC
LIMIT 10;
```

### Access Management

#### User Access Audits
```sql
-- Monthly access review
WITH user_permissions AS (
  SELECT 
    u.auth_user_id,
    u.username,
    u.is_anonymous,
    COUNT(DISTINCT tm.team_id) as team_count,
    MAX(tm.last_active) as last_activity
  FROM users u
  LEFT JOIN team_members tm ON u.id = tm.user_id
  GROUP BY u.id, u.auth_user_id, u.username, u.is_anonymous
)
SELECT 
  auth_user_id,
  username,
  team_count,
  last_activity,
  CASE 
    WHEN last_activity < NOW() - INTERVAL '90 days' THEN 'INACTIVE'
    WHEN team_count > 10 THEN 'HEAVY_USER'
    ELSE 'ACTIVE'
  END as status
FROM user_permissions
ORDER BY last_activity DESC;
```

---

## 📈 Capacity Planning

### Storage Growth Monitoring

#### Table Size Analysis
```sql
-- Monthly storage analysis
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size,
  (pg_total_relation_size(schemaname||'.'||tablename) / 
   (SELECT SUM(pg_total_relation_size(schemaname||'.'||tablename)) 
    FROM pg_tables WHERE schemaname = 'public') * 100 as percentage
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

#### Growth Trend Analysis
```sql
-- Storage growth over time (requires historical data)
WITH monthly_growth AS (
  SELECT 
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as new_sessions,
    COUNT(DISTINCT host_uid) as unique_hosts
  FROM sessions
  WHERE created_at > NOW() - INTERVAL '12 months'
  GROUP BY DATE_TRUNC('month', created_at)
)
SELECT 
  month,
  new_sessions,
  unique_hosts,
  LAG(new_sessions) OVER (ORDER BY month) as prev_month_sessions,
  (new_sessions::float / LAG(new_sessions) OVER (ORDER BY month) - 1) * 100 as growth_rate
FROM monthly_growth
ORDER BY month DESC;
```

### Performance Scaling

#### Connection Pool Scaling
```typescript
const scalingStrategy = {
  currentConnections: 20,
  maxConnections: 100,
  scalingTriggers: {
    connectionUtilization: 0.8,  // Scale at 80%
    responseTime: 1000,          // Scale at >1s response
    errorRate: 0.05             // Scale at >5% errors
  },
  scalingSteps: [
    { threshold: 0.6, increment: 10 },
    { threshold: 0.8, increment: 20 },
    { threshold: 0.9, increment: 30 }
  ]
};
```

#### Read Replica Configuration
```sql
-- Read replica setup (if using)
-- Monitor replica lag
SELECT 
  pg_last_xact_replay_timestamp() as last_replay,
  now() - pg_last_xact_replay_timestamp() as replication_lag,
  pg_is_in_recovery() as is_replica;

-- Check replica status
SELECT 
  pid,
  state,
  client_addr,
  backend_start
FROM pg_stat_replication;
```

---

## 🔄 Backup & Recovery

### Backup Strategy

#### Automated Backups
```sql
-- Daily full backup
pg_dump -h localhost -U postgres -d social_game \
  --format=custom \
  --compress=9 \
  --file=/backups/social_game_$(date +%Y%m%d).backup

-- Hourly incremental backup (WAL archiving)
archive_command = 'cp %p /backups/wal_archive/%f'
```

#### Backup Verification
```sql
-- Verify backup integrity
pg_restore --list /backups/social_game_20240127.backup

-- Test restore to temporary database
createdb social_game_test_restore
pg_restore -h localhost -U postgres -d social_game_test_restore \
  /backups/social_game_20240127.backup
```

### Recovery Procedures

#### Point-in-Time Recovery
```bash
# 1. Stop database
sudo systemctl stop postgresql

# 2. Restore base backup
pg_restore -h localhost -U postgres -d social_game \
  /backups/social_game_base.backup

# 3. Configure recovery
echo "restore_command = 'cp /backups/wal_archive/%f %p'" >> recovery.conf
echo "recovery_target_time = '2024-01-27 14:30:00'" >> recovery.conf

# 4. Start database in recovery mode
sudo systemctl start postgresql
```

#### Selective Data Recovery
```sql
-- Recover specific table from backup
CREATE TABLE sessions_backup AS
SELECT * FROM sessions
WHERE created_at BETWEEN '2024-01-27 10:00:00' AND '2024-01-27 15:00:00';

-- Merge recovered data
INSERT INTO sessions
SELECT * FROM sessions_backup
ON CONFLICT (id) DO NOTHING;
```

---

## 🧪 Testing & Validation

### Database Testing Strategy

#### Performance Testing
```sql
-- Load testing script
CREATE OR REPLACE FUNCTION run_load_test(num_sessions int, num_teams int)
RETURNS void AS $$
DECLARE
  session_id uuid;
  team_id uuid;
BEGIN
  -- Create test sessions
  FOR i IN 1..num_sessions LOOP
    INSERT INTO sessions (code, host_uid, status)
    VALUES ('TEST' || LPAD(i::text, 4, '0'), 'test-user-' || i, 'lobby')
    RETURNING id INTO session_id;
    
    -- Create test teams
    FOR j IN 1..num_teams LOOP
      INSERT INTO teams (session_id, team_name, team_code)
      VALUES (session_id, 'Test Team ' || j, LPAD(j::text, 4, '0'))
      RETURNING id INTO team_id;
      
      -- Add team members
      INSERT INTO team_members (team_id, user_id, is_captain)
      VALUES (team_id, gen_random_uuid(), j = 1);
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

#### Data Integrity Testing
```sql
-- Foreign key validation
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public';

-- Orphaned data detection
SELECT 'team_members without teams' as issue, count(*) as count
FROM team_members tm
LEFT JOIN teams t ON tm.team_id = t.id
WHERE t.id IS NULL

UNION ALL

SELECT 'answers without sessions' as issue, count(*) as count
FROM answers a
LEFT JOIN sessions s ON a.session_id = s.id
WHERE s.id IS NULL;
```

### Migration Testing

#### Migration Validation
```sql
-- Before migration
CREATE TABLE pre_migration_snapshot AS
SELECT 
  'sessions' as table_name,
  COUNT(*) as row_count,
  MAX(created_at) as max_created_at
FROM sessions

UNION ALL

SELECT 
  'teams' as table_name,
  COUNT(*) as row_count,
  MAX(joined_at) as max_created_at
FROM teams;

-- Run migration...

-- After migration validation
SELECT 
  p.table_name,
  p.row_count as pre_count,
  a.row_count as post_count,
  a.row_count - p.row_count as difference
FROM pre_migration_snapshot p
JOIN (
  SELECT 'sessions' as table_name, COUNT(*) as row_count, MAX(created_at) as max_created_at FROM sessions
  UNION ALL
  SELECT 'teams' as table_name, COUNT(*) as row_count, MAX(joined_at) as max_created_at FROM teams
) a ON p.table_name = a.table_name;
```

---

## 📊 Reporting & Analytics

### Operational Reports

#### Daily Operations Report
```sql
-- Daily database health report
WITH daily_stats AS (
  SELECT 
    COUNT(*) as new_sessions,
    COUNT(DISTINCT host_uid) as unique_hosts,
    AVG(EXTRACT(EPOCH FROM (COALESCE(ended_at, NOW()) - started_at))/60) as avg_duration_minutes
  FROM sessions
  WHERE DATE(created_at) = CURRENT_DATE
),
performance_stats AS (
  SELECT 
    AVG(mean_exec_time) as avg_query_time,
    COUNT(*) as total_queries,
    COUNT(CASE WHEN mean_exec_time > 1000 THEN 1 END) as slow_queries
  FROM pg_stat_statements
)
SELECT 
  CURRENT_DATE as report_date,
  ds.new_sessions,
  ds.unique_hosts,
  ROUND(ds.avg_duration_minutes, 2) as avg_session_duration,
  ROUND(ps.avg_query_time, 2) as avg_query_time_ms,
  ps.slow_queries,
  ps.total_queries
FROM daily_stats ds, performance_stats ps;
```

#### Weekly Performance Report
```sql
-- Weekly performance trends
SELECT 
  DATE_TRUNC('week', created_at) as week,
  COUNT(*) as sessions_created,
  COUNT(DISTINCT host_uid) as unique_hosts,
  AVG(EXTRACT(EPOCH FROM (COALESCE(ended_at, NOW()) - started_at))/60) as avg_duration,
  COUNT(CASE WHEN status = 'ended' THEN 1 END) as completed_sessions
FROM sessions
WHERE created_at > NOW() - INTERVAL '8 weeks'
GROUP BY DATE_TRUNC('week', created_at)
ORDER BY week DESC;
```

### Capacity Planning Reports

#### Storage Forecasting
```sql
-- Storage growth projection
WITH monthly_growth AS (
  SELECT 
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as sessions,
    AVG(pg_total_relation_size('public.sessions')) as avg_session_size
  FROM sessions
  WHERE created_at > NOW() - INTERVAL '12 months'
  GROUP BY DATE_TRUNC('month', created_at)
),
growth_rate AS (
  SELECT 
    month,
    sessions,
    LAG(sessions) OVER (ORDER BY month) as prev_sessions,
    (sessions::float / LAG(sessions) OVER (ORDER BY month) - 1) * 100 as growth_rate
  FROM monthly_growth
)
SELECT 
  month,
  sessions,
  ROUND(growth_rate, 2) as growth_rate_percent,
  CASE 
    WHEN growth_rate > 10 THEN 'HIGH_GROWTH'
    WHEN growth_rate > 5 THEN 'MODERATE_GROWTH'
    WHEN growth_rate > 0 THEN 'LOW_GROWTH'
    ELSE 'DECLINE'
  END as growth_category
FROM growth_rate
WHERE month IS NOT NULL
ORDER BY month DESC;
```

---

## 🔮 Future Operations Planning

### Scalability Planning

#### Database Scaling Roadmap
```typescript
const scalingRoadmap = {
  current: {
    maxConnections: 20,
    storage: '100GB',
    performance: 'Sub-100ms queries'
  },
  '6_months': {
    maxConnections: 50,
    storage: '250GB',
    features: ['Read replicas', 'Connection pooling']
  },
  '12_months': {
    maxConnections: 100,
    storage: '500GB',
    features: ['Sharding', 'Distributed queries']
  },
  '24_months': {
    maxConnections: 200,
    storage: '1TB+',
    features: ['Multi-region', 'Auto-scaling']
  }
};
```

#### Technology Evolution
- **PostgreSQL upgrades**: Stay current with stable releases
- **Extensions**: Consider pg_stat_statements, pg_repack, pg_partman
- **Monitoring**: Enhanced metrics with Prometheus/Grafana
- **Automation**: Self-healing capabilities and auto-scaling

### Operational Excellence

#### Automation Opportunities
- **Auto-indexing**: AI-driven index recommendations
- **Query optimization**: Automatic slow query analysis
- **Capacity management**: Predictive scaling based on trends
- **Backup verification**: Automated restore testing

#### Process Improvements
- **DevOps integration**: Database as code with migrations
- **Security automation**: Continuous compliance monitoring
- **Performance monitoring**: Real-time alerting and response
- **Documentation**: Living documentation with automated updates

---

*This operations guide provides comprehensive procedures for database maintenance, performance optimization, incident response, and operational excellence, ensuring reliable and scalable database operations.*
