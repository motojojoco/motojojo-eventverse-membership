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
      artists: {
        Row: {
          created_at: string | null
          genre: string
          id: string
          image: string | null
          name: string
          profile: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          genre: string
          id?: string
          image?: string | null
          name: string
          profile: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          genre?: string
          id?: string
          image?: string | null
          name?: string
          profile?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      attendance_records: {
        Row: {
          created_at: string | null
          event_id: string
          host_id: string
          id: string
          marked_at: string | null
          notes: string | null
          status: string
          ticket_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          host_id: string
          id?: string
          marked_at?: string | null
          notes?: string | null
          status?: string
          ticket_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          host_id?: string
          id?: string
          marked_at?: string | null
          notes?: string | null
          status?: string
          ticket_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "hosts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      banners: {
        Row: {
          created_at: string | null
          id: string
          image_url: string
          is_active: boolean | null
          link_text: string | null
          link_url: string | null
          sort_order: number | null
          subtitle: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url: string
          is_active?: boolean | null
          link_text?: string | null
          link_url?: string | null
          sort_order?: number | null
          subtitle?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          link_text?: string | null
          link_url?: string | null
          sort_order?: number | null
          subtitle?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          amount: number
          booking_date: string
          coupon_applied: string | null
          discount_amount: number | null
          email: string
          event_id: string | null
          id: string
          name: string
          order_id: string | null
          payment_id: string | null
          phone: string
          status: string
          ticket_names: string[] | null
          tickets: number
          user_id: string
        }
        Insert: {
          amount: number
          booking_date?: string
          coupon_applied?: string | null
          discount_amount?: number | null
          email: string
          event_id?: string | null
          id?: string
          name: string
          order_id?: string | null
          payment_id?: string | null
          phone: string
          status?: string
          ticket_names?: string[] | null
          tickets?: number
          user_id: string
        }
        Update: {
          amount?: number
          booking_date?: string
          coupon_applied?: string | null
          discount_amount?: number | null
          email?: string
          event_id?: string | null
          id?: string
          name?: string
          order_id?: string | null
          payment_id?: string | null
          phone?: string
          status?: string
          ticket_names?: string[] | null
          tickets?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string
          created_at: string | null
          description: string | null
          icon: string
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          color: string
          created_at?: string | null
          description?: string | null
          icon: string
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string
          created_at?: string | null
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      event_seats: {
        Row: {
          booking_id: string | null
          created_at: string | null
          event_id: string | null
          id: string
          seat_number: number
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          seat_number: number
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          seat_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_seats_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_with_attendees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_seats_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_seats_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_types: {
        Row: {
          created_at: string | null
          deletable: boolean | null
          description: string | null
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deletable?: boolean | null
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deletable?: boolean | null
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          address: string | null
          base_price: number
          category: string
          city: string
          convenience_fee: number
          created_at: string
          date: string
          description: string | null
          discounted_price: number | null
          duration: string | null
          event_type: string
          gst: number
          has_discount: boolean | null
          host: string | null
          id: string
          image: string
          images: string[] | null
          is_published: boolean | null
          long_description: string | null
          price: number
          real_price: number | null
          seats_available: number
          subtitle: string | null
          subtotal: number
          ticket_price: number
          time: string
          title: string
          updated_at: string
          venue: string
        }
        Insert: {
          address?: string | null
          base_price?: number
          category: string
          city: string
          convenience_fee?: number
          created_at?: string
          date: string
          description?: string | null
          discounted_price?: number | null
          duration?: string | null
          event_type: string
          gst?: number
          has_discount?: boolean | null
          host?: string | null
          id?: string
          image: string
          images?: string[] | null
          is_published?: boolean | null
          long_description?: string | null
          price: number
          real_price?: number | null
          seats_available?: number
          subtitle?: string | null
          subtotal?: number
          ticket_price?: number
          time: string
          title: string
          updated_at?: string
          venue: string
        }
        Update: {
          address?: string | null
          base_price?: number
          category?: string
          city?: string
          convenience_fee?: number
          created_at?: string
          date?: string
          description?: string | null
          discounted_price?: number | null
          duration?: string | null
          event_type?: string
          gst?: number
          has_discount?: boolean | null
          host?: string | null
          id?: string
          image?: string
          images?: string[] | null
          is_published?: boolean | null
          long_description?: string | null
          price?: number
          real_price?: number | null
          seats_available?: number
          subtitle?: string | null
          subtotal?: number
          ticket_price?: number
          time?: string
          title?: string
          updated_at?: string
          venue?: string
        }
        Relationships: []
      }
      experiences: {
        Row: {
          created_at: string
          description: string
          id: string
          image: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          image: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          image?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      host_events: {
        Row: {
          created_at: string | null
          event_id: string
          host_id: string
          id: string
          permissions: Json | null
        }
        Insert: {
          created_at?: string | null
          event_id: string
          host_id: string
          id?: string
          permissions?: Json | null
        }
        Update: {
          created_at?: string | null
          event_id?: string
          host_id?: string
          id?: string
          permissions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "host_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "host_events_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "hosts"
            referencedColumns: ["id"]
          },
        ]
      }
      host_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invitation_token: string
          invited_by: string
          status: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          invitation_token: string
          invited_by: string
          status?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invitation_token?: string
          invited_by?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "host_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      hosts: {
        Row: {
          bio: string | null
          city: string | null
          created_at: string | null
          host_name: string
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          phone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bio?: string | null
          city?: string | null
          created_at?: string | null
          host_name: string
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          phone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bio?: string | null
          city?: string | null
          created_at?: string | null
          host_name?: string
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hosts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      jojo_gang_members: {
        Row: {
          additional_info: string | null
          age: number
          area_pincode: string
          attended_gathering: string
          city: string
          created_at: string | null
          email: string
          id: string
          instagram_link: string
          name: string
          phone_number: string
          position: string
          updated_at: string | null
        }
        Insert: {
          additional_info?: string | null
          age: number
          area_pincode: string
          attended_gathering: string
          city: string
          created_at?: string | null
          email: string
          id?: string
          instagram_link: string
          name: string
          phone_number: string
          position: string
          updated_at?: string | null
        }
        Update: {
          additional_info?: string | null
          age?: number
          area_pincode?: string
          attended_gathering?: string
          city?: string
          created_at?: string | null
          email?: string
          id?: string
          instagram_link?: string
          name?: string
          phone_number?: string
          position?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      membership_plans: {
        Row: {
          created_at: string
          description: string | null
          duration_days: number
          id: string
          is_active: boolean
          name: string
          price_inr: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_days: number
          id?: string
          is_active?: boolean
          name: string
          price_inr: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_days?: number
          id?: string
          is_active?: boolean
          name?: string
          price_inr?: number
          updated_at?: string
        }
        Relationships: []
      }
      motojojo_members: {
        Row: {
          area_and_pincode: string
          art_inspiration: string | null
          been_to_gathering: string
          birthday: string
          city: string
          created_at: string | null
          group_role: string | null
          group_role_other: string | null
          how_found_us: string
          how_found_us_other: string | null
          id: string
          identify_as: string | null
          identify_as_other: string | null
          interests: string
          mood: string | null
          mood_other: string | null
          name: string
          phone_number: string
          social_handles: string
          updated_at: string | null
          why_join_community: string
        }
        Insert: {
          area_and_pincode: string
          art_inspiration?: string | null
          been_to_gathering: string
          birthday: string
          city: string
          created_at?: string | null
          group_role?: string | null
          group_role_other?: string | null
          how_found_us: string
          how_found_us_other?: string | null
          id?: string
          identify_as?: string | null
          identify_as_other?: string | null
          interests: string
          mood?: string | null
          mood_other?: string | null
          name: string
          phone_number: string
          social_handles: string
          updated_at?: string | null
          why_join_community: string
        }
        Update: {
          area_and_pincode?: string
          art_inspiration?: string | null
          been_to_gathering?: string
          birthday?: string
          city?: string
          created_at?: string | null
          group_role?: string | null
          group_role_other?: string | null
          how_found_us?: string
          how_found_us_other?: string | null
          id?: string
          identify_as?: string | null
          identify_as_other?: string | null
          interests?: string
          mood?: string | null
          mood_other?: string | null
          name?: string
          phone_number?: string
          social_handles?: string
          updated_at?: string | null
          why_join_community?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          avatar_url: string | null
          content: string
          created_at: string | null
          email: string | null
          event_id: string | null
          id: string
          is_approved: boolean | null
          is_featured: boolean | null
          name: string
          rating: number | null
          role: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          content: string
          created_at?: string | null
          email?: string | null
          event_id?: string | null
          id?: string
          is_approved?: boolean | null
          is_featured?: boolean | null
          name: string
          rating?: number | null
          role: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          content?: string
          created_at?: string | null
          email?: string | null
          event_id?: string | null
          id?: string
          is_approved?: boolean | null
          is_featured?: boolean | null
          name?: string
          rating?: number | null
          role?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "testimonials_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          booking_id: string | null
          created_at: string | null
          event_id: string | null
          id: string
          seat_number: string | null
          ticket_number: string | null
          user_id: string | null
          username: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          seat_number?: string | null
          ticket_number?: string | null
          user_id?: string | null
          username?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          seat_number?: string | null
          ticket_number?: string | null
          user_id?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_with_attendees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      user_memberships: {
        Row: {
          amount_inr: number | null
          created_at: string
          end_date: string | null
          id: string
          payment_id: string | null
          plan_id: string
          start_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_inr?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          payment_id?: string | null
          plan_id: string
          start_date?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_inr?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          payment_id?: string | null
          plan_id?: string
          start_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_memberships_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          city: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          phone: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          role?: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      attendance_city_stats: {
        Row: {
          absent_count: number | null
          attendance_percentage: number | null
          city: string | null
          present_count: number | null
          total_attendance: number | null
        }
        Relationships: []
      }
      booking_with_attendees: {
        Row: {
          amount: number | null
          attendee_names: string | null
          booking_date: string | null
          email: string | null
          event_id: string | null
          id: string | null
          name: string | null
          order_id: string | null
          payment_id: string | null
          phone: string | null
          status: string | null
          tickets: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      jojo_gang_city_stats: {
        Row: {
          city: string | null
          count: number | null
          percentage: number | null
        }
        Relationships: []
      }
      jojo_gang_position_stats: {
        Row: {
          count: number | null
          percentage: number | null
          position: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_host_invitation: {
        Args: {
          p_token: string
          p_user_id: string
          p_host_name: string
          p_phone?: string
          p_city?: string
          p_bio?: string
        }
        Returns: boolean
      }
      create_host_invitation: {
        Args: {
          p_email: string
          p_invited_by: string
          p_expires_in_hours?: number
        }
        Returns: string
      }
      generate_event_seats: {
        Args: { event_id: string; total_seats: number }
        Returns: undefined
      }
      generate_invitation_token: {
        Args: Record<PropertyKey, never>
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
