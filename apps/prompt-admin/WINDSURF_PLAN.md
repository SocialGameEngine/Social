# prompt-admin — Implementation Plan for Windsurf SWE 1.5

**Project:** `a:\Social\Social\apps\prompt-admin`  
**Consumer app:** `a:\Social\Social\apps\top-comment`  
**Supabase migrations:** `a:\Social\Social\supabase\migrations\`

This plan fixes bugs, refactors for correctness and maintainability, rewrites the AI prompt generator templates, and adds UX improvements. Work through phases in order — later phases depend on earlier ones.

---

## Phase 1 — Critical Bug Fixes

These are active bugs causing wrong behavior right now. Fix them first, in order.

---

### Task 1.1 — Fix query key inconsistency (cache never updates)

**Problem:** `TriviaLibraryList.tsx` invalidates `['trivia_packs']` on create/update, but `App.tsx` queries under `['trivia_libraries']`. These are different React Query cache keys. Creating or editing a trivia library in the sidebar never refreshes the main list.

**Files:**
- `src/components/TriviaLibraryList.tsx` — lines 42 and 57

**Fix:** Change both `queryKey: ['trivia_packs']` references to `queryKey: ['trivia_libraries']`.

```ts
// BEFORE (line 42):
await queryClient.invalidateQueries({ queryKey: ['trivia_packs'] });

// AFTER:
await queryClient.invalidateQueries({ queryKey: ['trivia_libraries'] });
```

Apply the same fix at line 57. Do not rename the query key in `App.tsx` — that is the canonical key.

---

### Task 1.2 — Fix TriviaLibraryForm infinite "Saving..." state

**Problem:** In `src/components/TriviaLibraryForm.tsx`, `setSubmitting(false)` is only called in the `catch` block, never on success. After a successful save, the submit button is stuck in "Saving..." and the form becomes unresponsive.

**File:** `src/components/TriviaLibraryForm.tsx`

**Fix:** Add `setSubmitting(false)` in the `try` block after `await onSubmit(...)` succeeds.

```ts
// BEFORE:
try {
  await onSubmit({ name: name.trim(), description: description.trim() });
} catch (err) {
  setError(getErrorMessage(err, 'Failed to save library'));
  setSubmitting(false);
}

// AFTER:
try {
  await onSubmit({ name: name.trim(), description: description.trim() });
  setSubmitting(false);
} catch (err) {
  setError(getErrorMessage(err, 'Failed to save library'));
  setSubmitting(false);
}
```

---

### Task 1.3 — Wire up real trivia pack question counts

**Problem:** `App.tsx` lines 91–94 hardcode `questionCount: 0`, `publishedCount: 0`, `draftCount: 0` for every trivia pack. The sidebar always shows "0 questions". The function `getTriviaPackWithCounts` already exists in `triviaDatabase.ts` (lines 23–50) and returns real counts.

**File:** `src/App.tsx` — `triviaLibrariesQuery` function

**Fix:** Replace the manual mapping with a call to `getTriviaPackWithCounts` per pack. Also import the function.

```ts
// Add to import from './services/triviaDatabase':
import {
  createTriviaPack,
  deleteTriviaPack,
  getTriviaPacks,
  getTriviaPackWithCounts,   // ADD THIS
  updateTriviaPack,
} from './services/triviaDatabase';

// Replace the triviaLibrariesQuery queryFn:
queryFn: async (): Promise<TriviaQuestionPackWithCounts[]> => {
  const packs = await getTriviaPacks();
  return Promise.all(packs.map(pack => getTriviaPackWithCounts(pack.id).then(p => p!)));
},
```

---

### Task 1.4 — Fix editingTriviaLibrary type (`any` → proper type)

**Problem:** `App.tsx` line 56 types `editingTriviaLibrary` as `any`. The correct type is `TriviaQuestionPack` (already imported in the file via `TriviaQuestionPackWithCounts`).

**File:** `src/App.tsx` line 55–56

**Fix:**
```ts
// Add to imports:
import type { TriviaQuestionPackWithCounts, TriviaQuestionPack } from './types/trivia';

