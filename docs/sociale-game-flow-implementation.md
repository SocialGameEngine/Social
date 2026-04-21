# Sociale Game Flow Implementation Plan — Three-Phase Approach

## Project Context

### Overview
This document outlines a comprehensive refactor of the Sociale game flow system for the Social Game Engine project. Sociales are multiplayer game sessions where players respond to prompts and trivia questions in a structured phase-based format.

### Project Architecture
- **Location**: `a:\Social\Social\` (main app directory)
- **Technology Stack**: React 18.3.1, TypeScript 5.7.2, Supabase (PostgreSQL + Realtime + Edge Functions)
- **Package Manager**: pnpm (ALWAYS use pnpm, never npm/yarn)
- **Architecture**: ROOMS → MEMBERSHIPS only (NO TEAMS)
- **Monorepo**: Turborepo with pnpm workspaces

### Key Directories
```
a:\Social\Social\
├── apps\top-comment\src\features\
│   ├── sociale\           # Core Sociale logic and services
│   ├── host\              # Host-side UI and controls
│   ├── player\            # Player-side UI and interactions
│   └── room\              # Room management and shared components
├── supabase\
│   ├── migrations\        # Database schema changes
│   └── functions\         # Edge Functions
└── docs\                  # Documentation
```

### Critical Architecture Rules
1. **NO TEAMS**: The app removed teams long ago. Never reference team-based logic
2. **ROOMS → MEMBERSHIPS**: Only use room memberships with membershipId
3. **pnpm ONLY**: Always use `pnpm` commands, never `npm` or `yarn`
4. **PowerShell Syntax**: Use `;` for command chaining, never `&&`

### Current Sociale System
Sociales are game sessions that progress through phases where players interact with different types of content:

#### Round Types
- **Topic Rounds**: Players submit creative responses to prompts
- **Trivia Rounds**: Players answer factual questions
- **Custom Rounds**: User-defined content and rules

#### Current Phase Issues
The existing implementation has several critical problems:
- Incorrect phase sequences for different round types
- Missing or inappropriate phases (Discussion, Vote)
- Trivia reveal phase cannot show correct answers due to incomplete data fetching
- Phase advancement logic doesn't match intended game flow

### Database Schema Context
The system uses Supabase with the following relevant tables:
- `sociale_rounds`: Stores individual round data and settings
- `trivia_questions`: Question metadata with format and options
- `trivia_question_options`: Multiple choice options
- `trivia_question_packs`: Collections of trivia questions

### Implementation Priorities
1. **Fix Live Gameplay First**: Ensure the game runs correctly before improving creation tools
2. **Data Completeness**: Trivia rounds must fetch complete question data for proper reveals
3. **Strict Validation**: Invalid questions must be blocked before gameplay
4. **Snapshot Strategy**: Store complete round data at creation time for stability

### Development Guidelines
- **Phase-Based Approach**: Implement in three distinct phases to reduce risk
- **Backward Compatibility**: Ensure existing functionality isn't broken
- **Mobile-First**: Host interface must work on mobile devices
- **Performance**: Database queries should be optimized and avoid N+1 issues

### Testing Strategy
- Unit tests for core logic
- Integration tests for phase transitions
- UI tests for host and player interfaces
- Performance tests for database operations

---

## Current Issues
- Game phases don't match the intended flow for different round types
- Topics and Trivia both have unnecessary Discussion phase
- Trivia has inappropriate Vote phase
- Reveal phase comes after Results instead of before
- **Trivia reveal phase cannot show correct answers** - Sociales doesn't fetch complete question data

## New Game Flow Requirements

### 1. Topics Mode Flow
```
Answer Phase → Reveal Phase → Results Phase
```

**Phases:**
- **Answer Phase**: Players submit topic responses
- **Reveal Phase**: Show the most voted-for response (the "topic")
- **Results Phase**: Show leaderboard after points are awarded

### 2. Trivia Mode Flow  
```
Answer Phase → Reveal Phase → Results Phase
```

**Phases:**
- **Answer Phase**: Players submit trivia answers
- **Reveal Phase**: Show the correct trivia answer
- **Results Phase**: Show leaderboard after points are awarded

### 3. Alternating Mode Flow
```
For each round:
  Answer Phase → Reveal Phase → Results Phase
```

**Note:** Both Topic and Trivia rounds follow the same phase sequence, only the content differs:
- **Topics**: Reveal shows most voted response
- **Trivia**: Reveal shows correct answer
```sql
-- interactions table (for reference only)
settings JSONB DEFAULT '{}'::jsonb

