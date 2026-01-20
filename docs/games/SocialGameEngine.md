# Social Game Engine **Social** — Comprehensive Project Report

**Date:** January 6, 2026
**Version:** 2.0 (Post-Migration Architecture)
**Team:** 4 UVic Co-founders (Kris, Pat, Eric, Braden) — **140 hrs/week capacity**
**Status:** **Supabase Migration Complete** - Firebase → PostgreSQL + Edge Functions
**Platform:** Turborepo monorepo → React PWA games (**Top Comment + VIBox**) on Supabase PostgreSQL + Edge Functions

---

## Executive Summary

**Social** is a B2B SaaS platform (**$299/mo per venue**, 14‑day free trial) powering **hostless bar games** via QR codes.

* **Week 1:** Launch **Top Comment** (Twitter‑parody live voting game)
* **Week 4:** Launch **VIBox** (AI jukebox)

A shared monorepo powers Supabase realtime queues, OpenAI moderation, and React/Tailwind UI across all games.

### Financial Snapshot

* **Week 4:** 5 venues → **$1.5k MRR**
* **Week 12:** 59 pubs → **$44k MRR (projected)**

**Revenue Split**

* 60% servers ($45/shift)
* 40% venue / Social (Helcim‑tracked tips)

**Patron Microtransactions**

* $1.50 per game play

**Tech Costs**

* $500 startup
* ~$50/month at scale

**ROI**

* Break‑even by **Week 8**
* UVic co‑op validation by **Week 12**

---

## Pricing & Revenue Model

| Tier           | Price / Month (CAD) | Features                                 | Target           | Conversion KPI     |
| -------------- | ------------------- | ---------------------------------------- | ---------------- | ------------------ |
| **Freemium**   | $0 (14 days)        | Top Comment, 100 scans/month             | Felicita’s pilot | 70% → Pro          |
| **Pro**        | **$299**            | Top Comment + VIBox, 5k scans, custom QR | 59 Victoria pubs | 40% scan rate      |
| **Enterprise** | Custom ($999+)      | 3+ games, API, white‑label, 50k scans    | Chains (10+)     | $6k MRR by Week 12 |

### Patron Revenue (Per Venue / Night)

* Top Comment: 40 plays × $1.50 = **$60**
* VIBox: 20 songs × $2.00 = **$40**
* Server tips (60% cut): **$45 / shift**

**Total:** ~$145/night → **$750/month per venue**

**Team Revenue Split:** 60% servers, 40% Social/venue

---

## Technical Architecture (Turborepo Monorepo)

```text
social/
├── apps/
│   ├── event-platform/    # Main event platform (host/team/presenter)
│   │   ├── host/         # Host interface with session management
│   │   ├── team/         # Player interface for joining games
│   │   └── presenter/    # Large screen display for audiences
│   ├── dashboard/        # Admin dashboard for venue analytics
│   ├── web/              # Marketing site (playnow.social)
│   ├── topcomment-247/   # Legacy Top Comment PWA
│   └── vibox/        # Legacy VIBox PWA
├── packages/
│   ├── game-engine/      # Core game engine interfaces
│   ├── games/            # Game implementations (topcomment, vibox)
│   │   ├── topcomment/   # Top Comment game logic & components
│   │   └── vibox/        # VIBox game logic & components
│   ├── ui/               # Shared React components (Card, Button, etc.)
│   ├── db/               # Supabase client & database utilities
│   ├── auth/             # Authentication utilities
│   ├── ai/               # OpenAI moderation + AI services
│   └── payments/         # Payment processing (Stripe/Helcim)
├── supabase/
│   ├── functions/        # Edge Functions for game operations
│   └── migrations/       # Database schema migrations
├── turbo.json            # Build orchestration
└── pnpm-workspace.yaml
```

### Week 1 Setup

```bash
pnpm create turbo@latest social --use-pnpm
cd social
pnpm add -w @supabase/supabase-js openai lucide-react react-hook-form
pnpm add -D turbo @tailwindcss/vite
mkdir -p apps/topcomment packages/{ui,db,ai}
pnpm dev --filter=topcomment
vercel deploy --prod
```

Live at: `playnow.social/topcomment`

---

## Supabase Schema (Shared Across Games)

