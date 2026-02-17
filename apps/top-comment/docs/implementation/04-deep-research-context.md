# Deep Research Context Document

> **Purpose**: Provide ChatGPT Deep Research with full context about Pub Söcial (top-comment) to answer the research shopping list questions.  
> **Audience**: ChatGPT Deep Research (external to this IDE).  
> **Date**: February 11, 2026

---

## 1. Product Overview

### What is Pub Söcial?

Pub Söcial (codename: top-comment) is a **real-time, crowd-powered party game platform** designed specifically for bars, pubs, and social venues. Players join persistent "rooms" via 6-character codes, participate in timed prompt-response-vote game sessions, and engage with async interactions — all from their phones.

### Core Value Proposition

- **For venues**: Drive foot traffic, increase dwell time, create repeat visits
- **For hosts**: Easy room creation, session control, player management
- **For players**: Social gaming without app downloads, competitive leaderboards

### Key Differentiator (from blueprint)

The app's **async interaction system** (prompt → response → vote → results) is the foundation for "audience-to-audience" mechanics. The missing piece is **cross-player targeting** — enabling Player A to direct actions at Player B (challenges, reactions, rivalries).

---

## 2. Technical Architecture

### Technology Stack

| Layer | Technology | Purpose |
|-------|-------------|---------|
| Frontend | React 18 + TypeScript + Vite | UI framework |
| Backend | Supabase (Postgres + Auth + Realtime) | Database, auth, real-time |
| Deployment | Vercel (SPA) | Hosting |
| Real-time | Supabase Realtime (Postgres Changes) | WebSocket-like updates |
| State | TanStack React Query + React Context | Server + client state |
| Styling | TailwindCSS | Utility-first CSS |
| Testing | Playwright (E2E) + Vitest (unit) | Test framework |

### Data Model Summary

**Core entities** (rooms-only architecture, NO TEAMS):
- `rooms` — Room definitions with 6-char codes
- `room_memberships` — Player-room relationships (persistent across sessions)
- `top_comment_sessions` — Game sessions with 5-phase flow (lobby → answer → vote → results → ended)
- `interactions` — Async prompts/responses/votes (newer system)
- `room_messages` — Real-time chat
- `venue_accounts` — Bar owner/staff accounts

### Real-Time Architecture

Supabase Realtime channels per room:
- `room:{roomId}` — Session changes
- `room_memberships:{roomId}` — Player join/leave/kick
- `interactions:{roomId}` — Prompt/response/vote updates
- `room_chat:{roomId}` — Chat messages

### Current Limitations

- **No teams** — All player interactions are room-scoped, not team-based
- **Hub-and-spoke model** — Host → all players; no peer-to-peer targeting
- **Basic moderation** — Kick/ban only; no report/block or content filtering
- **No analytics** — Table exists but no dashboard
- **Presenter view reliability** — No auto-reconnect or offline fallback

---

## 3. Current Feature Set

### Working Features
- **Room system**: Create/join rooms, QR codes, persistent memberships
- **Session gameplay**: 5-phase timed rounds, prompt libraries (24+ themed packs), scoring
- **Async interactions**: Host sends prompts, players respond/vote, results display
- **Real-time chat**: Room-scoped messaging
- **Host controls**: Start/pause sessions, manage players, select prompts
- **Responsive design**: Mobile + desktop layouts
- **Authentication**: Anonymous + email accounts + venue accounts

### Partial/Stub Features
- **Headline Fibbage**: UI works but voting/results use mock data
- **Widget system**: Polls, Trivia, Activity Feed are UI stubs with no backend
- **Presenter view**: Exists but may lag behind room updates
- **Analytics**: `top_comment_session_analytics` table exists but no dashboard

### Legacy/Dead Code
- **Team system**: `TeamPage`, `team/` feature directory, team types still exist but are not used
- **Large components**: `RoomPage.tsx` (780 lines), `HostPage.tsx` (45K), `VIBoxJukeboxInner.tsx` (90K)

---

## 4. Competitive Context

### Blueprint Alignment Status

| Blueprint Feature | Current Status | Gap |
|---|---|---|
| QR + short code join | ✅ Implemented | None |
| Session-scoped chat | ✅ Implemented | None |
| Live reactions | ❌ Not implemented | High-value, low-complexity |
| Table-to-table challenges | ❌ Not implemented | Core differentiator |
| Audience-sourced questions | ❌ Not implemented | Foundation exists (async system) |
| Report/block system | ❌ Not implemented | Required for scaling |
| System-wide profanity filter | ⚠️ Partial (Headline Fibbage only) | Needs extension |
| Venue analytics dashboard | ❌ Stub only | Revenue unlock |
| Presenter reliability | ❌ No auto-reconnect | Venue reliability |
| PWA capabilities | ❌ No manifest | Install prompts |
| Player badges/achievements | ❌ Not implemented | Retention driver |

### Key Insight from Blueprint

Your **async interaction system** is architecturally very close to what the blueprint calls "audience-to-audience" mechanics. The prompt-response-vote loop you already have is the **exact primitive** needed for audience-sourced questions, caption contests, and social wall content.

What you're **missing** is the **cross-player targeting layer** — the ability for Player A to direct an action at Player B or a group (challenges, reactions, rivalries). Your current system is hub-and-spoke (host → all players), not peer-to-peer.

---

## 5. Target Environment

### Venue Constraints

- **Lighting**: Dim, dark environments (app is dark-themed)
- **Noise**: Loud background, audio cues must be clear
- **Connectivity**: Guest Wi-Fi, variable quality, potential drops
- **Devices**: Primarily mobile phones, some tablets/laptops
- **Session length**: 1–2 hours, multiple rounds per night
- **Player behavior**: Casual, social, alcohol may be involved

