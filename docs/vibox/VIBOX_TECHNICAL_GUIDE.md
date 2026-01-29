# VIBox Technical Guide

## Overview

This comprehensive technical guide covers the VIBox API implementation, database setup, deployment, and architecture for the Social Game Engine's music jukebox system.

**Goal**: Create a centralized VIBox server that all apps communicate with, while maintaining real-time synchronization and analytics.

---

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   pubFeed       │    │   dashboard      │    │   other apps    │
│                 │    │                  │    │                 │
│  ┌───────────┐  │    │  ┌───────────┐  │    │  ┌───────────┐  │
│  │ VIBox UI  │  │    │  │ VIBox UI  │  │    │  │ VIBox UI  │  │
│  └───────────┘  │    │  └───────────┘  │    │  └───────────┘  │
└─────────┬───────┘    └─────────┬────────┘    └─────────┬───────┘
          │                      │                       │
          └──────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │      vibox-api           │
                    │   (Vercel Serverless)    │
                    │                           │
                    │  ┌─────────────────────┐ │
                    │  │   Supabase DB       │ │
                    │  │  ┌───────────────┐  │ │
                    │  │  │ vibox_queue   │ │ │
                    │  │  └───────────────┘  │ │
                    │  └─────────────────────┘ │
                    └───────────────────────────┘
```

---

## Database Schema

### `vibox_queue` Table

**Core Track Information:**
- `id` (UUID, Primary Key)
- `track_id` (TEXT) - External track identifier
- `track_title` (TEXT) - Song title
- `track_artist` (TEXT) - Artist name
- `track_url` (TEXT) - Audio file URL
- `track_genre` (TEXT) - Music genre
- `track_duration` (INTEGER) - Length in seconds

**Vibe Metadata:**
- `primary_vibe` (TEXT) - Main mood category
- `secondary_vibe` (TEXT) - Secondary mood category

**Queue Management:**
- `position` (INTEGER) - Queue position
- `is_played` (BOOLEAN) - Track playback status
- `played_at` (TIMESTAMP) - When track was played
- `added_at` (TIMESTAMP) - When added to queue

**User Analytics:**
- `added_by` (TEXT) - Display name
- `added_by_user_id` (UUID) - User identifier
- `device_type` (TEXT) - Client device
- `user_agent` (TEXT) - Browser info
- `ip_address` (INET) - Client IP
- `session_id` (TEXT) - Game session
- `team_uid` (TEXT) - Team identifier

**Advanced Analytics:**
- `time_in_queue` (INTEGER) - Seconds waiting
- `skip_count` (INTEGER) - Times skipped
- `play_duration` (INTEGER) - Seconds played
- `completion_percentage` (NUMERIC) - % completed
- `queue_length_when_added` (INTEGER) - Queue size at addition
- `time_of_day` (TIME) - Addition time
- `day_of_week` (INTEGER) - Day number

**Migration Location:** `supabase/migrations/20260110_create_vibox_queue.sql`

---

## API Implementation

### Core Endpoints

#### `GET /api/health`
Health check endpoint
```typescript
// Response
{
  status: "healthy",
  timestamp: string,
  version: string
}
```

#### `GET /api/queue`
Retrieve current music queue
```typescript
// Response
{
  queue: ViboxQueueItem[],
  total: number,
  nowPlaying: ViboxQueueItem | null
}
```

#### `POST /api/queue/add`
Add track to queue
```typescript
// Request
{
  track_id: string,
  track_title: string,
  track_artist: string,
  track_url: string,
  primary_vibe: string,
  secondary_vibe?: string,
  added_by: string,
  added_by_user_id?: string
}

// Response
{
  success: boolean,
  queueItem: ViboxQueueItem,
  position: number
}
```

#### `DELETE /api/queue/:id`
Remove track from queue
```typescript
// Response
{
  success: boolean,
  message: string
}
```

#### `PUT /api/queue/:id/play`
Mark track as played
```typescript
// Response
{
  success: boolean,
  playedAt: string
}
```

#### `GET /api/analytics`
Queue analytics
```typescript
// Response
{
  totalPlays: number,
  averagePlayTime: number,
  topVibes: Array<{vibe: string, count: number}>,
  peakHours: Array<{hour: number, plays: number}>
}
```

### TypeScript Interfaces

```typescript
interface ViboxQueueItem {
  id: string;
  track_id: string;
  track_title: string;
  track_artist: string;
  track_url: string;
  track_genre?: string;
  track_duration?: number;
  primary_vibe: string;
  secondary_vibe?: string;
  position: number;
  is_played: boolean;
  played_at?: string;
  added_at: string;
  added_by: string;
  added_by_user_id?: string;
  device_type?: string;
  user_agent?: string;
  ip_address?: string;
  session_id?: string;
  team_uid?: string;
  time_in_queue?: number;
  skip_count?: number;
  play_duration?: number;
  completion_percentage?: number;
  queue_length_when_added?: number;
  time_of_day?: string;
  day_of_week?: number;
}

interface ViboxClientConfig {
  apiUrl: string;
  supabaseUrl: string;
  supabaseKey: string;
}
```

---

## Real-time Implementation

### Supabase Real-time Subscriptions

```typescript
// Queue subscription
const channel = supabase
  .channel('vibox-queue')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'vibox_queue'
    },
    (payload) => {
      handleQueueUpdate(payload);
    }
  )
  .subscribe();
