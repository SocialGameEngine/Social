# Implementation Plan: 6×7 Jeopardy Category Grid System

## 📋 Overview
Transform current jeopardy mode from 24-category selection to a curated 6-category × 7-prompt grid system with host selection.

---

## 🎯 Phase 1: Data Model & Types (Backend + Frontend)

### 1.1 Update Type Definitions
**Files to modify:**
- `a:\Social\Social\apps\event-platform\src\shared\types.ts`
- `a:\Social\Social\supabase\functions\_shared\types.ts`

**Changes:**
```typescript
// Replace categoryGrid structure
interface CategoryGrid {
  categories: Array<{
    id: string;           // e.g., "popculture"
    usedPrompts: number[]; // e.g., [0, 2, 5] - indices of used prompts
  }>;
  totalSlots: number;      // 42 (6 categories × 7 prompts)
}

// Add to SessionSettings
interface SessionSettings {
  selectedCategories?: string[]; // 6 category IDs chosen by host
  // ... existing fields
}
```

**Constraints:**
- Must maintain backward compatibility with existing sessions
- Type changes must be mirrored in both frontend and backend

---

## 🎯 Phase 2: Host Category Selection UI

### 2.1 Update CreateSessionModal
**File:** `a:\Social\Social\apps\event-platform\src\features\host\Phases\CreateSessionModal.tsx`

**Changes:**
1. Add category selection step for jeopardy mode
2. Multi-select grid showing all 24 categories
3. Validation: exactly 6 categories required
4. Visual feedback for selection count (e.g., "3/6 selected")

**UI Structure:**
```tsx
{gameMode === 'jeopardy' && (
  <div>
    <label>Select 6 Categories for This Game</label>
    <div className="grid grid-cols-3 gap-2">
      {allLibraries.map(lib => (
        <CategorySelectButton
          key={lib.id}
          library={lib}
          selected={selectedCategories.includes(lib.id)}
          onToggle={() => toggleCategory(lib.id)}
          disabled={selectedCategories.length >= 6 && !selectedCategories.includes(lib.id)}
        />
      ))}
    </div>
    <p>{selectedCategories.length}/6 categories selected</p>
  </div>
)}
```

**Constraints:**
- Must load all 24 prompt libraries using `usePromptLibraries` hook
- Handle loading/error states
- Disable "Create Game" button until 6 categories selected

### 2.2 Update Host State Management
**File:** `a:\Social\Social\apps\event-platform\src\features\host\hooks\useHostState.ts`

**Changes:**
```typescript
createForm: {
  // ... existing fields
  selectedCategories: [] as string[],
}
```

---

## 🎯 Phase 3: Backend Session Creation

### 3.1 Update sessions-create Function
**File:** `a:\Social\Social\supabase\functions\sessions-create\index.ts`

**Changes:**
1. Accept `selectedCategories` array from request
2. Initialize new categoryGrid structure:
```typescript
if (mode === 'jeopardy') {
  const selectedCats = selectedCategories || allLibraryIds.slice(0, 6);
  categoryGrid = {
    categories: selectedCats.map(id => ({
      id,
      usedPrompts: [],
    })),
    totalSlots: 42,
  };
}
```
3. Store `selectedCategories` in session settings

**Constraints:**
- Validate selectedCategories array (length === 6, all valid IDs)
- Fallback to default 6 if not provided (backward compatibility)

### 3.2 Update sessions-start Function
**File:** `a:\Social\Social\supabase\functions\sessions-start\index.ts`

**Changes:**
- Remove old category grid initialization logic
- Verify categoryGrid exists before starting jeopardy mode
- No changes to selectingTeamId logic (already working)

---

## 🎯 Phase 4: Category Selection Logic

### 4.1 Update CategoryGrid Component
**File:** `a:\Social\Social\apps\event-platform\src\shared\components\CategoryGrid.tsx`

**Changes:**
1. Display only the 6 selected categories
2. Show 7 prompt indicators per category (dots/squares)
3. Visual states:
   - Available prompts: green/active
   - Used prompts: gray/crossed out
   - Selected category: highlighted
4. Grid layout: 3×2 on mobile, 6×1 or 2×3 on desktop

**Component Props:**
```typescript
interface CategoryGridProps {
  libraries: PromptLibrary[];
  categoryGrid: CategoryGrid;
  selectedCategories: string[]; // NEW: filter to these 6
  onSelect?: (categoryId: string) => void;
  disabled?: boolean;
  canSelect?: boolean;
}
```

**Constraints:**
- Must filter libraries to only show selected 6
- Calculate remaining prompts: 7 - usedPrompts.length
- Disable categories with 0 remaining prompts

