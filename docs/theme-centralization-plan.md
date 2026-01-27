# Theme Centralization Implementation Plan

## Overview
Refactor the app to use centralized theme-based styles instead of scattered inline styles, ensuring consistency across all views, phases, and components.

## Current State Analysis

### Existing Theme Structure
- ✅ Well-defined `theme.ts` with color palette
- ✅ `ThemeProvider` setting CSS custom properties
- ✅ Consistent `useTheme()` hook usage across components
- ❌ Many inline styles in AnswerPhase (lines 109-111, 115, 122, 130, 138-140, 143, 147, 160-164)
- ❌ Inline styles scattered in other phases

### Problem Areas in AnswerPhase
```typescript
// Line 109-111: Inline gradient and shadow
style={{ background: 'linear-gradient(...)', borderColor: '#22c55e', boxShadow: '...' }}

// Line 115: Inline background color
style={{ backgroundColor: '#22c55e' }}

// Line 160-164: Inline input styles
style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', color: '#ffffff', backdropFilter: 'blur(10px)' }}
```

## Implementation Steps

### 1. Extend theme.ts Interface
Add new theme sections:
- `answerPhase.promptCard` - Prompt display card styles
- `answerPhase.submittedCard` - Success state after submission
- `answerPhase.updateCard` - Update answer section
- `answerPhase.input` - Textarea input styles
- `answerPhase.timer` - Timer and progress bar styles

**Example additions:**
```typescript
answerPhase: {
  promptCard: {
    background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.4), rgba(59, 130, 246, 0.4))',
    border: 'rgba(6, 182, 212, 0.5)',
    text: '#f9a8d4',      // pink-300
    shadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
  },
  submittedCard: {
    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(34, 197, 94, 0.1))',
    border: '#22c55e',
    shadow: '0 0 30px rgba(34, 197, 94, 0.3), inset 0 1px 1px rgba(34, 197, 94, 0.2)',
    successBg: '#22c55e',
    successText: '#ffffff',
    updatedText: '#86efac', // green-300
  },
  updateCard: {
    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(51, 65, 85, 0.6))',
    border: 'rgba(6, 182, 212, 0.4)',
    shadow: 'inset 0 1px 1px rgba(138, 43, 226, 0.2), 0 10px 22px rgba(0, 0, 0, 0.6)',
    divider: '#06b6d4',
    heading: '#06b6d4',
  },
  input: {
    background: 'rgba(0, 0, 0, 0.3)',
    border: 'rgba(6, 182, 212, 0.3)',
    text: '#ffffff',
    placeholder: '#64748b', // slate-500
    focus: 'rgba(6, 182, 212, 0.2)',
  },
}
```

### 2. Update ThemeProvider CSS Variables
Add CSS custom properties for:
```typescript
--answer-prompt-bg
--answer-prompt-border
--answer-prompt-text
--answer-submitted-bg
--answer-submitted-border
--answer-input-bg
--answer-input-border
--answer-update-card-bg
--answer-update-card-border
```

**Implementation:**
```typescript
// In ThemeProvider useEffect
root.style.setProperty('--answer-prompt-bg', theme.colors.answerPhase.promptCard.background);
root.style.setProperty('--answer-prompt-border', theme.colors.answerPhase.promptCard.border);
root.style.setProperty('--answer-prompt-text', theme.colors.answerPhase.promptCard.text);
// ... etc for all new theme properties
```

### 3. Refactor AnswerPhase.tsx
Replace all inline `style={{...}}` with:
- Tailwind classes using theme colors
- CSS custom properties via `style` prop when needed
- Theme-based utility classes

**Before:**
```tsx
style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15)...)', borderColor: '#22c55e' }}
```

**After:**
```tsx
className="answer-submitted-card" // Uses theme CSS variables
```

**Specific replacements needed:**

1. **Prompt Card (lines 89-104):**
   ```tsx
   // Before
   style={{
     background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.4), rgba(59, 130, 246, 0.4))',
     borderColor: 'rgba(6, 182, 212, 0.5)'
   }}
   
   // After
   className="answer-prompt-card"
   ```

2. **Submitted Card (lines 107-134):**
   ```tsx
   // Before
   style={{
     background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(34, 197, 94, 0.1))',
     borderColor: '#22c55e',
     boxShadow: '0 0 30px rgba(34, 197, 94, 0.3), inset 0 1px 1px rgba(34, 197, 94, 0.2)'
   }}
   
   // After
   className="answer-submitted-card"
   ```

