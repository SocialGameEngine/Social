export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      rooms: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string | null
        }
        Insert: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      room_memberships: {
        Row: {
          banned_at: string | null
          banned_by: string | null
          ban_reason: string | null
          id: string
          is_banned: boolean
          is_host: boolean
          joined_at: string | null
          last_active_at: string | null
          mascot_id: number | null
          player_name: string
          room_id: string
          status: string
          user_id: string
        }
        Insert: {
          banned_at?: string | null
          banned_by?: string | null
          ban_reason?: string | null
          id?: string
          is_banned?: boolean
          is_host?: boolean
          joined_at?: string | null
          last_active_at?: string | null
          mascot_id?: number | null
          player_name: string
          room_id: string
          status?: string
          user_id: string
        }
        Update: {
          banned_at?: string | null
          banned_by?: string | null
          ban_reason?: string | null
          id?: string
          is_banned?: boolean
          is_host?: boolean
          joined_at?: string | null
          last_active_at?: string | null
          mascot_id?: number | null
          player_name?: string
          room_id?: string
          status?: string
          user_id?: string
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
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      interactions: {
        Row: {
          created_at: string | null
          id: string
          room_id: string
          settings: Json
          status: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          room_id: string
          settings: Json
          status?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          room_id?: string
          settings?: Json
          status?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interactions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      trivia_submissions: {
        Row: {
          id: string
          interaction_id: string
          room_id: string
          member_id: string
          submitted_at: string | null
          latency_ms: number | null
          payload: Json
          status: string
        }
        Insert: {
          id?: string
          interaction_id: string
          room_id: string
          member_id: string
          submitted_at?: string | null
          latency_ms?: number | null
          payload: Json
          status: string
        }
        Update: {
          id?: string
          interaction_id?: string
          room_id?: string
          member_id?: string
          submitted_at?: string | null
          latency_ms?: number | null
          payload?: Json
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "trivia_submissions_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "interactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trivia_submissions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trivia_submissions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "room_memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      trivia_evaluations: {
        Row: {
          id: string
          submission_id: string | null
          interaction_id: string | null
          room_id: string
          member_id: string
          result: string
          points_awarded: number
          method: string
          confidence: number | null
          matched_alias: string | null
          reasoning_short: string | null
          grader_version: string
          judged_at: string | null
        }
        Insert: {
          id?: string
          submission_id?: string | null
          interaction_id?: string | null
          room_id: string
          member_id: string
          result: string
          points_awarded?: number
          method: string
          confidence?: number | null
          matched_alias?: string | null
          reasoning_short?: string | null
          grader_version?: string
          judged_at?: string | null
        }
        Update: {
          id?: string
          submission_id?: string | null
          interaction_id?: string | null
          room_id?: string
          member_id?: string
          result?: string
          points_awarded?: number
          method?: string
          confidence?: number | null
          matched_alias?: string | null
          reasoning_short?: string | null
          grader_version?: string
          judged_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trivia_evaluations_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "trivia_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trivia_evaluations_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "interactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trivia_evaluations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trivia_evaluations_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "room_memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          display_name: string | null
          email: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_trivia_interaction: {
        Args: { p_room_id: string; p_settings: Json }
        Returns: string
      }
      get_trivia_reveal_safe: {
        Args: { p_interaction_id: string; p_member_id: string }
        Returns: {
          average_response_time: number
          correct_answer: string
          correct_responses: number
          explanation: string
          interaction_id: string
          total_responses: number
        }[]
      }
      get_trivia_submission_safe: {
        Args: { p_interaction_id: string; p_member_id: string }
        Returns: {
          id: string
          interaction_id: string
          latency_ms: number
          member_id: string
          payload: Json
          room_id: string
          status: string
          submitted_at: string
        }[]
      }
      submit_trivia_answer: {
        Args: {
          p_answer: Json
          p_interaction_id: string
          p_latency_ms?: number
          p_member_id: string
        }
        Returns: string
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
