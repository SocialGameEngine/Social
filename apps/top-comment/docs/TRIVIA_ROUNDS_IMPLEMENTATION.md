# Trivia Rounds Implementation Guide

## Overview

This guide outlines the implementation of trivia rounds as an alternative to the current prompt-based rounds in the Social Game Engine event platform. The implementation maintains backward compatibility while adding flexibility for mixed gameplay modes.

## Current System Analysis

### Existing Architecture
- **Prompt Libraries**: Collections of creative prompts (`promptLibraries.ts`)
- **Round-based gameplay**: Teams submit creative responses to prompts
- **Answer submission**: 120-character limit with real-time updates
- **Voting system**: Players vote on best answers
- **Game modes**: Classic and Jeopardy already supported

### Key Files to Modify
- `src/domain/types/domain.types.ts` - Core domain types
- `src/shared/types.ts` - Shared API types
- `src/shared/promptLibraries.ts` - Add trivia libraries
- `src/features/*/Phases/AnswerPhase.tsx` - UI components
- `src/features/host/HostPage.tsx` - Host controls

## Implementation Plan

### Phase 1: Type System Extensions

#### 1.1 Domain Types (`domain.types.ts`)

```typescript
// Add to existing domain.types.ts
export type RoundType = 'prompt' | 'trivia';

export interface TriviaQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // Index of correct option
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  explanation?: string; // Optional explanation for correct answer
}

export interface TriviaAnswer {
  id: string;
  teamId: string;
  roundIndex: number;
  questionId: string;
  selectedOption: number;
  isCorrect: boolean;
  submittedAt: string;
  updatedAt?: string;
}

export interface RoundDefinition {
  type: RoundType;
  prompt?: string; // For prompt rounds
  groups: RoundGroup[];
  triviaQuestions?: TriviaQuestion[]; // For trivia rounds
  currentTriviaQuestion?: TriviaQuestion; // Current question in trivia round
  currentQuestionIndex?: number; // Track progress in multi-question trivia rounds
}

export interface SessionSettings {
  answerSecs: number;
  voteSecs: number;
  resultsSecs: number;
  maxTeams: number;
  gameMode?: "classic" | "jeopardy";
  categorySelectSecs?: number;
  selectedCategories?: string[];
  totalRounds?: number;
  // New trivia settings
  roundTypes?: ('prompt' | 'trivia')[];
  triviaLibraryId?: string;
  mixMode?: 'alternate' | 'random' | 'prompt-first' | 'trivia-first';
  triviaQuestionsPerRound?: number;
}

// Update Answer type to handle both prompt and trivia answers
export interface Answer {
  id: string;
  teamId: string;
  roundIndex: number;
  groupId: string;
  text?: string; // For prompt rounds
  triviaAnswerId?: string; // For trivia rounds
  createdAt: string;
  updatedAt?: string;
  masked?: boolean;
}
```

#### 1.2 Shared Types (`shared/types.ts`)

```typescript
// Add to existing shared/types.ts
export interface CreateSessionRequest {
  venueName?: string;
  promptLibraryId?: PromptLibraryId;
  gameMode?: "classic" | "jeopardy";
  selectedCategories?: PromptLibraryId[];
  totalRounds?: number;
  // New trivia options
  roundTypes?: ('prompt' | 'trivia')[];
  triviaLibraryId?: string;
  mixMode?: 'alternate' | 'random' | 'prompt-first' | 'trivia-first';
}

export interface TriviaLibrary {
  id: string;
  name: string;
  emoji: string;
  description: string;
  questions: TriviaQuestion[];
}

export interface SubmitTriviaAnswerRequest {
  sessionId: string;
  questionId: string;
  selectedOption: number;
}

export interface SubmitTriviaAnswerResponse {
  success: boolean;
  isCorrect?: boolean;
  correctAnswer?: number;
  explanation?: string;
}
```

### Phase 2: Trivia Libraries System

#### 2.1 Create Trivia Libraries (`shared/triviaLibraries.ts`)

```typescript
import triviaLibrariesMeta from "./triviaLibraries.meta.json";
import generalKnowledgeQuestions from "./trivia/generalKnowledge.json";
import popCultureQuestions from "./trivia/popCulture.json";
import scienceQuestions from "./trivia/science.json";
import sportsQuestions from "./trivia/sports.json";

const triviaFileMap: Record<string, TriviaQuestion[]> = {
  "generalKnowledge.json": generalKnowledgeQuestions,
  "popCulture.json": popCultureQuestions,
  "science.json": scienceQuestions,
  "sports.json": sportsQuestions,
};

export type TriviaLibraryId = (typeof triviaLibrariesMeta)[number]["id"];

export interface TriviaLibrary {
  id: TriviaLibraryId;
  name: string;
  emoji: string;
  description: string;
  questions: TriviaQuestion[];
}

export const triviaLibraries: TriviaLibrary[] = triviaLibrariesMeta.map(
  (meta) => ({
    id: meta.id as TriviaLibraryId,
    name: meta.name,
    emoji: meta.emoji,
    description: meta.description,
    questions: triviaFileMap[meta.questionFile] ?? generalKnowledgeQuestions,
  }),
);

export const defaultTriviaLibrary = triviaLibraries[0];
export const defaultTriviaLibraryId = defaultTriviaLibrary?.id ?? "general-knowledge";
```

#### 2.2 Trivia Library Metadata (`shared/triviaLibraries.meta.json`)

