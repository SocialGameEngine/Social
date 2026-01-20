# VIBox API Deployment Guide

## Quick Start

### 1. Install Dependencies

```bash
# Install vibox-api dependencies
cd apps/vibox-api
pnpm install

# Install vibox-client dependencies
cd ../../packages/vibox-client
pnpm install
```

### 2. Configure Environment Variables

Create `.env.local` in `apps/vibox-api/`:

```bash
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:5175
```

### 3. Test Locally

```bash
cd apps/vibox-api
pnpm dev
```

API will be available at `http://localhost:3000`

### 4. Deploy to Vercel

```bash
cd apps/vibox-api
pnpm deploy
```

Or connect your GitHub repo to Vercel for automatic deployments.

## API Endpoints

### Queue Management
- `GET /api/queue` - Get current queue
- `POST /api/queue/add` - Add track to queue
- `DELETE /api/queue/:id` - Remove track from queue
- `PUT /api/queue/:id/play` - Mark track as played
- `PUT /api/queue/:id/skip` - Skip track
- `DELETE /api/queue/clear` - Clear entire queue

### Analytics
- `GET /api/analytics/popular` - Popular tracks
- `GET /api/analytics/engagement` - User engagement stats
- `GET /api/analytics/time` - Time-based analytics

### Health
- `GET /api/health` - API health check

## Testing the API

### Using curl

```bash
# Health check
curl https://your-vibox-api.vercel.app/api/health

# Get queue
curl https://your-vibox-api.vercel.app/api/queue

# Add track
curl -X POST https://your-vibox-api.vercel.app/api/queue/add \
  -H "Content-Type: application/json" \
  -d '{
    "track_id": "test-track-1",
    "track_title": "Test Song",
    "track_artist": "Test Artist",
    "track_url": "https://example.com/audio.mp3",
    "added_by": "test-user"
  }'
```

### Using the Client Library

```typescript
import { ViboxClient } from '@social/vibox-client';

const vibox = new ViboxClient({
  apiUrl: 'https://your-vibox-api.vercel.app',
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseKey: process.env.SUPABASE_ANON_KEY!,
});

// Get queue
const { data } = await vibox.getQueue();
console.log(data?.queue);

// Subscribe to real-time updates
const unsubscribe = vibox.subscribe((event) => {
  console.log('Queue updated:', event);
});
```

## Integrating with Apps

### 1. Add vibox-client to your app

```bash
cd apps/pubFeed  # or any other app
pnpm add @social/vibox-client
```

### 2. Create a React hook

```typescript
// hooks/useViboxQueue.ts
import { useEffect, useState } from 'react';
import { ViboxClient, ViboxQueueItem } from '@social/vibox-client';

export function useViboxQueue() {
  const [queue, setQueue] = useState<ViboxQueueItem[]>([]);
  const [client] = useState(() => new ViboxClient({
    apiUrl: process.env.VITE_VIBOX_API_URL!,
    supabaseUrl: process.env.VITE_SUPABASE_URL!,
    supabaseKey: process.env.VITE_SUPABASE_ANON_KEY!,
  }));

  useEffect(() => {
    // Initial fetch
    client.getQueue().then(({ data }) => {
      if (data) setQueue(data.queue);
    });

    // Subscribe to updates
    const unsubscribe = client.subscribe(() => {
      client.getQueue().then(({ data }) => {
        if (data) setQueue(data.queue);
      });
    });

    return unsubscribe;
  }, [client]);

  return { queue, client };
}
```

### 3. Use in your component

```typescript
import { useViboxQueue } from './hooks/useViboxQueue';

function MusicPlayer() {
  const { queue, client } = useViboxQueue();

  const handleAddTrack = async () => {
    await client.addToQueue({
      track_id: 'song-123',
      track_title: 'My Song',
      track_artist: 'Artist Name',
      track_url: 'https://example.com/song.mp3',
      added_by: 'user-name',
    });
  };

  return (
    <div>
      <h2>Queue ({queue.length} tracks)</h2>
      {queue.map(track => (
        <div key={track.id}>
          {track.track_title} - {track.track_artist}
        </div>
      ))}
      <button onClick={handleAddTrack}>Add Track</button>
    </div>
  );
}
```

## Vercel Configuration

### Environment Variables in Vercel

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add the following:
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_ANON_KEY` - Your Supabase anon key
   - `ALLOWED_ORIGINS` - Comma-separated list of allowed origins

### Deployment Settings

The `vercel.json` is already configured with:
- Memory: 1024 MB
- Max Duration: 10 seconds
- Automatic environment variable injection

## Monitoring

### Health Check

Set up monitoring to ping the health endpoint:

```bash
curl https://your-vibox-api.vercel.app/api/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "database": "connected",
    "timestamp": "2026-01-11T23:00:00.000Z",
    "queueCount": 5
  }
}
```

### Vercel Logs

View logs in Vercel dashboard or via CLI:

```bash
vercel logs vibox-api
```

## Troubleshooting

### CORS Errors

If you get CORS errors, ensure your app's origin is in the `ALLOWED_ORIGINS` environment variable:

```bash
ALLOWED_ORIGINS=http://localhost:3000,https://your-app.vercel.app
```

### Database Connection Issues

1. Verify Supabase credentials in Vercel environment variables
2. Check that RLS policies allow access
3. Test database connection via health endpoint

### Real-time Not Working

1. Ensure Supabase real-time is enabled for `vibox_queue` table
2. Check that the client has correct Supabase credentials
3. Verify WebSocket connections aren't blocked by firewall

## Migration from event-platform

### Step 1: Keep event-platform unchanged

The event-platform vibox implementation stays as-is for your demo.

### Step 2: Migrate pubFeed

1. Install vibox-client:
   ```bash
   cd apps/pubFeed
   pnpm add @social/vibox-client
   ```

2. Replace direct Supabase calls with vibox-client:
   ```typescript
   // Before
   const { data } = await supabase.from('vibox_queue').select('*');
   
   // After
   const { data } = await vibox.getQueue();
   ```

3. Update environment variables:
   ```bash
   VITE_VIBOX_API_URL=https://your-vibox-api.vercel.app
   ```

### Step 3: Test thoroughly

1. Test queue operations (add, remove, play, skip)
2. Verify real-time updates work
3. Check cross-app synchronization

### Step 4: Migrate other apps

Repeat the process for dashboard, web, and other apps.

## Performance Optimization

### Caching

Consider adding caching for analytics endpoints:

```typescript
// In Vercel, add cache headers
res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
```

### Rate Limiting

For production, add rate limiting:

```bash
pnpm add express-rate-limit
```

### Database Optimization

- Use existing indexes on `vibox_queue`
- Monitor query performance in Supabase dashboard
- Consider materialized views for analytics

## Security Checklist

- [ ] Environment variables configured in Vercel
- [ ] CORS origins properly restricted
- [ ] Supabase RLS policies reviewed
- [ ] API rate limiting configured (if needed)
- [ ] Health monitoring set up
- [ ] Error logging configured

## Next Steps

1. **Deploy vibox-api to Vercel**
2. **Test all endpoints**
3. **Migrate pubFeed as pilot**
4. **Monitor performance**
5. **Migrate remaining apps**

## Support

For issues or questions:
1. Check Vercel logs
2. Review Supabase dashboard
3. Test health endpoint
4. Verify environment variables

---

**The VIBox API is now ready for deployment and integration across all your apps!**
