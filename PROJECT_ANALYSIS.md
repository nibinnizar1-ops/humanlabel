# Human Label - Project Analysis & Overview

## Project Summary
This is a **React + TypeScript + Vite** web application for managing a clothing business with integrated charity tracking. The app uses **Supabase** as the backend (PostgreSQL database) and **shadcn-ui** components with **Tailwind CSS** for the UI.

## Current Features Implemented

### 1. **Dashboard** (`/dashboard`)
- ✅ Today's Sales amount
- ✅ Total Sales (revenue)
- ✅ Total Products count
- ✅ Stock Value (calculated from cost price × inventory)
- ✅ Total Margin (total profit from all sales)
- ✅ Total Charity Generated
- ✅ Low Stock Alerts (products with size stock-outs)
- ✅ Quick action buttons

### 2. **Sales Management** (`/sales`)
- ✅ View all sales grouped by date
- ✅ Display sale details: product, customer, quantity, size, payment mode, sale mode (Online/Offline)
- ✅ Show profit and charity amount per sale
- ✅ Create new sales (`/sales/new`)

### 3. **Products Management** (`/products`)
- ✅ List all products with images, prices, categories
- ✅ Search functionality
- ✅ Size-based inventory (M, L, XL, XXL)
- ✅ Low stock indicators
- ✅ Create/Edit products (`/products/new`, `/products/:id`)
- ✅ Product categories: Shirt, T-Shirt, Hoodie, Pants, Accessory

### 4. **Stock Management**
- ✅ Size-based inventory tracking (stored in `size_inventory` JSON field)
- ✅ Stock value calculation (cost price × total units)
- ✅ Low stock alerts
- ⚠️ **ISSUE**: Inventory is NOT automatically decremented when a sale is made

### 5. **Expenses Management** (`/expenses`)
- ✅ Track expenses by category: Fabric, Stitching, Marketing, Logistics, Misc
- ✅ Monthly expense summaries
- ✅ Create new expenses (`/expenses/new`)

### 6. **Revenue Tracking**
- ✅ Total sales (revenue) displayed on dashboard
- ✅ Today's sales tracking
- ✅ Sales history with detailed breakdown

### 7. **Margin Calculation**
- ✅ Margin calculated per product: `((selling_price - cost_price) / selling_price) × 100`
- ✅ Total margin (profit) tracked across all sales
- ✅ Profit = Sale Amount - Cost Amount (after discounts)

### 8. **Charity Management** (`/charity`)
- ✅ Total charity generated
- ✅ Charity calculated as: `(profit × charity_percentage) / 100`
- ✅ Monthly charity comparison
- ✅ Top contributing products
- ✅ Charity rate (% of profit going to charity)

### 9. **Customers Management** (`/customers`)
- ✅ Customer list with total spent and charity contribution
- ✅ Search by name, mobile, or email
- ✅ Auto-create customers during sale if mobile provided

### 10. **Authentication & Authorization**
- ✅ Role-based access: Admin, Staff, Viewer
- ✅ Protected routes
- ✅ Login page

## Business Logic Flow

### Sale Creation Process:
1. Select product (from active products only)
2. Select size (checks available stock)
3. Enter quantity
4. Customer search by mobile (auto-fills if found)
5. Apply discount (flat amount or percentage)
6. Select payment mode (Cash/UPI/Card)
7. Select sale mode (Online/Offline)

### Calculations in Sale:
```
Subtotal = selling_price × quantity
Discount = (discount_percentage × subtotal) / 100 OR flat discount_amount
Final Sale Amount = Subtotal - Discount
Cost Amount = cost_price × quantity
Profit = Final Sale Amount - Cost Amount
Charity Amount = (Profit × charity_percentage) / 100
```

### Product Margin:
```
Margin % = ((selling_price - cost_price) / selling_price) × 100
```

### Stock Value:
```
Stock Value = Σ (total_units_per_product × cost_price)
```

## Database Schema (Inferred from Code)