```json
[
  {
    "id": "general-knowledge",
    "name": "General Knowledge",
    "emoji": "🧠",
    "description": "Classic trivia questions across various categories",
    "questionFile": "generalKnowledge.json"
  },
  {
    "id": "pop-culture",
    "name": "Pop Culture",
    "emoji": "🎬",
    "description": "Movies, music, and celebrity trivia",
    "questionFile": "popCulture.json"
  },
  {
    "id": "science",
    "name": "Science & Nature",
    "emoji": "🔬",
    "description": "Scientific facts and natural world questions",
    "questionFile": "science.json"
  },
  {
    "id": "sports",
    "name": "Sports & Athletics",
    "emoji": "⚽",
    "description": "Sports history, rules, and famous athletes",
    "questionFile": "sports.json"
  }
]
```

#### 2.3 Sample Trivia Questions (`shared/trivia/generalKnowledge.json`)

```json
[
  {
    "id": "gk-001",
    "question": "What is the capital of France?",
    "options": ["London", "Berlin", "Paris", "Madrid"],
    "correctAnswer": 2,
    "category": "Geography",
    "difficulty": "easy",
    "explanation": "Paris has been the capital of France since 987 AD."
  },
  {
    "id": "gk-002",
    "question": "Which planet is known as the Red Planet?",
    "options": ["Venus", "Mars", "Jupiter", "Saturn"],
    "correctAnswer": 1,
    "category": "Science",
    "difficulty": "easy",
    "explanation": "Mars appears red due to iron oxide on its surface."
  }
]
```

### Phase 3: UI Components

#### 3.1 Trivia Answer Phase (`features/team/Phases/TriviaAnswerPhase.tsx`)

```typescript
import { Card, Button, SessionTimer, ProgressBar } from "@social/ui";
import { useTheme } from "../../../shared/providers/ThemeProvider";
import type { Session, TriviaQuestion } from "../../../shared/types";

interface TriviaAnswerPhaseProps {
  session: Session;
  currentQuestion: TriviaQuestion | null;
  selectedOption: number | null;
  setSelectedOption: (option: number) => void;
  handleSubmitAnswer: () => void;
  isSubmittingAnswer: boolean;
  totalSeconds: number;
  hasAnswered: boolean;
  correctAnswer?: number;
  explanation?: string;
}

export function TriviaAnswerPhase({
  session,
  currentQuestion,
  selectedOption,
  setSelectedOption,
  handleSubmitAnswer,
  isSubmittingAnswer,
  totalSeconds,
  hasAnswered,
  correctAnswer,
  explanation,
}: TriviaAnswerPhaseProps) {
  const { isDark } = useTheme();

  if (!currentQuestion) {
    return (
      <Card isDark={isDark}>
        <div className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm text-cyan-300">Loading question...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="space-y-4 p-4" isDark={isDark}>
      {/* Timer and Progress */}
      <div className="space-y-2 text-center">
        <div className="rounded-2xl px-3 py-2 shadow-2xl text-xs font-semibold bg-slate-800 text-cyan-100">
          <SessionTimer
            endTime={session.endsAt}
            totalSeconds={totalSeconds}
            paused={session.paused}
            label="Time left"
            size="sm"
            showProgressBar={false}
            isDark={isDark}
          />
        </div>
        <div className="rounded-full p-0.5 shadow-inner bg-slate-700/80 shadow-slate-600">
          <ProgressBar endTime={session.endsAt} totalSeconds={totalSeconds} paused={session.paused} />
        </div>
      </div>

      {/* Round Info */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 backdrop-blur-sm">
          <span className="text-lg">🧠</span>
          <span className="text-xs font-semibold text-blue-200">Trivia Round</span>
        </div>
      </div>

      <p className="text-center text-xs font-semibold uppercase tracking-wide sm:text-sm text-cyan-200">
        Round {session.roundIndex + 1}
      </p>

      {/* Question */}
      <div className="rounded-3xl px-4 py-4 text-center shadow-xl border-2 bg-gradient-to-br from-blue-900/40 to-purple-900/40 border-blue-400/50 text-blue-100">
        <h3 className="text-xl font-bold mb-2 text-white">
          {currentQuestion.category}
        </h3>
        <p className="text-lg font-semibold text-white">
          {currentQuestion.question}
        </p>
      </div>

      {/* Answer Options */}
      <div className="space-y-3">
        {currentQuestion.options.map((option, index) => {
          let optionStyle = "border-cyan-400/30 hover:border-cyan-400/50";
          let textStyle = "text-white";
          
          if (hasAnswered) {
            if (index === correctAnswer) {
              optionStyle = "border-green-400 bg-green-900/20";
              textStyle = "text-green-300";
            } else if (index === selectedOption && index !== correctAnswer) {
              optionStyle = "border-red-400 bg-red-900/20";
              textStyle = "text-red-300";
            }
          } else if (selectedOption === index) {
            optionStyle = "border-cyan-400 bg-cyan-900/20";
            textStyle = "text-cyan-300";
          }

          return (
            <button
              key={index}
              onClick={() => !hasAnswered && setSelectedOption(index)}
              disabled={hasAnswered}
              className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${optionStyle} ${
                hasAnswered ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-cyan-900/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm ${optionStyle}`}>
                  {String.fromCharCode(65 + index)}
                </div>
                <span className={`font-medium ${textStyle}`}>
                  {option}
                </span>
                {hasAnswered && index === correctAnswer && (
                  <span className="ml-auto text-green-400">✓</span>
                )}
                {hasAnswered && index === selectedOption && index !== correctAnswer && (
                  <span className="ml-auto text-red-400">✗</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {hasAnswered && explanation && (
        <div className="rounded-2xl p-4 bg-blue-900/20 border border-blue-400/30">
          <p className="text-sm text-blue-200">
            <strong>Explanation:</strong> {explanation}
          </p>
        </div>
      )}

      {/* Submit Button */}
      {!hasAnswered && (
        <Button
          onClick={handleSubmitAnswer}
          disabled={selectedOption === null || isSubmittingAnswer}
          isLoading={isSubmittingAnswer}
          fullWidth
          size="sm"
        >
          {isSubmittingAnswer ? 'Submitting...' : 'Submit Answer'}
        </Button>
      )}
    </Card>
  );
}
```

#### 3.2 Trivia Library Selector (`features/host/components/TriviaLibrarySelector.tsx`)

```typescript
import { useMemo, useState } from "react";
import { useTheme } from "../../../shared/providers/ThemeProvider";
import { useTriviaLibraries } from "../../../shared/hooks/useTriviaLibraries";
import type { TriviaLibrary, TriviaLibraryId } from "../../../shared/types";

