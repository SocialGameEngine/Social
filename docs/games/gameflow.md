# Söcial App Game Flow – Social Game Engine Edition

## 1. Overview

**Social** is a modular, browser-based gaming platform for bars built on a game engine architecture. The system supports multiple game modes including Top Comment (event and solo) and VIBox jukebox. One staff member controls event games from a venue device while players join via QR code, with real-time state management and team-based gameplay.

This document describes the end-to-end game flow for a Social night in a bar.

---

## 2. Roles

**Venue Staff (Host/Bartender)**
- Creates and manages game sessions via the game engine interface
- Controls phase transitions and game pacing
- Can pause/resume sessions with time tracking
- Manages team roster and can remove teams if needed
- Makes announcements and celebrates winners
- Accesses real-time analytics and revenue tracking

**Players / Patrons**
- Join via QR code or short URL on their phones
- Form teams using unique 4-digit team codes
- First team member automatically becomes captain
- Captains submit team answers and manage team composition
- Team members vote on responses and participate in gameplay
- Can select categories for bonus rounds (Jeopardy mode)
- Pay $1.50–$2.00 per play/song
- Can play solo mode outside of events

**Team Captains**
- Auto-assigned to first player joining team
- Submit answers on behalf of team
- Can transfer captain role to other team members
- Responsible for team coordination during gameplay

**Social System**
- Game engine manages sessions, phases, scoring, and real-time state
- Supports multiple game modes (event/patron) and game types
- **Team System**: Manages team codes, captain assignment, and member roles
- **Real-time Collaboration**: Team members coordinate via shared devices
- **Session Management**: Teams isolated per game session with unique codes
- Tracks engagement metrics and comprehensive analytics
- Manages VIBox queue system and track metadata
- Handles payments via Helcim/Stripe
- Provides pause/resume functionality with time tracking

---

## 3. Pre-Event Setup

1. **Venue device setup**
   - Staff opens Social web app on laptop or tablet
   - Connects device to bar TV/projector (HDMI or AirPlay)

2. **Select game configuration**
   - Choose game mode: "Top Comment (Event)" or "Top Comment (Solo)" or "VIBox Jukebox"
   - Set game parameters:
     - Game mode: "classic" or "jeopardy"
     - Number of rounds (typically 3–5)
     - Phase timing: answerSecs, voteSecs, resultsSecs (default: 60/30/15)
     - Maximum teams (2–24)
     - Selected categories (for Jeopardy mode)
   - Optional: Enable pause functionality and sponsor rounds

3. **Display lobby screen**
   - TV shows:
     - Venue name / event title
     - QR code + short URL (e.g., `playnow.social/christie`)
     - Simple instructions: "Scan to join. Form a team. Compete for glory."
     - Sponsor logos (if applicable)

---

## 4. Player Join Flow

1. **Scan & open**
   - Player scans QR code or enters short URL
   - Social PWA opens in mobile browser (no app, no login)

2. **Team Code System**
   - Venue device generates 20 unique 4-digit team codes per session
   - Codes are globally unique across all sessions
   - Staff can pre-assign codes or let system auto-assign
   - TV displays available codes or QR code for joining

3. **Create or join a team**
   - **Create Team**: Player enters unique team code from venue device
     - Code is assigned to team permanently for session
     - First player becomes team captain automatically
     - Team chooses name (e.g., "The Roasters", "Bar Flies")
     - Optional: Team selects mascot/avatar
   - **Join Team**: Player enters existing team code
     - Joins as team member (not captain)
     - Can join multiple teams per device if needed
   - **Captain Assignment**: Automatic via database trigger
     - First member to join team gets `is_captain = true`
     - Captain can submit answers and manage team
     - Captain role can be transferred via `transfer_captain()` function

4. **Team Member Management**
   - **Multi-device support**: Players can use different devices
   - **Unique constraints**: `(team_id, user_id, device_id)` prevents duplicates
   - **Activity tracking**: `last_active` timestamp updates on interactions
   - **Session isolation**: Teams belong to specific game sessions

