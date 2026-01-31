// Shared types for Edge Functions

export type SessionStatus = 'lobby' | 'category-select' | 'answer' | 'vote' | 'results' | 'ended';

export interface SessionSettings {
  answerSecs: number;
  voteSecs: number;
  resultsSecs: number;
  maxTeams: number;
  gameMode?: 'classic' | 'jeopardy' | 'mashup';
  categorySelectSecs?: number;
  selectedCategories?: string[];
  librarySetupSecs?: number;
}

export interface RoundGroup {
  id: string;
  prompt: string;
  teamIds: string[];
  promptLibraryId?: string;
  selectingTeamId?: string;
}

export interface Round {
  prompt?: string;
  groups: RoundGroup[];
}

export interface Session {
  id: string;
  code: string;
  host_uid: string;
  status: SessionStatus;
  round_index: number;
  rounds: Round[];
  vote_group_index?: number | null;
  prompt_deck: string[];
  prompt_cursor: number;
  prompt_library_id: string;
  selected_libraries?: string[];
  current_library_index?: number;
  category_grid?: {
    categories: Array<{
      id: string;
      usedPrompts: number[];
    }>;
    totalSlots: number;
  };
  settings: SessionSettings;
  venue_name?: string;
  venue_key?: string;
  created_at: string;
  started_at?: string;
  ended_at?: string;
  ends_at?: string;
}

export interface Team {
  id: string;
  session_id: string;
  uid: string;
  team_name: string;
  is_host: boolean;
  score: number;
  mascot_id?: number;
  joined_at: string;
  last_active_at: string;
}

export interface Answer {
  id: string;
  session_id: string;
  team_id: string;
  round_index: number;
  group_id: string;
  text: string;
  masked: boolean;
  created_at: string;
}

export interface Vote {
  id: string;
  session_id: string;
  voter_id: string;
  answer_id: string;
  round_index: number;
  group_id: string;
  created_at: string;
}


