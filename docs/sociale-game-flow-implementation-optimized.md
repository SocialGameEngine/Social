# Sociale Game Flow Implementation Plan — Credit-Optimized Execution Version

## Project Rules
- pnpm only
- PowerShell syntax: use ;, never &&
- No teams
- Rooms → memberships only
- Prefer patching existing files over creating new abstractions
- Do not refactor unrelated systems
- Do not continue to the next phase automatically
- Stop after each phase and report:
  - files changed
  - migrations added
  - blockers
  - next recommended prompt

## Low-Credit Execution Mode

This work must be done in small isolated passes.

### Rules
- Only implement one phase at a time
- Only inspect files relevant to the active phase
- Do not redesign unrelated architecture
- Do not do polish, animation, or cleanup unless required by the active phase
- Reuse existing runtime and UI patterns where possible
- Prefer direct patches over new helper layers unless duplication becomes blocking
- Do not implement future enhancements in the current phase

## Overall Goal

Refactor Sociales so that:

- topic rounds use Answer → Reveal → Results
- trivia rounds use Answer → Reveal → Results
- alternating mode applies the correct flow per round
- trivia supports both multiple_choice and written_answer
- trivia reveal shows the actual correct answer
- invalid trivia questions are blocked before gameplay
- host creation UX is improved only after gameplay correctness is stable

## Final Runtime Flow

### Topic
```
Answer → Reveal → Results
```

### Trivia
```
Answer → Reveal → Results
```

### Alternating
Per round:
```
Answer → Reveal → Results
```

### Reveal behavior
- Topic: show winning / most-voted response
- Trivia: show correct answer
- Results: show updated leaderboard after scoring is committed

---

## Phase 1 — Runtime Flow Only

### Goal

Fix live gameplay flow only.

### Implement only
- round phase configuration
- phase advancement logic
- reveal phase existence
- host manual next-phase control
- host/player rendering changes required for the new flow

### Do not implement yet
- trivia schema migration
- format-aware trivia UI
- template creation flow
- preview rounds
- bugged question badges
- regeneration controls
- animation
- broad mobile polish beyond phase controls

### Required changes

#### 1. Replace old phase config
```typescript
const phaseConfig = {
  topic: ['answer', 'reveal', 'results'],
  trivia: ['answer', 'reveal', 'results'],
};
```

#### 2. Remove obsolete runtime phases
- remove discussion phase for topic rounds
- remove discussion phase for trivia rounds
- remove vote phase for trivia rounds
- preserve topic scoring behavior as needed without reintroducing trivia vote flow

#### 3. Add / complete reveal phase
- `SocialeRevealPhase` must exist and render for both topic and trivia rounds
- if trivia correct-answer data is not ready yet, phase 1 may temporarily render placeholder trivia reveal content
- the important part is the runtime phase flow must be correct

#### 4. Update phase advancement

The runtime service must:
- advance answer -> reveal
- advance reveal -> results
- skip removed phases automatically
- stop attempting trivia vote/discussion logic

#### 5. Restore host manual next-phase control

The host panel must again support manually advancing the current phase.

Minimum requirement:
- host can advance from answer to reveal
- host can advance from reveal to results
- usable on mobile host layout

#### 6. Update rendering

Host and player views must both correctly render:
- answer
- reveal
- results

#### 7. Align scoring

Scoring must be committed before or during transition into results so results always shows updated scores.

### Files allowed in Phase 1

Prioritize only these areas:
- `src/features/sociale/socialeService.ts`
- `src/domain/sociale/roundRegistry.ts`
- `src/features/host/SocialePhases/SocialeAnswerPhase.tsx`
- `src/features/host/SocialePhases/SocialeRevealPhase.tsx`
- `src/features/host/SocialePhases/SocialeResultsPhase.tsx`
- `src/features/host/SocialePhases/SocialeVotePhase.tsx`
- `src/features/player/SocialePlayerView.tsx`
- host phase-advance control location

### Phase 1 verification checklist
- [ ] topic rounds never enter discussion phase
- [ ] trivia rounds never enter discussion phase
- [ ] trivia rounds never enter vote phase
- [ ] all rounds use Answer → Reveal → Results
- [ ] reveal phase exists and renders
- [ ] results always appears after scoring is committed
- [ ] host can manually advance phases
- [ ] host controls are usable on mobile

