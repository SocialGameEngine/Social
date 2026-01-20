# VIBox Edge Functions Logging Guide

## 📊 Comprehensive Logging Added

All VIBox edge functions now have detailed logging for debugging, monitoring, and analytics. Here's what's been implemented:

## 🔍 Logging Structure

Each function uses a consistent logging pattern:

```
[requestId] emoji function-name: message { context }
```

- **requestId**: Unique UUID for tracking individual requests
- **emoji**: Visual indicator for log level/type
- **function-name**: The specific edge function
- **message**: Human-readable description
- **context**: Structured data object

## 📝 Log Levels & Emojis

| Emoji | Level | Description |
|-------|-------|-------------|
| 🎵 | INFO | Music/track operations |
| ➕ | INFO | Add operations |
| ➖ | INFO | Remove operations |
| 🧹 | INFO | Clear operations |
| ✅ | INFO | Validation/success |
| 📝 | DEBUG | Request body parsing |
| 📍 | DEBUG | Client/location info |
| 🔐 | DEBUG | Authentication |
| 👤 | DEBUG | User context |
| 📊 | DEBUG | Analytics/metrics |
| ⚠️ | WARN | Non-critical issues |
| ❌ | ERROR | Database errors |
| 💥 | ERROR | Unexpected errors |
| ℹ️ | INFO | No-op operations |

## 🚀 Function-Specific Logging

### 1. `vibox-get-queue`
**Logs:**
- Request details (method, URL, user agent)
- Queue size and track details
- Database errors with full context
- Performance timing

**Example:**
```
[abc123] 🎵 vibox-get-queue: Request received { method: "POST", url: "...", userAgent: "..." }
[abc123] ✅ vibox-get-queue: Success { queueSize: 5, duration: 45, tracks: [...] }
```

### 2. `vibox-add-to-queue`
**Logs:**
- Request validation
- Authentication status
- Client IP detection
- Queue length before/after
- Track metadata
- Performance timing

**Example:**
```
[def456] ➕ vibox-add-to-queue: Request received { method: "POST", timestamp: "..." }
[def456] 📝 vibbox-add-to-queue: Request body parsed { track_id: "...", track_title: "...", added_by: "Host" }
[def456] 🔐 vibox-add-to-queue: Authenticated user { userId: "..." }
[def456] 📍 vibox-add-to-queue: Client info { ip_address: "detected", device_type: "desktop" }
[def456] ✅ vibox-add-to-queue: Success { queueItemId: "...", queue_position: 3, duration: 120 }
```

### 3. `vibox-remove-from-queue`
**Logs:**
- Item existence validation
- Track details before removal
- Whether item was already played
- Performance timing

**Example:**
```
[ghi789] ➖ vibox-remove-from-queue: Request received { method: "POST", timestamp: "..." }
[ghi789] 🎵 vibox-remove-from-queue: Item found { itemId: "...", track_title: "...", position: 2, is_played: false }
[ghi789] ✅ vibox-remove-from-queue: Success { removedItemId: "...", was_played: false, duration: 85 }
```

### 4. `vibox-clear-queue`
**Logs:**
- Queue analysis before clearing
- Empty queue handling (no-op)
- Number of tracks cleared
- Performance timing

**Example:**
```
[jkl012] 🧹 vibox-clear-queue: Request received { method: "POST", timestamp: "..." }
[jkl012] 📊 vibox-clear-queue: Queue analysis { unplayedTracks: 8, hasTracks: true }
[jkl012] ✅ vibox-clear-queue: Success { clearedCount: 8, duration: 95 }
```

### 5. `vibox-mark-played`
**Logs:**
- Playback metrics (duration, completion)
- Skip tracking
- Time in queue calculation
- Updated skip count
- Performance timing

**Example:**
```
[mno345] ✅ vibox-mark-played: Request received { method: "POST", timestamp: "..." }
[mno345] 🎵 vibox-mark-played: Item found { itemId: "...", time_in_queue_seconds: 180, is_skipped: false }
[mno345] ✅ vibox-mark-played: Success { was_skipped: false, play_duration: 165, new_skip_count: 0, duration: 110 }
```

## 🔧 Monitoring & Debugging

### Viewing Logs

**Supabase Dashboard:**
1. Go to: https://supabase.com/dashboard/project/dtudipmqfrknkrsahlst/functions
2. Click on any VIBox function
3. View "Logs" tab for real-time logs

**CLI:**
```bash
# View logs for all functions
supabase functions logs

# View logs for specific function
supabase functions logs vibox-add-to-queue

# Follow logs in real-time
supabase functions logs --follow
```

### Key Metrics to Track

1. **Performance**: `duration` field in all logs
2. **Queue Health**: Track queue sizes over time
3. **User Behavior**: Authentication patterns, device types
4. **Error Rates**: Database errors, validation failures
5. **Skip Analytics**: Skip counts and completion percentages

### Common Log Patterns

**Successful Operation:**
```
[requestId] ✅ function-name: Success { ... duration: X }
```

**Database Error:**
```
[requestId] ❌ function-name: Database error { error: "...", code: "...", duration: X }
```

**Validation Error:**
```
[requestId] ⚠️ function-name: App error { error: "...", code: "...", statusCode: 400 }
```

**Unexpected Error:**
```
[requestId] 💥 function-name: Unexpected error { error: "...", stack: "...", duration: X }
```

## 📈 Analytics Insights

The logs provide rich analytics data:

### User Behavior
- Authentication vs anonymous usage
- Device types and user agents
- IP address patterns (for geographic analysis)

### Queue Dynamics
- Peak usage times (timestamps)
- Average queue lengths
- Track popularity (add/remove patterns)

### Playback Analytics
- Average time in queue
- Skip rates by track
- Completion percentages
- Session durations

### Performance Metrics
- Function response times
- Database query performance
- Error rates by function

## 🚨 Alerting Setup

Consider setting up alerts for:

1. **High Error Rates**: >5% error rate over 5 minutes
2. **Slow Performance**: Functions taking >2 seconds
3. **Empty Queue**: Queue size = 0 for extended periods
4. **Database Errors**: Any database connection issues
5. **High Skip Rates**: Skip rate >50% for popular tracks

## 🔍 Debugging Scenarios

### Track Not Adding
1. Look for `vibox-add-to-queue` logs
2. Check validation steps: `✅ vibox-add-to-queue: Validation passed`
3. Verify database insert: `✅ vibox-add-to-queue: Success`

### Queue Not Updating
1. Check `vibox-get-queue` logs for correct queue size
2. Verify realtime subscriptions in frontend logs
3. Look for database errors in any function

### Performance Issues
1. Check `duration` fields across all functions
2. Look for database connection warnings
3. Monitor queue size impact on performance

## 📝 Log Retention

- **Supabase**: Logs retained for 7 days (free tier)
- **Export**: Consider exporting logs for long-term analytics
- **Aggregation**: Use logs to build analytics dashboards

## 🎯 Best Practices

1. **Monitor Regularly**: Check logs daily for issues
2. **Track Performance**: Watch for slow response times
3. **User Analytics**: Use logs to understand usage patterns
4. **Error Response**: Quick response to error spikes
5. **Capacity Planning**: Use metrics for scaling decisions

The enhanced logging provides comprehensive visibility into your VIBox system's operation, making debugging and optimization much easier!
