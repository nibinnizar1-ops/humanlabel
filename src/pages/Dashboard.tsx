import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/dashboard/StatCard';
import { Button } from '@/components/ui/button';
import { 
  ShoppingCart, 
  TrendingUp, 
  Package, 
  Heart,
  AlertTriangle,
  Plus,
  Users,
  Receipt,
  IndianRupee,
  Boxes
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface DashboardStats {
  todaySales: number;
  totalSales: number;
  totalProducts: number;
  totalStockValue: number;
  totalMargin: number;
  totalCharity: number;
  lowStockCount: number;
}

export default function Dashboard() {
  const { profile, role, canEdit } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0,
    totalSales: 0,
    totalProducts: 0,
    totalStockValue: 0,
    totalMargin: 0,
    totalCharity: 0,
    lowStockCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();

      // Fetch all sales
      const { data: salesData } = await supabase
        .from('sales')
        .select('sale_amount, profit, charity_amount, sale_date');

      // Fetch products with size inventory
      const { data: productsData } = await supabase
        .from('products')
        .select('id, cost_price, selling_price, size_inventory, is_active');

      // Calculate stats from sales
      const todaySales = salesData?.filter(s => s.sale_date >= startOfDay)
        .reduce((sum, s) => sum + Number(s.sale_amount), 0) || 0;
      const totalSales = salesData?.reduce((sum, s) => sum + Number(s.sale_amount), 0) || 0;
      const totalMargin = salesData?.reduce((sum, s) => sum + Number(s.profit), 0) || 0;
      const totalCharity = salesData?.reduce((sum, s) => sum + Number(s.charity_amount), 0) || 0;

      // Calculate product stats
      const totalProducts = productsData?.length || 0;
      
      let totalStockValue = 0;
      let lowStockCount = 0;
      
      productsData?.forEach(product => {
        const sizeInventory = product.size_inventory || { M: 0, L: 0, XL: 0, XXL: 0 };
        const totalUnits = Object.values(sizeInventory as Record<string, number>)
          .reduce((sum: number, qty: number) => sum + (qty || 0), 0);
        
        // Stock value = total units × cost price
        totalStockValue += totalUnits * product.cost_price;
        
        // Check for low stock (any size with 0 units on active products)
        if (product.is_active) {
          const hasStockOut = Object.values(sizeInventory as Record<string, number>)
            .some((qty: number) => qty === 0);
          if (hasStockOut) lowStockCount++;
        }
      });

      setStats({
        todaySales,
        totalSales,
        totalProducts,
        totalStockValue,
        totalMargin,
        totalCharity,
        lowStockCount,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const quickActions = [
    { icon: ShoppingCart, label: 'New Sale', path: '/sales/new', color: 'text-foreground' },
    { icon: Package, label: 'Add Product', path: '/products/new', color: 'text-foreground', adminOnly: true },
    { icon: Users, label: 'Customers', path: '/customers', color: 'text-foreground' },
    { icon: Receipt, label: 'Add Expense', path: '/expenses/new', color: 'text-foreground', staffOnly: true },
  ];

  const filteredActions = quickActions.filter(action => {
    if (action.adminOnly && role !== 'admin') return false;
    if (action.staffOnly && role === 'viewer') return false;
    return true;
  });

  return (
    <AppLayout>
      <PageHeader title="Dashboard" showLogo />
      
      <div className="p-4 space-y-6">
        {/* Welcome Section */}
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'there'}!
          </h2>
          <p className="text-sm text-muted-foreground">
            Here's what's happening with Human Label today.
          </p>
        </div>

        {/* Primary Stats Row */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Today's Sales"
            value={formatCurrency(stats.todaySales)}
            icon={<ShoppingCart className="h-5 w-5" />}
            variant="sales"
          />
          <StatCard
            label="Total Sales"
            value={formatCurrency(stats.totalSales)}
            icon={<IndianRupee className="h-5 w-5" />}
            variant="profit"
          />
        </div>

        {/* Secondary Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="Products"
            value={stats.totalProducts.toString()}
            icon={<Package className="h-5 w-5" />}
          />
          <StatCard
            label="Stock Value"
            value={formatCurrency(stats.totalStockValue)}
            icon={<Boxes className="h-5 w-5" />}
          />
          <StatCard
            label="Total Margin"
            value={formatCurrency(stats.totalMargin)}
            icon={<TrendingUp className="h-5 w-5" />}
            variant="profit"
          />
        </div>

        {/* Charity Stats */}
        <StatCard
          label="Charity Generated"
          value={formatCurrency(stats.totalCharity)}
          icon={<Heart className="h-5 w-5" />}
          variant="charity"
        />

        {/* Low Stock Alert */}
        {stats.lowStockCount > 0 && (
          <Link to="/products">
            <div className="stat-card bg-warning/10 border-warning/30 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/20">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="font-medium text-warning">Low Stock Alert</p>
                <p className="text-sm text-muted-foreground">
                  {stats.lowStockCount} product{stats.lowStockCount > 1 ? 's' : ''} have size stock-outs
                </p>
              </div>
            </div>
          </Link>
        )}

        {/* Quick Actions */}
        {canEdit && (
          <div className="space-y-3">
            <h3 className="font-semibold">Quick Actions</h3>
            <div className="grid grid-cols-4 gap-2">
              {filteredActions.map((action) => (
                <Link key={action.path} to={action.path}>
                  <div className="quick-action">
                    <action.icon className={cn("h-6 w-6", action.color)} />
                    <span className="text-xs font-medium text-center leading-tight">
                      {action.label}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Primary Action for Staff */}
        {canEdit && (
          <Link to="/sales/new" className="block">
            <Button className="w-full h-14 text-base">
              <Plus className="mr-2 h-5 w-5" />
              Record New Sale
            </Button>
          </Link>
        )}
      </div>
    </AppLayout>
  );
}
