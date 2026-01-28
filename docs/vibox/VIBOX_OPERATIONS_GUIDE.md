# VIBox Operations Guide

## Overview

This operations guide covers quick start procedures, logging and monitoring, code quality standards, and operational checklists for maintaining the VIBox jukebox system in production environments.

---

## 🚀 Quick Start Guide

### Deploy in 5 Minutes

#### Step 1: Deploy to Vercel

```bash
cd apps/vibox-api
pnpm deploy
```

Follow the prompts to connect your GitHub account and deploy.

#### Step 2: Configure Environment Variables

In Vercel dashboard, add these environment variables:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:5175
NODE_ENV=production
```

#### Step 3: Test Your API

```bash
# Health check
curl https://your-vibox-api.vercel.app/api/health

# Get queue
curl https://your-vibox-api.vercel.app/api/queue

# Add test track
curl -X POST https://your-vibox-api.vercel.app/api/queue/add \
  -H "Content-Type: application/json" \
  -d '{
    "track_id": "test-123",
    "track_title": "Test Song",
    "track_artist": "Test Artist",
    "track_url": "https://example.com/test.mp3",
    "primary_vibe": "chill",
    "added_by": "test-user"
  }'
```

#### Step 4: Use in Your App

```bash
# Add client library
cd apps/pubFeed
pnpm add @social/vibox-client
```

```typescript
// Use in your component
import { ViboxClient } from '@social/vibox-client';

const vibox = new ViboxClient({
  apiUrl: 'https://your-vibox-api.vercel.app',
  supabaseUrl: process.env.VITE_SUPABASE_URL!,
  supabaseKey: process.env.VITE_SUPABASE_ANON_KEY!,
});

// Get queue
const { data } = await vibox.getQueue();

// Add track
await vibox.addToQueue({
  track_id: 'song-123',
  track_title: 'My Song',
  track_artist: 'Artist',
  track_url: 'https://example.com/song.mp3',
  primary_vibe: 'chill',
  added_by: 'user-name',
});
```

### What You Get

✅ Unified queue across all apps  
✅ Real-time synchronization  
✅ Type-safe TypeScript client  
✅ Production-ready API  
✅ Analytics endpoints  
✅ Mobile-responsive interface  

---

## 📊 Logging & Monitoring

### Logging Strategy

#### Structured Logging Implementation

```typescript
// Logger configuration
import { createLogger } from 'winston';

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'vibox.log' })
  ]
});
```

#### Log Levels and Usage

**ERROR Level:**
```typescript
logger.error('API request failed', {
  error: error.message,
  stack: error.stack,
  endpoint: req.path,
  method: req.method,
  userId: req.user?.id,
  timestamp: new Date().toISOString()
});
```

**WARN Level:**
```typescript
logger.warn('Queue position conflict detected', {
  trackId: track.id,
  requestedPosition: newPosition,
  currentPosition: currentPosition,
  resolution: 'recalculated'
});
```

**INFO Level:**
```typescript
logger.info('Track added to queue', {
  trackId: track.id,
  trackTitle: track.title,
  addedBy: user.name,
  queuePosition: newPosition,
  sessionId: session.id
});
```

**DEBUG Level:**
```typescript
logger.debug('Real-time subscription event', {
  eventType: payload.eventType,
  table: payload.table,
  recordId: payload.record.id,
  changes: payload.record
});
```

### Key Metrics to Monitor

#### Application Metrics

**API Performance:**
- Response time (p50, p95, p99)
- Request rate per endpoint
- Error rate by endpoint
- Concurrent connections

**Queue Operations:**
- Tracks added per minute
- Average queue depth
- Skip vote success rate
- Track completion rate

**User Engagement:**
- Active users per session
- Average session duration
- Feature usage rates
- Mobile vs desktop usage

#### Infrastructure Metrics

**Server Health:**
- CPU utilization
- Memory usage
- Disk I/O
- Network throughput

**Database Performance:**
- Query execution time
- Connection pool usage
- Index efficiency
- Lock wait times

**Real-time Performance:**
- WebSocket connections
- Message delivery rate
- Subscription latency
- Connection churn rate

### Monitoring Setup

#### Vercel Analytics

```typescript
// Custom event tracking
import { Analytics } from '@vercel/analytics/react';