### Stop after Phase 1

Do not start phase 2 automatically.

Report:
- files changed
- remaining trivia data blockers
- next prompt recommendation

---

## Phase 2 — Trivia Data Correctness Only

### Goal

Make trivia rounds correct, revealable, validated, and format-aware.

### Implement only
- accepted_answers migration
- trivia fetch shape update
- format detection
- snapshot storage in round settings
- trivia validation
- multiple choice vs written answer answer UI
- trivia reveal correct answer
- simple trivia scoring

### Do not implement yet
- template generation
- round preview editor
- bugged-question UI polish beyond clear blocking messages
- manual grading
- fuzzy matching
- partial credit
- speed bonus
- advanced accessibility work unless required for correctness

### Mandatory schema change

#### Add accepted_answers
```sql
ALTER TABLE trivia_questions
ADD COLUMN accepted_answers TEXT[] DEFAULT '{}';
```

This is required. Written-answer trivia must use this column.

### Required trivia fetch

Sociales must fetch complete question data, not just prompt:

```typescript
const { data: questions } = await supabase
  .from('trivia_questions')
  .select(`
    id,
    prompt,
    format,
    explanation,
    accepted_answers,
    trivia_question_options(
      option_id,
      option_text,
      is_correct,
      sort_order
    )
  `)
  .eq('pack_id', questionPackId)
  .eq('status', 'published')
  .limit(1);
```

### Supported formats
- `multiple_choice`
- `written_answer`

### Required runtime behavior
- `multiple_choice` renders option selection UI
- `written_answer` renders text input
- round settings must preserve format and reveal data

### Snapshot round settings

Do not rely on live trivia queries during reveal.

```typescript
type TriviaRoundSettings =
  | {
      format: 'multiple_choice';
      questionId: string;
      snapshot: {
        prompt: string;
        explanation?: string | null;
        multipleChoice: {
          options: Array<{ id: string; text: string }>;
          correctOptionId: string;
        };
      };
    }
  | {
      format: 'written_answer';
      questionId: string;
      snapshot: {
        prompt: string;
        explanation?: string | null;
        writtenAnswer: {
          acceptedAnswers: string[];
          correctAnswer: string;
        };
      };
    };
```

### Validation rules

#### Multiple choice invalid if
- fewer than 2 options
- no correct option
- more than 1 correct option
- empty prompt
- invalid format

#### Written answer invalid if
- `accepted_answers` is empty
- prompt is empty
- invalid format

#### Invalid question handling
- must be blocked from gameplay
- must surface a clear reason
- must not be silently skipped

### Trivia answer phase behavior

#### Multiple choice
- render options
- submit selected option id

#### Written answer
- render text input
- minimum 1 character
- normalize and compare against `accepted_answers`

### Trivia scoring rules for v1

#### Multiple choice
- correct = full points
- incorrect = zero

#### Written answer
- normalized exact match in `accepted_answers` = full points
- otherwise = zero

### Trivia reveal rules

#### Multiple choice reveal
Show:
- prompt
- correct option text
- explanation if present

#### Written answer reveal
Show:
- prompt
- canonical answer = first entry in `accepted_answers`
- explanation if present

### Migration rollout tasks
- add `accepted_answers`
- backfill from alias data where possible
- mark invalid written-answer questions unusable
- tighten runtime/generation validation

### Files allowed in Phase 2
- `src/features/sociale/socialeService.ts`
- trivia fetch/query helpers
- trivia round generation logic
- `src/features/host/SocialePhases/SocialeAnswerPhase.tsx`
- `src/features/host/SocialePhases/SocialeRevealPhase.tsx`
- shared validation utilities
- round settings / type definitions

### Phase 2 verification checklist
- [ ] `accepted_answers` migration added
- [ ] written-answer trivia uses `accepted_answers`
- [ ] trivia fetch includes format, explanation, `accepted_answers`, and options
- [ ] multiple choice rounds render options
- [ ] written answer rounds render input
- [ ] reveal shows the actual correct answer
- [ ] reveal uses snapshot data
- [ ] invalid trivia questions are blocked
- [ ] trivia scoring uses only simple v1 rules

