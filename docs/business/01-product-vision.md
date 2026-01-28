# Social Game Engine – Product Vision

**Social** is a B2B SaaS platform powering **hostless bar games** via QR codes, targeting Victoria, BC venues with expansion to national markets.

## Core Product

**Week 1:** Launch **Top Comment** – A Twitter-parody live voting game
- Players scan QR → join team → submit creative roasts → vote on favorites → live leaderboards
- Bartender controls game flow with "Next" button
- Real-time scoring via Supabase realtime
- **Validated:** 35 players at Christie's pilot event

**Week 4:** Launch **VIBox** – AI jukebox powered by Suno API
- Players scan QR → select vibe (chill/hype/party) or custom prompt → AI generates track → plays to venue speakers
- Patrons pay $1.50–$2.00 per play
- Queue display on TVs + skip voting
- Library lock-in for trial conversion

**Week 8:** Launch **Jeopardy Mode** – Strategic category selection game
- 6×7 category grid with host/team selection
- Point values and multipliers for enhanced scoring
- Strategic gameplay with category depletion

## Business Model

**Venue Pricing:** $299/month CAD (Pro plan, unlimited scans)
- 14-day free trial with library lock-in (upgrade required to retain generated songs)
- Venues keep 100% of patron revenue from games/songs
- Team earns 40% of patron tips; venues earn 60%
- **Enterprise plans:** $999+/month for bar chains (3+ locations)

**Patron Revenue per Venue/Night:**
- Top Comment: 40 plays × $1.50 = **$60**
- VIBox: 20 songs × $2.00 = **$40**
- Jeopardy Mode: 15 games × $1.50 = **$22.50**
- **Total: ~$122.50 patron revenue + $45 server tips** = **~$1,005/month potential**

**Revenue Split:**
- **Social:** $299/month subscription + 40% of tips (~$200/month)
- **Venue:** $1,005/month patron revenue + 60% of tips
- **ROI:** Venue pays $299 → makes $1,005+ (3.3x return)

## Tech Stack

- **Turborepo monorepo** (shared packages: UI, DB, AI, payments)
- **Supabase** for realtime queues, auth, analytics
- **React/TypeScript** PWAs (Top Comment, VIBox, venue dashboard)
- **OpenAI** for moderation ($0.001/scan)
- **Suno API** for AI track generation ($2/play)
- **Helcim/Stripe** for patron payments

## Initial Target Market

- **Phase 1:** Victoria, BC bars and pubs (59 venues targeted by Week 12)
- **Phase 2:** Vancouver, BC market expansion (100+ venues)
- **Phase 3:** National expansion to major Canadian cities
- **Target:** $44k MRR projected at Victoria scale, $100k+ MRR nationally

## Core Promises

✅ **Host-less**: One bartender, one button—no professional entertainer needed
✅ **Fast onboarding**: Players join in <10 seconds via QR, no apps or accounts
✅ **Monetized**: Clear revenue math for venues (3.3x ROI on subscription)
✅ **Scalable**: Shared monorepo architecture enables rapid feature launches
✅ **Data-driven**: Venue dashboards track engagement, revenue, and dwell time lift
✅ **Validated**: 35-player proof of concept at Christie's Carriage House Pub

## Competitive Advantages

- **Purpose-built for bars**: Noise tolerance, bartender workflow, patron psychology
- **Library lock-in**: AI-generated content creates conversion leverage
- **Multi-game platform**: Multiple engagement vectors vs single-game competitors
- **Real-time analytics**: ROI tracking competitors lack
- **Rapid deployment**: New games launched every 4 weeks
