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
  public: {
    Tables: {
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
        Relationships: [
          {
            foreignKeyName: "answers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      banned_teams: {
        Row: {
          banned_at: string | null
          banned_by: string | null
          id: string
          reason: string | null
          session_id: string
          team_id: string
          team_name: string
          uid: string | null
        }
        Insert: {
          banned_at?: string | null
          banned_by?: string | null
          id?: string
          reason?: string | null
          session_id: string
          team_id: string
          team_name: string
          uid?: string | null
        }
        Update: {
          banned_at?: string | null
          banned_by?: string | null
          id?: string
          reason?: string | null
          session_id?: string
          team_id?: string
          team_name?: string
          uid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "banned_teams_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "feed_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_comment_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          like_count: number
          parent_comment_id: string | null
          post_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          like_count?: number
          parent_comment_id?: string | null
          post_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          like_count?: number
          parent_comment_id?: string | null
          post_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "feed_comments"
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
      session_analytics: {
        Row: {
          answer_rate: number
          duration: number
          id: string
          joined_count: number
          session_id: string
          updated_at: string
          vote_rate: number
        }
        Insert: {
          answer_rate?: number
          duration?: number
          id?: string
          joined_count?: number
          session_id: string
          updated_at?: string
          vote_rate?: number
        }
        Update: {
          answer_rate?: number
          duration?: number
          id?: string
          joined_count?: number
          session_id?: string
          updated_at?: string
          vote_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "session_analytics_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          category_grid: Json | null
          code: string
          created_at: string
          ended_at: string | null
          ended_by_host: boolean
          ends_at: string | null
          host_uid: string
          id: string
          max_teams: number | null
          paused: boolean | null
          paused_at: string | null
          prompt_cursor: number
          prompt_deck: Json
          prompt_library_id: string
          round_index: number
          rounds: Json
          settings: Json
          started_at: string | null
          status: string
          total_paused_ms: number | null
          venue_key: string | null
          venue_name: string | null
          vote_group_index: number | null
        }
        Insert: {
          category_grid?: Json | null
          code: string
          created_at?: string
          ended_at?: string | null
          ended_by_host?: boolean
          ends_at?: string | null
          host_uid: string
          id?: string
          max_teams?: number | null
          paused?: boolean | null
          paused_at?: string | null
          prompt_cursor?: number
          prompt_deck?: Json
          prompt_library_id?: string
          round_index?: number
          rounds?: Json
          settings?: Json
          started_at?: string | null
          status?: string
          total_paused_ms?: number | null
          venue_key?: string | null
          venue_name?: string | null
          vote_group_index?: number | null
        }
        Update: {
          category_grid?: Json | null
          code?: string
          created_at?: string
          ended_at?: string | null
          ended_by_host?: boolean
          ends_at?: string | null
          host_uid?: string
          id?: string
          max_teams?: number | null
          paused?: boolean | null
          paused_at?: string | null
          prompt_cursor?: number
          prompt_deck?: Json
          prompt_library_id?: string
          round_index?: number
          rounds?: Json
          settings?: Json
          started_at?: string | null
          status?: string
          total_paused_ms?: number | null
          venue_key?: string | null
          venue_name?: string | null
          vote_group_index?: number | null
        }
        Relationships: []
      }
      team_codes: {
        Row: {
          assigned_at: string | null
          code: string
          created_at: string | null
          id: string
          is_used: boolean | null
          session_id: string
          team_id: string | null
        }
        Insert: {
          assigned_at?: string | null
          code: string
          created_at?: string | null
          id?: string
          is_used?: boolean | null
          session_id: string
          team_id?: string | null
        }
        Update: {
          assigned_at?: string | null
          code?: string
          created_at?: string | null
          id?: string
          is_used?: boolean | null
          session_id?: string
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_codes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_codes_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          device_id: string | null
          id: string
          is_captain: boolean | null
          joined_at: string | null
          last_active: string | null
          player_name: string | null
          team_id: string
          user_id: string | null
        }
        Insert: {
          device_id?: string | null
          id?: string
          is_captain?: boolean | null
          joined_at?: string | null
          last_active?: string | null
          player_name?: string | null
          team_id: string
          user_id?: string | null
        }
        Update: {
          device_id?: string | null
          id?: string
          is_captain?: boolean | null
          joined_at?: string | null
          last_active?: string | null
          player_name?: string | null
          team_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          captain_id: string | null
          id: string
          is_host: boolean
          joined_at: string
          last_active_at: string
          mascot_id: number | null
          score: number
          session_id: string
          team_code: string | null
          team_name: string
          uid: string | null
        }
        Insert: {
          captain_id?: string | null
          id?: string
          is_host?: boolean
          joined_at?: string
          last_active_at?: string
          mascot_id?: number | null
          score?: number
          session_id: string
          team_code?: string | null
          team_name: string
          uid?: string | null
        }
        Update: {
          captain_id?: string | null
          id?: string
          is_host?: boolean
          joined_at?: string
          last_active_at?: string
          mascot_id?: number | null
          score?: number
          session_id?: string
          team_code?: string | null
          team_name?: string
          uid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
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
      top_comment_banned_players: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "top_comment_banned_players_session_id_fkey"
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
      top_comment_session_analytics: {
        Row: {
          answer_rate: number
          duration: number | null
          joined_count: number
          session_id: string
          vote_rate: number
        }
        Insert: {
          answer_rate?: number
          duration?: number | null
          joined_count?: number
          session_id: string
          vote_rate?: number
        }
        Update: {
          answer_rate?: number
          duration?: number | null
          joined_count?: number
          session_id?: string
          vote_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "top_comment_session_analytics_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "top_comment_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      top_comment_sessions: {
        Row: {
          category_grid: Json | null
          code: string
          created_at: string
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
          round_index: number
          rounds: Json
          settings: Json
          started_at: string | null
          status: string
          total_paused_ms: number | null
          venue_name: string | null
          vote_group_index: number | null
        }
        Insert: {
          category_grid?: Json | null
          code: string
          created_at?: string
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
          round_index?: number
          rounds?: Json
          settings?: Json
          started_at?: string | null
          status: string
          total_paused_ms?: number | null
          venue_name?: string | null
          vote_group_index?: number | null
        }
        Update: {
          category_grid?: Json | null
          code?: string
          created_at?: string
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
          round_index?: number
          rounds?: Json
          settings?: Json
          started_at?: string | null
          status?: string
          total_paused_ms?: number | null
          venue_name?: string | null
          vote_group_index?: number | null
        }
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "top_comment_votes_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: false
            referencedRelation: "top_comment_answers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "top_comment_votes_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "top_comment_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "top_comment_votes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "top_comment_sessions"
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
        }
        Relationships: []
      }
      venue_staff: {
        Row: {
          hired_at: string
          id: string
          permissions: Json | null
          role: string
          venue_account_id: string
          venue_id: string
        }
        Insert: {
          hired_at?: string
          id?: string
          permissions?: Json | null
          role: string
          venue_account_id: string
          venue_id: string
        }
        Update: {
          hired_at?: string
          id?: string
          permissions?: Json | null
          role?: string
          venue_account_id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_staff_venue_account_id_fkey"
            columns: ["venue_account_id"]
            isOneToOne: false
            referencedRelation: "venue_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_staff_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
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
      vibex_votes: {
        Row: {
          created_at: string | null
          id: string
          player_id: string | null
          session_id: string
          track_id: string
          updated_at: string | null
          vote_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          player_id?: string | null
          session_id: string
          track_id: string
          updated_at?: string | null
          vote_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          player_id?: string | null
          session_id?: string
          track_id?: string
          updated_at?: string | null
          vote_type?: string
        }
        Relationships: []
      }
      vibox_queue: {
        Row: {
          added_at: string | null
          added_by: string
          added_by_user_id: string | null
          completion_percentage: number | null
          created_at: string | null
          day_of_week: number | null
          device_type: string | null
          id: string
          ip_address: unknown
          is_played: boolean | null
          play_duration: number | null
          played_at: string | null
          position: number | null
          primary_vibe: string | null
          queue_length_when_added: number | null
          secondary_vibe: string | null
          session_id: string | null
          skip_count: number | null
          time_in_queue: number | null
          time_of_day: string | null
          track_artist: string
          track_duration: number | null
          track_genre: string | null
          track_id: string
          track_title: string
          track_url: string
          updated_at: string | null
          user_agent: string | null
          was_skipped: boolean | null
        }
        Insert: {
          added_at?: string | null
          added_by: string
          added_by_user_id?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          day_of_week?: number | null
          device_type?: string | null
          id?: string
          ip_address?: unknown
          is_played?: boolean | null
          play_duration?: number | null
          played_at?: string | null
          position?: number | null
          primary_vibe?: string | null
          queue_length_when_added?: number | null
          secondary_vibe?: string | null
          session_id?: string | null
          skip_count?: number | null
          time_in_queue?: number | null
          time_of_day?: string | null
          track_artist: string
          track_duration?: number | null
          track_genre?: string | null
          track_id: string
          track_title: string
          track_url: string
          updated_at?: string | null
          user_agent?: string | null
          was_skipped?: boolean | null
        }
        Update: {
          added_at?: string | null
          added_by?: string
          added_by_user_id?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          day_of_week?: number | null
          device_type?: string | null
          id?: string
          ip_address?: unknown
          is_played?: boolean | null
          play_duration?: number | null
          played_at?: string | null
          position?: number | null
          primary_vibe?: string | null
          queue_length_when_added?: number | null
          secondary_vibe?: string | null
          session_id?: string | null
          skip_count?: number | null
          time_in_queue?: number | null
          time_of_day?: string | null
          track_artist?: string
          track_duration?: number | null
          track_genre?: string | null
          track_id?: string
          track_title?: string
          track_url?: string
          updated_at?: string | null
          user_agent?: string | null
          was_skipped?: boolean | null
        }
        Relationships: []
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
          {
            foreignKeyName: "votes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      vibex_latest_user_votes: {
        Row: {
          created_at: string | null
          player_id: string | null
          session_id: string | null
          track_id: string | null
          updated_at: string | null
          vote_type: string | null
        }
        Relationships: []
      }
      vibex_user_votes: {
        Row: {
          created_at: string | null
          player_id: string | null
          rn: number | null
          session_id: string | null
          track_id: string | null
          updated_at: string | null
          vote_type: string | null
        }
        Relationships: []
      }
      vibex_vote_counts: {
        Row: {
          downvotes: number | null
          last_voted_at: string | null
          net_votes: number | null
          total_votes: number | null
          track_id: string | null
          upvotes: number | null
        }
        Relationships: []
      }
      rooms: {
        Row: {
          code: string
          created_at: string
          current_session_id: string | null
          description: string | null
          host_uid: string
          id: string
          max_players: number
          name: string | null
          settings: Json
          status: string
          total_sessions_played: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          current_session_id?: string | null
          description?: string | null
          host_uid: string
          id?: string
          max_players: number
          name?: string | null
          settings?: Json
          status?: string
          total_sessions_played?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          current_session_id?: string | null
          description?: string | null
          host_uid?: string
          id?: string
          max_players?: number
          name?: string | null
          settings?: Json
          status?: string
          total_sessions_played?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_rooms_current_session"
            columns: ["current_session_id"]
            isOneToOne: true
            referencedRelation: "top_comment_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_host_uid_fkey"
            columns: ["host_uid"]
            isOneToOne: false
            referencedRelation: "auth.users"
            referencedColumns: ["id"]
          }
        ]
      }
      room_memberships: {
        Row: {
          banned_at: string | null
          banned_by: string | null
          ban_reason: string | null
          id: string
          is_banned: boolean
          is_host: boolean
          joined_at: string
          last_active_at: string
          mascot_id: number | null
          player_name: string
          room_id: string
          status: string
          user_id: string | null
        }
        Insert: {
          banned_at?: string | null
          banned_by?: string | null
          ban_reason?: string | null
          id?: string
          is_banned?: boolean
          is_host?: boolean
          joined_at?: string
          last_active_at?: string
          mascot_id?: number | null
          player_name: string
          room_id: string
          status?: string
          user_id?: string | null
        }
        Update: {
          banned_at?: string | null
          banned_by?: string | null
          ban_reason?: string | null
          id?: string
          is_banned?: boolean
          is_host?: boolean
          joined_at?: string
          last_active_at?: string
          mascot_id?: number | null
          player_name?: string
          room_id?: string
          status?: string
          user_id?: string | null
        }
        Relationships: [
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
            referencedRelation: "auth.users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_memberships_banned_by_fkey"
            columns: ["banned_by"]
            isOneToOne: false
            referencedRelation: "auth.users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Functions: {
      ensure_unique_code: { Args: never; Returns: string }
      generate_room_code: { Args: never; Returns: string }
      generate_team_codes: {
        Args: { num_codes: number; session_uuid: string }
        Returns: undefined
      }
      get_user_votes_from_db: {
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
      get_vote_counts_from_db: {
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
      increment_team_score: {
        Args: { score_delta: number; team_id: string }
        Returns: undefined
      }
      increment_top_comment_player_score: {
        Args: { player_id: string; score_delta: number }
        Returns: undefined
      }
      pause_session_atomic: {
        Args: {
          p_ends_at: string
          p_pause: boolean
          p_paused_at: string
          p_session_id: string
          p_total_paused_ms?: number
        }
        Returns: {
          category_grid: Json | null
          code: string
          created_at: string
          ended_at: string | null
          ended_by_host: boolean
          ends_at: string | null
          host_uid: string
          id: string
          max_teams: number | null
          paused: boolean | null
          paused_at: string | null
          prompt_cursor: number
          prompt_deck: Json
          prompt_library_id: string
          round_index: number
          rounds: Json
          settings: Json
          started_at: string | null
          status: string
          total_paused_ms: number | null
          venue_key: string | null
          venue_name: string | null
          vote_group_index: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "sessions"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      pause_top_comment_session_atomic: {
        Args: {
          p_ends_at: string
          p_pause: boolean
          p_paused_at: string
          p_session_id: string
          p_total_paused_ms: number
        }
        Returns: {
          category_grid: Json | null
          code: string
          created_at: string
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
          round_index: number
          rounds: Json
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
      remove_vote: {
        Args: { p_session_id: string; p_track_id: string }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      vote_on_track: {
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
  public: {
    Enums: {},
  },
} as const