-- Trivia interactions settings structure:
{
  "format": "multiple_choice" | "written_answer",
  "questionId": "uuid",
  "snapshot": {
    "multipleChoice": {
      "options": [
        {"id": "A", "text": "Option A"},
        {"id": "B", "text": "Option B"},
        {"id": "C", "text": "Option C"},
        {"id": "D", "text": "Option D"}
      ],
      "correctOptionId": "A",  // The correct answer
      "shuffleOptions": true
    },
    "writtenAnswer": {
      "acceptedAnswers": ["au", "Au", "AU", "gold"],  // From trivia_questions.accepted_answers
      "correctAnswer": "au"  // First item from acceptedAnswers array
    }
  }
}
```

**Key Insights from Interactions Settings:**
1. **Format stored in settings** alongside question data
2. **Snapshot contains complete question data** (options, correct answer)
3. **Different structures for each format** (multipleChoice vs writtenAnswer)
4. **Correct answer extraction path**: `settings->'snapshot'->'multipleChoice'->>'correctOptionId'`
5. **Written answer simplification**: Use `acceptedAnswers` from database, first item as `correctAnswer`
6. **No normalization needed**: Direct array comparison is sufficient

**Sociales should adopt this pattern** for round settings when implementing trivia properly.

**1. `trivia_questions`**
```sql
- id: UUID
- pack_id: UUID (references trivia_question_packs)
- format: 'multiple_choice' | 'written_answer'  -- KEY FIELD for format detection
- prompt: question text
- explanation: optional explanation
- accepted_answers: TEXT[] DEFAULT '{}'  -- NEW: Array of accepted answers for written questions
- status: 'draft' | 'published' | 'archived'
```

**Format Field Details:**
- **Field Name**: `format`
- **Type**: TEXT with CHECK constraint
- **Possible Values**: `'multiple_choice'` | `'written_answer'`
- **Purpose**: Determines how the question should be presented and answered
- **Usage**: Critical for UI adaptation and answer phase structuring

**2. `trivia_question_options`** (Multiple Choice Only)
```sql
- id: UUID
- question_id: UUID
- option_id: text ("A", "B", "C", "D")
- option_text: answer text
- is_correct: boolean (marks the right answer)
- sort_order: integer
```

**3. `trivia_evaluations`** (Written Answer Grading)
```sql
- result: 'correct' | 'partial' | 'incorrect' | 'needs_review'
- method: 'exact' | 'alias' | 'fuzzy' | 'host_override'
- points_awarded: integer
```

**4. `trivia_question_aliases`** (Limited Written Answer Support)
```sql
- id: UUID
- question_id: UUID  
- alias_text: text
- alias_normalized: text
```
**Note**: This table is incomplete - doesn't have answers for all written questions

**PROPOSED: `trivia_questions.accepted_answers` Column**
```sql
-- Add new column to trivia_questions table
ALTER TABLE trivia_questions 
ADD COLUMN accepted_answers TEXT[] DEFAULT '{}';

-- Store all accepted answers as an array
-- Example: ['au', 'Au', 'AU', 'gold']
```

### Trivia Question Types

**Multiple Choice Questions:**
- ✅ **Correct answer stored** in `trivia_question_options.is_correct`
- ✅ **Options identified** by `option_id` ("A", "B", "C", "D")
- ✅ **Reveal logic**: Extract `correctOptionId` from interaction settings
- ✅ **Answer Phase**: Show multiple choice buttons (A, B, C, D) for selection

**Written Answer Questions:**
- ✅ **Accepted answers stored** in `trivia_questions.accepted_answers` array
- ✅ **Multiple variants supported** (case insensitive, alternative spellings)
- ✅ **First answer used as display** in reveal phase
- ✅ **Answer Phase**: Show text input field for free-form response
- ✅ **Automatic grading** possible via array comparison

### Trivia Format Detection and Answer Phase Structuring

**Critical Requirement:** Sociales must detect the trivia question format and structure the answer phase accordingly:

**Detection Logic:**
```typescript
// When fetching trivia question, check the format field
const question = questions[0];
const isMultipleChoice = question.format === 'multiple_choice';  // From trivia_questions.format field
const isWrittenAnswer = question.format === 'written_answer';     // From trivia_questions.format field

// Format field has CHECK constraint: ('multiple_choice'::text, 'written_answer'::text)
```

**Answer Phase Adaptation:**

**Multiple Choice Answer Phase:**
- **UI**: Radio buttons or clickable options (A, B, C, D)
- **Options**: Displayed from `trivia_question_options.option_text`
- **Selection**: Single option selection required
- **Validation**: Must select an option before submitting
- **Data**: Submit `selectedOptionId` (e.g., "A", "B", "C", "D")

**Written Answer Answer Phase:**
- **UI**: Text input field with character limit
- **Input**: Free-form text response
- **Validation**: Minimum 1 character (already implemented)
- **Data**: Submit `text` response
- **Grading**: Automatic comparison against `accepted_answers` array
- **Case Handling**: Case-insensitive comparison recommended
- **Partial Credit**: Consider partial matches for longer answers

**Implementation Requirements:**
1. **Format Detection**: Check `trivia_questions.format` field when fetching question
2. **Dynamic UI**: Render different answer phase components based on format value
3. **Data Handling**: Handle different submission formats (optionId vs text)
4. **Validation**: Format-specific validation (option selection vs text input)
5. **Reveal Logic**: Different reveal logic for each format
6. **Schema Constraint**: Leverage existing CHECK constraint on format field
7. **Question Validation**: Validate complete question data before allowing Sociale creation
8. **Bugged Question Handling**: Block creation and display clear error messages for invalid questions

**Current Gap:** Sociales treats all trivia as written answers, missing the multiple choice format entirely.

### Current Sociales Implementation Gap

**What Sociales Currently Does:**
- ✅ **Fetches questions** from `trivia_questions` table
- ✅ **Uses `questionPackId`** to identify question packs
- ❌ **Only fetches `prompt` field** - doesn't fetch format or options
- ❌ **Treats all trivia as written answers** - no format distinction
- ❌ **No correct answer retrieval** for reveal phase

**What Sociales Needs to Do:**
1. **Fetch question format** along with the prompt
2. **Fetch options for multiple choice** questions
3. **Fetch accepted_answers** for written questions
4. **Extract correct answer** from appropriate source
5. **Store complete question data** in round settings for reveal phase
6. **Handle edge cases** (missing data, empty arrays, malformed questions)

## Edge Cases and Error Handling

### Missing or Invalid Data
- **No options found** for multiple choice questions → Mark question as bugged, prevent Sociale creation
- **Empty accepted_answers array** for written questions → Mark question as bugged, prevent Sociale creation
- **Multiple correct options** in multiple choice → Mark question as bugged, prevent Sociale creation
- **Invalid format value** → Mark question as bugged, prevent Sociale creation
- **Empty prompt** → Mark question as bugged, prevent Sociale creation

**Note**: Manual grading is planned as a future feature for written answers, but current implementation requires complete data.

### Question Validation
- **Multiple choice must have at least 2 options**
- **Multiple choice must have exactly one correct option**
- **Written answers must have at least one accepted answer**
- **Question prompt cannot be empty**
- **All required fields must be present** before allowing Sociale creation

### Bugged Question Display
- **UI Indicator**: Show "⚠️ Bugged Question" badge on individual rounds in Preview Rounds
- **Round-level Validation**: Each round validated when selected/generated in Sociale creation
- **Error Messages**: Clear error messages on affected rounds explaining the issue
- **Prevention**: Block Sociale creation if any rounds have bugged questions
- **Guidance**: Provide instructions for fixing the question in trivia management

### Preview Rounds Interface
```
Preview Rounds
┌─────────────────────────────────┐
│ Round 1                         │
│ [Select Type ▼]                 │
│ [🔄] What is the chemical symbol for gold? │
│ ⚠️ Bugged: Missing options     │
└─────────────────────────────────┘

