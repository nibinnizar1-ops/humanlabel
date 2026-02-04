import { useEffect, useState } from 'react';
import { supabase, Sale, Product } from '@/lib/supabase';
import { BaseWidget } from './BaseWidget';
import { ShoppingCart, TrendingUp, Package } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { startOfMonth, endOfMonth, startOfDay } from 'date-fns';

interface SalesWidgetsProps {
  widgetId: string;
}

export function SalesToday({ widgetId }: SalesWidgetsProps) {
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const today = startOfDay(new Date()).toISOString();
      const { data } = await supabase
        .from('sales')
        .select('sale_amount')
        .gte('sale_date', today);

      const total = data?.reduce((sum, s) => sum + Number(s.sale_amount), 0) || 0;
      setAmount(total);
    } catch (error) {
      console.error('Error fetching today sales:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <BaseWidget title="Today's Sales" icon={<ShoppingCart className="h-4 w-4" />}>Loading...</BaseWidget>;

  return (
    <BaseWidget title="Today's Sales" icon={<ShoppingCart className="h-4 w-4" />}>
      <p className="text-xl sm:text-2xl font-bold">{formatCurrency(amount)}</p>
      <p className="text-xs text-muted-foreground mt-1">Sales made today</p>
    </BaseWidget>
  );
}

export function SalesThisMonth({ widgetId }: SalesWidgetsProps) {
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const monthStart = startOfMonth(new Date()).toISOString();
      const monthEnd = endOfMonth(new Date()).toISOString();
      const { data } = await supabase
        .from('sales')
        .select('sale_amount')
        .gte('sale_date', monthStart)
        .lte('sale_date', monthEnd);

      const total = data?.reduce((sum, s) => sum + Number(s.sale_amount), 0) || 0;
      setAmount(total);
    } catch (error) {
      console.error('Error fetching month sales:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <BaseWidget title="This Month Sales" icon={<ShoppingCart className="h-4 w-4" />}>Loading...</BaseWidget>;

  return (
    <BaseWidget title="This Month Sales" icon={<ShoppingCart className="h-4 w-4" />}>
      <p className="text-xl sm:text-2xl font-bold">{formatCurrency(amount)}</p>
      <p className="text-xs text-muted-foreground mt-1">Sales this month</p>
    </BaseWidget>
  );
}

export function SalesTotalRevenue({ widgetId }: SalesWidgetsProps) {
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data } = await supabase
        .from('sales')
        .select('sale_amount');

      const total = data?.reduce((sum, s) => sum + Number(s.sale_amount), 0) || 0;
      setAmount(total);
    } catch (error) {
      console.error('Error fetching total revenue:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <BaseWidget title="Total Revenue" icon={<TrendingUp className="h-4 w-4" />} size="medium">Loading...</BaseWidget>;

  return (
    <BaseWidget title="Total Revenue" icon={<TrendingUp className="h-4 w-4" />} size="medium">
      <p className="text-2xl sm:text-3xl font-bold">{formatCurrency(amount)}</p>
      <p className="text-xs text-muted-foreground mt-1">Lifetime revenue from all sales</p>
    </BaseWidget>
  );
}

export function SalesTopProducts({ widgetId }: SalesWidgetsProps) {
  const [products, setProducts] = useState<Array<{ product: Product; sales: number; revenue: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: sales } = await supabase
        .from('sales')
        .select('product_id, quantity, sale_amount');

      const { data: allProducts } = await supabase
        .from('products')
        .select('*');

      if (sales && allProducts) {
        const productSales = sales.reduce((acc, sale) => {
          if (!acc[sale.product_id]) {
            acc[sale.product_id] = { sales: 0, revenue: 0 };
          }
          acc[sale.product_id].sales += sale.quantity;
          acc[sale.product_id].revenue += Number(sale.sale_amount);
          return acc;
        }, {} as Record<string, { sales: number; revenue: number }>);

        const topProducts = Object.entries(productSales)
          .map(([productId, stats]) => {
            const product = allProducts.find(p => p.id === productId);
            return product ? { product, sales: stats.sales, revenue: stats.revenue } : null;
          })
          .filter((item): item is { product: Product; sales: number; revenue: number } => item !== null)
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);

        setProducts(topProducts);
      }
    } catch (error) {
      console.error('Error fetching top products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <BaseWidget title="Top Selling Products" icon={<Package className="h-4 w-4" />} size="large">Loading...</BaseWidget>;

  return (
    <BaseWidget title="Top Selling Products" icon={<Package className="h-4 w-4" />} size="large">
      {products.length === 0 ? (
        <p className="text-sm text-muted-foreground">No sales yet</p>
      ) : (
        <div className="space-y-3">
          {products.map((item, index) => (
            <div key={item.product.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground w-4 sm:w-6 flex-shrink-0">#{index + 1}</span>
                <span className="text-xs sm:text-sm font-medium truncate">{item.product.name}</span>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs sm:text-sm font-semibold">{formatCurrency(item.revenue)}</p>
                <p className="text-xs text-muted-foreground">{item.sales} units</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </BaseWidget>
  );
}

