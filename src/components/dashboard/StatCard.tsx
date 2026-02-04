import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'charity' | 'sales' | 'profit' | 'warning';
  className?: string;
}

const variantStyles = {
  default: 'bg-card',
  charity: 'gradient-charity text-white',
  sales: 'gradient-sales text-white',
  profit: 'gradient-profit text-white',
  warning: 'bg-warning/10 border-warning/30',
};

export function StatCard({ 
  label, 
  value, 
  icon, 
  trend, 
  variant = 'default',
  className 
}: StatCardProps) {
  const isGradient = ['charity', 'sales', 'profit'].includes(variant);
  const valueStr = String(value);
  const isLongValue = valueStr.length > 8;

  return (
    <div className={cn(
      "stat-card",
      variantStyles[variant],
      className
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 min-w-0 flex-1">
          <p className={cn(
            "stat-card-label truncate",
            isGradient && "text-white/80"
          )}>
            {label}
          </p>
          <p className={cn(
            "font-bold tracking-tight truncate",
            isLongValue ? "text-lg" : "text-xl sm:text-2xl"
          )}>
            {value}
          </p>
          {trend && (
            <p className={cn(
              "text-xs font-medium",
              trend.isPositive ? "text-success" : "text-destructive",
              isGradient && (trend.isPositive ? "text-white/90" : "text-white/70")
            )}>
              {trend.isPositive ? '+' : ''}{trend.value}% from last month
            </p>
          )}
        </div>
        {icon && (
          <div className={cn(
            "p-2 rounded-lg flex-shrink-0",
            isGradient ? "bg-white/20" : "bg-secondary"
          )}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
