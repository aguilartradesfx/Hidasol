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
      knowledge_chunks: {
        Row: {
          categoria: string | null
          contenido: string
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          categoria?: string | null
          contenido: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          categoria?: string | null
          contenido?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      langchain_chat_histories: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      logs: {
        Row: {
          confidence: number | null
          contact_id: string | null
          estado_sesion: string | null
          id: string
          intent: string | null
          message_in: string | null
          message_out: string | null
          timestamp: string | null
        }
        Insert: {
          confidence?: number | null
          contact_id?: string | null
          estado_sesion?: string | null
          id?: string
          intent?: string | null
          message_in?: string | null
          message_out?: string | null
          timestamp?: string | null
        }
        Update: {
          confidence?: number | null
          contact_id?: string | null
          estado_sesion?: string | null
          id?: string
          intent?: string | null
          message_in?: string | null
          message_out?: string | null
          timestamp?: string | null
        }
        Relationships: []
      }
      message_buffer: {
        Row: {
          channel: string | null
          contact_id: string
          created_at: string | null
          email: string | null
          id: number
          media_url: string | null
          message: string | null
          message_type: string | null
          name: string | null
          phone: string | null
          processed: boolean | null
        }
        Insert: {
          channel?: string | null
          contact_id: string
          created_at?: string | null
          email?: string | null
          id?: number
          media_url?: string | null
          message?: string | null
          message_type?: string | null
          name?: string | null
          phone?: string | null
          processed?: boolean | null
        }
        Update: {
          channel?: string | null
          contact_id?: string
          created_at?: string | null
          email?: string | null
          id?: number
          media_url?: string | null
          message?: string | null
          message_type?: string | null
          name?: string | null
          phone?: string | null
          processed?: boolean | null
        }
        Relationships: []
      }
      n8n_chat_histories: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      n8n_chat_memory_general: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          abono: number | null
          acabados: string | null
          alto_cm: string | null
          ancho_cm: string | null
          canal_contacto: string | null
          cantidad: string | null
          caras: string | null
          cedula_juridica: string | null
          cliente: string | null
          color_impresion: string | null
          color_manguera: string | null
          contact_id: string
          contacto_whatsapp: string | null
          corporeo_color: string | null
          corporeo_fuente: string | null
          corporeo_grosor: string | null
          corporeo_material: string | null
          corporeos: string | null
          corporeos_multi: string | null
          created_at: string | null
          disenado_por: string | null
          diseno_listo: boolean | null
          email_cliente: string | null
          empresa_factura: string | null
          encargado_por: string | null
          especificaciones: string | null
          estado: string | null
          estructura: string | null
          factura_electronica: string | null
          fecha_aprobacion: string | null
          fecha_entrega: string | null
          fecha_envio_arte: string | null
          fecha_impresion: string | null
          fecha_ingreso: string | null
          fecha_ingreso_rotulacion: string | null
          fecha_limite: string | null
          fecha_salida: string | null
          finalizado_por: string | null
          forma_pago: string | null
          impreso_por: string | null
          instalacion: string | null
          iva: boolean | null
          lugar_instalacion: string | null
          maquina: string | null
          material: string | null
          ml_tinta: string | null
          mts_desperdicio: string | null
          mts_impresos: string | null
          notas: string | null
          order_id: string
          producto_id: string | null
          producto_nombre: string | null
          realizada_por: string | null
          realizada_por_cliente: string | null
          saldo: number | null
          tamano: string | null
          tecnica: string | null
          tipo_diseno: string | null
          tipo_material: string | null
          tipo_trabajo: string | null
          ubicacion_cliente: string | null
          unidad_medida: string | null
          updated_at: string | null
          valor: number | null
        }
        Insert: {
          abono?: number | null
          acabados?: string | null
          alto_cm?: string | null
          ancho_cm?: string | null
          canal_contacto?: string | null
          cantidad?: string | null
          caras?: string | null
          cedula_juridica?: string | null
          cliente?: string | null
          color_impresion?: string | null
          color_manguera?: string | null
          contact_id: string
          contacto_whatsapp?: string | null
          corporeo_color?: string | null
          corporeo_fuente?: string | null
          corporeo_grosor?: string | null
          corporeo_material?: string | null
          corporeos?: string | null
          corporeos_multi?: string | null
          created_at?: string | null
          disenado_por?: string | null
          diseno_listo?: boolean | null
          email_cliente?: string | null
          empresa_factura?: string | null
          encargado_por?: string | null
          especificaciones?: string | null
          estado?: string | null
          estructura?: string | null
          factura_electronica?: string | null
          fecha_aprobacion?: string | null
          fecha_entrega?: string | null
          fecha_envio_arte?: string | null
          fecha_impresion?: string | null
          fecha_ingreso?: string | null
          fecha_ingreso_rotulacion?: string | null
          fecha_limite?: string | null
          fecha_salida?: string | null
          finalizado_por?: string | null
          forma_pago?: string | null
          impreso_por?: string | null
          instalacion?: string | null
          iva?: boolean | null
          lugar_instalacion?: string | null
          maquina?: string | null
          material?: string | null
          ml_tinta?: string | null
          mts_desperdicio?: string | null
          mts_impresos?: string | null
          notas?: string | null
          order_id?: string
          producto_id?: string | null
          producto_nombre?: string | null
          realizada_por?: string | null
          realizada_por_cliente?: string | null
          saldo?: number | null
          tamano?: string | null
          tecnica?: string | null
          tipo_diseno?: string | null
          tipo_material?: string | null
          tipo_trabajo?: string | null
          ubicacion_cliente?: string | null
          unidad_medida?: string | null
          updated_at?: string | null
          valor?: number | null
        }
        Update: {
          abono?: number | null
          acabados?: string | null
          alto_cm?: string | null
          ancho_cm?: string | null
          canal_contacto?: string | null
          cantidad?: string | null
          caras?: string | null
          cedula_juridica?: string | null
          cliente?: string | null
          color_impresion?: string | null
          color_manguera?: string | null
          contact_id?: string
          contacto_whatsapp?: string | null
          corporeo_color?: string | null
          corporeo_fuente?: string | null
          corporeo_grosor?: string | null
          corporeo_material?: string | null
          corporeos?: string | null
          corporeos_multi?: string | null
          created_at?: string | null
          disenado_por?: string | null
          diseno_listo?: boolean | null
          email_cliente?: string | null
          empresa_factura?: string | null
          encargado_por?: string | null
          especificaciones?: string | null
          estado?: string | null
          estructura?: string | null
          factura_electronica?: string | null
          fecha_aprobacion?: string | null
          fecha_entrega?: string | null
          fecha_envio_arte?: string | null
          fecha_impresion?: string | null
          fecha_ingreso?: string | null
          fecha_ingreso_rotulacion?: string | null
          fecha_limite?: string | null
          fecha_salida?: string | null
          finalizado_por?: string | null
          forma_pago?: string | null
          impreso_por?: string | null
          instalacion?: string | null
          iva?: boolean | null
          lugar_instalacion?: string | null
          maquina?: string | null
          material?: string | null
          ml_tinta?: string | null
          mts_desperdicio?: string | null
          mts_impresos?: string | null
          notas?: string | null
          order_id?: string
          producto_id?: string | null
          producto_nombre?: string | null
          realizada_por?: string | null
          realizada_por_cliente?: string | null
          saldo?: number | null
          tamano?: string | null
          tecnica?: string | null
          tipo_diseno?: string | null
          tipo_material?: string | null
          tipo_trabajo?: string | null
          ubicacion_cliente?: string | null
          unidad_medida?: string | null
          updated_at?: string | null
          valor?: number | null
        }
        Relationships: []
      }
      productos: {
        Row: {
          activo: boolean | null
          cantidades: Json
          categoria: string
          created_at: string | null
          entrega_dias: string | null
          formato_archivo: string | null
          id: string
          producto: string
          restricciones: string | null
          troquelado: string | null
          variables: Json
        }
        Insert: {
          activo?: boolean | null
          cantidades: Json
          categoria: string
          created_at?: string | null
          entrega_dias?: string | null
          formato_archivo?: string | null
          id: string
          producto: string
          restricciones?: string | null
          troquelado?: string | null
          variables: Json
        }
        Update: {
          activo?: boolean | null
          cantidades?: Json
          categoria?: string
          created_at?: string | null
          entrega_dias?: string | null
          formato_archivo?: string | null
          id?: string
          producto?: string
          restricciones?: string | null
          troquelado?: string | null
          variables?: Json
        }
        Relationships: []
      }
      sessions: {
        Row: {
          channel: string | null
          contact_id: string
          created_at: string | null
          datos_utiles: Json | null
          estado: string | null
          estado_bot: string | null
          historial: Json | null
          id: string
          name: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          channel?: string | null
          contact_id: string
          created_at?: string | null
          datos_utiles?: Json | null
          estado?: string | null
          estado_bot?: string | null
          historial?: Json | null
          id?: string
          name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          channel?: string | null
          contact_id?: string
          created_at?: string | null
          datos_utiles?: Json | null
          estado?: string | null
          estado_bot?: string | null
          historial?: Json | null
          id?: string
          name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          role: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          name?: string | null
          role?: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          role?: string
        }
        Relationships: []
      }
    }
    Views: {
      knowledge_chunks_view: {
        Row: {
          content: string | null
          embedding: string | null
          id: string | null
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: string | null
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: string | null
          metadata?: Json | null
        }
        Relationships: []
      }
    }
    Functions: {
      buscar_producto: { Args: { producto_nombre: string }; Returns: Json }
      listar_productos: { Args: { categoria_nombre?: string }; Returns: Json }
      match_documents: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      search_knowledge: {
        Args: {
          filter_categoria?: string
          match_count?: number
          query_embedding: string
        }
        Returns: {
          categoria: string
          contenido: string
          metadata: Json
          similarity: number
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
