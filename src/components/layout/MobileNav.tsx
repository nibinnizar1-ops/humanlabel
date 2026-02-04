import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Receipt, 
  Heart 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Home', path: '/dashboard' },
  { icon: Package, label: 'Products', path: '/products' },
  { icon: ShoppingCart, label: 'Sales', path: '/sales' },
  { icon: Users, label: 'Customers', path: '/customers' },
  { icon: Receipt, label: 'Expenses', path: '/expenses', staffOnly: true },
  { icon: Heart, label: 'Charity', path: '/charity' },
];

export function MobileNav() {
  const location = useLocation();
  const { isViewer, isAdmin, isStaff } = useAuth();

  const filteredItems = navItems.filter(item => {
    if (item.staffOnly && isViewer) return false;
    return true;
  });

  return (
    <nav className="mobile-nav">
      <div className="flex items-center justify-around px-2 py-1">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "mobile-nav-item flex-1",
                isActive && "active"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}