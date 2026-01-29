# Database Documentation

## Overview

This comprehensive database documentation covers the complete Social Game Engine database schema, operations, security, and maintenance procedures. The database supports multiple game modes, team-based gameplay, real-time features, and venue management.

## 📚 Documentation Structure

### [DATABASE_COMPLETE_GUIDE.md](./DATABASE_COMPLETE_GUIDE.md)
**Complete schema documentation covering:**
- Full table schemas for all 25+ tables
- Data relationships and flows across game modes
- Security policies and access control
- Performance optimization and indexing
- Real-time subscription patterns
- Game mode implementations (Classic, Jeopardy, Top Comment, VIBox)

### [DATABASE_OPERATIONS.md](./DATABASE_OPERATIONS.md)
**Operational procedures and maintenance:**
- Daily/weekly/monthly health checks
- Performance monitoring and optimization
- Incident response and troubleshooting
- Backup and recovery procedures
- Security operations and access management
- Capacity planning and scaling strategies

---

## 🏗️ Database Architecture

### Core Design Principles
- **Multi-game support**: Classic, Jeopardy, Top Comment, VIBox modes
- **Team-based gameplay**: Multiple players per team with captain system
- **Real-time capabilities**: WebSocket subscriptions and live updates
- **Venue management**: Multi-venue support with staff permissions
- **Anonymous users**: Guest participation with upgrade paths
- **Analytics tracking**: Comprehensive session and user analytics

### Schema Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Sessions      │    │     Teams       │    │   Team Members  │
│                 │    │                 │    │                 │
│  • id (UUID)    │◄───┤  • id (UUID)    │◄───┤  • id (UUID)    │
│  • code (TEXT)  │    │  • session_id   │    │  • team_id      │
│  • host_uid     │    │  • team_name    │    │  • user_id      │
│  • status       │    │  • captain_id   │    │  • device_id    │
│  • settings     │    │  • score        │    │  • is_captain   │
│  • category_grid│    │  • team_code    │    │  • joined_at    │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                       │
          └──────────────────────┼───────────────────────┘
                                 │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Answers     │    │      Votes      │    │  Prompt Libraries│
│                 │    │                 │    │                 │
│  • id (UUID)    │◄───┤  • id (UUID)    │    │  • id (TEXT)    │
│  • session_id   │    │  • session_id   │    │  • name         │
│  • team_id      │    │  • voter_id     │    │  • emoji        │
│  • round_index  │    │  • answer_id    │    │  • description  │
│  • text         │    │  • round_index  │    │  • is_active    │
│  • masked       │    │  • group_id     │    │  • sort_order   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 📊 Key Tables Overview

### Core Game Tables

#### `sessions` - Game Sessions
**Purpose**: Central table for all game sessions across all game modes

**Key Fields:**
- `id` (UUID): Primary identifier
- `code` (TEXT): 6-digit session code (ABC123)
- `host_uid` (TEXT): Host user ID
- `status` (TEXT): lobby, category-select, answer, vote, results, ended
- `settings` (JSONB): Game configuration
- `category_grid` (JSONB): Jeopardy mode category grid
- `max_teams` (INTEGER): Maximum teams allowed

#### `teams` - Team Information
**Purpose**: Team data with captain system and scoring

**Key Fields:**
- `id` (UUID): Primary identifier
- `session_id` (UUID): Reference to session
- `team_name` (TEXT): Display name
- `captain_id` (UUID): Captain user reference
- `team_code` (VARCHAR): 4-digit join code
- `score` (INTEGER): Accumulated points

#### `team_members` - Team Membership
**Purpose**: Individual team members with roles and device tracking

**Key Fields:**
- `user_id` (UUID): Auth user ID (or NULL for anonymous)
- `device_id` (VARCHAR): Anonymous user device ID
- `is_captain` (BOOLEAN): Captain flag
- `player_name` (TEXT): Display name for anonymous users

### Game Content Tables

#### `prompt_libraries` - Question Categories
**Purpose**: Organized collections of prompts/questions

**Key Fields:**
- `id` (TEXT): Category identifier
- `name` (TEXT): Display name
- `emoji` (TEXT): Category icon
- `is_active` (BOOLEAN): Availability status

#### `prompts` - Individual Questions
**Purpose**: Individual questions with analytics tracking

