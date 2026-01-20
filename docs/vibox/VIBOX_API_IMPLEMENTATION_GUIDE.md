# VIBox API Implementation Guide

## Overview

This guide provides complete instructions for implementing a unified VIBox API that serves multiple applications (pubFeed, dashboard, web, etc.) with a single shared music queue system.

**Goal**: Create a centralized VIBox server that all apps communicate with, while keeping the event-platform demo unchanged.

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
                    │  │  │ vibox_queue   │  │ │
                    │  │  └───────────────┘  │ │
                    │  └─────────────────────┘ │
                    └───────────────────────────┘
```

## Current State Analysis

### Database Schema (Already Exists)
- **Table**: `vibox_queue` (fully implemented with analytics)
- **Real-time**: Enabled via Supabase publication
- **RLS**: Permissive policies allowing full access
- **Location**: `supabase/migrations/20260110_create_vibox_queue.sql`

### Current API Structure
- **Edge Functions**: `vibox-get-queue`, `vibox-add-to-queue`, etc.
- **Types**: Complete TypeScript interfaces in `event-platform/src/shared/types/vibox.ts`
- **Real-time**: Supabase WebSocket subscriptions

## Implementation Plan

### Phase 1: Create vibox-api Structure

**Location**: `apps/vibox-api/`

```
apps/vibox-api/
├── api/
│   ├── index.ts              # Main entry point
│   ├── routes/
│   │   ├── queue.ts          # Queue management endpoints
│   │   ├── tracks.ts         # Track management endpoints
│   │   ├── analytics.ts      # Analytics endpoints
│   │   └── health.ts         # Health check endpoint
│   └── websocket/
│       └── index.ts          # WebSocket handler
├── lib/
│   ├── supabase.ts           # Supabase client configuration
│   ├── types.ts              # Type definitions
│   └── utils.ts              # Helper functions
├── package.json
├── tsconfig.json
├── vercel.json
└── README.md
```

### Phase 2: API Endpoints Implementation

#### REST API Endpoints

**Queue Management:**
```typescript
// GET /api/queue
// Returns: { queue: ViboxQueueItem[], count: number }
GET /api/queue

// POST /api/queue
// Body: ViboxQueueInsert
// Returns: { queueItem: ViboxQueueItem }
POST /api/queue

// DELETE /api/queue/:id
// Returns: { success: boolean }
DELETE /api/queue/:id

// PUT /api/queue/:id/play
// Body: { play_duration?: number, completion_percentage?: number }
// Returns: { queueItem: ViboxQueueItem }
PUT /api/queue/:id/play

// PUT /api/queue/:id/skip
// Returns: { queueItem: ViboxQueueItem }
PUT /api/queue/:id/skip

// DELETE /api/queue
// Returns: { clearedCount: number }
DELETE /api/queue
```

**Track Management:**
```typescript
// GET /api/tracks
// Returns: { tracks: Track[] }
GET /api/tracks

// POST /api/tracks/upload
// Body: FormData with file
// Returns: { track: Track }
POST /api/tracks/upload
```

**Analytics:**
```typescript
// GET /api/analytics/popular
// Returns: popular tracks data
GET /api/analytics/popular

// GET /api/analytics/engagement
// Returns: user engagement data
GET /api/analytics/engagement

// GET /api/analytics/time
// Returns: time-based analytics
GET /api/analytics/time
```

#### WebSocket Events

```typescript
// Client connects to WebSocket
ws://your-api-url/ws

// Server broadcasts events:
queue:updated     // Queue changed (add/remove/skip)
track:playing     // Track started playing
track:ended       // Track finished
queue:cleared     // Queue was cleared
```

### Phase 3: Client Migration Strategy

#### Step 1: Create VIBox Client Library

**Location**: `packages/vibox-client/`

```typescript
// packages/vibox-client/src/index.ts
export class ViboxClient {
  constructor(apiUrl: string, wsUrl: string) {}
  
  // Queue methods
  async getQueue(): Promise<ViboxQueueItem[]>
  async addToQueue(track: ViboxQueueInsert): Promise<ViboxQueueItem>
  async removeFromQueue(id: string): Promise<void>
  async markPlayed(id: string, options?: PlayOptions): Promise<ViboxQueueItem>
  async skipTrack(id: string): Promise<ViboxQueueItem>
  async clearQueue(): Promise<number>
  
  // Track methods
  async getTracks(): Promise<Track[]>
  async uploadTrack(file: File): Promise<Track>
  
