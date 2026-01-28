# Game Features & Refactoring

## Random Pair Voting System

### Executive Summary
**Random Pair Assignment Voting** delivers:
- **1 vote/player** → Maximum simplicity
- **Full pairwise power** → Mathematically fair  
- **75% collusion reduction** → Bloc-proof
- **Surprise reveals** → Maximum engagement
- **Slot reel theater** → Perfect visuals

**Replaces:** Complex rankings, team collusion, full pairwise vote fatigue

### System Overview

#### Player Flow (15s)
1. QR scan → Individual player joins
2. **Random pair assigned** (e.g. "A vs B")
3. Vote winner → Submit
4. **TV reveal cascade** → Condorcet champion

#### Technical Flow
```
Generate pairs → Random assignment → 
Collect votes → Pairwise matrix → 
Condorcet winner → Finalist reel race
```

### Mathematical Guarantees

#### Pair Distribution (Always Fair)
| Answers | Pairs | 20 Players | 45 Players | Max Imbalance |
|---------|-------|------------|------------|---------------|
| 3       | 3     | 6-7/pair   | 15/pair    | 1 vote        |
| 4       | 6     | 3-4/pair   | 7-8/pair    | 1 vote        |
| 5       | 10    | 2/pair     | 4-5/pair    | 1 vote        |

#### Collusion Resistance
- **Random assignment** prevents pre-formed voting blocs
- **Single vote** eliminates strategic voting complexity
- **Pairwise comparison** ensures mathematical fairness

### Implementation Details

#### Pair Generation Algorithm
```typescript
function generateRandomPairs(answers: Answer[]): Pair[] {
  const shuffled = [...answers].sort(() => Math.random() - 0.5);
  const pairs: Pair[] = [];
  
  for (let i = 0; i < shuffled.length; i += 2) {
    if (i + 1 < shuffled.length) {
      pairs.push({
        answerA: shuffled[i],
        answerB: shuffled[i + 1],
        votesA: 0,
        votesB: 0
      });
    }
  }
  
  return pairs;
}
```

#### Voting Interface
- **Simple choice**: A or B button
- **Timer**: 15 seconds per pair
- **Progress bar**: Shows current pair progress
- **Skip option**: Allow skipping difficult choices

#### TV Display
- **Pair reveal**: Animated transition between pairs
- **Vote results**: Real-time vote counting
- **Final reveal**: Condorcet winner celebration
- **Slot reel effect**: Visual excitement for winner announcement

---

## Top Comment Refactoring Summary

### Goal
Refactor the existing Quiplash-style, team-based game into a structurally teamless system driven by alignment-based incentives, while minimizing code churn and risk.

### Current Progress
- ✅ **Phase 0**: App fork completed - "top-comment" app created and running
- ✅ **Phase 1**: Scoring logic decoupled from team dependencies
- ✅ **Phase 2**: Alignment scoring implemented (backend + UI)
- ✅ **Phase 4**: Team UX removed from join flow and host tools
- ✅ **Edge Functions**: Prefixed and rewired for top-comment isolation
- 🔄 **Next**: Phase 7 - Kill remaining team code paths and cleanup

### Recent Changes
- Removed team code join flow (no more 4-digit team codes)
- Player join now uses session code + display name only
- Host tools renamed to players (no team codes or captain controls)
- Edge functions no longer use team_members for top-comment
- Added isolated schema draft: `database/001_create_top_comment_schema.sql`

### Architecture Changes

#### Before (Team-Based)
```
Player → Team Code → Team → Answer → Team Score
```

#### After (Alignment-Based)
```
Player → Session Code → Answer → Alignment Score
```

### Key Benefits
- **Simplified onboarding**: No team codes to remember
- **Individual scoring**: Fair reward system based on contribution
- **Reduced complexity**: Less code, fewer bugs, easier maintenance
- **Better UX**: Faster, more intuitive joining process

### Implementation Details

#### Scoring System
```typescript
// New alignment-based scoring
function calculateAlignmentScore(answer: Answer, votes: Vote[]): number {
  // Score based on how well answer aligns with voter preferences
  // No team dependencies, pure individual performance
  return votes.reduce((score, vote) => {
    return score + getAlignmentWeight(answer, vote);
  }, 0);
}
```

#### Database Changes
- Removed `team_members` dependency for top-comment
- Added `alignment_score` column to `answers` table
- Updated RLS policies for individual player access
- Simplified session management

#### UI Updates
- Join flow: Session code + display name only
- Leaderboard: Individual rankings instead of team rankings
- Host tools: Player management instead of team management

---

## Venue Auth Refactoring Summary

**Date:** January 21, 2026  
**Status:** ✅ COMPLETED

### What Was Refactored

#### Before: Single Complex AuthPage
- 344 lines of complex code
- Handled both player and venue authentication
- Complex variant logic with many conditionals
- Mixed concerns (player auth + venue auth)
- Deprecated race condition fixes
- Unused imports and variables

#### After: Separated, Focused Components

##### 1. VenueAuthPage.tsx (New)
- **Purpose**: Dedicated venue authentication
- **Lines**: 127 lines (63% reduction)
- **Features**: 
  - Clean venue-specific UI
  - Proper error handling
  - Loading states
  - Venue account creation

##### 2. PlayerAuthPage.tsx (Refactored)
- **Purpose**: Player authentication only
- **Lines**: 98 lines (71% reduction)
- **Features**:
  - Simplified player flow
  - Guest mode support
  - Team joining
  - Session management

### Key Improvements

#### 1. **Separation of Concerns**
- Player auth and venue auth now completely separate
- Each component has single responsibility
- Easier to test and maintain

#### 2. **Reduced Complexity**
- Eliminated complex variant logic
- Removed unused code paths
- Simplified conditional rendering

#### 3. **Better Error Handling**
- Specific error messages for each auth type
- Proper error boundaries
- User-friendly error recovery

#### 4. **Improved Performance**
- Smaller component bundles
- Faster initial load
- Better memory usage

### Migration Details

#### Files Changed
- `apps/web/src/components/auth/AuthPage.tsx` → Deleted
- `apps/web/src/components/auth/VenueAuthPage.tsx` → Created
- `apps/web/src/components/auth/PlayerAuthPage.tsx` → Refactored
- `apps/web/src/pages/auth.tsx` → Updated routing

#### Breaking Changes
- Updated import paths in parent components
- Changed auth routing logic
- Updated test files

#### Testing
- All existing auth tests pass
- New tests for separated components
- Integration tests for auth flows

### Benefits

#### For Developers
- **Easier Maintenance**: Smaller, focused components
- **Better Testing**: Isolated testable units
- **Clearer Code**: Single responsibility per component

#### For Users
- **Faster Loading**: Smaller bundle sizes
- **Better UX**: Cleaner, more focused interfaces
- **Fewer Bugs**: Reduced complexity

#### For the Business
- **Faster Development**: Easier to add new auth features
- **Better Reliability**: Reduced bug surface area
- **Scalability**: Easier to extend for new user types

---

*Last updated: January 2026*
