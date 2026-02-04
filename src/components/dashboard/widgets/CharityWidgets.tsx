import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BaseWidget } from './BaseWidget';
import { Heart, Calendar } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { startOfMonth, endOfMonth } from 'date-fns';

interface CharityWidgetsProps {
  widgetId: string;
}

export function CharityTotalGenerated({ widgetId }: CharityWidgetsProps) {
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data } = await supabase
        .from('sales')
        .select('charity_amount');

      const total = data?.reduce((sum, s) => sum + Number(s.charity_amount), 0) || 0;
      setAmount(total);
    } catch (error) {
      console.error('Error fetching total charity:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <BaseWidget title="Total Charity Generated" icon={<Heart className="h-4 w-4" />} size="medium">Loading...</BaseWidget>;

  return (
    <BaseWidget title="Total Charity Generated" icon={<Heart className="h-4 w-4" />} size="medium">
      <p className="text-3xl font-bold">{formatCurrency(amount)}</p>
      <p className="text-xs text-muted-foreground mt-1">Total charity from all sales</p>
    </BaseWidget>
  );
}

export function CharityToPay({ widgetId }: CharityWidgetsProps) {
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // For now, charity to pay = total charity generated
      // In future, this could track paid vs unpaid charity
      const { data } = await supabase
        .from('sales')
        .select('charity_amount');

      const total = data?.reduce((sum, s) => sum + Number(s.charity_amount), 0) || 0;
      setAmount(total);
    } catch (error) {
      console.error('Error fetching charity to pay:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <BaseWidget title="Charity Amount to Pay" icon={<Heart className="h-4 w-4" />} size="medium">Loading...</BaseWidget>;

  return (
    <BaseWidget title="Charity Amount to Pay" icon={<Heart className="h-4 w-4" />} size="medium">
      <p className="text-3xl font-bold">{formatCurrency(amount)}</p>
      <p className="text-xs text-muted-foreground mt-1">Total charity to be paid</p>
    </BaseWidget>
  );
}

export function CharityThisMonth({ widgetId }: CharityWidgetsProps) {
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
        .select('charity_amount')
        .gte('sale_date', monthStart)
        .lte('sale_date', monthEnd);

      const total = data?.reduce((sum, s) => sum + Number(s.charity_amount), 0) || 0;
      setAmount(total);
    } catch (error) {
      console.error('Error fetching month charity:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <BaseWidget title="This Month Charity" icon={<Calendar className="h-4 w-4" />}>Loading...</BaseWidget>;

  return (
    <BaseWidget title="This Month Charity" icon={<Calendar className="h-4 w-4" />}>
      <p className="text-2xl font-bold">{formatCurrency(amount)}</p>
      <p className="text-xs text-muted-foreground mt-1">Charity generated this month</p>
    </BaseWidget>
  );
}

