import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { SizeInventory } from '@/lib/supabase';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SizeInventoryInputProps {
  value: SizeInventory;
  onChange: (value: SizeInventory) => void;
}

const sizes: (keyof SizeInventory)[] = ['M', 'L', 'XL', 'XXL'];

export function SizeInventoryInput({ value, onChange }: SizeInventoryInputProps) {
  const handleChange = (size: keyof SizeInventory, quantity: string) => {
    // If empty, keep as 0 internally but display as empty
    const num = quantity === '' ? 0 : parseInt(quantity) || 0;
    onChange({ ...value, [size]: Math.max(0, num) });
  };

  const totalStock = Object.values(value).reduce((sum, qty) => sum + qty, 0);
  const stockOutSizes = sizes.filter(size => value[size] === 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">Size Inventory</h4>
        <span className="text-sm text-muted-foreground">
          Total: {totalStock} units
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {sizes.map((size) => (
          <div key={size} className="space-y-1.5">
            <Label 
              htmlFor={`size-${size}`} 
              className={cn(
                "text-xs text-center block",
                value[size] === 0 && "text-muted-foreground"
              )}
            >
              {size}
            </Label>
            <Input
              id={`size-${size}`}
              type="number"
              min="0"
              placeholder=""
              value={value[size] === 0 ? '' : value[size]}
              onChange={(e) => handleChange(size, e.target.value)}
              className="text-center h-10"
            />
          </div>
        ))}
      </div>

      {stockOutSizes.length > 0 && stockOutSizes.length < 4 && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 text-destructive text-xs">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          <span>
            Stock out: {stockOutSizes.join(', ')}
          </span>
        </div>
      )}
    </div>
  );
}
