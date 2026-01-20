# Social Game Engine – Product Vision

**Social** is a B2B SaaS platform powering **hostless bar games** via QR codes, targeting Victoria, BC venues.

## Core Product

**Week 1:** Launch **Top Comment** – A Twitter-parody live voting game
- Players scan QR → join team → submit creative roasts → vote on favorites → live leaderboards
- Bartender controls game flow with "Next" button
- Real-time scoring via Supabase realtime

**Week 4:** Launch **VIBox** – AI jukebox powered by Suno API
- Players scan QR → select vibe (chill/hype/party) or custom prompt → AI generates track → plays to venue speakers
- Patrons pay $1.50–$2.00 per play
- Queue display on TVs + skip voting

## Business Model

**Venue Pricing:** $299/month CAD (Pro plan, unlimited scans)
- 14-day free trial with library lock-in (upgrade required to retain generated songs)
- Venues keep 100% of patron revenue from games/songs
- Team earns 40% of patron tips; venues earn 60%

**Patron Revenue per Venue/Night:**
- Top Comment: 40 plays × $1.50 = **$60**
- VIBox: 20 songs × $2.00 = **$40**
- **Total: ~$100 patron revenue + $45 server tips** = **~$750/month potential**

## Tech Stack

- **Turborepo monorepo** (shared packages: UI, DB, AI, payments)
- **Supabase** for realtime queues, auth, analytics
- **React/TypeScript** PWAs (Top Comment, VIBox, venue dashboard)
- **OpenAI** for moderation ($0.001/scan)
- **Suno API** for AI track generation ($2/play)
- **Helcim/Stripe** for patron payments

## Initial Target Market

- **Victoria, BC bars and pubs**
- **59 venues targeted** by Week 12
- **$44k MRR projected** at scale

## Core Promises

✅ **Host-less**: One bartender, one button—no professional entertainer needed
✅ **Fast onboarding**: Players join in <10 seconds via QR, no apps or accounts
✅ **Monetized**: Clear revenue math for venues (patron spending + server tips)
✅ **Scalable**: Shared monorepo architecture enables rapid feature launches
✅ **Data-driven**: Venue dashboards track engagement, revenue, and dwell time lift
