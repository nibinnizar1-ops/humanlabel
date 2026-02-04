import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Product, Customer, Size, SaleMode } from '@/lib/supabase';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Check, User, Phone, Mail, Globe, Store, Search, Package, X } from 'lucide-react';
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
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const productDropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    product_id: '',
    quantity: 1,
    size: '' as Size | '',
    payment_mode: 'Cash' as PaymentMode,
    sale_mode: 'Offline' as SaleMode,
    customer_name: '',
    customer_mobile: '',
    customer_email: '',
    discount_amount: 0,
    discount_percentage: 0,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        productDropdownRef.current &&
        !productDropdownRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('#product')
      ) {
        setShowProductDropdown(false);
      }
    };

    if (showProductDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProductDropdown]);

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
  
  // Filter products based on search query
  const filteredProducts = products.filter(product => {
    if (!productSearchQuery) return true;
    const query = productSearchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      product.sku.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query)
    );
  });
  
  // Check available stock for selected size
  const availableStock = selectedProduct && formData.size
    ? (selectedProduct.size_inventory?.[formData.size] || 0)
    : 0;
  
  const calculations = selectedProduct ? (() => {
    const subtotal = selectedProduct.selling_price * formData.quantity;
    const discountAmt = formData.discount_percentage > 0 
      ? (subtotal * formData.discount_percentage) / 100 
      : formData.discount_amount;
    const finalAmount = subtotal - discountAmt;
    const costAmount = selectedProduct.cost_price * formData.quantity;
    const profit = finalAmount - costAmount;
    const charityAmount = Math.max(0, (profit * selectedProduct.charity_percentage) / 100);
    
    return {
      unitPrice: selectedProduct.selling_price,
      subtotal,
      discountAmount: discountAmt,
      saleAmount: finalAmount,
      costAmount,
      profit,
      charityAmount,
      charityPercentage: selectedProduct.charity_percentage,
    };
  })() : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct || !calculations) {
      toast.error('Please select a product');
      return;
    }

    if (!formData.size) {
      toast.error('Please select a size (M, L, XL, or XXL)');
      return;
    }

    if (availableStock < formData.quantity) {
      toast.error(`Insufficient stock! Only ${availableStock} units available in size ${formData.size}`);
      return;
    }

    // Validate discount doesn't exceed subtotal
    if (calculations && calculations.discountAmount > calculations.subtotal) {
      toast.error('Discount cannot exceed subtotal amount');
      return;
    }

    if (calculations && calculations.saleAmount < 0) {
      toast.error('Final amount cannot be negative. Please reduce the discount.');
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
      const { data: saleData, error: saleError } = await supabase
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
          discount_amount: calculations.discountAmount,
          discount_percentage: formData.discount_percentage,
          sale_date: new Date().toISOString(), // Explicitly set sale date
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Update product inventory - reduce the sold size by quantity
      const currentInventory = selectedProduct.size_inventory || { M: 0, L: 0, XL: 0, XXL: 0 };
      const updatedInventory = {
        ...currentInventory,
        [formData.size]: Math.max(0, (currentInventory[formData.size] || 0) - formData.quantity),
      };

      const { error: inventoryError } = await supabase
        .from('products')
        .update({ 
          size_inventory: updatedInventory,
          updated_at: new Date().toISOString(),
        })
        .eq('id', formData.product_id);

      if (inventoryError) {
        console.error('Error updating inventory:', inventoryError);
        toast.error('Sale recorded but inventory update failed. Please update manually.');
      }

      // Update customer totals if customer exists
      if (customerId) {
        const { data: customerData } = await supabase
          .from('customers')
          .select('total_spent, total_charity')
          .eq('id', customerId)
          .single();

        if (customerData) {
          const newTotalSpent = (customerData.total_spent || 0) + calculations.saleAmount;
          const newTotalCharity = (customerData.total_charity || 0) + calculations.charityAmount;

          await supabase
            .from('customers')
            .update({
              total_spent: newTotalSpent,
              total_charity: newTotalCharity,
              updated_at: new Date().toISOString(),
            })
            .eq('id', customerId);
        }
      }

      toast.success('Sale recorded successfully!', {
        description: `₹${calculations.saleAmount.toLocaleString()} | ₹${calculations.charityAmount.toFixed(0)} to charity | Stock updated`,
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
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="product"
                type="text"
                placeholder="Search products by name, SKU, or category..."
                value={productSearchQuery}
                onChange={(e) => {
                  setProductSearchQuery(e.target.value);
                  setShowProductDropdown(true);
                }}
                onFocus={() => setShowProductDropdown(true)}
                className="pl-9 pr-9 h-12"
              />
              {productSearchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => {
                    setProductSearchQuery('');
                    setShowProductDropdown(false);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Selected Product Display */}
            {selectedProduct && !showProductDropdown && (
              <div 
                className="p-3 rounded-lg border-2 border-primary bg-primary/5 flex items-center gap-3 cursor-pointer hover:bg-primary/10 transition-colors"
                onClick={() => {
                  setShowProductDropdown(true);
                  setProductSearchQuery('');
                }}
              >
                <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {selectedProduct.images?.[0] || selectedProduct.image_url ? (
                    <img 
                      src={selectedProduct.images?.[0] || selectedProduct.image_url || ''} 
                      alt={selectedProduct.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Package className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{selectedProduct.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedProduct.sku}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold">{formatCurrency(selectedProduct.selling_price)}</p>
                  <p className="text-xs text-muted-foreground">{selectedProduct.category}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFormData(prev => ({ ...prev, product_id: '', size: '' }));
                    setProductSearchQuery('');
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Product Dropdown/List */}
            {showProductDropdown && (
              <div 
                ref={productDropdownRef}
                className="border rounded-lg bg-background max-h-64 overflow-y-auto shadow-lg z-10"
              >
                {filteredProducts.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No products found</p>
                    {productSearchQuery && (
                      <p className="text-xs mt-1">Try a different search term</p>
                    )}
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {filteredProducts.map((product) => {
                      const isSelected = formData.product_id === product.id;
                      const totalStock = product.size_inventory 
                        ? Object.values(product.size_inventory).reduce((sum: number, qty: number) => sum + (qty || 0), 0)
                        : 0;
                      
                      return (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, product_id: product.id, size: '' }));
                            setShowProductDropdown(false);
                            setProductSearchQuery('');
                          }}
                          className={cn(
                            "w-full p-3 rounded-lg flex items-center gap-3 text-left transition-colors",
                            isSelected 
                              ? "bg-primary/10 border-2 border-primary" 
                              : "hover:bg-secondary border-2 border-transparent"
                          )}
                        >
                          {/* Product Image */}
                          <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {product.images?.[0] || product.image_url ? (
                              <img 
                                src={product.images?.[0] || product.image_url || ''} 
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Package className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className={cn(
                                  "font-medium truncate",
                                  isSelected && "text-primary"
                                )}>
                                  {product.name}
                                </p>
                                <p className="text-xs text-muted-foreground">{product.sku}</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="font-semibold text-sm">{formatCurrency(product.selling_price)}</p>
                                <p className="text-xs text-muted-foreground">
                                  {totalStock} in stock
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs px-2 py-0.5 rounded bg-secondary">
                                {product.category}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {product.charity_percentage}% charity
                      </span>
                    </div>
                          </div>

                          {isSelected && (
                            <Check className="h-5 w-5 text-primary flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {!selectedProduct && !showProductDropdown && (
              <p className="text-xs text-muted-foreground">
                Start typing to search for products or click to browse
              </p>
            )}
          </div>

          {/* Size Selection */}
          {selectedProduct && (
            <div className="space-y-2">
              <Label className="text-base font-semibold">Select Size *</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Choose the size for this sale. Stock will be automatically reduced.
              </p>
              <div className="grid grid-cols-4 gap-2">
                {sizes.map((size) => {
                  const stock = selectedProduct.size_inventory?.[size] || 0;
                  const isOutOfStock = stock === 0;
                  const isSelected = formData.size === size;
                  
                  return (
                    <Button
                      key={size}
                      type="button"
                      variant={isSelected ? 'default' : 'outline'}
                      className={cn(
                        "h-14 sm:h-16 flex-col gap-1 transition-all",
                        isOutOfStock && "opacity-50 cursor-not-allowed",
                        isSelected && "ring-2 ring-primary ring-offset-2"
                      )}
                      onClick={() => {
                        if (!isOutOfStock) {
                          setFormData(prev => ({ ...prev, size }));
                        }
                      }}
                      disabled={isOutOfStock}
                    >
                      <span className="font-bold text-base sm:text-lg">{size}</span>
                      <span className={cn(
                        "text-xs font-medium",
                        isOutOfStock ? "text-destructive" : isSelected ? "text-primary-foreground" : "text-muted-foreground"
                      )}>
                        {isOutOfStock ? 'Out of Stock' : `${stock} available`}
                      </span>
                    </Button>
                  );
                })}
              </div>
              {formData.size && (
                <div className="mt-2 p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm font-medium text-primary">
                    Selected: {formData.size} • {availableStock} units available
                  </p>
                </div>
              )}
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
            {formData.size && (
              <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                {availableStock} available in size {formData.size}
              </p>
                {formData.quantity > availableStock && (
                  <p className="text-xs text-destructive font-medium">
                    ⚠️ Quantity exceeds available stock!
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Discount/Offer */}
        {selectedProduct && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
            <h3 className="font-semibold">Discount/Offer</h3>
              {calculations && calculations.discountAmount > 0 && (
                <span className="text-sm font-medium text-success">
                  Saving: {formatCurrency(calculations.discountAmount)}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Revenue, profit, and charity are calculated on the discounted amount (collected amount).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="discount_amount" className="text-sm font-medium">
                  Flat Discount Amount (₹)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                <Input
                  id="discount_amount"
                  type="number"
                  min="0"
                    step="0.01"
                    max={calculations?.subtotal || undefined}
                  value={formData.discount_amount || ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      const maxDiscount = calculations?.subtotal || 0;
                      setFormData(prev => ({ 
                    ...prev, 
                        discount_amount: Math.min(value, maxDiscount),
                    discount_percentage: 0 // Clear % when flat is used
                      }));
                    }}
                  placeholder="e.g. 200"
                    className="h-12 pl-8"
                  disabled={formData.discount_percentage > 0}
                />
                </div>
                {calculations && formData.discount_amount > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {((formData.discount_amount / calculations.subtotal) * 100).toFixed(1)}% off
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount_percentage" className="text-sm font-medium">
                  Discount Percentage (%)
                </Label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                <Input
                  id="discount_percentage"
                  type="number"
                  min="0"
                  max="100"
                    step="0.1"
                  value={formData.discount_percentage || ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      setFormData(prev => ({ 
                    ...prev, 
                        discount_percentage: Math.min(value, 100),
                    discount_amount: 0 // Clear flat when % is used
                      }));
                    }}
                  placeholder="e.g. 10"
                    className="h-12 pr-8"
                  disabled={formData.discount_amount > 0}
                />
                </div>
                {calculations && formData.discount_percentage > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency((calculations.subtotal * formData.discount_percentage) / 100)} off
                  </p>
                )}
              </div>
            </div>
            {calculations && calculations.discountAmount > 0 && (
              <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
                <p className="text-sm font-medium text-warning mb-1">
                  ⚠️ Discount Applied
                </p>
                <p className="text-xs text-muted-foreground">
                  All calculations (Revenue, Profit, Charity) are based on the discounted amount: {formatCurrency(calculations.saleAmount)}
                </p>
              </div>
            )}
          </div>
        )}

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
            <h3 className="font-semibold text-sm mb-2">Sale Summary</h3>
            
            {/* Price Breakdown */}
            <div className="space-y-2 pb-2 border-b">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Unit Price</span>
                <span className="font-medium">{formatCurrency(calculations.unitPrice)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Quantity</span>
                <span className="font-medium">× {formData.quantity}</span>
              </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatCurrency(calculations.subtotal)}</span>
            </div>
            {calculations.discountAmount > 0 && (
              <div className="flex justify-between items-center text-destructive">
                  <span className="text-sm font-medium">Discount</span>
                  <span className="font-semibold">-{formatCurrency(calculations.discountAmount)}</span>
                </div>
              )}
            </div>

            {/* Revenue (Collected Amount) */}
            <div className="flex justify-between items-center pt-2">
              <div>
                <span className="text-sm font-semibold">Revenue (Collected Amount)</span>
                <p className="text-xs text-muted-foreground">
                  {calculations.discountAmount > 0 ? 'After discount' : 'Full amount'}
                </p>
              </div>
              <span className="text-lg font-bold text-success">{formatCurrency(calculations.saleAmount)}</span>
            </div>

            {/* Cost & Profit */}
            <div className="space-y-2 pt-2 border-t">
            <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Cost Price</span>
                <span className="font-medium">{formatCurrency(calculations.costAmount)}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-sm font-semibold">Profit</span>
                <span className={cn(
                  "text-base font-bold",
                  calculations.profit >= 0 ? "text-profit" : "text-destructive"
                )}>
                  {formatCurrency(calculations.profit)}
                </span>
              </div>
              {calculations.profit < 0 && (
                <p className="text-xs text-destructive">
                  ⚠️ Loss: Discount exceeds profit margin
                </p>
              )}
            </div>

            {/* Charity Contribution */}
            <div className="flex justify-between items-center pt-2 border-t">
              <div>
                <span className="text-sm font-semibold">Charity Contribution</span>
                <p className="text-xs text-muted-foreground">
                  {calculations.charityPercentage}% of profit
                  {calculations.discountAmount > 0 && ' (calculated on discounted amount)'}
                </p>
              </div>
              <span className="text-base font-bold text-success">{formatCurrency(calculations.charityAmount)}</span>
            </div>

            {/* Total to Collect */}
            <div className="flex justify-between items-center pt-3 border-t-2 border-primary/20">
              <span className="font-semibold text-base">Total to Collect</span>
              <span className="text-2xl font-bold">{formatCurrency(calculations.saleAmount)}</span>
            </div>

            {/* Calculation Note */}
            {calculations.discountAmount > 0 && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground italic">
                  💡 Note: Revenue ({formatCurrency(calculations.saleAmount)}), Profit ({formatCurrency(calculations.profit)}), 
                  and Charity ({formatCurrency(calculations.charityAmount)}) are all calculated based on the discounted amount collected.
                </p>
              </div>
            )}
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
