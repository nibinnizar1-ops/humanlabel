import { WidgetType } from '@/types/dashboard';

// Product Widgets
import {
  ProductsLifetimeStockValue,
  ProductsCurrentInventoryValue,
  ProductsOutOfStockAlert,
  ProductsFastMoving,
  ProductsTotalCount,
  ProductsLowStockAlert,
} from './ProductWidgets';

// Sales Widgets
import {
  SalesToday,
  SalesThisMonth,
  SalesTotalRevenue,
  SalesTopProducts,
} from './SalesWidgets';

// Financial Widgets
import {
  FinancialNetProfit,
  FinancialRevenueVsExpenses,
} from './FinancialWidgets';

// Profit Widgets
import {
  ProfitTotal,
  ProfitMarginPercentage,
  ProfitAfterCharity,
} from './ProfitWidgets';

// Charity Widgets
import {
  CharityTotalGenerated,
  CharityToPay,
  CharityThisMonth,
} from './CharityWidgets';

// Expense Widgets
import {
  ExpensesTotal,
  ExpensesThisMonth,
  ExpensesByCategory,
} from './ExpenseWidgets';

// Customer Widgets
import {
  CustomersTotal,
  CustomersTopSpenders,
  CustomersNewThisMonth,
} from './CustomerWidgets';

interface WidgetRendererProps {
  widgetId: WidgetType;
}

const widgetComponents: Record<WidgetType, React.ComponentType<{ widgetId: string }>> = {
  // Products
  products_lifetime_stock_value: ProductsLifetimeStockValue,
  products_current_inventory_value: ProductsCurrentInventoryValue,
  products_out_of_stock_alert: ProductsOutOfStockAlert,
  products_fast_moving: ProductsFastMoving,
  products_total_count: ProductsTotalCount,
  products_low_stock_alert: ProductsLowStockAlert,
  
  // Sales
  sales_today: SalesToday,
  sales_this_month: SalesThisMonth,
  sales_total_revenue: SalesTotalRevenue,
  sales_top_products: SalesTopProducts,
  sales_trend: SalesToday, // Placeholder
  
  // Revenue
  revenue_total: SalesTotalRevenue,
  revenue_this_month: SalesThisMonth,
  revenue_by_category: SalesTopProducts, // Placeholder
  revenue_trend: SalesToday, // Placeholder
  
  // Expenses
  expenses_total: ExpensesTotal,
  expenses_this_month: ExpensesThisMonth,
  expenses_by_category: ExpensesByCategory,
  expenses_trend: ExpensesThisMonth, // Placeholder
  
  // Profit
  profit_total: ProfitTotal,
  profit_this_month: ProfitTotal, // Placeholder
  profit_margin_percentage: ProfitMarginPercentage,
  profit_after_charity: ProfitAfterCharity,
  
  // Charity
  charity_total_generated: CharityTotalGenerated,
  charity_to_pay: CharityToPay,
  charity_this_month: CharityThisMonth,
  charity_trend: CharityThisMonth, // Placeholder
  
  // Customers
  customers_total: CustomersTotal,
  customers_top_spenders: CustomersTopSpenders,
  customers_new_this_month: CustomersNewThisMonth,
  
  // Financial
  financial_net_profit: FinancialNetProfit,
  financial_revenue_vs_expenses: FinancialRevenueVsExpenses,
};

export function WidgetRenderer({ widgetId }: WidgetRendererProps) {
  const WidgetComponent = widgetComponents[widgetId];
  
  if (!WidgetComponent) {
    return (
      <div className="stat-card">
        <p className="text-sm text-muted-foreground">Widget not found: {widgetId}</p>
      </div>
    );
  }
  
  return <WidgetComponent widgetId={widgetId} />;
}

