# VIBox Queue System - Supabase Implementation

## Overview
The VIBox queue system has been migrated from localStorage to Supabase for production-ready, real-time queue management across multiple devices and users.

## Features

### ✅ Real-time Synchronization
- Instant queue updates across all connected devices
- Patrons can add songs from any device
- Host sees updates in real-time

### ✅ Analytics Tracking
The queue system automatically tracks:
- **User Engagement**: Who added songs, when, and from what device
- **Play Metrics**: Time in queue, completion percentage, skip counts
- **Popular Tracks**: Most requested songs, genres, and vibes
- **Time-based Analytics**: Peak hours, day-of-week patterns
- **Queue Dynamics**: Queue length trends, wait times

### ✅ Cross-Device Support
- Works on mobile, tablet, and desktop
- Session tracking for user behavior analysis
- Device type and user agent logging

## Database Schema

### Main Table: `vibox_queue`

**Track Information:**
- `track_id`, `track_title`, `track_artist`, `track_url`
- `track_genre`, `track_duration`
- `primary_vibe`, `secondary_vibe`

**Queue Management:**
- `position` - Auto-calculated queue position
- `is_played` - Whether track has been played
- `played_at` - Timestamp when played

**User Tracking:**
- `added_by` - User display name
- `added_by_user_id` - Link to auth.users
- `added_at` - When song was added

**Analytics:**
- `device_type` - mobile/tablet/desktop
- `user_agent` - Browser information
- `session_id` - Unique session identifier
- `time_in_queue` - Seconds from added to played
- `skip_count` - How many times skipped
- `was_skipped` - Boolean flag
- `play_duration` - Actual seconds played
- `completion_percentage` - % of track completed
- `queue_length_when_added` - Queue size at add time
- `time_of_day`, `day_of_week` - Temporal context

## Analytics Views

### `vibox_queue_analytics`
Aggregated statistics by genre, vibe, day, and hour:
- Total plays
- Average time in queue
- Average completion rate
- Skip counts
- Queue length trends

### `vibox_popular_tracks`
Most played tracks with engagement metrics:
- Play count
- Average completion
- Skip count
- Average wait time

### `vibox_user_engagement`
User activity metrics:
- Songs added per user
- Average wait time
- Active days
- First/last activity

### `vibox_time_analytics`
Time-based patterns:
- Song count by hour and day
- Average queue length by time
- Unique users by time period

## Setup Instructions

### 1. Run Migration
```bash
# From the Social directory
supabase db push
```

### 2. Verify Tables
```sql
SELECT * FROM vibox_queue LIMIT 5;
SELECT * FROM vibox_queue_analytics;
```

### 3. Test Real-time
Open two browser tabs:
- Tab 1: Host view
- Tab 2: Patron view
- Add song in Tab 2, see it appear in Tab 1

## Usage

### Adding to Queue (Patron)
```typescript
// Click "+Q" button next to any song
// Automatically tracks device, session, and context
```

### Managing Queue (Host)
```typescript
// View queue: Click "Queue (X)" button
// Play song: Click play icon in queue
// Remove song: Click trash icon
// Clear all: Click "Clear Queue" button
```

### Auto-play
When a song ends:
1. Checks if queue has songs
2. Plays next song from queue
3. Marks song as played (not deleted)
4. Calculates analytics metrics

## Analytics Queries

### Most Popular Genre
```sql
SELECT track_genre, COUNT(*) as plays
FROM vibox_queue
WHERE is_played = true
GROUP BY track_genre
ORDER BY plays DESC;
```

### Peak Hours
```sql
SELECT EXTRACT(HOUR FROM time_of_day) as hour, COUNT(*) as songs
FROM vibox_queue
GROUP BY hour
ORDER BY songs DESC;
```

### User Leaderboard
```sql
SELECT added_by, COUNT(*) as songs_added
FROM vibox_queue
GROUP BY added_by
ORDER BY songs_added DESC;
```

### Average Wait Time by Vibe
```sql
SELECT primary_vibe, AVG(time_in_queue) as avg_wait
FROM vibox_queue
WHERE is_played = true
GROUP BY primary_vibe;
```

## TypeScript Types

Located in: `src/shared/types/vibox.ts`

- `ViboxQueueItem` - Full queue item with all fields
- `ViboxQueueInsert` - Fields needed to add to queue
- `ViboxQueueUpdate` - Fields that can be updated

## Real-time Subscription

The component automatically subscribes to queue changes:
```typescript
supabase
  .channel('vibox-queue-changes')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'vibox_queue' 
  }, handleChange)
  .subscribe();
```

## Security

Row Level Security (RLS) is enabled with policies:
- Anyone can view queue
- Anyone can add to queue
- Anyone can update/delete (for host controls)

For production, consider restricting update/delete to authenticated hosts only.

## Future Enhancements

- [ ] User authentication for "Added by" tracking
- [ ] Vote/like system for queued songs
- [ ] Queue position reordering (drag & drop)
- [ ] Song request limits per user
- [ ] Duplicate song detection
- [ ] Analytics dashboard UI
- [ ] Export analytics to CSV
- [ ] Integration with Spotify/Apple Music APIs
