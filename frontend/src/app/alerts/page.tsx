'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { productApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, AlertTriangle, ArrowUpCircle, Eye, ShoppingBag } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProductViewModal } from '@/components/product/ProductViewModal';
import { RestockModal } from '@/components/product/RestockModal';

export default function AlertsPage() {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const fetchLowStockProducts = async () => {
    try {
      setLoading(true);
      const data = await productApi.getLowStockProducts(currentUser);
      setProducts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch low stock products');
      console.error('Error fetching low stock products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchLowStockProducts();
    }
  }, [currentUser]);

  // Open view modal with product details
  const openViewModal = (productId: string) => {
    setSelectedProductId(productId);
    setIsViewModalOpen(true);
  };

  // Open restock modal for a product
  const openRestockModal = (productId: string) => {
    setSelectedProductId(productId);
    setIsRestockModalOpen(true);
  };

  // Close view modal
  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedProductId(null);
  };

  // Close restock modal
  const closeRestockModal = () => {
    setIsRestockModalOpen(false);
    setSelectedProductId(null);
  };

  // Handle successful restock
  const handleRestockSuccess = () => {
    fetchLowStockProducts();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Low Stock Alerts</h1>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <CardTitle>Items Requiring Attention</CardTitle>
            </div>
            <CardDescription>
              Products that are below their minimum stock level and need to be restocked.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-zinc-900"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="bg-green-100 p-3 rounded-full mb-4">
                  <ArrowUpCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-medium mb-1">All Stocked Up!</h3>
                <p className="text-zinc-500 max-w-md">
                  There are currently no products below their minimum stock level. Your inventory is in good shape.
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Current Stock</TableHead>
                      <TableHead className="text-right">Min. Level</TableHead>
                      <TableHead className="text-right">Restock Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product._id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.sku}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell className="text-right">
                          <span className={product.quantity === 0 ? 'text-red-600 font-medium' : ''}>
                            {product.quantity}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">{product.minStockLevel}</TableCell>
                        <TableCell className="text-right">
                          {Math.max(product.minStockLevel - product.quantity, 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openViewModal(product._id)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openRestockModal(product._id)}
                              className="text-green-600 hover:bg-green-50 hover:text-green-700"
                              title="Restock Product"
                            >
                              <ShoppingBag className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Product View Modal */}
      <ProductViewModal 
        isOpen={isViewModalOpen}
        onClose={closeViewModal}
        productId={selectedProductId}
      />

      {/* Restock Modal */}
      <RestockModal 
        isOpen={isRestockModalOpen}
        onClose={closeRestockModal}
        productId={selectedProductId}
        onRestock={handleRestockSuccess}
      />
    </DashboardLayout>
  );
} 