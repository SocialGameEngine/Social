/**
 * Trivia Question Type Definitions
 * 
 * PURPOSE: TypeScript interfaces for the trivia question system supporting
 * both multiple choice and written answer formats.
 * 
 * TABLE RELATIONSHIPS:
 * - trivia_question_packs (1) → trivia_questions (many)
 * - trivia_questions (1) → trivia_question_options (many, for MC only)
 * - trivia_questions (1) → trivia_question_aliases (many, for written only)
 * 
 * QUESTION FORMATS:
 * 1. multiple_choice: 4 options (A, B, C, D), exactly 1 correct
 *    - Stored in trivia_question_options
 *    - UI shows A/B/C/D buttons
 *    
 * 2. written_answer: Free text input with fuzzy matching
 *    - Aliases provide accepted variations ("USA" = "United States")
 *    - Stored in trivia_question_aliases
 *    - accepted_answers array auto-synced from aliases
 * 
 * STATUS LIFECYCLE:
 * draft → published → archived
 * Only 'published' questions appear in active games.
 * 
 * DIFFICULTY LEVELS:
 * easy/medium/hard - used for filtering and AI generation distribution
 * 
 * CATEGORIES:
 * Free-form strings like "science", "pop_culture", "history"
 * Used for filtering and pack organization
 */

/** Pack metadata - a themed collection of trivia questions */
export interface TriviaQuestionPack {
  id: string;
  name: string;
  description: string | null;
  /** Only 'published' packs should be used in active games */
  status: 'draft' | 'published' | 'archived';
  created_by: string;
  created_at: string;
}

/** Individual trivia question - can be multiple choice or written answer */
export interface TriviaQuestion {
  id: string;
  pack_id: string;
  format: 'multiple_choice' | 'written_answer';
  category_key: string;
  difficulty: 'easy' | 'medium' | 'hard';
  prompt: string;
  explanation: string | null;
  hint: string | null;
  media: { image_url?: string; audio_url?: string } | null;
  status: 'draft' | 'published' | 'archived';
  tags: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

/** Multiple choice option (A, B, C, D) - exactly 1 per question must be correct */
export interface TriviaQuestionOption {
  id: string;
  question_id: string;
  option_id: string; // "a", "b", "c", "d"
  option_text: string;
  is_correct: boolean;
  sort_order: number;
}

/** Accepted answer variation for written questions (e.g., "USA" = "United States") */
export interface TriviaQuestionAlias {
  id: string;
  question_id: string;
  alias_text: string;
  alias_normalized: string;
  match_type: 'exact' | 'alias';
}

/** Pack with computed statistics for UI display */
export interface TriviaQuestionPackWithCounts extends TriviaQuestionPack {
  questionCount: number;
  publishedCount: number;
  draftCount: number;
}

/** Question with nested options/aliases for detailed views */
export interface TriviaQuestionWithDetails extends TriviaQuestion {
  options?: TriviaQuestionOption[];
  aliases?: TriviaQuestionAlias[];
}

/**
 * EXPORT/IMPORT SHAPES
 * Used for JSON bulk import from AI generator or manual editing.
 * Flat structure with nested arrays for easy editing in external tools.
 */

/** Single row in JSON export/import file */
export interface TriviaExportRow {
  format: 'multiple_choice' | 'written_answer';
  category_key: string;
  difficulty: 'easy' | 'medium' | 'hard';
  prompt: string;
  explanation?: string;
  hint?: string;
  tags?: string[];
  options?: Array<{
    option_id: string;
    option_text: string;
    is_correct: boolean;
  }>;
  aliases?: string[];
}
