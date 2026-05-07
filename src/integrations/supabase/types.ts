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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          id: string
          metadata: Json | null
          record_id: string | null
          timestamp: string
          user_id: string
        }
        Insert: {
          action: string
          id?: string
          metadata?: Json | null
          record_id?: string | null
          timestamp?: string
          user_id: string
        }
        Update: {
          action?: string
          id?: string
          metadata?: Json | null
          record_id?: string | null
          timestamp?: string
          user_id?: string
        }
        Relationships: []
      }
      investigation_records: {
        Row: {
          ai_summary: string | null
          ai_summary_generated_at: string | null
          ai_summary_previous: string | null
          ai_summary_status: string | null
          analysis_data: Json | null
          analyst_id: string | null
          analyst_notes: string | null
          assigned_to: string | null
          case_created_at: string | null
          case_id: string | null
          case_status: string | null
          created_at: string
          id: string
          investigation_status: string | null
          is_case: boolean
          network: string
          record_id: string
          reviewed_at: string | null
          risk_level: string
          risk_score: number
          tags: string[] | null
          updated_at: string
          user_id: string
          wallet_address: string
        }
        Insert: {
          ai_summary?: string | null
          ai_summary_generated_at?: string | null
          ai_summary_previous?: string | null
          ai_summary_status?: string | null
          analysis_data?: Json | null
          analyst_id?: string | null
          analyst_notes?: string | null
          assigned_to?: string | null
          case_created_at?: string | null
          case_id?: string | null
          case_status?: string | null
          created_at?: string
          id?: string
          investigation_status?: string | null
          is_case?: boolean
          network: string
          record_id: string
          reviewed_at?: string | null
          risk_level?: string
          risk_score?: number
          tags?: string[] | null
          updated_at?: string
          user_id: string
          wallet_address: string
        }
        Update: {
          ai_summary?: string | null
          ai_summary_generated_at?: string | null
          ai_summary_previous?: string | null
          ai_summary_status?: string | null
          analysis_data?: Json | null
          analyst_id?: string | null
          analyst_notes?: string | null
          assigned_to?: string | null
          case_created_at?: string | null
          case_id?: string | null
          case_status?: string | null
          created_at?: string
          id?: string
          investigation_status?: string | null
          is_case?: boolean
          network?: string
          record_id?: string
          reviewed_at?: string | null
          risk_level?: string
          risk_score?: number
          tags?: string[] | null
          updated_at?: string
          user_id?: string
          wallet_address?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      public_checks: {
        Row: {
          address: string
          created_at: string
          data: Json
          expires_at: string
          id: string
          network: string
          reasons: Json
          risk_score: number
          verdict: string
          view_count: number
        }
        Insert: {
          address: string
          created_at?: string
          data?: Json
          expires_at?: string
          id?: string
          network: string
          reasons?: Json
          risk_score?: number
          verdict: string
          view_count?: number
        }
        Update: {
          address?: string
          created_at?: string
          data?: Json
          expires_at?: string
          id?: string
          network?: string
          reasons?: Json
          risk_score?: number
          verdict?: string
          view_count?: number
        }
        Relationships: []
      }
      risk_factors: {
        Row: {
          created_at: string
          description: string | null
          detected_at: string
          factor_type: string
          id: string
          lookup_record_id: string
          score: number
          severity: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          detected_at?: string
          factor_type: string
          id?: string
          lookup_record_id: string
          score?: number
          severity?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          detected_at?: string
          factor_type?: string
          id?: string
          lookup_record_id?: string
          score?: number
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_factors_lookup_record_id_fkey"
            columns: ["lookup_record_id"]
            isOneToOne: false
            referencedRelation: "investigation_records"
            referencedColumns: ["id"]
          },
        ]
      }
      sanctions_addresses: {
        Row: {
          address: string
          created_at: string
          date_listed: string | null
          entity_name: string | null
          id: string
          metadata: Json | null
          network: string
          program: string | null
          source_list: string
          updated_at: string
        }
        Insert: {
          address: string
          created_at?: string
          date_listed?: string | null
          entity_name?: string | null
          id?: string
          metadata?: Json | null
          network: string
          program?: string | null
          source_list?: string
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          date_listed?: string | null
          entity_name?: string | null
          id?: string
          metadata?: Json | null
          network?: string
          program?: string | null
          source_list?: string
          updated_at?: string
        }
        Relationships: []
      }
      sanctions_screening: {
        Row: {
          confidence_score: number
          created_at: string
          entity_name: string
          entity_type: string | null
          id: string
          lookup_record_id: string
          match_type: string
          screening_date: string
          source_list: string | null
        }
        Insert: {
          confidence_score?: number
          created_at?: string
          entity_name: string
          entity_type?: string | null
          id?: string
          lookup_record_id: string
          match_type?: string
          screening_date?: string
          source_list?: string | null
        }
        Update: {
          confidence_score?: number
          created_at?: string
          entity_name?: string
          entity_type?: string | null
          id?: string
          lookup_record_id?: string
          match_type?: string
          screening_date?: string
          source_list?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sanctions_screening_lookup_record_id_fkey"
            columns: ["lookup_record_id"]
            isOneToOne: false
            referencedRelation: "investigation_records"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_cache: {
        Row: {
          address: string
          created_at: string
          data: Json
          expires_at: string
          id: string
          network: string
        }
        Insert: {
          address: string
          created_at?: string
          data: Json
          expires_at: string
          id?: string
          network: string
        }
        Update: {
          address?: string
          created_at?: string
          data?: Json
          expires_at?: string
          id?: string
          network?: string
        }
        Relationships: []
      }
      watch_alerts: {
        Row: {
          alert_message: string | null
          alert_type: string
          created_at: string
          id: string
          is_read: boolean
          new_value: string | null
          old_value: string | null
          risk_change: number | null
          watched_wallet_id: string
        }
        Insert: {
          alert_message?: string | null
          alert_type: string
          created_at?: string
          id?: string
          is_read?: boolean
          new_value?: string | null
          old_value?: string | null
          risk_change?: number | null
          watched_wallet_id: string
        }
        Update: {
          alert_message?: string | null
          alert_type?: string
          created_at?: string
          id?: string
          is_read?: boolean
          new_value?: string | null
          old_value?: string | null
          risk_change?: number | null
          watched_wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watch_alerts_watched_wallet_id_fkey"
            columns: ["watched_wallet_id"]
            isOneToOne: false
            referencedRelation: "watched_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      watched_wallets: {
        Row: {
          alert_threshold: number
          created_at: string
          current_risk_score: number | null
          id: string
          initial_risk_score: number | null
          last_checked: string
          network: string
          status: string
          updated_at: string
          user_id: string
          wallet_address: string
          watch_reason: string | null
        }
        Insert: {
          alert_threshold?: number
          created_at?: string
          current_risk_score?: number | null
          id?: string
          initial_risk_score?: number | null
          last_checked?: string
          network: string
          status?: string
          updated_at?: string
          user_id: string
          wallet_address: string
          watch_reason?: string | null
        }
        Update: {
          alert_threshold?: number
          created_at?: string
          current_risk_score?: number | null
          id?: string
          initial_risk_score?: number | null
          last_checked?: string
          network?: string
          status?: string
          updated_at?: string
          user_id?: string
          wallet_address?: string
          watch_reason?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_case_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "analyst" | "user"
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
    Enums: {
      app_role: ["admin", "analyst", "user"],
    },
  },
} as const
