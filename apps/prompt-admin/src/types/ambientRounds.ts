/**
 * Ambient Rounds Type Definitions
 * 
 * PURPOSE: TypeScript interfaces for the autonomous/ambient game mode content system.
 * These types mirror the database schema and are shared between prompt-admin
 * (content management) and the main game app (runtime execution).
 * 
 * AMBIENT MODE CONCEPT:
 * Unlike hosted games with a human MC, ambient mode runs continuously on venue TVs
 * without supervision. The TV cycles through rounds automatically, gathering answers,
 * tallying votes, and displaying results - then loops back to the start.
 * 
 * ROUND TYPES:
 * - trivia: Multiple choice or written answer questions (test knowledge)
 * - topic: Discussion prompts where players submit opinions and vote on favorites
 * 
 * SETTINGS JSONB:
 * The settings field is a discriminated union stored as JSONB. Each round type has
 * its own settings shape that configures timing, scoring, and content display.
 * 
 * PACK SYSTEM:
 * Rounds are organized into "packs" (themed collections). A venue might have:
 * - "General Trivia" pack for everyday content
 * - "Sports Sunday" pack for game day
 * - "The Crown Pub - Custom" pack with venue-specific inside jokes
 */

/** Round types: trivia (knowledge) or topic (opinion/discussion) */
export type AmbientRoundType = 'trivia' | 'topic';
export type TriviaFormat = 'multiple_choice' | 'written_answer';

export interface TriviaMultipleChoiceSettings {
  format: 'multiple_choice';
  categoryKey?: string;
  answerSeconds: number;
  revealSeconds: number;
  resultsSeconds: number;
  pointsCorrect: number;
  speedBonusEnabled: boolean;
  snapshot: {
    prompt: string;
    explanation?: string | null;
    multipleChoice: {
      options: Array<{ id: string; text: string }>;
      correctOptionId: string;
    };
  };
}

export interface TriviaWrittenAnswerSettings {
  format: 'written_answer';
  categoryKey?: string;
  answerSeconds: number;
  revealSeconds: number;
  resultsSeconds: number;
  pointsCorrect: number;
  speedBonusEnabled: boolean;
  snapshot: {
    prompt: string;
    explanation?: string | null;
    writtenAnswer: {
      correctAnswer: string;
      acceptedAnswers: string[];
    };
  };
}

export interface TopicSettings {
  topic: string;
  sortBy: 'upvotes' | 'newest';
  allowUpvotes: boolean;
  answerSeconds: number;
  votingSeconds: number;
  resultsSeconds: number;
}

export type AmbientRoundSettings =
  | TriviaMultipleChoiceSettings
  | TriviaWrittenAnswerSettings
  | TopicSettings;

export interface AmbientRound {
  id: string;
  order_index: number;
  type: AmbientRoundType;
  title: string;
  content: string | null;
  settings: AmbientRoundSettings;
  explanation: string | null;
  hint: string | null;
  created_at?: string;
  updated_at?: string;
}

// Shape used for bulk import/export JSON
export interface AmbientRoundExportRow {
  order_index: number;
  type: AmbientRoundType;
  title: string;
  content: string | null;
  settings: AmbientRoundSettings;
  explanation?: string | null;
  hint?: string | null;
}