**Key Fields:**
- `library_id` (TEXT): Reference to category
- `text` (TEXT): Question content
- `times_shown` (INTEGER): Usage analytics
- `avg_answer_time_ms` (INTEGER): Performance analytics

### Game Mode Specific Tables

#### Top Comment Tables
- `top_comment_sessions`: Individual player sessions
- `top_comment_players`: Player records (no teams)
- `top_comment_answers`: Individual player answers
- `top_comment_votes`: Player voting system

#### VIBox Tables
- `vibox_queue`: Music queue management
- `vibex_votes`: Music voting system

---

## 🎯 Game Mode Implementations

### Classic Mode
- **Simple flow**: Lobby → Answer → Vote → Results → Repeat
- **Team-based**: Multiple players per team
- **Captain system**: Captain submits final answer
- **Standard scoring**: Points based on votes

### Jeopardy Mode
- **Category selection**: 6×7 grid with host/team selection
- **Strategic gameplay**: Categories deplete as used
- **Enhanced scoring**: Point values and multipliers
- **Extended flow**: Lobby → Category-Select → Answer → Vote → Results

#### Jeopardy Category Grid Structure
```json
{
  "categories": [
    {
      "id": "popculture",
      "usedPrompts": [0, 2, 5],
      "promptBonuses": [
        {
          "promptIndex": 0,
          "bonusType": "points",
          "bonusValue": 100,
          "revealed": true
        }
      ]
    }
  ],
  "totalSlots": 42
}
```

### Top Comment Mode
- **Individual players**: No teams, direct competition
- **Social voting**: Players vote on individual answers
- **Legacy support**: Maintained for backward compatibility
- **Separate tables**: Dedicated top_comment_* tables

### VIBox Mode
- **Music queue**: Track selection and voting
- **Vibe system**: Primary/secondary music categorization
- **Analytics**: Detailed play statistics and user preferences
- **Real-time updates**: Queue position and voting status

---

## 🔐 Security & Access Control

### Row Level Security (RLS)
- **Session access**: Users only see sessions they're in
- **Team management**: Team members can view their team
- **Answer submission**: Teams only submit to their sessions
- **Vote casting**: Teams only vote in their sessions

### User Authentication
- **Authenticated users**: `user_id` references `auth.users(id)`
- **Anonymous users**: `device_id` with upgrade path
- **Mixed authentication**: Supports both in same session
- **Captain system**: Role-based permissions within teams

### Data Validation
- **Session codes**: 6-digit alphanumeric validation
- **Team codes**: 4-digit numeric validation
- **Answer content**: Length and content validation
- **JSONB schemas**: Structured data validation

---

## 📈 Performance Optimization

### Indexing Strategy
- **Primary indexes**: Session codes, team codes, user references
- **Performance indexes**: Common query patterns optimized
- **JSONB indexes**: GIN indexes for structured data
- **Partial indexes**: Frequently filtered subsets

### Query Optimization
- **N+1 prevention**: Join-based data fetching
- **Connection pooling**: Efficient connection management
- **Real-time subscriptions**: Optimized WebSocket patterns
- **Caching strategies**: Application-level caching

### Monitoring Metrics
```typescript
const performanceMetrics = {
  connections: {
    active: 15,
    idle: 5,
    max: 20
  },
  queries: {
    avgTime: 87,
    slowQueries: 2,
    cacheHitRate: 85
  },
  storage: {
    totalSize: '2.3GB',
    growthRate: '15%/month'
  }
};
```

---

## 🚀 Quick Start

### Database Connection
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
```

### Common Queries

#### Create Session
```typescript
const session = await supabase
  .from('sessions')
  .insert({
    code: 'ABC123',
    host_uid: 'user-123',
    status: 'lobby',
    settings: { maxTeams: 20, voteSecs: 30 }
  })
  .select()
  .single();
```

#### Join Team
```typescript
const teamMember = await supabase
  .from('team_members')
  .insert({
    team_id: 'team-123',
    user_id: 'user-456',
    is_captain: false
  })
  .select();
```

#### Submit Answer
```typescript
const answer = await supabase
  .from('answers')
  .insert({
    session_id: 'session-123',
    team_id: 'team-123',
    round_index: 1,
    group_id: 'group-1',
    text: 'Team answer here',
    masked: false
  })
  .select();
