import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, Customer } from '@/lib/supabase';
import { BaseWidget } from './BaseWidget';
import { Users, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { startOfMonth, endOfMonth } from 'date-fns';

interface CustomerWidgetsProps {
  widgetId: string;
}

export function CustomersTotal({ widgetId }: CustomerWidgetsProps) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { count } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });
      setCount(count || 0);
    } catch (error) {
      console.error('Error fetching customer count:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <BaseWidget title="Total Customers" icon={<Users className="h-4 w-4" />}>Loading...</BaseWidget>;

  return (
    <BaseWidget title="Total Customers" icon={<Users className="h-4 w-4" />}>
      <p className="text-xl sm:text-2xl font-bold">{count}</p>
      <p className="text-xs text-muted-foreground mt-1">Total registered customers</p>
    </BaseWidget>
  );
}

export function CustomersTopSpenders({ widgetId }: CustomerWidgetsProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data } = await supabase
        .from('customers')
        .select('*')
        .order('total_spent', { ascending: false })
        .limit(5);

      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching top customers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <BaseWidget title="Top Customers" icon={<TrendingUp className="h-4 w-4" />} size="large">Loading...</BaseWidget>;

  return (
    <BaseWidget title="Top Customers" icon={<TrendingUp className="h-4 w-4" />} size="large">
      {customers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No customers yet</p>
      ) : (
        <div className="space-y-3">
          {customers.map((customer, index) => (
            <Link 
              key={customer.id} 
              to={`/customers/${customer.id}`}
              className="block"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground w-4 sm:w-6 flex-shrink-0">#{index + 1}</span>
                  <span className="text-xs sm:text-sm font-medium truncate">{customer.name}</span>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs sm:text-sm font-semibold">{formatCurrency(customer.total_spent)}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(customer.total_charity)} charity</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </BaseWidget>
  );
}

export function CustomersNewThisMonth({ widgetId }: CustomerWidgetsProps) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const monthStart = startOfMonth(new Date()).toISOString();
      const monthEnd = endOfMonth(new Date()).toISOString();
      const { count } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthStart)
        .lte('created_at', monthEnd);
      setCount(count || 0);
    } catch (error) {
      console.error('Error fetching new customers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <BaseWidget title="New Customers This Month" icon={<Users className="h-4 w-4" />}>Loading...</BaseWidget>;

  return (
    <BaseWidget title="New Customers This Month" icon={<Users className="h-4 w-4" />}>
      <p className="text-xl sm:text-2xl font-bold">{count}</p>
      <p className="text-xs text-muted-foreground mt-1">New customers this month</p>
    </BaseWidget>
  );
}

