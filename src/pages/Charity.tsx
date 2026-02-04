import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/dashboard/StatCard';
import { Heart, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

interface CharityStats {
  totalRevenue: number;
  totalProfit: number;
  totalCharity: number;
  thisMonthCharity: number;
  lastMonthCharity: number;
  topProducts: Array<{
    name: string;
    charity: number;
  }>;
}

export default function Charity() {
  const [stats, setStats] = useState<CharityStats>({
    totalRevenue: 0,
    totalProfit: 0,
    totalCharity: 0,
    thisMonthCharity: 0,
    lastMonthCharity: 0,
    topProducts: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCharityStats();
  }, []);

  const fetchCharityStats = async () => {
    try {
      const now = new Date();
      const thisMonthStart = startOfMonth(now).toISOString();
      const thisMonthEnd = endOfMonth(now).toISOString();
      const lastMonthStart = startOfMonth(subMonths(now, 1)).toISOString();
      const lastMonthEnd = endOfMonth(subMonths(now, 1)).toISOString();

      // Fetch all sales
      const { data: allSales } = await supabase
        .from('sales')
        .select('sale_amount, profit, charity_amount, product_id, products(name)');

      // Fetch this month's sales
      const { data: thisMonthSales } = await supabase
        .from('sales')
        .select('charity_amount')
        .gte('sale_date', thisMonthStart)
        .lte('sale_date', thisMonthEnd);

      // Fetch last month's sales
      const { data: lastMonthSales } = await supabase
        .from('sales')
        .select('charity_amount')
        .gte('sale_date', lastMonthStart)
        .lte('sale_date', lastMonthEnd);

      const totalRevenue = allSales?.reduce((sum, s) => sum + Number(s.sale_amount), 0) || 0;
      const totalProfit = allSales?.reduce((sum, s) => sum + Number(s.profit), 0) || 0;
      const totalCharity = allSales?.reduce((sum, s) => sum + Number(s.charity_amount), 0) || 0;
      const thisMonthCharity = thisMonthSales?.reduce((sum, s) => sum + Number(s.charity_amount), 0) || 0;
      const lastMonthCharity = lastMonthSales?.reduce((sum, s) => sum + Number(s.charity_amount), 0) || 0;

      // Calculate top products by charity
      const productCharity = allSales?.reduce((acc, sale) => {
        const productName = (sale.products as any)?.name || 'Unknown';
        acc[productName] = (acc[productName] || 0) + Number(sale.charity_amount);
        return acc;
      }, {} as Record<string, number>) || {};

      const topProducts = Object.entries(productCharity)
        .map(([name, charity]) => ({ name, charity }))
        .sort((a, b) => b.charity - a.charity)
        .slice(0, 5);

      setStats({
        totalRevenue,
        totalProfit,
        totalCharity,
        thisMonthCharity,
        lastMonthCharity,
        topProducts,
      });
    } catch (error) {
      console.error('Error fetching charity stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const charityPercentage = stats.totalProfit > 0 
    ? ((stats.totalCharity / stats.totalProfit) * 100).toFixed(1) 
    : '0';

  const monthGrowth = stats.lastMonthCharity > 0
    ? (((stats.thisMonthCharity - stats.lastMonthCharity) / stats.lastMonthCharity) * 100).toFixed(0)
    : '0';

  if (loading) {
    return (
      <AppLayout>
        <PageHeader title="Charity Impact" />
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          Loading...
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader title="Charity Impact" />

      <div className="p-4 space-y-6">
        {/* Hero Card */}
        <div className="rounded-2xl gradient-charity p-6 text-center space-y-2">
          <Heart className="h-12 w-12 mx-auto text-white/90" />
          <p className="text-white/80 text-sm">Total Charity Generated</p>
          <p className="text-4xl font-bold text-white">{formatCurrency(stats.totalCharity)}</p>
          <p className="text-white/70 text-sm">
            Making a difference, one sale at a time
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            icon={<DollarSign className="h-5 w-5" />}
          />
          <StatCard
            label="Total Profit"
            value={formatCurrency(stats.totalProfit)}
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <StatCard
            label="Charity Rate"
            value={`${charityPercentage}%`}
            icon={<Heart className="h-5 w-5" />}
          />
          <StatCard
            label="This Month"
            value={formatCurrency(stats.thisMonthCharity)}
            icon={<Calendar className="h-5 w-5" />}
            trend={{
              value: parseInt(monthGrowth),
              isPositive: parseInt(monthGrowth) >= 0,
            }}
          />
        </div>

        {/* Month Comparison */}
        <div className="stat-card space-y-4">
          <h3 className="font-semibold">Monthly Comparison</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{format(new Date(), 'MMMM yyyy')}</span>
              <span className="font-semibold text-success">{formatCurrency(stats.thisMonthCharity)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{format(subMonths(new Date(), 1), 'MMMM yyyy')}</span>
              <span className="font-semibold">{formatCurrency(stats.lastMonthCharity)}</span>
            </div>
          </div>
        </div>

        {/* Top Contributing Products */}
        {stats.topProducts.length > 0 && (
          <div className="stat-card space-y-4">
            <h3 className="font-semibold">Top Contributing Products</h3>
            <div className="space-y-3">
              {stats.topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground w-5">
                      #{index + 1}
                    </span>
                    <span className="text-sm truncate max-w-[180px]">{product.name}</span>
                  </div>
                  <span className="font-medium text-success">{formatCurrency(product.charity)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Impact Message */}
        <div className="text-center py-4 space-y-2">
          <p className="text-sm text-muted-foreground">
            Every purchase at Human Label contributes to making the world a better place.
          </p>
          <p className="text-xs text-muted-foreground">
            Charity is calculated on profit, not revenue.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}