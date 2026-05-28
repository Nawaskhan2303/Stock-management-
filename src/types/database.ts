export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      branches: {
        Row: {
          branch_id: string;
          name: string;
          branch_name: string;
          branch_code: string;
          address: string;
          phone: string;
          is_active: boolean;
        };
        Insert: {
          branch_id?: string;
          name: string;
          branch_name?: string;
          branch_code?: string;
          address?: string;
          phone?: string;
          is_active?: boolean;
        };
        Update: {
          branch_id?: string;
          name?: string;
          branch_name?: string;
          branch_code?: string;
          address?: string;
          phone?: string;
          is_active?: boolean;
        };
      };
      profiles: {
        Row: {
          id: string;
          full_name: string;
          role: 'admin' | 'manager' | 'staff';
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          role?: 'admin' | 'manager' | 'staff';
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          role?: 'admin' | 'manager' | 'staff';
          created_at?: string;
        };
      };
      branch_users: {
        Row: {
          id: string;
          user_id: string;
          branch_id: string;
          role: 'manager' | 'staff';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          branch_id: string;
          role?: 'manager' | 'staff';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          branch_id?: string;
          role?: 'manager' | 'staff';
          created_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          created_at?: string;
        };
      };
      stock_items: {
        Row: {
          id: string;
          branch_id: string;
          category_id: string | null;
          name: string;
          description: string;
          unit: string;
          current_quantity: number;
          minimum_quantity: number;
          unit_cost: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          category_id?: string | null;
          name: string;
          description?: string;
          unit?: string;
          current_quantity?: number;
          minimum_quantity?: number;
          unit_cost?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          branch_id?: string;
          category_id?: string | null;
          name?: string;
          description?: string;
          unit?: string;
          current_quantity?: number;
          minimum_quantity?: number;
          unit_cost?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      stock_transactions: {
        Row: {
          id: string;
          stock_item_id: string;
          branch_id: string;
          user_id: string;
          transaction_type: 'purchase' | 'usage' | 'adjustment' | 'transfer';
          quantity_change: number;
          previous_quantity: number;
          new_quantity: number;
          notes: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          stock_item_id: string;
          branch_id: string;
          user_id: string;
          transaction_type: 'purchase' | 'usage' | 'adjustment' | 'transfer';
          quantity_change: number;
          previous_quantity: number;
          new_quantity: number;
          notes?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          stock_item_id?: string;
          branch_id?: string;
          user_id?: string;
          transaction_type?: 'purchase' | 'usage' | 'adjustment' | 'transfer';
          quantity_change?: number;
          previous_quantity?: number;
          new_quantity?: number;
          notes?: string;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export type Branch = Database['public']['Tables']['branches']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type BranchUser = Database['public']['Tables']['branch_users']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type StockItem = Database['public']['Tables']['stock_items']['Row'];
export type StockTransaction = Database['public']['Tables']['stock_transactions']['Row'];

export type UserRole = 'admin' | 'manager' | 'staff';
export type TransactionType = 'purchase' | 'usage' | 'adjustment' | 'transfer';

export interface StockItemWithCategory extends StockItem {
  categories: Category | null;
}

export interface StockTransactionWithDetails extends StockTransaction {
  stock_items: { name: string; unit: string };
  profiles: { full_name: string };
  branches: { name: string };
}