// Track custom events
analytics.track('track_added_to_queue', {
  vibe: track.primary_vibe,
  source: 'mobile',
  session_length: session.duration
});
```

#### Supabase Monitoring

```sql
-- Enable query logging
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 100;

-- Monitor real-time subscriptions
SELECT * FROM pg_stat_activity 
WHERE application_name LIKE 'supabase.realtime%';
```

#### Custom Dashboard

```typescript
// Real-time metrics collection
const collectMetrics = async () => {
  const metrics = {
    queueDepth: await getQueueDepth(),
    activeUsers: await getActiveUserCount(),
    responseTime: await getAverageResponseTime(),
    errorRate: await getErrorRate()
  };
  
  await sendToMonitoring(metrics);
};
```

### Alert Configuration

#### Critical Alerts

**Service Down:**
```yaml
- alert: VIBOX_SERVICE_DOWN
  expr: up{job="vibox-api"} == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "VIBox API service is down"
```

**High Error Rate:**
```yaml
- alert: HIGH_ERROR_RATE
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
  for: 2m
  labels:
    severity: warning
  annotations:
    summary: "High error rate detected"
```

**Queue Stalled:**
```yaml
- alert: QUEUE_STALLED
  expr: time_since_last_track_played > 300
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Queue has not progressed in 5 minutes"
```

---

## 🔍 Code Quality Standards

### TypeScript Guidelines

#### Type Definitions

```typescript
// Strict typing for all interfaces
interface ViboxQueueItem {
  readonly id: string;
  readonly track_id: string;
  readonly track_title: string;
  readonly track_artist: string;
  readonly primary_vibe: VibeType;
  readonly added_at: Date;
  readonly added_by: string;
  position: number;
  is_played: boolean;
}

// Use discriminated unions
type QueueEvent = 
  | { type: 'TRACK_ADDED'; payload: ViboxQueueItem }
  | { type: 'TRACK_REMOVED'; payload: { id: string } }
  | { type: 'POSITION_CHANGED'; payload: { id: string; newPosition: number } };
```

#### Error Handling

```typescript
// Result pattern for error handling
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

