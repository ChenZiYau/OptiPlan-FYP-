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
      chat_messages: {
        Row: {
          id: string
          user_id: string
          sender: string
          text: string
          component_type: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          sender: string
          text: string
          component_type?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          sender?: string
          text?: string
          component_type?: string
          created_at?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          category: string
          id: string
          limit_amount: number
          user_id: string
        }
        Insert: {
          category: string
          id?: string
          limit_amount?: number
          user_id: string
        }
        Update: {
          category?: string
          id?: string
          limit_amount?: number
          user_id?: string
        }
        Relationships: []
      }
      finance_settings: {
        Row: {
          id: string
          main_income: number
          monthly_budget: number
          side_income: number
          starting_balance: number
          user_id: string
        }
        Insert: {
          id?: string
          main_income?: number
          monthly_budget?: number
          side_income?: number
          starting_balance?: number
          user_id: string
        }
        Update: {
          id?: string
          main_income?: number
          monthly_budget?: number
          side_income?: number
          starting_balance?: number
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string | null
          id: string
          is_recurring: boolean
          transaction_date: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          description?: string | null
          id?: string
          is_recurring?: boolean
          transaction_date?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_recurring?: boolean
          transaction_date?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type FinanceSettings = Database['public']['Tables']['finance_settings']['Row']
export type FinanceSettingsInsert = Database['public']['Tables']['finance_settings']['Insert']
export type FinanceSettingsUpdate = Database['public']['Tables']['finance_settings']['Update']

export type Transaction = Database['public']['Tables']['transactions']['Row']
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert']
export type TransactionUpdate = Database['public']['Tables']['transactions']['Update']

export type BudgetRow = Database['public']['Tables']['budgets']['Row']
export type BudgetInsert = Database['public']['Tables']['budgets']['Insert']
export type BudgetUpdate = Database['public']['Tables']['budgets']['Update']

export type ChatMessage = Database['public']['Tables']['chat_messages']['Row']
export type ChatMessageInsert = Database['public']['Tables']['chat_messages']['Insert']