### 4.2 Update sessions-select-category Function
**File:** `a:\Social\Social\supabase\functions\sessions-select-category\index.ts`

**Changes:**
1. Find category in categoryGrid.categories
2. Get available prompt index (0-6, excluding usedPrompts)
3. Fetch prompt from library at that index
4. Update categoryGrid:
```typescript
const category = categoryGrid.categories.find(c => c.id === categoryId);
const availableIndices = [0,1,2,3,4,5,6].filter(i => !category.usedPrompts.includes(i));
const selectedIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];

// Get prompt
const library = await getPromptLibrary(categoryId);
const prompt = library.prompts[selectedIndex];

// Update grid
category.usedPrompts.push(selectedIndex);
```

**Constraints:**
- Handle case where category has no remaining prompts (shouldn't happen with UI validation)
- Ensure prompt index is within bounds of library.prompts array

---

## 🎯 Phase 5: Display Updates

### 5.1 Update CategorySelectPhase (Host)
**File:** `a:\Social\Social\apps\event-platform\src\features\host\Phases\CategorySelectPhase.tsx`

**Changes:**
1. Pass `selectedCategories` from session.settings to CategoryGrid
2. Update display to show prompt counts per category
3. Add visual indicator of game progress (e.g., "18/42 prompts used")

### 5.2 Update CategorySelectPhase (Team)
**File:** `a:\Social\Social\apps\event-platform\src\features\team\Phases\CategorySelectPhase.tsx`

**Changes:**
1. Pass `selectedCategories` to CategoryGrid
2. Show remaining prompts per category
3. Disable categories with 0 remaining prompts

---

## 🎯 Phase 6: Utility Functions

### 6.1 Create Category Grid Helpers
**File:** `a:\Social\Social\apps\event-platform\src\shared\utils\categoryGrid.ts`

**Update existing functions:**
```typescript
export function getRemainingPrompts(categoryGrid: CategoryGrid, categoryId: string): number {
  const category = categoryGrid.categories.find(c => c.id === categoryId);
  return category ? 7 - category.usedPrompts.length : 0;
}

export function isCategoryAvailable(categoryGrid: CategoryGrid, categoryId: string): boolean {
  return getRemainingPrompts(categoryGrid, categoryId) > 0;
}

export function getTotalRemainingPrompts(categoryGrid: CategoryGrid): number {
  return categoryGrid.categories.reduce((sum, cat) => 
    sum + (7 - cat.usedPrompts.length), 0
  );
}
```

---

## 🎯 Phase 7: Migration & Testing

### 7.1 Database Migration
**File:** Create `a:\Social\Social\supabase\migrations\20260109000002_update_category_grid_structure.sql`

```sql
-- No schema changes needed - category_grid is JSONB
-- Just document the new structure
COMMENT ON COLUMN sessions.category_grid IS 'Jeopardy mode category grid: { categories: [{ id: string, usedPrompts: number[] }], totalSlots: number }';
```

### 7.2 Testing Checklist
- [ ] Host can select 6 categories in create modal
- [ ] Session creates with correct categoryGrid structure
- [ ] Teams see only 6 selected categories
- [ ] Prompt selection works and tracks used prompts
- [ ] Categories show correct remaining prompt counts
- [ ] Categories disable when all 7 prompts used
- [ ] Skip to Answers works with new structure
- [ ] Multiple rounds work correctly
- [ ] Backward compatibility with old sessions

---

## 🚨 Risk Mitigation

### Breaking Changes
- **Old sessions**: May have old categoryGrid structure
- **Solution**: Add migration logic in mapSession to handle both formats

### Edge Cases
1. **Category has < 7 prompts**: Validate library has enough prompts
2. **All categories exhausted**: Should end game or allow reuse
3. **Invalid category IDs**: Validate against available libraries

### Rollback Plan
- Keep old categoryGrid logic as fallback
- Add feature flag: `useNewCategoryGrid`
- Can disable via settings if issues arise

---

## 📦 Implementation Order

1. **Types** (Phase 1) - Foundation for everything
2. **Backend** (Phase 3) - Data structure and storage
3. **Utilities** (Phase 6) - Helper functions
4. **UI Components** (Phase 4) - Category grid display
5. **Host Selection** (Phase 2) - Category picker
6. **Phase Updates** (Phase 5) - Integrate into game flow
7. **Testing** (Phase 7) - Validate everything works

---

## ⏱️ Estimated Effort
- **Phase 1-3**: 30 minutes (types + backend)
- **Phase 4**: 45 minutes (category grid component)
- **Phase 5-6**: 30 minutes (phase updates + utilities)
- **Phase 7**: 30 minutes (testing + fixes)
- **Total**: ~2.5 hours
