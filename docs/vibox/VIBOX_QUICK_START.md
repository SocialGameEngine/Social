# VIBox API - Quick Start Guide

## 🚀 Deploy in 5 Minutes

### Step 1: Deploy to Vercel

```bash
cd apps/vibox-api
pnpm deploy
```

Follow the prompts to connect your GitHub account and deploy.

### Step 2: Configure Environment Variables

In Vercel dashboard, add these environment variables:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:5175
```

### Step 3: Test Your API

```bash
# Health check
curl https://your-vibox-api.vercel.app/api/health

# Get queue
curl https://your-vibox-api.vercel.app/api/queue
```

### Step 4: Use in Your App

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
  added_by: 'user-name',
});

// Subscribe to updates
const unsubscribe = vibox.subscribe((event) => {
  console.log('Queue updated:', event);
});
```

## 📚 Full Documentation

- **Implementation Guide**: `VIBOX_API_IMPLEMENTATION_GUIDE.md`
- **Deployment Guide**: `VIBOX_DEPLOYMENT_GUIDE.md`
- **Summary**: `VIBOX_IMPLEMENTATION_SUMMARY.md`

## 🎯 What You Get

✅ Unified queue across all apps  
✅ Real-time synchronization  
✅ Type-safe TypeScript client  
✅ Production-ready API  
✅ Analytics endpoints  

## 🔗 API Endpoints

- `GET /api/queue` - Get current queue
- `POST /api/queue/add` - Add track
- `DELETE /api/queue/:id` - Remove track
- `PUT /api/queue/:id/play` - Mark as played
- `GET /api/health` - Health check

## 💡 Example: React Hook

```typescript
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
    client.getQueue().then(({ data }) => {
      if (data) setQueue(data.queue);
    });

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

## 🎉 You're Ready!

Your VIBox API is now deployed and ready to use across all your applications.
