import { createClient } from '@supabase/supabase-js';

/**
 * In Lovable/Vite, `import.meta.env.VITE_*` values are injected at build time.
 * If the preview was built before secrets were added, those can be undefined and
 * crash the app. We use a fallback so the UI still loads, while keeping env vars
 * as the primary source.
 */
const FALLBACK_SUPABASE_URL = 'https://xxntakevupxatojdxzff.supabase.co';
// Anon keys are public by design, safe to ship in the client.
const FALLBACK_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4bnRha2V2dXB4YXRvamR4emZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxODE5NDUsImV4cCI6MjA4NTc1Nzk0NX0.jIGLJ0kjj8pb5SEQyXVRB_qiM_eAtYiRStWTcorQjCY';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  // eslint-disable-next-line no-console
  console.warn(
    '[Supabase] Missing VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY in build; using fallback. '
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for the database
export type AppRole = 'admin' | 'staff' | 'viewer';
export type Size = 'M' | 'L' | 'XL' | 'XXL';
export type SaleMode = 'Online' | 'Offline';

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

export interface SizeInventory {
  M: number;
  L: number;
  XL: number;
  XXL: number;
}

export interface Product {
  id: string;
  name: string;
  category: 'Shirt' | 'T-Shirt' | 'Hoodie' | 'Pants' | 'Accessory';
  sku: string;
  image_url: string | null;
  images: string[];
  cost_price: number;
  selling_price: number;
  charity_percentage: number;
  is_active: boolean;
  size_inventory: SizeInventory;
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
  size: Size | null;
  payment_mode: 'Cash' | 'UPI' | 'Card';
  sale_mode: SaleMode;
  unit_price: number;
  sale_amount: number;
  cost_amount: number;
  profit: number;
  charity_percentage: number;
  charity_amount: number;
  customer_email: string | null;
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
