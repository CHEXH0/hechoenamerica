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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      ai_song_generations: {
        Row: {
          created_at: string
          genre: string | null
          id: string
          prompt: string
          user_id: string
        }
        Insert: {
          created_at?: string
          genre?: string | null
          id?: string
          prompt: string
          user_id: string
        }
        Update: {
          created_at?: string
          genre?: string | null
          id?: string
          prompt?: string
          user_id?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          application_status: string | null
          country: string | null
          created_at: string
          email: string
          id: string
          interview_invite_sent_at: string | null
          message: string
          name: string
          subject: string
          user_id: string | null
        }
        Insert: {
          application_status?: string | null
          country?: string | null
          created_at?: string
          email: string
          id?: string
          interview_invite_sent_at?: string | null
          message: string
          name: string
          subject: string
          user_id?: string | null
        }
        Update: {
          application_status?: string | null
          country?: string | null
          created_at?: string
          email?: string
          id?: string
          interview_invite_sent_at?: string | null
          message?: string
          name?: string
          subject?: string
          user_id?: string | null
        }
        Relationships: []
      }
      platforms: {
        Row: {
          artist_id: string
          created_at: string
          icon: string
          id: string
          name: string
          updated_at: string
          url: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          icon: string
          id?: string
          name: string
          updated_at?: string
          url: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          icon?: string
          id?: string
          name?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      producer_google_tokens: {
        Row: {
          access_token: string
          created_at: string
          id: string
          refresh_token: string
          token_expires_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          id?: string
          refresh_token: string
          token_expires_at: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          id?: string
          refresh_token?: string
          token_expires_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      producers: {
        Row: {
          apple_music_url: string | null
          bio: string
          country: string
          created_at: string
          discord_user_id: string | null
          email: string | null
          genre: string
          id: string
          image: string
          instagram_url: string | null
          name: string
          slug: string
          spotify_url: string | null
          stripe_connect_account_id: string | null
          stripe_connect_onboarded_at: string | null
          updated_at: string
          website_url: string | null
          youtube_channel_url: string | null
          youtube_url: string | null
        }
        Insert: {
          apple_music_url?: string | null
          bio: string
          country: string
          created_at?: string
          discord_user_id?: string | null
          email?: string | null
          genre: string
          id?: string
          image: string
          instagram_url?: string | null
          name: string
          slug: string
          spotify_url?: string | null
          stripe_connect_account_id?: string | null
          stripe_connect_onboarded_at?: string | null
          updated_at?: string
          website_url?: string | null
          youtube_channel_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          apple_music_url?: string | null
          bio?: string
          country?: string
          created_at?: string
          discord_user_id?: string | null
          email?: string | null
          genre?: string
          id?: string
          image?: string
          instagram_url?: string | null
          name?: string
          slug?: string
          spotify_url?: string | null
          stripe_connect_account_id?: string | null
          stripe_connect_onboarded_at?: string | null
          updated_at?: string
          website_url?: string | null
          youtube_channel_url?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      product_notifications: {
        Row: {
          created_at: string
          email: string
          id: string
          product_id: string
          product_name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          product_id: string
          product_name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          product_id?: string
          product_name?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          audio_preview_comparison: string | null
          audio_preview_dry: string | null
          audio_preview_url: string | null
          audio_preview_wet: string | null
          category: string
          created_at: string
          description: string
          duration: string | null
          has_comparison: boolean | null
          id: string
          image: string
          is_active: boolean | null
          is_instrument: boolean | null
          name: string
          price: string
          showcase: string
          size: string | null
          sort_order: number | null
          type: string
          updated_at: string
          weight: string | null
        }
        Insert: {
          audio_preview_comparison?: string | null
          audio_preview_dry?: string | null
          audio_preview_url?: string | null
          audio_preview_wet?: string | null
          category: string
          created_at?: string
          description: string
          duration?: string | null
          has_comparison?: boolean | null
          id: string
          image: string
          is_active?: boolean | null
          is_instrument?: boolean | null
          name: string
          price: string
          showcase: string
          size?: string | null
          sort_order?: number | null
          type: string
          updated_at?: string
          weight?: string | null
        }
        Update: {
          audio_preview_comparison?: string | null
          audio_preview_dry?: string | null
          audio_preview_url?: string | null
          audio_preview_wet?: string | null
          category?: string
          created_at?: string
          description?: string
          duration?: string | null
          has_comparison?: boolean | null
          id?: string
          image?: string
          is_active?: boolean | null
          is_instrument?: boolean | null
          name?: string
          price?: string
          showcase?: string
          size?: string | null
          sort_order?: number | null
          type?: string
          updated_at?: string
          weight?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          created_at: string
          download_url: string | null
          file_urls: string[] | null
          id: string
          price: string
          product_category: string
          product_id: string
          product_name: string
          product_type: string
          purchase_date: string
          song_idea: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          download_url?: string | null
          file_urls?: string[] | null
          id?: string
          price: string
          product_category: string
          product_id: string
          product_name: string
          product_type: string
          purchase_date?: string
          song_idea?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          download_url?: string | null
          file_urls?: string[] | null
          id?: string
          price?: string
          product_category?: string
          product_id?: string
          product_name?: string
          product_type?: string
          purchase_date?: string
          song_idea?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          image: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          icon: string
          id?: string
          image: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          image?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      song_requests: {
        Row: {
          acceptance_deadline: string | null
          assigned_producer_id: string | null
          blocked_producer_ids: string[] | null
          complexity_level: string | null
          created_at: string
          file_urls: string[] | null
          genre_category: string | null
          id: string
          number_of_revisions: number | null
          payment_intent_id: string | null
          platform_fee_cents: number | null
          price: string
          producer_paid_at: string | null
          producer_payout_cents: number | null
          refunded_at: string | null
          song_idea: string
          status: string
          stripe_session_id: string | null
          tier: string
          updated_at: string
          user_email: string
          user_id: string
          wants_analog: boolean | null
          wants_mastering: boolean | null
          wants_mixing: boolean | null
          wants_recorded_stems: boolean | null
        }
        Insert: {
          acceptance_deadline?: string | null
          assigned_producer_id?: string | null
          blocked_producer_ids?: string[] | null
          complexity_level?: string | null
          created_at?: string
          file_urls?: string[] | null
          genre_category?: string | null
          id?: string
          number_of_revisions?: number | null
          payment_intent_id?: string | null
          platform_fee_cents?: number | null
          price: string
          producer_paid_at?: string | null
          producer_payout_cents?: number | null
          refunded_at?: string | null
          song_idea: string
          status?: string
          stripe_session_id?: string | null
          tier: string
          updated_at?: string
          user_email: string
          user_id: string
          wants_analog?: boolean | null
          wants_mastering?: boolean | null
          wants_mixing?: boolean | null
          wants_recorded_stems?: boolean | null
        }
        Update: {
          acceptance_deadline?: string | null
          assigned_producer_id?: string | null
          blocked_producer_ids?: string[] | null
          complexity_level?: string | null
          created_at?: string
          file_urls?: string[] | null
          genre_category?: string | null
          id?: string
          number_of_revisions?: number | null
          payment_intent_id?: string | null
          platform_fee_cents?: number | null
          price?: string
          producer_paid_at?: string | null
          producer_payout_cents?: number | null
          refunded_at?: string | null
          song_idea?: string
          status?: string
          stripe_session_id?: string | null
          tier?: string
          updated_at?: string
          user_email?: string
          user_id?: string
          wants_analog?: boolean | null
          wants_mastering?: boolean | null
          wants_mixing?: boolean | null
          wants_recorded_stems?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "song_requests_assigned_producer_id_fkey"
            columns: ["assigned_producer_id"]
            isOneToOne: false
            referencedRelation: "producers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "song_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      song_revisions: {
        Row: {
          client_feedback: string | null
          client_notes: string | null
          created_at: string
          delivered_at: string | null
          drive_folder_id: string | null
          drive_link: string | null
          id: string
          requested_at: string | null
          revision_number: number
          song_request_id: string
          status: string
          updated_at: string
        }
        Insert: {
          client_feedback?: string | null
          client_notes?: string | null
          created_at?: string
          delivered_at?: string | null
          drive_folder_id?: string | null
          drive_link?: string | null
          id?: string
          requested_at?: string | null
          revision_number: number
          song_request_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          client_feedback?: string | null
          client_notes?: string | null
          created_at?: string
          delivered_at?: string | null
          drive_folder_id?: string | null
          drive_link?: string | null
          id?: string
          requested_at?: string | null
          revision_number?: number
          song_request_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "song_revisions_song_request_id_fkey"
            columns: ["song_request_id"]
            isOneToOne: false
            referencedRelation: "song_requests"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "producer" | "user"
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
      app_role: ["admin", "producer", "user"],
    },
  },
} as const