  // Real-time subscription
  subscribe(callback: (event: ViboxEvent) => void): () => void
}
```

#### Step 2: Migrate pubFeed

1. **Install vibox-client**:
   ```json
   // pubFeed/package.json
   {
     "dependencies": {
       "@social/vibox-client": "workspace:*"
     }
   }
   ```

2. **Replace viboxApi calls**:
   ```typescript
   // Before
   import { viboxApi } from '../api/vibox';
   const queue = await viboxApi.getQueue();
   
   // After
   import { ViboxClient } from '@social/vibox-client';
   const vibox = new ViboxClient(process.env.VIBOX_API_URL, process.env.VIBOX_WS_URL);
   const queue = await vibox.getQueue();
   ```

3. **Update real-time hooks**:
   ```typescript
   // Replace useRealtimeQueue with WebSocket-based version
   const useViboxQueue = () => {
     const [queue, setQueue] = useState<ViboxQueueItem[]>([]);
     
     useEffect(() => {
       const vibox = new ViboxClient(apiUrl, wsUrl);
       const unsubscribe = vibox.subscribe((event) => {
         if (event.type === 'queue:updated') {
           setQueue(event.data.queue);
         }
       });
       
       return unsubscribe;
     }, []);
     
     return queue;
   };
   ```

## Detailed Implementation Steps

### Step 1: Set up vibox-api Project Structure

```bash
# Create the directory
mkdir apps/vibox-api
cd apps/vibox-api

# Initialize package.json
npm init -y

