# Product Backlog â Social Game Engine (Top-Comment App)
_Derived from competitive research, April 2026. Terminology: memberships/socialites, not "teams."_

## Quick Add Instructions
To add a new backlog item, simply say "add to backlog" and provide the details.

### Backlog Item Template
#### P{Priority Tier}-X Â· {Backlog Item Name}
**Effort:** {Low, Medium, High}  
{Description of the backlog item}

---

## Priority Tiers

- **P0 â Ship first** (architectural / session-saving, or required for Always-On mode foundation)
- **P1 â High impact, low effort** (under a day's work, directly fixes competitor gaps)
- **P2 â High impact, medium effort** (< 1 sprint, high perceived polish)
- **P3 â Valuable, plan next quarter**

---

## P0 â Always-On / Ambient Mode

The hybrid model: hosted nights remain the prestige event; between sessions the TV runs autonomous trivia continuously. No competitor offers both in one product.

### AON-1 Â· Presenter migration to sociales
**Effort:** Medium  
The presenter (`/tv`) has not been updated since sessions were replaced with sociales. Update it to consume sociale state before any ambient work begins â this is a prerequisite for both hosted and ambient modes and is the natural first implementation step.
- Route `/presenter/:sessionId` to `/tv/:socialeId`
- Rewrite PresenterPage to read from sociale/round/phase state instead of session state
- Keep TTS on presenter but control settings from host panel (voice profile, auto-trigger settings)
- PresenterPage becomes display + TTS output - reflects backend sociale state

### AON-1b Â· Ambient presenter behavior
**Effort:** Low  
With the presenter running on sociales (AON-1), add ambient-specific behavior on top.
- Add `'ambient'` to `SocialeMode` union (`sociale.types.ts`) â no new DB column needed, `mode` field already exists
- Strip manual host controls from PresenterPage when `sociale.mode === 'ambient'`
- "Create Sociale" modal: add hosted/ambient toggle that sets `mode` on creation


### AON-3 Â· Ambient rounds bank
**Effort:** Medium  
A shared `ambient_rounds` table that ambient sociales cycle through using the existing `sociales.current_round_index` field. The existing phase auto-advance timer drives progression â no new scheduling infrastructure needed. When the index reaches the end of the bank it wraps to 0.
- `ambient_rounds` rows are fully self-contained: all data needed to run a round lives in the row (type, title, settings snapshot), queryable by index alone
- Supports both `SocialeRoundType` values used in ambient: `trivia` (multiple choice or written answer, right/wrong scoring) and `topic` (open-ended free-text, upvote-sorted, no correct answer)
- Each venue's sociale advances its own `current_round_index` independently on round completion
- Ambient mode is selected at sociale creation time via a hosted/ambient toggle in the "Create Sociale" modal (see AON-1 for `venue_mode` flag)
- **Initial library**: generate 200 rounds before shipping ambient mode â mix of topic and trivia rounds across a broad range of categories; use P1-15 (AI generation) as the generation tool run in bulk prior to launch
- **`prompt-admin` extension**: add an Ambient Rounds section to the existing admin app â view, add, edit, delete, and bulk import/export ambient rounds as JSON (mirrors the existing prompt library import/export pattern). Note: `prompt-admin` is significantly out of date relative to the current sociale architecture and will need a meaningful overhaul before this extension can be built

### AON-4 Â· Persistent room_membership identity
**Effort:** Medium  
`room_membership` is the persistent player identity per venue â streaks, history, and score live here across visits. `socialites` are short-lived per-game instances spun off from it and discarded after a sociale completes (retained for historical records only).
- **Same device**: existing device UUID (`sidebets_client_key`) auto-resumes `room_membership` â no auth friction
- **New device / cleared storage**: magic link email recovery â player enters email, taps link, `room_membership` restored
- `PlayerAuthModal`: magic link as default flow; "sign in with password instead" as a small secondary option for players who prefer it
- Hosts (`VenueAuthModal`) keep existing email/password auth unchanged

---

## P1 â High Impact / Low Effort

### P1-1 Â· Staggered answer reveal + FLIP leaderboard shuffle â highest ROI
**Effort:** Low (CSS + Framer Motion `layout`)  
Turn every question's reveal into 6â8 s of theater:
zoom on submitted answer (1 s) â drumroll dots (1.5 s) â green flash or "Nope â answer was X" (1 s) â score tick-up with rising-pitch tone (1.5 s) â leaderboard FLIP-shuffle with â/â ribbons (1.5 s).
- HostPage `RevealSequence` component orchestrates the choreography
- RoomPage mirrors green/red flash + haptic

### P1-2 Â· Always-on floating emoji reactions (RoomPage â TV)
**Effort:** Low  
Permanent reaction bar on RoomPage (ð ð ð¥ â¤ ð ð¥). Tap fires a Supabase broadcast; HostPage TV renders a Lottie float animation per event, visible on every slide â not just reveals.
- Works identically in hosted and ambient modes
- Membership pulse: when any membership submits, their block on TV pulses their color ~800 ms

### P1-3 Â· Persistent device token + optimistic reconnect banner
**Effort:** Medium  
Client UUID in localStorage + Supabase session token. Reconnecting socialite slots back in with score and membership intact. Thin yellow "Reconnectingâ¦" banner on RoomPage; queued answers flush on reconnect.
- Directly fixes Kahoot's worst anti-pattern (score/nickname reset on disconnect)
- Non-negotiable for pub wifi

### P1-4 Â· Host soundboard hotkeys
**Effort:** Low  
HostPage "Soundboard" panel: 6â8 one-tap buttons (drumroll / cheer / boo / fail-horn / applause / lobby music) plus keyboard shortcuts. Audio plays from the TV. The MC becomes a DJ.
- Most pub-specific feature; widest gap vs all competitors
- Extend with confetti hotkey (Y) from Crowdpurr pattern

### P1-5 Â· Submission state dots + "typingâ¦" indicator on HostPage
**Effort:** Low  
Per-membership state dots on the HostPage player list: grey = joined not answered, yellow = typing, green = submitted. Aggregate "2/4 submitted" per membership. TV shows stragglers by name ("Evan is still typingâ¦").
- Gives the MC pacing information â single most valuable live signal for a human host
- Debounce broadcast to ~150 ms

### P1-6 Â· "All Eyes Up" forced RoomPage lockout
**Effort:** Low  
HostPage button dims every connected RoomPage to a grey screen with a large â arrow ("Host is speaking â look at the TV"). Essential for tie-break explanations and long question reads in a noisy pub.

### P1-7 Â· Timer warning via border pulse + haptic, not numeric countdown
**Effort:** Low  
At 10 s left: RoomPage border pulses red, phone buzzes (`use-haptic` for iOS 18+, `navigator.vibrate` for Android), HostPage TV gets a slight red tint. No giant countdown number.

### P1-8 Â· Drinks-break intermission phase (first-class phase)
**Effort:** Low  
HostPage phase button: "Break â 5 / 10 / 15 min" with a countdown on the TV, ambient music, "back in X min" copy. RoomPage shows a tap-race filler mini-game or idle screen. Nobody in the competitive set ships this.

### P1-9 Â· Round-intro splash cards with category tease
**Effort:** Low  
Full-screen ~4 s card between rounds on the TV; background color shifts per category; whoosh audio sting. Gives the human host a breath moment. HostPage auto-fires between rounds.

### P1-10 Â· Leaderboard as a scheduled theatrical moment (not every question)
**Effort:** Low  
HostPage toggle: "Show leaderboard after this question." Default: show 3â4 times per 90-min session, each treated as a full reveal with music sting and rank-shuffle animation. Do NOT replicate Kahoot's forced every-question leaderboard.

### P1-11 Â· Final-round multiplier with splash card
**Effort:** Low  
Last round is worth 2â3Ã points. HostPage schedules a "Final Round â Double Points" splash. Mathematically prevents early dropouts from bottom-place memberships.

### P1-12 Â· Per-question audio (MP3 upload + YouTube link)
**Effort:** Low  
Music rounds are pub trivia's most-requested feature; only AhaSlides has this. HostPage question editor: file upload or YouTube link field. Audio plays from the TV when the question is revealed.

### P1-13 Â· Cross-week membership streak + emoji share card
**Effort:** Low  
Weekly streak flame next to membership name (ð¥4). Streak-freeze token if they miss one week. Post-session Wordle-style share card: "Quiz Night @ The Crown Â Team Bulldogs ð 3rd Â ðððððâ¬â" â one tap copies to clipboard, spreads through WhatsApp.

### P1-14 Â· Safety answer / "Lie for me" one-tap fallback on open-text
**Effort:** Low  
RoomPage open-text: one-tap button inserts a pre-written fallback answer for half points. Prevents drunk or stumped socialites from stalling the room.

### P1-15 Â· AI question-generation button on HostPage
**Effort:** Low  
"Generate round from topic" input: host types a topic or pastes a URL; OpenAI structured JSON output returns a full round in < 30 s. Feature parity with Crowdpurr/Kahoot 2025.
- Also seeds the ambient rounds bank (AON-3)
- Add AI moderation wrapper on all generated content (OpenAI `/v1/moderations`, free)

### P1-16 Â· Define TTS announcer content for each phase/round type
**Effort:** Low  
Design and implement specific TTS announcements for different game contexts to improve the TV presenter experience.
- **Phase announcements**: Current basic messages need enhancement (lobby, answer, vote, results, ended)
- **Round-specific intros**: Different announcements for trivia vs topic rounds
- **Score updates**: Announce leaderboard changes, milestones, "first to answer"
- **Time warnings**: "30 seconds remaining", "final 10 seconds", "time's up"
- **Special events**: "Double points round", "Final round", "Bonus round available"
- **Player callouts**: "Evan is still typing", "Everyone has answered", "3 players left"
- **Venue-specific**: Customizable venue name insertion, sponsor mentions
- **Voice variety**: Different tones/phrases for different voice profiles
- **Localization ready**: Structure announcements for future multi-language support
- **Testing suite**: TTS preview buttons in HostPage for testing all announcement types

### P1-17 Â· Always-visible corner QR on HostPage TV
**Effort:** Low  
QR code persists in the top-right corner of the `/tv` route throughout the session â not just in lobby. Late pub arrivals scan from anywhere in the room.

### P1-18 Â· Auto-advance with explicit "Lock it in" confirmation
**Effort:** Low  
Tap an answer â slides to "Lock it in? â / Change answer" confirmation screen. Never auto-submits on first tap. Fat-finger protection for drinks-in-hand socialites.

### P1-19 Â· "Welcome back, [Membership]" passwordless device resume
**Effort:** Low  
localStorage device fingerprint. Returning socialite is auto-suggested their previous membership with "Welcome back, Team Bulldogs ð." Core of the weekly-regular retention loop.

### P1-20 Â· Predictive Mode / Family-Feud rounds
**Effort:** Low  
HostPage toggle per question: host sets the correct answer *after* players guess. Enables opinion rounds, live sports predictions, majority-rules content. No new round scaffolding needed.

### P1-21 Â· Thin persistent progress bar on RoomPage
**Effort:** Low  
2â3 px bar at top: "Round 2/5 â Q 3/10." Commitment device; stops 45-min bailouts. Matches HostPage TV.

### P1-22 Â· Shape + color coding on answer tiles (accessibility)
**Effort:** Low  
Correct = green + â, wrong = red + â, close = yellow + ~. Combines color + shape so 8% color-blind audience can parse results. Dim-pub legibility.

### P1-23 Â· Combo / streak popup at 2-in-a-row
**Effort:** Low  
After two consecutive correct answers: "ð¥ Combo x2 â +50" ephemeral toast on the membership's phone. HostPage leaderboard row gets a flame badge. Injects drama mid-round.

### P1-24 Â· "Grab your mate" team deep-link
**Effort:** Low  
RoomPage button generates a short URL + QR that deep-links a friend directly into the membership. Solves the real "my friend just walked in" pub scenario; membership captain doesn't have to re-dictate the code.

### P1-25 Â· Moderation queue for open-text answers
**Effort:** Medium  
Host sees incoming answers in a side panel; single-tap approve or scrub before they hit the TV. Essential for licensed venues. Also powers "appeal the answer" flow.

### P1-26 Â· Mid-game regrade-all for variant answers
**Effort:** Medium  
Host marks a free-text answer "also correct"; second button re-applies that ruling across all past submissions to the same question. Pub hosts constantly accept spelling variants.

---

## P2 â High Impact / Medium Effort

### P2-1 Â· End-of-round sequential stat cards (Duolingo summary)
**Effort:** Medium  
Cards slide in sequentially with count-up easing (400 ms stagger): "Membership score +320" â "Accuracy 4/5" â "Fastest answer 2.3 s" â "League position +2 â." Structured 20â30 s of eyes-on-TV. RoomPage shows compact version.

### P2-2 Â· Native rounds within one session (multi-round architecture)
**Effort:** Medium  
Music / picture / wager / Predictive / bluffing rounds as first-class round types within a single session. Closes Crowdpurr's #1 paying-customer complaint ("no native concept of rounds within an experience"). Content variety combats 90-min monotony.

### P2-3 Â· 2-minute surprise bonus round
**Effort:** Medium  
At one unpredictable moment per night, every phone buzzes simultaneously and gets a 120-s prompt â selfie of victory pose, tap-the-beer-mug-fastest, guess the song clip. Worth 200 bonus pts. HostPage "Launch Bonus Round" button; RoomPage handles photo upload to Supabase Storage.

### P2-4 Â· Ghost / spectator mode for eliminated memberships
**Effort:** Medium  
Eliminated memberships see questions in a greyed "ghost" view, submit for fun without points, keep reacting with emojis. Prevents the last-place pub membership from leaving at round 5 of 8. Critical for elimination-style rounds.

### P2-5 Â· Banter / challenge channel with upvoting
**Effort:** Medium  
RoomPage "Banter" tab: memberships submit one-line comments or answer challenges. Other memberships upvote. Top 3 bubble to HostPage TV. Host reads top comment at round break. HostPage moderation queue gates content before TV display.

### P2-6 Â· Late-joiner catch-up routing
**Effort:** Medium  
Late joiners spectate remaining questions of the current round, score from next round onward, visible on TV as "Just joined â Team Ale-becs." RoomPage routing logic + HostPage notification.

### P2-7 Â· Tie-break / sudden death mode
**Effort:** Medium  
Tied memberships enter a rapid-fire 5-question speed round with 10-s timers and double points. HostPage "Resolve tie" button. Clean alternative to "they share 2nd place."

### P2-8 Â· Drag-and-drop order round with reveal animation
**Effort:** Medium  
RoomPage drag handle: players order 4â6 tiles. Reveal animates tiles from the player's order into the correct order. Strong picture-round variety; pairs with native rounds (P2-2).

### P2-9 Â· Secret-role cards for bluffing rounds
**Effort:** Medium  
Each phone gets a 2-s ephemeral reveal â "You have the REAL question ð" / "You have a DECOY â bluff your team." Can't be re-opened. Unlocks a whole Fibbage-style round type.

### P2-10 Â· Wrapped-style post-session recap (viral)
**Effort:** Medium  
8â10 swipeable full-screen story cards per membership: "Your clutch moment," "Category king: Music," "Fastest answer: 2.3 s." Exportable as PNG to Instagram Stories. Render with `html-to-image` or server-side `satori`.

### P2-11 Â· Mentimote-style HostPage-on-phone responsive mode
**Effort:** LowâMedium  
HostPage works equally on a laptop (projection) and the host's phone (walking the room). Responsive CSS route, not two apps.

### P2-12 Â· Mystery chest variable reward
**Effort:** Medium  
Every 5 questions, a random membership gets a "mystery chest" notification; tap opens a Lottie animation with a random bonus (50â500 pts). Variable-reward dopamine loop; visible to that membership only.

### P2-13 Â· Post-session analytics + CSV export
**Effort:** Medium  
HostPage post-session report: per-question stats, response times, correct %, auto-flagged difficult questions. Free tier gets a summary; paid gets full CSV. "Build redemption round from flagged questions" one-click.

### P2-14 Â· Cross-venue seasonal leagues
**Effort:** LowâMedium  
Weekly pub games auto-contribute to a city/country-wide season leaderboard. `seasons` + `season_standings` tables. Massive retention primitive for pub operators. Top memberships qualify for championship nights.

### P2-15 Â· Photo-submission rounds
**Effort:** LowâMedium  
Round prompt: "photo of weirdest thing on your table." Other memberships vote; winner scores. Supabase Storage + vote UI. Strong pub fit.

---

## P3 â Plan Next Quarter

### P3-1 Â· NFC/QR table stickers with venue + table params
Physical stickers linking to `/join?venue=X&table=7`, prefilling venue and table ID. Eliminates code entry for regulars. HostPage sees which physical table each membership is on for callouts. Hardware-dependent; trivial URL params.

### P3-2 Â· PWA install with streak-count badge
After first session, RoomPage prompts "Add to Home Screen." Icon displays streak count via Badging API. Persistent reminder between pub nights.

### P3-3 Â· Audience mode for overflow joiners
Joiners after lobby close route into a vote-only spectator state instead of seeing an error. "You're in the audience â get ready to vote!" Join a real membership at the next round break.

### P3-4 Â· Voice input for open-text answers (Whisper)
Hold-to-speak button on RoomPage; 2â5 s recording; server transcription via OpenAI `/v1/audio/transcriptions`. Excellent for drunk / fat-finger players. Push-to-talk only.

### P3-5 Â· VIP guest list for ticketed events
HostPage pre-game: upload CSV of allowed emails/phones. Restricts join to pre-approved list. Perfect for paid private-hire pub quizzes.

### P3-6 Â· Speed-based point scaling (Mentimeter formula)
500â1000 points sliding by answer time. Keeps leaderboards volatile, rewards fast memberships without punishing slow ones. HostPage toggle per round.

### P3-7 Â· Accuracy mode (no speed bonus)
HostPage toggle: removes speed bonus entirely. Equal time and points for all. Fairer for mixed-age or casual groups. Answers Kahoot 2025 reviewers' fairness complaints.

### P3-8 Â· Co-host / bartender promotion
If the pub host's phone dies, a co-host or bartender can be promoted to host authority without ending the session. Prevents single-host dependency.

### P3-9 Â· Multi-language UI shell
UI strings localized; question content stays host-authored. Plan i18n keys from day one even if only English ships initially.

### P3-10 Â· Sponsor ad slots on player phones
HostPage "Sponsors" tab: pub operator uploads local sponsor image; appears on membership phone after response and as a persistent lower-third on TV. Upsell for "drinks special from Brewdog."

---

## Anti-Patterns to Actively Avoid

| Anti-pattern | Why |
|---|---|
| Score / nickname reset on reconnect | Fatal on pub wifi â always persist device UUID |
| Leaderboard after every question | Destroys drama; treat as scheduled theatrical moment 3â4Ã/session |
| Free-tier caps on participants or in-session question count | Fires paywall mid-round; cap on sessions or features instead |
| Mid-session upgrade modals | Never interrupt live play; move monetisation to post-session share screen |
| Round-chaining instead of native rounds | #1 paying-customer complaint in Crowdpurr; ship rounds as first-class |
| Kick-only before game starts | Pub hosts need full moderation power throughout |
| Brute-forceable public codes | 6-char alphanumeric + server-side rate limiting on join attempts |
| Individual-only scoring | Memberships are the primitive; "group around one device" is a product failure |
| Timer locked to presentation-wide setting | Ship per-question timer overrides |
| Auto-advance without "Lock it in" confirmation | Never auto-submit on first tap |
| Confetti on every interaction | Reserve for genuine win moments; default to pub-appropriate moody theme |
| Random public matchmaking | Private rooms only; pub trivia is co-located and social |
| Guilt-based push notifications | Event-based product, not a daily habit; notify only on session start and bonus rounds |
| Elimination / lives system | Comeback mechanics instead; trivia tolerates wrongness |
| Hard player cap (wrong unit) | Memberships are the player unit, not individuals |

---

## Notes on Terminology

This app uses **memberships / socialites / session-players** â never "teams." All backlog items above use that terminology. When mapping research patterns that reference "teams" (Kahoot, Crowdpurr, AhaSlides), substitute "membership" throughout.

---

## Template for New Backlog Items

Copy this template for new backlog entries:

#### P{Priority Tier}-X Â· {Backlog Item Name}
**Effort:** {Low, Medium, High}  
{Description of the backlog item}

---

*Last Updated: 2026-04-20*
