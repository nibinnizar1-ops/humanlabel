import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function CustomerForm() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.mobile.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from('customers')
        .insert({
          name: formData.name.trim(),
          mobile: formData.mobile,
          email: formData.email.trim() || null,
        });

      if (error) throw error;

      toast.success('Customer added successfully');
      navigate('/customers');
    } catch (error: any) {
      console.error('Error creating customer:', error);
      if (error.code === '23505') {
        toast.error('A customer with this mobile number already exists');
      } else {
        toast.error(error.message || 'Failed to add customer');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <PageHeader title="Add Customer" showBack />

      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Customer name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mobile">Mobile Number *</Label>
            <Input
              id="mobile"
              type="tel"
              inputMode="numeric"
              value={formData.mobile}
              onChange={(e) => setFormData({ 
                ...formData, 
                mobile: e.target.value.replace(/\D/g, '').slice(0, 10) 
              })}
              placeholder="10-digit mobile number"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email (Optional)</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="customer@email.com"
            />
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full h-12 bg-accent hover:bg-accent/90"
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Add Customer
            </>
          )}
        </Button>
      </form>
    </AppLayout>
  );
}