# Install dependencies
npm install express cors helmet morgan
npm install @supabase/supabase-js socket.io
npm install @types/node @types/express typescript ts-node
npm install -D vercel
```

### Step 2: Configure package.json

```json
{
  "name": "@social/vibox-api",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch api/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "deploy": "vercel --prod"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0",
    "@supabase/supabase-js": "^2.47.10",
    "socket.io": "^4.7.5"
  },
  "devDependencies": {
    "@types/node": "^22.10.2",
    "@types/express": "^4.17.21",
    "typescript": "^5.7.2",
    "tsx": "^4.19.2",
    "vercel": "^37.4.0"
  }
}
```

### Step 3: Create API Entry Point

```typescript
// apps/vibox-api/api/index.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import queueRoutes from './routes/queue.js';
import tracksRoutes from './routes/tracks.js';
import analyticsRoutes from './routes/analytics.js';
import healthRoutes from './routes/health.js';
import { setupWebSocket } from './websocket/index.js';

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Routes
app.use('/api/queue', queueRoutes);
app.use('/api/tracks', tracksRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/health', healthRoutes);

// WebSocket setup
setupWebSocket(io);

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

export default app;
```

### Step 4: Implement Queue Routes

```typescript
// apps/vibox-api/api/routes/queue.ts
import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { broadcastQueueUpdate } from '../websocket/index.js';

const router = Router();

// GET /api/queue
router.get('/', async (req, res) => {
  try {
    const { data: queue, error } = await supabase
      .from('vibox_queue')
      .select('*')
      .eq('is_played', false)
      .order('position', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: { queue: queue || [], count: queue?.length || 0 }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/queue
router.post('/', async (req, res) => {
  try {
    const trackData = req.body;
    
    const { data: queueItem, error } = await supabase
      .from('vibox_queue')
      .insert(trackData)
      .select()
      .single();

    if (error) throw error;

    // Broadcast update to all connected clients
    broadcastQueueUpdate('track_added', queueItem);

    res.json({
      success: true,
      data: { queueItem }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/queue/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('vibox_queue')
      .delete()
      .eq('id', id);

    if (error) throw error;

    broadcastQueueUpdate('track_removed', { id });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/queue/:id/play
router.put('/:id/play', async (req, res) => {
  try {
    const { id } = req.params;
    const { play_duration, completion_percentage } = req.body;
    
    const { data: queueItem, error } = await supabase
      .from('vibox_queue')
      .update({
        is_played: true,
        played_at: new Date().toISOString(),
        play_duration,
        completion_percentage
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    broadcastQueueUpdate('track_played', queueItem);

    res.json({
      success: true,
      data: { queueItem }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
```

### Step 5: Implement WebSocket Handler

```typescript
// apps/vibox-api/api/websocket/index.ts
import { Server as SocketIOServer } from 'socket.io';
import { supabase } from '../lib/supabase.js';

let io: SocketIOServer;

export const setupWebSocket = (socketIOServer: SocketIOServer) => {
  io = socketIOServer;

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Join vibox room for broadcasts
    socket.join('vibox');

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  // Listen to Supabase real-time events
  setupSupabaseRealtime();
};

export const broadcastQueueUpdate = (event: string, data: any) => {
  if (io) {
    io.to('vibox').emit('queue:updated', {
      type: event,
      data,
      timestamp: new Date().toISOString()
    });
  }
};

const setupSupabaseRealtime = () => {
  const channel = supabase
    .channel('vibox-queue-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'vibox_queue'
      },
      (payload) => {
        // Broadcast to all connected clients
        broadcastQueueUpdate('database_change', payload);
      }
    )
    .subscribe();
};
```

### Step 6: Configure Vercel Deployment

```json
// apps/vibox-api/vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "api/index.ts"
    },
    {
      "src": "/socket.io",
      "dest": "api/index.ts"
    }
  ],
  "env": {
    "SUPABASE_URL": "@supabase-url",
    "SUPABASE_ANON_KEY": "@supabase-anon-key",
    "ALLOWED_ORIGINS": "@allowed-origins"
  }
}
```

### Step 7: Environment Variables

Create `.env.local` in project root:
```bash
# Supabase Configuration
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key

# API Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5175,https://your-app-domain.vercel.app

# WebSocket Configuration
VIBOX_WS_URL=wss://your-vibox-api.vercel.app
```

## Migration Checklist

### Pre-Migration
- [ ] Backup current database
- [ ] Document current API usage
- [ ] Set up monitoring/logging

### Migration Steps
- [ ] Create vibox-api structure
- [ ] Implement REST endpoints
- [ ] Add WebSocket broadcasting
- [ ] Deploy to Vercel (staging)
- [ ] Test with postman/curl
- [ ] Create vibox-client package
- [ ] Migrate pubFeed
- [ ] Test end-to-end
- [ ] Migrate other apps
- [ ] Deploy to production

### Post-Migration
- [ ] Monitor API performance
- [ ] Set up alerts
- [ ] Document API for other developers
- [ ] Remove old edge functions (if safe)

## Testing Strategy

### API Testing
```bash
# Test queue endpoint
curl -X GET https://your-vibox-api.vercel.app/api/queue

# Test adding track
curl -X POST https://your-vibox-api.vercel.app/api/queue \
  -H "Content-Type: application/json" \
  -d '{
    "track_id": "test-track-1",
    "track_title": "Test Song",
    "track_artist": "Test Artist",
    "track_url": "https://example.com/audio.mp3",
    "added_by": "test-user"
  }'
```

### WebSocket Testing
```javascript
// Test WebSocket connection
const socket = io('wss://your-vibox-api.vercel.app');
socket.on('queue:updated', (event) => {
  console.log('Queue updated:', event);
});
```

## Performance Considerations

### Database Optimization
- Use existing indexes on `vibox_queue`
- Monitor query performance
- Consider caching for analytics endpoints

### WebSocket Scaling
- Vercel has WebSocket connection limits
- Monitor concurrent connections
- Consider Redis adapter for multi-instance scaling

### API Rate Limiting
```typescript
// Add rate limiting middleware
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

## Monitoring & Logging

### Health Check Endpoint
```typescript
// apps/vibox-api/api/routes/health.ts
import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    // Test database connection
    const { error } = await supabase.from('vibox_queue').select('count').single();
    
    res.json({
      status: 'healthy',
      database: error ? 'error' : 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
```

### Error Logging
```typescript
// Add structured logging
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

## Security Considerations

### API Security
- Validate all input data
- Use Supabase RLS policies
- Implement rate limiting
- Add CORS configuration

### WebSocket Security
- Validate connection origins
- Implement authentication if needed
- Monitor for abuse

## Troubleshooting

### Common Issues

1. **WebSocket Connection Fails**
   - Check CORS configuration
   - Verify Vercel supports WebSockets in your plan
   - Check firewall/proxy settings

2. **Database Connection Errors**
   - Verify Supabase URL and keys
   - Check RLS policies
   - Test database connectivity

3. **Performance Issues**
   - Monitor database query times
   - Check WebSocket connection count
   - Review API response times

### Debug Commands
```bash
# Check API logs
vercel logs vibox-api

# Test database connection
curl -X GET https://your-vibox-api.vercel.app/api/health

# Monitor WebSocket connections
# Add logging to websocket handler
```

## Rollback Plan

If migration fails:
1. **Keep event-platform unchanged** - Demo still works
2. **Revert pubFeed changes** - Go back to original viboxApi
3. **Disable vibox-api** - Delete Vercel deployment
4. **Analyze failure** - Review logs and fix issues

## Future Enhancements

### Version 2.0 Features
- Track metadata management
- User authentication integration
- Advanced analytics dashboard
- Playlist management
- Audio streaming optimization

### Scaling Considerations
- Multi-region deployment
- Database sharding
- CDN integration for audio files
- Load balancing

---

**This guide provides everything needed to implement the VIBox API successfully. Follow the steps in order, test thoroughly, and keep the event-platform demo intact during migration.**
