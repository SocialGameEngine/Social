# Social for Discord — MVP UX & Architecture Report

## 1. Purpose of This Report
This document captures the core product, UX, and technical ideas discussed for adapting **Social** (originally designed for bars/venues) into a **Discord-native community engagement product** that can outcompete existing bots and apps.

The goal is to define:
- The product gap
- The optimal Discord user interface
- The correct technical model (OAuth vs interactions)
- A focused MVP scope that maximizes engagement with minimal friction

---

## 2. The Market Gap

Most Discord engagement tools fall into one of three categories:

1. **Instant engagement bots** (polls, XP, memes)
   - Low creativity
   - No payoff moment
   - Engagement feels disposable

2. **Live-only party games** (Jackbox, Discord Activities)
   - Require everyone to be present at the same time
   - Voice-first
   - No persistent progress or history

3. **Heavy admin tools** (moderation, analytics)
   - Not designed for play or creativity

### Missing Category
There is no strong solution for:

> **Asynchronous, creative, social competition**

Where users can:
- Participate on their own time
- Submit creative responses
- Vote later
- See shared results
- Build lightweight progress over time

This is the exact gap that Social fills.

---

## 3. Core Product Loop (MVP)

The entire product should be built around a single, repeatable loop:

### 3.1 Prompt Drop
- One or more prompts posted on a schedule
- Prompt remains open for 12–24 hours
- Posted as a Discord embed

Example:
> "Worst thing to say in a job interview"

---

### 3.2 Private Submission Phase
- Users click a **Submit Answer** button
- A Discord modal opens
- Users enter text privately
- No answers are visible yet

Benefits:
- Prevents copying
- Reduces spam
- Encourages originality

---

### 3.3 Reveal + Voting Phase
- All submitted answers are revealed at once
- Answers are anonymous
- Voting runs for a fixed time window
- Voting uses buttons, not reactions

---

### 3.4 Results + Feedback
- Winner and top answers announced
- Fun social copy (not ranked or sweaty)
- Optional light stats (streaks, participation)

This loop alone is sufficient to outperform most existing bots.

---

## 4. Discord User Interface Design

### 4.1 Primary UI Components

The best Discord interface consists of:

- **Message embeds** (display)
- **Buttons** (actions)
- **Modals** (text input)
- **Ephemeral messages** (private feedback)

No other UI elements are required.

---

### 4.2 What Embeds Can and Cannot Do

Embeds:
- Can display text, fields, images
- Can include buttons
- **Cannot** include text input boxes

Therefore, all text input must happen via modals.

---

### 4.3 Correct Interaction Pattern

**Embed → Button → Modal → Ephemeral confirmation**

This is the native Discord pattern used by:
- Ticket bots
- Feedback systems
- Reports
- High-quality Discord apps

It is also the best possible UX for Social.

---

### 4.4 UX Principles

- Mobile-first
- Minimal text
- No commands for gameplay
- No chat spam
- Buttons over reactions
- Clear timing indicators

The product should feel like the *server itself* is asking the question, not a bot demanding attention.

---

## 5. Authentication & Identity Model

### 5.1 OAuth (Admin Only)

OAuth should be used **only** for:
- Connecting a Discord server to the web dashboard
- Verifying admins
- Selecting channels
- Managing schedules and settings

This happens once during setup.

---

### 5.2 No OAuth for Players

Players should **never** be redirected to a login page.

For all gameplay actions (submit, vote, view stats):
- Discord interactions provide `user.id` automatically
- Interactions are signed and trusted
- Identity is guaranteed by Discord

This removes friction entirely.

---

## 6. Admin Web Dashboard (Strategic Advantage)

### 6.1 Why a Web Dashboard is Critical

Discord is not suitable for:
- Configuration
- Scheduling
- Analytics
- Prompt management

A web dashboard:
- Matches the existing bar/venue architecture
- Reduces Discord UX complexity
- Enables monetization
- Keeps Social platform-agnostic

---

### 6.2 Dashboard Responsibilities

The web dashboard should handle:
- Server connection (OAuth)
- Channel selection
- Prompt packs
- Scheduling rules
- Mode configuration
- Analytics and history

Discord should handle **participation only**.

---

## 7. MVP Feature Scope

### 7.1 Must-Have
- Scheduled prompt posting
- Private submissions via modal
- Timed reveal
- Button-based voting
- Results announcement
- Basic per-user stats

### 7.2 Explicitly Not MVP
- AI prompt generation
- Cross-server leaderboards
- Advanced ranking systems
- Web participation UI
- Monetization features

Keeping the MVP narrow increases speed and adoption.

---

## 8. Competitive Advantages

Social differentiates by:
- Asynchronous play
- Creative input (not multiple choice)
- Fair voting
- Persistent but lightweight progress
- Zero-friction Discord-native UX

Compared to Jackbox:
- No live coordination required

Compared to poll bots:
- Creativity and reveal moments

Compared to streamer communities:
- Actual participation and tracking

---

## 9. Positioning

Social should not be framed as:
- A bot
- A Jackbox clone

It should be positioned as:

> **Daily social rounds for Discord communities**

or

> **Async party games for Discord servers**

This framing makes it useful across:
- Bars
- Streamer communities
- Fandoms
- IRL venues
- Quiet or time-zone-split servers

---

## 10. Summary

Social’s success on Discord depends on:
- Embracing Discord-native interaction patterns
- Keeping gameplay entirely inside Discord
- Moving admin complexity to the web
- Focusing on a single, powerful engagement loop

The existing bar-focused design is not a liability — it is the foundation that makes this product viable on Discord.

