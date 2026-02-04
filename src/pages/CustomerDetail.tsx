import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Customer, SaleWithDetails } from '@/lib/supabase';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/dashboard/StatCard';
import { 
  User, 
  Phone, 
  Mail, 
  Heart, 
  ShoppingCart, 
  TrendingUp,
  Edit,
  ArrowLeft,
  Calendar,
  Package
} from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canEdit } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sales, setSales] = useState<SaleWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCustomerData();
    }
  }, [id]);

  const fetchCustomerData = async () => {
    try {
      // Fetch customer
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();

      if (customerError) throw customerError;
      setCustomer(customerData);

      // Fetch customer sales
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select(`
          *,
          product:products(*)
        `)
        .eq('customer_id', id)
        .order('sale_date', { ascending: false });

      if (salesError) throw salesError;
      setSales(salesData || []);
    } catch (error) {
      console.error('Error fetching customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalSales = sales.length;
  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.sale_amount), 0);
  const totalCharity = sales.reduce((sum, s) => sum + Number(s.charity_amount), 0);
  const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

  if (loading) {
    return (
      <AppLayout>
        <PageHeader title="Customer Details" showBack />
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </AppLayout>
    );
  }

  if (!customer) {
    return (
      <AppLayout>
        <PageHeader title="Customer Not Found" showBack />
        <div className="p-4 text-center py-12">
          <p className="text-muted-foreground">Customer not found</p>
          <Link to="/customers">
            <Button variant="outline" className="mt-4">
              Back to Customers
            </Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

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
        title="Customer Details" 
        showBack
        action={
          canEdit && (
            <Link to={`/customers/${id}/edit`}>
              <Button size="sm" variant="outline" className="gap-2">
                <Edit className="h-4 w-4" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
            </Link>
          )
        }
      />

      <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
        {/* Customer Info Card */}
        <div className="stat-card p-4 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold mb-2">{customer.name}</h2>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{customer.mobile}</span>
                </div>
                {customer.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{customer.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                  <Calendar className="h-3 w-3" />
                  <span>Joined {format(new Date(customer.created_at), 'MMM d, yyyy')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Total Spent"
            value={formatCurrency(customer.total_spent)}
            icon={<TrendingUp className="h-4 w-4" />}
            variant="profit"
          />
          <StatCard
            label="Charity"
            value={formatCurrency(customer.total_charity)}
            icon={<Heart className="h-4 w-4" />}
            variant="charity"
          />
          <StatCard
            label="Total Orders"
            value={totalSales.toString()}
            icon={<ShoppingCart className="h-4 w-4" />}
          />
          <StatCard
            label="Avg Order"
            value={formatCurrency(averageOrderValue)}
            icon={<Package className="h-4 w-4" />}
          />
        </div>

        {/* Sales History */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-base sm:text-lg">Purchase History</h3>
            <Badge variant="secondary" className="text-xs sm:text-sm">
              {totalSales} {totalSales === 1 ? 'order' : 'orders'}
            </Badge>
          </div>

          {sales.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="text-muted-foreground">No purchases yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedSales).map(([date, daySales]) => (
                <div key={date} className="space-y-2">
                  <div className="flex items-center justify-between px-2">
                    <h4 className="font-medium text-sm text-muted-foreground">
                      {format(new Date(date), 'EEEE, MMM d, yyyy')}
                    </h4>
                    <span className="text-sm font-semibold">
                      {formatCurrency(daySales.reduce((sum, s) => sum + Number(s.sale_amount), 0))}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {daySales.map((sale) => (
                      <Link
                        key={sale.id}
                        to={`/sales`}
                        className="block"
                      >
                        <div className="stat-card p-3 hover:bg-secondary/50 transition-colors">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="font-medium text-sm truncate">
                                  {sale.product?.name || 'Unknown Product'}
                                </h5>
                                <Badge variant="secondary" className="text-xs">
                                  ×{sale.quantity}
                                </Badge>
                                {sale.size && (
                                  <Badge variant="outline" className="text-xs">
                                    {sale.size}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(sale.sale_date), 'h:mm a')} • {sale.payment_mode}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-semibold text-sm">{formatCurrency(sale.sale_amount)}</p>
                              {sale.discount_amount > 0 && (
                                <p className="text-xs text-destructive">
                                  -{formatCurrency(sale.discount_amount)}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 mt-2 pt-2 border-t text-xs">
                            <span className="text-profit">
                              Profit: {formatCurrency(sale.profit)}
                            </span>
                            <span className="text-success">
                              Charity: {formatCurrency(sale.charity_amount)}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

