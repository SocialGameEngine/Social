# Research Shopping List

> **Purpose**: Topics requiring deeper research before implementation decisions can be made. Feed these to ChatGPT Deep Research or equivalent.  
> **Format**: Each item includes the question, why it matters, and what a good answer looks like.

---

## 1. Profanity Filter: Word List Selection & Multi-Language Support

**Question**: What is the best open-source profanity word list or library for a real-time social app? Should we use a static word list, an npm package (e.g., `bad-words`, `leo-profanity`), or a lightweight ML classifier? How do we handle multi-language profanity (especially if venues operate in non-English markets)?

**Why it matters**: Phase A2 (system-wide profanity filter) needs a word list. A bad list either over-censors (frustrating) or under-censors (unsafe). Multi-language is relevant if the app expands beyond English-speaking venues.

**Good answer includes**: Comparison of top 3–5 options with false-positive rates, language coverage, bundle size, and maintenance status. Recommendation for a pub/bar context (adult audience, casual language is OK, slurs are not).

---

## 2. PWA: iOS Limitations, Web Push, and Home Screen Behavior

**Question**: What are the current (2025–2026) iOS Safari limitations for PWAs? Specifically: (a) Does web push notification work reliably on iOS home-screen web apps? (b) What are the gotchas for `standalone` display mode on iOS? (c) Does the service worker cache persist reliably across iOS updates? (d) What is the install prompt UX on iOS vs Android?

**Why it matters**: Phase A3 (PWA manifest) and the blueprint's push notification recommendation depend on iOS PWA support. If iOS web push is unreliable, we may need a hybrid wrapper (Capacitor) sooner.

**Good answer includes**: Current iOS version support matrix, known bugs/limitations, workarounds, and a recommendation on whether PWA-only is sufficient or if a Capacitor wrapper should be planned.

---

## 3. Supabase Realtime: Scaling Limits & Channel Quotas

**Question**: What are Supabase Realtime's practical limits for concurrent connections, channels per project, and messages per second? At what point (number of rooms × players per room) do we need to consider architectural changes (e.g., connection pooling, channel multiplexing, or moving to a dedicated WebSocket server)?

**Why it matters**: The app currently creates multiple Realtime channels per room (rooms, memberships, interactions, responses, chat, leaderboard). With 50 players per room and 10 concurrent rooms, that's 500+ connections with 60+ channels. The blueprint envisions multi-venue concurrency.

**Good answer includes**: Supabase Realtime pricing tier limits, documented quotas, real-world benchmarks from other projects, and a threshold recommendation for when to consider alternatives (e.g., Ably, Pusher, or self-hosted WebSocket).

---

## 4. UGC Moderation: App Store Requirements for Web-Wrapped Apps

**Question**: If we wrap the PWA in a native shell (Capacitor/React Native WebView) for app store distribution, what are Apple's and Google's exact requirements for UGC moderation? Specifically: (a) What moderation features are mandatory vs recommended? (b) Is a report/block system sufficient, or do we need pre-approval of all UGC? (c) Are there specific requirements for chat vs photo UGC? (d) What are the review timelines and common rejection reasons for UGC apps?

**Why it matters**: Phase B1 (report/block) is designed to meet these requirements, but we need to verify completeness before investing in a native wrapper.

**Good answer includes**: Exact Apple App Store Review Guideline sections (1.2, 1.3, etc.), Google Play UGC policy excerpts, examples of approved apps with similar UGC patterns, and a compliance checklist.

---

## 5. Virtual Points / Side-Bets: Legal Boundaries by Jurisdiction

**Question**: What are the legal boundaries for virtual point wagering in a bar/pub game app? Specifically: (a) At what point do "virtual points" become regulated gambling (US, Canada, UK, EU)? (b) Can venues offer real prizes (e.g., a free drink) based on virtual point standings without triggering gambling laws? (c) What disclaimers or terms are needed? (d) Are there precedents from similar apps (CrowdPurr, Buzztime, bar trivia apps)?

**Why it matters**: Phase C1 (challenges with point wagers) and the blueprint's "side-bets" feature need legal clarity. The blueprint explicitly warns: "keep side-bets strictly virtual points with no required payment and no cash-equivalent prizes until jurisdiction-specific counsel is complete."

**Good answer includes**: Jurisdiction-by-jurisdiction summary (US federal + key states, Canada, UK, EU), the "three elements of gambling" test (prize + chance + consideration), and practical safe-harbor recommendations.

---

## 6. Anti-Cheat: Timer-Based and Behavioral Heuristics for Trivia

**Question**: What are the most effective anti-cheat mechanisms for mobile trivia games? Specifically: (a) What timer/response-time thresholds flag suspicious behavior? (b) How do existing platforms (CrowdPurr, Kahoot, SpeedQuizzing) handle cheating? (c) What behavioral heuristics can detect phone-Googling (e.g., app-switch detection, improbable response times)? (d) What is the false-positive rate for these heuristics?

