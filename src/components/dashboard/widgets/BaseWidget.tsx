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
      "stat-card p-3 sm:p-4",
      sizeClasses[size],
      className
    )}>
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <h3 className="font-semibold text-xs sm:text-sm truncate flex-1 pr-2">{title}</h3>
        {icon && (
          <div className="p-1 sm:p-1.5 rounded-lg bg-secondary flex-shrink-0">
            <div className="h-3 w-3 sm:h-4 sm:w-4">
              {icon}
            </div>
          </div>
        )}
      </div>
      <div className="text-sm sm:text-base">
        {children}
      </div>
    </div>
  );
}