// Usage
const addToQueue = async (track: TrackData): Promise<Result<ViboxQueueItem>> => {
  try {
    const result = await supabase.from('vibox_queue').insert(track).single();
    
    if (result.error) {
      return { 
        success: false, 
        error: new Error(`Database error: ${result.error.message}`) 
      };
    }
    
    return { success: true, data: result.data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Unknown error') 
    };
  }
};
```

### Testing Standards

#### Unit Tests

```typescript
// Test structure with AAA pattern
describe('ViboxClient', () => {
  describe('addToQueue', () => {
    it('should add track to queue successfully', async () => {
      // Arrange
      const client = new ViboxClient(mockConfig);
      const trackData = createMockTrackData();
      
      // Act
      const result = await client.addToQueue(trackData);
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.track_title).toBe(trackData.track_title);
    });
    
    it('should handle validation errors', async () => {
      // Arrange
      const client = new ViboxClient(mockConfig);
      const invalidTrack = { ...createMockTrackData(), track_title: '' };
      
      // Act
      const result = await client.addToQueue(invalidTrack);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(ValidationError);
    });
  });
});
```

#### Integration Tests

```typescript
// API integration tests
describe('VIBox API Integration', () => {
  let testServer: TestServer;
  
  beforeAll(async () => {
    testServer = await setupTestServer();
  });
  
  afterAll(async () => {
    await testServer.cleanup();
  });
  
  it('should handle real-time queue updates', async () => {
    const client = new ViboxClient(testServer.config);
    
    // Subscribe to updates
    const updates: QueueEvent[] = [];
    client.subscribe(event => updates.push(event));
    
    // Add track
    const track = await client.addToQueue(createMockTrackData());
    
    // Wait for real-time update
    await waitFor(() => updates.length > 0);
    
    expect(updates[0].type).toBe('TRACK_ADDED');
    expect(updates[0].payload.id).toBe(track.data?.id);
  });
});
```

### Code Review Checklist

#### Functionality
- [ ] All requirements implemented
- [ ] Edge cases handled
- [ ] Error scenarios covered
- [ ] Performance considerations addressed

#### Code Quality
- [ ] TypeScript strict mode compliance
- [ ] No any types used
- [ ] Proper error handling
- [ ] Consistent naming conventions

#### Testing
- [ ] Unit tests written
- [ ] Integration tests covered
- [ ] Edge cases tested
- [ ] Performance tests included

#### Security
- [ ] Input validation implemented
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] Authentication checks

---

## 📋 Operational Checklists

### Daily Operations

#### Morning Checklist (9:00 AM)

**System Health:**
- [ ] Check API response times
- [ ] Verify database connectivity
- [ ] Review error logs
- [ ] Monitor active sessions

**Queue Status:**
- [ ] Check for stuck queues
- [ ] Review overnight activity
- [ ] Verify data consistency
- [ ] Check for orphaned records

**Performance Review:**
- [ ] Review response time metrics
- [ ] Check memory usage
- [ ] Monitor database performance
- [ ] Verify real-time subscriptions

**Security Check:**
- [ ] Review authentication logs
- [ ] Check for unusual activity
- [ ] Verify rate limiting effectiveness
- [ ] Monitor API abuse

#### Evening Checklist (6:00 PM)

**Daily Summary:**
- [ ] Generate daily usage report
- [ ] Review revenue metrics
- [ ] Analyze peak usage times
- [ ] Document any issues

**Data Backup:**
- [ ] Verify database backups
- [ ] Check backup integrity
- [ ] Test restore procedures
- [ ] Archive daily logs

**Maintenance Tasks:**
- [ ] Clean up old queue data
- [ ] Optimize database tables
- [ ] Update analytics cache
- [ ] Review system alerts

### Weekly Operations

#### Monday Weekly Review

**Performance Analysis:**
- [ ] Review weekly performance trends
- [ ] Analyze slow queries
- [ ] Check memory leaks
- [ ] Optimize database indexes

**Feature Usage:**
- [ ] Analyze feature adoption rates
- [ ] Review user feedback
- [ ] Identify popular features
- [ ] Plan feature improvements

**Security Audit:**
- [ ] Review access logs
- [ ] Check for security vulnerabilities
- [ ] Update dependencies
- [ ] Review user permissions

#### Friday Weekly Planning

**Capacity Planning:**
- [ ] Review growth trends
- [ ] Plan scaling needs
- [ ] Budget resource requirements
- [ ] Schedule maintenance windows

**Team Coordination:**
- [ ] Review development progress
- [ ] Plan upcoming features
- [ ] Assign tasks for next week
- [ ] Schedule code reviews

### Monthly Operations

#### Monthly Performance Review

**System Performance:**
- [ ] Analyze monthly performance trends
- [ ] Review capacity utilization
- [ ] Plan infrastructure upgrades
- [ ] Optimize cost efficiency

**Business Metrics:**
- [ ] Review revenue trends
- [ ] Analyze user growth
- [ ] Calculate customer lifetime value
- [ ] Review churn rates

**Technical Debt:**
- [ ] Identify refactoring opportunities
- [ ] Plan library updates
- [ ] Review architecture decisions
- [ ] Schedule technical improvements

#### Monthly Security Review

**Security Assessment:**
- [ ] Conduct penetration testing
- [ ] Review security policies
- [ ] Update security protocols
- [ ] Train team on security best practices

**Compliance Check:**
- [ ] Review GDPR compliance
- [ ] Check data privacy policies
- [ ] Verify user consent mechanisms
- [ ] Update privacy documentation

### Incident Response

#### Severity Levels

**Critical (P0):**
- Service completely down
- Data loss or corruption
- Security breach
- Revenue impact > $1000/hour

**High (P1):**
- Major feature broken
- Performance degradation
- Security vulnerability
- User experience severely impacted

**Medium (P2):**
- Minor feature issues
- Performance issues
- Non-critical bugs
- User experience moderately impacted

**Low (P3):**
- Cosmetic issues
- Documentation problems
- Minor bugs
- User experience slightly impacted

#### Response Procedures

**Immediate Response (0-15 minutes):**
1. Acknowledge incident
2. Assess severity level
3. Form response team
4. Establish communication channel

**Investigation (15-60 minutes):**
1. Identify root cause
2. Determine impact scope
3. Implement temporary fix
4. Communicate with stakeholders

**Resolution (1-4 hours):**
1. Implement permanent fix
2. Verify resolution
3. Monitor for recurrence
4. Document lessons learned

**Post-Incident (24-48 hours):**
1. Conduct post-mortem
2. Update procedures
3. Implement preventive measures
4. Share findings with team

---

## 🛠️ Troubleshooting

### Common Issues & Solutions

#### API Issues

**Slow Response Times:**
```bash
# Check API health
curl -w "@curl-format.txt" https://your-api.vercel.app/api/health

