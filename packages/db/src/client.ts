/**
 * Supabase Client Configuration
 * Centralized Supabase client instance
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './supabase-types';

let supabaseClient: SupabaseClient<Database> | null = null;

export function getSupabaseClient(): SupabaseClient<Database> {
  if (!supabaseClient) {
    // In browser environments (Vite), use import.meta.env instead of process.env
    const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || (globalThis as any).process?.env?.VITE_SUPABASE_URL;
    const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || (globalThis as any).process?.env?.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    supabaseClient = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }

  return supabaseClient;
}

export function resetClient(): void {
  supabaseClient = null;
}

// Export types for convenience
export type { Database };
export type Tables = Database['public']['Tables'];

// Sociale types
export type Sociale = Tables['sociales']['Row'];
export type SocialeRound = Tables['sociale_rounds']['Row'];
export type SocialeRoundState = Tables['sociale_round_state']['Row'];
export type Socialite = Tables['socialites']['Row'];
export type SocialeResponse = Tables['sociale_responses']['Row'];
export type SocialeVote = Tables['sociale_votes']['Row'];
export type SocialeScoreEvent = Tables['sociale_score_events']['Row'];
export type SocialeAnalytics = Tables['sociale_analytics']['Row'];

// Legacy types (for backwards compatibility during migration)
// Note: These tables may not exist in the generated types
export type Session = any; // Tables['top_comment_sessions']['Row'] || null;
export type Team = any; // Tables['teams']['Row'] || null;
export type Answer = any; // Tables['answers']['Row'] || null (legacy table removed);
export type Vote = any; // Tables['votes']['Row'] || null (legacy table removed);
export type Venue = any; // Tables['venues']['Row'] || null;
export type User = any; // Tables['users']['Row'] || null;
export type FeedComment = any; // Tables['feed_comments']['Row'] || null;
export type FeedCommentLike = any; // Tables['feed_comment_likes']['Row'] || null;

// Define team member interface since it's not in the generated types yet
export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  is_captain: boolean;
  joined_at: string;
}

