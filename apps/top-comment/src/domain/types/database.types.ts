// Database row types matching Supabase table schemas.
// Used to replace `as any` casts in service/hook mapper functions.

import type { RoomStatus } from './room.types';

export interface RoomRow {
  id: string;
  code: string;
  moderator_ids: string[] | null;
  creator_id: string | null;
  host_uid: string | null; // Legacy - keep for backward compatibility
  name: string | null;
  description: string | null;
  status: RoomStatus;
  max_players: number;
  created_at: string | null;
  updated_at: string | null;
  settings: Record<string, unknown> | null;
  current_session_id: string | null;
  current_sociale_id: string | null;
  total_sessions_played: number | null;
}

export interface RoomMembershipRow {
  id: string;
  room_id: string;
  user_id: string;
  player_name: string;
  mascot_id: number | null;
  joined_at: string | null;
  last_active_at: string | null;
  is_host: boolean | null; // Legacy - keep for backward compatibility
  is_mod: boolean | null; // Legacy - keep for backward compatibility
  is_banned: boolean | null;
  ban_reason: string | null;
  banned_at: string | null;
  banned_by: string | null;
  status: string | null;
}

export interface RoomMessageRow {
  id: string;
  room_id: string;
  user_id: string;
  membership_id: string;
  display_name: string;
  content: string;
  created_at: string;
}

export interface InteractionRow {
  id: string;
  room_id: string;
  session_id: string | null;
  created_by: string;
  type: string;
  status: string;
  question: string;
  description: string | null;
  settings: Record<string, unknown> | null;
  answer_seconds: number | null;
  answer_ends_at: string | null;
  voting_seconds: number | null;
  voting_ends_at: string | null;
  created_at: string;
  updated_at: string;
  target_type: string | null;
  target_membership_id: string | null;
  source_membership_id: string | null;
  challenge_status: string | null;
  challenge_expires_at: string | null;
  points_wager: number | null;
  closed_at: string | null;
  response_count: number | null;
  vote_count: number | null;
}

export interface ResponseRow {
  id: string;
  interaction_id: string;
  membership_id: string;
  response_text: string | null;
  response_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface InteractionVoteRow {
  id: string;
  interaction_id: string;
  response_id: string;
  voter_membership_id: string;
  created_at: string;
}

// Trivia table types
export interface TriviaSubmissionRow {
  id: string;
  interaction_id: string | null;
  room_id: string;
  member_id: string;
  submitted_at: string | null;
  latency_ms: number | null;
  payload: Record<string, unknown>;
  status: string;
}

export interface TriviaEvaluationRow {
  id: string;
  submission_id: string | null;
  interaction_id: string | null;
  room_id: string;
  member_id: string;
  result: string;
  points_awarded: number;
  method: string;
  confidence: number | null;
  matched_alias: string | null;
  reasoning_short: string | null;
  grader_version: string;
  judged_at: string;
}

export interface TriviaQuestionRow {
  id: string;
  pack_id: string | null;
  format: string;
  category_key: string;
  difficulty: string;
  prompt: string;
  explanation: string | null;
  hint: string | null;
  media: Record<string, unknown> | null;
  status: string;
  tags: string[] | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface TriviaQuestionPackRow {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_by: string | null;
  created_at: string | null;
}

export interface TriviaQuestionOptionRow {
  id: string;
  question_id: string | null;
  option_id: string;
  option_text: string;
  is_correct: boolean;
  sort_order: number | null;
}

export interface TriviaQuestionAliasRow {
  id: string;
  question_id: string | null;
  alias_text: string;
  alias_normalized: string;
  match_type: string;
}
