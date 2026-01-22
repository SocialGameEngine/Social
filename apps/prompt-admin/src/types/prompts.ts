export interface PromptLibrary {
  id: string;
  name: string;
  emoji: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Prompt {
  id: string;
  library_id: string;
  text: string;
  variant?: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  times_shown?: number;
  times_answered?: number;
  avg_answer_time_ms?: number | null;
  thumbs_up_count?: number;
  thumbs_down_count?: number;
}

export interface LibraryWithCounts extends PromptLibrary {
  promptCount: number;
}