3. **Update Card (lines 136-203):**
   ```tsx
   // Before
   style={{
     background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(51, 65, 85, 0.6))',
     borderColor: 'rgba(6, 182, 212, 0.4)',
     boxShadow: 'inset 0 1px 1px rgba(138, 43, 226, 0.2), 0 10px 22px rgba(0, 0, 0, 0.6)'
   }}
   
   // After
   className="answer-update-card"
   ```

4. **Input Textarea (lines 151-165):**
   ```tsx
   // Before
   style={{
     backgroundColor: 'rgba(0, 0, 0, 0.3)',
     color: '#ffffff',
     backdropFilter: 'blur(10px)'
   }}
   
   // After
   className="answer-input"
   ```

### 4. Audit & Refactor Other Phases
Check for inline styles in:
- `VotePhase.tsx`
- `ResultsPhase.tsx`
- `CategorySelectPhase.tsx`
- `LobbyPhase.tsx`
- Host phases

**Audit checklist:**
- [ ] Search for `style={{` in all phase files
- [ ] Identify recurring patterns that should be in theme
- [ ] Create theme extensions for each phase if needed
- [ ] Refactor systematically

### 5. Create Theme Utility Classes
Add to global CSS or Tailwind config:

```css
/* Global CSS file: src/styles/theme-utilities.css */
.answer-prompt-card {
  background: var(--answer-prompt-bg);
  border: 2px solid var(--answer-prompt-border);
  box-shadow: var(--answer-prompt-shadow);
  color: var(--answer-prompt-text);
}

.answer-submitted-card {
  background: var(--answer-submitted-bg);
  border: 2px solid var(--answer-submitted-border);
  box-shadow: var(--answer-submitted-shadow);
}

.answer-update-card {
  background: var(--answer-update-card-bg);
  border: 2px solid var(--answer-update-card-border);
  box-shadow: var(--answer-update-card-shadow);
}

.answer-input {
  background: var(--answer-input-bg);
  border: 1px solid var(--answer-input-border);
  color: var(--answer-input-text);
  backdrop-filter: blur(10px);
}

.answer-input:focus {
  border-color: var(--answer-input-border-focus);
  box-shadow: 0 0 0 3px var(--answer-input-focus);
}
```

### 6. Documentation
Create `docs/styling-guide.md`:

```markdown
# Styling Guide

## Theme Structure
- All colors defined in `src/shared/theme.ts`
- CSS custom properties set in `ThemeProvider`
- Use `useTheme()` hook for dynamic styling

## When to Use Theme vs Inline Styles

### Use Theme For:
- Repeating color patterns
- Component-specific style sets
- Anything that should be consistent across the app

### Inline Styles Acceptable For:
- One-off positioning calculations
- Dynamic values (e.g., calculated heights)
- Browser-specific properties

## Adding New Theme Colors

1. Add to `ThemeColors` interface in `theme.ts`
2. Add values to `darkTheme.colors`
3. Add CSS custom properties in `ThemeProvider`
4. Create utility classes if needed
5. Update documentation

## Examples

### Good (Theme-based):
```tsx
<div className="answer-prompt-card">
```

### Bad (Inline):
```tsx
<div style={{ background: 'linear-gradient(...)', borderColor: '#22c55e' }}>
```

### Acceptable (Dynamic):
```tsx
<div style={{ height: calculatedHeight }}>
```
```

## Benefits

✅ **Single source of truth** - All colors/styles in one place
✅ **Easy theme updates** - Change once, apply everywhere
✅ **Consistency** - No color/style drift between components
✅ **Maintainability** - Clear patterns for developers
✅ **Type safety** - TypeScript interfaces for theme structure

## Migration Checklist

- [ ] Extend theme.ts interfaces
- [ ] Add CSS custom properties to ThemeProvider
- [ ] Refactor AnswerPhase.tsx
- [ ] Audit other phases for inline styles
- [ ] Create utility classes
- [ ] Update documentation
- [ ] Test all affected components
- [ ] Update any other components with similar patterns

## Timeline Estimate

- **Phase 1-2**: Theme extensions (2-3 hours)
- **Phase 3**: AnswerPhase refactor (1-2 hours)
- **Phase 4**: Other phases audit (2-3 hours)
- **Phase 5-6**: Utilities & documentation (1-2 hours)

**Total**: 6-10 hours

## Next Steps

1. Start with theme.ts extensions
2. Test with AnswerPhase as proof of concept
3. Apply pattern to other components
4. Establish documentation for team consistency