**Why it matters**: The blueprint rates anti-cheat as Importance 1 and notes "cheating concerns are salient enough to reduce attendance." This isn't in the current implementation plan but will be needed for trivia rounds.

**Good answer includes**: Specific timer thresholds used by competitors, detection techniques with false-positive rates, and a recommended "trust score" model that flags rather than blocks.

---

## 7. Presenter View: Auto-Reconnect Patterns for Venue Displays

**Question**: What are the best practices for building a "kiosk-mode" web display that must stay connected and recover from network drops? Specifically: (a) What reconnection strategies work best (exponential backoff, heartbeat, visibility API)? (b) How do digital signage platforms handle offline fallback? (c) Should we use a service worker for the presenter view specifically? (d) Are there browser APIs for detecting network quality (Network Information API)?

**Why it matters**: Phase C3 (presenter hardening) needs a robust reconnection strategy. Venue TVs running a browser tab may lose connection for minutes at a time.

**Good answer includes**: Reconnection pattern comparison, code examples for exponential backoff with jitter, Network Information API browser support matrix, and recommendations for a "last known good state" cache strategy.

---

## 8. Accessibility: WCAG 2.2 Audit Checklist for Pub/Bar UX

**Question**: What specific WCAG 2.2 criteria are most relevant for a dark-themed, mobile-first bar game app? Specifically: (a) What are the minimum contrast ratios for our cyan/pink/fuchsia-on-dark-slate color scheme? (b) What are the target size requirements (2.5.8 Target Size Minimum)? (c) What are the most common accessibility failures in React SPAs? (d) Are there automated tools that can audit our specific color palette?

**Why it matters**: The blueprint comparison notes "Large tap targets (44×44pt) — unknown, not audited" and "High contrast text — partial, no WCAG audit." An accessibility audit is listed as Tier 4 but should be informed by research now.

