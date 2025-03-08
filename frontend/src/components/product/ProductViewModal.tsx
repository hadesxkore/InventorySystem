'use client';

import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { productApi } from '@/services/api';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-sonner';

export interface Product {
  _id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  quantity: number;
  unit: string;
  minStockLevel: number;
  location: string;
  supplier: string;
  sku: string;
  createdAt: string;
  updatedAt: string;
}

type ProductViewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  productId: string | null;
};

export function ProductViewModal({ isOpen, onClose, productId }: ProductViewModalProps) {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);

  // Fetch product data when modal opens
  useEffect(() => {
    if (isOpen && productId && currentUser) {
      const fetchProductData = async () => {
        try {
          setLoading(true);
          const data = await productApi.getProduct(currentUser, productId);
          setProduct(data);
        } catch (error) {
          console.error('Error fetching product:', error);
          toast.error('Failed to load product details');
        } finally {
          setLoading(false);
        }
      };

      fetchProductData();
    }
  }, [productId, isOpen, currentUser, toast]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : product ? (
          <>
            <DialogHeader>
              <DialogTitle>Product Details</DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium text-right">Name:</div>
                <div className="col-span-3">{product.name}</div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium text-right">Description:</div>
                <div className="col-span-3">{product.description}</div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium text-right">Category:</div>
                <div className="col-span-3">{product.category}</div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium text-right">SKU:</div>
                <div className="col-span-3">{product.sku}</div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium text-right">Price:</div>
                <div className="col-span-3">${product.price.toFixed(2)}</div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium text-right">Quantity:</div>
                <div className="col-span-3">
                  <span className={product.quantity <= product.minStockLevel ? 'text-red-600 font-medium' : ''}>
                    {product.quantity} {product.unit}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium text-right">Min. Stock Level:</div>
                <div className="col-span-3">{product.minStockLevel}</div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium text-right">Location:</div>
                <div className="col-span-3">{product.location}</div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium text-right">Supplier:</div>
                <div className="col-span-3">{product.supplier}</div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium text-right">Created:</div>
                <div className="col-span-3">
                  {new Date(product.createdAt).toLocaleString()}
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium text-right">Last Updated:</div>
                <div className="col-span-3">
                  {new Date(product.updatedAt).toLocaleString()}
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button onClick={onClose}>Close</Button>
            </DialogFooter>
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