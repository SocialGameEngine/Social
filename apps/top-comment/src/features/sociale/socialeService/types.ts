// =============================================================================
// SOCIALE SERVICE TYPES
// =============================================================================
// Type definitions for database rows used in mappers.

import type { Json } from '../../../supabase/types';

/**
 * Database row type for sociales table
 * Uses Partial to handle optional fields from Supabase queries
 */
export type SocialeRow = {
  id: string;
  room_id: string;
  created_by: string;
  title: string | null;
  description?: string | null;
  mode: string;
  status: string;
  current_round_index: number | null;
  current_round_id?: string | null;
  current_phase?: string | null;
  phase_started_at?: string | null;
  phase_ends_at?: string | null;
  paused_remaining_seconds?: number | null;
  total_rounds: number;
  settings?: Json;
  scoreboard?: Json;
  runtime_state?: Json;
  created_at: string;
  updated_at: string;
  started_at?: string | null;
  ended_at?: string | null;
  legacy_session_id?: string | null;
  prompt_library_id?: string | null;
  selected_libraries?: string[] | null;
  current_library_index?: number | null;
};

/**
 * Database row type for sociale_rounds table
 */
export type SocialeRoundRow = {
  id: string;
  sociale_id: string;
  order_index: number;
  type: string;
  title?: string | null;
  content?: string | null;
  settings?: Json;
  phase_sequence?: string[] | null;
  created_at: string;
  updated_at: string;
};

/**
 * Database row type for sociale_round_states table
 */
export type SocialeRoundStateRow = {
  id: string;
  sociale_id: string;
  round_id: string;
  status: string;
  phase: string;
  started_at?: string | null;
  ended_at?: string | null;
  phase_started_at?: string | null;
  phase_ends_at?: string | null;
  answer_ends_at?: string | null;
  voting_ends_at?: string | null;
  reveal_ends_at?: string | null;
  results_ends_at?: string | null;
  derived_state?: Json;
  created_at: string;
  updated_at: string;
};

/**
 * Database row type for socialites table
 */
export type SocialiteRow = {
  id: string;
  sociale_id: string;
  room_id: string;
  user_id?: string | null;
  membership_id: string | null;
  display_name: string;
  mascot_id?: number | null;
  is_host: boolean;
  is_active: boolean;
  is_banned: boolean;
  score: number;
  joined_at: string;
  last_seen_at?: string | null;
  pending_until_round_index?: number | null;
  created_at: string;
  updated_at: string;
};

/**
 * Database row type for sociale_responses table
 */
export type SocialeResponseRow = {
  id: string;
  sociale_id: string;
  round_id: string | null;
  ambient_round_id: string | null;
  resolved_round_id: string | null;
  socialite_id: string;
  type: string;
  value: Json;
  is_correct?: boolean | null;
  score_awarded?: number | null;
  created_at: string;
  updated_at: string;
};

/**
 * Database row type for sociale_votes table
 */
export type SocialeVoteRow = {
  id: string;
  sociale_id: string;
  round_id: string | null;
  ambient_round_id: string | null;
  resolved_round_id: string | null;
  socialite_id: string;
  target_response_id: string;
  created_at: string;
};
