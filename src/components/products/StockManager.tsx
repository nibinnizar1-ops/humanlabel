import { useState } from 'react';
import { supabase, SizeInventory } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, PackagePlus } from 'lucide-react';
import { toast } from 'sonner';

interface StockManagerProps {
  productId: string;
  productName: string;
  currentInventory: SizeInventory;
  onStockUpdated: () => void;
}

export function StockManager({ 
  productId, 
  productName, 
  currentInventory, 
  onStockUpdated 
}: StockManagerProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stockToAdd, setStockToAdd] = useState<SizeInventory>({
    M: 0,
    L: 0,
    XL: 0,
    XXL: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if at least one size has stock to add
    const totalToAdd = Object.values(stockToAdd).reduce((sum, val) => sum + val, 0);
    if (totalToAdd === 0) {
      toast.error('Please enter stock quantity for at least one size');
      return;
    }

    setSaving(true);

    try {
      // Calculate new inventory
      const updatedInventory: SizeInventory = {
        M: (currentInventory.M || 0) + stockToAdd.M,
        L: (currentInventory.L || 0) + stockToAdd.L,
        XL: (currentInventory.XL || 0) + stockToAdd.XL,
        XXL: (currentInventory.XXL || 0) + stockToAdd.XXL,
      };

      const { error } = await supabase
        .from('products')
        .update({
          size_inventory: updatedInventory,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId);

      if (error) throw error;

      toast.success('Stock updated successfully');
      setOpen(false);
      setStockToAdd({ M: 0, L: 0, XL: 0, XXL: 0 });
      onStockUpdated();
    } catch (error: any) {
      console.error('Error updating stock:', error);
      toast.error(error.message || 'Failed to update stock');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className="gap-2"
      >
        <PackagePlus className="h-4 w-4" />
        <span className="hidden sm:inline">Add Stock</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Stock - {productName}</DialogTitle>
            <DialogDescription>
              Enter the quantity to add for each size. Current stock is shown in parentheses.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {(['M', 'L', 'XL', 'XXL'] as const).map((size) => (
                <div key={size} className="space-y-2">
                  <Label htmlFor={`stock-${size}`}>
                    Size {size} (Current: {currentInventory[size] || 0})
                  </Label>
                  <Input
                    id={`stock-${size}`}
                    type="number"
                    min="0"
                    value={stockToAdd[size] || ''}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      setStockToAdd({ ...stockToAdd, [size]: value });
                    }}
                    placeholder="0"
                    className="h-10"
                  />
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="bg-accent hover:bg-accent/90">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <PackagePlus className="mr-2 h-4 w-4" />
                    Update Stock
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

