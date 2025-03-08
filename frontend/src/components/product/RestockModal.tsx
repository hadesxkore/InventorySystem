'use client';

import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { productApi } from '@/services/api';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-sonner';
import { toast } from 'sonner';

interface Product {
  _id: string;
  name: string;
  quantity: number;
  minStockLevel: number;
  unit: string;
}

type RestockModalProps = {
  isOpen: boolean;
  onClose: () => void;
  productId: string | null;
  onRestock?: () => void;
};

export function RestockModal({ 
  isOpen, 
  onClose, 
  productId,
  onRestock
}: RestockModalProps) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  
  // Form state
  const [quantity, setQuantity] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [type, setType] = useState<'stock-in' | 'stock-out' | 'adjustment' | 'return'>('stock-in');
  
  // Calculate suggested restock amount
  const suggestedAmount = product ? Math.max(product.minStockLevel - product.quantity, 0) : 0;

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuantity(0);
      setReason('Restock low inventory');
      setReference('');
      setType('stock-in');
    }
  }, [isOpen]);

  // Fetch product data when modal opens
  useEffect(() => {
    if (isOpen && productId && currentUser) {
      const fetchProductData = async () => {
        try {
          setLoading(true);
          const data = await productApi.getProduct(currentUser, productId);
          setProduct(data);
          // Set suggested restock amount
          setQuantity(Math.max(data.minStockLevel - data.quantity, 0));
        } catch (error) {
          console.error('Error fetching product:', error);
          toast.error('Failed to load product details');
        } finally {
          setLoading(false);
        }
      };

      fetchProductData();
    }
  }, [productId, isOpen, currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!productId || !product) return;
    
    try {
      setSubmitting(true);
      
      await productApi.updateStock(currentUser, productId, {
        quantity,
        type,
        reason,
        reference
      });
      
      toast.success('Product restocked successfully');
      
      // Close modal and trigger refresh
      onClose();
      if (onRestock) {
        onRestock();
      }
    } catch (error) {
      console.error('Error restocking product:', error);
      toast.error('Failed to restock product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : product ? (
          <>
            <DialogHeader>
              <DialogTitle>Restock: {product.name}</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div>
                <Label htmlFor="current-stock">Current Stock</Label>
                <Input 
                  id="current-stock" 
                  value={`${product.quantity} ${product.unit}`} 
                  disabled 
                  className="bg-muted"
                />
              </div>
              
              <div>
                <div className="flex justify-between items-end mb-1.5">
                  <Label htmlFor="quantity">Quantity to Add</Label>
                  <span className="text-xs text-muted-foreground">
                    Suggested: {suggestedAmount} {product.unit}
                  </span>
                </div>
                <Input 
                  id="quantity" 
                  type="number" 
                  value={quantity} 
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  min="1"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="type">Transaction Type</Label>
                <Select 
                  value={type} 
                  onValueChange={(value) => setType(value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stock-in">Stock In</SelectItem>
                    <SelectItem value="return">Return</SelectItem>
                    <SelectItem value="adjustment">Adjustment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="reason">Reason</Label>
                <Textarea 
                  id="reason" 
                  value={reason} 
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason for restocking"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="reference">Reference (Optional)</Label>
                <Input 
                  id="reference" 
                  value={reference} 
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Invoice or PO number"
                />
              </div>
            
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || quantity <= 0}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Restock
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <div className="flex justify-center items-center h-40">
            <p>Product not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 