# Answer Resubmission Feature - Implementation Guide

## Overview
This guide outlines the implementation of a "resubmit" feature that allows team members to change their answers during the answer phase before time expires.

## Design Decisions

### Time Validation Strategy: **Simple (Phase-Based)**
- **Decision**: Use existing phase validation only - no additional time windows
- **Rationale**: 
  - Current `validateSessionPhase(session, 'answer')` already prevents late submissions
  - Simpler implementation with less edge cases
  - Better UX - allows changes until host advances phase
  - No "unfairness" concerns since players can't see others' answers
- **Protection**: Existing `isSubmittingAnswer` loading state prevents rapid submissions

### Database Strategy: **UPSERT**
- **Decision**: Replace INSERT with UPSERT operation
- **Rationale**:
  - Allows both initial submission and updates with same endpoint
  - Simpler than separate create/update endpoints
  - Atomic operation prevents race conditions

### UI Strategy: **Inline Resubmit Form**
- **Decision**: Show resubmit form below submitted answer
- **Rationale**:
  - Clear visual hierarchy (submitted answer → update option)
  - Maintains context of what was submitted
  - No modal/navigation required

## Implementation Steps

### 1. Database Schema Update
**File**: Run as SQL migration in Supabase

**Changes**:
```sql
-- Add updated_at column to track answer modifications
ALTER TABLE answers 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

-- Set default for existing rows
UPDATE answers 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_answers_updated_at ON answers(updated_at);

-- Add unique constraint if not exists (required for UPSERT)
ALTER TABLE answers 
ADD CONSTRAINT answers_session_team_round_unique 
UNIQUE (session_id, team_id, round_index);
```

**Verification**:
- Check column exists: `\d answers`
- Verify constraint: Check for unique constraint on (session_id, team_id, round_index)

---

### 2. Backend - Update Answer Submission Function
**File**: `a:\Social\Social\supabase\functions\answers-submit\index.ts`

**Changes**: Replace lines 80-122 with UPSERT logic

**Key Changes**:
- Remove the "already exists" error throw
- Change INSERT to UPSERT with conflict resolution
- Add `updated_at` field to answer data
- Return `isUpdate` flag in response

**Testing**:
- Submit initial answer → should succeed
- Submit again with different text → should update
- Verify `updated_at` is set correctly
- Verify phase validation still works (try submitting in vote phase)

---

### 3. Frontend - Update Type Definitions
**File**: `a:\Social\Social\apps\event-platform\src\domain\types\domain.types.ts`

**Changes**: Add `updatedAt` field to Answer interface (line 75)

```typescript
export interface Answer {
  id: string;
  teamId: string;
  roundIndex: number;
  groupId: string;
  text: string;
  createdAt: string;
  updatedAt?: string; // ADD THIS LINE
  masked?: boolean;
}
```

**Testing**:
- TypeScript compilation should pass
- No type errors in components using Answer type

---

### 4. Frontend - Update Submit Handler
**File**: `a:\Social\Social\apps\event-platform\src\features\team\hooks\useTeamHandlers.ts`

**Changes**: Enhance `handleSubmitAnswer` function (lines 146-194)

**Key Changes**:
- Add better error handling for specific error types
- Handle `isUpdate` response from backend
- Update toast messages to distinguish create vs update

**Testing**:
- Initial submit shows "Answer locked in!"
- Resubmit shows "Answer updated!"
- Error handling works for phase-ended scenario

---

### 5. Frontend - Update UI Component
**File**: `a:\Social\Social\apps\event-platform\src\features\team\Phases\AnswerPhase.tsx`

**Changes**: Replace conditional rendering (lines 59-105) with enhanced version

**Key Changes**:
- When `myAnswer` exists, show both submitted answer AND resubmit form
- Add "Updated [timestamp]" indicator if answer was modified
- Disable "Update answer" button if text unchanged or empty
- Change button text to "Update answer" / "Updating..."
- Use secondary button variant for visual distinction

**Testing**:
- Initial state: Shows prompt + textarea + "Submit answer" button
- After submit: Shows submitted answer + resubmit form below
- Resubmit form has smaller textarea with current answer
- Button disabled when text matches current answer
- Button shows "Updating..." during submission
- Timestamp shows when answer was last updated

---

## Testing Checklist

### Backend Tests
- [ ] Initial answer submission works
- [ ] Resubmission updates existing answer
- [ ] `updated_at` field is populated correctly
- [ ] Phase validation prevents submission in wrong phase
- [ ] Profanity filter still works
- [ ] Character limit (200 chars) enforced
- [ ] Returns `isUpdate: true` for updates

