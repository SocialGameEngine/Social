# Pause/Resume Glitch Debug Guide

## 🔍 What to Monitor During Game Launch

### 1. **Edge Function Logs** (Server-side)
**Filter Console for: `[PAUSE_RESUME]`**

Look for these specific log messages:

```javascript
[PAUSE_RESUME] Pause/Resume request received
[PAUSE_RESUME] Session retrieved  
[PAUSE_RESUME] Timer configuration
[PAUSE_RESUME] PAUSING session
[PAUSE_RESUME] RESUMING session
[PAUSE_RESUME] Session updated successfully
```

**Key Things to Check:**
- `currentEndsAt` before pause (should be a timestamp)
- `endsAt: null` during pause (correct behavior)
- `newEndsAt` after resume (should be restored timestamp)
- `remainingMsAtPause` calculation

### 2. **Client-side Logs** (Browser)
**Filter Console for: `[VOTE_CALCULATIONS]`**

Look for these specific log messages:

```javascript
[VOTE_CALCULATIONS] voteSummaryActive calculation:
{
  sessionStatus: "vote",
  isPaused: false,        // ← Should be false during normal play
  endsAt: "2026-01-21T...", // ← Should be null when paused
  now: 1642812345678,
  isActive: true,
  voteSummaryActive: true
}
```

### 3. **Real-time Subscription Logs**
**Filter Console for: `realtime`, `subscription`, `channel`**

Look for:
- Session state changes
- `endsAt` value changes
- `paused` flag changes

## 🎯 Debugging Scenarios

### Scenario A: **Pause Button Clicked**
**Expected Logs:**
```
[PAUSE_RESUME] Pause/Resume request received { pause: true }
[PAUSE_RESUME] PAUSING session { endsAt: null, remainingMsAtPause: 45000 }
[PAUSE_RESUME] Session updated successfully { newEndsAt: null }
```

**Client-side should show:**
```
[VOTE_CALCULATIONS] { isPaused: true, endsAt: null, voteSummaryActive: false }
```

### Scenario B: **Resume Button Clicked**
**Expected Logs:**
```
[PAUSE_RESUME] Pause/Resume request received { pause: false }
[PAUSE_RESUME] RESUMING with stored time { remainingMsAtPause: 45000 }
[PAUSE_RESUME] Session updated successfully { newEndsAt: "2026-01-21T..." }
```

**Client-side should show:**
```
[VOTE_CALCULATIONS] { isPaused: false, endsAt: "2026-01-21T...", voteSummaryActive: true }
```

### Scenario C: **Bug Occurs**
**What to look for:**
- `voteSummaryActive` becomes `false` when it should be `true`
- `isPaused: true` when session should be active
- `endsAt: null` when session should have timer
- Client-side and server-side state mismatch

## 🚨 Red Flags to Watch For

### Server-side Issues:
```javascript
[PAUSE_RESUME] Permission denied - not host
[PAUSE_RESUME] Database update failed
[PAUSE_RESUME] RESUMING with fallback duration  // ← Should use stored time
```

### Client-side Issues:
```javascript
[VOTE_CALCULATIONS] { isPaused: true, voteSummaryActive: false }  // ← Wrong during vote phase
[VOTE_CALCULATIONS] { endsAt: null, voteSummaryActive: false }   // ← Should handle null endsAt
```

### Real-time Issues:
```javascript
realtime subscription failed
channel error
connection timeout
```

## 🛠️ Quick Debug Commands

**In Browser Console:**
```javascript
// Check current session state
console.log('Session state:', {
  status: window.currentSession?.status,
  paused: window.currentSession?.paused,
  endsAt: window.currentSession?.endsAt
});

// Monitor vote calculations
setInterval(() => {
  console.log('Vote state check:', {
    isPaused: window.currentSession?.paused,
    endsAt: window.currentSession?.endsAt,
    now: Date.now()
  });
}, 1000);
```

## 📊 What Success Looks Like

**Normal Flow:**
1. Pause → `endsAt` becomes `null`, `paused` becomes `true`
2. UI remains stable (no incorrect group info)
3. Resume → `endsAt` restored, `paused` becomes `false`
4. UI continues correctly from where it left off

**Bug Fixed Indicators:**
- ✅ No "incorrect group information" during pause
- ✅ `voteSummaryActive` depends on `session.paused`, not `session.endsAt`
- ✅ Timer display works independently of game state
- ✅ All views (TeamPage, PresenterPage) stay in sync

## 🔧 If Issues Occur

1. **Check edge function logs** - Look for `[PAUSE_RESUME]` messages
2. **Check client logs** - Look for `[VOTE_CALCULATIONS]` messages  
3. **Compare server vs client state** - Should match
4. **Check real-time subscriptions** - Should receive updates
5. **Test specific phases** - Vote phase is most likely to show the bug

**Ready to launch! The logging system will help us identify exactly where the pause/resume glitch occurs.**
