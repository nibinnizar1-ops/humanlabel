import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, ProductWithInventory } from '@/lib/supabase';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Package, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StockManager } from '@/components/products/StockManager';
import { toast } from 'sonner';

export default function Products() {
  const { isAdmin, canEdit } = useAuth();
  const [products, setProducts] = useState<ProductWithInventory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          inventory (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const isLowStock = (product: ProductWithInventory) => {
    if (!product.inventory) return false;
    return product.inventory.available_quantity <= product.inventory.low_stock_threshold;
  };

  return (
    <AppLayout>
      <PageHeader 
        title="Products" 
        action={
          isAdmin && (
            <Link to="/products/new">
              <Button size="sm" className="bg-accent hover:bg-accent/90">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </Link>
          )
        }
      />

      <div className="p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Products List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Package className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="text-muted-foreground">No products found</p>
              {isAdmin && (
                <Link to="/products/new">
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add your first product
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            filteredProducts.map((product) => (
              <div key={product.id} className="stat-card">
                <div className="flex items-center gap-3">
                  <Link 
                    to={`/products/${product.id}`}
                    className="flex-1 flex items-center gap-3 min-w-0"
                  >
                    {/* Product Image */}
                    <div className="h-14 w-14 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                      {product.images?.[0] ? (
                        <img 
                          src={product.images[0]} 
                          alt={product.name}
                          className="h-full w-full object-cover rounded-lg"
                        />
                      ) : (
                        <Package className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-medium truncate">{product.name}</h3>
                          <p className="text-sm text-muted-foreground">{product.sku}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-semibold">{formatCurrency(product.selling_price)}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.charity_percentage}% charity
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant="secondary" className="text-xs">
                          {product.category}
                        </Badge>
                        {product.size_inventory && (
                          <span className="text-xs text-muted-foreground">
                            M:{product.size_inventory.M || 0} L:{product.size_inventory.L || 0} XL:{product.size_inventory.XL || 0} XXL:{product.size_inventory.XXL || 0}
                          </span>
                        )}
                        {product.inventory && (
                          <span className={cn(
                            "text-xs font-medium",
                            isLowStock(product) ? "text-warning" : "text-muted-foreground"
                          )}>
                            {isLowStock(product) && (
                              <AlertTriangle className="inline h-3 w-3 mr-0.5" />
                            )}
                            {product.inventory.available_quantity} in stock
                          </span>
                        )}
                        {!product.is_active && (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Link>

                  {/* Quick Actions */}
                  {canEdit && (
                    <div className="flex-shrink-0">
                      <StockManager
                        productId={product.id}
                        productName={product.name}
                        currentInventory={product.size_inventory || { M: 0, L: 0, XL: 0, XXL: 0 }}
                        onStockUpdated={fetchProducts}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}