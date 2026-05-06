# P2 Implementation Tests

This directory contains comprehensive tests for verifying the implementation of features outlined in `PLAN_P2_REVISED.md`. Each test file covers specific phases and features from the plan.

## Test Structure

### Phase A - Foundations
- `phase-a-ambient-packs.test.ts` - AON-3 GAP 4 Ambient Packs implementation
- `phase-a-reveal-hardening.test.ts` - P2-16 Reveal choreography hardening
- `phase-a-late-joiner.test.ts` - P2-6 Late-joiner routing polish

### Phase B - Social / Ghost / Banter
- `phase-b-spectator-mode.test.ts` - P2-4 Spectator (ghost) mode for late joiners
- `phase-b-banter-channel.test.ts` - P2-5 Banter channel implementation
- `phase-b-stat-cards.test.ts` - P2-1 End-of-round sequential stat cards
- `phase-b-dual-band-stats.test.ts` - P2-17 Dual-band post-round card

### Phase C - Round Type Extensions
- `phase-c-round-types.test.ts` - P2-2 All new round types (picture, music, wager, etc.)

### Phase D - Viral / Share
- `phase-d-share-card.test.ts` - P2-18 Share card generation
- `phase-d-wrapped-recap.test.ts` - P2-10 Wrapped-style recap

### Phase E - Competitive Meta
- `phase-e-competitive-meta.test.ts` - P2-7 Tie-break, P2-12 Chest rounds, P2-14 Seasonal leagues

### Phase F - Ops & Polish
- `phase-f-ops-polish.test.ts` - P2-13 Analytics + CSV export, P2-11 HostPage mobile parity

## Running Tests

To run all tests:
```bash
pnpm test
```

To run a specific phase:
```bash
pnpm test phase-a
pnpm test phase-b
# etc.
```

To run a specific test file:
```bash
pnpm test phase-a-ambient-packs.test.ts
```

## Test Coverage

Each test file verifies:

1. **Database Schema** - Tables, columns, constraints, indexes
2. **Edge Functions** - Logic, parameters, return values
3. **Frontend Components** - File paths, props, integration points
4. **Business Logic** - Rules, calculations, state management
5. **API Integration** - Endpoints, payloads, error handling
6. **UI/UX** - Responsive design, accessibility, user flows

## Smoke Test Matrix

The tests implement the smoke test matrix from the plan:

| Feature | Key Check | Test File |
|---|---|---|
| Ambient Packs | Pack-scoped rounds, fallback behavior | `phase-a-ambient-packs.test.ts` |
| Reveal Hardening | 1.5s TV-phone delay, drift telemetry | `phase-a-reveal-hardening.test.ts` |
| Late Joiner | Waiting room, auto-promotion | `phase-a-late-joiner.test.ts` |
| Spectator Mode | Practice submissions, greyed TV | `phase-b-spectator-mode.test.ts` |
| Banter | Submit, upvote, moderate flow | `phase-b-banter-channel.test.ts` |
| Stat Cards | Staggered timing, host controls | `phase-b-stat-cards.test.ts` |
| Dual-Band Stats | Session vs membership bands | `phase-b-dual-band-stats.test.ts` |
| Round Types | Registry, UI components, phases | `phase-c-round-types.test.ts` |
| Share Card | 1080×1920 PNG, no prompt leakage | `phase-d-share-card.test.ts` |
| Wrapped Recap | 8-card sequence, zip export | `phase-d-wrapped-recap.test.ts` |
| Tie-Break | 10s timers, 2× scoring, exit logic | `phase-e-competitive-meta.test.ts` |
| Chest Rounds | Upgrade system, timing, application | `phase-e-competitive-meta.test.ts` |
| Seasons | Monthly cron, tier computation | `phase-e-competitive-meta.test.ts` |
| Analytics | Question stats, CSV export | `phase-f-ops-polish.test.ts` |
| Mobile Parity | 64px targets, bottom sheet | `phase-f-ops-polish.test.ts` |

## Manual Testing Guide

These tests are designed to complement manual testing. For each feature, follow these detailed steps:

### Step 1: Automated Verification
```bash
# Run all tests first
pnpm test

# Check for any failures before manual testing
```

### Step 2: Feature-by-Feature Manual Testing

#### **Phase A - Foundations**

**Ambient Packs (P2-4)**
1. Go to prompt-admin → Ambient Packs
2. Create a new pack with 3-5 rounds
3. Create a sociale using this pack
4. Verify only rounds from selected pack play
5. Create an empty pack and verify fallback to General
6. Check TV shows pack indicator

**Reveal Hardening (P2-16)**
1. Start any sociale
2. During reveal phase, verify 1.5s delay between TV and phone
3. Check browser console for drift telemetry logs
4. Verify server_phase_sync events fire on each advance

**Late-joiner Routing (P2-6)**
1. Start a sociale with multiple rounds
2. Join as a new player after round 2
3. Verify waiting room appears with countdown
4. Verify auto-promotion at round boundary
5. Check TV shows "X joined late" notification

#### **Phase B - Social Features**

**Spectator Mode (P2-4)**
1. Join as late-joiner (see above)
2. Submit practice answers
3. Verify submissions appear greyed on TV
4. Vote on practice submissions
5. Check practice submissions excluded from scoring
6. Verify auto-promotion removes spectator status

**Banter Channel (P2-5)**
1. Start any sociale
2. Switch to Banter tab on RoomPage
3. Submit a banter message (1-280 chars)
4. Try submitting again within 60 seconds (should rate limit)
5. Upvote someone else's banter
6. Try upvoting your own (should fail)
7. Host: Go to HostPage → Moderate Banter
8. Approve/reject/send to TV a banter message

