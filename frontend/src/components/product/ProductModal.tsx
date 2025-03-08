'use client';

import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-sonner';
import { useAuth } from '@/contexts/AuthContext';
import { productApi } from '@/services/api';
import { Loader2, Save, Trash } from 'lucide-react';
import { confirm } from '@/components/ui/sonner-confirm';

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

type ProductModalProps = {
  isOpen: boolean;
  onClose: () => void;
  productId: string | null;
  onProductUpdated?: () => void;
  editMode?: boolean;
};

export function ProductModal({ 
  isOpen, 
  onClose, 
  productId, 
  onProductUpdated,
  editMode = false
}: ProductModalProps) {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({});

  // Fetch product data when modal opens
  useEffect(() => {
    const fetchProductData = async () => {
      if (!productId || !isOpen) return;
      
      try {
        setLoading(true);
        const data = await productApi.getProduct(currentUser, productId);
        setProduct(data);
        setFormData(data);
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [productId, isOpen, currentUser, toast]);

  // Set initial mode based on editMode prop
  useEffect(() => {
    if (isOpen && editMode) {
      setMode('edit');
    } else if (isOpen) {
      setMode('view');
    }
  }, [isOpen, editMode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: parseFloat(value) || 0 });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      if (productId) {
        await productApi.updateProduct(currentUser, productId, formData);
        toast.success('Product updated successfully');
      } else {
        await productApi.createProduct(currentUser, formData);
        toast.success('Product created successfully');
      }
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!productId) return;
    
    try {
      setLoading(true);
      await productApi.deleteProduct(currentUser, productId);
      
      toast.success('Product deleted successfully');
      
      // Close the modal and refresh data
      onClose();
      if (onProductUpdated) {
        onProductUpdated();
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    } finally {
      setLoading(false);
    }
  };

  // New function to show delete confirmation
  const confirmDelete = () => {
    confirm({
      title: "Delete Product",
      description: "This will permanently delete this product. This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: handleDelete
    });
  };

  const toggleMode = () => {
    setMode(mode === 'view' ? 'edit' : 'view');
  };

  if (!currentUser) {
    console.error('No user found');
    toast.error('Authentication required');
    return;
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          {loading && !product ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : product ? (
            <>
              <DialogHeader>
                <DialogTitle>{mode === 'view' ? 'Product Details' : 'Edit Product'}</DialogTitle>
                <DialogDescription>
                  {mode === 'view' 
                    ? 'View detailed information about this product.'
                    : 'Make changes to product information and save when done.'}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      Product Name
                    </label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name || ''}
                      onChange={handleInputChange}
                      disabled={mode === 'view' || loading}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="sku" className="text-sm font-medium">
                      SKU
                    </label>
                    <Input
                      id="sku"
                      name="sku"
                      value={formData.sku || ''}
                      onChange={handleInputChange}
                      disabled={mode === 'view' || loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Description
                  </label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description || ''}
                    onChange={handleInputChange}
                    disabled={mode === 'view' || loading}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="category" className="text-sm font-medium">
                      Category
                    </label>
                    {mode === 'view' ? (
                      <Input
                        id="category"
                        value={formData.category || ''}
                        disabled
                      />
                    ) : (
                      <Select
                        value={formData.category || ''}
                        onValueChange={(value) => handleSelectChange('category', value)}
                        disabled={loading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Electronics">Electronics</SelectItem>
                          <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                          <SelectItem value="Furniture">Furniture</SelectItem>
                          <SelectItem value="Kitchen">Kitchen</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="price" className="text-sm font-medium">
                      Price
                    </label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      value={formData.price || 0}
                      onChange={handleNumberChange}
                      disabled={mode === 'view' || loading}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="quantity" className="text-sm font-medium">
                      Quantity
                    </label>
                    <Input
                      id="quantity"
                      name="quantity"
                      type="number"
                      value={formData.quantity || 0}
                      onChange={handleNumberChange}
                      disabled={mode === 'view' || loading}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="unit" className="text-sm font-medium">
                      Unit
                    </label>
                    <Input
                      id="unit"
                      name="unit"
                      value={formData.unit || ''}
                      onChange={handleInputChange}
                      disabled={mode === 'view' || loading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="minStockLevel" className="text-sm font-medium">
                      Min. Stock Level
                    </label>
                    <Input
                      id="minStockLevel"
                      name="minStockLevel"
                      type="number"
                      value={formData.minStockLevel || 0}
                      onChange={handleNumberChange}
                      disabled={mode === 'view' || loading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="location" className="text-sm font-medium">
                      Location
                    </label>
                    <Input
                      id="location"
                      name="location"
                      value={formData.location || ''}
                      onChange={handleInputChange}
                      disabled={mode === 'view' || loading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="supplier" className="text-sm font-medium">
                      Supplier
                    </label>
                    <Input
                      id="supplier"
                      name="supplier"
                      value={formData.supplier || ''}
                      onChange={handleInputChange}
                      disabled={mode === 'view' || loading}
                    />
                  </div>
                </div>

                {!loading && product && (
                  <div className="text-sm text-gray-500 pt-2">
                    <p>Created: {new Date(product.createdAt).toLocaleString()}</p>
                    {product.updatedAt && (
                      <p>Last Updated: {new Date(product.updatedAt).toLocaleString()}</p>
                    )}
                  </div>
                )}

                <DialogFooter className="gap-2 pt-4">
                  {currentUser?.role === 'admin' && (
                    <>
                      {mode === 'view' ? (
                        <>
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={confirmDelete}
                            disabled={loading}
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={toggleMode}
                            disabled={loading}
                          >
                            Edit
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={toggleMode}
                            disabled={loading}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            disabled={loading}
                          >
                            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </Button>
                        </>
                      )}
                    </>
                  )}
                  {currentUser?.role !== 'admin' && (
                    <Button
                      type="button"
                      onClick={onClose}
                    >
                      Close
                    </Button>
                  )}
                </DialogFooter>
              </form>
            </>
          ) : (
            <div className="py-6 text-center">
              <p>Could not load product information.</p>
              <Button 
                onClick={onClose}
                className="mt-4"
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
} 