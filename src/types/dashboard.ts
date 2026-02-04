export type WidgetType =
  // Products
  | 'products_lifetime_stock_value'
  | 'products_lifetime_stock_quantity'
  | 'products_current_inventory_value'
  | 'products_out_of_stock_alert'
  | 'products_fast_moving'
  | 'products_total_count'
  | 'products_low_stock_alert'
  
  // Sales
  | 'sales_today'
  | 'sales_this_month'
  | 'sales_total_revenue'
  | 'sales_top_products'
  | 'sales_trend'
  
  // Revenue
  | 'revenue_total'
  | 'revenue_this_month'
  | 'revenue_by_category'
  | 'revenue_trend'
  
  // Expenses
  | 'expenses_total'
  | 'expenses_this_month'
  | 'expenses_by_category'
  | 'expenses_trend'
  
  // Profit
  | 'profit_total'
  | 'profit_this_month'
  | 'profit_margin_percentage'
  | 'profit_after_charity'
  
  // Charity
  | 'charity_total_generated'
  | 'charity_to_pay'
  | 'charity_this_month'
  | 'charity_trend'
  
  // Customers
  | 'customers_total'
  | 'customers_top_spenders'
  | 'customers_new_this_month'
  
  // Financial Overview
  | 'financial_net_profit'
  | 'financial_revenue_vs_expenses';

export interface WidgetConfig {
  id: WidgetType;
  title: string;
  category: 'products' | 'sales' | 'revenue' | 'expenses' | 'profit' | 'charity' | 'customers' | 'financial';
  enabled: boolean;
  size: 'small' | 'medium' | 'large';
}

export interface DashboardConfig {
  widgets: WidgetConfig[];
}

export const DEFAULT_WIDGETS: WidgetConfig[] = [
  // Products
  { id: 'products_total_count', title: 'Total Products', category: 'products', enabled: true, size: 'small' },
  { id: 'products_lifetime_stock_value', title: 'Lifetime Stock Value', category: 'products', enabled: true, size: 'medium' },
  { id: 'products_lifetime_stock_quantity', title: 'Lifetime Stock Quantity', category: 'products', enabled: false, size: 'small' },
  { id: 'products_current_inventory_value', title: 'Current Inventory Value', category: 'products', enabled: true, size: 'medium' },
  { id: 'products_out_of_stock_alert', title: 'Out of Stock Alert', category: 'products', enabled: true, size: 'medium' },
  { id: 'products_fast_moving', title: 'Fast Moving Products', category: 'products', enabled: false, size: 'large' },
  
  // Sales
  { id: 'sales_today', title: "Today's Sales", category: 'sales', enabled: true, size: 'small' },
  { id: 'sales_this_month', title: 'This Month Sales', category: 'sales', enabled: true, size: 'small' },
  { id: 'sales_total_revenue', title: 'Total Revenue', category: 'sales', enabled: true, size: 'medium' },
  { id: 'sales_top_products', title: 'Top Selling Products', category: 'sales', enabled: false, size: 'large' },
  
  // Revenue
  { id: 'revenue_total', title: 'Total Revenue', category: 'revenue', enabled: false, size: 'medium' },
  { id: 'revenue_this_month', title: 'This Month Revenue', category: 'revenue', enabled: false, size: 'small' },
  
  // Expenses
  { id: 'expenses_total', title: 'Total Expenses', category: 'expenses', enabled: true, size: 'small' },
  { id: 'expenses_this_month', title: 'This Month Expenses', category: 'expenses', enabled: true, size: 'small' },
  { id: 'expenses_by_category', title: 'Expenses by Category', category: 'expenses', enabled: false, size: 'large' },
  
  // Profit
  { id: 'profit_total', title: 'Total Profit', category: 'profit', enabled: true, size: 'medium' },
  { id: 'profit_margin_percentage', title: 'Profit Margin %', category: 'profit', enabled: false, size: 'small' },
  { id: 'profit_after_charity', title: 'Profit After Charity', category: 'profit', enabled: false, size: 'medium' },
  
  // Charity
  { id: 'charity_total_generated', title: 'Total Charity Generated', category: 'charity', enabled: true, size: 'medium' },
  { id: 'charity_to_pay', title: 'Charity Amount to Pay', category: 'charity', enabled: false, size: 'medium' },
  { id: 'charity_this_month', title: 'This Month Charity', category: 'charity', enabled: false, size: 'small' },
  
  // Customers
  { id: 'customers_total', title: 'Total Customers', category: 'customers', enabled: false, size: 'small' },
  { id: 'customers_top_spenders', title: 'Top Customers', category: 'customers', enabled: false, size: 'large' },
  
  // Financial
  { id: 'financial_net_profit', title: 'Net Profit (Revenue - Expenses)', category: 'financial', enabled: true, size: 'large' },
  { id: 'financial_revenue_vs_expenses', title: 'Revenue vs Expenses', category: 'financial', enabled: false, size: 'large' },
];

