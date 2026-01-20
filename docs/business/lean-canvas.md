# Social Game Engine – Lean Canvas

## Problem

**1. Bars lack scalable, affordable entertainment**
- Midweek revenue is flat despite proven demand for engaging content
- Professional hosts cost $200–300/night and don't scale across locations
- Industry studies show successful game nights lift midweek revenue 20–65% and draw 30–50+ players staying 2+ hours
- Most bars still lack this programming (cost + complexity barriers)

**2. Existing game tools fail in bar environments**
- Consumer games (Jackbox, quiz apps) assume controlled environments with stable groups—fail in loud, high-turnover bars
- Specialized bar-trivia systems exist but require expensive hardware and still lack analytics
- No solution combines ease-of-use + engagement + monetization

**3. Bars can't measure ROI on entertainment**
- Venue owners see busy trivia nights but lack dashboards to quantify dwell time, average check increases, or customer retention
- Industry case studies reference revenue lifts but don't provide venue-level analytics

## Solution

**1. Host-less, browser-based gaming platform for bars**
- **Top Comment:** Twitter-parody real-time voting game (QR join, 3 rounds, live leaderboards)
- **VIBox:** AI jukebox (QR join, vibe picker, Suno-generated tracks, queue on TVs)
- One staff member, one button—no professional entertainer needed

**2. Real-time multiplayer architecture**
- Supabase realtime for instant leaderboards and game state
- OpenAI moderation for content safety
- Suno API for unlimited AI track generation
- Shared Turborepo monorepo enables rapid feature launches

**3. Comprehensive venue analytics**
- Track engagement, revenue, dwell time lift (15–25% validated)
- Trial-to-paid conversion mechanics (library lock-in)
- ROI dashboard: "You made $X from Y scans"

## Unique Value Proposition

**For Venue Owners:**
"Host-less social games that deliver 15–25% dwell time increase, measurable engagement analytics, and weekly entertainment that runs itself after 5-minute setup. Validated with 35 players staying 2 hours at pilot events."

**For Patrons:**
"Join instantly with your phone (no app, no login), submit creative answers, vote on favorites, and compete on real-time leaderboards with strangers who become friends."

**For Staff:**
"Run a game with one button. Incentivized by $45/shift in tips. No training needed—players love it."

## Unfair Advantage

✅ **Validated product-market fit:** Christie's pilot (35 players, 2-hour engagement); 6 additional venues pursuing pilots

✅ **Purpose-built for bars:** Pacing, UX, readability, noise tolerance, bartender workflow optimized through live bar testing

✅ **Two games in one platform:** Top Comment (social voting) + VIBox (AI jukebox) = multiple engagement vectors, higher spend per venue

✅ **Fastest QR onboarding:** <10 seconds, no apps, no accounts, no typing—faster than any competitor in chaotic bar environments

✅ **Library lock-in:** Venues build AI song library during trial; upgrade required to retain and grow it (70% trial conversion target)

✅ **Analytics competitors lack:** Comprehensive venue dashboard tracks engagement, revenue, dwell time, retention—ROI metrics bars desperately need

✅ **Shared architecture:** Turborepo enables rapid game launches and scalability (Week 1: Top Comment, Week 4: VIBox, future: additional games)

## Channels

- **Pilot validation events:** Live demos at target venues showcasing 2-hour engagement and real revenue (7 pilot venues secured, including Christie's)
- **Direct venue outreach:** In-person meetings with bar owners/managers, follow-up from successful pilots
- **Brewery partnerships:** Co-branded sponsored rounds and events for distribution + revenue sharing
- **Social proof & virality:** Player-generated clips of funny moments, high-energy games shared on social media
- **Multi-venue expansion:** City-wide tournaments, pub crawls, bar chain partnerships for scalable growth
- **Street team incentives:** $45/shift tips to venue staff running games (drives adoption + retention)

## Customer Segments

**Primary Buyer:**
- Independent bar owners/managers seeking reliable weekly programming
- **Current pipeline:** 7 venues (Christie's + 6 pursuing pilots)

**Primary User:**
- Bar staff (bartenders, managers) running games while serving
- Needs: Effortless operation, incentivized via tips

**End Users:**
- Millennial/Gen-Z patrons (groups, couples, strangers forming teams)
- Driver: Social media sharing, repeat visits, friend referrals

**Future Segments:**
- Bar chains needing cross-location analytics and standardized programming
- Breweries/distributors seeking sponsored rounds and co-branded events
- Event spaces, corporate social events, pub crawls

## Key Resources

- **Real-time gaming platform:** React/TypeScript + Supabase realtime, optimized for bar environments
- **Game content:** Top Comment prompts, VIBox vibes (multiple themed libraries)
- **Analytics infrastructure:** Venue dashboard, trial tracking, revenue attribution
- **Early venue relationships:** 7 pilot venues + Christie's validation event
- **Technical expertise:** Turborepo monorepo, OpenAI integration, Suno API wrapper, Helcim payments
- **Team capacity:** 4 co-founders, 140 hrs/week (can reach $44k MRR in 12 weeks)

## Cost Structure

- **Platform development:** Turborepo, Supabase schema, realtime infrastructure, PWA optimization
- **Cloud hosting:** Supabase (Pro tier), Vercel (Pro tier), ~$50/month at scale
- **AI/API costs:** OpenAI moderation ($5/month), Suno credits ($2/play)
- **Content creation:** Weekly Top Comment prompts, themed VIBox libraries, seasonal updates
- **Marketing & assets:** Landing page, demo videos, QR signage, social media content
- **Sales & pilots:** Venue outreach, pilot events, relationship building (Victoria-focused)
- **Customer success:** Onboarding, technical support, venue optimization

**Total startup:** $485 (domain + trademark + initial stickers)
**Monthly burn:** ~$50 (scales with venues)

## Revenue Streams

**Primary:**
- **Monthly SaaS subscriptions (tiered):**
  - **Pro:** $299/month (unlimited scans, both games, 5k scans/month, custom QR)
  - **Enterprise:** Custom $999+ (3+ games, API, white-label, 50k scans, priority support)

**Secondary:**
- **Patron game plays:** $1.50 per Top Comment play (venue keeps 100%)
- **Patron songs:** $2.00 per VIBox song (venue keeps 100%)
- **Server tips:** Helcim tracking (Social gets 40%, staff gets 60%) = ~$200/month per venue
- **Special event passes:** $25–$49 (premium rounds, holidays, tournaments)
- **Sponsored rounds:** $50–$200 from breweries/distributors
- **Premium content packs:** $15–$25 per themed library
- **Pub-crawl integration:** $2–$5 per ticket with analytics
- **Enterprise analytics tier:** $200+/month for multi-location chains

**Economics:**
- Gross margins: 85%+ (infrastructure-driven)
- No COGS per game
- High-margin SaaS model with scalable content revenue
- Break-even per venue: ~5–7 days of patron spending

## Key Metrics to Track

- MRR (number of paying venues × $299)
- ARR (MRR × 12)
- Trial conversion rate (target: 70%)
- Churn rate (target: <5%)
- Average revenue per venue per month
- Engagement: scans/day, plays/day, songs/day
- Dwell time lift (target: 15–25%)
- Demo-to-trial conversion (target: 80%+)

## Scaling Plan

**Week 1–4:** Launch Top Comment MVP, 3 pilot venues
**Week 5–8:** Add VIBox, venue dashboard, trial mechanics
**Week 9–12:** 10 venue pilots, sales pipeline automation, $44k MRR target
**Month 6+:** Regional expansion (breweries, chains), new game launches, national scale
