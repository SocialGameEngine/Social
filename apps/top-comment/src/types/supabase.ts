// Simple Supabase types to fix TypeScript errors
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      trivia_submissions: {
        Row: {
          id: string
          interaction_id: string | null
          room_id: string
          member_id: string
          submitted_at: string | null
          latency_ms: number | null
          payload: Json
          status: 'accepted' | 'replaced' | 'late' | 'rejected'
        }
        Insert: {
          id?: string
          interaction_id?: string | null
          room_id: string
          member_id: string
          submitted_at?: string | null
          latency_ms?: number | null
          payload: Json
          status?: 'accepted' | 'replaced' | 'late' | 'rejected'
        }
        Update: {
          id?: string
          interaction_id?: string | null
          room_id?: string
          member_id?: string
          submitted_at?: string | null
          latency_ms?: number | null
          payload?: Json
          status?: 'accepted' | 'replaced' | 'late' | 'rejected'
        }
      }
      trivia_evaluations: {
        Row: {
          id: string
          submission_id: string | null
          interaction_id: string | null
          room_id: string
          member_id: string
          result: 'correct' | 'partial' | 'incorrect' | 'needs_review'
          points_awarded: number
          method: 'exact' | 'alias' | 'fuzzy' | 'host_override'
          confidence: number | null
          matched_alias: string | null
          reasoning_short: string | null
          grader_version: string
          judged_at: string
        }
        Insert: {
          id?: string
          submission_id?: string | null
          interaction_id?: string | null
          room_id: string
          member_id: string
          result?: 'correct' | 'partial' | 'incorrect' | 'needs_review'
          points_awarded?: number
          method?: 'exact' | 'alias' | 'fuzzy' | 'host_override'
          confidence?: number | null
          matched_alias?: string | null
          reasoning_short?: string | null
          grader_version?: string
          judged_at?: string
        }
        Update: {
          id?: string
          submission_id?: string | null
          interaction_id?: string | null
          room_id?: string
          member_id?: string
          result?: 'correct' | 'partial' | 'incorrect' | 'needs_review'
          points_awarded?: number
          method?: 'exact' | 'alias' | 'fuzzy' | 'host_override'
          confidence?: number | null
          matched_alias?: string | null
          reasoning_short?: string | null
          grader_version?: string
          judged_at?: string
        }
      }
    }
    Functions: {
      create_trivia_interaction: {
        Args: {
          p_room_id: string
          p_created_by: string
          p_question_id: string
          p_timing: Json
          p_scoring: Json
          p_policy: Json
        }
        Returns: Json
      }
      submit_trivia_answer: {
        Args: {
          p_interaction_id: string
          p_member_id: string
          p_payload: Json
        }
        Returns: Json
      }
      get_trivia_submission: {
        Args: {
          p_interaction_id: string
          p_member_id: string
        }
        Returns: {
          id: string
          interaction_id: string
          room_id: string
          member_id: string
          submitted_at: string
          latency_ms: number
          payload: Json
          status: string
        } | null
      }
      get_trivia_reveal: {
        Args: {
          p_interaction_id: string
          p_member_id: string
        }
        Returns: {
          interaction_id: string
          correct_answer: string
          explanation: string
          total_responses: number
          correct_responses: number
          average_response_time: number
        }[]
      }
    }
  }
}
