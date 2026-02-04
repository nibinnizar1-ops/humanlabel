import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BaseWidget } from './BaseWidget';
import { TrendingUp, Percent } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { startOfMonth, endOfMonth } from 'date-fns';

interface ProfitWidgetsProps {
  widgetId: string;
}

export function ProfitTotal({ widgetId }: ProfitWidgetsProps) {
  const [profit, setProfit] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data } = await supabase
        .from('sales')
        .select('profit');

      const total = data?.reduce((sum, s) => sum + Number(s.profit), 0) || 0;
      setProfit(total);
    } catch (error) {
      console.error('Error fetching total profit:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <BaseWidget title="Total Profit" icon={<TrendingUp className="h-4 w-4" />} size="medium">Loading...</BaseWidget>;

  return (
    <BaseWidget title="Total Profit" icon={<TrendingUp className="h-4 w-4" />} size="medium">
      <p className="text-3xl font-bold">{formatCurrency(profit)}</p>
      <p className="text-xs text-muted-foreground mt-1">Total profit from all sales</p>
    </BaseWidget>
  );
}

export function ProfitMarginPercentage({ widgetId }: ProfitWidgetsProps) {
  const [margin, setMargin] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data } = await supabase
        .from('sales')
        .select('sale_amount, profit');

      if (data && data.length > 0) {
        const totalRevenue = data.reduce((sum, s) => sum + Number(s.sale_amount), 0);
        const totalProfit = data.reduce((sum, s) => sum + Number(s.profit), 0);
        const marginPercent = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
        setMargin(marginPercent);
      }
    } catch (error) {
      console.error('Error fetching profit margin:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <BaseWidget title="Profit Margin %" icon={<Percent className="h-4 w-4" />}>Loading...</BaseWidget>;

  return (
    <BaseWidget title="Profit Margin %" icon={<Percent className="h-4 w-4" />}>
      <p className="text-2xl font-bold">{margin.toFixed(1)}%</p>
      <p className="text-xs text-muted-foreground mt-1">Average profit margin</p>
    </BaseWidget>
  );
}

export function ProfitAfterCharity({ widgetId }: ProfitWidgetsProps) {
  const [profit, setProfit] = useState(0);
  const [charity, setCharity] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data } = await supabase
        .from('sales')
        .select('profit, charity_amount');

      const totalProfit = data?.reduce((sum, s) => sum + Number(s.profit), 0) || 0;
      const totalCharity = data?.reduce((sum, s) => sum + Number(s.charity_amount), 0) || 0;

      setProfit(totalProfit);
      setCharity(totalCharity);
    } catch (error) {
      console.error('Error fetching profit after charity:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <BaseWidget title="Profit After Charity" icon={<TrendingUp className="h-4 w-4" />} size="medium">Loading...</BaseWidget>;

  const profitAfterCharity = profit - charity;

  return (
    <BaseWidget title="Profit After Charity" icon={<TrendingUp className="h-4 w-4" />} size="medium">
      <div className="space-y-2">
        <p className="text-3xl font-bold">{formatCurrency(profitAfterCharity)}</p>
        <div className="pt-2 border-t space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Total Profit</span>
            <span className="font-medium">{formatCurrency(profit)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Charity</span>
            <span className="font-medium text-success">{formatCurrency(charity)}</span>
          </div>
        </div>
      </div>
    </BaseWidget>
  );
}