**Good answer includes**: Specific contrast ratio calculations for our color palette (cyan #67e8f9 on slate #0f172a, pink #f472b6 on slate, etc.), a prioritized checklist of WCAG 2.2 criteria for mobile games, and recommended automated audit tools (axe, Lighthouse, etc.).

---

## 9. Venue Wi-Fi: Capacity Planning for 50+ Concurrent Devices

**Question**: What are the practical Wi-Fi capacity limits for a typical pub/bar venue running a real-time game with 50+ players? Specifically: (a) What bandwidth per player does a WebSocket-based game app consume? (b) What are common guest Wi-Fi configurations in bars (AP count, bandwidth caps, captive portals)? (c) What should our "venue readiness checklist" include? (d) Should we offer a "low-bandwidth mode" that reduces Realtime channel usage?

**Why it matters**: The blueprint emphasizes "your product fails if Wi-Fi fails" and recommends a guest Wi-Fi readiness checklist. We need to understand the actual bandwidth requirements to give venues actionable guidance.

**Good answer includes**: Bandwidth estimates per player (WebSocket idle + active), AP capacity recommendations (Cisco Meraki guidelines), a draft venue Wi-Fi checklist, and a "low-bandwidth mode" specification.

---

## 10. Monetization: Venue Subscription Pricing & Sponsor Surface Design

**Question**: What pricing models and price points work for venue-facing SaaS products in the bar/pub trivia space? Specifically: (a) What do Buzztime ($199/mo), CrowdPurr ($49.99+/mo), and SpeedQuizzing (per-event) charge and what do they include? (b) What is the typical bar's budget for entertainment/engagement tools? (c) What sponsor surface formats (banners, interstitials, projector slides) generate the most revenue without degrading player experience? (d) What metrics do sponsors care about (impressions, engagement, dwell time)?

**Why it matters**: The blueprint identifies "venue subscription + sponsor packages" as the primary revenue model. We have no monetization infrastructure yet. Pricing research should inform feature prioritization (e.g., should we build sponsor surfaces before or after subscription billing?).

**Good answer includes**: Competitor pricing breakdown with feature-tier comparison, bar entertainment budget benchmarks, sponsor format examples with CPM/engagement data, and a recommended pricing tier structure for Pub Söcial.

---

## 11. Photo Rounds: Camera API, Compression, and Moderation Pipeline

**Question**: What is the best approach for in-browser photo capture and upload in a real-time game context? Specifically: (a) What are the current browser capabilities for camera access (MediaDevices API) across iOS Safari and Android Chrome? (b) What client-side compression should we apply before upload (target file size, format)? (c) What is the fastest moderation pipeline for photo UGC (auto-approve with post-hoc review vs pre-approval queue)? (d) Are there lightweight image moderation APIs (NSFW detection) that can run client-side or at low cost?

**Why it matters**: The blueprint rates photo rounds as Importance 2 and the app already has `SelfieModal` + `useSelfieCamera` (legacy). Repurposing these for photo rounds requires understanding the camera API landscape and moderation requirements.

**Good answer includes**: Browser support matrix for MediaDevices API, recommended compression settings (WebP, target <200KB), comparison of moderation approaches (client-side ML vs cloud API vs manual), and cost estimates for cloud moderation APIs.

---

## 12. Cross-Player Challenge Resolution: Judging Mechanisms

**Question**: How should player-vs-player challenges be resolved in a text-response game? Specifically: (a) Should the host judge, should other players vote, or should it be automated? (b) If automated, what text similarity or quality scoring approaches work for short creative responses? (c) How do existing party games (Jackbox, Quiplash) handle judging? (d) What is the UX for a "challenge accepted → both answer → judge → result" flow that completes in under 60 seconds?

**Why it matters**: Phase C1 (cross-player challenges) needs a resolution mechanism. The blueprint describes "double-or-nothing points" challenges but doesn't specify how the winner is determined.

**Good answer includes**: Comparison of judging mechanisms (host, crowd vote, automated), UX flow diagrams for each, timing analysis (can it fit in 60 seconds?), and a recommendation for MVP.

---

## 13. Service Worker: Caching Strategy for a Real-Time SPA

**Question**: What is the optimal service worker caching strategy for a Vite-built React SPA that relies heavily on real-time WebSocket data? Specifically: (a) What should be precached (app shell, static assets) vs runtime-cached (API responses)? (b) How do we handle cache invalidation for Vite's hashed asset filenames? (c) Should we use Workbox or a custom service worker? (d) What are the pitfalls of service workers with Supabase Realtime (e.g., intercepting WebSocket connections)?

**Why it matters**: Phase A3 (PWA) includes a minimal service worker, and the blueprint recommends offline/low-connectivity support. A bad caching strategy can cause stale UI or break real-time features.

**Good answer includes**: Recommended Workbox configuration for Vite, precache manifest setup, runtime caching strategies for Supabase REST vs Realtime, and known pitfalls with WebSocket + service worker interaction.

---

## 14. Data Privacy: GDPR/CCPA Compliance for Anonymous + Venue-Scoped Data

**Question**: What are the minimum data privacy compliance requirements for an app that collects: (a) anonymous device-linked identities (Supabase anonymous auth), (b) optional email accounts, (c) venue-scoped player names and scores, (d) chat messages, (e) photos (if photo rounds are added)? What constitutes "personal data" in this context under GDPR and CCPA?

**Why it matters**: The blueprint explicitly calls out GDPR, CCPA, and COPPA considerations. We need to know what compliance work is required before scaling to multiple venues or jurisdictions.

**Good answer includes**: Classification of each data type as personal/non-personal under GDPR and CCPA, minimum required notices and consent flows, data retention recommendations, and a compliance checklist for a web-first app with anonymous users.

---

## 15. Hybrid Native Wrapper: Capacitor vs React Native WebView

**Question**: If we decide to distribute via app stores, should we use Capacitor (web app in native shell) or React Native with a WebView? Specifically: (a) What are the trade-offs for a primarily-web app? (b) Which gives better access to native APIs (push notifications, camera, haptics)? (c) What is the app store review experience for each? (d) What is the migration effort from a pure Vite SPA?

**Why it matters**: The blueprint lists "hybrid wrapper" as Importance 3 but notes it's needed for push notifications and app store distribution. This decision affects the PWA strategy (Phase A3).

**Good answer includes**: Feature comparison table (Capacitor vs RN WebView), migration effort estimate from Vite SPA, app store approval rates/timelines, and a recommendation based on our stack (React 18 + Vite + Supabase).

---

## Summary: Priority Order for Research

| # | Topic | Urgency | Blocks |
|---|-------|---------|--------|
| 1 | Profanity filter word list | High | Phase A2 |
| 2 | Supabase Realtime scaling | High | Architecture decisions |
| 3 | PWA iOS limitations | High | Phase A3 |
| 4 | UGC moderation app store requirements | High | Phase B1 + native wrapper decision |
| 5 | Virtual points legal boundaries | High | Phase C1 (challenges) |
| 6 | Presenter auto-reconnect patterns | Medium | Phase C3 |
| 7 | WCAG accessibility audit | Medium | UI polish |
| 8 | Venue Wi-Fi capacity planning | Medium | Venue playbook |
| 9 | Anti-cheat heuristics | Medium | Trivia implementation |
| 10 | Monetization pricing research | Medium | Business model |
| 11 | Photo rounds camera/moderation | Medium | Photo feature |
| 12 | Challenge resolution mechanisms | Medium | Phase C1 |
| 13 | Service worker caching strategy | Low | Phase A3 enhancement |
| 14 | GDPR/CCPA compliance | Low | Scaling to new jurisdictions |
| 15 | Capacitor vs RN WebView | Low | App store distribution |
