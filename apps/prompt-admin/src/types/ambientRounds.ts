// Mirrors the ambient_rounds table schema.
// settings JSONB matches the SocialeRoundSettings union from the main app.

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
}
