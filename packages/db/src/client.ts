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
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
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
export type Session = Tables['sessions']['Row'];
// Define team member interface since it's not in the generated types yet
export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  is_captain: boolean;
  joined_at: string;
}

export type Team = Tables['teams']['Row'] & {
  team_members?: TeamMember[];
};  // Updated: players → teams
export type Answer = Tables['answers']['Row'];  // Updated: submissions → answers
export type Vote = Tables['votes']['Row'];
export type Venue = Tables['venues']['Row'];
// export type EventRound = Tables['event_rounds']['Row'];  // Removed: table doesn't exist
export type User = Tables['users']['Row'];
export type FeedComment = Tables['feed_comments']['Row'];
export type FeedCommentLike = Tables['feed_comment_likes']['Row'];

