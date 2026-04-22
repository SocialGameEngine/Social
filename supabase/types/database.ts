export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ambient_rounds: {
        Row: {
          content: string | null
          created_at: string
          id: string
          order_index: number
          settings: Json
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          order_index: number
          settings?: Json
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          order_index?: number
          settings?: Json
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      answers: {
        Row: {
          created_at: string
          group_id: string
          id: string
          masked: boolean
          round_index: number
          session_id: string
          team_id: string
          text: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          masked?: boolean
          round_index: number
          session_id: string
          team_id: string
          text: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          masked?: boolean
          round_index?: number
          session_id?: string
          team_id?: string
          text?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      audience_submissions: {
        Row: {
          category: string | null
          created_at: string
          id: string
          membership_id: string
          question_text: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          room_id: string
          status: string
          updated_at: string | null
          used_in_interaction_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          membership_id: string
          question_text: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          room_id: string
          status?: string
          updated_at?: string | null
          used_in_interaction_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          membership_id?: string
          question_text?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          room_id?: string
          status?: string
          updated_at?: string | null
          used_in_interaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audience_submissions_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "room_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audience_submissions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "room_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audience_submissions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_analytics_view"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "audience_submissions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      interactions: {
        Row: {
          answer_ends_at: string | null
          answer_seconds: number | null
          challenge_expires_at: string | null
          challenge_status: string | null
          closed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          points_wager: number | null
          poll_options: Json | null
          question: string
          response_count: number | null
          room_id: string
          settings: Json | null
          sort_by: string
          source_membership_id: string | null
          status: string
          target_membership_id: string | null
          target_type: string | null
          type: string
          vote_count: number | null
          voting_ends_at: string | null
          voting_seconds: number | null
        }
        Insert: {
          answer_ends_at?: string | null
          answer_seconds?: number | null
          challenge_expires_at?: string | null
          challenge_status?: string | null
          closed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          points_wager?: number | null
          poll_options?: Json | null
          question: string
          response_count?: number | null
          room_id: string
          settings?: Json | null
          sort_by?: string
          source_membership_id?: string | null
          status?: string
          target_membership_id?: string | null
          target_type?: string | null
          type?: string
          vote_count?: number | null
          voting_ends_at?: string | null
          voting_seconds?: number | null
        }
        Update: {
          answer_ends_at?: string | null
          answer_seconds?: number | null
          challenge_expires_at?: string | null
          challenge_status?: string | null
          closed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          points_wager?: number | null
          poll_options?: Json | null
          question?: string
          response_count?: number | null
          room_id?: string
          settings?: Json | null
          sort_by?: string
          source_membership_id?: string | null
          status?: string
          target_membership_id?: string | null
          target_type?: string | null
          type?: string
          vote_count?: number | null
          voting_ends_at?: string | null
          voting_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "interactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_account_info"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "interactions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_analytics_view"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "interactions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_source_membership_id_fkey"
            columns: ["source_membership_id"]
            isOneToOne: false
            referencedRelation: "room_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_target_membership_id_fkey"
            columns: ["target_membership_id"]
            isOneToOne: false
            referencedRelation: "room_memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      player_accounts: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string
          favorite_genres: string[] | null
          id: string
          last_login_at: string | null
          notifications_enabled: boolean | null
          player_level: number | null
          preferred_difficulty: string | null
          status: string | null
          total_games_played: number | null
          total_points: number | null
          total_wins: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name: string
          favorite_genres?: string[] | null
          id?: string
          last_login_at?: string | null
          notifications_enabled?: boolean | null
          player_level?: number | null
          preferred_difficulty?: string | null
          status?: string | null
          total_games_played?: number | null
          total_points?: number | null
          total_wins?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string
          favorite_genres?: string[] | null
          id?: string
          last_login_at?: string | null
          notifications_enabled?: boolean | null
          player_level?: number | null
          preferred_difficulty?: string | null
          status?: string | null
          total_games_played?: number | null
          total_points?: number | null
          total_wins?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_account_info"
            referencedColumns: ["user_id"]
          },
        ]
      }
      player_blocks: {
        Row: {
          blocked_membership_id: string
          blocker_membership_id: string
          created_at: string
          id: string
          room_id: string
        }
        Insert: {
          blocked_membership_id: string
          blocker_membership_id: string
          created_at?: string
          id?: string
          room_id: string
        }
        Update: {
          blocked_membership_id?: string
          blocker_membership_id?: string
          created_at?: string
          id?: string
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_blocks_blocked_membership_id_fkey"
            columns: ["blocked_membership_id"]
            isOneToOne: false
            referencedRelation: "room_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_blocks_blocker_membership_id_fkey"
            columns: ["blocker_membership_id"]
            isOneToOne: false
            referencedRelation: "room_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_blocks_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_analytics_view"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "player_blocks_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_libraries: {
        Row: {
          created_at: string
          description: string
          emoji: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          emoji: string
          id: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          emoji?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      prompts: {
        Row: {
          avg_answer_time_ms: number | null
          created_at: string
          id: string
          is_active: boolean
          library_id: string
          sort_order: number
          text: string
          thumbs_down_count: number
          thumbs_up_count: number
          times_answered: number
          times_shown: number
          updated_at: string
          variant: string | null
        }
        Insert: {
          avg_answer_time_ms?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          library_id: string
          sort_order?: number
          text: string
          thumbs_down_count?: number
          thumbs_up_count?: number
          times_answered?: number
          times_shown?: number
          updated_at?: string
          variant?: string | null
        }
        Update: {
          avg_answer_time_ms?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          library_id?: string
          sort_order?: number
          text?: string
          thumbs_down_count?: number
          thumbs_up_count?: number
          times_answered?: number
          times_shown?: number
          updated_at?: string
          variant?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prompts_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "prompt_libraries"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          action_taken: string | null
          content_id: string | null
          content_type: string
          created_at: string
          description: string | null
          id: string
          reason: string
          reported_membership_id: string | null
          reporter_membership_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          room_id: string
          status: string
        }
        Insert: {
          action_taken?: string | null
          content_id?: string | null
          content_type: string
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reported_membership_id?: string | null
          reporter_membership_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          room_id: string
          status?: string
        }
        Update: {
          action_taken?: string | null
          content_id?: string | null
          content_type?: string
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reported_membership_id?: string | null
          reporter_membership_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          room_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reported_membership_id_fkey"
            columns: ["reported_membership_id"]
            isOneToOne: false
            referencedRelation: "room_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_membership_id_fkey"
            columns: ["reporter_membership_id"]
            isOneToOne: false
            referencedRelation: "room_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "room_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_analytics_view"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "reports_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      responses: {
        Row: {
          created_at: string
          id: string
          interaction_id: string
          membership_id: string
          text: string
          upvote_count: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          interaction_id: string
          membership_id: string
          text: string
          upvote_count?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          interaction_id?: string
          membership_id?: string
          text?: string
          upvote_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "responses_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "interactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responses_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "room_memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      room_memberships: {
        Row: {
          ban_reason: string | null
          banned_at: string | null
          banned_by: string | null
          id: string
          is_banned: boolean | null
          is_host: boolean | null
          is_muted: boolean | null
          joined_at: string | null
          last_active_at: string | null
          mascot_id: number | null
          mute_expires_at: string | null
          muted_at: string | null
          muted_by: string | null
          player_name: string
          room_id: string
          status: string | null
          user_id: string
        }
        Insert: {
          ban_reason?: string | null
          banned_at?: string | null
          banned_by?: string | null
          id?: string
          is_banned?: boolean | null
          is_host?: boolean | null
          is_muted?: boolean | null
          joined_at?: string | null
          last_active_at?: string | null
          mascot_id?: number | null
          mute_expires_at?: string | null
          muted_at?: string | null
          muted_by?: string | null
          player_name: string
          room_id: string
          status?: string | null
          user_id: string
        }
        Update: {
          ban_reason?: string | null
          banned_at?: string | null
          banned_by?: string | null
          id?: string
          is_banned?: boolean | null
          is_host?: boolean | null
          is_muted?: boolean | null
          joined_at?: string | null
          last_active_at?: string | null
          mascot_id?: number | null
          mute_expires_at?: string | null
          muted_at?: string | null
          muted_by?: string | null
          player_name?: string
          room_id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_memberships_banned_by_fkey"
            columns: ["banned_by"]
            isOneToOne: false
            referencedRelation: "user_account_info"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "room_memberships_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_analytics_view"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "room_memberships_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_account_info"
            referencedColumns: ["user_id"]
          },
        ]
      }
      room_messages: {
        Row: {
          content: string
          content_type: string
          created_at: string
          hidden_by: string | null
          id: string
          is_hidden: boolean
          membership_id: string
          metadata: Json
          room_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          content_type?: string
          created_at?: string
          hidden_by?: string | null
          id?: string
          is_hidden?: boolean
          membership_id: string
          metadata?: Json
          room_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          content_type?: string
          created_at?: string
          hidden_by?: string | null
          id?: string
          is_hidden?: boolean
          membership_id?: string
          metadata?: Json
          room_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_messages_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "room_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_analytics_view"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "room_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_account_info"
            referencedColumns: ["user_id"]
          },
        ]
      }
      rooms: {
        Row: {
          code: string
          created_at: string | null
          creator_id: string | null
          current_session_id: string | null
          current_sociale_id: string | null
          description: string | null
          host_uid: string
          id: string
          max_players: number
          moderator_ids: string[] | null
          name: string | null
          settings: Json | null
          status: string | null
          total_sessions_played: number | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          creator_id?: string | null
          current_session_id?: string | null
          current_sociale_id?: string | null
          description?: string | null
          host_uid: string
          id?: string
          max_players?: number
          moderator_ids?: string[] | null
          name?: string | null
          settings?: Json | null
          status?: string | null
          total_sessions_played?: number | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          creator_id?: string | null
          current_session_id?: string | null
          current_sociale_id?: string | null
          description?: string | null
          host_uid?: string
          id?: string
          max_players?: number
          moderator_ids?: string[] | null
          name?: string | null
          settings?: Json | null
          status?: string | null
          total_sessions_played?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_rooms_current_session"
            columns: ["current_session_id"]
            isOneToOne: false
            referencedRelation: "top_comment_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_current_sociale_id_fkey"
            columns: ["current_sociale_id"]
            isOneToOne: false
            referencedRelation: "sociales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_host_uid_fkey"
            columns: ["host_uid"]
            isOneToOne: false
            referencedRelation: "user_account_info"
            referencedColumns: ["user_id"]
          },
        ]
      }
      sociale_analytics: {
        Row: {
          category: string
          created_at: string
          id: string
          metadata: Json | null
          metric: string
          round_id: string | null
          sociale_id: string
          value: Json
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          metadata?: Json | null
          metric: string
          round_id?: string | null
          sociale_id: string
          value: Json
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          metric?: string
          round_id?: string | null
          sociale_id?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "sociale_analytics_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "sociale_rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sociale_analytics_sociale_id_fkey"
            columns: ["sociale_id"]
            isOneToOne: false
            referencedRelation: "sociales"
            referencedColumns: ["id"]
          },
        ]
      }
      sociale_responses: {
        Row: {
          created_at: string
          id: string
          is_correct: boolean | null
          round_id: string
          score_awarded: number | null
          sociale_id: string
          socialite_id: string
          type: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          is_correct?: boolean | null
          round_id: string
          score_awarded?: number | null
          sociale_id: string
          socialite_id: string
          type: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          id?: string
          is_correct?: boolean | null
          round_id?: string
          score_awarded?: number | null
          sociale_id?: string
          socialite_id?: string
          type?: string
          updated_at?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "sociale_responses_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "sociale_rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sociale_responses_sociale_id_fkey"
            columns: ["sociale_id"]
            isOneToOne: false
            referencedRelation: "sociales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sociale_responses_socialite_id_fkey"
            columns: ["socialite_id"]
            isOneToOne: false
            referencedRelation: "socialites"
            referencedColumns: ["id"]
          },
        ]
      }
      sociale_round_state: {
        Row: {
          answer_ends_at: string | null
          created_at: string
          derived_state: Json
          ended_at: string | null
          id: string
          paused_remaining_seconds: number | null
          phase: string
          phase_ends_at: string | null
          phase_started_at: string | null
          results_ends_at: string | null
          reveal_ends_at: string | null
          round_id: string
          sociale_id: string
          started_at: string | null
          status: string
          updated_at: string
          voting_ends_at: string | null
        }
        Insert: {
          answer_ends_at?: string | null
          created_at?: string
          derived_state?: Json
          ended_at?: string | null
          id?: string
          paused_remaining_seconds?: number | null
          phase?: string
          phase_ends_at?: string | null
          phase_started_at?: string | null
          results_ends_at?: string | null
          reveal_ends_at?: string | null
          round_id: string
          sociale_id: string
          started_at?: string | null
          status?: string
          updated_at?: string
          voting_ends_at?: string | null
        }
        Update: {
          answer_ends_at?: string | null
          created_at?: string
          derived_state?: Json
          ended_at?: string | null
          id?: string
          paused_remaining_seconds?: number | null
          phase?: string
          phase_ends_at?: string | null
          phase_started_at?: string | null
          results_ends_at?: string | null
          reveal_ends_at?: string | null
          round_id?: string
          sociale_id?: string
          started_at?: string | null
          status?: string
          updated_at?: string
          voting_ends_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sociale_round_state_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "sociale_rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sociale_round_state_sociale_id_fkey"
            columns: ["sociale_id"]
            isOneToOne: false
            referencedRelation: "sociales"
            referencedColumns: ["id"]
          },
        ]
      }
      sociale_rounds: {
        Row: {
          content: string | null
          created_at: string
          id: string
          order_index: number
          phase_sequence: string[] | null
          settings: Json
          sociale_id: string
          title: string | null
          type: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          order_index: number
          phase_sequence?: string[] | null
          settings?: Json
          sociale_id: string
          title?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          order_index?: number
          phase_sequence?: string[] | null
          settings?: Json
          sociale_id?: string
          title?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sociale_rounds_sociale_id_fkey"
            columns: ["sociale_id"]
            isOneToOne: false
            referencedRelation: "sociales"
            referencedColumns: ["id"]
          },
        ]
      }
      sociale_score_events: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          points: number
          reason: string
          round_id: string | null
          sociale_id: string
          socialite_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          points: number
          reason: string
          round_id?: string | null
          sociale_id: string
          socialite_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          points?: number
          reason?: string
          round_id?: string | null
          sociale_id?: string
          socialite_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sociale_score_events_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "sociale_rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sociale_score_events_sociale_id_fkey"
            columns: ["sociale_id"]
            isOneToOne: false
            referencedRelation: "sociales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sociale_score_events_socialite_id_fkey"
            columns: ["socialite_id"]
            isOneToOne: false
            referencedRelation: "socialites"
            referencedColumns: ["id"]
          },
        ]
      }
      sociale_votes: {
        Row: {
          created_at: string
          id: string
          round_id: string
          sociale_id: string
          socialite_id: string
          target_response_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          round_id: string
          sociale_id: string
          socialite_id: string
          target_response_id: string
        }
        Update: {
          created_at?: string
          id?: string
          round_id?: string
          sociale_id?: string
          socialite_id?: string
          target_response_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sociale_votes_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "sociale_rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sociale_votes_sociale_id_fkey"
            columns: ["sociale_id"]
            isOneToOne: false
            referencedRelation: "sociales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sociale_votes_socialite_id_fkey"
            columns: ["socialite_id"]
            isOneToOne: false
            referencedRelation: "socialites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sociale_votes_target_response_id_fkey"
            columns: ["target_response_id"]
            isOneToOne: false
            referencedRelation: "sociale_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      sociales: {
        Row: {
          created_at: string
          created_by: string
          current_phase: string | null
          current_round_id: string | null
          current_round_index: number | null
          description: string | null
          ended_at: string | null
          id: string
          legacy_session_id: string | null
          mode: string
          paused_remaining_seconds: number | null
          phase_ends_at: string | null
          phase_started_at: string | null
          room_id: string
          runtime_state: Json | null
          scoreboard: Json
          settings: Json
          started_at: string | null
          status: string
          title: string | null
          total_rounds: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          current_phase?: string | null
          current_round_id?: string | null
          current_round_index?: number | null
          description?: string | null
          ended_at?: string | null
          id?: string
          legacy_session_id?: string | null
          mode?: string
          paused_remaining_seconds?: number | null
          phase_ends_at?: string | null
          phase_started_at?: string | null
          room_id: string
          runtime_state?: Json | null
          scoreboard?: Json
          settings?: Json
          started_at?: string | null
          status?: string
          title?: string | null
          total_rounds?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          current_phase?: string | null
          current_round_id?: string | null
          current_round_index?: number | null
          description?: string | null
          ended_at?: string | null
          id?: string
          legacy_session_id?: string | null
          mode?: string
          paused_remaining_seconds?: number | null
          phase_ends_at?: string | null
          phase_started_at?: string | null
          room_id?: string
          runtime_state?: Json | null
          scoreboard?: Json
          settings?: Json
          started_at?: string | null
          status?: string
          title?: string | null
          total_rounds?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sociales_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_account_info"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "sociales_legacy_session_id_fkey"
            columns: ["legacy_session_id"]
            isOneToOne: false
            referencedRelation: "top_comment_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sociales_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_analytics_view"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "sociales_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      socialites: {
        Row: {
          created_at: string
          display_name: string
          id: string
          is_active: boolean
          is_banned: boolean
          is_host: boolean
          joined_at: string
          last_seen_at: string | null
          mascot_id: number | null
          membership_id: string | null
          pending_until_round_index: number | null
          room_id: string
          score: number
          sociale_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          is_active?: boolean
          is_banned?: boolean
          is_host?: boolean
          joined_at?: string
          last_seen_at?: string | null
          mascot_id?: number | null
          membership_id?: string | null
          pending_until_round_index?: number | null
          room_id: string
          score?: number
          sociale_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          is_active?: boolean
          is_banned?: boolean
          is_host?: boolean
          joined_at?: string
          last_seen_at?: string | null
          mascot_id?: number | null
          membership_id?: string | null
          pending_until_round_index?: number | null
          room_id?: string
          score?: number
          sociale_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "socialites_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "room_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "socialites_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_analytics_view"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "socialites_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "socialites_sociale_id_fkey"
            columns: ["sociale_id"]
            isOneToOne: false
            referencedRelation: "sociales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "socialites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_account_info"
            referencedColumns: ["user_id"]
          },
        ]
      }
      top_comment_answers: {
        Row: {
          created_at: string
          group_id: string
          id: string
          masked: boolean | null
          player_id: string
          round_index: number
          session_id: string
          text: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          masked?: boolean | null
          player_id: string
          round_index: number
          session_id: string
          text: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          masked?: boolean | null
          player_id?: string
          round_index?: number
          session_id?: string
          text?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "top_comment_answers_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "top_comment_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "top_comment_answers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "top_comment_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      top_comment_players: {
        Row: {
          display_name: string
          id: string
          joined_at: string
          last_active_at: string | null
          score: number
          session_id: string
          user_id: string
        }
        Insert: {
          display_name: string
          id?: string
          joined_at?: string
          last_active_at?: string | null
          score?: number
          session_id: string
          user_id: string
        }
        Update: {
          display_name?: string
          id?: string
          joined_at?: string
          last_active_at?: string | null
          score?: number
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "top_comment_players_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "top_comment_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      top_comment_sessions: {
        Row: {
          auto_assigned_players: string[] | null
          code: string
          created_at: string
          current_library_index: number | null
          ended_at: string | null
          ended_by_host: boolean | null
          ends_at: string | null
          host_uid: string
          id: string
          paused: boolean | null
          paused_at: string | null
          prompt_cursor: number | null
          prompt_deck: Json | null
          prompt_library_id: string | null
          room_id: string | null
          round_index: number
          rounds: Json
          selected_libraries: string[] | null
          settings: Json
          started_at: string | null
          status: string
          total_paused_ms: number | null
          venue_name: string | null
          vote_group_index: number | null
        }
        Insert: {
          auto_assigned_players?: string[] | null
          code: string
          created_at?: string
          current_library_index?: number | null
          ended_at?: string | null
          ended_by_host?: boolean | null
          ends_at?: string | null
          host_uid: string
          id?: string
          paused?: boolean | null
          paused_at?: string | null
          prompt_cursor?: number | null
          prompt_deck?: Json | null
          prompt_library_id?: string | null
          room_id?: string | null
          round_index?: number
          rounds?: Json
          selected_libraries?: string[] | null
          settings?: Json
          started_at?: string | null
          status: string
          total_paused_ms?: number | null
          venue_name?: string | null
          vote_group_index?: number | null
        }
        Update: {
          auto_assigned_players?: string[] | null
          code?: string
          created_at?: string
          current_library_index?: number | null
          ended_at?: string | null
          ended_by_host?: boolean | null
          ends_at?: string | null
          host_uid?: string
          id?: string
          paused?: boolean | null
          paused_at?: string | null
          prompt_cursor?: number | null
          prompt_deck?: Json | null
          prompt_library_id?: string | null
          room_id?: string | null
          round_index?: number
          rounds?: Json
          selected_libraries?: string[] | null
          settings?: Json
          started_at?: string | null
          status?: string
          total_paused_ms?: number | null
          venue_name?: string | null
          vote_group_index?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "top_comment_sessions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_analytics_view"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "top_comment_sessions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      top_comment_votes: {
        Row: {
          answer_id: string
          created_at: string
          group_id: string
          id: string
          player_id: string
          round_index: number
          session_id: string
        }
        Insert: {
          answer_id: string
          created_at?: string
          group_id: string
          id?: string
          player_id: string
          round_index: number
          session_id: string
        }
        Update: {
          answer_id?: string
          created_at?: string
          group_id?: string
          id?: string
          player_id?: string
          round_index?: number
          session_id?: string
        }
        Relationships: []
      }
      trivia_evaluations: {
        Row: {
          confidence: number | null
          grader_version: string
          id: string
          interaction_id: string | null
          judged_at: string | null
          matched_alias: string | null
          member_id: string
          method: string | null
          points_awarded: number
          reasoning_short: string | null
          result: string | null
          room_id: string
          submission_id: string | null
        }
        Insert: {
          confidence?: number | null
          grader_version: string
          id?: string
          interaction_id?: string | null
          judged_at?: string | null
          matched_alias?: string | null
          member_id: string
          method?: string | null
          points_awarded: number
          reasoning_short?: string | null
          result?: string | null
          room_id: string
          submission_id?: string | null
        }
        Update: {
          confidence?: number | null
          grader_version?: string
          id?: string
          interaction_id?: string | null
          judged_at?: string | null
          matched_alias?: string | null
          member_id?: string
          method?: string | null
          points_awarded?: number
          reasoning_short?: string | null
          result?: string | null
          room_id?: string
          submission_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trivia_evaluations_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "interactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trivia_evaluations_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "trivia_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      trivia_question_aliases: {
        Row: {
          alias_normalized: string
          alias_text: string
          id: string
          match_type: string | null
          question_id: string | null
        }
        Insert: {
          alias_normalized: string
          alias_text: string
          id?: string
          match_type?: string | null
          question_id?: string | null
        }
        Update: {
          alias_normalized?: string
          alias_text?: string
          id?: string
          match_type?: string | null
          question_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trivia_question_aliases_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "trivia_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      trivia_question_options: {
        Row: {
          id: string
          is_correct: boolean
          option_id: string
          option_text: string
          question_id: string | null
          sort_order: number | null
        }
        Insert: {
          id?: string
          is_correct: boolean
          option_id: string
          option_text: string
          question_id?: string | null
          sort_order?: number | null
        }
        Update: {
          id?: string
          is_correct?: boolean
          option_id?: string
          option_text?: string
          question_id?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trivia_question_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "trivia_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      trivia_question_packs: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trivia_question_packs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_account_info"
            referencedColumns: ["user_id"]
          },
        ]
      }
      trivia_questions: {
        Row: {
          accepted_answers: string[] | null
          category_key: string
          created_at: string | null
          created_by: string | null
          difficulty: string | null
          explanation: string | null
          format: string | null
          hint: string | null
          id: string
          media: Json | null
          pack_id: string | null
          prompt: string
          status: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          accepted_answers?: string[] | null
          category_key: string
          created_at?: string | null
          created_by?: string | null
          difficulty?: string | null
          explanation?: string | null
          format?: string | null
          hint?: string | null
          id?: string
          media?: Json | null
          pack_id?: string | null
          prompt: string
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          accepted_answers?: string[] | null
          category_key?: string
          created_at?: string | null
          created_by?: string | null
          difficulty?: string | null
          explanation?: string | null
          format?: string | null
          hint?: string | null
          id?: string
          media?: Json | null
          pack_id?: string | null
          prompt?: string
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trivia_questions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_account_info"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "trivia_questions_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "trivia_question_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      trivia_submissions: {
        Row: {
          id: string
          interaction_id: string | null
          latency_ms: number | null
          member_id: string
          payload: Json
          room_id: string
          status: string | null
          submitted_at: string | null
        }
        Insert: {
          id?: string
          interaction_id?: string | null
          latency_ms?: number | null
          member_id: string
          payload: Json
          room_id: string
          status?: string | null
          submitted_at?: string | null
        }
        Update: {
          id?: string
          interaction_id?: string | null
          latency_ms?: number | null
          member_id?: string
          payload?: Json
          room_id?: string
          status?: string | null
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trivia_submissions_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "interactions"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_user_id: string | null
          avatar_url: string | null
          created_at: string
          display_name: string | null
          expires_at: string | null
          id: string
          is_anonymous: boolean
          last_active_at: string
          username: string
        }
        Insert: {
          auth_user_id?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          expires_at?: string | null
          id?: string
          is_anonymous?: boolean
          last_active_at?: string
          username: string
        }
        Update: {
          auth_user_id?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          expires_at?: string | null
          id?: string
          is_anonymous?: boolean
          last_active_at?: string
          username?: string
        }
        Relationships: []
      }
      venue_accounts: {
        Row: {
          auth_user_id: string
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          last_active_at: string
          phone: string | null
          role: string
          room_id: string | null
        }
        Insert: {
          auth_user_id: string
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_active?: boolean
          last_active_at?: string
          phone?: string | null
          role: string
          room_id?: string | null
        }
        Update: {
          auth_user_id?: string
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          last_active_at?: string
          phone?: string | null
          role?: string
          room_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "venue_accounts_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_analytics_view"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "venue_accounts_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          created_at: string
          description: string | null
          features: Json | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      vibox_queue: {
        Row: {
          added_by_membership_id: string | null
          created_at: string
          id: string
          is_played: boolean
          played_at: string | null
          position: number
          room_id: string
          status: string
          track_album: string | null
          track_artist: string | null
          track_artwork_url: string | null
          track_duration_ms: number | null
          track_id: string
          track_title: string
          updated_at: string | null
          votes: number
        }
        Insert: {
          added_by_membership_id?: string | null
          created_at?: string
          id?: string
          is_played?: boolean
          played_at?: string | null
          position?: number
          room_id: string
          status?: string
          track_album?: string | null
          track_artist?: string | null
          track_artwork_url?: string | null
          track_duration_ms?: number | null
          track_id: string
          track_title: string
          updated_at?: string | null
          votes?: number
        }
        Update: {
          added_by_membership_id?: string | null
          created_at?: string
          id?: string
          is_played?: boolean
          played_at?: string | null
          position?: number
          room_id?: string
          status?: string
          track_album?: string | null
          track_artist?: string | null
          track_artwork_url?: string | null
          track_duration_ms?: number | null
          track_id?: string
          track_title?: string
          updated_at?: string | null
          votes?: number
        }
        Relationships: [
          {
            foreignKeyName: "vibox_queue_added_by_membership_id_fkey"
            columns: ["added_by_membership_id"]
            isOneToOne: false
            referencedRelation: "room_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vibox_queue_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_analytics_view"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "vibox_queue_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      vibox_votes: {
        Row: {
          created_at: string
          id: string
          membership_id: string
          room_id: string
          track_id: string
          updated_at: string | null
          vote_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          membership_id: string
          room_id: string
          track_id: string
          updated_at?: string | null
          vote_type?: string
        }
        Update: {
          created_at?: string
          id?: string
          membership_id?: string
          room_id?: string
          track_id?: string
          updated_at?: string | null
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "vibox_votes_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "room_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vibox_votes_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_analytics_view"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "vibox_votes_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          answer_id: string
          created_at: string
          group_id: string
          id: string
          round_index: number
          session_id: string
          updated_at: string
          voter_id: string
        }
        Insert: {
          answer_id: string
          created_at?: string
          group_id: string
          id?: string
          round_index: number
          session_id: string
          updated_at?: string
          voter_id: string
        }
        Update: {
          answer_id?: string
          created_at?: string
          group_id?: string
          id?: string
          round_index?: number
          session_id?: string
          updated_at?: string
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: false
            referencedRelation: "answers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      player_engagement_view: {
        Row: {
          first_played_at: string | null
          last_played_at: string | null
          player_name: string | null
          room_id: string | null
          sessions_played: number | null
          total_score: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "room_memberships_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_analytics_view"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "room_memberships_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_account_info"
            referencedColumns: ["user_id"]
          },
        ]
      }
      room_analytics_view: {
        Row: {
          avg_session_duration_minutes: number | null
          code: string | null
          created_at: string | null
          current_active_members: number | null
          host_uid: string | null
          last_activity_at: string | null
          name: string | null
          room_id: string | null
          status: string | null
          total_sessions_played: number | null
          total_unique_players: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_host_uid_fkey"
            columns: ["host_uid"]
            isOneToOne: false
            referencedRelation: "user_account_info"
            referencedColumns: ["user_id"]
          },
        ]
      }
      room_member_stats_view: {
        Row: {
          best_session_score: number | null
          is_banned: boolean | null
          is_host: boolean | null
          joined_at: string | null
          last_active_at: string | null
          player_name: string | null
          room_id: string | null
          sessions_participated: number | null
          total_score: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "room_memberships_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_analytics_view"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "room_memberships_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_account_info"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_account_info: {
        Row: {
          account_type: string | null
          email: string | null
          has_player_account: boolean | null
          has_venue_account: boolean | null
          is_venue_active: boolean | null
          last_login_at: string | null
          player_avatar_url: string | null
          player_created_at: string | null
          player_display_name: string | null
          player_level: number | null
          player_status: string | null
          player_updated_at: string | null
          raw_user_meta_data: Json | null
          total_games_played: number | null
          total_points: number | null
          total_wins: number | null
          user_id: string | null
          venue_full_name: string | null
          venue_role: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      advance_interaction_to_voting: {
        Args: { p_interaction_id: string; p_voting_seconds?: number }
        Returns: boolean
      }
      check_display_name_available: {
        Args: { p_display_name: string }
        Returns: boolean
      }
      check_venue_needs_room: { Args: { p_user_id: string }; Returns: boolean }
      cleanup_guest_memberships: { Args: never; Returns: number }
      cleanup_guest_memberships_for_room: {
        Args: { p_room_id: string }
        Returns: number
      }
      cleanup_inactive_rooms: { Args: never; Returns: undefined }
      cleanup_orphaned_player_accounts: { Args: never; Returns: number }
      create_trivia_interaction: {
        Args: {
          p_created_by: string
          p_policy: Json
          p_question_id: string
          p_room_id: string
          p_scoring: Json
          p_timing: Json
        }
        Returns: string
      }
      ensure_unique_code: { Args: never; Returns: string }
      generate_room_code: { Args: never; Returns: string }
      generate_team_codes: {
        Args: { num_codes: number; session_uuid: string }
        Returns: undefined
      }
      generate_test_room_code: { Args: never; Returns: string }
      get_account_type: { Args: { p_user_id: string }; Returns: string }
      get_or_create_player_account: {
        Args: {
          p_avatar_url?: string
          p_display_name?: string
          p_user_id: string
        }
        Returns: {
          account_avatar_url: string
          account_created_at: string
          account_display_name: string
          account_favorite_genres: string[]
          account_id: string
          account_last_login_at: string
          account_notifications_enabled: boolean
          account_player_level: number
          account_preferred_difficulty: string
          account_status: string
          account_total_games_played: number
          account_total_points: number
          account_total_wins: number
          account_updated_at: string
          account_user_id: string
        }[]
      }
      get_player_account_info: {
        Args: { p_user_id: string }
        Returns: {
          avatar_url: string
          display_name: string
          id: string
          last_login_at: string
          player_level: number
          status: string
          total_games_played: number
          total_points: number
          total_wins: number
        }[]
      }
      get_sociale_current_round: {
        Args: { p_sociale_id: string }
        Returns: {
          phase: string
          phase_ends_at: string
          round_id: string
          round_index: number
          round_type: string
        }[]
      }
      get_sociale_scoreboard: {
        Args: { p_sociale_id: string }
        Returns: {
          display_name: string
          mascot_id: number
          rank: number
          score: number
          socialite_id: string
        }[]
      }
      get_user_votes_from_db:
        | {
            Args: { p_membership_id: string; p_room_id: string }
            Returns: {
              created_at: string
              track_id: string
              vote_type: string
            }[]
          }
        | {
            Args: { p_session_id: string }
            Returns: {
              created_at: string
              player_id: string
              session_id: string
              track_id: string
              updated_at: string
              vote_type: string
            }[]
          }
      get_vote_counts_from_db:
        | {
            Args: never
            Returns: {
              downvotes: number
              last_voted_at: string
              net_votes: number
              total_votes: number
              track_id: string
              upvotes: number
            }[]
          }
        | {
            Args: { p_room_id: string }
            Returns: {
              downvotes: number
              total_votes: number
              track_id: string
              upvotes: number
            }[]
          }
      grade_trivia_submission: {
        Args: { p_grader_version?: string; p_submission_id: string }
        Returns: string
      }
      increment_team_score: {
        Args: { score_delta: number; team_id: string }
        Returns: undefined
      }
      increment_top_comment_player_score: {
        Args: { player_id: string; score_delta: number }
        Returns: undefined
      }
      is_player_account: { Args: { p_user_id: string }; Returns: boolean }
      is_venue_account: { Args: { p_user_id: string }; Returns: boolean }
      pause_top_comment_session_atomic: {
        Args: {
          p_ends_at: string
          p_pause: boolean
          p_paused_at: string
          p_session_id: string
          p_total_paused_ms: number
        }
        Returns: {
          auto_assigned_players: string[] | null
          code: string
          created_at: string
          current_library_index: number | null
          ended_at: string | null
          ended_by_host: boolean | null
          ends_at: string | null
          host_uid: string
          id: string
          paused: boolean | null
          paused_at: string | null
          prompt_cursor: number | null
          prompt_deck: Json | null
          prompt_library_id: string | null
          room_id: string | null
          round_index: number
          rounds: Json
          selected_libraries: string[] | null
          settings: Json
          started_at: string | null
          status: string
          total_paused_ms: number | null
          venue_name: string | null
          vote_group_index: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "top_comment_sessions"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      remove_vote:
        | {
            Args: {
              p_membership_id: string
              p_room_id: string
              p_track_id: string
            }
            Returns: undefined
          }
        | {
            Args: { p_session_id: string; p_track_id: string }
            Returns: {
              message: string
              success: boolean
            }[]
          }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      submit_trivia_answer: {
        Args: { p_interaction_id: string; p_member_id: string; p_payload: Json }
        Returns: Json
      }
      update_player_stats: {
        Args: {
          p_games_played?: number
          p_points?: number
          p_user_id: string
          p_wins?: number
        }
        Returns: undefined
      }
      update_venue_room_id: {
        Args: { p_room_id: string; p_user_id: string }
        Returns: boolean
      }
      vote_on_track:
        | {
            Args: {
              p_membership_id: string
              p_room_id: string
              p_track_id: string
              p_vote_type: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_player_id?: string
              p_session_id: string
              p_track_id: string
              p_vote_type: string
            }
            Returns: {
              message: string
              success: boolean
              updated_at: string
              vote_id: string
              vote_type: string
            }[]
          }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
