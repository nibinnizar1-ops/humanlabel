import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for the database
export type AppRole = 'admin' | 'staff' | 'viewer';

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  mobile: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  category: 'Shirt' | 'T-Shirt' | 'Hoodie' | 'Pants' | 'Accessory';
  sku: string;
  images: string[];
  cost_price: number;
  selling_price: number;
  charity_percentage: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Inventory {
  id: string;
  product_id: string;
  quantity_added: number;
  quantity_sold: number;
  available_quantity: number;
  low_stock_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
  total_spent: number;
  total_charity: number;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  customer_id: string | null;
  product_id: string;
  quantity: number;
  payment_mode: 'Cash' | 'UPI' | 'Card';
  unit_price: number;
  sale_amount: number;
  cost_amount: number;
  profit: number;
  charity_percentage: number;
  charity_amount: number;
  created_by: string | null;
  sale_date: string;
  created_at: string;
}

export interface Expense {
  id: string;
  category: 'Fabric' | 'Stitching' | 'Marketing' | 'Logistics' | 'Misc';
  amount: number;
  expense_date: string;
  notes: string | null;
  invoice_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductWithInventory extends Product {
  inventory: Inventory | null;
}

export interface SaleWithDetails extends Sale {
  customer: Customer | null;
  product: Product | null;
}