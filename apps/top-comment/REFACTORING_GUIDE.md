# Event Platform Refactoring Implementation Guide

**For: SWE-1.5 Agent**  
**Project:** Event Platform Clean Architecture Refactoring  
**Goal:** Transform codebase from 3,177 LOC to 1,850 LOC (42% reduction)

---

## Quick Start

This guide breaks down the refactoring into 4 phases over 4 weeks. Each phase has atomic tasks with clear acceptance criteria.

**IMPORTANT RULES:**
1. Never delete old code until new code is tested
2. Create new files alongside old files
3. Test each phase before moving to next
4. Commit after each completed task
5. If stuck, document blocker and move to next task

---

## Phase 1: Domain Layer (Week 1)

### Overview
Extract all business logic into pure, testable functions with no React dependencies.

### Task 1.1: Create Directory Structure

```bash
mkdir -p src/domain/models
mkdir -p src/domain/services
mkdir -p src/domain/types
```

Create these files:
- `src/domain/types/domain.types.ts`
- `src/domain/services/VotingEngine.ts`
- `src/domain/services/LeaderboardCalculator.ts`
- `src/domain/services/SessionStateMachine.ts`
- `src/domain/services/RoundManager.ts`
- `src/domain/index.ts`

**Acceptance:** All directories and files created

---

### Task 1.2: Implement VotingEngine

**File:** `src/domain/services/VotingEngine.ts`

This service replaces duplicated vote counting logic in HostPage, TeamPage, and PresenterPage.

**Key methods to implement:**
- `calculateVoteCounts(votes)` - Count votes per answer
- `determineWinners(answers, voteCounts)` - Find winning answers
- `calculateRoundSummaries(groups, answers, votes)` - Complete round summaries
- `groupAnswersByGroup(answers)` - Group answers by group ID
- `sortByVotes(answers, voteCounts)` - Sort by vote count

**Acceptance:** 
- All methods are static
- No React imports
- File compiles without errors

---

### Task 1.3: Implement LeaderboardCalculator

**File:** `src/domain/services/LeaderboardCalculator.ts`

This service replaces duplicated leaderboard logic.

**Key methods:**
- `calculate(teams)` - Generate leaderboard with ranks
- `findTeamRank(teamId, leaderboard)` - Get team's rank
- `getTopN(leaderboard, n)` - Get top N teams

**Acceptance:**
- Handles ties correctly (same score = same rank)
- No side effects
- File compiles

---

### Task 1.4: Implement SessionStateMachine

**File:** `src/domain/services/SessionStateMachine.ts`

Manages session state transitions and validation.

**Key methods:**
- `canTransition(from, to)` - Check if transition is valid
- `getNextPhase(current, context)` - Determine next phase
- `validateTransition(session, nextPhase, teamCount)` - Validate with business rules
- `buildContext(session)` - Build context for state machine

**Acceptance:**
- All transitions validated
- Business rules enforced
- File compiles

---

### Task 1.5: Implement RoundManager

**File:** `src/domain/services/RoundManager.ts`

Manages round-related logic.

**Key methods:**
- `getCurrentRound(rounds, roundIndex)` - Get current round
- `getCurrentGroups(rounds, roundIndex)` - Get groups
- `getActiveVoteGroup(rounds, roundIndex, voteGroupIndex)` - Get active group
- `findTeamGroup(groups, teamId)` - Find team's group

**Acceptance:**
- Handles edge cases
- File compiles

---

### Task 1.6: Create Domain Types

**File:** `src/domain/types/domain.types.ts`

Define all domain-specific types.

**Acceptance:** All types exported properly

---

### Task 1.7: Create Domain Index

**File:** `src/domain/index.ts`

Export all services and types.

**Acceptance:** No circular dependencies

---

### Task 1.8: Write Unit Tests

Create test files for each service in `src/domain/services/__tests__/`

**Target coverage:** >90%

**Acceptance:** All tests pass

---

## Phase 2: Application Layer (Week 2)

### Overview
Create composable hooks that use domain services.

### Task 2.1: Create Directory Structure

```bash
mkdir -p src/application/hooks
mkdir -p src/application/types
```

Create files:
- `src/application/types/application.types.ts`
- `src/application/hooks/useGameState.ts`
- `src/application/hooks/useSessionOrchestrator.ts`
- `src/application/index.ts`

---

### Task 2.2: Implement useGameState Hook

**File:** `src/application/hooks/useGameState.ts`

**Purpose:** Single hook that replaces 10+ useMemo hooks across all pages