# Monitor response times
curl -w "@curl-format.txt" https://your-api.vercel.app/api/queue
```

**Database Connection Issues:**
```sql
-- Check connection pool
SELECT * FROM pg_stat_activity 
WHERE state = 'active' AND application_name = 'vibox-api';

-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

#### Real-time Issues

**WebSocket Connection Problems:**
```typescript
// Debug WebSocket connections
const debugConnection = () => {
  console.log('Connection state:', supabase.realtime.isConnected());
  console.log('Active channels:', supabase.realtime.channels.length);
  console.log('Connection params:', supabase.realtime.connectParams);
};
```

**Subscription Not Receiving Updates:**
```sql
-- Check publication status
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'vibox_queue';
```

#### Performance Issues

**High Memory Usage:**
```bash
# Check memory usage
node --inspect app.js

# Profile memory
node --inspect --prof app.js
```

**Database Performance:**
```sql
-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM vibox_queue 
WHERE session_id = $1 
ORDER BY position;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch 
FROM pg_stat_user_indexes 
WHERE tablename = 'vibox_queue';
```

### Debug Tools

#### Logging Dashboard

```typescript
// Real-time log viewer
const LogViewer = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  useEffect(() => {
    const ws = new WebSocket('wss://your-api.vercel.app/logs');
    
    ws.onmessage = (event) => {
      const log = JSON.parse(event.data);
      setLogs(prev => [log, ...prev.slice(0, 999)]);
    };
    
    return () => ws.close();
  }, []);
  
  return (
    <div>
      {logs.map(log => (
        <div key={log.timestamp}>
          [{log.level}] {log.message}
        </div>
      ))}
    </div>
  );
};
```

#### Performance Monitor

```typescript
// Performance monitoring
const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<Metrics>({});
  
  useEffect(() => {
    const interval = setInterval(async () => {
      const response = await fetch('/api/metrics');
      const data = await response.json();
      setMetrics(data);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div>
      <h3>Response Time: {metrics.responseTime}ms</h3>
      <h3>Queue Depth: {metrics.queueDepth}</h3>
      <h3>Active Users: {metrics.activeUsers}</h3>
    </div>
  );
};
```

---

## 📚 Documentation Maintenance

### Documentation Standards

#### API Documentation
- OpenAPI/Swagger specifications
- Interactive API explorer
- Code examples for all endpoints
- Error response documentation

#### User Documentation
- Getting started guides
- Feature tutorials
- Troubleshooting guides
- FAQ sections

#### Developer Documentation
- Architecture diagrams
- Database schema documentation
- Deployment guides
- Contributing guidelines

### Review Schedule

#### Monthly Reviews
- [ ] Update API documentation
- [ ] Review user guides for accuracy
- [ ] Update troubleshooting guides
- [ ] Check for broken links

#### Quarterly Reviews
- [ ] Comprehensive documentation audit
- [ ] Update architectural diagrams
- [ ] Review security documentation
- [ ] Update compliance documentation

---

*This operations guide provides the essential procedures and standards for maintaining VIBox in production environments, from quick deployment to ongoing operational excellence.*
