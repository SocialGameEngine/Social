# Implementation Documents — Master Index

> **Date**: February 11, 2026  
> **App**: Pub Söcial (top-comment)  
> **Source**: Deep Analysis + Competitive Blueprint Comparison

---

## Document Map

### 1. Bugs & Refactoring (`01-bugs-and-refactoring.md`)

Fixes bugs, removes legacy team code, decomposes large components, adds type safety and tests.

| Phase | Scope | Effort | Risk |
|-------|-------|--------|------|
| **Phase 1** | Critical bug fixes (string interpolation, error boundary) | Day 1 | Low |
| **Phase 2** | Legacy team code removal (routes, types, features/team/) | Day 2–3 | **High** — JoinForm extraction |
| **Phase 3** | Component decomposition (RoomPage, shared UI) | Day 4–6 | Medium |
| **Phase 4** | Type safety (`any` removal, debug logging, README) | Day 7–8 | Low |
| **Phase 5** | Test foundation (unit, integration, E2E smoke) | Day 9–10 | Low |

### 2. Blueprint Features

Split into four sub-documents by theme and dependency order:

#### 2a. Quick Wins (`02a-blueprint-quick-wins.md`)

Low-effort, high-impact features that can ship independently.

| Phase | Feature | Effort | Blueprint Importance |
|-------|---------|--------|---------------------|
| **A1** | Live reactions (emoji bursts) | 2–3 days | 1 |
| **A2** | System-wide profanity filtering | 1–2 days | 2 |
| **A3** | PWA manifest + install prompts | 1 day | 1 |
| **A4** | Host keyboard shortcuts | 0.5 day | 1 |

#### 2b. Moderation & Safety (`02b-blueprint-moderation-and-safety.md`)

Report/block, rate limiting, and host moderation tools.

| Phase | Feature | Effort | Blueprint Importance |
|-------|---------|--------|---------------------|
| **B1** | Report & block system | 3–4 days | 1 |
| **B2** | Rate limiting (client + server) | 1–2 days | 1 |
| **B3** | Host moderation controls (mute, hide messages, slow mode) | 2–3 days | 1–2 |

#### 2c. Cross-Player Interactions & Presenter (`02c-blueprint-cross-player-and-presenter.md`)

The blueprint's core differentiator + presenter reliability.

| Phase | Feature | Effort | Blueprint Importance |
|-------|---------|--------|---------------------|
| **C1** | Cross-player targeting layer (challenges) | 5–7 days | 1–2 |
| **C2** | Audience-sourced question submission | 3–4 days | 2 |
| **C3** | Presenter view hardening (auto-reconnect, cache) | 2–3 days | 1 |
| **C4** | Complete Headline Fibbage backend | 2–3 days | 2 |

#### 2d. Venue Analytics & Social (`02d-blueprint-venue-analytics-and-social.md`)

Revenue unlock + retention features.

| Phase | Feature | Effort | Blueprint Importance |
|-------|---------|--------|---------------------|
| **D1** | Venue analytics dashboard | 5–7 days | 1 |
| **D2** | Player badges & achievements | 4–5 days | 3 |
| **D3** | Auto-generated player names | 0.5 day | 1 |

### 3. Research Shopping List (`03-research-shopping-list.md`)

15 topics requiring deeper research before implementation. Prioritized by urgency.

| Priority | Topics |
|----------|--------|
| **High** (blocks near-term work) | Profanity word list, Supabase Realtime scaling, PWA iOS limits, UGC app store requirements, Virtual points legality |
| **Medium** (informs design) | Presenter reconnect patterns, WCAG audit, Venue Wi-Fi, Anti-cheat, Monetization pricing, Photo rounds, Challenge resolution |
| **Low** (future planning) | Service worker strategy, GDPR/CCPA, Capacitor vs RN WebView |

---

## Recommended Execution Order

```
Week 1:  01 Phase 1–2  (bugs + team removal)
         02a A2–A4     (profanity, PWA, shortcuts)

Week 2:  01 Phase 3–4  (decomposition + type safety)
         02a A1        (reactions)
         02b B2        (rate limiting)

Week 3:  02b B1        (report/block)
         02c C3        (presenter hardening)
         02c C4        (headline fibbage completion)
         02d D3        (name generator)

Week 4:  02b B3        (host moderation)
         02c C2        (audience submissions)
         01 Phase 5    (tests)

Week 5–6: 02d D1       (analytics dashboard)
           02c C1       (cross-player challenges)

Week 7+:  02d D2       (badges)
           Future features from blueprint
```

---

## Dependency Graph

```
01-Phase 1 (bugs)
  └── 01-Phase 2 (team removal)
       └── 01-Phase 3 (decomposition)
            └── 01-Phase 4 (type safety)
                 └── 01-Phase 5 (tests)

02a-A2 (profanity) ──────────────────┐
02a-A3 (PWA) ── independent          │
02a-A4 (shortcuts) ── independent    │
02a-A1 (reactions) ── independent    │
                                     ▼
02b-B1 (report/block) ◄── 02a-A2 (profanity filter exists)
02b-B2 (rate limiting) ── independent
02b-B3 (host moderation) ◄── B1 + B2
                                     │
02c-C1 (challenges) ◄─── B1 (safety)│+ research #5 (legal) + research #12 (judging)
02c-C2 (audience submissions) ── independent
02c-C3 (presenter) ── independent + research #6 (reconnect patterns)
02c-C4 (headline fibbage) ── independent
                                     │
02d-D1 (analytics) ── independent    │
02d-D2 (badges) ◄── C1 (challenges for social badges)
02d-D3 (name generator) ── independent
```
