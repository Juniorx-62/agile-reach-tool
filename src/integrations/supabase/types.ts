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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      partners: {
        Row: {
          contact_email: string
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          contact_email: string
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          contact_email?: string
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          color: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      sla_settings: {
        Row: {
          created_at: string
          id: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          resolution_hours: number
          response_hours: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          resolution_hours: number
          response_hours: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          resolution_hours?: number
          response_hours?: number
          updated_at?: string
        }
        Relationships: []
      }
      sprints: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_active: boolean
          name: string
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_active?: boolean
          name: string
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean
          name?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          actual_hours: number | null
          area: Database["public"]["Enums"]["task_area"] | null
          assignee_id: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          is_delivered: boolean
          priority: Database["public"]["Enums"]["task_priority"]
          project_id: string | null
          sprint_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          actual_hours?: number | null
          area?: Database["public"]["Enums"]["task_area"] | null
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          is_delivered?: boolean
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string | null
          sprint_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          actual_hours?: number | null
          area?: Database["public"]["Enums"]["task_area"] | null
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          is_delivered?: boolean
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string | null
          sprint_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "users_internal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          ticket_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          ticket_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          ticket_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_attachments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_categories: {
        Row: {
          color: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      ticket_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_internal_note: boolean
          ticket_id: string
          updated_at: string
          user_id: string | null
          user_name: string
          user_type: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_internal_note?: boolean
          ticket_id: string
          updated_at?: string
          user_id?: string | null
          user_name: string
          user_type: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_internal_note?: boolean
          ticket_id?: string
          updated_at?: string
          user_id?: string | null
          user_name?: string
          user_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_comments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_timeline: {
        Row: {
          action_description: string
          action_type: string
          created_at: string
          id: string
          new_value: string | null
          old_value: string | null
          ticket_id: string
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action_description: string
          action_type: string
          created_at?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          ticket_id: string
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action_description?: string
          action_type?: string
          created_at?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          ticket_id?: string
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_timeline_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          assignee_id: string | null
          created_at: string
          created_by: string | null
          description: string
          expected_result: string | null
          id: string
          page_url: string | null
          partner_id: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          resolved_at: string | null
          sla_deadline: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          steps_to_reproduce: string | null
          ticket_type: Database["public"]["Enums"]["ticket_type"]
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          expected_result?: string | null
          id?: string
          page_url?: string | null
          partner_id: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          resolved_at?: string | null
          sla_deadline?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          steps_to_reproduce?: string | null
          ticket_type: Database["public"]["Enums"]["ticket_type"]
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          expected_result?: string | null
          id?: string
          page_url?: string | null
          partner_id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          resolved_at?: string | null
          sla_deadline?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          steps_to_reproduce?: string | null
          ticket_type?: Database["public"]["Enums"]["ticket_type"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "users_partner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_partner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      users_internal: {
        Row: {
          area_filter: string
          auth_id: string | null
          created_at: string
          email: string
          id: string
          invite_expires_at: string | null
          invite_token: string | null
          is_active: boolean
          name: string
          phone: string | null
          photo_url: string | null
          role: Database["public"]["Enums"]["internal_role"]
          task_visibility: string
          updated_at: string
        }
        Insert: {
          area_filter?: string
          auth_id?: string | null
          created_at?: string
          email: string
          id?: string
          invite_expires_at?: string | null
          invite_token?: string | null
          is_active?: boolean
          name: string
          phone?: string | null
          photo_url?: string | null
          role?: Database["public"]["Enums"]["internal_role"]
          task_visibility?: string
          updated_at?: string
        }
        Update: {
          area_filter?: string
          auth_id?: string | null
          created_at?: string
          email?: string
          id?: string
          invite_expires_at?: string | null
          invite_token?: string | null
          is_active?: boolean
          name?: string
          phone?: string | null
          photo_url?: string | null
          role?: Database["public"]["Enums"]["internal_role"]
          task_visibility?: string
          updated_at?: string
        }
        Relationships: []
      }
      users_partner: {
        Row: {
          auth_id: string | null
          created_at: string
          email: string
          id: string
          invite_expires_at: string | null
          invite_token: string | null
          is_active: boolean
          name: string
          partner_id: string
          phone: string | null
          photo_url: string | null
          role: Database["public"]["Enums"]["partner_role"]
          updated_at: string
        }
        Insert: {
          auth_id?: string | null
          created_at?: string
          email: string
          id?: string
          invite_expires_at?: string | null
          invite_token?: string | null
          is_active?: boolean
          name: string
          partner_id: string
          phone?: string | null
          photo_url?: string | null
          role?: Database["public"]["Enums"]["partner_role"]
          updated_at?: string
        }
        Update: {
          auth_id?: string | null
          created_at?: string
          email?: string
          id?: string
          invite_expires_at?: string | null
          invite_token?: string | null
          is_active?: boolean
          name?: string
          partner_id?: string
          phone?: string | null
          photo_url?: string | null
          role?: Database["public"]["Enums"]["partner_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_partner_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_internal_role: {
        Args: never
        Returns: Database["public"]["Enums"]["internal_role"]
      }
      get_partner_role: {
        Args: never
        Returns: Database["public"]["Enums"]["partner_role"]
      }
      get_user_partner_id: { Args: never; Returns: string }
      get_user_type: { Args: never; Returns: string }
      is_internal_admin: { Args: never; Returns: boolean }
      is_internal_user: { Args: never; Returns: boolean }
      is_partner_admin: { Args: never; Returns: boolean }
      is_partner_dev: { Args: never; Returns: boolean }
      is_partner_user: { Args: never; Returns: boolean }
    }
    Enums: {
      internal_role: "admin" | "dev"
      partner_role: "admin" | "dev" | "cliente"
      task_area:
        | "frontend"
        | "backend"
        | "fullstack"
        | "design"
        | "devops"
        | "qa"
      task_priority: "P0" | "P1" | "P2" | "P3"
      task_status: "backlog" | "todo" | "in_progress" | "in_review" | "done"
      ticket_priority: "critica" | "alta" | "media" | "baixa"
      ticket_status:
        | "aberto"
        | "em_andamento"
        | "aguardando_cliente"
        | "em_revisao"
        | "concluido"
        | "cancelado"
      ticket_type: "bug" | "melhoria" | "nova_funcionalidade" | "suporte"
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
      internal_role: ["admin", "dev"],
      partner_role: ["admin", "dev", "cliente"],
      task_area: ["frontend", "backend", "fullstack", "design", "devops", "qa"],
      task_priority: ["P0", "P1", "P2", "P3"],
      task_status: ["backlog", "todo", "in_progress", "in_review", "done"],
      ticket_priority: ["critica", "alta", "media", "baixa"],
      ticket_status: [
        "aberto",
        "em_andamento",
        "aguardando_cliente",
        "em_revisao",
        "concluido",
        "cancelado",
      ],
      ticket_type: ["bug", "melhoria", "nova_funcionalidade", "suporte"],
    },
  },
} as const
