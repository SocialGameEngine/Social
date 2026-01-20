# Feature Roadmap – Social Game Engine

## Phase 1: MVP Launch (Weeks 1–4)

**Goal:** Deploy Top Comment to 3 real bars with working monetization

**Must-Have Features:**

### Top Comment (Twitter Parody Game)
- QR scan → join anonymous team
- 3-round flow: prompt → submit roast → emoji voting
- Real-time leaderboard on venue TV
- OpenAI moderation for submissions
- $1.50 tip-to-vote via Helcim

### Shared Infrastructure
- Supabase realtime schema + RLS
- React/TypeScript PWA framework
- Venue QR generation + admin panel
- Basic analytics: scans/day, revenue/day

## Phase 2: Scale & Trial Engine (Weeks 5–8)

**Goal:** Add VIBox, implement trial-to-paid conversion mechanics

### VIBox (AI Jukebox)
- QR scan → vibe picker (chill/hype/party)
- Suno API integration for AI track generation
- Queue display on TVs + skip voting
- $2.00 per play, venue keeps patron revenue
- No persistent history (alpha)

### Trial Conversion Mechanics
- 14-day trial window with countdown
- Library lock-in: "Upgrade to keep your X songs"
- Playback disabled post-trial if not upgraded
- Venue dashboard: trial status, usage, revenue
- Internal sales dashboard: all trials, conversion tracking

### Analytics Tracking
- Per-venue: scans, revenue, songs count
- Per-game: completion rates, drop-off points
- Repeat player detection (where supported)

## Phase 3: Growth & Optimization (Weeks 9–12)

**Goal:** Validate $44k MRR target with 59 venues

### Venue Dashboard Enhancements
- CSV export for reconciliation
- Multi-game aggregation
- Suggested pricing based on usage
- Sponsor round analytics

### Payment & Upgrade Mechanics
- Frictionless Stripe conversion
- Email/SMS trial expiration reminders
- Enterprise plan onboarding (chains)
- Bulk QR generation

### Content Updates
- Weekly Top Comment prompts
- Themed VIBox libraries (seasonal)
- Sponsored rounds (brewery integration)

## Phase 4: Scale Foundations (Weeks 13+)

**Goal:** Enable 100+ venues and new segments

### Feature Roadmap
- **Rating system:** 1–5 stars per VIBox song
- **Popular lists:** Auto-generated "Venue Favorites"
- **Staff controls:** Mute vibes, toggle "AI night" mode
- **City-level analytics:** Compare venues, trends
- **White-label:** Multi-branded games for chains
- **Content marketplace:** Creator submissions + revenue share
- **Event mode:** Special tournaments with prizes

### Expansion Segments
- Restaurants (private dining games)
- Corporate events (team-building)
- Breweries (co-branded experiences)
- Pub crawls (leaderboard aggregation)

## Success Metrics by Phase

| Phase | KPI | Target |
|-------|-----|--------|
| **Phase 1** | Top Comment live in 3 bars | ✅ Weeks 1–4 |
| **Phase 2** | VIBox launch + trial engine | ✅ Weeks 5–8 |
| **Phase 3** | 10 venue pilots, 70% trial-to-paid | ✅ Weeks 9–12 |
| **Phase 4** | 59 venues, $44k MRR, <5% churn | ✅ Week 12+ |

## Technical Debt & Polish

**Ongoing (Parallel to Phases):**
- Reduce OpenAI moderation latency
- Optimize Supabase queries for real-time leaderboards
- Improve error handling + graceful degradation
- Mobile responsiveness testing
- Accessibility (WCAG 2.1)
