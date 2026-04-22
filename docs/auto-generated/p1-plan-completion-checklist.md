# P1 Plan Completion Checklist (Non-Deferred)

Use this checklist to verify that all `P1 — High Impact / Low Effort` items are complete, excluding explicitly deferred/manual items (`P1-15`, `P1-35`).

## Scope Guardrails

- [ ] **Backlog status accuracy**: `BACKLOG.md` reflects shipped vs partial vs deferred for all P1 items, with notes for remaining gaps.
- [ ] **Deferred/manual exclusions confirmed**: `P1-15` and `P1-35` are clearly out-of-scope for this completion pass.

## Foundation and Deployment

- [ ] **Schema landed**: migration `20260422000000_p1_backlog_wave.sql` is applied in target env and columns/bucket/policies exist.
- [ ] **Edge functions deployed**: `sociales-break`, `sociales-moderate-response`, `sociales-regrade-variant`, `sociales-score-predictive`, updated `sociales-submit-response`, updated `sociales-end`.
- [ ] **Type safety pass**: run app typecheck/lint in CI/local with Node available; fix any regressions in touched files.

## Core P1 Experience Checks

- [ ] **P1-1 reveal theater**: confirm full 6-8s reveal choreography (including leaderboard FLIP + rank ribbons), not just tile reveal.
- [ ] **P1-2 hype completeness**: verify curated reaction set, rate limit/decay behavior, topic-round score coupling, and TV reward audio/animation behavior.
- [ ] **P1-3 reconnect**: simulate offline submit -> reconnect -> pending answer flush + reconnect banner + success toast.
- [ ] **P1-4 soundboard**: all hotkeys/buttons work; audio files exist for each cue; TV playback fallback behavior acceptable.
- [ ] **P1-5 host pacing UI**: typing/submitted dots match grey/yellow/green spec and aggregate "X/Y submitted" row is visible/accurate.
- [ ] **P1-6 all-eyes-up**: host lock/unlock reliably dims room clients and releases correctly.
- [ ] **P1-8 break mode**: 5/10/15 break insertion, TV countdown, resume flow, and room break surface all work in live session.
- [ ] **P1-9 round intro**: 4s splash timing, category tint, and whoosh sting trigger correctly between rounds.
- [ ] **P1-10 leaderboard scheduling**: `'off' | 'scheduled' | 'every_question'` modes behave as intended; host forced show works.
- [ ] **P1-11 multiplier**: final-round multiplier affects scoring correctly and splash/badge appears at right times.
- [ ] **P1-12 round audio**: MP3 upload + YouTube link persist and play/fade correctly on TV.
- [ ] **P1-13 streak loop**: weekly streak increment/reset/freeze logic in `sociales-end` matches rules; header flame + share-card streak text render.
- [ ] **P1-16 announcer depth**: phase/round/score/timer/event/player-callout/venue copy paths are wired and testable via host tester.
- [ ] **P1-18 welcome-back**: resumable membership card appears from `client_key`; "not me" path clears resume linkage safely.
- [ ] **P1-19 predictive**: host can set answer post-guess; rescore function updates responses/scores as expected.
- [ ] **P1-20 progress bars**: thin progress strips on room shell and TV are always accurate across rounds/phases.
- [ ] **P1-23 mate deep-link**: invite URL includes `membership`; join flow preserves intended teammate experience.
- [ ] **P1-24 moderation queue**: pending responses appear, approve/scrub works, and TV only renders approved content.
- [ ] **P1-25 regrade-all**: variant acceptance and retroactive scoring update path works and is idempotent/safe.
- [ ] **P1-26 corner QR**: QR persists through active gameplay and scales properly from attract to active phases.
- [ ] **P1-27 look-up overlay**: reveal-only, minimal UI, breathing pulse, no duplicate timer/leaderboard content.
- [ ] **P1-29 TV answer tiles**: color+shape mapping, vote bars, correct full-size vs wrong shrink/dim/X behavior validated.

## End-to-End and Release Readiness

- [ ] **Release sanity**: smoke test full hosted game from lobby -> answer -> vote -> reveal -> results -> end with host/room/TV clients in sync.
- [ ] **Artifacts tracked**: attach screenshots/video snippets for each major P1 item to PR/release notes.

