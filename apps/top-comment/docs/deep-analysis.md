# Top-Comment App — Deep Analysis

> **Date**: February 11, 2026  
> **App**: `@social/top-comment` (Pub Söcial)  
> **Stack**: React 18 + TypeScript + Vite + Supabase + TailwindCSS  
> **Deployment**: Vercel (SPA with client-side routing)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Overview](#2-product-overview)
3. [Technical Architecture](#3-technical-architecture)
4. [Feature Inventory](#4-feature-inventory)
5. [Data Model & Database](#5-data-model--database)
6. [Real-Time System](#6-real-time-system)
7. [UI/UX Architecture](#7-uiux-architecture)
8. [Code Quality & Technical Debt](#8-code-quality--technical-debt)
9. [Product Requirements Document (PRD)](#9-product-requirements-document-prd)
10. [Prioritized Feature Roadmap](#10-prioritized-feature-roadmap)
11. [Risk Assessment](#11-risk-assessment)
12. [Recommendations](#12-recommendations)

---

## 1. Executive Summary

**Top-Comment** (branded as **Pub Söcial**) is a real-time, crowd-powered party game platform designed for bars, pubs, and social venues. Players join persistent **rooms** via 6-character codes, participate in timed prompt-response-vote game sessions, and compete on leaderboards. The app supports both a structured **session-based game flow** (lobby → answer → vote → results → ended) and a newer **asynchronous interaction system** (prompts, headline fibbage) that operates independently of sessions.

### Key Strengths
- **Real-time architecture** via Supabase Postgres Changes (live memberships, interactions, scores)
- **Room-based persistent model** — players join once, play multiple sessions
- **Dual game modes**: structured sessions + async interactions
- **Responsive design** with dedicated mobile and desktop layouts
- **Extensible game engine** interface (`GameEngine`, `GameRegistry`) ready for new game types
- **Rich prompt library system** with 24+ themed prompt packs

### Key Weaknesses
- **Legacy code remnants** — `TeamPage`, `team/` feature directory, and team-based references still exist in routing and domain types despite the rooms-only architecture
- **Incomplete features** — Headline Fibbage voting/results use mock data; widget system (Polls, Trivia, Activity Feed) are stubs
- **Large component files** — `RoomPage.tsx` (780 lines), `HostPage.tsx` (45K), `TeamPage.tsx` (30K) need decomposition
- **Duplicated UI patterns** — Account menu, bottom nav, and drawer patterns repeated across mobile/desktop branches
- **Missing test coverage** — Only E2E test stubs and one multi-user isolation spec exist

---

## 2. Product Overview

### Brand Identity
- **Name**: Pub Söcial
- **Tagline**: "Play with the bar, not just at the bar."
- **Value Prop**: "Join live, crowd-powered games. Vote. Score. Win. Make friends."
- **Target Venue**: Bars, pubs, social venues
- **URL**: playnow.social

### User Roles

| Role | Description | Entry Point |
|------|-------------|-------------|
| **Host** | Creates rooms, manages sessions, sends prompts, controls game flow | `/host` → creates room → `/room/:roomCode` |
| **Player** | Joins rooms, answers prompts, votes, views results | `/join` → enters code + name → `/room/:roomCode` |
| **Presenter** | Display-only view for venue screens | `/presenter/:sessionId` |
| **Venue Account** | Bar owner/staff with elevated permissions | `/venue-auth` → `venue_accounts` table |

### Authentication Model
- **Supabase Auth** with three modes:
  - **Anonymous sign-in** — auto-created for players joining games (guest mode)
  - **Email/password** — persistent accounts
  - **Venue accounts** — bar owner/staff accounts linked via `venue_accounts` table
- No automatic guest sign-in on page load — users must explicitly trigger auth

---

## 3. Technical Architecture

### 3.1 Monorepo Structure

The app is part of a pnpm/Turborepo monorepo with workspace dependencies:

| Package | Purpose |
|---------|---------|
| `@social/top-comment` | Main app (this analysis) |
| `@social/db` | Shared Supabase client factory |
| `@social/game-engine` | Shared game engine abstractions |
| `@social/game-topcomment` | Top-comment specific game logic |
| `@social/ui` | Shared UI components (Card, Toast, etc.) |

### 3.2 Frontend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3 | UI framework |
| TypeScript | 5.7 | Type safety |
| Vite | 7.1 | Build tool & dev server |
| React Router | 7.9 | Client-side routing |
| TanStack React Query | 5.90 | Server state management |
| Supabase JS | 2.47 | Backend client (auth, DB, realtime) |
| TailwindCSS | 3.4 | Utility-first styling |
| Zod | 3.24 | Schema validation |
| date-fns | 4.1 | Date utilities |
| react-qr-code | 2.0 | QR code generation for room join |
| Playwright | 1.56 | E2E testing |
| Vitest | 1.6 | Unit testing |

### 3.3 Application Layer Architecture

```
src/
├── app/                    # App shell (router, providers, layout)
├── application/            # Application-level hooks, types, utils
├── components/             # Shared presentational components
├── domain/                 # Pure business logic (types, services)
│   ├── types/              # Domain type definitions
│   └── services/           # State machine, scoring, round management
├── engine/                 # Game engine interface & registry
├── features/               # Feature modules (vertical slices)
│   ├── room/               # PRIMARY: Room-based game experience
│   ├── host/               # Host dashboard & session management
│   ├── presenter/          # Venue display view
│   ├── team/               # LEGACY: Old team-based player flow
│   ├── join/               # Room join flow
│   ├── entry/              # Landing page
│   ├── auth/               # Auth pages (player + venue)
│   ├── session/            # Session service & hooks
│   └── 404/                # Not found page
├── hooks/                  # Global hooks (useRoom, useInteractions, etc.)
├── services/               # API service layer (roomService, membershipService, interactionService)
├── shared/                 # Shared utilities, providers, prompt libraries
│   ├── providers/          # React context providers (Auth, Theme, TTS, Phase)
│   ├── hooks/              # Shared hooks (countdown, timers, TTS, etc.)
│   ├── components/         # Shared components (MobileLayout, VIBox)
│   ├── utils/              # Utility functions
│   └── *.json              # 24+ prompt library JSON files
├── supabase/               # Supabase client initialization
└── utils/                  # General utilities
```

### 3.4 Provider Stack (Dependency Order)

```
QueryClientProvider          ← TanStack React Query
  └── ThemeProvider          ← Dark-mode-only theme system
       └── AuthProvider      ← Supabase auth state
            └── CurrentPhaseProvider  ← Game phase context
                 └── TTSProvider      ← Text-to-speech
                      └── ToastProvider  ← Notification toasts
```

### 3.5 Routing Map

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `EntryPage` | Landing page with Start/Join CTAs |
| `/auth` | `PlayerAuthPage` | Email sign-in/sign-up |
| `/venue-auth` | `VenueAuthPage` | Venue account auth |
| `/host` | `HostPage` | Host dashboard (create room, manage sessions) |
| `/join` | `JoinPage` | Enter room code + player name |
| `/room/:roomCode` | `RoomPage` | **Primary game experience** (modal-based) |
| `/team/:roomCode` | `TeamPage` | Legacy player view |
| `/play` | `TeamPage` | Legacy redirect |
| `/team` | `TeamPage` | Legacy redirect |
| `/presenter/:sessionId` | `PresenterPage` | Venue display view |
| `*` | `NotFoundPage` | 404 |

---

## 4. Feature Inventory

### 4.1 Implemented & Working

#### Room System (Core)
- **Room creation** with auto-generated 6-char alphanumeric codes
- **Room joining** via code + player name (with duplicate name detection)
- **Room memberships** — persistent player records with mascot selection
- **Host controls** — kick, ban, approve/reject pending members
- **Room settings** — max players, require approval, allow anonymous, allow chat
- **Room archiving** — soft-delete rooms
- **Real-time membership sync** — live player roster via Supabase Postgres Changes

#### Session Game Flow
- **5-phase state machine**: `lobby → answer → vote → results → ended`
- **Timed phases** with configurable durations (answer, vote, results)
- **Pause/resume** functionality with elapsed time tracking
- **Multi-round support** with round groups and vote group indexing
- **Prompt library system** — 24+ themed prompt packs (bar, tech, politics, anime, etc.)
- **Two game modes**: Classic (random category) and Mashup (rotate through selected libraries)
- **Scoring engine** with leaderboard calculation and ranking
- **Session analytics** tracking (join count, answer rate, vote rate, duration)

#### Async Interaction System (Newer)
- **Prompt interactions** — host sends prompts, players respond, then vote
- **Headline Fibbage** — fill-in-the-blank headline game mode
- **Interaction lifecycle**: `active → voting → results → closed`
- **Real-time interaction sync** via Supabase subscriptions
- **Response submission** with upsert (edit your answer)
- **Vote submission** with upsert (change your vote)
- **Host controls** — advance to voting, advance to results, close interaction

#### UI/UX
- **Responsive layout** — desktop 2-column (main + sidebar) vs mobile stacked
- **Mobile bottom navigation** — Bail, Lobby, VIBox, Help, Profile
- **Floating action buttons** — Chat and Leaderboard (mobile)
- **Drawer system** — Lobby, Chat, Leaderboard History, Help (slide-up panels)
- **Desktop sidebar** — collapsible right rail with lobby, chat, leaderboard
- **Background animation** — animated visual effects
- **Dark theme** — single dark theme with CSS custom properties
- **Lazy-loaded modals** — Answer, Vote, Leaderboard, Selfie modals
- **QR code generation** for room join links
- **VIBox Jukebox** — integrated music player component (90K inner component)

#### Auth & Accounts
- **Anonymous auth** — seamless guest play
- **Email auth** — sign up / sign in with display name
- **Venue accounts** — bar owner/staff role system
- **Account menu** — profile display, sign out
- **Kick detection** — auto-redirect when membership is deleted

### 4.2 Partially Implemented / Stub

| Feature | Status | Notes |
|---------|--------|-------|
| **Headline Fibbage voting** | Mock data | `getVotingOptions()` returns hardcoded options |
| **Headline Fibbage results** | Mock data | `getHeadlineResults()` returns hardcoded results |
| **Headline vote submission** | Console log only | `submitHeadlineVote()` is a no-op |
| **Activity Feed Widget** | UI stub | Mock data, no real activity tracking |
| **Polls Widget** | UI stub | Mock data, no backend |
| **Trivia Widget** | UI stub | Mock data, no backend |
| **Room Chat Widget** | Functional | Real-time chat via `room_messages` table works |
| **VIBox Jukebox** | Large component | 90K file, unclear integration status |
| **Presenter page** | Partial | 14K file, phases exist but may lag behind room updates |
| **Session analytics** | Partial | Table exists, calculation stubs in place |
| **Text-to-Speech** | Provider exists | Google Cloud TTS dependency, unclear usage |

### 4.3 Legacy / Dead Code

| Item | Location | Notes |
|------|----------|-------|
| `TeamPage` | `features/team/` (30K) | Legacy player flow, still routed |
| `team/:roomCode` route | `router.tsx` | Should redirect to `/room/:roomCode` |
| `/play` and `/team` routes | `router.tsx` | Legacy redirects to `TeamPage` |
| `Team` type in domain | `domain.types.ts` | References `uid`, `teamName`, `team_members` |
| `useTeamRoom`, `useTeamSession` | `features/team/hooks/` | Legacy hooks |
| `useSelfieCamera` | `features/team/` (13K) | Large legacy file |
| `OldLobbyPhase` | `features/team/` | Explicitly named as old |
| Team references in `SessionStateMachine` | `domain/services/` | Uses `teamCount`, team-based validation |
| Team references in `constants.ts` | `shared/constants.ts` | "Gather your teams", "No voting for your own team" |

---

## 5. Data Model & Database

### 5.1 Supabase Tables (Confirmed)

#### Room System Tables
| Table | Purpose |
|-------|---------|
| `rooms` | Room definitions (code, host, settings, status) |
| `room_memberships` | Player-room relationships (player_name, mascot, ban status) |
| `room_messages` | Real-time chat messages per room |

#### Session Game Tables
| Table | Purpose |
|-------|---------|
| `top_comment_sessions` | Game sessions (status, rounds, settings, timing) |
| `top_comment_players` | Session participants (display_name, score) |
| `top_comment_answers` | Player answers per round/group |
| `top_comment_votes` | Player votes per round/group |
| `top_comment_banned_players` | Ban tracking per session |
| `top_comment_session_analytics` | Session metrics |

#### Interaction Tables
| Table | Purpose |
|-------|---------|
| `interactions` | Async prompts/fibbage (question, status, timing) |
| `responses` | Player responses to interactions |
| `interaction_votes` | Player votes on responses |

#### Account Tables
| Table | Purpose |
|-------|---------|
| `venue_accounts` | Bar owner/staff accounts |

### 5.2 Key Database Functions (RPC)

| Function | Purpose |
|----------|---------|
| `increment_top_comment_player_score` | Atomic score increment |
| `pause_top_comment_session_atomic` | Atomic pause/resume with timing |
| `advance_interaction_to_voting` | Transition interaction to voting phase |

### 5.3 Entity Relationships

```
rooms (1) ──── (*) room_memberships
  │                    │
  │                    └── responses (via membership_id)
  │                    └── interaction_votes (via membership_id)
  │
  ├── (*) interactions
  │        ├── (*) responses
  │        └── (*) interaction_votes
  │
  ├── (*) room_messages
  │
  └── (*) top_comment_sessions
           ├── (*) top_comment_players
           │        ├── (*) top_comment_answers
           │        └── (*) top_comment_votes
           ├── (*) top_comment_banned_players
           └── (1) top_comment_session_analytics
```

---

## 6. Real-Time System

The app uses **Supabase Realtime** (Postgres Changes) extensively:

| Channel | Table | Events | Purpose |
|---------|-------|--------|---------|
| `room:{roomId}` | `rooms` | UPDATE | Session changes, room settings |
| `room_memberships:{roomId}` | `room_memberships` | INSERT, UPDATE, DELETE | Player join/leave/kick |
| `interactions:{roomId}` | `interactions` | * | New prompts, status changes |
| `interactions:{roomId}` | `responses` | INSERT | Response count updates |
| `room_chat:{roomId}` | `room_messages` | INSERT | New chat messages |
| `leaderboard:{sessionId}` | `top_comment_players` | * | Score changes |

### Real-Time Design Patterns
- **Optimistic updates** — interactions and responses update local state immediately
- **Silent refresh** — room data refreshes without loading spinners on realtime events
- **Kick detection** — membership DELETE events trigger redirect for kicked players
- **Channel cleanup** — all subscriptions properly unsubscribe on component unmount

---

## 7. UI/UX Architecture

### 7.1 Design System

- **Theme**: Dark-mode only (`ThemeProvider` hardcodes `isDark = true`)
- **Color palette**: Slate base, cyan/pink/fuchsia accents, amber for leaderboard
- **Brand color**: Magenta (`#ff00ff`) for "Pub Söcial" branding
- **CSS approach**: TailwindCSS utilities + CSS custom properties via ThemeProvider
- **Component library**: Mix of `@social/ui` shared components and local components
- **Chaos theme**: Custom CSS variables for game-specific styling (orbs, prompts, answers, CTAs)

### 7.2 Layout Patterns

#### Desktop (≥768px)
- Fixed top navbar with logo, account menu
- 2-column layout: main content + collapsible right sidebar
- Sidebar contains: lobby panel, chat panel, leaderboard history
- Header with room code, action buttons (Bail, VIBox, Help, Profile, Leave)

#### Mobile (<768px)
- No top navbar (hidden via `hidden md:block`)
- Full-width stacked layout
- Fixed bottom navigation bar (Bail, Lobby, VIBox, Help, Profile)
- Floating action buttons (Chat, Leaderboard) in bottom-right
- Slide-up drawers for Lobby, Chat, Leaderboard, Help

### 7.3 Modal System
- **Lazy-loaded** via React `lazy()` + `Suspense`
- **Phase modals**: AnswerModal, VoteModal (triggered by game phase)
- **Ended modals**: LeaderboardModal, SelfieModal (post-game)
- **Interaction modals**: SendPromptModal, RespondModal, VoteModal, ResultsModal, HeadlineRespondModal, HeadlineVoteModal, HeadlineResultsModal, SendHeadlineModal, ResponsesDrawer

### 7.4 State Management

| Layer | Tool | Scope |
|-------|------|-------|
| Server state | TanStack React Query | API data caching |
| Auth state | React Context (`AuthProvider`) | User session |
| Room page state | `useReducer` + Context (`RoomPageContext`) | Modal state, submissions, errors |
| Room data | Custom hook (`useRoom`) | Room + memberships + realtime |
| Interactions | Custom hook (`useInteractions`) | Interaction CRUD + realtime |
| Chat | Custom hook (`useRoomChat`) | Messages + realtime |
| Leaderboard | Custom hook (`useRoomLeaderboard`) | Current + past session scores |
| Phase management | Custom hook (`usePhaseManager`) | Phase transitions, modal control |
| Local UI state | `useState` | Drawer visibility, form state |

---

## 8. Code Quality & Technical Debt

### 8.1 Strengths
- **Clean domain layer** — pure types and services with no React dependencies
- **Well-structured service layer** — `roomService`, `roomMembershipService`, `interactionService` with clear API boundaries
- **Consistent error handling** — try/catch with user-friendly error messages
- **Real-time architecture** — proper channel management with cleanup
- **Type safety** — comprehensive TypeScript types for all domain entities
- **Modular hook design** — each concern has its own hook (`useRoom`, `useInteractions`, `useRoomChat`, etc.)

### 8.2 Technical Debt

#### Critical
1. **Legacy team code still routed** — `TeamPage` (30K), `team/:roomCode`, `/play`, `/team` routes are live but should be removed or redirected
2. **Team references in domain types** — `Team` interface, `teamName`, `teamCount` in `SessionStateMachine` contradict rooms-only architecture
3. **Incomplete Headline Fibbage** — voting and results return mock data; `submitHeadlineVote` is a no-op
4. **Missing string interpolation** — `roomService.ts` lines 333 and 355 have `error.message}` instead of `${error.message}`

#### High
5. **Massive component files** — `HostPage.tsx` (45K), `RoomPage.tsx` (780 lines), `TeamPage.tsx` (30K), `VIBoxJukeboxInner.tsx` (90K)
6. **Duplicated UI code** — Account menu rendered 3 times in `RoomPage.tsx` (mobile MobileLayout, mobile bottom nav, desktop header)
7. **Duplicated bottom nav** — Bottom navigation rendered twice in `RoomPage.tsx` (once in MobileLayout, once in desktop branch for mobile)
8. **`any` type usage** — Multiple `as any` casts in services and domain types

#### Medium
9. **Inconsistent naming** — `teamName` in `RoomSessionSummary`, `teamIds` in `RoundGroup`, `fooledTeams` in `HeadlineResults`
10. **Empty files** — `useAudioPlayback.ts`, `useRealtimeQueue.ts`, `VIBoxJukebox.tsx` (shared) are 0 bytes
11. **Console logging in production code** — Emoji-prefixed debug logs throughout services
12. **No error boundaries** — Auth hook wrapped in try/catch in `RootLayout` instead of proper error boundary
13. **Widget stubs** — ActivityFeed, Polls, Trivia widgets have UI but no backend

#### Low
14. **README references Firebase** — `.env.local` instructions mention `VITE_FIREBASE_*` values (outdated)
15. **Unused imports/exports** — `player/` feature directory is empty
16. **Test coverage gaps** — Only `multi-user-isolation.spec.ts` and test stubs exist

---

## 9. Product Requirements Document (PRD)

### 9.1 Vision Statement

Pub Söcial is a real-time social gaming platform that transforms bar and pub experiences by enabling crowd-powered interactive games. Players join persistent rooms, compete in timed prompt-response-vote rounds, and engage with async interactions — all from their phones.

### 9.2 Target Users

| Persona | Description | Key Needs |
|---------|-------------|-----------|
| **Bar Host** | Bartender or event coordinator running games | Easy room creation, session control, player management, prompt selection |
| **Casual Player** | Bar patron joining for fun | Quick join (no account required), simple gameplay, social interaction |
| **Repeat Player** | Regular who plays weekly | Persistent identity, leaderboard history, favorite rooms |
| **Venue Owner** | Bar owner tracking engagement | Analytics, venue branding, multi-room management |

### 9.3 Core Requirements

#### R1: Room Management
- **R1.1** Hosts can create rooms with a unique 6-character code
- **R1.2** Players can join rooms by entering the code and a display name
- **R1.3** Rooms persist across multiple game sessions
- **R1.4** Hosts can kick, ban, approve, and reject players
- **R1.5** Rooms display a QR code for easy joining
- **R1.6** Room settings are configurable (max players, approval required, anonymous allowed)

#### R2: Session Gameplay
- **R2.1** Hosts can start timed game sessions within a room
- **R2.2** Sessions follow a 5-phase flow: lobby → answer → vote → results → ended
- **R2.3** Each phase has configurable time limits
- **R2.4** Sessions support multiple rounds with prompt groups
- **R2.5** Players submit text answers to prompts
- **R2.6** Players vote on other players' answers (cannot vote for own)
- **R2.7** Scores are calculated and displayed on a leaderboard
- **R2.8** Hosts can pause/resume sessions
- **R2.9** Sessions support Classic and Mashup game modes

#### R3: Async Interactions
- **R3.1** Hosts can send prompts outside of structured sessions
- **R3.2** Players can respond to prompts at their own pace
- **R3.3** Interactions support a voting phase
- **R3.4** Results are displayed with vote counts
- **R3.5** Headline Fibbage mode: fill-in-the-blank headline game

#### R4: Social Features
- **R4.1** Real-time room chat
- **R4.2** Player roster with live join/leave updates
- **R4.3** Leaderboard history across sessions
- **R4.4** Post-game selfie/celebration screen

#### R5: Authentication
- **R5.1** Anonymous play without account creation
- **R5.2** Optional email account for persistent identity
- **R5.3** Venue accounts for bar owners/staff

#### R6: Presentation
- **R6.1** Dedicated presenter view for venue screens
- **R6.2** Responsive design for mobile and desktop
- **R6.3** Dark theme optimized for bar/pub environments

---

## 10. Prioritized Feature Roadmap

### Tier 1: Critical (Ship-Blocking)

| # | Feature | Effort | Impact | Description |
|---|---------|--------|--------|-------------|
| 1 | **Remove legacy team routes** | S | High | Remove `/team/:roomCode`, `/play`, `/team` routes; redirect to `/room/:roomCode` |
| 2 | **Fix string interpolation bugs** | XS | High | Fix `error.message}` → `${error.message}` in `roomService.ts` lines 333, 355 |
| 3 | **Complete Headline Fibbage backend** | M | High | Replace mock data in `getVotingOptions`, `getHeadlineResults`, `submitHeadlineVote` with real Supabase queries |
| 4 | **Clean team references from domain** | M | High | Remove `Team` type usage, rename `teamName` → `playerName` in domain types, update `SessionStateMachine` |

### Tier 2: High Priority (Next Sprint)

| # | Feature | Effort | Impact | Description |
|---|---------|--------|--------|-------------|
| 5 | **Decompose large components** | L | High | Break `RoomPage.tsx` into smaller components; extract account menu, bottom nav into shared components |
| 6 | **Implement Polls system** | M | High | Backend tables + real-time for in-room polls (host creates, players vote) |
| 7 | **Implement Trivia system** | M | High | Backend tables + real-time for trivia questions with scoring |
| 8 | **Activity Feed** | M | Medium | Track and display room events (joins, answers, votes, phase changes) |
| 9 | **Error boundaries** | S | Medium | Add React error boundaries around route components and feature sections |
| 10 | **Comprehensive test suite** | L | Medium | Unit tests for domain services, integration tests for hooks, E2E for core flows |

### Tier 3: Medium Priority (Next Month)

| # | Feature | Effort | Impact | Description |
|---|---------|--------|--------|-------------|
| 11 | **Venue analytics dashboard** | L | High | Session history, player engagement metrics, peak times, popular prompts |
| 12 | **Custom prompt creation** | M | Medium | Allow hosts to create and save custom prompt libraries |
| 13 | **Player profiles** | M | Medium | Persistent player stats, game history, achievements |
| 14 | **Room favorites/bookmarks** | S | Medium | Players can save rooms they frequent |
| 15 | **Push notifications** | M | Medium | Notify players when a new session starts in their room |
| 16 | **Improved presenter view** | M | Medium | Auto-sync with room state, animated transitions, venue branding |
| 17 | **Sound effects & haptics** | S | Low | Audio feedback for phase changes, votes, wins; vibration on mobile |

### Tier 4: Future / Nice-to-Have

| # | Feature | Effort | Impact | Description |
|---|---------|--------|--------|-------------|
| 18 | **Multi-room management** | L | High | Venue owners manage multiple rooms from a single dashboard |
| 19 | **Tournament mode** | L | Medium | Multi-session tournaments with brackets and cumulative scoring |
| 20 | **Image/GIF responses** | M | Medium | Allow image uploads or GIF selection as answers |
| 21 | **Audience reactions** | S | Low | Real-time emoji reactions during results phase |
| 22 | **AI-generated prompts** | M | Medium | LLM-powered prompt generation based on venue/theme |
| 23 | **Drink ordering integration** | L | Medium | Partner with POS systems for in-app drink ordering |
| 24 | **Spotify/music integration** | M | Low | Integrate VIBox with Spotify for venue music control |
| 25 | **Localization/i18n** | L | Low | Multi-language support |
| 26 | **PWA / offline support** | M | Low | Install as app, basic offline functionality |
| 27 | **Accessibility audit** | M | Medium | WCAG compliance, screen reader support, keyboard navigation |

---

## 11. Risk Assessment

### Technical Risks

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| **Supabase Realtime limits** at scale (100+ concurrent users per room) | High | Medium | Load test with realistic concurrency; consider Supabase Realtime quotas; implement polling fallback |
| **Large bundle size** from 24+ prompt JSON files + VIBox (90K) | Medium | High | Code-split prompt libraries; lazy-load VIBox; analyze bundle with `vite-bundle-visualizer` |
| **State desync** between optimistic updates and server state | Medium | Medium | Add reconciliation logic; use React Query's `onSettled` for refetch; add conflict resolution |
| **Anonymous user session loss** (browser clear = new identity) | Medium | High | Prompt users to create accounts; implement session recovery via room code + name matching |
| **No rate limiting** on Supabase direct calls | High | Medium | Add RLS policies; implement client-side throttling; consider edge functions for sensitive operations |

### Product Risks

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| **Low player retention** without persistent identity | High | Medium | Incentivize account creation; show stats/history for logged-in users |
| **Host abandonment** mid-session | Medium | High | Auto-end sessions after inactivity; allow host transfer |
| **Inappropriate content** in player responses | High | Medium | Implement profanity filter (already in Headline Fibbage settings); add report mechanism |
| **Venue adoption friction** | Medium | Medium | Simplify onboarding; provide venue-specific branding options |

---

## 12. Recommendations

### Immediate Actions (This Week)

1. **Fix the two string interpolation bugs** in `roomService.ts` — these will cause confusing error messages in production
2. **Remove or redirect legacy team routes** — having both `/team/:roomCode` and `/room/:roomCode` active creates confusion
3. **Clean up empty files** — `useAudioPlayback.ts`, `useRealtimeQueue.ts`, empty `player/` directory

### Short-Term (Next 2 Weeks)

4. **Complete Headline Fibbage** — this is a differentiated feature that's 80% done; finishing the backend queries would make it fully functional
5. **Extract shared UI components** — account menu, bottom nav, drawer patterns should be single components used in both mobile/desktop
6. **Add error boundaries** — the try/catch in `RootLayout` is fragile; proper error boundaries prevent white-screen crashes
7. **Remove console.log debug statements** or gate them behind a debug flag

### Medium-Term (Next Month)

8. **Implement the widget system** — Polls and Trivia are the highest-impact additions for venue engagement
9. **Build venue analytics** — this is the key value proposition for venue owners who will drive adoption
10. **Add comprehensive tests** — prioritize domain services (`SessionStateMachine`, `LeaderboardCalculator`) and critical hooks (`useRoom`, `useInteractions`)

### Architecture Recommendations

11. **Adopt a consistent naming convention** — replace all `team*` references with `player*` or `member*` throughout the codebase
12. **Introduce a service abstraction layer** — current services call Supabase directly; an abstraction would enable easier testing and potential backend migration
13. **Consider server-side validation** — critical operations (score updates, phase transitions) should use Supabase Edge Functions or RPC calls rather than client-side logic with RLS
14. **Implement proper logging** — replace emoji console.logs with a structured logger that can be disabled in production

---

## Appendix A: File Size Analysis (Largest Files)

| File | Size | Notes |
|------|------|-------|
| `VIBoxJukeboxInner.tsx` | 90,049 bytes | Music player — needs decomposition |
| `HostPage.tsx` | 45,242 bytes | Host dashboard — needs decomposition |
| `RoomPage.tsx` | 33,210 bytes | Primary game view — needs decomposition |
| `TeamPage.tsx` | 30,572 bytes | Legacy — should be removed |
| `index.css` | 21,416 bytes | Global styles |
| `sessionService.ts` | 20,514 bytes | Session API layer |
| `InteractionSection.tsx` | 16,703 bytes | Interaction cards + modals |
| `SelfieModal.tsx` | 16,449 bytes | Post-game selfie |
| `PROMPT_WRITING_GUIDE.md` | 15,450 bytes | Documentation |
| `roomMembershipService.ts` | 15,054 bytes | Membership API layer |
| `PresenterPage.tsx` | 14,706 bytes | Venue display |
| `useSelfieCamera.ts` | 13,142 bytes | Legacy camera hook |
| `useRoom.ts` | 11,785 bytes | Room state + realtime |
| `HeadlineFibbageCard.tsx` | 10,869 bytes | Fibbage interaction card |
| `VoteModal.tsx` (room) | 10,672 bytes | Voting modal |
| `interactionService.ts` | 10,246 bytes | Interaction API layer |
| `roomService.ts` | 10,009 bytes | Room API layer |
| `RootLayout.tsx` | 10,125 bytes | App shell layout |

## Appendix B: Prompt Library Inventory

| Library | File | Theme |
|---------|------|-------|
| Classic | `prompts.json` | General party prompts |
| Bar | `barPrompts.json` | Bar/pub themed |
| Basic | `basicprompts.json` | Simple/clean prompts |
| Halloween | `halloweenPrompts.json` | Spooky themed |
| Selfie | `selfiePrompts.json` | Photo-based prompts |
| Victoria | `victoriaPrompts.json` | Victoria, BC themed |
| Dangerfield | `dangerfieldPrompts.json` | Comedy club themed |
| Medieval | `medievalPrompts.json` | Medieval themed |
| Anime | `animePrompts.json` | Anime/manga themed |
| Politics | `politicsPrompts.json` | Political humor |
| Sci-Fi | `scifiPrompts.json` | Science fiction themed |
| Pop Culture | `popCulturePrompts.json` | Pop culture references |
| Cinema | `cinemaPrompts.json` | Movie themed |
| Canucks | `canucksPrompts.json` | Vancouver Canucks themed |
| BC | `bcPrompts.json` | British Columbia themed |
| Tech | `techPrompts.json` | Technology themed |
| Internet Culture | `internetCulturePrompts.json` | Memes/internet themed |
| Dating App | `datingAppPrompts.json` | Dating app themed |
| Remote Work | `remoteWorkPrompts.json` | WFH themed |
| Adulting | `adultingPrompts.json` | Adult life humor |
| Group Chat | `groupChatPrompts.json` | Group chat themed |
| Streaming | `streamingPrompts.json` | Streaming/content themed |
| Climate Anxiety | `climateAnxietyPrompts.json` | Climate humor |
| Fictional Worlds | `fictionalWorldsPrompts.json` | Fantasy/fiction themed |

## Appendix C: Supabase Realtime Channel Map

```
Room Join Flow:
  Player enters code → joinRoom() → INSERT room_memberships
    → channel `room_memberships:{roomId}` fires INSERT
    → all clients in room refresh member list

Kick Flow:
  Host clicks kick → kickMember() → DELETE room_memberships
    → channel `room_memberships:{roomId}` fires DELETE
    → kicked player's useKickDetection detects missing membership → redirect

Interaction Flow:
  Host sends prompt → createInteraction() → INSERT interactions
    → channel `interactions:{roomId}` fires INSERT
    → all clients refresh interaction list

  Player responds → submitResponse() → UPSERT responses
    → channel `interactions:{roomId}` (responses INSERT) fires
    → all clients refresh (response_count updated via trigger)

  Host advances to voting → advanceToVoting() → RPC call
    → channel `interactions:{roomId}` fires UPDATE
    → all clients see voting phase

Chat Flow:
  Player sends message → INSERT room_messages
    → channel `room_chat:{roomId}` fires INSERT
    → all clients append message to list
```