### Tables:
1. **products**
   - id, name, category, sku, cost_price, selling_price
   - charity_percentage, size_inventory (JSON: {M, L, XL, XXL})
   - image_url, images[], is_active, created_at, updated_at

2. **sales**
   - id, customer_id, product_id, quantity, size
   - payment_mode, sale_mode, unit_price, sale_amount
   - cost_amount, profit, charity_percentage, charity_amount
   - customer_email, created_by, sale_date, created_at
   - discount_amount, discount_percentage

3. **customers**
   - id, name, mobile, email, total_spent, total_charity
   - created_at, updated_at

4. **expenses**
   - id, category, amount, expense_date, notes
   - invoice_url, created_by, created_at, updated_at

5. **inventory** (referenced but may not be actively used)
   - id, product_id, quantity_added, quantity_sold
   - available_quantity, low_stock_threshold

6. **profiles**
   - id, full_name, email, mobile, created_at, updated_at

7. **user_roles**
   - id, user_id, role (admin/staff/viewer), created_at

## Issues & Missing Features

### 🔴 Critical Issues:
1. **Inventory Not Updated on Sale**: When a sale is created, the product's `size_inventory` is NOT decremented. This means stock levels don't reflect actual sales.

### 🟡 Missing Features for Complete Dashboard:
1. **Revenue vs Expenses Comparison**: No page showing net profit (revenue - expenses)
2. **Monthly/Yearly Reports**: Limited time-based analytics
3. **Stock Movement History**: No tracking of stock additions/reductions
4. **Charity Payment Tracking**: No way to mark charity amounts as "paid" or track payment status
5. **Sales Analytics**: No charts/graphs for sales trends
6. **Product Performance**: Limited analytics on best-selling products
7. **Inventory Management**: No way to add stock (only set during product creation/edit)

### 🟢 Nice-to-Have Enhancements:
1. Export reports (CSV/PDF)
2. Sales forecasting
3. Customer loyalty tracking
4. Product recommendations
5. Multi-currency support
6. Tax calculations

## Recommendations

### Immediate Fixes Needed:
1. **Update inventory on sale**: When a sale is completed, decrement the `size_inventory[size]` by the quantity sold
2. **Add stock management**: Create functionality to add stock to existing products
3. **Revenue vs Expenses dashboard**: Add a financial overview page showing:
   - Total Revenue
   - Total Expenses
   - Net Profit (Revenue - Expenses)
   - Charity Amount to Pay
   - Remaining Profit after Charity

### Enhanced Dashboard Features:
1. **Financial Summary Card** showing:
   - Total Revenue
   - Total Expenses
   - Net Profit
   - Total Charity Generated
   - Charity Amount to Pay (based on charity percentage)
   - Net Profit After Charity

2. **Stock Management Page**:
   - Add stock to products
   - View stock history
   - Stock adjustment logs

3. **Reports Page**:
   - Monthly revenue/expense reports
   - Profit margins by product
   - Charity contribution reports

## Current Tech Stack
- **Frontend**: React 18, TypeScript, Vite
- **UI**: shadcn-ui, Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router v6
- **Forms**: React Hook Form
- **Validation**: Zod
- **Icons**: Lucide React
- **Charts**: Recharts (available but not extensively used)

## File Structure
```
src/
├── components/
│   ├── auth/          # Protected routes
│   ├── dashboard/     # StatCard component
│   ├── layout/        # AppLayout, PageHeader, MobileNav
│   ├── products/      # ProductImageUpload, SizeInventoryInput
│   └── ui/            # shadcn-ui components
├── contexts/          # AuthContext
├── hooks/            # Custom hooks
├── lib/              # Utilities, Supabase client
├── pages/            # Main application pages
└── test/             # Test files
```

## Next Steps
1. Fix inventory decrement on sale
2. Add stock management functionality
3. Create comprehensive financial dashboard
4. Add charity payment tracking
5. Implement reports and analytics

