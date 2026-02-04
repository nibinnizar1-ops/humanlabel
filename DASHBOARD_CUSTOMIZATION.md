# Dashboard Customization Feature

## Overview
The dashboard now supports full customization where users can choose which widgets to display. All preferences are saved to localStorage and persist across sessions.

## Available Widgets

### Products Category
1. **Total Products** - Count of all products in catalog
2. **Lifetime Stock Value** - Total value of all stock ever purchased (cost price × units)
3. **Current Inventory Value** - Value of active products currently in stock
4. **Out of Stock Alert** - Products with all sizes at 0 stock
5. **Low Stock Alert** - Products with any size at 0 stock
6. **Fast Moving Products** - Top 5 products by sales in last 30 days

### Sales Category
1. **Today's Sales** - Total sales amount for today
2. **This Month Sales** - Total sales amount for current month
3. **Total Revenue** - Lifetime revenue from all sales
4. **Top Selling Products** - Top 5 products by revenue

### Revenue Category
1. **Total Revenue** - Same as Sales Total Revenue
2. **This Month Revenue** - Same as Sales This Month

### Expenses Category
1. **Total Expenses** - Total expenses recorded
2. **This Month Expenses** - Expenses for current month
3. **Expenses by Category** - Breakdown by category (Fabric, Stitching, Marketing, Logistics, Misc)

### Profit Category
1. **Total Profit** - Total profit from all sales
2. **Profit Margin %** - Average profit margin percentage
3. **Profit After Charity** - Profit remaining after charity deduction

### Charity Category
1. **Total Charity Generated** - Total charity from all sales
2. **Charity Amount to Pay** - Total charity to be paid (currently same as generated)
3. **This Month Charity** - Charity generated this month

### Customers Category
1. **Total Customers** - Count of registered customers
2. **Top Customers** - Top 5 customers by total spent
3. **New Customers This Month** - Count of new customers this month

### Financial Overview Category
1. **Net Profit (Revenue - Expenses)** - Shows revenue, expenses, and net profit
2. **Revenue vs Expenses** - Comparison with expense ratio visualization

## How to Use

1. **Access Customization**: Click the "Customize Dashboard" button in the dashboard header
2. **Select Widgets**: Check/uncheck widgets you want to show/hide
3. **Widget Sizes**: 
   - Small: 1 column
   - Medium: 2 columns
   - Large: 3 columns
4. **Save**: Changes are automatically saved to localStorage
5. **Reset**: Use "Reset to Defaults" to restore default widget selection

## Default Widgets Enabled

By default, the following widgets are enabled:
- Today's Sales
- Total Revenue
- Total Products
- Current Inventory Value
- Out of Stock Alert
- Total Expenses
- This Month Expenses
- Total Profit
- Total Charity Generated
- Net Profit (Revenue - Expenses)

## Technical Implementation

### Files Created
- `src/types/dashboard.ts` - Widget type definitions
- `src/hooks/useDashboardConfig.ts` - Dashboard configuration hook with localStorage
- `src/components/dashboard/widgets/BaseWidget.tsx` - Base widget component
- `src/components/dashboard/widgets/ProductWidgets.tsx` - Product-related widgets
- `src/components/dashboard/widgets/SalesWidgets.tsx` - Sales-related widgets
- `src/components/dashboard/widgets/FinancialWidgets.tsx` - Financial overview widgets
- `src/components/dashboard/widgets/ProfitWidgets.tsx` - Profit-related widgets
- `src/components/dashboard/widgets/CharityWidgets.tsx` - Charity-related widgets
- `src/components/dashboard/widgets/ExpenseWidgets.tsx` - Expense-related widgets
- `src/components/dashboard/widgets/CustomerWidgets.tsx` - Customer-related widgets
- `src/components/dashboard/widgets/WidgetRenderer.tsx` - Widget renderer component
- `src/components/dashboard/DashboardCustomizer.tsx` - Customization dialog

### Files Modified
- `src/pages/Dashboard.tsx` - Updated to use customizable widgets
- `src/lib/utils.ts` - Added formatCurrency utility function

## Data Fetching

Each widget independently fetches its data from Supabase:
- Products widgets query the `products` table
- Sales widgets query the `sales` table
- Expense widgets query the `expenses` table
- Customer widgets query the `customers` table
- Financial widgets combine data from multiple tables

## Future Enhancements

Potential improvements:
1. Drag-and-drop widget reordering
2. Widget refresh intervals
3. Date range filters
4. Export widget data
5. Widget-specific settings
6. Charity payment tracking (mark as paid)
7. More detailed analytics widgets
8. Charts and graphs for trends

