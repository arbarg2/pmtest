export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      case_audit_log: {
        Row: {
          action: string
          case_id: string
          created_at: string | null
          details: Json | null
          id: string
          user_id: string
        }
        Insert: {
          action: string
          case_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          case_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      investigation_records: {
        Row: {
          analysis_data: Json
          analyst_id: string | null
          analyst_notes: string | null
          assigned_to: string | null
          case_created_at: string | null
          case_id: string | null
          case_status: string | null
          created_at: string
          id: string
          investigation_status: string | null
          is_case: boolean | null
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
          analysis_data: Json
          analyst_id?: string | null
          analyst_notes?: string | null
          assigned_to?: string | null
          case_created_at?: string | null
          case_id?: string | null
          case_status?: string | null
          created_at?: string
          id?: string
          investigation_status?: string | null
          is_case?: boolean | null
          network: string
          record_id: string
          reviewed_at?: string | null
          risk_level: string
          risk_score: number
          tags?: string[] | null
          updated_at?: string
          user_id: string
          wallet_address: string
        }
        Update: {
          analysis_data?: Json
          analyst_id?: string | null
          analyst_notes?: string | null
          assigned_to?: string | null
          case_created_at?: string | null
          case_id?: string | null
          case_status?: string | null
          created_at?: string
          id?: string
          investigation_status?: string | null
          is_case?: boolean | null
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
      risk_factors: {
        Row: {
          created_at: string | null
          description: string | null
          detected_at: string | null
          factor_type: string
          id: string
          lookup_record_id: string | null
          score: number
          severity: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          detected_at?: string | null
          factor_type: string
          id?: string
          lookup_record_id?: string | null
          score: number
          severity: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          detected_at?: string | null
          factor_type?: string
          id?: string
          lookup_record_id?: string | null
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
      sanctions_screening: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          entity_name: string | null
          entity_type: string | null
          id: string
          lookup_record_id: string | null
          match_type: string | null
          screening_date: string | null
          source_list: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          entity_name?: string | null
          entity_type?: string | null
          id?: string
          lookup_record_id?: string | null
          match_type?: string | null
          screening_date?: string | null
          source_list?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          entity_name?: string | null
          entity_type?: string | null
          id?: string
          lookup_record_id?: string | null
          match_type?: string | null
          screening_date?: string | null
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
      watch_alerts: {
        Row: {
          alert_message: string | null
          alert_type: string
          created_at: string | null
          id: string
          is_read: boolean | null
          new_value: string | null
          old_value: string | null
          risk_change: number | null
          watched_wallet_id: string | null
        }
        Insert: {
          alert_message?: string | null
          alert_type: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          new_value?: string | null
          old_value?: string | null
          risk_change?: number | null
          watched_wallet_id?: string | null
        }
        Update: {
          alert_message?: string | null
          alert_type?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          new_value?: string | null
          old_value?: string | null
          risk_change?: number | null
          watched_wallet_id?: string | null
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
          alert_threshold: number | null
          created_at: string | null
          current_risk_score: number | null
          id: string
          initial_risk_score: number | null
          last_checked: string | null
          network: string
          status: string | null
          updated_at: string | null
          user_id: string
          wallet_address: string
          watch_reason: string | null
        }
        Insert: {
          alert_threshold?: number | null
          created_at?: string | null
          current_risk_score?: number | null
          id?: string
          initial_risk_score?: number | null
          last_checked?: string | null
          network: string
          status?: string | null
          updated_at?: string | null
          user_id: string
          wallet_address: string
          watch_reason?: string | null
        }
        Update: {
          alert_threshold?: number | null
          created_at?: string | null
          current_risk_score?: number | null
          id?: string
          initial_risk_score?: number | null
          last_checked?: string | null
          network?: string
          status?: string | null
          updated_at?: string | null
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
      calculate_risk_factors: {
        Args: { wallet_data: Json }
        Returns: {
          factor_type: string
          severity: string
          score: number
          description: string
        }[]
      }
      generate_case_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_record_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      screen_sanctions: {
        Args: { wallet_address: string; network?: string }
        Returns: {
          entity_name: string
          entity_type: string
          match_type: string
          confidence_score: number
          source_list: string
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