5. **Ready state**
   - Staff sees live team count on venue device
   - TV lobby updates: "5 teams joined! Ready to start?"
   - Staff taps "Start" when ready

---

## 4.1 Team System Architecture

### Database Tables

**teams**
- `id` (UUID): Primary key
- `session_id` (UUID): Links to game session
- `name` (VARCHAR): Team display name
- `team_code` (VARCHAR(4)): Unique 4-digit join code
- `captain_id` (UUID): References team captain
- `created_at` (TIMESTAMP): Team creation time

**team_codes**
- `id` (UUID): Primary key
- `code` (VARCHAR(4)): Unique 4-digit code
- `session_id` (UUID): Session this code belongs to
- `team_id` (UUID, nullable): Assigned team when used
- `created_at` (TIMESTAMP): Code generation time
- `assigned_at` (TIMESTAMP, nullable): When code was assigned
- `is_used` (BOOLEAN): Usage status

**team_members**
- `id` (UUID): Primary key
- `team_id` (UUID): Team membership
- `user_id` (UUID): Player user ID
- `device_id` (VARCHAR): Device identifier
- `joined_at` (TIMESTAMP): Join timestamp
- `last_active` (TIMESTAMP): Last activity
- `is_captain` (BOOLEAN): Captain status

### Key Functions

- `generate_team_codes(session_uuid, num_codes)`: Creates unique codes for session
- `assign_team_code(team_uuid)`: Assigns available code to team
- `transfer_captain(team_id, new_captain_id)`: Changes team captain
- Auto-triggers: Captain assignment, code assignment on team creation

### Security & Permissions

- **Row Level Security (RLS)** enabled on all tables
- Team members can view their own teams only
- Captains can manage team member roles
- Service role has full access for system operations

---

## 5. Game Flow – Top Comment (Social Voting)

### Round Structure

1. **Phase: Lobby**
   - TV displays: "Round 1: Icebreakers" or category selection for Jeopardy mode
   - Teams see round info and prepare for competition
   - Optional sponsor branding

2. **Phase: Category Selection (Jeopardy mode only)**
   - Staff taps "Next" to advance to category selection
   - TV displays category grid with point values
   - Selecting team chooses category for bonus points/multiplier
   - Timer counts down (categorySelectSecs setting)

3. **Phase: Answer**
   - Staff taps "Next" to reveal prompt
   - TV displays comedy prompt (e.g., "Finish this: The worst thing to say at a bar is...")
   - Players see same prompt on their phones
   - Team members discuss and captain submits response
   - Timer counts down (answerSecs setting, default 60 seconds)
   - Late submissions allowed but marked

4. **Phase: Vote**
   - Timer expires or staff taps "Next"
   - TV displays all responses (anonymized or by team name)
   - Players vote on funniest response (emoji voting: 😂 👍 ❤️)
   - Timer counts down (voteSecs setting, default 30 seconds)
   - Staff may highlight top responses

5. **Phase: Results**
   - System calculates votes and assigns points
   - TV displays round results with winners
   - Mini leaderboard appears on TV
   - Timer counts down (resultsSecs setting, default 15 seconds)

6. **Advance**
   - Staff taps "Next"
   - Process repeats for each round/group
   - Game engine manages phase transitions automatically

### After Round
- TV displays round summary + leaderboard
- Staff pauses for drink/food push or bathroom break
- Players see their team's standing on phones

### End of Game
- **Final leaderboard** displayed on TV
- **Top 3 teams** announced with prizes (if applicable)
- **Soft exit:** Players see final position and CTA ("Come back next week!")

---

## 6. Game Flow – VIBox (AI Jukebox)

### Jukebox Mode

1. **Setup**
   - Staff selects "VIBox Mode"
   - TV shows venue's QR code + "Pick your vibe or request a song"

2. **Patron joins**
   - Player scans QR
   - Presented with vibe options: "Chill" 🌙 | "Hype" 🔥 | "Party" 🎉 | "Custom" 🎤

3. **Vibe selection**
   - Player selects a vibe OR enters custom prompt (e.g., "synthwave about coffee")
   - Confirms: "Generate AI track" or "Replay from library"