interface TriviaLibrarySelectorProps {
  selectedId: TriviaLibraryId;
  onSelect: (id: TriviaLibraryId) => void;
  disabled?: boolean;
}

export function TriviaLibrarySelector({
  selectedId,
  onSelect,
  disabled = false,
}: TriviaLibrarySelectorProps) {
  const { isDark } = useTheme();
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<TriviaLibraryId | null>(null);
  const { data: triviaLibraries, isLoading } = useTriviaLibraries();

  const filteredLibraries = useMemo(() => {
    if (!triviaLibraries) return [];
    const value = query.trim().toLowerCase();
    if (!value) return triviaLibraries;
    return triviaLibraries.filter((library) =>
      `${library.emoji} ${library.name} ${library.description}`
        .toLowerCase()
        .includes(value),
    );
  }, [query, triviaLibraries]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1">
        <p className={`text-sm font-semibold ${!isDark ? 'text-slate-800' : 'text-slate-200'}`}>
          Trivia library
        </p>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search trivia libraries"
          className={`px-4 py-2 text-sm placeholder:text-slate-400 border rounded-lg focus:outline-none focus:ring-2 ${!isDark ? 'bg-white border-slate-200 focus:border-brand-primary focus:ring-brand-light' : 'bg-slate-700 border-slate-600 text-white focus:border-cyan-400 focus:ring-cyan-400/20'}`}
          disabled={disabled}
        />
      </div>
      
      <div className={`border rounded-lg overflow-hidden max-h-[60vh] overflow-y-auto ${!isDark ? 'border-slate-200' : 'border-slate-600'}`}>
        {isLoading && (
          <div className={`p-4 text-sm text-center ${!isDark ? 'text-slate-600' : 'text-slate-400'}`}>
            Loading trivia libraries...
          </div>
        )}
        {!isLoading && filteredLibraries.length === 0 && (
          <div className={`p-4 text-sm text-center ${!isDark ? 'text-slate-600' : 'text-slate-400'}`}>
            {query ? 'No libraries found. Try a different search.' : 'No trivia libraries available'}
          </div>
        )}
        {!isLoading && filteredLibraries.map((library: TriviaLibrary, index: number) => {
          const isExpanded = expandedId === library.id;
          const isSelected = selectedId === library.id;
          const isLast = index === filteredLibraries.length - 1;
          
          return (
            <div 
              key={library.id} 
              className={`${!isLast ? (isDark ? 'border-b border-slate-600' : 'border-b border-slate-200') : ''}`}
            >
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : library.id)}
                disabled={disabled}
                className={`w-full flex items-center justify-between p-4 text-left transition-colors ${
                  disabled 
                    ? 'cursor-not-allowed opacity-50' 
                    : !isDark 
                      ? 'hover:bg-slate-50' 
                      : 'hover:bg-slate-700/50'
                } ${isSelected ? (!isDark ? 'bg-blue-light/20' : 'bg-blue-900/20') : ''}`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-2xl" aria-hidden="true">
                    {library.emoji}
                  </span>
                  <div className="flex-1">
                    <span className={`font-medium ${!isDark ? 'text-slate-900' : 'text-slate-100'}`}>
                      {library.name}
                    </span>
                    <div className={`text-xs ${!isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {library.questions.length} questions
                    </div>
                  </div>
                </div>
                <span className={`text-sm ${!isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {isExpanded ? '▲' : '▼'}
                </span>
              </button>

              {isExpanded && (
                <div className={`px-4 pb-4 space-y-3 ${!isDark ? 'bg-slate-50' : 'bg-slate-800/50'}`}>
                  <p className={`text-sm ${!isDark ? 'text-slate-600' : 'text-slate-300'}`}>
                    {library.description}
                  </p>
                  
                  {!isSelected && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!disabled) {
                          onSelect(library.id);
                          setExpandedId(null);
                        }
                      }}
                      disabled={disabled}
                      className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                        disabled
                          ? 'cursor-not-allowed opacity-50'
                          : !isDark
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-blue-600 text-white hover:bg-blue-500'
                      }`}
                    >
                      Select This Library
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### Phase 4: Host Controls

#### 4.1 Round Type Selector (`features/host/components/RoundTypeSelector.tsx`)

```typescript
import { useTheme } from "../../../shared/providers/ThemeProvider";

interface RoundTypeSelectorProps {
  roundTypes: ('prompt' | 'trivia')[];
  onChange: (roundTypes: ('prompt' | 'trivia')[]) => void;
  disabled?: boolean;
}

export function RoundTypeSelector({
  roundTypes,
  onChange,
  disabled = false,
}: RoundTypeSelectorProps) {
  const { isDark } = useTheme();

  const handleToggle = (type: 'prompt' | 'trivia') => {
    if (roundTypes.includes(type)) {
      if (roundTypes.length > 1) {
        onChange(roundTypes.filter(t => t !== type));
      }
    } else {
      onChange([...roundTypes, type]);
    }
  };

  return (
    <div className="space-y-3">
      <p className={`text-sm font-semibold ${!isDark ? 'text-slate-800' : 'text-slate-200'}`}>
        Round Types
      </p>
      <div className="space-y-2">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={roundTypes.includes('prompt')}
            onChange={() => handleToggle('prompt')}
            disabled={disabled}
            className="w-4 h-4 text-brand-primary rounded focus:ring-brand-primary"
          />
          <div className="flex items-center gap-2">
            <span className="text-lg">🔥</span>
            <span className={`text-sm ${!isDark ? 'text-slate-700' : 'text-slate-300'}`}>
              Prompt Rounds
            </span>
          </div>
        </label>
        
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={roundTypes.includes('trivia')}
            onChange={() => handleToggle('trivia')}
            disabled={disabled}
            className="w-4 h-4 text-brand-primary rounded focus:ring-brand-primary"
          />
          <div className="flex items-center gap-2">
            <span className="text-lg">🧠</span>
            <span className={`text-sm ${!isDark ? 'text-slate-700' : 'text-slate-300'}`}>
              Trivia Rounds
            </span>
          </div>
        </label>
      </div>
    </div>
  );
}
```

### Phase 5: Game Logic Updates

#### 5.1 Round Type Mixer (`shared/utils/roundMixer.ts`)

```typescript
export type MixMode = 'alternate' | 'random' | 'prompt-first' | 'trivia-first';

export interface RoundPlan {
  roundIndex: number;
  type: 'prompt' | 'trivia';
}

export function generateRoundPlan(
  totalRounds: number,
  roundTypes: ('prompt' | 'trivia')[],
  mixMode: MixMode = 'alternate'
): RoundPlan[] {
  const plan: RoundPlan[] = [];
  
  if (roundTypes.length === 1) {
    // Only one type selected
    for (let i = 0; i < totalRounds; i++) {
      plan.push({ roundIndex: i, type: roundTypes[0] });
    }
    return plan;
  }

  switch (mixMode) {
    case 'alternate':
      for (let i = 0; i < totalRounds; i++) {
        plan.push({
          roundIndex: i,
          type: i % 2 === 0 ? roundTypes[0] : roundTypes[1]
        });
      }
      break;
      
    case 'random':
      for (let i = 0; i < totalRounds; i++) {
        plan.push({
          roundIndex: i,
          type: roundTypes[Math.floor(Math.random() * roundTypes.length)]
        });
      }
      break;
      
    case 'prompt-first':
      const promptRounds = Math.ceil(totalRounds / 2);
      for (let i = 0; i < totalRounds; i++) {
        plan.push({
          roundIndex: i,
          type: i < promptRounds ? 'prompt' : 'trivia'
        });
      }
      break;
      
    case 'trivia-first':
      const triviaRounds = Math.ceil(totalRounds / 2);
      for (let i = 0; i < totalRounds; i++) {
        plan.push({
          roundIndex: i,
          type: i < triviaRounds ? 'trivia' : 'prompt'
        });
      }
      break;
  }

  return plan;
}
```

## Migration Strategy

### Step 1: Backward Compatibility
- All existing sessions continue to work without changes
- Default to prompt-only rounds for existing sessions
- New optional fields in types don't break existing code

### Step 2: Gradual Rollout
- Phase 1: Implement type system and data structures
- Phase 2: Create trivia libraries and sample questions
- Phase 3: Build UI components for trivia gameplay
- Phase 4: Add host controls for round type selection
- Phase 5: Implement mixed gameplay logic
- Phase 6: Testing and refinement

### Step 3: Testing Strategy
- Unit tests for trivia answer validation
- Integration tests for mixed round transitions
- UI tests for trivia components
- End-to-end tests for complete trivia sessions

## API Endpoints to Add

### Trivia Libraries
```
GET /api/trivia-libraries
GET /api/trivia-libraries/:id
```

### Trivia Gameplay
```
POST /api/sessions/:id/trivia-answer
GET /api/sessions/:id/current-trivia-question
```

### Session Management
```
PUT /api/sessions/:id/settings
```

## Database Schema Changes

### Sessions Table
```sql
ALTER TABLE sessions 
ADD COLUMN round_types TEXT[], -- ['prompt', 'trivia']
ADD COLUMN trivia_library_id VARCHAR(255),
ADD COLUMN mix_mode VARCHAR(50) DEFAULT 'alternate',
ADD COLUMN trivia_questions_per_round INTEGER DEFAULT 1;
```

### Trivia Answers Table
```sql
CREATE TABLE trivia_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id),
  round_index INTEGER NOT NULL,
  question_id VARCHAR(255) NOT NULL,
  selected_option INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);
```

## Prompt-Admin Integration for Trivia Management

### Overview
The prompt-admin system needs to be extended to support trivia question management alongside existing prompt libraries. This includes CRUD operations for trivia questions, library management, and quality control features.

### Phase 11: Prompt-Admin Extensions

#### 11.1 Trivia Library Management UI

**Location**: `src/features/admin/components/TriviaLibraryManager.tsx`

```typescript
import { useState, useMemo } from 'react';
import { useTheme } from '../../../shared/providers/ThemeProvider';
import { useTriviaLibraries, useCreateTriviaLibrary, useUpdateTriviaLibrary, useDeleteTriviaLibrary } from '../../../shared/hooks/useTriviaLibraries';
import type { TriviaLibrary, TriviaQuestion } from '../../../shared/types';

interface TriviaLibraryManagerProps {
  onLibrarySelect?: (library: TriviaLibrary) => void;
}

export function TriviaLibraryManager({ onLibrarySelect }: TriviaLibraryManagerProps) {
  const { isDark } = useTheme();
  const { data: libraries, isLoading } = useTriviaLibraries();
  const createLibrary = useCreateTriviaLibrary();
  const updateLibrary = useUpdateTriviaLibrary();
  const deleteLibrary = useDeleteTriviaLibrary();
  
  const [selectedLibrary, setSelectedLibrary] = useState<TriviaLibrary | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingLibrary, setEditingLibrary] = useState<TriviaLibrary | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className={`text-2xl font-bold ${!isDark ? 'text-slate-900' : 'text-slate-100'}`}>
          Trivia Libraries
        </h2>
        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + New Library
        </button>
      </div>

      {/* Library Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {libraries?.map((library) => (
          <div
            key={library.id}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedLibrary?.id === library.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
            }`}
            onClick={() => {
              setSelectedLibrary(library);
              onLibrarySelect?.(library);
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{library.emoji}</span>
              <h3 className={`font-semibold ${!isDark ? 'text-slate-900' : 'text-slate-100'}`}>
                {library.name}
              </h3>
            </div>
            <p className={`text-sm mb-3 ${!isDark ? 'text-slate-600' : 'text-slate-300'}`}>
              {library.description}
            </p>
            <div className="flex justify-between items-center">
              <span className={`text-xs ${!isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {library.questions.length} questions
              </span>
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingLibrary(library);
                  }}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Delete this library?')) {
                      deleteLibrary.mutate(library.id);
                    }
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Library Modal */}
      {(isCreating || editingLibrary) && (
        <TriviaLibraryForm
          library={editingLibrary}
          onSave={(library) => {
            if (editingLibrary) {
              updateLibrary.mutate(library);
            } else {
              createLibrary.mutate(library);
            }
            setIsCreating(false);
            setEditingLibrary(null);
          }}
          onCancel={() => {
            setIsCreating(false);
            setEditingLibrary(null);
          }}
        />
      )}

      {/* Question Editor */}
      {selectedLibrary && (
        <TriviaQuestionEditor
          library={selectedLibrary}
          onLibraryUpdate={(updatedLibrary) => {
            setSelectedLibrary(updatedLibrary);
            updateLibrary.mutate(updatedLibrary);
          }}
        />
      )}
    </div>
  );
}
```

#### 11.2 Trivia Library Form

**Location**: `src/features/admin/components/TriviaLibraryForm.tsx`

```typescript
import { useState } from 'react';
import { useTheme } from '../../../shared/providers/ThemeProvider';
import type { TriviaLibrary } from '../../../shared/types';

interface TriviaLibraryFormProps {
  library?: TriviaLibrary | null;
  onSave: (library: TriviaLibrary) => void;
  onCancel: () => void;
}

export function TriviaLibraryForm({ library, onSave, onCancel }: TriviaLibraryFormProps) {
  const { isDark } = useTheme();
  const [formData, setFormData] = useState({
    id: library?.id || '',
    name: library?.name || '',
    emoji: library?.emoji || '🧠',
    description: library?.description || '',
    questions: library?.questions || [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData as TriviaLibrary);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`w-full max-w-md p-6 rounded-lg ${!isDark ? 'bg-white' : 'bg-slate-800'}`}>
        <h3 className={`text-xl font-bold mb-4 ${!isDark ? 'text-slate-900' : 'text-slate-100'}`}>
          {library ? 'Edit Library' : 'Create Library'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${!isDark ? 'text-slate-700' : 'text-slate-300'}`}>
              Library ID
            </label>
            <input
              type="text"
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg ${!isDark ? 'bg-white border-slate-300' : 'bg-slate-700 border-slate-600 text-white'}`}
              disabled={!!library} // Don't allow editing ID after creation
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${!isDark ? 'text-slate-700' : 'text-slate-300'}`}>
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg ${!isDark ? 'bg-white border-slate-300' : 'bg-slate-700 border-slate-600 text-white'}`}
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${!isDark ? 'text-slate-700' : 'text-slate-300'}`}>
              Emoji
            </label>
            <input
              type="text"
              value={formData.emoji}
              onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg ${!isDark ? 'bg-white border-slate-300' : 'bg-slate-700 border-slate-600 text-white'}`}
              maxLength={2}
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${!isDark ? 'text-slate-700' : 'text-slate-300'}`}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg ${!isDark ? 'bg-white border-slate-300' : 'bg-slate-700 border-slate-600 text-white'}`}
              rows={3}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {library ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className={`flex-1 px-4 py-2 border rounded-lg ${!isDark ? 'border-slate-300 text-slate-700 hover:bg-slate-50' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}`}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

#### 11.3 Trivia Question Editor

**Location**: `src/features/admin/components/TriviaQuestionEditor.tsx`

```typescript
import { useState } from 'react';
import { useTheme } from '../../../shared/providers/ThemeProvider';
import type { TriviaLibrary, TriviaQuestion } from '../../../shared/types';

interface TriviaQuestionEditorProps {
  library: TriviaLibrary;
  onLibraryUpdate: (library: TriviaLibrary) => void;
}

export function TriviaQuestionEditor({ library, onLibraryUpdate }: TriviaQuestionEditorProps) {
  const { isDark } = useTheme();
  const [questions, setQuestions] = useState<TriviaQuestion[]>(library.questions);
  const [editingQuestion, setEditingQuestion] = useState<TriviaQuestion | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleSaveQuestion = (question: TriviaQuestion) => {
    let updatedQuestions: TriviaQuestion[];
    
    if (editingQuestion) {
      updatedQuestions = questions.map(q => q.id === question.id ? question : q);
    } else {
      updatedQuestions = [...questions, question];
    }
    
    setQuestions(updatedQuestions);
    onLibraryUpdate({ ...library, questions: updatedQuestions });
    setEditingQuestion(null);
    setIsCreating(false);
  };

  const handleDeleteQuestion = (questionId: string) => {
    if (confirm('Delete this question?')) {
      const updatedQuestions = questions.filter(q => q.id !== questionId);
      setQuestions(updatedQuestions);
      onLibraryUpdate({ ...library, questions: updatedQuestions });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className={`text-lg font-semibold ${!isDark ? 'text-slate-900' : 'text-slate-100'}`}>
          Questions ({questions.length})
        </h3>
        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          + Add Question
        </button>
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {questions.map((question, index) => (
          <div
            key={question.id}
            className={`p-4 rounded-lg border ${!isDark ? 'border-slate-200 bg-white' : 'border-slate-600 bg-slate-800'}`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-sm font-medium ${!isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                    #{index + 1}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded ${!isDark ? 'bg-slate-100 text-slate-600' : 'bg-slate-700 text-slate-300'}`}>
                    {question.category || 'Uncategorized'}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded ${
                    question.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                    question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {question.difficulty || 'medium'}
                  </span>
                </div>
                <h4 className={`font-medium mb-2 ${!isDark ? 'text-slate-900' : 'text-slate-100'}`}>
                  {question.question}
                </h4>
                <div className="space-y-1">
                  {question.options.map((option, optIndex) => (
                    <div
                      key={optIndex}
                      className={`flex items-center gap-2 text-sm ${
                        optIndex === question.correctAnswer
                          ? !isDark ? 'text-green-600 font-medium' : 'text-green-400 font-medium'
                          : !isDark ? 'text-slate-600' : 'text-slate-400'
                      }`}
                    >
                      <span>{String.fromCharCode(65 + optIndex)}.</span>
                      <span>{option}</span>
                      {optIndex === question.correctAnswer && <span>✓</span>}
                    </div>
                  ))}
                </div>
                {question.explanation && (
                  <p className={`text-sm mt-2 italic ${!isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    💡 {question.explanation}
                  </p>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => setEditingQuestion(question)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteQuestion(question.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Question Form Modal */}
      {(isCreating || editingQuestion) && (
        <TriviaQuestionForm
          question={editingQuestion}
          onSave={handleSaveQuestion}
          onCancel={() => {
            setIsCreating(false);
            setEditingQuestion(null);
          }}
          existingIds={questions.map(q => q.id)}
        />
      )}
    </div>
  );
}
```

#### 11.4 Trivia Question Form

**Location**: `src/features/admin/components/TriviaQuestionForm.tsx`

```typescript
import { useState } from 'react';
import { useTheme } from '../../../shared/providers/ThemeProvider';
import type { TriviaQuestion } from '../../../shared/types';

interface TriviaQuestionFormProps {
  question?: TriviaQuestion | null;
  onSave: (question: TriviaQuestion) => void;
  onCancel: () => void;
  existingIds: string[];
}

export function TriviaQuestionForm({ question, onSave, onCancel, existingIds }: TriviaQuestionFormProps) {
  const { isDark } = useTheme();
  const [formData, setFormData] = useState({
    id: question?.id || '',
    question: question?.question || '',
    options: question?.options || ['', '', '', ''],
    correctAnswer: question?.correctAnswer || 0,
    category: question?.category || '',
    difficulty: question?.difficulty || 'medium' as 'easy' | 'medium' | 'hard',
    explanation: question?.explanation || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate ID is unique
    if (!question && existingIds.includes(formData.id)) {
      alert('Question ID must be unique');
      return;
    }
    
    // Validate all options are filled
    if (formData.options.some(opt => opt.trim() === '')) {
      alert('All options must be filled');
      return;
    }
    
    onSave(formData as TriviaQuestion);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-lg ${!isDark ? 'bg-white' : 'bg-slate-800'}`}>
        <h3 className={`text-xl font-bold mb-4 ${!isDark ? 'text-slate-900' : 'text-slate-100'}`}>
          {question ? 'Edit Question' : 'Create Question'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${!isDark ? 'text-slate-700' : 'text-slate-300'}`}>
                Question ID
              </label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg ${!isDark ? 'bg-white border-slate-300' : 'bg-slate-700 border-slate-600 text-white'}`}
                disabled={!!question}
                placeholder="e.g., gk-001"
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${!isDark ? 'text-slate-700' : 'text-slate-300'}`}>
                Category
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg ${!isDark ? 'bg-white border-slate-300' : 'bg-slate-700 border-slate-600 text-white'}`}
                placeholder="e.g., Geography"
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${!isDark ? 'text-slate-700' : 'text-slate-300'}`}>
              Question
            </label>
            <textarea
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg ${!isDark ? 'bg-white border-slate-300' : 'bg-slate-700 border-slate-600 text-white'}`}
              rows={3}
              placeholder="Enter your question here..."
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${!isDark ? 'text-slate-700' : 'text-slate-300'}`}>
              Answer Options
            </label>
            <div className="space-y-2">
              {formData.options.map((option, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm ${!isDark ? 'border-slate-300' : 'border-slate-600'}`}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className={`flex-1 px-3 py-2 border rounded-lg ${!isDark ? 'bg-white border-slate-300' : 'bg-slate-700 border-slate-600 text-white'}`}
                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    required
                  />
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={formData.correctAnswer === index}
                    onChange={() => setFormData({ ...formData, correctAnswer: index })}
                    className="w-4 h-4"
                  />
                  <label className={`text-sm ${!isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                    Correct
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${!isDark ? 'text-slate-700' : 'text-slate-300'}`}>
                Difficulty
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as 'easy' | 'medium' | 'hard' })}
                className={`w-full px-3 py-2 border rounded-lg ${!isDark ? 'bg-white border-slate-300' : 'bg-slate-700 border-slate-600 text-white'}`}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${!isDark ? 'text-slate-700' : 'text-slate-300'}`}>
              Explanation (Optional)
            </label>
            <textarea
              value={formData.explanation}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg ${!isDark ? 'bg-white border-slate-300' : 'bg-slate-700 border-slate-600 text-white'}`}
              rows={2}
              placeholder="Explain why this answer is correct..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {question ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className={`flex-1 px-4 py-2 border rounded-lg ${!isDark ? 'border-slate-300 text-slate-700 hover:bg-slate-50' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}`}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

