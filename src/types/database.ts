// Database types for Supabase
// This file defines the schema types for type-safe database operations

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      accounts: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'checking' | 'savings' | 'credit' | 'cash' | 'investment'
          balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'checking' | 'savings' | 'credit' | 'cash' | 'investment'
          balance: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'checking' | 'savings' | 'credit' | 'cash' | 'investment'
          balance?: number
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          account_id: string | null
          type: 'income' | 'expense' | 'transfer'
          description: string
          amount: number
          category: string
          date: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_id?: string | null
          type: 'income' | 'expense' | 'transfer'
          description: string
          amount: number
          category: string
          date: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string | null
          type?: 'income' | 'expense' | 'transfer'
          description?: string
          amount?: number
          category?: string
          date?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      debts: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'mortgage' | 'auto' | 'student' | 'personal' | 'credit_card' | 'medical' | 'other'
          original_balance: number
          current_balance: number
          interest_rate: number
          minimum_payment: number
          remaining_months: number
          start_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'mortgage' | 'auto' | 'student' | 'personal' | 'credit_card' | 'medical' | 'other'
          original_balance: number
          current_balance: number
          interest_rate: number
          minimum_payment: number
          remaining_months: number
          start_date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'mortgage' | 'auto' | 'student' | 'personal' | 'credit_card' | 'medical' | 'other'
          original_balance?: number
          current_balance?: number
          interest_rate?: number
          minimum_payment?: number
          remaining_months?: number
          start_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      recurring_transactions: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'income' | 'expense' | 'transfer'
          amount: number
          category: string
          frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually'
          start_date: string
          next_date: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'income' | 'expense' | 'transfer'
          amount: number
          category: string
          frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually'
          start_date: string
          next_date: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'income' | 'expense' | 'transfer'
          amount?: number
          category?: string
          frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually'
          start_date?: string
          next_date?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      sync_queue: {
        Row: {
          id: string
          user_id: string
          table_name: string
          operation: 'insert' | 'update' | 'delete'
          record_id: string
          data: Json
          created_at: string
          synced_at: string | null
          status: 'pending' | 'synced' | 'failed'
          error: string | null
        }
        Insert: {
          id?: string
          user_id: string
          table_name: string
          operation: 'insert' | 'update' | 'delete'
          record_id: string
          data: Json
          created_at?: string
          synced_at?: string | null
          status?: 'pending' | 'synced' | 'failed'
          error?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          table_name?: string
          operation?: 'insert' | 'update' | 'delete'
          record_id?: string
          data?: Json
          created_at?: string
          synced_at?: string | null
          status?: 'pending' | 'synced' | 'failed'
          error?: string | null
        }
      }
    }
  }
}
