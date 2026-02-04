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
  Receipt
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface DashboardStats {
  todaySales: number;
  monthlyRevenue: number;
  totalInventory: number;
  totalCharity: number;
  lowStockCount: number;
}

export default function Dashboard() {
  const { profile, role, canEdit } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0,
    monthlyRevenue: 0,
    totalInventory: 0,
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
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

      // Fetch today's sales
      const { data: todaySalesData } = await supabase
        .from('sales')
        .select('sale_amount')
        .gte('sale_date', startOfDay);

      // Fetch monthly revenue
      const { data: monthlyData } = await supabase
        .from('sales')
        .select('sale_amount')
        .gte('sale_date', startOfMonth);

      // Fetch inventory
      const { data: inventoryData } = await supabase
        .from('inventory')
        .select('available_quantity, low_stock_threshold');

      // Fetch total charity
      const { data: charityData } = await supabase
        .from('sales')
        .select('charity_amount');

      const todaySales = todaySalesData?.reduce((sum, s) => sum + Number(s.sale_amount), 0) || 0;
      const monthlyRevenue = monthlyData?.reduce((sum, s) => sum + Number(s.sale_amount), 0) || 0;
      const totalInventory = inventoryData?.reduce((sum, i) => sum + (i.available_quantity || 0), 0) || 0;
      const totalCharity = charityData?.reduce((sum, s) => sum + Number(s.charity_amount), 0) || 0;
      const lowStockCount = inventoryData?.filter(i => 
        (i.available_quantity || 0) <= (i.low_stock_threshold || 5)
      ).length || 0;

      setStats({
        todaySales,
        monthlyRevenue,
        totalInventory,
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
    { icon: ShoppingCart, label: 'New Sale', path: '/sales/new', color: 'text-accent' },
    { icon: Package, label: 'Add Product', path: '/products/new', color: 'text-primary', adminOnly: true },
    { icon: Users, label: 'Customers', path: '/customers', color: 'text-profit' },
    { icon: Receipt, label: 'Add Expense', path: '/expenses/new', color: 'text-warning', staffOnly: true },
  ];

  const filteredActions = quickActions.filter(action => {
    if (action.adminOnly && role !== 'admin') return false;
    if (action.staffOnly && role === 'viewer') return false;
    return true;
  });

  return (
    <AppLayout>
      <PageHeader title="Dashboard" />
      
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

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Today's Sales"
            value={formatCurrency(stats.todaySales)}
            icon={<ShoppingCart className="h-5 w-5" />}
            variant="sales"
          />
          <StatCard
            label="Monthly Revenue"
            value={formatCurrency(stats.monthlyRevenue)}
            icon={<TrendingUp className="h-5 w-5" />}
            variant="profit"
          />
          <StatCard
            label="Available Stock"
            value={stats.totalInventory.toLocaleString()}
            icon={<Package className="h-5 w-5" />}
          />
          <StatCard
            label="Charity Generated"
            value={formatCurrency(stats.totalCharity)}
            icon={<Heart className="h-5 w-5" />}
            variant="charity"
          />
        </div>

        {/* Low Stock Alert */}
        {stats.lowStockCount > 0 && (
          <Link to="/products?filter=low-stock">
            <div className="stat-card bg-warning/10 border-warning/30 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/20">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="font-medium text-warning">Low Stock Alert</p>
                <p className="text-sm text-muted-foreground">
                  {stats.lowStockCount} product{stats.lowStockCount > 1 ? 's' : ''} running low
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
            <Button className="w-full h-14 text-base bg-accent hover:bg-accent/90">
              <Plus className="mr-2 h-5 w-5" />
              Record New Sale
            </Button>
          </Link>
        )}
      </div>
    </AppLayout>
  );
}