After selecting "Trivia":
┌─────────────────────────────────┐
│ Round 1                         │
│ trivia [🔄]                     │
│ [Science Library ▼]            │
│ [🔄] What is the chemical symbol for gold? │
│ ⚠️ Bugged: Missing options     │
└─────────────────────────────────┘

After selecting library:
┌─────────────────────────────────┐
│ Round 1                         │
│ trivia [🔄]                     │
│ Science Library [🔄]            │
│ [�] What is the chemical symbol for gold? │
│ ⚠️ Bugged: Missing options     │
└─────────────────────────────────┘

Valid round example:
┌─────────────────────────────────┐
│ Round 2                         │
│ topic [🔄]                      │
│ Classic Library [🔄]            │
│ [🔄] Best pizza topping         │
│ ✅ Valid                        │
└─────────────────────────────────┘
```

### Enhanced Round Item Workflow
1. **Initial State**: Shows "Round X" with "[Select Type ▼]" dropdown
2. **Type Selection**: User chooses type (topic, trivia, custom), type becomes static with [🔄] button
3. **Library Dropdown**: Appears when type is selected, shows relevant libraries
4. **Content Generation**: Question/prompt generated when library is selected
5. **Manual Refresh**: [🔄] buttons allow regeneration of content or reselection of type/library
6. **Validation**: Real-time validation status shown on each round

### Round Item Components
- **Round Number**: Static identifier (Round 1, Round 2, etc.)
- **Type Field**: Dropdown initially, then static with [🔄] button
- **Library Field**: Appears after type selection, dropdown with [🔄] button
- **Content Field**: Generated question/prompt with [🔄] button for regeneration
- **Validation Status**: Error or success indicators below content

## Template-Based Sociale Creation

### Template Selection Interface
```
Template
┌─────────────────────────────────┐
│ [Hot Topic ▼]                    │
│ Topic-based rounds only         │
├─────────────────────────────────┤
│ [Trivia ▼]                       │
│ Trivia questions only            │
├─────────────────────────────────┤
│ [Alternating ▼]                  │
│ Mix of topics and trivia         │
├─────────────────────────────────┤
│ [Custom ▼]                       │
│ Configure your own rounds        │
└─────────────────────────────────┘

Select Prompt Libraries
Alternating mode requires both prompt and trivia libraries
2/6 libraries selected

Prompt Libraries
1 selected
[🎮 Classic ✓] [🌶️ Spicy] [👨 Modern Day Dangerfield] ...

Trivia Libraries  
1 selected
[🧠 Science Basics ✓] [🧠 General Knowledge] [🧠 Pop Culture] ...

Number of Rounds
[3] [5] [7] [10] [15]
Each player will answer 5 prompts per round

[Apply Button]
```

### Template Behaviors
- **Hot Topic**: Only shows prompt libraries, generates all topic rounds
- **Trivia**: Only shows trivia libraries, generates all trivia rounds  
- **Alternating**: Shows both library types, generates alternating rounds
- **Custom**: No library selection required, generates empty rounds for manual configuration

### Template Application Workflow
1. **Template Selection**: User chooses template type
2. **Library Selection**: Relevant libraries appear based on template
3. **Round Count**: User selects number of rounds
4. **Apply**: Generate rounds based on template settings
5. **Animation**: Template section collapses, rounds section expands
6. **Fine-tuning**: User can modify individual rounds as needed

### Race Condition Handling
```typescript
// Template application with proper race condition handling
async function applyTemplate(template: TemplateConfig, libraries: string[], roundCount: number) {
  try {
    // Step 1: Validate template requirements
    const validation = validateTemplateConfig(template, libraries);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Step 2: Lock UI to prevent duplicate submissions
    setApplyingTemplate(true);
    
    // Step 3: Generate all rounds in sequence with proper ordering
    const rounds = await generateRoundsFromTemplate(template, libraries, roundCount);
    
    // Step 4: Validate all generated rounds
    const roundValidation = await validateAllRounds(rounds);
    if (roundValidation.hasErrors) {
      throw new Error('Some generated rounds have validation errors');
    }

    // Step 5: Update state atomically
    setRounds(rounds);
    setTemplateApplied(true);
    
    // Step 6: Animate UI transition
    animateTemplateCollapse();
    animateRoundsExpansion();
    
  } catch (error) {
    // Handle errors gracefully
    showErrorMessage(error.message);
    setApplyingTemplate(false);
  } finally {
    // Always unlock UI
    setApplyingTemplate(false);
  }
}

