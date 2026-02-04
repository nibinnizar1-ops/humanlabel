import { useEffect, useState } from 'react';
import { supabase, Expense } from '@/lib/supabase';
import { BaseWidget } from './BaseWidget';
import { Receipt, Calendar } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { startOfMonth, endOfMonth } from 'date-fns';

interface ExpenseWidgetsProps {
  widgetId: string;
}

export function ExpensesTotal({ widgetId }: ExpenseWidgetsProps) {
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data } = await supabase
        .from('expenses')
        .select('amount');

      const total = data?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      setAmount(total);
    } catch (error) {
      console.error('Error fetching total expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <BaseWidget title="Total Expenses" icon={<Receipt className="h-4 w-4" />}>Loading...</BaseWidget>;

  return (
    <BaseWidget title="Total Expenses" icon={<Receipt className="h-4 w-4" />}>
      <p className="text-2xl font-bold">{formatCurrency(amount)}</p>
      <p className="text-xs text-muted-foreground mt-1">Total expenses recorded</p>
    </BaseWidget>
  );
}

export function ExpensesThisMonth({ widgetId }: ExpenseWidgetsProps) {
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
        .from('expenses')
        .select('amount')
        .gte('expense_date', monthStart)
        .lte('expense_date', monthEnd);

      const total = data?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      setAmount(total);
    } catch (error) {
      console.error('Error fetching month expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <BaseWidget title="This Month Expenses" icon={<Calendar className="h-4 w-4" />}>Loading...</BaseWidget>;

  return (
    <BaseWidget title="This Month Expenses" icon={<Calendar className="h-4 w-4" />}>
      <p className="text-2xl font-bold">{formatCurrency(amount)}</p>
      <p className="text-xs text-muted-foreground mt-1">Expenses this month</p>
    </BaseWidget>
  );
}

export function ExpensesByCategory({ widgetId }: ExpenseWidgetsProps) {
  const [categories, setCategories] = useState<Array<{ category: string; amount: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data } = await supabase
        .from('expenses')
        .select('category, amount');

      if (data) {
        const categoryTotals = data.reduce((acc, expense) => {
          const cat = expense.category;
          acc[cat] = (acc[cat] || 0) + Number(expense.amount);
          return acc;
        }, {} as Record<string, number>);

        const sorted = Object.entries(categoryTotals)
          .map(([category, amount]) => ({ category, amount }))
          .sort((a, b) => b.amount - a.amount);

        setCategories(sorted);
      }
    } catch (error) {
      console.error('Error fetching expenses by category:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <BaseWidget title="Expenses by Category" icon={<Receipt className="h-4 w-4" />} size="large">Loading...</BaseWidget>;

  return (
    <BaseWidget title="Expenses by Category" icon={<Receipt className="h-4 w-4" />} size="large">
      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">No expenses recorded</p>
      ) : (
        <div className="space-y-3">
          {categories.map((item) => (
            <div key={item.category} className="flex items-center justify-between">
              <span className="text-sm font-medium">{item.category}</span>
              <span className="text-sm font-semibold">{formatCurrency(item.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </BaseWidget>
  );
}