```sql
-- Core Sessions (Event Mode)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  host_uid TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'lobby',
  round_index INTEGER NOT NULL DEFAULT 0,
  rounds JSONB NOT NULL DEFAULT '[]',
  vote_group_index INTEGER,
  prompt_deck JSONB NOT NULL DEFAULT '[]',
  prompt_cursor INTEGER NOT NULL DEFAULT 0,
  prompt_library_id TEXT NOT NULL DEFAULT 'classic',
  settings JSONB NOT NULL DEFAULT '{"answerSecs": 90, "voteSecs": 90, "resultsSecs": 12, "maxTeams": 24}',
  venue_name TEXT,
  venue_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ
);

-- Teams (Players in Event Sessions)
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  uid TEXT NOT NULL,
  team_name TEXT NOT NULL,
  is_host BOOLEAN NOT NULL DEFAULT false,
  score INTEGER NOT NULL DEFAULT 0,
  mascot_id INTEGER,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(session_id, uid)
);

-- Answers (Player Submissions)
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  round_index INTEGER NOT NULL,
  group_id UUID NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Votes (Player Voting)
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  answer_id UUID NOT NULL REFERENCES answers(id) ON DELETE CASCADE,
  round_index INTEGER NOT NULL,
  group_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Venues (for future venue management)
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Realtime Subscriptions**

* Channel: `sessions:{session_id}` (per session)
* RLS: Row Level Security with authenticated access
* Real-time updates for live game state

---

## Feature Specifications

### Game 1: Top Comment (Twitter Parody)

**Current Status: ✅ MVP Complete**

**Event Mode Features:**
* Host creates session with unique QR code
* Multiple players join via team names and mascots
* 3-round flow: prompt → submit answers → vote → results
* Presenter view for bar TVs (Supabase realtime)
* Host controls phase advancement

**Patron Mode Features:**
* Solo play without host
* Self-paced rounds
* Compete against historical leaderboards
* No room codes needed

**Technical Implementation:**
* Auth: Supabase anonymous auth + persistent sessions
* State machine: `lobby → answer → vote → results → ended`
* Moderation: OpenAI GPT-4o-mini content filtering
* Real-time: Supabase realtime subscriptions
* Engine: Modular game engine supporting multiple games

---

### Game 2: VIBox (AI Music Quiz)

**Current Status: ✅ Engine Complete**

**Event Mode Features:**
* Host selects music categories/genres
* Players guess song/artist information
* Real-time scoring and leaderboards
* Presenter view with song clues
* Multiple rounds with escalating difficulty

**Patron Mode Features:**
* Solo music trivia challenges
* Genre-specific quizzes
* Historical scoring comparisons
* Progressive difficulty levels

**Technical Implementation:**
* Music database integration
* Dynamic question generation
* Audio playback in browser
* Real-time answer validation
* Shared engine architecture with Top Comment

---

### Venue Dashboard (Weeks 7–8)

**Metrics**

* Scans/day
* Revenue/hour
* Server tips

**Controls**

* Start/stop games
* Regenerate QR codes

**Exports**

* CSV for Helcim reconciliation

---

## Current Project Status

| Phase              | Status               | Completion         | Owner(s)          |
| ------------------ | -------------------- | ------------------ | ----------------- |
| ✅ Firebase Migration | Complete            | 100%              | Braden, Kris     |
| ✅ Game Engine Architecture | Complete         | 100%              | Kris, Pat        |
| ✅ Top Comment Event Mode | Complete         | 100%              | Kris, Pat, Eric  |
| ✅ Top Comment Patron Mode | Complete        | 100%              | Kris, Pat        |
| ✅ VIBox Event Mode | Complete            | 100%              | Eric, Braden     |
| ✅ VIBox Patron Mode | Complete            | 100%              | Eric, Braden     |
| 🔄 Venue Dashboard | In Progress         | 60%               | Kris, Pat        |
| 📋 Venue Pilots    | Planning            | 20%               | Pat              |
| 🎯 Revenue Validation | Pending          | 0%                | Full team        |

---

## Team Roles & Capacity

| Role                    | Name   | Hours / Week | Split             | Ownership         |
| ----------------------- | ------ | ------------ | ----------------- | ----------------- |
| Hybrid Visionary        | Kris   | 40           | 60% Dev / 40% Biz | Engine + sales    |
| Hybrid Growth Engineer  | Pat    | 40           | 60% Dev / 40% Biz | Games + growth    |
| Product / UX Lead       | Eric   | 40           | 100% Dev          | UI + PWAs         |
| Infrastructure Engineer | Braden | 20           | 100% Dev          | Supabase + deploy |

---

## Current Priorities & Next Steps

### Immediate Focus (Q1 2026)

**🎯 Venue Dashboard Completion (Weeks 1-2)**
* Analytics dashboard for venue owners
* QR code generation and management
* Revenue tracking and reporting
* Session monitoring and controls

**🏪 Venue Pilot Program (Weeks 3-4)**
* Select 5-10 Victoria venues for pilots
* Onboard venues with custom QR codes
* Train venue staff on system usage
* Collect initial feedback and metrics

**📊 Revenue Model Validation (Ongoing)**
* Test $299/month pricing with pilot venues
* Validate $1.50 per play microtransactions
* Monitor server tip sharing mechanics
* Track actual vs projected revenue

### Technical Debt & Improvements

**🔧 Platform Stability**
* Comprehensive testing suite (unit, integration, e2e)
* Error handling and monitoring
* Performance optimization
* Mobile PWA improvements

**🎮 Game Experience**
* Enhanced UI/UX based on user feedback
* Additional game modes and features
* Improved presenter view layouts
* Accessibility improvements

---

## Cost Breakdown

| Category          | Item               | Cost (CAD)  | Timing |
| ----------------- | ------------------ | ----------- | ------ |
| Domain            | playnow.social     | $100 / year | Week 1 |
| Trademark         | CIPO intent‑to‑use | $250        | Week 1 |
| Stickers          | 1,000 prints       | $100        | Week 2 |
| Supabase          | Pro tier           | $25 / month | Week 4 |
| Vercel            | Pro                | $20 / month | Week 4 |
| OpenAI            | Moderation         | $5 / month  | Week 4 |
| Suno              | Credits            | $10         | Week 5 |
| **Total Startup** |                    | **$485**    |        |

---

## Success Metrics & KPIs

| Phase              | Metric                     | Target              | Status          |
| ------------------ | -------------------------- | ------------------- | --------------- |
| MVP Launch         | Game Engine Stability     | 99.9% uptime       | ✅ Complete    |
| Pilot Program      | Venue Adoption Rate        | 40% scan rate       | 🔄 In Progress |
| Revenue Validation | First 5 Paid Venues        | $1,495 MRR          | 📋 Planned     |
| Scale Phase        | Full MRR Target            | $44k MRR            | 🎯 Goal        |
| Ongoing           | Server Partnership Income  | $45/shift average   | 📊 Monitoring  |

**Current Achievements:**
- ✅ Full game engine with 2 complete games (Top Comment + VIBox)
- ✅ Supabase PostgreSQL migration complete
- ✅ Event + Patron modes implemented
- ✅ Real-time multiplayer functionality
- ✅ Presenter view for large screens
- ✅ Mobile-responsive PWAs

---

## Risk Mitigation

| Risk               | Probability | Mitigation              |
| ------------------ | ----------- | ----------------------- |
| Low venue adoption | Medium      | Free Felicita’s pilot   |
| Supabase scaling   | Low         | Dedicated infra owner   |
| Moderation failure | Low         | Regex + manual fallback |
| Team ramp delay    | Medium      | Solo Weeks 1–2          |

---

## Appendices

### Supabase RLS Policy

```sql
ALTER POLICY "Patron venue access" ON games
FOR ALL USING (venue_id = auth.jwt()->>'venue_id');
```

### Sticker Copy

> 🔥 **TOP COMMENT: Scan to Roast Live**
> Own tonight’s feed → **$1.50 votes**

QR: `d/topcomment?venue=felicitas`

### UVic Co‑op Pitch

**“4.5 co‑op units → $44k MRR by graduation”**

* Engine + 2 games live by Week 4
* Felicita’s pilot data Week 2
* 59‑pub pipeline by Week 12

---

**Next Action:** Complete venue dashboard → **Launch pilot program by end of Q1 2026**
