# Söcial App Game Flow – Social Game Engine Edition

## 1. Overview

**Social** is a host-less, browser-based gaming platform for bars. One staff member controls the games (Top Comment + VIBox) from a venue device (laptop/tablet connected to TV), while players join from their phones via QR code.

This document describes the end-to-end game flow for a Social night in a bar.

---

## 2. Roles

**Venue Staff (Host/Bartender)**
- Starts and controls game sessions on the venue device
- Advances rounds and prompts (taps "Next")
- Makes announcements (celebrates winners, reminds players to order drinks)

**Players / Patrons**
- Join via QR code or short URL on their phones
- Form teams, submit answers/votes, compete
- Pay $1.50–$2.00 per play/song

**Social System**
- Manages sessions, rounds, scoring, real-time state
- Tracks engagement metrics and aggregates analytics for venue dashboard
- Handles payments via Helcim/Stripe

---

## 3. Pre-Event Setup

1. **Venue device setup**
   - Staff opens Social web app on laptop or tablet
   - Connects device to bar TV/projector (HDMI or AirPlay)

2. **Select game configuration**
   - Choose game: "Top Comment Night" or "VIBox Jukebox" or "Both"
   - Set parameters:
     - Number of rounds (typically 3–5)
     - Tone/difficulty (bar-friendly, rated G)
     - Sponsored rounds (if applicable)

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

2. **Create or join a team**
   - Player creates new team or joins existing team at table
   - Team chooses name (e.g., "The Roasters", "Bar Flies")
   - Optional: Team chooses emoji/avatar

3. **Ready state**
   - Staff sees live join count on venue device
   - TV lobby updates: "5 teams joined! Ready to start?"
   - Staff taps "Start" when ready

---

## 5. Game Flow – Top Comment (Social Voting)

### Round Structure

1. **Round intro**
   - TV displays: "Round 1: Icebreakers"
   - Optional sponsor branding

2. **Prompt display**
   - Staff taps "Next" on venue device
   - TV displays comedy prompt (e.g., "Finish this: The worst thing to say at a bar is...")
   - Players see same prompt on their phones

3. **Player response phase (60–90 seconds)**
   - Teams discuss at their table
   - One team member submits a creative "roast" response via phone
   - Timer counts down on TV and phones
   - Late submissions marked but still allowed

4. **Locking answers**
   - Timer expires or staff taps "Next"
   - All submissions freeze

5. **Reveal & voting**
   - TV displays all responses (anonymized or by team name)
   - Players vote on funniest response (emoji voting: 😂 👍 ❤️)
   - Staff may highlight top responses

6. **Score update**
   - System calculates votes
   - Top team for round gets points
   - Mini leaderboard appears on TV

7. **Advance**
   - Staff taps "Next"
   - Steps 2–7 repeat for each prompt

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