// Change:
const [editingTriviaLibrary, setEditingTriviaLibrary] = useState<any>(null);
// To:
const [editingTriviaLibrary, setEditingTriviaLibrary] = useState<TriviaQuestionPack | null>(null);
```

---

## Phase 2 — Refactoring

Do not begin Phase 2 until all Phase 1 tasks are complete and verified working.

---

### Task 2.1 — Create a queryKeys factory module

**Problem:** Query cache keys are string literals scattered across files. A single typo causes silent cache misses (as happened with Task 1.1). Centralizing them prevents this class of bug entirely.

**Create new file:** `src/lib/queryKeys.ts`

```ts
export const queryKeys = {
  libraries: () => ['libraries'] as const,
  prompts: (libraryId: string) => ['prompts', libraryId] as const,
  triviaLibraries: () => ['trivia_libraries'] as const,
  triviaQuestions: (packId: string) => ['trivia_questions', packId] as const,
  ambientRounds: () => ['ambient_rounds'] as const,
} as const;
```

**Then update every file that uses raw string query keys to import and use `queryKeys.*` instead.** Files to update:
- `src/App.tsx`
- `src/components/TriviaLibraryList.tsx`
- `src/components/TriviaQuestionList.tsx`
- `src/components/AmbientRoundList.tsx`
- `src/components/PromptList.tsx`
- `src/components/LibraryList.tsx`

Do not change the underlying string values — only replace raw string literals with `queryKeys.*` calls.

---

### Task 2.2 — Fix N+1 queries in getTriviaQuestions

**Problem:** `src/services/triviaDatabase.ts` function `getTriviaQuestions` (line 92) makes 3 sequential round trips: one for questions, one for all options, one for all aliases. For a pack with 200 questions this is slow. Supabase supports nested selects that resolve this in a single request.

**File:** `src/services/triviaDatabase.ts`

**Fix:** Replace the three-query pattern with a single nested select:

```ts
export async function getTriviaQuestions(packId: string): Promise<TriviaQuestionWithDetails[]> {
  const { data, error } = await supabase
    .from('trivia_questions')
    .select(`
      *,
      options:trivia_question_options ( * ),
      aliases:trivia_question_aliases ( * )
    `)
    .eq('pack_id', packId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(row => ({
    ...row,
    options: row.options ?? [],
    aliases: row.aliases ?? [],
  }));
}
```

Note: the nested keys `options` and `aliases` match the aliases set in the select. Verify these match the actual FK relationship names in Supabase — if the relationship names differ, adjust the nested select keys accordingly.

---

### Task 2.3 — Remove duplicate mutations from TriviaLibraryList

**Problem:** `TriviaLibraryList.tsx` owns its own `createMutation` and `updateMutation` that duplicate the mutations already in `App.tsx`. The component already receives `onDelete` and `onEdit` callbacks from the parent but doesn't use them for create/update — it handles those itself. This creates two separate code paths for the same operations.

**Fix strategy:** Make `TriviaLibraryList` fully controlled. Remove its internal mutations and instead accept `onCreate` and `onUpdate` callbacks from `App.tsx`, the same pattern used for `onDelete` and `onEdit`.

**File:** `src/components/TriviaLibraryList.tsx`

1. Add `onCreate` and `onUpdate` to the `Props` interface:
```ts
interface Props {
  libraries: TriviaQuestionPackWithCounts[];
  selectedLibraryId: string | null;
  onSelect: (id: string) => void;
  onCreate: (data: { name: string; description: string }) => Promise<void>;
  onUpdate: (data: { name: string; description: string }) => Promise<void>;
  onDelete: (id: string) => void;
  onEdit: (library: TriviaQuestionPack) => void;
}
```

2. Remove `createMutation`, `updateMutation`, `useQueryClient`, and `useQuery` imports.
3. Wire `handleCreateLibrary` → `onCreate`, `handleUpdateLibrary` → `onUpdate`.
4. Remove the `useQuery` import (it is imported but never used).

**File:** `src/App.tsx`

Pass the mutations down:
```tsx
<TriviaLibraryList
  libraries={triviaLibraries}
  selectedLibraryId={selectedTriviaLibraryId}
  onSelect={setSelectedTriviaLibraryId}
  onCreate={async (data) => { await createTriviaPack({...}); await queryClient.invalidateQueries(...); }}
  onUpdate={async (data) => { /* existing update logic */ }}
  onDelete={handleDeleteTriviaLibrary}
  onEdit={setEditingTriviaLibrary}
/>
```

---

### Task 2.4 — Add a lightweight toast notification system

**Problem:** All error and success feedback uses `alert()`, which blocks the thread and is visually jarring. The app needs non-blocking feedback.

**Do not install a toast library.** Implement a minimal self-contained one.

**Create new file:** `src/components/Toast.tsx`

```tsx
import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

let toastId = 0;
const listeners = new Set<(t: ToastMessage) => void>();

export function showToast(message: string, type: ToastType = 'info') {
  const toast = { id: ++toastId, message, type };
  listeners.forEach(fn => fn(toast));
}

export function Toast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handler = (t: ToastMessage) => {
      setToasts(prev => [...prev, t]);
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), 4000);
    };
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  if (!toasts.length) return null;

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding: '10px 16px',
          borderRadius: 6,
          color: 'white',
          fontSize: 14,
          maxWidth: 320,
          background: t.type === 'success' ? '#059669' : t.type === 'error' ? '#dc2626' : '#2563eb',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
