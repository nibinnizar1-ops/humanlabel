import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, SaleWithDetails } from '@/lib/supabase';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, ShoppingCart, CreditCard, Banknote, Smartphone, Globe, Store, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function Sales() {
  const { canEdit } = useAuth();
  const [sales, setSales] = useState<SaleWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          customer:customers(*),
          product:products(*)
        `)
        .order('sale_date', { ascending: false })
        .limit(50);

      if (error) throw error;
      setSales(data || []);
    } catch (error) {
      console.error('Error fetching sales:', error);
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

  const getPaymentIcon = (mode: string) => {
    switch (mode) {
      case 'Cash': return Banknote;
      case 'UPI': return Smartphone;
      case 'Card': return CreditCard;
      default: return CreditCard;
    }
  };

  const handleDeleteSale = async (sale: SaleWithDetails) => {
    if (!confirm('Are you sure you want to delete this sale? This will restore inventory and update customer totals.')) {
      return;
    }

    try {
      // Restore product inventory
      if (sale.product && sale.size) {
        const currentInventory = sale.product.size_inventory || { M: 0, L: 0, XL: 0, XXL: 0 };
        const updatedInventory = {
          ...currentInventory,
          [sale.size]: (currentInventory[sale.size] || 0) + sale.quantity,
        };

        const { error: inventoryError } = await supabase
          .from('products')
          .update({
            size_inventory: updatedInventory,
            updated_at: new Date().toISOString(),
          })
          .eq('id', sale.product_id);

        if (inventoryError) throw inventoryError;
      }

      // Update customer totals (subtract the sale amount and charity)
      if (sale.customer_id) {
        const { data: customer, error: customerFetchError } = await supabase
          .from('customers')
          .select('total_spent, total_charity')
          .eq('id', sale.customer_id)
          .single();

        if (customerFetchError) throw customerFetchError;

        const { error: customerUpdateError } = await supabase
          .from('customers')
          .update({
            total_spent: Math.max(0, (customer.total_spent || 0) - sale.sale_amount),
            total_charity: Math.max(0, (customer.total_charity || 0) - sale.charity_amount),
            updated_at: new Date().toISOString(),
          })
          .eq('id', sale.customer_id);

        if (customerUpdateError) throw customerUpdateError;
      }

      // Delete the sale
      const { error: deleteError } = await supabase
        .from('sales')
        .delete()
        .eq('id', sale.id);

      if (deleteError) throw deleteError;

      toast.success('Sale deleted successfully. Inventory and customer totals have been updated.');
      fetchSales();
    } catch (error: any) {
      console.error('Error deleting sale:', error);
      toast.error(error.message || 'Failed to delete sale');
    }
  };

  // Group sales by date
  const groupedSales = sales.reduce((groups, sale) => {
    const date = format(new Date(sale.sale_date), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(sale);
    return groups;
  }, {} as Record<string, SaleWithDetails[]>);

  return (
    <AppLayout>
      <PageHeader 
        title="Sales" 
        action={
          canEdit && (
            <Link to="/sales/new">
              <Button size="sm" className="bg-accent hover:bg-accent/90">
                <Plus className="h-4 w-4 mr-1" />
                New Sale
              </Button>
            </Link>
          )
        }
      />

      <div className="p-4 space-y-6">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : sales.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="text-muted-foreground">No sales recorded yet</p>
            {canEdit && (
              <Link to="/sales/new">
                <Button className="bg-accent hover:bg-accent/90">
                  <Plus className="h-4 w-4 mr-1" />
                  Record your first sale
                </Button>
              </Link>
            )}
          </div>
        ) : (
          Object.entries(groupedSales).map(([date, daySales]) => (
            <div key={date} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-muted-foreground">
                  {format(new Date(date), 'EEEE, MMM d')}
                </h3>
                <span className="text-sm text-muted-foreground">
                  {formatCurrency(daySales.reduce((sum, s) => sum + Number(s.sale_amount), 0))}
                </span>
              </div>

              <div className="space-y-2">
                {daySales.map((sale) => {
                  const PaymentIcon = getPaymentIcon(sale.payment_mode);
                  
                    return (
                      <div key={sale.id} className="stat-card">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium truncate">
                                {sale.product?.name || 'Unknown Product'}
                              </h4>
                              <Badge variant="secondary" className="text-xs">
                                ×{sale.quantity}
                              </Badge>
                              {(sale as any).size && (
                                <Badge variant="outline" className="text-xs">
                                  {(sale as any).size}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {sale.customer?.name || 'Walk-in'} • {format(new Date(sale.sale_date), 'h:mm a')}
                            </p>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <p className="font-semibold">{formatCurrency(sale.sale_amount)}</p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <PaymentIcon className="h-3 w-3" />
                              {sale.payment_mode}
                              {(sale as any).sale_mode && (
                                <>
                                  <span className="mx-1">•</span>
                                  {(sale as any).sale_mode === 'Online' ? (
                                    <Globe className="h-3 w-3" />
                                  ) : (
                                    <Store className="h-3 w-3" />
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t">
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-profit">
                            Profit: {formatCurrency(sale.profit)}
                          </span>
                          <span className="text-success">
                            Charity: {formatCurrency(sale.charity_amount)}
                          </span>
                        </div>
                        {canEdit && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteSale(sale)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </AppLayout>
  );
}