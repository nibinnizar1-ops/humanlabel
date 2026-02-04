import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Product } from '@/lib/supabase';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const categories = ['Shirt', 'T-Shirt', 'Hoodie', 'Pants', 'Accessory'] as const;

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'T-Shirt' as typeof categories[number],
    sku: '',
    cost_price: '',
    selling_price: '',
    charity_percentage: '10',
    is_active: true,
    initial_quantity: '0',
  });

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, inventory(*)')
        .eq('id', id)
        .single();

      if (error) throw error;

      setFormData({
        name: data.name,
        category: data.category,
        sku: data.sku,
        cost_price: String(data.cost_price),
        selling_price: String(data.selling_price),
        charity_percentage: String(data.charity_percentage),
        is_active: data.is_active,
        initial_quantity: String(data.inventory?.quantity_added || 0),
      });
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const productData = {
        name: formData.name.trim(),
        category: formData.category,
        sku: formData.sku.trim().toUpperCase(),
        cost_price: parseFloat(formData.cost_price),
        selling_price: parseFloat(formData.selling_price),
        charity_percentage: parseFloat(formData.charity_percentage),
        is_active: formData.is_active,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', id);

        if (error) throw error;

        // Update inventory if quantity changed
        if (formData.initial_quantity) {
          await supabase
            .from('inventory')
            .update({ quantity_added: parseInt(formData.initial_quantity) })
            .eq('product_id', id);
        }

        toast.success('Product updated successfully');
      } else {
        const { data: newProduct, error } = await supabase
          .from('products')
          .insert(productData)
          .select()
          .single();

        if (error) throw error;

        // Create inventory record
        await supabase
          .from('inventory')
          .insert({
            product_id: newProduct.id,
            quantity_added: parseInt(formData.initial_quantity) || 0,
            quantity_sold: 0,
          });

        toast.success('Product created successfully');
      }

      navigate('/products');
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error(error.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Product deleted');
      navigate('/products');
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const margin = formData.selling_price && formData.cost_price
    ? ((parseFloat(formData.selling_price) - parseFloat(formData.cost_price)) / parseFloat(formData.selling_price) * 100).toFixed(1)
    : '0';

  const charityPerUnit = formData.selling_price && formData.cost_price && formData.charity_percentage
    ? ((parseFloat(formData.selling_price) - parseFloat(formData.cost_price)) * parseFloat(formData.charity_percentage) / 100).toFixed(2)
    : '0';

  if (loading) {
    return (
      <AppLayout>
        <PageHeader title={isEditing ? 'Edit Product' : 'New Product'} showBack />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader 
        title={isEditing ? 'Edit Product' : 'New Product'} 
        showBack
        action={
          isEditing && isAdmin && (
            <Button variant="ghost" size="icon" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )
        }
      />

      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Classic Oxford Shirt"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                placeholder="HL-TS-001"
                required
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="space-y-4">
          <h3 className="font-semibold">Pricing</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cost_price">Cost Price (₹) *</Label>
              <Input
                id="cost_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.cost_price}
                onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                placeholder="500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="selling_price">Selling Price (₹) *</Label>
              <Input
                id="selling_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.selling_price}
                onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                placeholder="999"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="charity_percentage">Charity Percentage (%) *</Label>
            <Input
              id="charity_percentage"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={formData.charity_percentage}
              onChange={(e) => setFormData({ ...formData, charity_percentage: e.target.value })}
              required
            />
          </div>

          {/* Calculated Values */}
          <div className="grid grid-cols-2 gap-3">
            <div className="stat-card bg-secondary/50">
              <p className="text-xs text-muted-foreground">Margin</p>
              <p className="text-lg font-semibold">{margin}%</p>
            </div>
            <div className="stat-card gradient-charity">
              <p className="text-xs text-white/80">Charity per Unit</p>
              <p className="text-lg font-semibold">₹{charityPerUnit}</p>
            </div>
          </div>
        </div>

        {/* Inventory */}
        <div className="space-y-4">
          <h3 className="font-semibold">Inventory</h3>
          
          <div className="space-y-2">
            <Label htmlFor="initial_quantity">
              {isEditing ? 'Total Quantity Added' : 'Initial Stock'}
            </Label>
            <Input
              id="initial_quantity"
              type="number"
              min="0"
              value={formData.initial_quantity}
              onChange={(e) => setFormData({ ...formData, initial_quantity: e.target.value })}
              placeholder="100"
            />
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
          <div>
            <Label htmlFor="is_active">Active Product</Label>
            <p className="text-sm text-muted-foreground">Show in sales dropdown</p>
          </div>
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
        </div>

        {/* Submit */}
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
              {isEditing ? 'Update Product' : 'Create Product'}
            </>
          )}
        </Button>
      </form>
    </AppLayout>
  );
}