```

**Mount it in `src/App.tsx`:** Add `<Toast />` at the bottom of the root JSX (inside the outermost div, after all tabs).

**Then replace every `alert(...)` call** in all components with `showToast(message, 'error')` or `showToast(message, 'success')`. Files to update:
- `src/App.tsx`
- `src/components/TriviaLibraryList.tsx`
- `src/components/TriviaQuestionList.tsx`
- `src/components/TriviaBulkImport.tsx`
- `src/components/BulkImport.tsx`
- `src/components/AmbientRoundList.tsx`
- Any other component with `alert()` calls

---

### Task 2.5 — Add accepted_answers sync to the service layer

**Problem:** `trivia_questions.accepted_answers TEXT[]` (added in migration `20260403020000`) is a denormalized copy of `trivia_question_aliases`. When the UI creates, updates, or deletes aliases, `accepted_answers` must stay in sync or top-comment's answer validation will use stale data.

**File:** `src/services/triviaDatabase.ts`

After any alias mutation (create or delete), add a sync step that rebuilds `accepted_answers` for that question:

```ts
async function syncAcceptedAnswers(questionId: string): Promise<void> {
  const { data: aliases, error } = await supabase
    .from('trivia_question_aliases')
    .select('alias_text')
    .eq('question_id', questionId);

  if (error) throw error;

  const accepted_answers = (aliases ?? []).map(a => a.alias_text);
  
  const { error: updateError } = await supabase
    .from('trivia_questions')
    .update({ accepted_answers })
    .eq('id', questionId);

  if (updateError) throw updateError;
}
```

Call `await syncAcceptedAnswers(alias.question_id)` at the end of `createTriviaAlias` and `deleteTriviaAlias`.

Also call it in `replaceTriviaQuestions` when writing aliases during bulk import — after all aliases for a question are inserted, sync that question's `accepted_answers`.

---

## Phase 3 — AI Prompt Generator Rewrite

The three prompt templates in `AIPromptGenerator.tsx` produce valid JSON but mediocre content. Rewrite each template to produce higher-quality, more varied, and better-specified output.

Do all three rewrites in `src/components/AIPromptGenerator.tsx` within the `generatePrompt()` function.

---

### Task 3.1 — Add missing UI controls before rewriting templates

The trivia generator needs two new configuration fields that don't exist yet:

1. **Format ratio** (multiple choice vs written answer) — new `formData` field: `triviaFormatRatio`, options: `'all_mc' | '80_mc_20_written' | '60_mc_40_written' | '50_50'`
2. **Difficulty distribution** — new `formData` field: `difficultyDist`, options: `'pyramid' | 'even' | 'easy_heavy' | 'hard_heavy'`

Add these to `formData` state initial values and render both selects inside the `type === 'trivia'` block, below the existing format selector.

---

### Task 3.2 — Rewrite the prompts (social game) template

Replace the `type === 'prompts'` branch in `generatePrompt()` with:

```ts
const promptTypeLabels = {
  open_ended: 'open-ended personal sharing prompts',
  would_you_rather: '"Would You Rather" prompts',
  this_or_that: '"This or That" prompts',
};

const promptTypeExamples = {
  open_ended: `GOOD: "What's a decision you made that seemed small at the time but changed everything?"
BAD: "What is your favorite memory?" — too generic, everyone answers the same way`,
  would_you_rather: `GOOD: "Would you rather know the exact date of your death or never know?"
BAD: "Would you rather eat pizza or pasta?" — no real tension, no interesting debate`,
  this_or_that: `GOOD: "Morning person or night owl — and has that ever cost you something?"
BAD: "Coffee or tea?" — too shallow, generates no conversation`,
};

