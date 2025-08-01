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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string
          country: string
          created_at: string
          entry_instructions: string | null
          id: string
          is_primary: boolean
          latitude: number | null
          longitude: number | null
          nickname: string | null
          postal_code: string
          street_address: string
          updated_at: string
          user_id: string
        }
        Insert: {
          city: string
          country: string
          created_at?: string
          entry_instructions?: string | null
          id?: string
          is_primary?: boolean
          latitude?: number | null
          longitude?: number | null
          nickname?: string | null
          postal_code: string
          street_address: string
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          entry_instructions?: string | null
          id?: string
          is_primary?: boolean
          latitude?: number | null
          longitude?: number | null
          nickname?: string | null
          postal_code?: string
          street_address?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      application_categories: {
        Row: {
          application_id: string
          category_id: string
        }
        Insert: {
          application_id: string
          category_id: string
        }
        Update: {
          application_id?: string
          category_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_categories_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          address_nickname: string | null
          birth_date: string
          city: string
          country: string
          created_at: string
          email: string
          entry_instructions: string | null
          full_name: string
          id: string
          phone_number: string
          postal_code: string
          price_range_currency: string
          price_range_from: number
          price_range_to: number
          professional_experience: string
          status: Database["public"]["Enums"]["application_status"]
          street_address: string
          user_id: string | null
        }
        Insert: {
          address_nickname?: string | null
          birth_date: string
          city: string
          country: string
          created_at?: string
          email: string
          entry_instructions?: string | null
          full_name: string
          id?: string
          phone_number: string
          postal_code: string
          price_range_currency?: string
          price_range_from: number
          price_range_to: number
          professional_experience: string
          status?: Database["public"]["Enums"]["application_status"]
          street_address: string
          user_id?: string | null
        }
        Update: {
          address_nickname?: string | null
          birth_date?: string
          city?: string
          country?: string
          created_at?: string
          email?: string
          entry_instructions?: string | null
          full_name?: string
          id?: string
          phone_number?: string
          postal_code?: string
          price_range_currency?: string
          price_range_from?: number
          price_range_to?: number
          professional_experience?: string
          status?: Database["public"]["Enums"]["application_status"]
          street_address?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_services: {
        Row: {
          booking_id: string
          service_id: string
        }
        Insert: {
          booking_id: string
          service_id: string
        }
        Update: {
          booking_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_services_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          address_id: string | null
          created_at: string
          customer_id: string
          end_time: string
          id: string
          message_to_stylist: string | null
          start_time: string
          status: Database["public"]["Enums"]["booking_status"]
          stripe_payment_intent_id: string | null
          stylist_id: string
          total_duration_minutes: number
          total_price: number
          updated_at: string
        }
        Insert: {
          address_id?: string | null
          created_at?: string
          customer_id: string
          end_time: string
          id?: string
          message_to_stylist?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["booking_status"]
          stripe_payment_intent_id?: string | null
          stylist_id: string
          total_duration_minutes: number
          total_price: number
          updated_at?: string
        }
        Update: {
          address_id?: string | null
          created_at?: string
          customer_id?: string
          end_time?: string
          id?: string
          message_to_stylist?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["booking_status"]
          stripe_payment_intent_id?: string | null
          stylist_id?: string
          total_duration_minutes?: number
          total_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_stylist_id_fkey"
            columns: ["stylist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chats_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          application_id: string | null
          chat_message_id: string | null
          created_at: string
          file_path: string
          id: string
          media_type: Database["public"]["Enums"]["media_type"]
          owner_id: string | null
          review_id: string | null
          service_id: string | null
        }
        Insert: {
          application_id?: string | null
          chat_message_id?: string | null
          created_at?: string
          file_path: string
          id?: string
          media_type: Database["public"]["Enums"]["media_type"]
          owner_id?: string | null
          review_id?: string | null
          service_id?: string | null
        }
        Update: {
          application_id?: string | null
          chat_message_id?: string | null
          created_at?: string
          file_path?: string
          id?: string
          media_type?: Database["public"]["Enums"]["media_type"]
          owner_id?: string | null
          review_id?: string | null
          service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_chat_message_id_fkey"
            columns: ["chat_message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bankid_verified: boolean
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone_number: string | null
          role: Database["public"]["Enums"]["user_role"]
          stripe_customer_id: string | null
          subscribed_to_newsletter: boolean
          updated_at: string
        }
        Insert: {
          bankid_verified?: boolean
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone_number?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          stripe_customer_id?: string | null
          subscribed_to_newsletter?: boolean
          updated_at?: string
        }
        Update: {
          bankid_verified?: boolean
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone_number?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          stripe_customer_id?: string | null
          subscribed_to_newsletter?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      recurring_unavailability_exceptions: {
        Row: {
          id: string
          new_end_time: string | null
          new_start_time: string | null
          original_start_time: string
          series_id: string
        }
        Insert: {
          id?: string
          new_end_time?: string | null
          new_start_time?: string | null
          original_start_time: string
          series_id: string
        }
        Update: {
          id?: string
          new_end_time?: string | null
          new_start_time?: string | null
          original_start_time?: string
          series_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_unavailability_exceptions_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "stylist_recurring_unavailability"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string
          customer_id: string
          id: string
          rating: number
          stylist_id: string
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string
          customer_id: string
          id?: string
          rating: number
          stylist_id: string
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          rating?: number
          stylist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_stylist_id_fkey"
            columns: ["stylist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_categories: {
        Row: {
          description: string | null
          id: string
          name: string
          parent_category_id: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          name: string
          parent_category_id?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          name?: string
          parent_category_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          at_customer_place: boolean
          at_stylist_place: boolean
          category_id: string
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          price: number
          stylist_id: string
          title: string
          updated_at: string
        }
        Insert: {
          at_customer_place?: boolean
          at_stylist_place?: boolean
          category_id: string
          created_at?: string
          description?: string | null
          duration_minutes: number
          id?: string
          price: number
          stylist_id: string
          title: string
          updated_at?: string
        }
        Update: {
          at_customer_place?: boolean
          at_stylist_place?: boolean
          category_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          price?: number
          stylist_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_stylist_id_fkey"
            columns: ["stylist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stylist_availability_rules: {
        Row: {
          day_of_week: Database["public"]["Enums"]["day_of_week"]
          end_time: string
          id: string
          start_time: string
          stylist_id: string
        }
        Insert: {
          day_of_week: Database["public"]["Enums"]["day_of_week"]
          end_time: string
          id?: string
          start_time: string
          stylist_id: string
        }
        Update: {
          day_of_week?: Database["public"]["Enums"]["day_of_week"]
          end_time?: string
          id?: string
          start_time?: string
          stylist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stylist_availability_rules_stylist_id_fkey"
            columns: ["stylist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stylist_recurring_unavailability: {
        Row: {
          end_time: string
          id: string
          rrule: string
          series_end_date: string | null
          series_start_date: string
          start_time: string
          stylist_id: string
          title: string | null
        }
        Insert: {
          end_time: string
          id?: string
          rrule: string
          series_end_date?: string | null
          series_start_date: string
          start_time: string
          stylist_id: string
          title?: string | null
        }
        Update: {
          end_time?: string
          id?: string
          rrule?: string
          series_end_date?: string | null
          series_start_date?: string
          start_time?: string
          stylist_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stylist_recurring_unavailability_stylist_id_fkey"
            columns: ["stylist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stylist_unavailability: {
        Row: {
          end_time: string
          id: string
          reason: string | null
          start_time: string
          stylist_id: string
        }
        Insert: {
          end_time: string
          id?: string
          reason?: string | null
          start_time: string
          stylist_id: string
        }
        Update: {
          end_time?: string
          id?: string
          reason?: string | null
          start_time?: string
          stylist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stylist_unavailability_stylist_id_fkey"
            columns: ["stylist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      application_status: "applied" | "pending_info" | "rejected" | "approved"
      booking_status: "pending" | "confirmed" | "cancelled" | "completed"
      day_of_week:
        | "monday"
        | "tuesday"
        | "wednesday"
        | "thursday"
        | "friday"
        | "saturday"
        | "sunday"
      media_type:
        | "avatar"
        | "service_image"
        | "review_image"
        | "chat_image"
        | "application_image"
        | "landing_asset"
        | "logo_asset"
        | "other"
      user_role: "customer" | "stylist" | "admin"
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
      application_status: ["applied", "pending_info", "rejected", "approved"],
      booking_status: ["pending", "confirmed", "cancelled", "completed"],
      day_of_week: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ],
      media_type: [
        "avatar",
        "service_image",
        "review_image",
        "chat_image",
        "application_image",
        "landing_asset",
        "logo_asset",
        "other",
      ],
      user_role: ["customer", "stylist", "admin"],
    },
  },
} as const
