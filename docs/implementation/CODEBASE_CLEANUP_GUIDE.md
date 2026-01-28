# Codebase Cleanup & Refactoring Guide

**Last Updated:** January 20, 2026  
**Status:** Analysis Complete - Ready for Implementation

---

## Executive Summary

This guide identifies **critical issues, code duplication, and technical debt** across the Social codebase, with prioritized fixes and implementation steps. Total estimated effort: **~3-5 days**.

### Key Findings
- ✅ **13 disabled migrations** (12 can be safely deleted)
- 🔴 **3 instances of duplicate `generateCategoryBonuses` function**
- 🔴 **2 completely separate auth provider implementations**
- 🔴 **Race conditions in venue account sync logic**
- 🔴 **Duplicate venue verification logic across 3 functions**
- 🟡 **Inconsistent error handling patterns**
- 🟡 **Type mismatches (UUID vs TEXT)**

---

## 🚨 Critical Issues (Fix First)

### 1. Disabled Database Migrations
**Impact:** Confusion, deployment risk, storage waste
**Files:** 13 `.disabled` migration files
**Effort:** 1 hour
**Priority:** HIGH

#### Actions Required
```bash
# Safe to delete (12 files)
rm supabase/migrations/*.disabled

# Keep this one (contains important notes)
# supabase/migrations/20260108000002_add_venue_accounts_and_staff.sql.disabled
```

### 2. Duplicate Scoring Functions
**Impact:** Maintenance nightmare, potential inconsistencies
**Files:** 
- `apps/event-platform/src/shared/RoundManager.ts`
- `apps/web/src/shared/RoundManager.ts` 
- `packages/game-engine/src/scoring.ts`
**Effort:** 2 hours
**Priority:** HIGH

#### Solution
1. Create single source of truth in `packages/game-engine/src/scoring.ts`
2. Update imports in both apps
3. Add unit tests for scoring logic

### 3. Auth Provider Duplication
**Impact:** 344 lines of duplicate code, maintenance overhead
**Files:**
- `apps/web/src/providers/AuthProvider.tsx` (344 lines)
- `apps/event-platform/src/providers/AuthProvider.tsx` (298 lines)
**Effort:** 4 hours
**Priority:** HIGH

#### Solution
1. Extract shared auth logic to `packages/ui/src/providers/AuthProvider.tsx`
2. Create app-specific wrappers for unique features
3. Update all imports

---

## 🔴 High Priority Issues

### 4. Race Conditions in Venue Account Sync
**Impact:** Authentication hangs, poor user experience
**Files:** Multiple auth-related files
**Effort:** 3 hours
**Priority:** HIGH

#### Current Issues
```typescript
// Problem: Non-blocking venue account loading
const venueAccount = await fetchVenueAccount(user.id);
// This can hang and block entire auth flow
```

#### Solution
```typescript
// Fix: Non-blocking with timeout
const venueAccount = await Promise.race([
  fetchVenueAccount(user.id),
  new Promise(resolve => setTimeout(resolve, 5000, null))
]);
```

### 5. Duplicate Venue Verification Logic
**Impact:** Code duplication, inconsistent behavior
**Files:** 3+ files with similar venue verification
**Effort:** 2 hours
**Priority:** HIGH

#### Solution
1. Create `packages/db/src/venue-verification.ts`
2. Consolidate all verification logic
3. Update all call sites

---

## 🟡 Medium Priority Issues

### 6. Inconsistent Error Handling
**Impact:** Poor user experience, debugging difficulty
**Files:** Throughout codebase
**Effort:** 4 hours
**Priority:** MEDIUM

#### Standardization Required
```typescript
// Standard error format
interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

// Standard error handler
export const handleError = (error: AppError) => {
  console.error(`[${error.code}] ${error.message}`, error.details);
  // Show user-friendly message
  toast.error(error.message);
};
```

### 7. Type Mismatches (UUID vs TEXT)
**Impact:** Runtime errors, TypeScript warnings
**Files:** Database schema + TypeScript types
**Effort:** 2 hours
**Priority:** MEDIUM

#### Issues Found
- `user_id` is UUID in some tables, TEXT in others
- `session_id` inconsistencies
- Missing `venue_accounts` table types

#### Solution
1. Audit all database tables for type consistency
2. Update TypeScript types to match schema
3. Add validation at database level

---

## 📋 Implementation Plan

### Day 1: Critical Cleanup (6 hours)
1. **Morning (3 hours)**
   - Delete disabled migrations
   - Fix duplicate scoring functions
   - Update imports and tests

2. **Afternoon (3 hours)**
   - Start auth provider consolidation
   - Create shared auth package
   - Update first app

### Day 2: Auth & Race Conditions (6 hours)
1. **Morning (3 hours)**
   - Complete auth provider consolidation
   - Update second app
   - Test auth flows

2. **Afternoon (3 hours)**
   - Fix venue account race conditions
   - Add proper timeouts and error handling
   - Test authentication thoroughly

### Day 3: Code Deduplication (6 hours)
1. **Morning (3 hours)**
   - Consolidate venue verification logic
   - Create shared verification package
   - Update all call sites

2. **Afternoon (3 hours)**
   - Standardize error handling patterns
   - Create error handling utilities
   - Update error-prone areas

### Day 4: Type System & Testing (6 hours)
1. **Morning (3 hours)**
   - Fix UUID vs TEXT mismatches
   - Update TypeScript types
   - Add database constraints

2. **Afternoon (3 hours)**
   - Add comprehensive tests
   - Update existing tests
   - Verify all functionality

### Day 5: Final Review & Documentation (4 hours)
1. **Review all changes**
2. **Update documentation**
3. **Performance testing**
4. **Deployment preparation**

---

## 🎯 Success Metrics

### Code Quality Improvements
- **Lines of code reduced**: ~500 lines
- **Duplicate functions eliminated**: 6+
- **TypeScript warnings**: 0
- **Test coverage**: 85%+

### Performance Improvements
- **Bundle size reduced**: 15%
- **Initial load time**: 20% faster
- **Authentication speed**: 50% faster
- **Error rate**: 90% reduction

### Developer Experience
- **Build time**: 25% faster
- **Hot reload**: More reliable
- **Debugging**: Easier with consistent patterns
- **Onboarding**: Simpler for new developers

---

## 🔄 Maintenance Plan

### Weekly
- **Code review**: Check for new duplications
- **Type checking**: Ensure no new type mismatches
- **Test coverage**: Maintain 85%+ coverage

### Monthly
- **Dependency updates**: Keep packages current
- **Performance audit**: Check bundle sizes and load times
- **Security review**: Audit auth and data access patterns

### Quarterly
- **Architecture review**: Assess overall code structure
- **Technical debt assessment**: Identify new issues
- **Refactoring planning**: Schedule cleanup tasks

---

## 📚 Resources

### Tools
- **TypeScript**: Strict mode enabled
- **ESLint**: Custom rules for consistency
- **Prettier**: Standardized formatting
- **Husky**: Pre-commit hooks for quality

### Documentation
- **Code standards**: `docs/development/standards.md`
- **Architecture**: `docs/architecture/overview.md`
- **Database**: `docs/database/schema.md`

### Testing
- **Unit tests**: Jest + React Testing Library
- **Integration tests**: Cypress
- **E2E tests**: Playwright
- **Performance tests**: Lighthouse CI

---

*Last updated: January 20, 2026*
