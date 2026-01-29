# Architecture & Migration Guide

## Overview

This document consolidates the architecture evolution and migration history of the Social Game Engine platform, from its initial Firebase-based implementation to the current Supabase-powered Turborepo monorepo.

## Current Architecture (January 2026)

### 🏗️ Turborepo Monorepo Structure

```
social/
├── apps/
│   ├── web/              # Main site with subdomain routing
│   ├── event-platform/   # Live event hosting platform  
│   ├── dashboard/        # Venue analytics dashboard
│   ├── vibox/           # VIBox 24/7 Jukebox
│   └── topcomment-247/  # Facebook wall UI (deprecated)
├── packages/
│   ├── ui/              # Shared React components
│   ├── db/              # Supabase client + queries
│   ├── ai/              # OpenAI + Suno integrations
│   ├── payments/        # Helcim + Stripe integrations
│   └── game-engine/     # Core game orchestration
└── supabase/
    ├── migrations/      # Database migrations
    ├── functions/       # Edge Functions
    └── types/          # Generated TypeScript types
```

### 🎮 Game Engine Architecture

**Three Core Games:**
- **Top Comment** (✅ Complete) - Twitter-parody social voting game
- **VIBox** (✅ Complete) - AI jukebox powered by Suno API
- **Jeopardy Mode** (🚧 In Progress) - Strategic category selection game

**Two Play Modes:**
- **Event Mode**: Host-controlled multiplayer sessions with QR codes
- **Patron Mode**: Self-service solo play for anytime engagement

### 🗄️ Supabase Backend

**Database Schema:**
- `venues` - Venue management and settings
- `sessions` - Game session tracking
- `rounds` - Game round management
- `entries` - Player submissions and votes
- `venues_stats` - Analytics and revenue tracking

**Edge Functions (10 total):**
- Session management (create, join, start, advance, end)
- Gameplay (answers, votes, analytics)
- Authentication and validation

## Migration History

### ✅ Phase 1: Foundation (Completed)
- **Turborepo Setup**: Monorepo structure with pnpm workspace
- **Package Creation**: All shared packages established
- **Supabase Migration**: Complete database schema with RLS policies

### ✅ Phase 2: Implementation (Completed)
- **UI Package**: Shared React components extracted
- **DB Package**: Supabase client and queries
- **AI Package**: OpenAI moderation + Suno integration
- **Payments Package**: Helcim + Stripe integrations

### ✅ Phase 3: Apps Migration (Completed)
- **Event Platform**: Universal event host from Firebase client
- **Web App**: Landing page + admin panel
- **VIBox App**: AI jukebox PWA
- **Dashboard App**: Venue analytics dashboard

### ✅ Phase 4: Backend Migration (Completed)
- **Firebase → Supabase**: Full backend migration
- **Edge Functions**: 10 production-ready functions
- **Real-time Subscriptions**: Live game updates

## Key Improvements

### From Firebase to Supabase

| Aspect | Firebase | Supabase |
|--------|----------|----------|
| Database | Firestore | PostgreSQL |
| Auth | Firebase Auth | Supabase Auth |
| Functions | Cloud Functions | Edge Functions |
| Real-time | Firestore Real-time | Supabase Realtime |
| Types | Manual | Auto-generated |
| Cost | Higher usage-based | Lower fixed cost |

### Architecture Benefits

- **Modular Design**: Shared packages reduce code duplication
- **Type Safety**: End-to-end TypeScript with auto-generated types
- **Real-time**: Sub-100ms updates for live gameplay
- **Scalability**: Multi-game engine supports rapid feature launches
- **Analytics**: Comprehensive venue and player tracking

## Deployment Architecture

### Vercel Apps

1. **web** - Main site (`playnow.social`, `pub.playnow.social`)
2. **event-platform** - Live events (`events.playnow.social`)
3. **dashboard** - Venue analytics (`dashboard.playnow.social`)
4. **vibox** - AI jukebox (`vibox.playnow.social`)

### Supabase Services

- **Database**: PostgreSQL with real-time subscriptions
- **Auth**: JWT-based authentication
- **Edge Functions**: Serverless backend logic
- **Storage**: File uploads and static assets

## Current Status

### ✅ Completed Features
- Three-game platform (Top Comment, VIBox, Jeopardy Mode)
- Real-time multiplayer gameplay
- Venue analytics dashboard
- Payment processing (Helcim/Stripe)
- AI integrations (OpenAI moderation, Suno music)
- Mobile-responsive PWAs

### 🚧 In Progress
- Jeopardy Mode category grid implementation
- Enhanced analytics and dwell time tracking
- Enterprise features for multi-venue chains

### 📋 Planned
- Advanced content marketplace
- City-wide tournaments and leaderboards
- API access for third-party integrations

## Technical Specifications

### Performance
- **Response Time**: <100ms for database queries
- **Real-time Latency**: <50ms for game updates
- **Uptime**: 99.8% target
- **Concurrent Players**: 100+ per venue

### Security
- **Row Level Security**: All database tables
- **JWT Authentication**: Secure token-based auth
- **Content Moderation**: OpenAI automated filtering
- **Payment Security**: PCI-compliant processing

### Scalability
- **Multi-game Engine**: Easy addition of new games
- **Shared Components**: Consistent UI across apps
- **Database Optimization**: Indexed for high concurrency
- **Edge Functions**: Auto-scaling backend

---

*Last updated: January 2026*