4. **Payment**
   - Helcim payment link displayed
   - Player pays $2.00 (covers Suno cost)
   - On success: "Track generating..."

5. **Generation**
   - Suno API generates AI song (30–60 seconds)
   - Player sees progress: "AI is writing your banger..."
   - Song added to venue's library (venue dashboard shows: "You now have X songs")

6. **Queue & Playback**
   - Song appears in "Up Next" queue on TV
   - Plays through venue speakers (AUX/Bluetooth)
   - Players can skip-vote if multiple songs in queue
   - Venue staff has pause/skip controls (bartender's remote)

7. **Continuous Jukebox**
   - VIBox runs continuously (no "game end")
   - Players can request tracks anytime during event
   - Revenue accumulates in real-time
   - Venue dashboard updates live: "Made $X so far from Y songs"

---

## 7. Hybrid Mode (Top Comment + VIBox)

Venue can run both games in one event:

**Timeline:**
- 6:00 PM – VIBox opens (background jukebox)
- 7:00 PM – Top Comment starts (3 rounds)
- 8:00 PM – VIBox resumes (jukebox)
- 9:00 PM – Top Comment final round + awards

**Revenue:** Top Comment ($60) + VIBox ($40) = **~$100/night**

---

## 8. Data & Analytics Flow

**During Event:**
- Real-time leaderboard updates via Supabase realtime
- Payment confirmations logged
- Song generation tracked

**After Event:**
- Venue dashboard updates:
  - Total scans/plays
  - Total revenue
  - Top team (for social media)
  - Song library size (for trial → paid messaging)

**Analytics Visible to:**
- **Venue staff:** Scans, revenue, trial status in app
- **Venue owner (dashboard):** Daily metrics, revenue trends, dwell time estimates
- **Social (internal):** City-level MRR, conversion tracking, churn alerts

---

## 9. Trial-to-Paid Conversion Mechanics

**During 14-Day Trial:**
- Staff runs Top Comment + VIBox fully unlocked
- All generated songs stored in venue's library
- "Day 7" message: "You've made $X and built X songs. This is yours if you upgrade."
- "Day 12" message: "Your trial ends in 3 days. Upgrade to keep your library?"

**Post-Trial (If No Upgrade):**
- Playback disabled: "Upgrade to keep your X songs"
- New song generation blocked
- Library data retained (not deleted)

**Post-Trial (If Upgrade to $299/month):**
- All features unlocked
- Library persists and grows
- Analytics dashboard full access
- Dedicated support

---

## 10. Edge Cases & Operational Notes

**Late Joiners**
- Players can join mid-game by scanning QR
- Added to existing team or new team

**Device Disconnects**
- If player loses connection, they can reopen link and rejoin their team's session

**Pacing Control**
- Staff can pause between rounds to match bar pacing (e.g., during rush hour)

**Small vs. Large Events**
- Same flow works with 2 teams or 50 teams
- No scaling issues or host-dependent bottlenecks

**Sponsored Rounds**
- Top Comment: Special round for sponsor (e.g., brewery logo on TV)
- VIBox: Brewery brand messaging in vibe selection screen

---

## 11. Revenue Tracking

**Real-Time Revenue Dashboard (Staff View):**
```
Tonight's Revenue
━━━━━━━━━━━━━━━━
Top Comment: $60 (40 plays)
VIBox: $40 (20 songs)
Server Tips: $45 (60% cut)
TOTAL: $145

Trial Days Left: 5 days
Library: 45 songs
```

**Post-Event Summary:**
- Email: "Great night! You made $145 and 45 patrons played. Upgrade to keep your songs."

---

## 12. Future Features (Post-MVP)

- **Ratings:** 1–5 star ratings per song (build "Venue Favorites" auto-list)
- **Leaderboards:** Track repeat players across weeks
- **Challenges:** Time-limited tournaments with prizes
- **Content Marketplace:** Creator submissions + revenue share
- **White-Label:** Multi-branded games for bar chains
