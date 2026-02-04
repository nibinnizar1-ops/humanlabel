import { useState } from 'react';
import { useDashboardConfig } from '@/hooks/useDashboardConfig';
import type { WidgetConfig } from '@/types/dashboard';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Settings, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const categoryLabels: Record<string, string> = {
  products: 'Products',
  sales: 'Sales',
  revenue: 'Revenue',
  expenses: 'Expenses',
  profit: 'Profit',
  charity: 'Charity',
  customers: 'Customers',
  financial: 'Financial Overview',
};

export function DashboardCustomizer() {
  const { config, toggleWidget, resetToDefaults } = useDashboardConfig();
  const [open, setOpen] = useState(false);

  const widgetsByCategory = config.widgets.reduce((acc, widget) => {
    if (!acc[widget.category]) {
      acc[widget.category] = [];
    }
    acc[widget.category].push(widget);
    return acc;
  }, {} as Record<string, WidgetConfig[]>);

  const enabledCount = config.widgets.filter(w => w.enabled).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
          <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Customize Dashboard</span>
          <span className="sm:hidden">Customize</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle>Customize Dashboard</DialogTitle>
          <DialogDescription>
            Select which widgets to display on your dashboard. {enabledCount} of {config.widgets.length} widgets enabled.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {Object.entries(widgetsByCategory).map(([category, widgets]) => (
            <div key={category} className="space-y-3">
              <h3 className="font-semibold text-sm">{categoryLabels[category]}</h3>
              <div className="space-y-2 pl-2">
                {widgets.map((widget) => (
                  <div
                    key={widget.id}
                    className={cn(
                      "flex items-center justify-between p-2 sm:p-3 rounded-lg border transition-colors",
                      widget.enabled ? "bg-secondary/50" : "bg-background"
                    )}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <Checkbox
                        id={widget.id}
                        checked={widget.enabled}
                        onCheckedChange={() => {
                          toggleWidget(widget.id);
                        }}
                        className="flex-shrink-0"
                      />
                      <Label
                        htmlFor={widget.id}
                        className="flex-1 cursor-pointer font-normal text-sm sm:text-base truncate"
                      >
                        {widget.title}
                      </Label>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                      <span className={cn(
                        "text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded hidden sm:inline-block",
                        widget.size === 'small' && "bg-blue-100 text-blue-800",
                        widget.size === 'medium' && "bg-purple-100 text-purple-800",
                        widget.size === 'large' && "bg-orange-100 text-orange-800",
                      )}>
                        {widget.size}
                      </span>
                      {widget.enabled ? (
                        <Check className="h-4 w-4 text-success flex-shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={resetToDefaults}
            className="w-full sm:w-auto"
          >
            Reset to Defaults
          </Button>
          <Button 
            onClick={() => setOpen(false)}
            className="w-full sm:w-auto"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