**Sequential Stat Cards (P2-1)**
1. Complete a sociale with 4+ rounds
2. During results phase, verify cards appear sequentially
3. Host: Test Pause button (should freeze current card)
4. Host: Test Next button (should advance)
5. Host: Test Skip button (should jump to post-round)
6. Verify auto-advance every 2 seconds when unpaused

**Dual-Band Stats (P2-17)**
1. Test as anonymous user (no membership_id)
2. Complete a round and verify only session band shows
3. Test as registered user (has membership_id)
4. Verify both session and membership bands show
5. Check membership band shows all-time stats and tier

#### **Phase C - Round Types**

**Round Type Extensions (P2-2)**
1. Check file structure exists:
   - `apps/top-comment/src/domain/sociale/rounds/` with all type files
   - `apps/top-comment/src/domain/sociale/rounds/index.ts` imports all
   - `apps/top-comment/src/main.tsx` imports the index
2. Verify UI component folders exist:
   - `apps/top-comment/src/features/room/components/rounds/` for each type
3. Test ambient pack creation uses new round types
4. Check storage buckets exist in Supabase (sociale-photos, sociale-audio)

#### **Phase D - Share/Viral**

**Share Card (P2-18)**
1. Complete any sociale
2. Click Share button
3. Verify PNG generates (1080×1920)
4. Check no prompt text appears in image
5. Test clipboard copy
6. Test native share (if supported)
7. Verify emoji-dot grid shows answer pattern

**Wrapped Recap (P2-10)**
1. Complete a full sociale
2. Click "Wrapped" button
3. Verify 8-story sequence generates
4. Test individual card sharing
5. Test zip download of all cards
6. Verify story content matches actual performance

#### **Phase E - Competitive Meta**

**Tie-Break (P2-7)**
1. Create a sociale that ends in tie
2. Host: Click "Tie Break" button
3. Verify tie-break participants selected
4. Check 10-second timers for answer/reveal
5. Verify 2× scoring multiplier
6. Test exit conditions (clear leader or 5 rounds)

**Chest Rounds (P2-12)**
1. Set chest_every_n_rounds = 3 in sociale
2. Play through to chest round
3. Verify slot machine animation
4. Test upgrade awarding (common/rare/epic)
5. Apply upgrade in next round
6. Verify upgrade effects (double points, shield, etc.)

**Seasonal Leagues (P2-14)**
1. Check seasons table has current month
2. Complete a game as registered user
3. Verify season_standings updated
4. Check tier computation (top 5% Diamond, etc.)
5. View SeasonStandings on venue page

#### **Phase F - Ops/Polish**

**Analytics + CSV Export (P2-13)**
1. Complete a sociale
2. Host: View PostSessionReport
3. Verify question difficulty flags
4. Test CSV export (players.csv, questions.csv)
5. Use redemption round builder for too_hard questions

**Mobile Parity (P2-11)**
1. Open HostPage on mobile (< 768px)
2. Verify bottom sheet appears
3. Test all controls have 64px minimum touch targets
4. Verify all host actions available on mobile
5. Test swipe-to-dismiss bottom sheet

### Step 3: File Structure Verification

For each feature, verify these files exist:
- Database migrations in `supabase/migrations/`
- Edge functions in `supabase/functions/`
- Frontend components in `apps/top-comment/src/`
- Types in `packages/db/src/types/`

### Step 4: Integration Testing

1. Test complete user flows from join to finish
2. Verify realtime updates work across devices
3. Test error handling and edge cases
4. Verify performance requirements met

### Step 5: Quick Reference Checklist

**For Each Feature, Verify:**
- [ ] Database migrations applied (`pnpm supabase db push`)
- [ ] Edge functions deployed (`pnpm supabase functions deploy`)
- [ ] Frontend components exist at specified paths
- [ ] Types updated in `packages/db/src/types/`
- [ ] RLS policies working correctly
- [ ] Realtime subscriptions functioning
- [ ] Mobile responsive (if applicable)
- [ ] Error handling implemented

**Critical Path Testing:**
1. **Join Flow** → Room creation → Player join → Game start
2. **Game Loop** → Answer → Reveal → Results → Next round
3. **End Game** → Stats → Share → Wrapped → Analytics
4. **Edge Cases** → Late join → Disconnection → Tie-break

### Step 6: Troubleshooting Guide

**Common Issues & Solutions:**

| Issue | Likely Cause | Fix |
|---|---|---|
| Tests fail to run | Missing dependencies | `pnpm install` |
| Database errors | Migrations not applied | `pnpm supabase db push` |
| Edge function timeout | Function not deployed | `pnpm supabase functions deploy` |
| RLS permission denied | Policy missing/wrong | Check migration files |
| Realtime not working | Wrong channel subscription | Verify channel names |
| Mobile layout broken | Missing responsive classes | Add Tailwind breakpoints |
| Share card blank | html-to-image error | Check component rendering |
| CSV export empty | No data in tables | Verify data insertion |

**Debug Commands:**
```bash
# Check Supabase status
pnpm supabase status

# View recent migrations
pnpm supabase db list

# Test edge function locally
pnpm supabase functions serve

# Check TypeScript types
pnpm type-check

# Run specific phase tests
pnpm test phase-a
```

## Implementation Status

As you implement each feature, run the corresponding tests to verify:

- ✅ Database migrations applied correctly
- ✅ Edge functions deployed and working
- ✅ Frontend components exist and integrate properly
- ✅ Business logic matches plan specifications
- ✅ UI/UX requirements are met

## Notes

- Tests use Playwright for end-to-end verification
- Database tests verify schema and constraints
- Component tests check file structure and props
- Integration tests ensure proper data flow
- Some tests mock external dependencies (Supabase, storage, etc.)

Each test file is self-contained and can be run independently for focused verification of specific features.