**What it does:**
- Fetches raw data (session, teams, answers, votes)
- Computes derived state using domain services
- Returns everything in one object

**Key computed values:**
- `voteCounts` - Using VotingEngine
- `leaderboard` - Using LeaderboardCalculator
- `roundSummaries` - Using VotingEngine
- `activeGroup` - Using RoundManager

**Acceptance:**
- Returns complete GameState object
- Uses domain services for all calculations
- No duplicated logic

---

### Task 2.3: Implement useSessionOrchestrator Hook

**File:** `src/application/hooks/useSessionOrchestrator.ts`

**Purpose:** Manages session lifecycle and auto-advance

**Features:**
- Auto-advance timer for timed phases
- Pause/resume support
- State machine validation
- Error handling

**Acceptance:**
- Auto-advance works
- Validates transitions
- No duplicated code

---

### Task 2.4: Test Hooks in New Page

**File:** `src/features/host/HostPage.NEW.tsx`

Create a test page that uses the new hooks alongside the old page.

**Steps:**
1. Create HostPage.NEW.tsx
2. Add route for /host-new
3. Test with real session
4. Compare with old /host page

**Acceptance:**
- New page loads correctly
- All data matches old page
- No console errors

---

## Phase 3: Presentation Layer (Week 3)

### Overview
Refactor page components to use application hooks.

### Task 3.1: Refactor HostPage

**Steps:**
1. Backup: `cp src/features/host/HostPage.tsx src/features/host/HostPage.OLD.tsx`
2. Replace content with refactored version
3. Use `useGameState` hook
4. Use `useSessionOrchestrator` hook
5. Remove all duplicated useMemo logic

**Target:** Reduce from 896 lines to ~250 lines

**Acceptance:**
- File size reduced
- All functionality preserved
- Uses application hooks
- Thoroughly tested

---

### Task 3.2: Refactor TeamPage

**Steps:**
1. Backup: `cp src/features/team/TeamPage.tsx src/features/team/TeamPage.OLD.tsx`
2. Follow same pattern as HostPage
3. Use application hooks
4. Remove duplicated logic

**Target:** Reduce from 1,261 lines to ~300 lines

**Acceptance:**
- File size reduced
- All functionality preserved
- Thoroughly tested

---

### Task 3.3: Refactor PresenterPage

**Steps:**
1. Backup: `cp src/features/presenter/PresenterPage.tsx src/features/presenter/PresenterPage.OLD.tsx`
2. Follow same pattern
3. Use application hooks

**Target:** Reduce from 420 lines to ~150 lines

**Acceptance:**
- File size reduced
- All functionality preserved
- Thoroughly tested

---

## Phase 4: Cleanup (Week 4)

### Task 4.1: Delete Old Files

**Only after everything is tested:**
```bash
rm src/features/host/HostPage.OLD.tsx
rm src/features/team/TeamPage.OLD.tsx
rm src/features/presenter/PresenterPage.OLD.tsx
```

---

### Task 4.2: Create Documentation

**File:** `src/ARCHITECTURE.md`

Document the new architecture with examples.

---

### Task 4.3: Final Testing

Test all scenarios:
- Create session
- Join as team
- Play full game
- Multiple teams
- Pause/resume
- End session

**Acceptance:** All features working, no regressions

---

## Final Validation Checklist

Before marking complete:
- [ ] All domain services implemented and tested
- [ ] Application hooks working
- [ ] All pages refactored
- [ ] Total LOC reduced by ~40%
- [ ] All features working
- [ ] No console errors
- [ ] Performance same or better
- [ ] Documentation complete
- [ ] All tests passing

---

## Expected Results

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Total LOC | 3,177 | 1,850 | 42% reduction |
| HostPage | 896 | 250 | 72% reduction |
| TeamPage | 1,261 | 300 | 76% reduction |
| PresenterPage | 420 | 150 | 64% reduction |
| Code Duplication | 30% | <5% | 83% reduction |
| Test Coverage | 20% | >80% | 300% increase |

---

## Troubleshooting

**If tests fail:**
- Check domain services are pure functions
- Verify no React imports in domain layer
- Check for circular dependencies

**If pages don't work:**
- Verify useGameState returns correct data
- Check orchestrator auto-advance logic
- Compare with old page behavior

**If stuck:**
- Document the blocker
- Move to next task
- Come back later

---

## Success Criteria

✅ Clean architecture implemented  
✅ Business logic isolated and testable  
✅ Code duplication eliminated  
✅ LOC reduced by 40%+  
✅ All features preserved  
✅ Performance maintained  
✅ Team can understand and modify code easily