#### 11.5 Admin API Hooks

**Location**: `src/shared/hooks/useTriviaLibraries.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TriviaLibrary, TriviaQuestion } from '../types';

// API functions
const fetchTriviaLibraries = async (): Promise<TriviaLibrary[]> => {
  const response = await fetch('/api/admin/trivia-libraries');
  if (!response.ok) throw new Error('Failed to fetch trivia libraries');
  return response.json();
};

const createTriviaLibrary = async (library: Omit<TriviaLibrary, 'questions'>): Promise<TriviaLibrary> => {
  const response = await fetch('/api/admin/trivia-libraries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(library),
  });
  if (!response.ok) throw new Error('Failed to create trivia library');
  return response.json();
};

const updateTriviaLibrary = async (library: TriviaLibrary): Promise<TriviaLibrary> => {
  const response = await fetch(`/api/admin/trivia-libraries/${library.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(library),
  });
  if (!response.ok) throw new Error('Failed to update trivia library');
  return response.json();
};

const deleteTriviaLibrary = async (libraryId: string): Promise<void> => {
  const response = await fetch(`/api/admin/trivia-libraries/${libraryId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete trivia library');
};

// Hooks
export const useTriviaLibraries = () => {
  return useQuery({
    queryKey: ['trivia-libraries'],
    queryFn: fetchTriviaLibraries,
  });
};

export const useCreateTriviaLibrary = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createTriviaLibrary,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trivia-libraries'] });
    },
  });
};

export const useUpdateTriviaLibrary = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateTriviaLibrary,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trivia-libraries'] });
    },
  });
};

export const useDeleteTriviaLibrary = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteTriviaLibrary,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trivia-libraries'] });
    },
  });
};
```

#### 11.6 Admin API Endpoints

**Backend Routes to Add**:

```typescript
// src/routes/admin/trivia.ts
import express from 'express';
import { requireAdmin } from '../middleware/auth';
import * as triviaService from '../services/triviaService';

const router = express.Router();

// Get all trivia libraries
router.get('/trivia-libraries', requireAdmin, async (req, res) => {
  try {
    const libraries = await triviaService.getAllTriviaLibraries();
    res.json(libraries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trivia libraries' });
  }
});

// Create trivia library
router.post('/trivia-libraries', requireAdmin, async (req, res) => {
  try {
    const library = await triviaService.createTriviaLibrary(req.body);
    res.json(library);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create trivia library' });
  }
});

// Update trivia library
router.put('/trivia-libraries/:id', requireAdmin, async (req, res) => {
  try {
    const library = await triviaService.updateTriviaLibrary(req.params.id, req.body);
    res.json(library);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update trivia library' });
  }
});

// Delete trivia library
router.delete('/trivia-libraries/:id', requireAdmin, async (req, res) => {
  try {
    await triviaService.deleteTriviaLibrary(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete trivia library' });
  }
});

// Bulk import questions
router.post('/trivia-libraries/:id/import', requireAdmin, async (req, res) => {
  try {
    const { questions } = req.body;
    const library = await triviaService.importQuestions(req.params.id, questions);
    res.json(library);
  } catch (error) {
    res.status(500).json({ error: 'Failed to import questions' });
  }
});

// Export library as JSON
router.get('/trivia-libraries/:id/export', requireAdmin, async (req, res) => {
  try {
    const library = await triviaService.getTriviaLibrary(req.params.id);
    res.setHeader('Content-Disposition', `attachment; filename="${library.id}.json"`);
    res.json(library);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export trivia library' });
  }
});

export default router;
```

#### 11.7 Admin Navigation Integration

**Update**: `src/features/admin/AdminPage.tsx`

```typescript
// Add trivia management to admin navigation
const adminSections = [
  { id: 'prompts', label: 'Prompt Libraries', icon: '🔥' },
  { id: 'trivia', label: 'Trivia Libraries', icon: '🧠' }, // Add this
  { id: 'sessions', label: 'Sessions', icon: '🎮' },
  { id: 'users', label: 'Users', icon: '👥' },
  { id: 'analytics', label: 'Analytics', icon: '📊' },
];

// Add trivia section to render logic
case 'trivia':
  return <TriviaLibraryManager />;
```

#### 11.8 Quality Control Features

**Location**: `src/features/admin/components/TriviaQualityControl.tsx`

```typescript
interface QualityMetrics {
  totalQuestions: number;
  categories: Record<string, number>;
  difficulty: Record<string, number>;
  avgExplanationLength: number;
  questionsWithoutExplanations: number;
  duplicateIds: string[];
}

export function TriviaQualityControl({ library }: { library: TriviaLibrary }) {
  const metrics = useMemo(() => {
    const categories: Record<string, number> = {};
    const difficulty: Record<string, number> = { easy: 0, medium: 0, hard: 0 };
    let totalExplanationLength = 0;
    let questionsWithoutExplanations = 0;
    const ids = new Set<string>();
    const duplicateIds: string[] = [];

    library.questions.forEach(q => {
      // Category stats
      categories[q.category || 'Uncategorized'] = (categories[q.category || 'Uncategorized'] || 0) + 1;
      
      // Difficulty stats
      difficulty[q.difficulty || 'medium']++;
      
      // Explanation stats
      if (q.explanation) {
        totalExplanationLength += q.explanation.length;
      } else {
        questionsWithoutExplanations++;
      }
      
      // Duplicate ID check
      if (ids.has(q.id)) {
        duplicateIds.push(q.id);
      } else {
        ids.add(q.id);
      }
    });

    return {
      totalQuestions: library.questions.length,
      categories,
      difficulty,
      avgExplanationLength: totalExplanationLength / library.questions.length,
      questionsWithoutExplanations,
      duplicateIds,
    };
  }, [library]);

  return (
    <div className={`p-4 rounded-lg ${!isDark ? 'bg-slate-50' : 'bg-slate-800'}`}>
      <h4 className={`font-semibold mb-3 ${!isDark ? 'text-slate-900' : 'text-slate-100'}`}>
        Quality Metrics
      </h4>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <div className={`text-2xl font-bold ${!isDark ? 'text-slate-900' : 'text-slate-100'}`}>
            {metrics.totalQuestions}
          </div>
          <div className={`text-sm ${!isDark ? 'text-slate-600' : 'text-slate-400'}`}>
            Total Questions
          </div>
        </div>
        
        <div>
          <div className={`text-2xl font-bold ${!isDark ? 'text-slate-900' : 'text-slate-100'}`}>
            {Object.keys(metrics.categories).length}
          </div>
          <div className={`text-sm ${!isDark ? 'text-slate-600' : 'text-slate-400'}`}>
            Categories
          </div>
        </div>
        
        <div>
          <div className={`text-2xl font-bold ${!isDark ? 'text-slate-900' : 'text-slate-100'}`}>
            {Math.round(metrics.avgExplanationLength)}
          </div>
          <div className={`text-sm ${!isDark ? 'text-slate-600' : 'text-slate-400'}`}>
            Avg Explanation Length
          </div>
        </div>
        
        <div>
          <div className={`text-2xl font-bold ${metrics.questionsWithoutExplanations > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {metrics.questionsWithoutExplanations}
          </div>
          <div className={`text-sm ${!isDark ? 'text-slate-600' : 'text-slate-400'}`}>
            Missing Explanations
          </div>
        </div>
      </div>

      {/* Issues */}
      {(metrics.duplicateIds.length > 0 || metrics.questionsWithoutExplanations > 0) && (
        <div className={`p-3 rounded-lg ${!isDark ? 'bg-yellow-50 border-yellow-200' : 'bg-yellow-900/20 border-yellow-700'} border`}>
          <h5 className={`font-medium mb-2 ${!isDark ? 'text-yellow-800' : 'text-yellow-200'}`}>
            ⚠️ Quality Issues Found
          </h5>
          <ul className={`text-sm space-y-1 ${!isDark ? 'text-yellow-700' : 'text-yellow-300'}`}>
            {metrics.duplicateIds.length > 0 && (
              <li>• Duplicate question IDs: {metrics.duplicateIds.join(', ')}</li>
            )}
            {metrics.questionsWithoutExplanations > 0 && (
              <li>• {metrics.questionsWithoutExplanations} questions lack explanations</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
```

### Phase 12: Import/Export Functionality

#### 12.1 Bulk Import Features

```typescript
// CSV/JSON import functionality
export const parseTriviaCSV = (csvText: string): TriviaQuestion[] => {
  const lines = csvText.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1).map((line, index) => {
    const values = line.split(',').map(v => v.trim());
    
    return {
      id: values[0] || `imported-${index}`,
      question: values[1] || '',
      options: [values[2], values[3], values[4], values[5]],
      correctAnswer: parseInt(values[6]) || 0,
      category: values[7] || '',
      difficulty: (values[8] as 'easy' | 'medium' | 'hard') || 'medium',
      explanation: values[9] || '',
    };
  });
};

// Export functionality
export const exportToCSV = (questions: TriviaQuestion[]): string => {
  const headers = ['ID', 'Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer', 'Category', 'Difficulty', 'Explanation'];
  const rows = questions.map(q => [
    q.id,
    q.question,
    ...q.options,
    q.correctAnswer.toString(),
    q.category || '',
    q.difficulty || 'medium',
    q.explanation || '',
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
};
```

### Benefits of Prompt-Admin Integration

1. **Centralized Management**: All trivia content managed alongside prompts
2. **Quality Control**: Built-in validation and metrics
3. **Bulk Operations**: Import/export for large question sets
4. **Version Control**: Track changes to trivia libraries
5. **Collaboration**: Multiple admins can manage content
6. **Immediate Updates**: Changes reflected in live games
7. **Analytics**: Track question performance and usage

This integration provides a complete admin interface for managing trivia content with the same level of sophistication as the existing prompt system.

## Future Enhancements

### Advanced Trivia Features
- Multiple difficulty levels per round
- Category selection for trivia rounds
- Team vs Team trivia battles
- Lightning rounds with shorter timers
- Image and video-based questions

### Analytics and Reporting
- Trivia performance metrics by category
- Team strength analysis
- Question difficulty calibration
- Engagement comparison between round types

### UI/UX Improvements
- Animated reveal of correct answers
- Score streaks and combos
- Leaderboard animations
- Team celebration effects

## Conclusion

This implementation provides a robust foundation for adding trivia rounds to your event platform while maintaining full backward compatibility. The modular design allows for easy extension and customization based on user feedback and requirements.

The phased approach ensures minimal disruption to existing functionality while gradually introducing new features. The mixed gameplay modes offer variety and keep players engaged across different types of challenges.
