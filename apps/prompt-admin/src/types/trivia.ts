export interface TriviaQuestionPack {
  id: string;
  name: string;
  description: string | null;
  status: 'draft' | 'published' | 'archived';
  created_by: string;
  created_at: string;
}

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

export interface TriviaQuestionOption {
  id: string;
  question_id: string;
  option_id: string; // "a", "b", "c", "d"
  option_text: string;
  is_correct: boolean;
  sort_order: number;
}

export interface TriviaQuestionAlias {
  id: string;
  question_id: string;
  alias_text: string;
  alias_normalized: string;
  match_type: 'exact' | 'alias';
}

export interface TriviaQuestionPackWithCounts extends TriviaQuestionPack {
  questionCount: number;
  publishedCount: number;
  draftCount: number;
}

export interface TriviaQuestionWithDetails extends TriviaQuestion {
  options?: TriviaQuestionOption[];
  aliases?: TriviaQuestionAlias[];
}

// Export/import shapes
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
