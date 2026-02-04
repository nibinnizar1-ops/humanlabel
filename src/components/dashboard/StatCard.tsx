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

  return (
    <div className={cn(
      "stat-card",
      variantStyles[variant],
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className={cn(
            "stat-card-label",
            isGradient && "text-white/80"
          )}>
            {label}
          </p>
          <p className="stat-card-value">{value}</p>
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
            "p-2 rounded-lg",
            isGradient ? "bg-white/20" : "bg-secondary"
          )}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}