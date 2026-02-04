import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { DashboardCustomizer } from '@/components/dashboard/DashboardCustomizer';
import { WidgetRenderer } from '@/components/dashboard/widgets/WidgetRenderer';
import { useDashboardConfig } from '@/hooks/useDashboardConfig';
import { 
  Plus,
  ShoppingCart,
  Package,
  Users,
  Receipt,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { profile, role, canEdit } = useAuth();
  const { enabledWidgets } = useDashboardConfig();

  const quickActions = [
    { icon: ShoppingCart, label: 'New Sale', path: '/sales/new', color: 'text-foreground' },
    { icon: Package, label: 'Add Product', path: '/products/new', color: 'text-foreground', adminOnly: true },
    { icon: Users, label: 'Customers', path: '/customers', color: 'text-foreground' },
    { icon: Receipt, label: 'Add Expense', path: '/expenses/new', color: 'text-foreground', staffOnly: true },
  ];

  const filteredActions = quickActions.filter(action => {
    if (action.adminOnly && role !== 'admin') return false;
    if (action.staffOnly && role === 'viewer') return false;
    return true;
  });

  return (
    <AppLayout>
      <PageHeader 
        title="Dashboard" 
        showLogo
        action={<DashboardCustomizer />}
      />
      
      <div className="p-3 sm:p-4 space-y-4 sm:space-y-6 pb-20 sm:pb-4">
        {/* Welcome Section */}
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-semibold">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'there'}!
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Here's what's happening with Human Label today.
          </p>
        </div>

        {/* Customizable Widgets Grid */}
        {enabledWidgets.length === 0 ? (
          <div className="text-center py-8 sm:py-12 space-y-3">
            <p className="text-sm sm:text-base text-muted-foreground">No widgets enabled</p>
            <DashboardCustomizer />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {enabledWidgets.map((widget) => (
              <WidgetRenderer key={widget.id} widgetId={widget.id} />
            ))}
          </div>
        )}

        {/* Quick Actions */}
        {canEdit && (
          <div className="space-y-2 sm:space-y-3">
            <h3 className="font-semibold text-sm sm:text-base">Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {filteredActions.map((action) => (
                <Link key={action.path} to={action.path}>
                  <div className="quick-action min-h-[80px] sm:min-h-[90px]">
                    <action.icon className={cn("h-5 w-5 sm:h-6 sm:w-6", action.color)} />
                    <span className="text-xs font-medium text-center leading-tight px-1">
                      {action.label}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Primary Action for Staff */}
        {canEdit && (
          <Link to="/sales/new" className="block">
            <Button className="w-full h-12 sm:h-14 text-sm sm:text-base">
              <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Record New Sale
            </Button>
          </Link>
        )}
      </div>
    </AppLayout>
  );
}
