# Metrics and Definitions – Social Game Engine

## Key Business Metrics

### Revenue Metrics

**MRR (Monthly Recurring Revenue)**
- Calculation: Number of paying venues × $299
- Example: 10 venues = $2,990 MRR
- Tracked weekly and reported to team

**ARR (Annual Recurring Revenue)**
- Calculation: MRR × 12
- Example: 10 venues = $35,880 ARR

**Patron Revenue**
- Top Comment: $1.50 per play
- VIBox: $2.00 per play (covers Suno cost)
- Venue keeps 100% during trial
- Venue keeps 100% in paid plan

**Server Tips Revenue**
- Helcim tip tracking per shift
- Social gets 40% of tips
- Venue staff gets 60% of tips
- Example: $100 in tips = $40 to Social, $60 to staff

### Venue Metrics

**Active Venues**
- Definition: `plan_status = 'active'` with current paid month
- Used for MRR calculation

**Trial Venues**
- Definition: `plan_status = 'trial'` within 14-day window
- Tracked separately for conversion reporting

**Churn Rate**
- Calculation: Venues moving from `active` → `canceled` / starting active venues
- Target: <5% monthly churn

**Trial Conversion Rate**
- Calculation: Venues moving from `trial` → `active` / total trials
- Target: 70%

### Engagement Metrics

**Per-Venue Stats (Tracked Daily):**
- `scansThisMonth` - Total QR scans
- `revenueThisMonth` - Total patron revenue
- `songsThisMonth` - Total VIBox songs generated
- `songsThisTrial` - Songs generated during trial window
- `revenueThisTrial` - Revenue during trial window
- `topCommentPlays` - Total Top Comment games played

**City-Level Stats:**
- Total active venues
- Total MRR
- Average revenue per venue per month
- Trial conversion rate trend
- Churn rate trend

### Growth Metrics

**Demo → Trial Conversion**
- Target: 80%+
- Tracked: Number of demos vs. trials started

**Trial → Paid Conversion**
- Target: 70%+
- Tracked: Number of trials vs. paid venues

**Days to Close**
- Average time from demo to paid plan
- Target: 10–14 days

**Customer Acquisition Cost (CAC)**
- Calculation: Sales effort / new revenue
- Early stage: Community-driven (low CAC)

## Per-Venue Financial Model

### Trial Period Revenue (14 days)

Assuming **40 Top Comment plays + 20 VIBox plays per night**:

- Top Comment: 40 × $1.50 × 14 days = **$840**
- VIBox: 20 × $2.00 × 14 days = **$560**
- **Total trial revenue: ~$1,400 patron spend**

### Post-Upgrade Monthly (Pro Plan)

- Venue subscription: **$299** (paid by venue to Social)
- Patron revenue: 40-50 scans/plays per night = ~**$750/month**
- Server tips: ~**$45/shift** (Social gets 40% = ~**$200/month**)

**Venue ROI:** Pays $299 to make $750+ in revenue ✅

## Dashboard KPIs

### Venue Staff Dashboard
- Scans/day
- Revenue/hour
- Trial days remaining (countdown)
- Top Comment games played
- VIBox songs in library
- Current month revenue vs. trial revenue

### Internal Sales Dashboard
- All venues (active, trial, canceled)
- Trial status and conversion probability
- Revenue per venue
- Churn risks (low usage venues)
- Top performers (for case studies)

### Admin Analytics
- Total MRR (green for growth)
- Active venues count
- Trial conversion rate
- Average revenue per venue
- Weekly growth rate

## Data Export Standards

**CSV Export Format (Venue Reconciliation):**
- Date, Game Type, Scans, Revenue, Server Tips, Notes

**Monthly Report:**
- MRR, ARR, Active Venues, Trial Venues, Churn Rate
- Top 5 venues by revenue
- Conversion metrics
- Content usage breakdown

## Tracking Infrastructure

**Database Location:**
- Supabase table: `venues_stats` (updated daily)
- Per-venue fields tracked: scans, revenue, songs, trials

**Reporting Tools:**
- Internal: Google Sheets + Supabase queries
- Venue: In-app dashboard (real-time)
- Sales: Custom CRM (trial → paid tracking)

**Frequency:**
- Live: Top Comment leaderboards, VIBox queue
- Daily: Venue stats, scans, revenue
- Weekly: MRR, conversion rates, churn
- Monthly: Full business review