const topicContext = formData.tags.length > 0
  ? `Focus areas: ${formData.tags.join(', ')}`
  : `Spread across: travel, childhood, ambitions, relationships, food, work, fears, creativity, and money`;

const prompt = `Generate ${formData.count} ${promptTypeLabels[formData.promptType as keyof typeof promptTypeLabels]} for a social party game played by groups of 5–20 people.

GAME CONTEXT: Players see a prompt on screen and submit their most creative or honest answer. The room votes on their favorite. Prompts that generate wildly different answers between players are the most fun.

EXAMPLES OF GOOD VS BAD:
${promptTypeExamples[formData.promptType as keyof typeof promptTypeExamples]}

REQUIREMENTS:
- Every prompt must be distinct — no two should share the same theme, subject, or sentence structure
- Vary the emotional register: mix funny, nostalgic, thought-provoking, and playful
- Each prompt must be completable in under 60 seconds of thought
- Avoid prompts that have an obvious "right answer" — the best prompts have no correct response
- Keep all prompts family-friendly and inclusive across ages 16–70
- Write conversationally, as if spoken aloud in a group setting
- Length: 1–2 sentences maximum per prompt

${topicContext}

OUTPUT: Return a JSON array only. No markdown, no commentary, no code fences.
[
  {"text": "prompt text here"},
  {"text": "prompt text here"}
]`;
```

---

### Task 3.3 — Rewrite the trivia template

Replace the `type === 'trivia'` branch in `generatePrompt()` with:

```ts
const formatRatioMap = {
  all_mc: { mc: parseInt(formData.count), written: 0 },
  '80_mc_20_written': { mc: Math.round(parseInt(formData.count) * 0.8), written: Math.round(parseInt(formData.count) * 0.2) },
  '60_mc_40_written': { mc: Math.round(parseInt(formData.count) * 0.6), written: Math.round(parseInt(formData.count) * 0.4) },
  '50_50': { mc: Math.round(parseInt(formData.count) * 0.5), written: Math.round(parseInt(formData.count) * 0.5) },
};

const difficultyMap = {
  pyramid: '20% easy, 60% medium, 20% hard',
  even: '33% easy, 33% medium, 33% hard',
  easy_heavy: '50% easy, 35% medium, 15% hard',
  hard_heavy: '15% easy, 35% medium, 50% hard',
};

const ratio = formatRatioMap[formData.triviaFormatRatio as keyof typeof formatRatioMap] ?? formatRatioMap['80_mc_20_written'];
const totalCount = parseInt(formData.count);
const categoryFocus = formData.tags.length > 0
  ? `CATEGORY FOCUS: Prioritize these topics: ${formData.tags.join(', ')}. Still use the standard category_key values listed below.`
  : `CATEGORY SPREAD: Distribute questions across at least 6 of these categories: geography, history, science, pop_culture, music, food_drink, sport, wordplay, tech, nature`;

