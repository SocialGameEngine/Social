# Technical Architecture – Social Game Engine

## System Overview

**Social** powers three games—**Top Comment** (Week 1), **VIBox** (Week 4), and **Jeopardy Mode** (Week 8)—through a shared Turborepo monorepo leveraging Supabase for realtime, OpenAI for moderation, and Suno for AI tracks.

## Turborepo Monorepo Structure

```
social/
├── apps/
│   ├── web/          # playnow.social landing + admin panel
│   ├── topcomment/   # Game 1: Twitter parody PWA
│   ├── vibox/        # Game 2: AI jukebox PWA
│   ├── jeopardy/     # Game 3: Category selection PWA
│   └── dashboard/    # Venue staff analytics dashboard
├── packages/
│   ├── ui/           # Shared Button, Leaderboard, QR scanner components
│   ├── db/           # Supabase schema + realtime queries
│   ├── ai/           # OpenAI moderation + Suno wrapper
│   └── payments/     # Helcim / Stripe webhook handlers
├── turbo.json        # Build orchestration
└── pnpm-workspace.yaml
```

## Supabase Schema (Shared Across Games)

```sql
CREATE TABLE venues (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE,
  qr_code TEXT UNIQUE,
  trial_start TIMESTAMP,
  trial_end TIMESTAMP,
  plan_status TEXT CHECK (plan_status IN ('trial', 'active', 'canceled')),
  stripe_customer_id TEXT
);

CREATE TABLE games (
  id UUID PRIMARY KEY,
  venue_id UUID REFERENCES venues,
  type TEXT CHECK (type IN ('topcomment', 'vibox', 'jeopardy')),
  status TEXT CHECK (status IN ('waiting', 'playing', 'voting', 'ended')),
  created_at TIMESTAMP,
  ended_at TIMESTAMP
);

CREATE TABLE rounds (
  id UUID PRIMARY KEY,
  game_id UUID REFERENCES games,
  prompt TEXT,
  status TEXT CHECK (status IN ('open', 'locked', 'voted')),
  created_at TIMESTAMP,
  locked_at TIMESTAMP
);

CREATE TABLE entries (
  id UUID PRIMARY KEY,
  round_id UUID REFERENCES rounds,
  team_id UUID,
  content TEXT,
  votes INT DEFAULT 0,
  created_at TIMESTAMP
);

CREATE TABLE venues_stats (
  id UUID PRIMARY KEY,
  venue_id UUID REFERENCES venues UNIQUE,
  scans_this_month INT,
  revenue_this_month DECIMAL,
  songs_this_trial INT,
  revenue_this_trial DECIMAL,
  jeopardy_games_this_month INT DEFAULT 0
);
```

**Realtime Subscriptions:**
- Channel: `games:venue_id`
- RLS: `venue_id = auth.jwt()->venue_id`
- Trigger leaderboard updates, entry votes, song queue changes in real-time

## Game Feature Specs

### Top Comment (Twitter Parody)

**MVP Scope (Weeks 1–4):**
- QR scan → anonymous nickname → join table team
- 3-round flow: **prompt → submit roast → emoji voting → score update**
- Live leaderboard on bar TVs (Supabase realtime)
- $1.50 tip-to-vote (Helcim)

**Technical Flow:**
```
Auth: supabase.auth.signInAnonymously()
State machine: waiting → entries → voting → winners
Moderation: OpenAI gpt-4o-mini (~$0.001/scan)
Scoring: Real-time calc + Supabase triggers
```

### Jeopardy Mode (Strategic Category Selection)

**Alpha Scope (Weeks 7–8):**
- QR scan → team formation → category selection grid (6×7)
- Host/Team selects categories → strategic point values and multipliers
- Enhanced scoring with point cards (100-700) and 2x multipliers
- Category depletion mechanics for strategic gameplay
- $1.50 per play, enhanced engagement and dwell time

**Technical Flow:**
```
team formation → category grid selection → point revelation → answer phase → voting → scoring
category_grid JSONB for 6×7 grid state
real-time category availability tracking
enhanced analytics for strategic gameplay patterns
```

## API Architecture

### Patron PWA (All Games)

**Endpoints:**
- `POST /api/join` → Create game session
- `POST /api/entry` → Submit answer/vibe/category
- `POST /api/vote` → Vote on entry
- `GET /api/leaderboard` → Current scores (realtime via Supabase)
- `POST /api/payment` → Helcim payment link
- `GET /api/category-grid` → Jeopardy category grid state

### Venue Dashboard (Staff)

**Endpoints:**
- `GET /api/venue/:id/stats` → Scans, revenue, songs this month
- `GET /api/venue/:id/trial-status` → Days remaining, upgrade prompt
- `GET /api/games/:id/leaderboard` → Post-game results
- `GET /api/venue/:id/engagement` → Dwell time analytics
- `POST /api/venue/:id/qr` → Generate new QR codes

### Admin Panel (Internal)

**Endpoints:**
- `POST /api/admin/venue` → Create venue, generate QR
- `GET /api/admin/trials` → All trials, usage, conversion status
- `GET /api/admin/revenue` → City-level MRR, per-venue breakdown
- `GET /api/admin/analytics` → Engagement metrics, churn risks

## Payment & Revenue Flow

**Patron Payments:**
1. Player submits entry (Top Comment) or vibe (VIBox)
2. System calls `POST /api/payment` → Helcim hosted page
3. On success: webhook triggers `handlePaymentSuccess()`
   - Deduct Suno cost from balance
   - Record revenue in `venues_stats`
   - Generate song (VIBox) or increment score (Top Comment)

**Venue Trial Conversion:**
1. Trial ends → backend job flags for 3-day warning
2. "Upgrade to keep your X songs" message in playback app
3. Venue manager upgrades → Stripe subscription starts
4. Library unlocks, new songs continue

## Deployment & Costs

**Hosting:**
- Apps: Vercel (Pro tier, $20/month)
- Database: Supabase (Pro tier, $25/month)
- AI: OpenAI ($5/month), Suno credits ($10 startup)
- Domain: playnow.social ($100/year)
- Trademark: CIPO intent-to-use ($250)

**Total Startup:** $485
**Monthly Burn:** ~$50 at scale

## Week 1 Setup Checklist

- [ ] Create Turborepo: `pnpm create turbo@latest social --use-pnpm`
- [ ] Add dependencies: Supabase, OpenAI, React, Tailwind
- [ ] Implement Supabase schema + RLS policies
- [ ] Build Top Comment QR join screen
- [ ] Deploy PWA to Vercel: `playnow.social/topcomment`
- [ ] Generate 10 test QR codes
- [ ] Pilot at Felicita's/Christie's