```

### Real-time Subscriptions
```typescript
// Subscribe to session updates
const subscription = supabase
  .channel(`session-${sessionId}`)
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'sessions' },
    (payload) => handleSessionUpdate(payload)
  )
  .subscribe();
```

---

## 📊 Database Statistics

### Current Scale
- **Total Tables**: 25+ tables across all features
- **Active Sessions**: ~1,000 concurrent sessions
- **Team Count**: ~3,000 active teams
- **User Base**: ~10,000 registered users
- **Storage**: ~2.3GB total data
- **Query Volume**: ~50,000 queries/hour

### Performance Metrics
- **Average Query Time**: 87ms
- **Cache Hit Rate**: 85%
- **Connection Utilization**: 75%
- **Uptime**: 99.8%
- **Error Rate**: 0.2%

### Growth Trends
- **Session Growth**: 15% month-over-month
- **User Growth**: 12% month-over-month
- **Data Growth**: 10GB per year
- **Query Growth**: 20% month-over-month

---

## 🆘 Support & Troubleshooting

### Common Issues

#### Connection Problems
- **Symptoms**: Timeouts, connection refused
- **Causes**: Max connections reached, network issues
- **Solutions**: Check connection pool, verify network

#### Performance Issues
- **Symptoms**: Slow queries, high response times
- **Causes**: Missing indexes, inefficient queries
- **Solutions**: Analyze query plans, add indexes

#### Data Inconsistencies
- **Symptoms**: Orphaned records, broken references
- **Causes**: Failed transactions, concurrent updates
- **Solutions**: Data validation scripts, cleanup procedures

### Getting Help
1. **Check Documentation**: Review relevant sections
2. **Run Diagnostics**: Use health check scripts
3. **Review Logs**: Check database logs and error messages
4. **Contact Support**: database-team@company.com

### Emergency Contacts
- **Critical Issues**: emergency-db@company.com (24/7)
- **Performance Issues**: perf-db@company.com
- **Security Issues**: security-db@company.com

---

## 📝 Documentation History

**Consolidated from 4 documents to 2 comprehensive guides:**
- `DATABASE_ANALYSIS.md` → Merged into Complete Guide
- `DATABASE_SCHEMA_GUIDE.md` → Merged into Complete Guide
- `EDGE_FUNCTION_RLS_FIX.md` → Merged into Operations Guide
- `RLS_RECURSION_FIX.md` → Merged into Operations Guide

**Schema Updates:**
- Updated with current Supabase schema (2024-01-27)
- Added all game mode specific tables
- Included venue management and social features
- Enhanced security and performance sections

---

## 🔮 Future Database Enhancements

### Planned Features

#### Game Mode Expansion
- **New game modes**: Additional gaming experiences
- **Enhanced analytics**: Deeper insights and metrics
- **Advanced moderation**: AI-powered content filtering
- **Social features**: Enhanced user interactions

#### Technology Improvements
- **Read replicas**: Improved read performance
- **Partitioning**: Large dataset management
- **Advanced caching**: Redis integration
- **GraphQL API**: More efficient data access

#### Scalability Planning
- **Multi-region**: Global deployment
- **Auto-scaling**: Dynamic resource allocation
- **Microservices**: Service isolation
- **Event sourcing**: Audit trail and replay

---

## 📚 Additional Resources

### Development Resources
- **Migration Scripts**: Database schema updates
- **Seed Data**: Test data generation
- **Query Examples**: Common patterns and optimizations
- **Performance Tuning**: Best practices and guidelines

### Operational Resources
- **Backup Procedures**: Automated backup strategies
- **Monitoring Setup**: Metrics and alerting configuration
- **Security Checklists**: Access control and compliance
- **Troubleshooting Guides**: Common issues and solutions

### Learning Resources
- **Database Design**: Schema design principles
- **PostgreSQL Features**: Advanced PostgreSQL capabilities
- **Supabase Features**: Platform-specific optimizations
- **Real-time Patterns**: WebSocket subscription patterns

---

*This consolidated database documentation provides comprehensive coverage of the entire database system, from schema design to operational procedures, while maintaining easy navigation and reducing maintenance overhead.*
