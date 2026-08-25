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
      billing_customers: {
        Row: {
          created_at: string
          creation_idempotency_key: string
          organization_id: string
          provisioning_status: string
          stripe_customer_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          creation_idempotency_key: string
          organization_id: string
          provisioning_status: string
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          creation_idempotency_key?: string
          organization_id?: string
          provisioning_status?: string
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_customers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          collection_paused: boolean
          created_at: string
          current_period_end: string | null
          last_synced_at: string
          organization_id: string
          past_due_since: string | null
          plan_code: string
          status: string
          stripe_price_id: string
          stripe_subscription_id: string
          updated_at: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          collection_paused?: boolean
          created_at?: string
          current_period_end?: string | null
          last_synced_at: string
          organization_id: string
          past_due_since?: string | null
          plan_code: string
          status: string
          stripe_price_id: string
          stripe_subscription_id: string
          updated_at?: string
        }
        Update: {
          cancel_at_period_end?: boolean
          collection_paused?: boolean
          created_at?: string
          current_period_end?: string | null
          last_synced_at?: string
          organization_id?: string
          past_due_since?: string | null
          plan_code?: string
          status?: string
          stripe_price_id?: string
          stripe_subscription_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "billing_customers"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      billing_trial_grants: {
        Row: {
          clerk_user_id: string
          created_at: string
          ends_at: string
          grant_kind: string
          id: string
          organization_id: string
          plan_code: string
          revoked_at: string | null
          starts_at: string
          updated_at: string
        }
        Insert: {
          clerk_user_id: string
          created_at?: string
          ends_at: string
          grant_kind: string
          id?: string
          organization_id: string
          plan_code: string
          revoked_at?: string | null
          starts_at: string
          updated_at?: string
        }
        Update: {
          clerk_user_id?: string
          created_at?: string
          ends_at?: string
          grant_kind?: string
          id?: string
          organization_id?: string
          plan_code?: string
          revoked_at?: string | null
          starts_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_trial_grants_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          clerk_organization_id: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          clerk_organization_id: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          clerk_organization_id?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      store_memberships: {
        Row: {
          clerk_user_id: string
          created_at: string
          id: string
          organization_id: string
          store_id: string
          updated_at: string
        }
        Insert: {
          clerk_user_id: string
          created_at?: string
          id?: string
          organization_id: string
          store_id: string
          updated_at?: string
        }
        Update: {
          clerk_user_id?: string
          created_at?: string
          id?: string
          organization_id?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_memberships_organization_id_store_id_fkey"
            columns: ["organization_id", "store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      stores: {
        Row: {
          created_at: string
          id: string
          name: string
          organization_id: string
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          organization_id: string
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_webhook_events: {
        Row: {
          created_at: string
          event_type: string
          livemode: boolean
          processed_at: string | null
          stripe_created_at: string
          stripe_event_id: string
          stripe_object_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          livemode: boolean
          processed_at?: string | null
          stripe_created_at: string
          stripe_event_id: string
          stripe_object_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          livemode?: boolean
          processed_at?: string | null
          stripe_created_at?: string
          stripe_event_id?: string
          stripe_object_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_stripe_subscription_projection: {
        Args: {
          p_cancel_at_period_end: boolean
          p_collection_paused: boolean
          p_current_period_end: string
          p_event_type: string
          p_livemode: boolean
          p_plan_code: string
          p_status: string
          p_stripe_created_at: string
          p_stripe_customer_id: string
          p_stripe_event_id: string
          p_stripe_object_id: string
          p_stripe_price_id: string
          p_stripe_subscription_id: string
        }
        Returns: string
      }
      resolve_active_organization_entitlement_facts: {
        Args: never
        Returns: {
          subscription_collection_paused: boolean
          subscription_plan_code: string
          subscription_status: string
          trial_plan_code: string
          trial_valid_until: string
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