// Sequential round generation to maintain order
async function generateRoundsFromTemplate(template: TemplateConfig, libraries: string[], roundCount: number): Promise<Round[]> {
  const rounds: Round[] = [];
  
  for (let i = 0; i < roundCount; i++) {
    const roundType = determineRoundType(template, i, roundCount);
    const libraryId = selectLibraryForRound(template, libraries, roundType, i);
    
    try {
      const roundContent = await generateRoundContent(roundType, libraryId);
      const round = {
        id: `round-${i + 1}`,
        order: i + 1,
        type: roundType,
        libraryId,
        ...roundContent
      };
      
      rounds.push(round);
    } catch (error) {
      // Fail fast if any round generation fails
      throw new Error(`Failed to generate round ${i + 1}: ${error.message}`);
    }
  }
  
  return rounds;
}
```

### Template Logic and Library Requirements
```typescript
// Template configuration types
interface TemplateConfig {
  type: 'hot_topic' | 'trivia' | 'alternating' | 'custom';
  requiresPromptLibraries: boolean;
  requiresTriviaLibraries: boolean;
  minPromptLibraries: number;
  minTriviaLibraries: number;
}

const templateConfigs: Record<string, TemplateConfig> = {
  hot_topic: {
    type: 'hot_topic',
    requiresPromptLibraries: true,
    requiresTriviaLibraries: false,
    minPromptLibraries: 1,
    minTriviaLibraries: 0
  },
  trivia: {
    type: 'trivia',
    requiresPromptLibraries: false,
    requiresTriviaLibraries: true,
    minPromptLibraries: 0,
    minTriviaLibraries: 1
  },
  alternating: {
    type: 'alternating',
    requiresPromptLibraries: true,
    requiresTriviaLibraries: true,
    minPromptLibraries: 1,
    minTriviaLibraries: 1
  },
  custom: {
    type: 'custom',
    requiresPromptLibraries: false,
    requiresTriviaLibraries: false,
    minPromptLibraries: 0,
    minTriviaLibraries: 0
  }
};

// Template validation logic
function validateTemplateConfig(template: TemplateConfig, selectedLibraries: string[]) {
  const promptLibraries = selectedLibraries.filter(lib => lib.type === 'prompt');
  const triviaLibraries = selectedLibraries.filter(lib => lib.type === 'trivia');
  
  if (template.requiresPromptLibraries && promptLibraries.length < template.minPromptLibraries) {
    return {
      valid: false,
      error: `This template requires at least ${template.minPromptLibraries} prompt libraries`
    };
  }
  
  if (template.requiresTriviaLibraries && triviaLibraries.length < template.minTriviaLibraries) {
    return {
      valid: false,
      error: `This template requires at least ${template.minTriviaLibraries} trivia libraries`
    };
  }
  
  return { valid: true };
}

// Round type determination for templates
function determineRoundType(template: TemplateConfig, roundIndex: number, totalRounds: number): string {
  switch (template.type) {
    case 'hot_topic':
      return 'topic';
    case 'trivia':
      return 'trivia';
    case 'alternating':
      // Alternate between topic and trivia, starting with topic
      return roundIndex % 2 === 0 ? 'topic' : 'trivia';
    case 'custom':
      throw new Error('Custom template rounds are configured manually');
    default:
      return 'topic';
  }
}

