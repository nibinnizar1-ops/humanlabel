import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, Product, Sale } from '@/lib/supabase';
import { BaseWidget } from './BaseWidget';
import { StatCard } from '@/components/dashboard/StatCard';
import { Package, AlertTriangle, TrendingUp, Boxes } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface ProductWidgetsProps {
  widgetId: string;
}

export function ProductsLifetimeStockValue({ widgetId }: ProductWidgetsProps) {
  const [value, setValue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: products } = await supabase
        .from('products')
        .select('cost_price, size_inventory');

      if (products) {
        const totalValue = products.reduce((sum, product) => {
          const inventory = product.size_inventory || { M: 0, L: 0, XL: 0, XXL: 0 };
          const totalUnits = Object.values(inventory).reduce((s: number, q: number) => s + (q || 0), 0);
          return sum + (totalUnits * product.cost_price);
        }, 0);
        setValue(totalValue);
      }
    } catch (error) {
      console.error('Error fetching lifetime stock value:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <BaseWidget title="Lifetime Stock Value" icon={<Boxes className="h-4 w-4" />}>Loading...</BaseWidget>;

  return (
    <BaseWidget title="Lifetime Stock Value" icon={<Boxes className="h-4 w-4" />}>
      <p className="text-xl sm:text-2xl font-bold">{formatCurrency(value)}</p>
      <p className="text-xs text-muted-foreground mt-1">Total value of all stock ever purchased</p>
    </BaseWidget>
  );
}

export function ProductsCurrentInventoryValue({ widgetId }: ProductWidgetsProps) {
  const [value, setValue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: products } = await supabase
        .from('products')
        .select('cost_price, size_inventory, is_active');

      if (products) {
        const totalValue = products
          .filter(p => p.is_active)
          .reduce((sum, product) => {
            const inventory = product.size_inventory || { M: 0, L: 0, XL: 0, XXL: 0 };
            const totalUnits = Object.values(inventory).reduce((s: number, q: number) => s + (q || 0), 0);
            return sum + (totalUnits * product.cost_price);
          }, 0);
        setValue(totalValue);
      }
    } catch (error) {
      console.error('Error fetching current inventory value:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <BaseWidget title="Current Inventory Value" icon={<Boxes className="h-4 w-4" />}>Loading...</BaseWidget>;

  return (
    <BaseWidget title="Current Inventory Value" icon={<Boxes className="h-4 w-4" />}>
      <p className="text-xl sm:text-2xl font-bold">{formatCurrency(value)}</p>
      <p className="text-xs text-muted-foreground mt-1">Value of active products in stock</p>
    </BaseWidget>
  );
}

export function ProductsOutOfStockAlert({ widgetId }: ProductWidgetsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true);

      if (data) {
        const outOfStock = data.filter(product => {
          const inventory = product.size_inventory || { M: 0, L: 0, XL: 0, XXL: 0 };
          return Object.values(inventory).every(qty => qty === 0);
        });
        setProducts(outOfStock);
      }
    } catch (error) {
      console.error('Error fetching out of stock products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <BaseWidget title="Out of Stock Alert" icon={<AlertTriangle className="h-4 w-4" />}>Loading...</BaseWidget>;

  return (
    <BaseWidget title="Out of Stock Alert" icon={<AlertTriangle className="h-4 w-4 text-warning" />}>
      {products.length === 0 ? (
        <div className="space-y-1">
          <p className="text-base sm:text-lg font-semibold text-success">All products in stock</p>
          <p className="text-xs text-muted-foreground">No out of stock items</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-base sm:text-lg font-semibold text-warning">{products.length} product{products.length > 1 ? 's' : ''} out of stock</p>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {products.slice(0, 5).map(product => (
              <Link key={product.id} to={`/products/${product.id}`} className="block text-sm hover:underline">
                {product.name}
              </Link>
            ))}
          </div>
          {products.length > 5 && (
            <Link to="/products" className="text-xs text-muted-foreground hover:underline">
              View all {products.length} products
            </Link>
          )}
        </div>
      )}
    </BaseWidget>
  );
}

