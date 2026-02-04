import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BaseWidgetProps {
  title: string;
  children: ReactNode;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  icon?: ReactNode;
}

export function BaseWidget({ 
  title, 
  children, 
  className, 
  size = 'medium',
  icon 
}: BaseWidgetProps) {
  const sizeClasses = {
    small: 'col-span-1',
    medium: 'col-span-1 sm:col-span-2',
    large: 'col-span-1 sm:col-span-2 lg:col-span-3',
  };

  return (
    <div className={cn(
      "stat-card",
      sizeClasses[size],
      className
    )}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">{title}</h3>
        {icon && (
          <div className="p-1.5 rounded-lg bg-secondary">
            {icon}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