### User Personas

| Persona | Description | Needs |
|---------|-------------|-------|
| **Bar Host** | Bartender/event coordinator running games | Easy room creation, session control, player management |
| **Casual Player** | Bar patron joining for fun | Quick join, simple gameplay, social interaction |
| **Repeat Player** | Regular who plays weekly | Persistent identity, leaderboard history |
| **Venue Owner** | Bar owner tracking engagement | Analytics, revenue metrics, multi-room management |

---

## 6. Business Model

### Current State

- **No monetization** — free to use
- **No payment system** — no Stripe/billing integration
- **No sponsor surfaces** — no ad placement or sponsored content

### Intended Model (from blueprint)

- **Primary**: Venue subscription tiers (e.g., $49–199/month)
- **Secondary**: Sponsor packages (impressions, branded content)
- **Tertiary**: Optional per-event passes for smaller venues

### Revenue Dependencies

- **Analytics dashboard** is the key feature to justify venue subscriptions
- **Sponsor surfaces** require impression tracking and venue controls
- **Multi-room management** needed for venue operators

---

## 7. Implementation Roadmap Context

### Immediate Priorities (Next 2 weeks)

1. **Fix critical bugs** (string interpolation, error handling)
2. **Remove legacy team code** (routes, types, features/team/)
3. **Add quick wins** (reactions, profanity filter, PWA manifest)
4. **Implement moderation** (report/block, rate limiting)

### Medium-term (1–2 months)

1. **Cross-player interactions** (challenges, audience submissions)
2. **Presenter hardening** (auto-reconnect, caching)
3. **Venue analytics dashboard**
4. **Social features** (badges, auto-generated names)

### Long-term (3+ months)

1. **Full trivia implementation** (not covered in research list)
2. **Monetization infrastructure** (billing, sponsors)
3. **Advanced moderation** (queues, bulk actions)
4. **Offline/low-connectivity support**

---

## 8. Research Question Context

Each research question in the shopping list maps to specific implementation phases:

### High Priority (Blocks near-term work)

- **#1 Profanity filter** → Phase A2 (system-wide filtering)
- **#2 Supabase Realtime scaling** → Architecture decisions for cross-player features
- **#3 PWA iOS limitations** → Phase A3 (manifest + install prompts)
- **#4 UGC moderation requirements** → Phase B1 (report/block) + native wrapper decision
- **#5 Virtual points legality** → Phase C1 (challenges with wagers)

### Medium Priority (Informs design)

- **#6 Presenter reconnect patterns** → Phase C3 (presenter hardening)
- **#7 WCAG audit** → UI polish across all phases
- **#8 Venue Wi-Fi capacity** → Venue playbook and offline considerations
- **#9 Anti-cheat heuristics** → Future trivia implementation
- **#10 Monetization pricing** → Phase D1 (analytics) + business model
- **#11 Photo rounds** → Future feature (not in current roadmap)
- **#12 Challenge resolution** → Phase C1 (cross-player challenges)

### Low Priority (Future planning)

- **#13 Service worker strategy** → PWA enhancement (post-MVP)
- **#14 GDPR/CCPA compliance** → Scaling to new jurisdictions
- **#15 Capacitor vs RN WebView** → App store distribution decision

---

## 9. Technical Constraints

### Must-Have Constraints

- **No teams** — Only room memberships with membershipId
- **Supabase-only** — No additional backend services for MVP
- **Web-first** — PWA-capable, but native wrapper optional
- **Real-time** — All features must work with Supabase Realtime
- **Responsive** — Mobile-first, desktop compatible

### Nice-to-Have Constraints

- **Offline resilience** — Graceful degradation when connectivity drops
- **PWA install** — "Add to Home Screen" capability
- **Push notifications** — For venue reminders (iOS limitations apply)

### Anti-Constraints

- **No Firebase** — Supabase is the chosen backend
- **No teams** — Explicitly removed architecture
- **No native apps (initially)** — Web-first approach

---

## 10. Success Metrics

### Technical Metrics

- **Time-to-join** < 10 seconds (QR scan → in room)
- **Message latency** < 500ms (95th percentile)
- **Uptime** > 99.5% for real-time features
- **Bundle size** < 1MB (gzipped)

### Product Metrics

- **Room creation rate** (per venue per week)
- **Player retention** (return rate within 7 days)
- **Session completion rate** (sessions that reach 'ended' phase)
- **Cross-player engagement** (% of players who issue/accept challenges)

### Business Metrics

- **Venue conversion** (free trial → paid subscription)
- **ARPU** (average revenue per venue)
- **Sponsor CPM** (cost per thousand impressions)
- **Churn rate** (venue cancellations)

---

## 11. Open Questions for Deep Research

When answering the research shopping list, please consider:

1. **Scalability context**: What works for 10 rooms with 10 players each vs 100 rooms with 50 players each?
2. **Venue reality**: How do bar/pub environments affect technical decisions (noise, lighting, connectivity)?
3. **Regulatory landscape**: What are the specific legal requirements for UGC and virtual gambling in major markets (US, Canada, UK, EU)?
4. **Competitor benchmarks**: How do CrowdPurr, Buzztime, SpeedQuizzing, and Kahoot handle these specific challenges?
5. **Implementation effort**: For each recommendation, estimate the development effort (person-days) and risk level.

---

## 12. Contact Information

If clarification is needed on any aspect of Pub Söcial's architecture, features, or business model, please note the specific question and we can provide additional context.

---

*This context document is designed to give ChatGPT Deep Research a comprehensive understanding of the Pub Söcial platform to answer the research shopping list questions effectively.*