### Stop after Phase 2

Do not start phase 3 automatically.

Report:
- files changed
- migrations created
- unresolved invalid-data issues
- next prompt recommendation

---

## Phase 3 — Host Creation UX Only

### Goal

Improve host-side Sociale creation after runtime is stable.

### Implement only
- template selection
- relevant library selection
- round count selection
- preview rounds
- validation visibility
- regeneration controls
- creation flow mobile usability

### Do not implement yet
- heavy animation
- deep component abstraction
- analytics
- collaborative editing
- advanced UI polish
- future feature work

### Required features

#### 1. Template workflow

Templates:
- Hot Topic
- Trivia
- Alternating
- Custom

#### 2. Dynamic library selection
- Hot Topic → prompt libraries only
- Trivia → trivia libraries only
- Alternating → both prompt and trivia libraries
- Custom → manual round configuration

#### 3. Round count selection

Allow host to choose number of rounds before generation.

#### 4. Apply template flow

When applying a template:
- validate library requirements
- lock UI during generation
- generate rounds in stable order
- validate generated rounds
- atomically update state
- transition to preview/edit view

#### 5. Preview rounds

Each round should show:
- round number
- selected type
- selected library
- generated content
- validation state

#### 6. Invalid round visibility

If a round is invalid:
- show clear bugged / invalid status
- show clear error text
- block final create until fixed or regenerated

#### 7. Regeneration

Allow reset/regenerate at:
- type
- library
- content

#### 8. Mobile host usability

The /host creation flow must remain usable on mobile:
- phase controls remain reachable
- preview cards stack cleanly
- template/config controls are operable on small screens

### Files allowed in Phase 3
- `src/features/host/components/SocialeCreateModal.tsx`
- `src/features/host/components/TemplateSelector.tsx`
- `src/features/host/components/LibrarySelector.tsx`
- `src/features/host/components/RoundPreview.tsx`
- `src/features/host/components/RoundGenerator.tsx`
- `src/features/host/components/RoundTypeSelector.tsx`
- validation / invalid-question components
- host mobile layout components

### Phase 3 verification checklist
- [ ] host can generate rounds from template
- [ ] only relevant libraries are shown for selected template
- [ ] preview displays round-by-round validity
- [ ] invalid rounds are clearly labeled
- [ ] host can regenerate type, library, or content
- [ ] final create is blocked while invalid rounds exist
- [ ] creation flow is usable on mobile

### Stop after Phase 3

Report:
- files changed
- remaining polish opportunities
- optional follow-up tasks

---

## Refactor Discipline
- Prefer patching the current Sociale runtime over inventing a new phase engine
- Prefer extending existing trivia structures over creating parallel models
- Only create new files when an existing file would become too overloaded
- Avoid cleanup refactors unless they are required to ship the active phase
- Do not implement future enhancements during the active phase

## Explicit Non-Goals for This Pass

Do not spend credits implementing:
- fuzzy grading
- partial credit
- speed bonus
- manual grading
- advanced analytics
- A/B testing
- deep animation work
- multimedia question types
- collaborative authoring

## Recommended Model Workflow

### Cheapest safe workflow
- Phase 1: Sonnet 4.5
- Phase 2: Opus 4.6
- Phase 3: Sonnet 4.5

### Single-model workflow
- All phases: Opus 4.6

### Rule
If a model finishes a phase, stop and start a fresh prompt for the next one.

---

## First implementation prompt to use

You are implementing Phase 1 only of the Sociale Game Flow refactor.

**Constraints:**
- Use pnpm only
- Use PowerShell syntax with ;, never &&
- No teams, only rooms → memberships
- Do not implement phase 2 or phase 3 work
- Prefer patching existing files over creating new abstractions
- Stop after Phase 1 is complete

**Phase 1 goals:**
- Update runtime flow so topic and trivia both use answer -> reveal -> results
- Remove discussion for topic and trivia
- Remove vote for trivia
- Add/finalize reveal phase runtime support
- Restore host manual next-phase control
- Ensure host/player render the new phase flow
- Keep mobile host controls usable

**Deliver:**
- files inspected
- files changed
- code changes made
- anything intentionally deferred to phase 2
- recommended next prompt
