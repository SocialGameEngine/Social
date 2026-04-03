// Shared types for edge functions

export interface Session {
  id: string;
  code: string;
  host_uid: string;
  status: 'lobby' | 'answer' | 'vote' | 'results' | 'ended';
  room_id: string;
  settings: any;
  created_at: string;
  updated_at: string;
}

export interface Round {
  id: string;
  session_id: string;
  round_index: number;
  groups: RoundGroup[];
}

export interface RoundGroup {
  id: string;
  prompt: string;
  team_ids: string[];
}