### Frontend Tests
- [ ] Initial submission flow unchanged
- [ ] Resubmit UI appears after submission
- [ ] Button states work correctly (disabled/loading)
- [ ] Toast messages appropriate for create vs update
- [ ] Timestamp displays correctly for updated answers
- [ ] Character counter works in resubmit form
- [ ] Can't submit unchanged answer
- [ ] Loading state prevents double submissions

### Integration Tests
- [ ] Multiple team members can resubmit independently
- [ ] Resubmission works across different rounds
- [ ] Host advancing phase prevents further resubmissions
- [ ] Real-time updates show latest answer to other players
- [ ] Answer appears correctly in voting phase
- [ ] Leaderboard uses latest answer text

### Edge Cases
- [ ] Rapid clicking doesn't cause duplicate submissions
- [ ] Resubmitting with same text is prevented
- [ ] Resubmitting after phase change shows appropriate error
- [ ] Network errors handled gracefully
- [ ] Answer persists after page refresh

---

## Rollback Plan

If issues arise, rollback in reverse order:

1. **Revert UI changes** - restore original AnswerPhase.tsx
2. **Revert handler changes** - restore original useTeamHandlers.ts
3. **Revert backend** - restore INSERT logic with "already exists" check
4. **Keep database changes** - `updated_at` column is harmless if unused

---

## Performance Considerations

### Database Impact
- **Additional writes**: Minimal - only when users resubmit (expected to be <20% of submissions)
- **Index overhead**: One additional index on `updated_at` - negligible impact
- **Query performance**: UPSERT is atomic and fast with unique constraint

### Frontend Impact
- **Bundle size**: +~50 lines of code - negligible
- **Re-renders**: No additional re-renders - uses existing state
- **Network**: Same number of API calls (just allows more than one per round)

---

## Future Enhancements (Optional)

### Phase 2 Possibilities
1. **Resubmission counter**: Show "Updated 3 times" to discourage excessive changes
2. **Resubmission history**: Track all versions for analytics/moderation
3. **Time-based restrictions**: "Can't resubmit in last 10 seconds" if desired
4. **Visual indicator**: Show other team members when someone is updating their answer
5. **Undo button**: Quick revert to previous version

### Analytics to Track
- Resubmission rate (% of answers that get updated)
- Time between initial submit and resubmit
- Number of resubmissions per answer
- Impact on voting outcomes (do updated answers perform better?)

---

## Security Considerations

### Already Handled
- ✅ Phase validation prevents out-of-phase submissions
- ✅ Team membership validation ensures only team members can submit
- ✅ Profanity filter applied to all submissions
- ✅ Character limit enforced
- ✅ Loading state prevents rapid submissions

### No New Vulnerabilities
- UPSERT doesn't introduce SQL injection (using parameterized queries)
- No additional authentication required
- Same rate limiting as original submission

---

## Success Metrics

### User Experience
- Reduced frustration from typos/mistakes
- Increased answer quality (users can refine responses)
- No increase in support tickets about "can't change answer"

### Technical
- No increase in error rates
- Database performance remains stable
- No new bugs reported related to answer submission

---

## Implementation Timeline

**Estimated Time**: 2-3 hours total

1. **Database migration** (15 min)
   - Write and test migration
   - Run in staging
   - Verify schema changes

2. **Backend changes** (45 min)
   - Update answers-submit function
   - Test with Postman/curl
   - Deploy to staging

3. **Frontend changes** (60 min)
   - Update types
   - Update handler
   - Update UI component
   - Test locally

4. **Testing & QA** (30 min)
   - Run through test checklist
   - Test in staging environment
   - Fix any issues

5. **Deploy to production** (15 min)
   - Deploy backend function
   - Deploy frontend
   - Monitor for errors

---

## Questions to Resolve Before Implementation

1. **Database constraint**: Does the unique constraint already exist on answers table?
2. **UI placement**: Should resubmit form be collapsible/hidden by default?
3. **Analytics**: Do we want to track resubmission metrics?
4. **Notifications**: Should other team members see when someone updates their answer?

---

## Notes

- This is a **low-risk** change - worst case is reverting to original behavior
- The feature is **additive** - doesn't break existing functionality
- **No breaking changes** to API or database schema (only additions)
- Can be **feature-flagged** if desired for gradual rollout
