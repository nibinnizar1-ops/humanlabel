import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  User, 
  Shield, 
  LogOut,
  Heart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { profile, role, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const roleLabels = {
    admin: { label: 'Administrator', color: 'bg-red-100 text-red-800' },
    staff: { label: 'Staff', color: 'bg-blue-100 text-blue-800' },
    viewer: { label: 'View Only', color: 'bg-gray-100 text-gray-800' },
  };

  const currentRole = role ? roleLabels[role] : { label: 'No Role', color: 'bg-gray-100 text-gray-800' };

  return (
    <AppLayout>
      <PageHeader title="Settings" showBack />

      <div className="p-4 space-y-4">
        {/* Profile Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{profile?.full_name || 'Not set'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{profile?.email || 'Not set'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <Badge className={currentRole.color}>{currentRole.label}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Access Level Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Access Level
            </CardTitle>
            <CardDescription>
              What you can do in this app
            </CardDescription>
          </CardHeader>
          <CardContent>
            {role === 'admin' && (
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>✓ Full access to all features</li>
                <li>✓ Manage products and inventory</li>
                <li>✓ Record and view sales</li>
                <li>✓ Manage customers</li>
                <li>✓ Track expenses</li>
                <li>✓ Manage users</li>
              </ul>
            )}
            {role === 'staff' && (
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>✓ Record sales</li>
                <li>✓ View products and inventory</li>
                <li>✓ Add/edit customers</li>
                <li>✓ Add expenses</li>
                <li>✗ Cannot manage products</li>
                <li>✗ Cannot manage users</li>
              </ul>
            )}
            {role === 'viewer' && (
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>✓ View dashboard</li>
                <li>✓ View products and inventory</li>
                <li>✓ View sales history</li>
                <li>✓ View customers</li>
                <li>✓ View charity impact</li>
                <li>✗ Cannot make changes</li>
              </ul>
            )}
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="h-4 w-4 text-accent" />
              About Human Label
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Internal dashboard for managing products, sales, and tracking our charity impact.
              Every sale contributes to making the world a better place.
            </p>
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Button 
          variant="outline" 
          className="w-full h-12 text-destructive hover:text-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </AppLayout>
  );
}