export function ProductsFastMoving({ widgetId }: ProductWidgetsProps) {
  const [products, setProducts] = useState<Array<{ product: Product; sales: number; revenue: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Get sales from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: sales } = await supabase
        .from('sales')
        .select('product_id, quantity, sale_amount')
        .gte('sale_date', thirtyDaysAgo.toISOString());

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

        const fastMoving = Object.entries(productSales)
          .map(([productId, stats]) => {
            const product = allProducts.find(p => p.id === productId);
            return product ? { product, sales: stats.sales, revenue: stats.revenue } : null;
          })
          .filter((item): item is { product: Product; sales: number; revenue: number } => item !== null)
          .sort((a, b) => b.sales - a.sales)
          .slice(0, 5);

        setProducts(fastMoving);
      }
    } catch (error) {
      console.error('Error fetching fast moving products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <BaseWidget title="Fast Moving Products" icon={<TrendingUp className="h-4 w-4" />} size="large">Loading...</BaseWidget>;

  return (
    <BaseWidget title="Fast Moving Products (Last 30 Days)" icon={<TrendingUp className="h-4 w-4" />} size="large">
      {products.length === 0 ? (
        <p className="text-sm text-muted-foreground">No sales in the last 30 days</p>
      ) : (
        <div className="space-y-3">
          {products.map((item, index) => (
            <div key={item.product.id} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                <span className="text-xs font-medium text-muted-foreground w-4 sm:w-6 flex-shrink-0">#{index + 1}</span>
                <span className="text-xs sm:text-sm font-medium truncate">{item.product.name}</span>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs sm:text-sm font-semibold">{item.sales} units</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(item.revenue)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </BaseWidget>
  );
}

export function ProductsTotalCount({ widgetId }: ProductWidgetsProps) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });
      setCount(count || 0);
    } catch (error) {
      console.error('Error fetching product count:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <BaseWidget title="Total Products" icon={<Package className="h-4 w-4" />}>Loading...</BaseWidget>;

  return (
    <BaseWidget title="Total Products" icon={<Package className="h-4 w-4" />}>
      <p className="text-xl sm:text-2xl font-bold">{count}</p>
      <p className="text-xs text-muted-foreground mt-1">Total products in catalog</p>
    </BaseWidget>
  );
}

export function ProductsLowStockAlert({ widgetId }: ProductWidgetsProps) {
  const [count, setCount] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true);

      if (data) {
        const lowStock = data.filter(product => {
          const inventory = product.size_inventory || { M: 0, L: 0, XL: 0, XXL: 0 };
          // Check if any size has 0 stock
          return Object.values(inventory).some(qty => qty === 0);
        });
        setCount(lowStock.length);
        setProducts(lowStock.slice(0, 3));
      }
    } catch (error) {
      console.error('Error fetching low stock products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <BaseWidget title="Low Stock Alert" icon={<AlertTriangle className="h-4 w-4" />}>Loading...</BaseWidget>;

  return (
    <BaseWidget title="Low Stock Alert" icon={<AlertTriangle className="h-4 w-4 text-warning" />}>
      {count === 0 ? (
        <div className="space-y-1">
          <p className="text-lg font-semibold text-success">All good</p>
          <p className="text-xs text-muted-foreground">No low stock items</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-base sm:text-lg font-semibold text-warning">{count} product{count > 1 ? 's' : ''} with stock-outs</p>
          <div className="space-y-1">
            {products.map(product => (
              <Link key={product.id} to={`/products/${product.id}`} className="block text-sm hover:underline truncate">
                {product.name}
              </Link>
            ))}
          </div>
          {count > 3 && (
            <Link to="/products" className="text-xs text-muted-foreground hover:underline">
              View all {count} products
            </Link>
          )}
        </div>
      )}
    </BaseWidget>
  );
}

