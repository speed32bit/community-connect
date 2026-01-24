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
      announcements: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          expire_date: string | null
          hoa_id: string
          id: string
          is_pinned: boolean | null
          publish_date: string | null
          title: string
          updated_at: string
          visibility: string | null
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          expire_date?: string | null
          hoa_id: string
          id?: string
          is_pinned?: boolean | null
          publish_date?: string | null
          title: string
          updated_at?: string
          visibility?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          expire_date?: string | null
          hoa_id?: string
          id?: string
          is_pinned?: boolean | null
          publish_date?: string | null
          title?: string
          updated_at?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_hoa_id_fkey"
            columns: ["hoa_id"]
            isOneToOne: false
            referencedRelation: "hoas"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          hoa_id: string | null
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          hoa_id?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          hoa_id?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_hoa_id_fkey"
            columns: ["hoa_id"]
            isOneToOne: false
            referencedRelation: "hoas"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_lines: {
        Row: {
          annual_total: number | null
          april: number | null
          august: number | null
          budget_id: string
          category_id: string | null
          category_name: string
          created_at: string
          december: number | null
          february: number | null
          id: string
          january: number | null
          july: number | null
          june: number | null
          march: number | null
          may: number | null
          november: number | null
          october: number | null
          september: number | null
        }
        Insert: {
          annual_total?: number | null
          april?: number | null
          august?: number | null
          budget_id: string
          category_id?: string | null
          category_name: string
          created_at?: string
          december?: number | null
          february?: number | null
          id?: string
          january?: number | null
          july?: number | null
          june?: number | null
          march?: number | null
          may?: number | null
          november?: number | null
          october?: number | null
          september?: number | null
        }
        Update: {
          annual_total?: number | null
          april?: number | null
          august?: number | null
          budget_id?: string
          category_id?: string | null
          category_name?: string
          created_at?: string
          december?: number | null
          february?: number | null
          id?: string
          january?: number | null
          july?: number | null
          june?: number | null
          march?: number | null
          may?: number | null
          november?: number | null
          october?: number | null
          september?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_lines_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_lines_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "transaction_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          created_at: string
          created_by: string | null
          fiscal_year: number
          hoa_id: string
          id: string
          is_active: boolean | null
          name: string
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          fiscal_year: number
          hoa_id: string
          id?: string
          is_active?: boolean | null
          name: string
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          fiscal_year?: number
          hoa_id?: string
          id?: string
          is_active?: boolean | null
          name?: string
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_hoa_id_fkey"
            columns: ["hoa_id"]
            isOneToOne: false
            referencedRelation: "hoas"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_actions: {
        Row: {
          action_type: Database["public"]["Enums"]["collection_action_type"]
          completed_date: string | null
          created_at: string
          hoa_id: string
          id: string
          notes: string | null
          performed_by: string | null
          scheduled_date: string | null
          unit_id: string
        }
        Insert: {
          action_type: Database["public"]["Enums"]["collection_action_type"]
          completed_date?: string | null
          created_at?: string
          hoa_id: string
          id?: string
          notes?: string | null
          performed_by?: string | null
          scheduled_date?: string | null
          unit_id: string
        }
        Update: {
          action_type?: Database["public"]["Enums"]["collection_action_type"]
          completed_date?: string | null
          created_at?: string
          hoa_id?: string
          id?: string
          notes?: string | null
          performed_by?: string | null
          scheduled_date?: string | null
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_actions_hoa_id_fkey"
            columns: ["hoa_id"]
            isOneToOne: false
            referencedRelation: "hoas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_actions_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      deposit_accounts: {
        Row: {
          account_number: string | null
          bank_name: string | null
          created_at: string
          hoa_id: string
          id: string
          is_default: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          account_number?: string | null
          bank_name?: string | null
          created_at?: string
          hoa_id: string
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          account_number?: string | null
          bank_name?: string | null
          created_at?: string
          hoa_id?: string
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deposit_accounts_hoa_id_fkey"
            columns: ["hoa_id"]
            isOneToOne: false
            referencedRelation: "hoas"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: Database["public"]["Enums"]["document_category"]
          created_at: string
          description: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          hoa_id: string
          id: string
          title: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["document_category"]
          created_at?: string
          description?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          hoa_id: string
          id?: string
          title: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["document_category"]
          created_at?: string
          description?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          hoa_id?: string
          id?: string
          title?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_hoa_id_fkey"
            columns: ["hoa_id"]
            isOneToOne: false
            referencedRelation: "hoas"
            referencedColumns: ["id"]
          },
        ]
      }
      email_log: {
        Row: {
          body: string | null
          hoa_id: string
          id: string
          recipient_email: string
          recipient_name: string | null
          related_id: string | null
          related_type: string | null
          sent_at: string | null
          sent_by: string | null
          status: string | null
          subject: string
          template_id: string | null
        }
        Insert: {
          body?: string | null
          hoa_id: string
          id?: string
          recipient_email: string
          recipient_name?: string | null
          related_id?: string | null
          related_type?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string | null
          subject: string
          template_id?: string | null
        }
        Update: {
          body?: string | null
          hoa_id?: string
          id?: string
          recipient_email?: string
          recipient_name?: string | null
          related_id?: string | null
          related_type?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string | null
          subject?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_log_hoa_id_fkey"
            columns: ["hoa_id"]
            isOneToOne: false
            referencedRelation: "hoas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_log_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body: string
          created_at: string
          hoa_id: string
          id: string
          name: string
          subject: string
          template_type: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          hoa_id: string
          id?: string
          name: string
          subject: string
          template_type: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          hoa_id?: string
          id?: string
          name?: string
          subject?: string
          template_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_hoa_id_fkey"
            columns: ["hoa_id"]
            isOneToOne: false
            referencedRelation: "hoas"
            referencedColumns: ["id"]
          },
        ]
      }
      hoas: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          dues_amount: number | null
          dues_frequency: Database["public"]["Enums"]["dues_frequency"] | null
          email: string | null
          grace_period_days: number | null
          id: string
          late_fee_amount: number | null
          late_fee_percentage: number | null
          logo_url: string | null
          name: string
          phone: string | null
          state: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          dues_amount?: number | null
          dues_frequency?: Database["public"]["Enums"]["dues_frequency"] | null
          email?: string | null
          grace_period_days?: number | null
          id?: string
          late_fee_amount?: number | null
          late_fee_percentage?: number | null
          logo_url?: string | null
          name: string
          phone?: string | null
          state?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          dues_amount?: number | null
          dues_frequency?: Database["public"]["Enums"]["dues_frequency"] | null
          email?: string | null
          grace_period_days?: number | null
          id?: string
          late_fee_amount?: number | null
          late_fee_percentage?: number | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          state?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          hoa_id: string
          id: string
          invited_by: string | null
          member_type: Database["public"]["Enums"]["member_type"] | null
          role: Database["public"]["Enums"]["app_role"]
          token: string
          unit_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          hoa_id: string
          id?: string
          invited_by?: string | null
          member_type?: Database["public"]["Enums"]["member_type"] | null
          role?: Database["public"]["Enums"]["app_role"]
          token: string
          unit_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          hoa_id?: string
          id?: string
          invited_by?: string | null
          member_type?: Database["public"]["Enums"]["member_type"] | null
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitations_hoa_id_fkey"
            columns: ["hoa_id"]
            isOneToOne: false
            referencedRelation: "hoas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_categories: {
        Row: {
          created_at: string
          description: string | null
          hoa_id: string
          id: string
          is_default: boolean | null
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          hoa_id: string
          id?: string
          is_default?: boolean | null
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          hoa_id?: string
          id?: string
          is_default?: boolean | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_categories_hoa_id_fkey"
            columns: ["hoa_id"]
            isOneToOne: false
            referencedRelation: "hoas"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_line_items: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          invoice_id: string
          quantity: number | null
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          quantity?: number | null
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deposit_account_id: string | null
          description: string | null
          discount: number | null
          due_date: string
          hoa_id: string
          id: string
          invoice_number: string
          is_recurring: boolean | null
          issue_date: string
          late_fee: number | null
          recurring_frequency:
            | Database["public"]["Enums"]["dues_frequency"]
            | null
          status: Database["public"]["Enums"]["invoice_status"]
          title: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deposit_account_id?: string | null
          description?: string | null
          discount?: number | null
          due_date: string
          hoa_id: string
          id?: string
          invoice_number: string
          is_recurring?: boolean | null
          issue_date?: string
          late_fee?: number | null
          recurring_frequency?:
            | Database["public"]["Enums"]["dues_frequency"]
            | null
          status?: Database["public"]["Enums"]["invoice_status"]
          title: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deposit_account_id?: string | null
          description?: string | null
          discount?: number | null
          due_date?: string
          hoa_id?: string
          id?: string
          invoice_number?: string
          is_recurring?: boolean | null
          issue_date?: string
          late_fee?: number | null
          recurring_frequency?:
            | Database["public"]["Enums"]["dues_frequency"]
            | null
          status?: Database["public"]["Enums"]["invoice_status"]
          title?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "invoice_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_deposit_account_id_fkey"
            columns: ["deposit_account_id"]
            isOneToOne: false
            referencedRelation: "deposit_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_hoa_id_fkey"
            columns: ["hoa_id"]
            isOneToOne: false
            referencedRelation: "hoas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          hoa_id: string
          id: string
          invoice_id: string
          notes: string | null
          payment_date: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          recorded_by: string | null
          reference_number: string | null
          unit_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          hoa_id: string
          id?: string
          invoice_id: string
          notes?: string | null
          payment_date?: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          recorded_by?: string | null
          reference_number?: string | null
          unit_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          hoa_id?: string
          id?: string
          invoice_id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          recorded_by?: string | null
          reference_number?: string | null
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_hoa_id_fkey"
            columns: ["hoa_id"]
            isOneToOne: false
            referencedRelation: "hoas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transaction_categories: {
        Row: {
          created_at: string
          hoa_id: string
          id: string
          name: string
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Insert: {
          created_at?: string
          hoa_id: string
          id?: string
          name: string
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Update: {
          created_at?: string
          hoa_id?: string
          id?: string
          name?: string
          type?: Database["public"]["Enums"]["transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "transaction_categories_hoa_id_fkey"
            columns: ["hoa_id"]
            isOneToOne: false
            referencedRelation: "hoas"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          created_by: string | null
          description: string
          hoa_id: string
          id: string
          reference_id: string | null
          reference_type: string | null
          transaction_date: string
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          hoa_id: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          transaction_date?: string
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          hoa_id?: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          transaction_date?: string
          type?: Database["public"]["Enums"]["transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "transaction_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_hoa_id_fkey"
            columns: ["hoa_id"]
            isOneToOne: false
            referencedRelation: "hoas"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_members: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean | null
          member_type: Database["public"]["Enums"]["member_type"]
          move_in_date: string | null
          move_out_date: string | null
          unit_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean | null
          member_type: Database["public"]["Enums"]["member_type"]
          move_in_date?: string | null
          move_out_date?: string | null
          unit_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean | null
          member_type?: Database["public"]["Enums"]["member_type"]
          move_in_date?: string | null
          move_out_date?: string | null
          unit_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unit_members_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          address: string | null
          bathrooms: number | null
          bedrooms: number | null
          building: string | null
          created_at: string
          floor: number | null
          hoa_id: string
          id: string
          notes: string | null
          parking_spaces: number | null
          square_feet: number | null
          status: string | null
          unit_number: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          building?: string | null
          created_at?: string
          floor?: number | null
          hoa_id: string
          id?: string
          notes?: string | null
          parking_spaces?: number | null
          square_feet?: number | null
          status?: string | null
          unit_number: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          building?: string | null
          created_at?: string
          floor?: number | null
          hoa_id?: string
          id?: string
          notes?: string | null
          parking_spaces?: number | null
          square_feet?: number | null
          status?: string | null
          unit_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_hoa_id_fkey"
            columns: ["hoa_id"]
            isOneToOne: false
            referencedRelation: "hoas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          hoa_id: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          hoa_id: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          hoa_id?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_hoa_id_fkey"
            columns: ["hoa_id"]
            isOneToOne: false
            referencedRelation: "hoas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_invoice_number: { Args: { _hoa_id: string }; Returns: string }
      get_user_hoa_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_manager: { Args: { _user_id: string }; Returns: boolean }
      user_belongs_to_unit: {
        Args: { _unit_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "board_admin" | "property_manager" | "resident"
      collection_action_type:
        | "reminder_email"
        | "phone_call"
        | "formal_notice"
        | "legal_action"
        | "payment_plan"
        | "other"
      document_category:
        | "bylaws"
        | "minutes"
        | "financials"
        | "forms"
        | "insurance"
        | "contracts"
        | "other"
      dues_frequency: "monthly" | "quarterly" | "annually"
      invoice_status:
        | "draft"
        | "pending"
        | "paid"
        | "partial"
        | "overdue"
        | "cancelled"
        | "deleted"
      member_type: "owner" | "resident"
      payment_method:
        | "check"
        | "cash"
        | "bank_transfer"
        | "credit_card"
        | "ach"
        | "other"
      transaction_type: "income" | "expense"
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
      app_role: ["board_admin", "property_manager", "resident"],
      collection_action_type: [
        "reminder_email",
        "phone_call",
        "formal_notice",
        "legal_action",
        "payment_plan",
        "other",
      ],
      document_category: [
        "bylaws",
        "minutes",
        "financials",
        "forms",
        "insurance",
        "contracts",
        "other",
      ],
      dues_frequency: ["monthly", "quarterly", "annually"],
      invoice_status: [
        "draft",
        "pending",
        "paid",
        "partial",
        "overdue",
        "cancelled",
        "deleted",
      ],
      member_type: ["owner", "resident"],
      payment_method: [
        "check",
        "cash",
        "bank_transfer",
        "credit_card",
        "ach",
        "other",
      ],
      transaction_type: ["income", "expense"],
    },
  },
} as const