const prompt = `Generate ${totalCount} trivia questions for a live group trivia game.

FORMAT SPLIT: ${ratio.mc} multiple_choice questions, ${ratio.written} written_answer questions
DIFFICULTY: ${difficultyMap[formData.difficultyDist as keyof typeof difficultyMap] ?? difficultyMap.pyramid}
${categoryFocus}

QUALITY REQUIREMENTS:
- Questions must be factually verifiable — no opinion, no ambiguity
- Wrong options for multiple_choice must be plausible enough to fool someone who half-knows the topic. Avoid obviously silly distractors.
- For written_answer: aliases must cover all reasonable variations — uppercase, lowercase, common abbreviations, alternate spellings, and obvious short forms. Minimum 5 aliases per question.
- Avoid questions where the answer is given away in the question text
- Vary sentence structure — don't start every question with "What is..."
- Explanations should add an interesting fact beyond just restating the answer
- Do not generate questions about Paris being the capital of France, the boiling point of water, or any other trivia cliché used as examples in textbooks

EXAMPLE MULTIPLE CHOICE (follow this schema exactly):
{
  "format": "multiple_choice",
  "category_key": "history",
  "difficulty": "medium",
  "prompt": "Which empire controlled the spice trade routes to Southeast Asia before the Portuguese arrived in the 1500s?",
  "explanation": "The Ottoman Empire's control of overland spice routes was the primary reason European powers sought sea routes to Asia, directly triggering the Age of Exploration.",
  "hint": "Think about who controlled the Middle East and Mediterranean trade in the 1400s",
  "tags": ["trade", "exploration", "ottoman"],
  "options": [
    {"option_id": "a", "option_text": "The Mongol Empire", "is_correct": false},
    {"option_id": "b", "option_text": "The Ottoman Empire", "is_correct": true},
    {"option_id": "c", "option_text": "The Byzantine Empire", "is_correct": false},
    {"option_id": "d", "option_text": "The Mamluk Sultanate", "is_correct": false}
  ]
}

EXAMPLE WRITTEN ANSWER (follow this schema exactly):
{
  "format": "written_answer",
  "category_key": "science",
  "difficulty": "easy",
  "prompt": "What element has the atomic symbol Fe?",
  "explanation": "Fe comes from 'Ferrum', the Latin word for iron. Many element symbols derive from Latin or Greek names rather than their English names.",
  "hint": "The symbol comes from its Latin name",
  "tags": ["chemistry", "periodic-table"],
  "aliases": ["Iron", "iron", "IRON", "Fe", "fe", "FE"]
}

OUTPUT: Return a JSON array only. No markdown, no commentary, no code fences. All ${totalCount} questions in one array.`;
```

---

### Task 3.4 — Rewrite the ambient rounds template

The current template has a structural bug: it describes round format in a YAML-like text block AND then gives a JSON example. The AI receives contradictory format instructions. Remove the text description entirely — the JSON schema alone is sufficient.

Replace the entire `type === 'ambient'` branch in `generatePrompt()` with:

```ts
const totalRounds = parseInt(formData.count);
let triviaCount = 0;
let topicCount = 0;

switch (formData.roundSpread) {
  case '100_trivia': triviaCount = totalRounds; break;
  case '75_trivia_25_topic': triviaCount = Math.round(totalRounds * 0.75); topicCount = totalRounds - triviaCount; break;
  case '50_trivia_50_topic': triviaCount = Math.round(totalRounds * 0.5); topicCount = totalRounds - triviaCount; break;
  case '25_trivia_75_topic': triviaCount = Math.round(totalRounds * 0.25); topicCount = totalRounds - triviaCount; break;
  case '100_topic': topicCount = totalRounds; break;
  default: triviaCount = Math.round(totalRounds * 0.5); topicCount = totalRounds - triviaCount;
}

const focusContext = formData.tags.length > 0
  ? `CONTENT FOCUS: ${formData.tags.join(', ')}`
  : 'CONTENT: Varied topics — mix geography, history, pop culture, science, food, and sports';

const triviaExample = `{
  "order_index": 0,
  "type": "trivia",
  "title": "Cold War Standoffs",
  "content": "Which 1962 event brought the US and USSR closest to nuclear conflict?",
  "settings": {
    "format": "multiple_choice",
    "categoryKey": "history",
    "answerSeconds": 30,
    "revealSeconds": 8,
    "resultsSeconds": 10,
    "pointsCorrect": 100,
    "speedBonusEnabled": true,
    "snapshot": {
      "prompt": "Which 1962 event brought the US and USSR closest to nuclear conflict?",
      "explanation": "The Cuban Missile Crisis lasted 13 days and is widely considered the closest the Cold War came to escalating into nuclear war.",
      "multipleChoice": {
        "options": [
          {"id": "a", "text": "The Berlin Blockade"},
          {"id": "b", "text": "The Cuban Missile Crisis"},
          {"id": "c", "text": "The Korean War"},
          {"id": "d", "text": "The U-2 Incident"}
        ],
        "correctOptionId": "b"
      }
    }
  }
}`;

const topicExample = `{
  "order_index": 1,
  "type": "topic",
  "title": "Unpopular Opinions",
  "content": "What's a widely loved food you genuinely cannot stand, and why?",
  "settings": {
    "topic": "What's a widely loved food you genuinely cannot stand, and why?",
    "sortBy": "upvotes",
    "allowUpvotes": true,
    "answerSeconds": 60,
    "votingSeconds": 30,
    "resultsSeconds": 15
  }
}`;

