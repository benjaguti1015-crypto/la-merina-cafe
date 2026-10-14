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
      clientes: {
        Row: {
          created_at: string
          cumpleanos: string | null
          enlace_unico: string
          id: string
          instagram: string | null
          nombre_completo: string
        }
        Insert: {
          created_at?: string
          cumpleanos?: string | null
          enlace_unico?: string
          id?: string
          instagram?: string | null
          nombre_completo: string
        }
        Update: {
          created_at?: string
          cumpleanos?: string | null
          enlace_unico?: string
          id?: string
          instagram?: string | null
          nombre_completo?: string
        }
        Relationships: []
      }
      configuracion: {
        Row: {
          acumulacion_activa: boolean
          created_at: string
          id: boolean
          updated_at: string
        }
        Insert: {
          acumulacion_activa?: boolean
          created_at?: string
          id?: boolean
          updated_at?: string
        }
        Update: {
          acumulacion_activa?: boolean
          created_at?: string
          id?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      fidelidad: {
        Row: {
          cliente_id: string
          id: string
          sellos_actuales: number
          ultimo_sello_en: string | null
          updated_at: string
        }
        Insert: {
          cliente_id: string
          id?: string
          sellos_actuales?: number
          ultimo_sello_en?: string | null
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          id?: string
          sellos_actuales?: number
          ultimo_sello_en?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fidelidad_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: true
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      suscripciones_push: {
        Row: {
          auth: string
          cliente_id: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
        }
        Insert: {
          auth: string
          cliente_id: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
        }
        Update: {
          auth?: string
          cliente_id?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
        }
        Relationships: [
          {
            foreignKeyName: "suscripciones_push_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      actualizar_cumpleanos_publico: {
        Args: { p_cumpleanos: string; p_enlace: string }
        Returns: boolean
      }
      ajustar_sellos: {
        Args: { p_cliente_id: string; p_delta: number }
        Returns: number
      }
      buscar_tarjeta: {
        Args: { p_valor: string }
        Returns: {
          enlace_unico: string
          nombre_completo: string
        }[]
      }
      guardar_suscripcion_push: {
        Args: { p_auth: string; p_enlace: string; p_endpoint: string; p_p256dh: string }
        Returns: boolean
      }
      registrar_consentimiento: {
        Args: { p_acepta_avisos: boolean; p_enlace: string }
        Returns: boolean
      }
      registro_publico: {
        Args: { p_cumpleanos?: string | null; p_instagram: string; p_nombre: string }
        Returns: string
      }
      tarjeta_publica: {
        Args: { p_enlace: string }
        Returns: {
          cumpleanos: string | null
          enlace_unico: string
          instagram: string | null
          nombre_completo: string
          sellos_actuales: number
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
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
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
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
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
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
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
