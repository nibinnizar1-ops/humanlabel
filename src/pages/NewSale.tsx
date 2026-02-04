import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Product, Customer, Size, SaleMode } from '@/lib/supabase';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Check, User, Phone, Mail, Globe, Store } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type PaymentMode = 'Cash' | 'UPI' | 'Card';

const sizes: Size[] = ['M', 'L', 'XL', 'XXL'];
const saleModes: SaleMode[] = ['Online', 'Offline'];

export default function NewSale() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [foundCustomer, setFoundCustomer] = useState<Customer | null>(null);
  const [searchingCustomer, setSearchingCustomer] = useState(false);

  const [formData, setFormData] = useState({
    product_id: '',
    quantity: 1,
    size: '' as Size | '',
    payment_mode: 'Cash' as PaymentMode,
    sale_mode: 'Offline' as SaleMode,
    customer_name: '',
    customer_mobile: '',
    customer_email: '',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('name');
    setProducts(data || []);
  };

  const searchCustomer = useCallback(async (mobile: string) => {
    if (mobile.length < 10) {
      setFoundCustomer(null);
      return;
    }

    setSearchingCustomer(true);
    try {
      const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('mobile', mobile)
        .single();
      
      setFoundCustomer(data || null);
      if (data) {
        setFormData(prev => ({ 
          ...prev, 
          customer_name: data.name,
          customer_email: data.email || '',
        }));
      }
    } catch {
      setFoundCustomer(null);
    } finally {
      setSearchingCustomer(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (customerSearch.length >= 10) {
        searchCustomer(customerSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch, searchCustomer]);

  const selectedProduct = products.find(p => p.id === formData.product_id);
  
  // Check available stock for selected size
  const availableStock = selectedProduct && formData.size
    ? (selectedProduct.size_inventory?.[formData.size] || 0)
    : 0;
  
  const calculations = selectedProduct ? {
    unitPrice: selectedProduct.selling_price,
    saleAmount: selectedProduct.selling_price * formData.quantity,
    costAmount: selectedProduct.cost_price * formData.quantity,
    profit: (selectedProduct.selling_price - selectedProduct.cost_price) * formData.quantity,
    charityAmount: ((selectedProduct.selling_price - selectedProduct.cost_price) * formData.quantity * selectedProduct.charity_percentage) / 100,
    charityPercentage: selectedProduct.charity_percentage,
  } : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct || !calculations) {
      toast.error('Please select a product');
      return;
    }

    if (!formData.size) {
      toast.error('Please select a size');
      return;
    }

    setSaving(true);

    try {
      let customerId = foundCustomer?.id || null;

      // Create new customer if mobile provided but not found
      if (customerSearch && !foundCustomer) {
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            name: formData.customer_name || 'Walk-in Customer',
            mobile: customerSearch,
            email: formData.customer_email || null,
          })
          .select()
          .single();

        if (customerError) throw customerError;
        customerId = newCustomer.id;
      }

      // Create sale
      const { error: saleError } = await supabase
        .from('sales')
        .insert({
          customer_id: customerId,
          product_id: formData.product_id,
          quantity: formData.quantity,
          size: formData.size,
          payment_mode: formData.payment_mode,
          sale_mode: formData.sale_mode,
          unit_price: calculations.unitPrice,
          sale_amount: calculations.saleAmount,
          cost_amount: calculations.costAmount,
          profit: calculations.profit,
          charity_percentage: calculations.charityPercentage,
          charity_amount: calculations.charityAmount,
          customer_email: formData.customer_email || null,
          created_by: user?.id,
        });

      if (saleError) throw saleError;

      toast.success('Sale recorded successfully!', {
        description: `₹${calculations.saleAmount.toLocaleString()} | ₹${calculations.charityAmount.toFixed(0)} to charity`,
      });
      
      navigate('/sales');
    } catch (error: any) {
      console.error('Error creating sale:', error);
      toast.error(error.message || 'Failed to record sale');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <AppLayout>
      <PageHeader title="New Sale" showBack />

      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        {/* Sale Mode */}
        <div className="space-y-3">
          <h3 className="font-semibold">Sale Type</h3>
          <div className="grid grid-cols-2 gap-2">
            {saleModes.map((mode) => (
              <Button
                key={mode}
                type="button"
                variant={formData.sale_mode === mode ? 'default' : 'outline'}
                className="h-12"
                onClick={() => setFormData(prev => ({ ...prev, sale_mode: mode }))}
              >
                {mode === 'Online' ? (
                  <Globe className="h-4 w-4 mr-2" />
                ) : (
                  <Store className="h-4 w-4 mr-2" />
                )}
                {mode}
              </Button>
            ))}
          </div>
        </div>

        {/* Customer Section */}
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <User className="h-4 w-4" />
            Customer
          </h3>

          <div className="space-y-2">
            <Label htmlFor="mobile">Mobile Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="mobile"
                type="tel"
                inputMode="numeric"
                value={customerSearch}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setCustomerSearch(value);
                  setFormData(prev => ({ ...prev, customer_mobile: value }));
                }}
                placeholder="Enter 10-digit mobile"
                className="pl-9"
              />
              {searchingCustomer && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
              )}
            </div>
          </div>

          {foundCustomer && (
            <div className="p-3 rounded-lg bg-success/10 border border-success/30 flex items-center gap-2">
              <Check className="h-4 w-4 text-success" />
              <div>
                <p className="font-medium text-sm">{foundCustomer.name}</p>
                <p className="text-xs text-muted-foreground">
                  Returning customer • {formatCurrency(foundCustomer.total_spent)} spent
                </p>
              </div>
            </div>
          )}

          {customerSearch.length === 10 && !foundCustomer && !searchingCustomer && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="customer_name">Customer Name</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                  placeholder="Enter customer name"
                />
              </div>
            </div>
          )}

          {/* Email - Always visible */}
          <div className="space-y-2">
            <Label htmlFor="customer_email">Email (optional)</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="customer_email"
                type="email"
                value={formData.customer_email}
                onChange={(e) => setFormData(prev => ({ ...prev, customer_email: e.target.value }))}
                placeholder="customer@email.com"
                className="pl-9"
              />
            </div>
          </div>
        </div>

        {/* Product Selection */}
        <div className="space-y-4">
          <h3 className="font-semibold">Product</h3>

          <div className="space-y-2">
            <Label htmlFor="product">Select Product *</Label>
            <Select
              value={formData.product_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, product_id: value, size: '' }))}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Choose a product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    <div className="flex justify-between items-center w-full">
                      <span>{product.name}</span>
                      <span className="text-muted-foreground ml-2">
                        {formatCurrency(product.selling_price)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Size Selection */}
          {selectedProduct && (
            <div className="space-y-2">
              <Label>Size *</Label>
              <div className="grid grid-cols-4 gap-2">
                {sizes.map((size) => {
                  const stock = selectedProduct.size_inventory?.[size] || 0;
                  const isOutOfStock = stock === 0;
                  
                  return (
                    <Button
                      key={size}
                      type="button"
                      variant={formData.size === size ? 'default' : 'outline'}
                      className={cn(
                        "h-12 flex-col",
                        isOutOfStock && "opacity-50"
                      )}
                      onClick={() => !isOutOfStock && setFormData(prev => ({ ...prev, size }))}
                      disabled={isOutOfStock}
                    >
                      <span className="font-semibold">{size}</span>
                      <span className={cn(
                        "text-xs",
                        isOutOfStock ? "text-destructive" : "text-muted-foreground"
                      )}>
                        {isOutOfStock ? 'Out' : stock}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-12 w-12"
                onClick={() => setFormData(prev => ({ 
                  ...prev, 
                  quantity: Math.max(1, prev.quantity - 1) 
                }))}
              >
                -
              </Button>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={availableStock || undefined}
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  quantity: Math.max(1, parseInt(e.target.value) || 1) 
                }))}
                className="h-12 text-center text-lg font-semibold"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-12 w-12"
                onClick={() => setFormData(prev => ({ 
                  ...prev, 
                  quantity: Math.min(prev.quantity + 1, availableStock || prev.quantity + 1) 
                }))}
              >
                +
              </Button>
            </div>
            {formData.size && availableStock > 0 && (
              <p className="text-xs text-muted-foreground">
                {availableStock} available in size {formData.size}
              </p>
            )}
          </div>
        </div>

        {/* Payment Mode */}
        <div className="space-y-4">
          <h3 className="font-semibold">Payment</h3>
          <div className="grid grid-cols-3 gap-2">
            {(['Cash', 'UPI', 'Card'] as PaymentMode[]).map((mode) => (
              <Button
                key={mode}
                type="button"
                variant={formData.payment_mode === mode ? 'default' : 'outline'}
                className="h-12"
                onClick={() => setFormData(prev => ({ ...prev, payment_mode: mode }))}
              >
                {mode}
              </Button>
            ))}
          </div>
        </div>

        {/* Summary */}
        {calculations && (
          <div className="space-y-3 p-4 rounded-xl bg-secondary/50 border">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatCurrency(calculations.saleAmount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Profit</span>
              <span className="font-medium text-profit">{formatCurrency(calculations.profit)}</span>
            </div>
            <div className="flex justify-between items-center border-t pt-3">
              <span className="text-muted-foreground">Charity ({calculations.charityPercentage}% of profit)</span>
              <span className="font-medium text-success">{formatCurrency(calculations.charityAmount)}</span>
            </div>
            <div className="flex justify-between items-center border-t pt-3">
              <span className="font-semibold">Total</span>
              <span className="text-xl font-bold">{formatCurrency(calculations.saleAmount)}</span>
            </div>
          </div>
        )}

        {/* Submit */}
        <Button 
          type="submit" 
          className="w-full h-14 text-base"
          disabled={!formData.product_id || !formData.size || saving}
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Recording Sale...
            </>
          ) : (
            <>
              <Check className="mr-2 h-5 w-5" />
              Complete Sale
            </>
          )}
        </Button>
      </form>
    </AppLayout>
  );
}