const prompt = `Generate ${totalRounds} ambient rounds for a self-running social game. These rounds loop endlessly without a host, so each must be fully self-contained.

DISTRIBUTION: ${triviaCount} trivia rounds, ${topicCount} topic rounds
${focusContext}

REQUIREMENTS FOR ALL ROUNDS:
- order_index must be sequential starting from 0, incrementing by 1 for every round
- Every round must be unique — no repeated questions or similar topics back-to-back
- Keep all content family-friendly and accessible to ages 16+
- Trivia questions must be factually correct and unambiguous
- Topic prompts should generate varied answers from different players (avoid prompts with one obvious answer)
- Interleave trivia and topic rounds for variety rather than grouping all of one type together

TRIVIA ROUND SCHEMA (use exactly — all fields required):
${triviaExample}

TOPIC ROUND SCHEMA (use exactly — all fields required):
${topicExample}

OUTPUT: Return a single JSON array of ${totalRounds} objects only. No markdown, no code fences, no commentary. The array must contain exactly ${totalRounds} items with order_index values 0 through ${totalRounds - 1}.`;
```

---

## Phase 4 — UX Improvements

---

### Task 4.1 — Add preview step to TriviaBulkImport before destructive replace

**Problem:** `TriviaBulkImport.tsx` deletes all existing questions immediately on confirm with no preview of what's being imported. A JSON paste error or format mismatch silently wipes the pack.

**File:** `src/components/TriviaBulkImport.tsx`

Add an intermediate preview state between "paste JSON" and "confirm import":

1. After JSON parses successfully, set a `preview` state containing `{ rows: parsedRows, valid: number, invalid: number, warnings: string[] }`.
2. Show a summary panel: "Importing X questions will replace all Y existing questions. X multiple choice, X written answer. Proceed?"
3. Only call the actual import mutation when the user clicks a second "Yes, replace all" button.
4. Validate ALL rows (not just the first) before showing preview — collect warnings for rows with missing fields rather than rejecting the entire import.

---

### Task 4.2 — Persist TriviaQuestionList filter state across tab switches

**Problem:** Search text, format filter, and status filter in `TriviaQuestionList.tsx` reset to defaults every time the user switches tabs. For packs with hundreds of questions this is frustrating.

**File:** `src/components/TriviaQuestionList.tsx`

Use `sessionStorage` to persist filter state, keyed by `packId`:

```ts
const storageKey = `trivia-filters-${packId}`;

const [searchText, setSearchText] = useState<string>(() => {
  try { return JSON.parse(sessionStorage.getItem(storageKey) || '{}').searchText ?? ''; }
  catch { return ''; }
});

// Mirror pattern for formatFilter and statusFilter

// Sync to sessionStorage on every filter change:
useEffect(() => {
  sessionStorage.setItem(storageKey, JSON.stringify({ searchText, formatFilter, statusFilter }));
}, [searchText, formatFilter, statusFilter, storageKey]);
```

---

### Task 4.3 — Add loading skeleton to TriviaQuestionList

**Problem:** When a pack is selected, the question list shows nothing while loading. For large packs this creates a jarring blank state.

**File:** `src/components/TriviaQuestionList.tsx`

When `isLoading` is true (from the React Query hook), render a simple skeleton instead of null/empty:

```tsx
if (isLoading) {
  return (
    <div style={{ padding: 24 }}>
      {[...Array(5)].map((_, i) => (
        <div key={i} style={{
          height: 72,
          background: '#f1f5f9',
          borderRadius: 6,
          marginBottom: 8,
          animation: 'pulse 1.5s ease-in-out infinite',
          opacity: 1 - i * 0.15,
        }} />
      ))}
    </div>
  );
}
```

Add the `@keyframes pulse` animation to the global CSS: `@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`.

---

## Phase 5 — Database

---

### Task 5.1 — Create the missing trivia schema migration

**Problem:** The trivia tables (`trivia_question_packs`, `trivia_questions`, `trivia_question_options`, `trivia_question_aliases`) exist in the remote database but have no migration file tracking their creation. Without this, the schema cannot be reproduced in new environments and will drift.

**Create file:** `a:\Social\Social\supabase\migrations\20260421_create_trivia_libraries.sql`

Write a `CREATE TABLE IF NOT EXISTS` migration for all four tables based on the TypeScript types in `src/types/trivia.ts` and the existing patterns in `20260420_create_ambient_rounds.sql`. Include:

- All four tables with correct column types, constraints, and defaults
- `UUID PRIMARY KEY DEFAULT gen_random_uuid()` for all id columns
- Foreign key relationships with `ON DELETE CASCADE` for questions→pack, options→question, aliases→question
- `ENABLE ROW LEVEL SECURITY` on all four tables
- Read policy: `FOR SELECT USING (true)` (content is not sensitive)
- Write policy: `FOR ALL USING (auth.role() = 'service_role')` (matches the pattern in `ambient_rounds`)
- Indexes on: `pack_id` on `trivia_questions`, `question_id` on options and aliases, GIN index on `tags` array, GIN index on `accepted_answers`

Reference the column names and types from `src/types/trivia.ts` — that file is the source of truth.

---

### Task 5.2 — Add a DB trigger to keep accepted_answers in sync

**Problem:** Task 2.5 adds a sync step in the service layer, but if any other client (Supabase dashboard, future migrations, other services) modifies `trivia_question_aliases`, `accepted_answers` will drift. A DB trigger is the permanent fix.

**Create file:** `a:\Social\Social\supabase\migrations\20260421_trivia_accepted_answers_trigger.sql`

```sql
-- Rebuilds accepted_answers on trivia_questions whenever aliases change.
-- This is the authoritative sync — service-layer sync in Task 2.5 is a belt-and-suspenders addition.

