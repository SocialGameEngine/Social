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
}
