
# Top Comment Game Flow
Complete specification for Event Mode (host-controlled) and 24/7 Mode (persistent wall)

## Event Mode (Hosted Bar Nights)
**Purpose**: Host-controlled multiplayer sessions for trivia nights, team competitions. Bartender runs on laptop+TV, patrons join via QR.

### 1. Pre-Event Setup (5 mins)
```
Venue Device (Laptop/Tablet → TV):
1. Staff opens topcomment.playnow.social/host
2. Select "Top Comment Event" → Create Session
3. Room code + QR code generated (e.g., ABC123)
4. TV shows: Venue name, QR, "Scan to Join", team count live

Patrons (Phones):
- Scan QR → topcomment.playnow.social/play?code=ABC123
- Pick team name + mascot → "Ready"
```

### 2. Round Loop (3-5 rounds, 10 mins each)
```
Phase 1: Prompt (10s)
TV: "Round 1: Worst pickup line ever?" + countdown

Phase 2: Comment (45s) 
Teams → Submit 1 comment each
TV: Live team count + "Submit now!"

Phase 3: Reply (30s) 
Teams → Reply to OTHER teams (max 2 replies/comment)
TV: Thread previews updating live

Phase 4: Voting (25s)
Each team → Spend 3 likes (no self-vote)
TV: Heart animations + live tallies

Phase 5: Results (15s)
TV: Winner comment/reply + scores + leaderboard
"Cheers to Team Chaos!"
```

### 3. End Game
```
Final leaderboard → Prizes announced
Soft exit: "Next week: Theme Night!"
Venue analytics auto-tracked
```

## 24/7 Mode (Persistent Wall)
**Purpose**: Always-on engagement wall. Patrons comment/reply/vote anytime. Clout titles drive repeat visits.

### 1. Wall Access (Instant)
```
Venue TV: Always shows topcomment.playnow.social/wall?venue=felicitas
- Pinned prompt: "Rate tonight's playlist?"
- Top comments + threads (pinned = highest score)
- Live clout titles next to usernames
- QR code always visible

Patrons (Phones):
Scan QR → supabase.auth.signInAnonymously({venue_id})
→ Persistent username + clout badges
```

### 2. Interaction Flow (Unlimited)
```
1. Read current prompt on wall/phone
2. Comment (top-level) or Reply (to others, max 2/comment)
3. Spend daily likes (3/day) on comments/replies
4. Watch live like counts + thread growth

Hidden Scoring (runs cron):
- Reply: Direct likes
- Comment: Direct likes + 33% reply likes (capped)
- Clout refresh: Daily/weekly titles awarded
```

### 3. Clout Display (Persistent)
```
Wall shows live:
"🥇 Top Comment: @ChaosKing (Thread King)
 🔥 @DJGoblin (Reply Goblin)  
 👑 @PredictionPro (Backed a Winner)"

Titles beside usernames everywhere (wall, phone, leaderboards)
```

## Shared Mechanics
| Feature | Event Mode | 24/7 Mode |
|---------|------------|-----------|
| Comments | 1/team/round | Unlimited |
| Replies | Max 2/comment | Max 2/comment |
| Likes | 3/team/round | 3/day/user |
| Self-vote | Blocked | Blocked |
| Self-reply | Blocked | Blocked |
| Scoring | Direct + trickle | Direct + trickle |
| Moderation | OpenAI realtime | OpenAI + staff |
| Leaderboards | Session-end | Daily/weekly/all-time |

## Technical Flow
```
Event Mode:
supabase.channel(`game:${sessionId}`)
←→ Firestore-like realtime (Supabase Realtime)

24/7 Mode:
supabase.channel(`venue:${venueId}`)
←→ comments/likes/clout changes

QR → Edge Function → anon auth + venue_id claim → RLS
```

## Venue Benefits
**Event**: 15-25% dwell time ↑, $45/server shift tips
**24/7**: Community building, feedback collection, repeat visits
**Both**: Zero host cost, analytics dashboard, 40% scan rate target[file:1]

**File updated: `topcommentgameflow.md`**