CREATE OR REPLACE FUNCTION sync_trivia_accepted_answers()
RETURNS TRIGGER AS $$
DECLARE
  target_question_id UUID;
BEGIN
  -- Handle both INSERT/UPDATE (NEW) and DELETE (OLD)
  IF TG_OP = 'DELETE' THEN
    target_question_id := OLD.question_id;
  ELSE
    target_question_id := NEW.question_id;
  END IF;

  UPDATE public.trivia_questions
  SET accepted_answers = COALESCE((
    SELECT array_agg(alias_text)
    FROM public.trivia_question_aliases
    WHERE question_id = target_question_id
  ), '{}')
  WHERE id = target_question_id;

  RETURN NULL; -- AFTER trigger, return value unused
END;
$$ LANGUAGE plpgsql;

-- Drop if exists before recreating (idempotent)
DROP TRIGGER IF EXISTS trg_sync_accepted_answers ON public.trivia_question_aliases;

CREATE TRIGGER trg_sync_accepted_answers
  AFTER INSERT OR UPDATE OR DELETE ON public.trivia_question_aliases
  FOR EACH ROW EXECUTE FUNCTION sync_trivia_accepted_answers();
```

---

## Execution Order Summary

```
Phase 1 (Bugs):
  1.1 → Fix query key mismatch
  1.2 → Fix TriviaLibraryForm submitting state
  1.3 → Wire up question counts
  1.4 → Fix editingTriviaLibrary type

Phase 2 (Refactoring):
  2.1 → Create queryKeys factory
  2.2 → Fix N+1 queries
  2.3 → Remove duplicate mutations from TriviaLibraryList
  2.4 → Add Toast notification system (replaces all alert() calls)
  2.5 → Add accepted_answers sync in service layer

Phase 3 (AI Prompts):
  3.1 → Add trivia UI controls (format ratio + difficulty)
  3.2 → Rewrite prompts template
  3.3 → Rewrite trivia template
  3.4 → Rewrite ambient template

Phase 4 (UX):
  4.1 → Bulk import preview step
  4.2 → Persist filter state with sessionStorage
  4.3 → Loading skeleton for question list

Phase 5 (Database):
  5.1 → Create trivia schema migration file
  5.2 → Create accepted_answers trigger migration
```

---

## Constraints and Notes for Windsurf

- **Do not install any new npm packages** unless a task explicitly says to. The Toast system (Task 2.4) must be implemented without a library.
- **Do not modify `src/types/trivia.ts`** or `src/types/prompts.ts` — they are correct and complete.
- **Do not change Supabase table names or column names** — the remote DB schema is live.
- **Do not add comments to code you don't change.** Only add comments where logic is genuinely non-obvious.
- **Each phase must leave the app in a working state.** Verify the app builds without TypeScript errors before moving to the next phase.
- **The `supabase` client instance** is created in `src/services/database.ts` and imported by `triviaDatabase.ts`. Do not create a second client.
- **Migration files** are append-only. Never modify existing migration files. Only create new ones.