```

### Event Types

- `INSERT` - New track added to queue
- `UPDATE` - Track status changed (played, position updated)
- `DELETE` - Track removed from queue

---

## Client Library

### Installation

```bash
cd apps/pubFeed
pnpm add @social/vibox-client
```

### Usage

```typescript
import { ViboxClient } from '@social/vibox-client';

const vibox = new ViboxClient({
  apiUrl: process.env.VITE_VIBOX_API_URL!,
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

// Subscribe to updates
const unsubscribe = vibox.subscribe((event) => {
  console.log('Queue updated:', event);
});
```

### React Hook Example

```typescript
import { useEffect, useState } from 'react';
import { ViboxClient, ViboxQueueItem } from '@social/vibox-client';

export function useViboxQueue() {
  const [queue, setQueue] = useState<ViboxQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [client] = useState(() => new ViboxClient({
    apiUrl: process.env.VITE_VIBOX_API_URL!,
    supabaseUrl: process.env.VITE_SUPABASE_URL!,
    supabaseKey: process.env.VITE_SUPABASE_ANON_KEY!,
  }));

  useEffect(() => {
    const loadQueue = async () => {
      try {
        const { data } = await client.getQueue();
        if (data) {
          setQueue(data.queue);
        }
      } catch (error) {
        console.error('Failed to load queue:', error);
      } finally {
        setLoading(false);
      }
    };

    loadQueue();

    const unsubscribe = client.subscribe(() => {
      loadQueue(); // Refresh queue on updates
    });

    return unsubscribe;
  }, [client]);

  return { queue, loading, client };
}
```

---

## Deployment Guide

### Prerequisites

- Node.js 18+
- pnpm package manager
- Vercel account
- Supabase project

### Step 1: Deploy API

```bash
cd apps/vibox-api
pnpm deploy
```

### Step 2: Configure Environment Variables

In Vercel dashboard:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:5175
```

### Step 3: Database Setup

Ensure the `vibox_queue` table exists and RLS policies are configured:

```sql
-- Enable RLS
ALTER TABLE vibox_queue ENABLE ROW LEVEL SECURITY;

-- Allow all operations (for demo/development)
CREATE POLICY "Allow all operations on vibox_queue" ON vibox_queue
  FOR ALL USING (true) WITH CHECK (true);

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE vibox_queue;
```

### Step 4: Test Deployment

```bash
# Health check
curl https://your-vibox-api.vercel.app/api/health

# Get queue
curl https://your-vibox-api.vercel.app/api/queue
```

---

## Security Considerations

### CORS Configuration

```typescript
// Allowed origins for API access
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173', 
  'http://localhost:5175',
  'https://your-production-domain.com'
];
```

### Rate Limiting

- Queue additions: 5 per minute per IP
- API requests: 100 per minute per IP
- Real-time connections: 10 per session

### Data Validation

```typescript
// Input validation for track addition
const trackSchema = z.object({
  track_id: z.string().min(1),
  track_title: z.string().min(1).max(200),
  track_artist: z.string().min(1).max(100),
  track_url: z.string().url(),
  primary_vibe: z.enum(['chill', 'hype', 'party', 'focus']),
  added_by: z.string().min(1).max(50)
});
```

---

## Performance Optimization

### Database Indexes

```sql
-- Performance indexes
CREATE INDEX idx_vibox_queue_position ON vibox_queue(position);
CREATE INDEX idx_vibox_queue_session ON vibox_queue(session_id);
CREATE INDEX idx_vibox_queue_played ON vibox_queue(is_played);
CREATE INDEX idx_vibox_queue_created ON vibox_queue(added_at DESC);
```

### Caching Strategy

- Queue data: 30-second cache
- Analytics data: 5-minute cache
- Track metadata: 1-hour cache

### Real-time Optimization

- Batch updates (max 10 events per second)
- Delta compression for large queues
- Connection pooling for WebSocket connections

---

## Monitoring & Logging

### Key Metrics

- API response times
- Queue operation frequency
- Real-time connection count
- Database query performance
- Error rates by endpoint

### Logging Levels

```typescript
// Structured logging
logger.info('Queue operation', {
  operation: 'add_track',
  trackId: track.id,
  userId: user.id,
  sessionId: session.id
});

logger.error('API error', {
  error: error.message,
  stack: error.stack,
  endpoint: req.path,
  method: req.method
});
```

---

## Troubleshooting

### Common Issues

1. **Real-time updates not working**
   - Check Supabase publication settings
   - Verify WebSocket connection
   - Ensure RLS policies allow access

2. **Queue position conflicts**
   - Implement position recalculation
   - Use database transactions
   - Add position validation

3. **High latency on queue operations**
   - Check database indexes
   - Optimize query performance
   - Consider connection pooling

### Debug Tools

- Vercel function logs
- Supabase dashboard
- Browser dev tools (WebSocket inspector)
- Network request monitoring

---

## Next Steps

1. **Implement advanced analytics** - Skip rates, completion metrics
2. **Add audio processing** - Duration detection, format validation
3. **Enhanced security** - JWT authentication, rate limiting
4. **Mobile optimization** - PWA features, offline support
5. **A/B testing** - UI variations, algorithm improvements

---

*This technical guide provides the foundation for implementing and maintaining the VIBox jukebox system across all Social Game Engine applications.*