// Library selection for template rounds
function selectLibraryForRound(template: TemplateConfig, libraries: string[], roundType: string, roundIndex: number): string {
  const relevantLibraries = libraries.filter(lib => {
    if (roundType === 'topic') return lib.type === 'prompt';
    if (roundType === 'trivia') return lib.type === 'trivia';
    return false;
  });
  
  if (relevantLibraries.length === 0) {
    throw new Error(`No ${roundType} libraries available for round ${roundIndex + 1}`);
  }
  
  // Round-robin selection through available libraries
  const libraryIndex = roundIndex % relevantLibraries.length;
  return relevantLibraries[libraryIndex];
}
```

### Round Generation Logic
```typescript
// Enhanced round generation for progressive workflow
async function generateRoundContent(type: string, libraryId: string) {
  if (type === 'trivia') {
    // Fetch complete trivia question with options and validation
    const question = await fetchTriviaQuestion(libraryId);
    const validation = validateTriviaQuestion(question);
    
    return {
      type: 'trivia',
      content: question.prompt,
      libraryId,
      settings: {

### Current Sociale System
Sociales are game sessions that progress through phases where players interact with different types of content:

#### Round Types
- **Topic Rounds**: Players submit creative responses to prompts
- **Trivia Rounds**: Players answer factual questions
- **Custom Rounds**: User-defined content and rules

#### Current Phase Issues
The existing implementation has several critical problems:
- Incorrect phase sequences for different round types
- Missing or inappropriate phases (Discussion, Vote)
- Trivia reveal phase cannot show correct answers due to incomplete data fetching
- Phase advancement logic doesn't match intended game flow

### Database Schema Context
The system uses Supabase with the following relevant tables:
- `sociale_rounds`: Stores individual round data and settings
- `trivia_questions`: Question metadata with format and options
- `trivia_question_options`: Multiple choice options
- `trivia_question_packs`: Collections of trivia questions

### Implementation Priorities
1. **Fix Live Gameplay First**: Ensure the game runs correctly before improving creation tools
2. **Data Completeness**: Trivia rounds must fetch complete question data for proper reveals
3. **Strict Validation**: Invalid questions must be blocked before gameplay
4. **Snapshot Strategy**: Store complete round data at creation time for stability

### Development Guidelines
- **Phase-Based Approach**: Implement in three distinct phases to reduce risk
- **Backward Compatibility**: Ensure existing functionality isn't broken
- **Mobile-First**: Host interface must work on mobile devices
- **Performance**: Database queries should be optimized and avoid N+1 issues

### Testing Strategy
- Unit tests for core logic
- Integration tests for phase transitions
- UI tests for host and player interfaces
- Performance tests for database operations

---

## Goal

Refactor Sociales so that:

- Topics use Answer → Reveal → Results
- Trivia uses Answer → Reveal → Results
- Alternating mode applies the correct flow per round
- Trivia supports both multiple_choice and written_answer
- Trivia reveal shows the correct answer
- Invalid trivia questions are blocked before gameplay
- Host creation UX is improved only after gameplay correctness is stable

## Guiding Principles

1. **Gameplay correctness before creation UX**
   - The game must run correctly before the host tooling is upgraded.
2. **Snapshot round data**
   - Each generated round should store the exact data needed to run and reveal that round.
   - Reveal phase should not depend on re-querying trivia tables during live play.
3. **Strict trivia validation**
   - Bugged trivia questions must be blocked before they can be used in a Sociale.
4. **Schema migration is required**
   - `trivia_questions.accepted_answers` is required for written-answer trivia support.
   - This is a mandatory part of implementation, not a future enhancement.

## Final Target Flows

### Topics
```
Answer → Reveal → Results
```

### Trivia
```
Answer → Reveal → Results
```

### Alternating
For each round:
```
Answer → Reveal → Results
```

### Reveal phase behavior
- **Topics**: reveal the winning / most-voted response
- **Trivia**: reveal the correct answer
- **Results**: always shows updated scores after points are awarded

---

## Phase 1 — Core Gameplay Fix

### Objective

Ship the correct live game flow first, with proper phase sequencing and host/player rendering.

### Scope

This phase does not redesign the creation interface yet. It focuses on runtime correctness.

### Deliverables

#### 1. Update round phase configuration

Replace the old phase model with:

```typescript
const phaseConfig = {
  topic: ['answer', 'reveal', 'results'],
  trivia: ['answer', 'reveal', 'results'],
};
```

#### 2. Remove obsolete phases from live flow
- Remove Discussion phase for Topics
- Remove Discussion phase for Trivia
- Remove Vote phase for Trivia
- Keep any topic-vote logic embedded in topic answer/reveal scoring flow as needed

#### 3. Add / finalize Reveal phase

Create or complete `SocialeRevealPhase` so it supports both:
- topic reveal
- trivia reveal

For phase 1, trivia reveal may still use placeholder data if full trivia fetch is not ready yet, but the runtime phase must exist.

#### 4. Update phase advancement logic

Modify the Sociale runtime service so it:
- advances directly from answer to reveal
- advances from reveal to results
- skips removed phases automatically
- does not attempt trivia vote/discussion logic anymore

#### 5. Restore host manual phase advancement

The host panel should support advancing the session to the next phase again. This is required as a fallback and operational control.

**Acceptance:**
- Host can manually advance from answer → reveal → results
- Manual phase advancement works on mobile host layout too

#### 6. Update player and host phase rendering

Update rendering logic so both host and player views correctly display:
- answer phase
- reveal phase
- results phase

#### 7. Keep scoring aligned to flow

Scoring must be committed before or during transition into results so that:
- reveal can show winners / correct answer
- results always shows updated leaderboard

### Files to modify in Phase 1

Use your existing structure, but prioritize these areas first:
- `src/features/sociale/socialeService.ts`
- `src/domain/sociale/roundRegistry.ts`
- `src/features/host/SocialePhases/SocialeAnswerPhase.tsx`
- `src/features/host/SocialePhases/SocialeRevealPhase.tsx`
- `src/features/host/SocialePhases/SocialeResultsPhase.tsx`
- `src/features/host/SocialePhases/SocialeVotePhase.tsx`
- `src/features/player/SocialePlayerView.tsx`
- Host panel controls / phase advance button location

### Acceptance criteria for Phase 1
- Topic rounds never enter discussion phase
- Trivia rounds never enter discussion phase
- Trivia rounds never enter vote phase
- All rounds use Answer → Reveal → Results
- Reveal phase exists and renders for both topic and trivia rounds
- Results phase always occurs after scoring is committed
- Host can manually advance phases
- Host controls work on mobile layout

---

## Phase 2 — Trivia Data Correctness and Validation

### Objective

Make trivia actually correct: format-aware, revealable, validated, and snapshot-driven.

This is the most important backend/data phase.

### Required schema change

#### Add accepted_answers to trivia_questions

This is mandatory.

```sql
ALTER TABLE trivia_questions
ADD COLUMN accepted_answers TEXT[] DEFAULT '{}';
```

**Purpose:**
- Store all accepted written-answer variants directly on the question
- Allow written-answer trivia to be graded and revealed correctly
- Avoid relying on incomplete alias coverage alone

### Required trivia fetch shape

Sociales must stop fetching only the prompt. It must fetch complete question data:

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

### Format detection

**Supported formats:**
- `multiple_choice`
- `written_answer`

**Required behavior:**
- `multiple_choice` renders selectable options
- `written_answer` renders text input
- round settings must preserve which format the round uses

### Snapshot round settings at generation/start time

Do not rely on live trivia tables during reveal.

Each trivia round should store a snapshot like:

```typescript
type TriviaRoundSettings =
  | {
      format: 'multiple_choice';
      questionId: string;
      snapshot: {
        prompt: string;
        explanation?: string | null;
        multipleChoice: {
          options: Array<{
            id: string;
            text: string;
          }>;
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

**Why snapshotting is required:**
- reveal phase becomes deterministic
- gameplay does not break if trivia content changes later
- runtime logic becomes simpler and safer

### Validation rules

#### Multiple choice validation

A question is invalid if:
- fewer than 2 options
- no correct option
- more than 1 correct option
- empty prompt
- invalid format

#### Written answer validation

A question is invalid if:
- `accepted_answers` is empty
- prompt is empty
- invalid format

#### Invalid question handling

Invalid trivia questions must be treated as bugged:
- show clear validation error in host flow
- block Sociale creation / generation from using them
- do not allow them into gameplay

### Trivia answer phase behavior

#### Multiple choice
- UI renders answer options
- player submits selected option id
- no text box required

#### Written answer
- UI renders text input
- minimum 1 character
- no longer force larger character threshold
- compare normalized answer against `accepted_answers`

### Trivia scoring rules for v1

Keep these simple.

#### Multiple choice
- correct = full points
- incorrect = zero

#### Written answer
- exact normalized match in `accepted_answers` = full points
- otherwise = zero

Do not implement fuzzy matching, partial credit, or speed bonuses in this phase. Those can be future enhancements.

### Trivia reveal behavior

#### Multiple choice reveal
Show:
- question prompt
- correct option text
- optional explanation

#### Written answer reveal
Show:
- question prompt
- canonical answer = first value in `accepted_answers`
- optional explanation

### Migration / rollout tasks
- Add `accepted_answers`
- Backfill it where possible from existing alias data
- Mark written questions without valid `accepted_answers` as unusable
- Tighten validation in generation/runtime paths
- Test existing packs for invalid data exposure

### Files to modify in Phase 2

Prioritize:
- `src/features/sociale/socialeService.ts`
- trivia fetch/query helpers
- trivia round generation logic
- `src/features/host/SocialePhases/SocialeAnswerPhase.tsx`
- `src/features/host/SocialePhases/SocialeRevealPhase.tsx`
- any shared validation utilities
- any round settings / type definitions

### Acceptance criteria for Phase 2
- `accepted_answers` exists and is used for written trivia
- Sociale fetches full trivia data, not just prompt
- Trivia format is detected correctly
- Multiple choice rounds render options
- Written answer rounds render input
- Reveal phase shows actual correct answer
- Invalid trivia questions are blocked
- Runtime reveal does not depend on live re-querying trivia data
- **Score calculations** - Verify scoring accuracy across all round types
- **Phase timing** - Ensure phase durations work as expected

## Final Validation Checklist

### Pre-Deployment
- [ ] All database migrations tested and verified
- [ ] Edge cases handled with proper error messages
- [ ] Performance benchmarks meet requirements
- [ ] Accessibility standards met (WCAG 2.1 AA)
- [ ] Security review completed (SQL injection prevention)
- [ ] Documentation updated and reviewed

### Post-Deployment Monitoring
- [ ] Error rates monitored for new trivia features
- [ ] Performance metrics tracked (response times, database load)
- [ ] User feedback collected on new trivia experience
- [ ] A/B test results analyzed (if applicable)
- [ ] Rollback plan tested and documented

### Success Metrics
- **Trivia completion rate** > 90%
- **Average answer time** < 30 seconds
- **Error rate** < 1%
- **User satisfaction score** > 4.5/5
- **Performance** < 2 second load times

**The simplified approach uses accepted_answers array instead of complex alias/normalization logic, with comprehensive testing and monitoring to ensure success.**

## Future Enhancements

### Manual Grading System (Planned)
- **Purpose**: Allow hosts to grade written answers that don't match accepted_answers
- **UI**: Host grading interface during/after answer phase
- **Features**:
  - Award partial/full points manually
  - Add new accepted answers to question (improve question quality)
  - Override automatic grading when needed
  - Bulk grading for multiple responses

### Advanced Question Types
- **True/False Questions**: Simple boolean answers
- **Fill-in-the-Blank**: Multiple blanks in a single question
- **Image-based Questions**: Questions with images as prompts or answers
- **Audio/Video Questions**: Multimedia question support

### Enhanced Scoring
- **Speed Bonuses**: Extra points for faster correct answers
- **Streak Bonuses**: Points for consecutive correct answers
- **Difficulty Multipliers**: Higher points for harder questions
- **Team Scoring**: Group-based scoring variations

### Question Management
- **Question Import/Export**: Bulk question management
- **Question Analytics**: Track question performance and difficulty
- **A/B Testing**: Test different question variants
- **Collaborative Editing**: Multiple hosts can edit questions together

### Accessibility Improvements
- **Screen Reader Support**: Enhanced compatibility
- **Keyboard Navigation**: Full keyboard control
- **High Contrast Modes**: Visual accessibility options
- **Text-to-Speech**: Audio question reading

---

## Phase 3 — Host Creation UX and Template Workflow

### Objective

Upgrade the host-side Sociale creation experience after gameplay/runtime correctness is stable.

### Scope

This phase includes template-driven generation, round previews, validation surfacing, regeneration, and mobile-friendly host UX.

### Deliverables

#### 1. Replace coarse game-mode setup with template workflow

Templates:
- Hot Topic
- Trivia
- Alternating
- Custom

#### 2. Dynamic library selection
- Hot Topic → prompt libraries only
- Trivia → trivia libraries only
- Alternating → both prompt and trivia libraries
- Custom → manual round setup

#### 3. Round count selection

Allow host to select number of rounds before applying template.

#### 4. Apply template flow

When host applies a template:
- validate required libraries
- lock UI during generation
- generate rounds in stable order
- validate generated rounds
- atomically update state
- transition to preview / edit view

#### 5. Preview Rounds interface

Each round should show:
- round number
- selected type
- selected library
- generated content
- validation state

#### 6. Bugged question visibility

If a trivia round is invalid:
- show a clear bugged badge
- show actionable error text
- block final Sociale creation until resolved

#### 7. Regeneration controls

Allow reset/regenerate at three levels:
- type
- library
- content

#### 8. Mobile-optimized host layout

The /host panel should be optimized for mobile:
- controls remain reachable
- phase controls visible
- preview cards stack cleanly
- template + round config remains usable on smaller screens

#### 9. Optional UI polish last

Only after everything works:
- collapse/expand animation
- template transition animation
- smoother loading states
- progressive polish

### Files to modify in Phase 3

Based on your proposed structure, likely areas include:
- `src/features/host/components/SocialeCreateModal.tsx`
- `src/features/host/components/TemplateSelector.tsx`
- `src/features/host/components/LibrarySelector.tsx`
- `src/features/host/components/RoundPreview.tsx`
- `src/features/host/components/RoundGenerator.tsx`
- `src/features/host/components/RoundTypeSelector.tsx`
- validation / bugged-question components
- host panel mobile layout components

### Acceptance criteria for Phase 3
- Host can generate rounds via template
- Host sees only relevant libraries for chosen template
- Preview shows round-by-round content and validity
- Bugged rounds are clearly labeled
- Host can regenerate type/library/content
- Final creation is blocked while invalid rounds exist
- /host creation flow is usable on mobile

---

## Detailed Validation Rules

### Trivia question validity

#### Valid multiple choice question
- non-empty prompt
- format is `multiple_choice`
- at least 2 options
- exactly 1 correct option

#### Valid written answer question
- non-empty prompt
- format is `written_answer`
- `accepted_answers.length >= 1`

### Invalid question outcome

Any invalid trivia question:
- must not be silently skipped
- must not be used in gameplay
- must surface clear reason to host
- must block creation until replaced or fixed

## Simplified v1 Scoring Rules

### Topic
- preserve current vote-based scoring behavior unless phase cleanup requires small adjustments

### Trivia multiple choice
- full points for correct
- zero for incorrect

### Trivia written answer
- full points for normalized exact accepted match
- zero for everything else

## Defer to future work

Not part of this implementation:
- fuzzy matching
- partial credit
- speed bonus
- manual grading
- advanced difficulty multipliers

---

## Testing Strategy by Phase

### Phase 1 tests
- topic flow uses answer → reveal → results
- trivia flow uses answer → reveal → results
- no trivia vote phase
- no discussion phase
- host manual advance works
- host mobile layout still exposes controls

### Phase 2 tests
- `accepted_answers` migration succeeds
- written-answer trivia is valid only when accepted answers exist
- multiple-choice trivia requires exactly one correct option
- answer UI switches by format
- reveal uses snapshot data
- reveal shows canonical correct answer
- invalid questions are blocked

### Phase 3 tests
- template validation works
- round generation order is stable
- invalid generated trivia is surfaced
- regeneration works at type/library/content level
- mobile host creation flow is usable
- final create action is blocked if any round is invalid

---

## Implementation Order

1. **Step 1**: Phase 1 runtime flow refactor
2. **Step 2**: Phase 2 schema + trivia correctness
3. **Step 3**: Phase 2 validation + snapshot storage
4. **Step 4**: Phase 3 host creation UX
5. **Step 5**: Phase 3 polish and animation

---

## Updated Success Criteria

### Runtime success
- All Sociale rounds use the correct 3-phase flow
- Reveal phase is meaningful for both topics and trivia
- Results always shows updated leaderboard
- Host can manually advance phases

### Trivia success
- Written answer trivia is backed by `accepted_answers`
- Multiple choice and written answer are both supported
- Reveal shows actual correct answer
- Invalid trivia never reaches live gameplay

### Host tooling success
- Templates reduce setup time
- Invalid rounds are obvious before launch
- Regeneration is easy
- /host works well on mobile

---

## Explicit Non-Goals for This Pass

These should not delay implementation:
- fuzzy grading
- partial credit
- advanced analytics
- A/B testing
- deep animation work
- multimedia question types
- collaborative authoring

---

## Final Note for Windsurf / Implementer

**Do this in order. Do not start by rebuilding the host creation flow first.**

Priority order:
1. fix live phase flow
2. make trivia data correct and revealable
3. upgrade the host creation experience

That sequencing is the safest way to ship this without breaking gameplay. It preserves your original architecture goals while making the implementation much more controllable.

- **Trivia**: Only shows trivia libraries, generates all trivia rounds  
- **Alternating**: Shows both library types, generates alternating rounds
- **Custom**: No library selection required, generates empty rounds for manual configuration

### Template Application Workflow
1. **Template Selection**: User chooses template type
2. **Library Selection**: Relevant libraries appear based on template
3. **Round Count**: User selects number of rounds
4. **Apply**: Generate rounds based on template settings
5. **Animation**: Template section collapses, rounds section expands
6. **Fine-tuning**: User can modify individual rounds as needed

### Race Condition Handling
```typescript
// Template application with proper race condition handling
async function applyTemplate(template: TemplateConfig, libraries: string[], roundCount: number) {
  try {
    // Step 1: Validate template requirements
    const validation = validateTemplateConfig(template, libraries);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Step 2: Lock UI to prevent duplicate submissions
    setApplyingTemplate(true);
    
    // Step 3: Generate all rounds in sequence with proper ordering
    const rounds = await generateRoundsFromTemplate(template, libraries, roundCount);
    
    // Step 4: Validate all generated rounds
    const roundValidation = await validateAllRounds(rounds);
    if (roundValidation.hasErrors) {
      throw new Error('Some generated rounds have validation errors');
    }

    // Step 5: Update state atomically
    setRounds(rounds);
    setTemplateApplied(true);
    
    // Step 6: Animate UI transition
    animateTemplateCollapse();
    animateRoundsExpansion();
    
  } catch (error) {
    // Handle errors gracefully
    showErrorMessage(error.message);
    setApplyingTemplate(false);
  } finally {
    // Always unlock UI
    setApplyingTemplate(false);
  }
}

// Sequential round generation to maintain order
async function generateRoundsFromTemplate(template: TemplateConfig, libraries: string[], roundCount: number): Promise<Round[]> {
  const rounds: Round[] = [];
  
  for (let i = 0; i < roundCount; i++) {
    const roundType = determineRoundType(template, i, roundCount);
    const libraryId = selectLibraryForRound(template, libraries, roundType, i);
    
    try {
      const roundContent = await generateRoundContent(roundType, libraryId);
      const round = {
        id: `round-${i + 1}`,
        order: i + 1,
        type: roundType,
        libraryId,
        ...roundContent
      };
      
      rounds.push(round);
    } catch (error) {
      // Fail fast if any round generation fails
      throw new Error(`Failed to generate round ${i + 1}: ${error.message}`);
    }
  }
  
  return rounds;
}
```

### Template Logic and Library Requirements
```typescript
// Template configuration types
interface TemplateConfig {
  type: 'hot_topic' | 'trivia' | 'alternating' | 'custom';
  requiresPromptLibraries: boolean;
  requiresTriviaLibraries: boolean;
  minPromptLibraries: number;
  minTriviaLibraries: number;
}

const templateConfigs: Record<string, TemplateConfig> = {
  hot_topic: {
    type: 'hot_topic',
    requiresPromptLibraries: true,
    requiresTriviaLibraries: false,
    minPromptLibraries: 1,
    minTriviaLibraries: 0
  },
  trivia: {
    type: 'trivia',
    requiresPromptLibraries: false,
    requiresTriviaLibraries: true,
    minPromptLibraries: 0,
    minTriviaLibraries: 1
  },
  alternating: {
    type: 'alternating',
    requiresPromptLibraries: true,
    requiresTriviaLibraries: true,
    minPromptLibraries: 1,
    minTriviaLibraries: 1
  },
  custom: {
    type: 'custom',
    requiresPromptLibraries: false,
    requiresTriviaLibraries: false,
    minPromptLibraries: 0,
    minTriviaLibraries: 0
  }
};

// Template validation logic
function validateTemplateConfig(template: TemplateConfig, selectedLibraries: string[]) {
  const promptLibraries = selectedLibraries.filter(lib => lib.type === 'prompt');
  const triviaLibraries = selectedLibraries.filter(lib => lib.type === 'trivia');
  
  if (template.requiresPromptLibraries && promptLibraries.length < template.minPromptLibraries) {
    return {
      valid: false,
      error: `This template requires at least ${template.minPromptLibraries} prompt libraries`
    };
  }
  
  if (template.requiresTriviaLibraries && triviaLibraries.length < template.minTriviaLibraries) {
    return {
      valid: false,
      error: `This template requires at least ${template.minTriviaLibraries} trivia libraries`
    };
  }
  
  return { valid: true };
}

// Round type determination for templates
function determineRoundType(template: TemplateConfig, roundIndex: number, totalRounds: number): string {
  switch (template.type) {
    case 'hot_topic':
      return 'topic';
    case 'trivia':
      return 'trivia';
    case 'alternating':
      // Alternate between topic and trivia, starting with topic
      return roundIndex % 2 === 0 ? 'topic' : 'trivia';
    case 'custom':
      throw new Error('Custom template rounds are configured manually');
    default:
      return 'topic';
  }
}

// Library selection for template rounds
function selectLibraryForRound(template: TemplateConfig, libraries: string[], roundType: string, roundIndex: number): string {
  const relevantLibraries = libraries.filter(lib => {
    if (roundType === 'topic') return lib.type === 'prompt';
    if (roundType === 'trivia') return lib.type === 'trivia';
    return false;
  });
  
  if (relevantLibraries.length === 0) {
    throw new Error(`No ${roundType} libraries available for round ${roundIndex + 1}`);
  }
  
  // Round-robin selection through available libraries
  const libraryIndex = roundIndex % relevantLibraries.length;
  return relevantLibraries[libraryIndex];
}
```

### Round Generation Logic
```typescript
// Enhanced round generation for progressive workflow
async function generateRoundContent(type: string, libraryId: string) {
  if (type === 'trivia') {
    // Fetch complete trivia question with options and validation
    const question = await fetchTriviaQuestion(libraryId);
    const validation = validateTriviaQuestion(question);
    
    return {
      type: 'trivia',
      content: question.prompt,
      libraryId,
      settings: {
        format: question.format,
        questionId: question.id,
        // Include complete data for both formats
        ...(question.format === 'multiple_choice' && {
          options: question.trivia_question_options,
          correctOptionId: question.trivia_question_options.find(opt => opt.is_correct)?.option_id
        }),
        ...(question.format === 'written_answer' && {
          acceptedAnswers: question.accepted_answers,
          correctAnswer: question.accepted_answers[0]
        })
      },
      validation
    };
  } else if (type === 'topic') {
    // Fetch topic prompt
    const prompt = await fetchTopicPrompt(libraryId);
    
    return {
      type: 'topic',
      content: prompt,
      libraryId,
      settings: {},
      validation: { valid: true }
    };
  }
}

// Progressive round configuration
interface RoundItem {
  id: string;
  type?: string; // undefined until selected
  libraryId?: string; // undefined until type selected
  content?: string; // undefined until library selected
  settings?: any;
  validation?: ValidationResult;
}
```
Answer → Reveal → Results
```

### Trivia
```
Answer → Reveal → Results
```

### Alternating
For each round:
```
Answer → Reveal → Results
```

### Reveal phase behavior
- **Topics**: reveal the winning / most-voted response
- **Trivia**: reveal the correct answer
- **Results**: always shows updated scores after points are awarded
