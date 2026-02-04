import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BaseWidget } from './BaseWidget';
import { TrendingUp, DollarSign, Receipt, Heart } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { startOfMonth, endOfMonth } from 'date-fns';

interface FinancialWidgetsProps {
  widgetId: string;
}

export function FinancialNetProfit({ widgetId }: FinancialWidgetsProps) {
  const [netProfit, setNetProfit] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Get total revenue from sales
      const { data: sales } = await supabase
        .from('sales')
        .select('sale_amount');

      const totalRevenue = sales?.reduce((sum, s) => sum + Number(s.sale_amount), 0) || 0;

      // Get total expenses
      const { data: expensesData } = await supabase
        .from('expenses')
        .select('amount');

      const totalExpenses = expensesData?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      setRevenue(totalRevenue);
      setExpenses(totalExpenses);
      setNetProfit(totalRevenue - totalExpenses);
    } catch (error) {
      console.error('Error fetching net profit:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <BaseWidget title="Net Profit" icon={<TrendingUp className="h-4 w-4" />} size="large">Loading...</BaseWidget>;

  return (
    <BaseWidget title="Net Profit (Revenue - Expenses)" icon={<TrendingUp className="h-4 w-4" />} size="large">
      <div className="space-y-3">
        <div>
          <p className="text-2xl sm:text-3xl font-bold">{formatCurrency(netProfit)}</p>
          <p className="text-xs text-muted-foreground mt-1">Total profit after expenses</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-2 border-t">
          <div>
            <p className="text-xs text-muted-foreground">Revenue</p>
            <p className="text-xs sm:text-sm font-semibold text-success">{formatCurrency(revenue)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Expenses</p>
            <p className="text-xs sm:text-sm font-semibold text-destructive">{formatCurrency(expenses)}</p>
          </div>
        </div>
      </div>
    </BaseWidget>
  );
}

export function FinancialRevenueVsExpenses({ widgetId }: FinancialWidgetsProps) {
  const [revenue, setRevenue] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: sales } = await supabase
        .from('sales')
        .select('sale_amount');
      const totalRevenue = sales?.reduce((sum, s) => sum + Number(s.sale_amount), 0) || 0;

      const { data: expensesData } = await supabase
        .from('expenses')
        .select('amount');
      const totalExpenses = expensesData?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      setRevenue(totalRevenue);
      setExpenses(totalExpenses);
    } catch (error) {
      console.error('Error fetching revenue vs expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <BaseWidget title="Revenue vs Expenses" icon={<DollarSign className="h-4 w-4" />} size="large">Loading...</BaseWidget>;

  const ratio = revenue > 0 ? (expenses / revenue) * 100 : 0;

  return (
    <BaseWidget title="Revenue vs Expenses" icon={<DollarSign className="h-4 w-4" />} size="large">
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs sm:text-sm text-muted-foreground">Revenue</span>
            <span className="text-base sm:text-lg font-bold text-success">{formatCurrency(revenue)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs sm:text-sm text-muted-foreground">Expenses</span>
            <span className="text-base sm:text-lg font-bold text-destructive">{formatCurrency(expenses)}</span>
          </div>
        </div>
        <div className="pt-2 border-t">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-muted-foreground">Expense Ratio</span>
            <span className="text-xs sm:text-sm font-semibold">{ratio.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div 
              className="bg-destructive h-2 rounded-full transition-all"
              style={{ width: `${Math.min(ratio, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </BaseWidget>
  );
}

