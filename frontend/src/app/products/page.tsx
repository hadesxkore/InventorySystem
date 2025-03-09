'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { productApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Plus, Search, Filter, ArrowUpDown, Eye, Edit, Trash } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { ProductModal } from '@/components/product/ProductModal';
import { confirm } from '@/components/ui/sonner-confirm';
import { toast } from 'sonner';

// Define proper interfaces for type safety
interface Product {
  _id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  price: number;
  minStockLevel: number;
  createdAt: string;
  updatedAt: string;
  // Add other product properties as needed
}

interface Pagination {
  total: number;
  page: number;
  pages: number;
  limit: number;
}

export default function ProductsPage() {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    pages: 1,
    limit: 10,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [stockStatus, setStockStatus] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  
  // Fetch products with filters
  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      const response = await productApi.getProducts(currentUser, {
        search,
        category: category === 'all' ? undefined : category,
        stockStatus: stockStatus === 'all' ? undefined : stockStatus,
        sortBy,
        sortOrder,
        page,
        limit: 10,
      });
      
      // Ensure we have valid data
      if (response && response.products) {
        setProducts(response.products || []);
        setPagination(response.pagination || {
          total: 0,
          page: 1,
          pages: 1,
          limit: 10,
        });
      } else {
        // Handle missing data
        setProducts([]);
        setPagination({
          total: 0,
          page: 1,
          pages: 1,
          limit: 10,
        });
        setError('Invalid response format from server');
      }
    } catch (err: unknown) {
      console.error('Error fetching products:', err);
      setProducts([]);
      setPagination({
        total: 0,
        page: 1,
        pages: 1,
        limit: 10,
      });
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Initial fetch
  useEffect(() => {
    if (currentUser) {
      fetchProducts();
    }
  }, [currentUser, fetchProducts]);
  
  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts(1);
  };
  
  // Handle filter changes
  useEffect(() => {
    if (currentUser && !loading) {
      const timer = setTimeout(() => {
        fetchProducts(1);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [category, stockStatus, sortBy, sortOrder, currentUser, fetchProducts, loading]);
  
  // Handle pagination
  const handlePageChange = (newPage: number) => {
    fetchProducts(newPage);
  };
  
  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  // Open modal with product details
  const openProductModal = (productId: string) => {
    setSelectedProductId(productId);
    setIsModalOpen(true);
  };

  // Close modal
  const closeProductModal = () => {
    setIsModalOpen(false);
    setSelectedProductId(null);
    setEditMode(false);
  };

  // Refresh products after update or delete
  const handleProductUpdated = () => {
    fetchProducts(pagination.page);
  };

  // Handle product deletion
  const handleDeleteProduct = (productId: string, productName: string) => {
    confirm({
      title: "Delete Product",
      description: `Are you sure you want to delete "${productName}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          setLoading(true);
          await productApi.deleteProduct(currentUser, productId);
          toast.success(`${productName} has been deleted`);
          handleProductUpdated();
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          toast.error(`Failed to delete: ${errorMessage}`);
          console.error('Error deleting product:', err);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Products</h1>
          {currentUser?.role === 'admin' && (
            <Link href="/products/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </Link>
          )}
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Product Inventory</CardTitle>
            <CardDescription>
              Manage your inventory items, track stock levels, and update product information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search and filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                  <Input
                    placeholder="Search by name or SKU..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" variant="outline">
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </form>
                
                <div className="flex gap-2">
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-[150px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="electronics">Electronics</SelectItem>
                      <SelectItem value="clothing">Clothing</SelectItem>
                      <SelectItem value="food">Food & Beverage</SelectItem>
                      <SelectItem value="office">Office Supplies</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={stockStatus} onValueChange={setStockStatus}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Stock Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stock</SelectItem>
                      <SelectItem value="in-stock">In Stock</SelectItem>
                      <SelectItem value="low-stock">Low Stock</SelectItem>
                      <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Error message */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {/* Products table */}
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-zinc-900"></div>
                </div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">SKU</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">
                            <Button variant="ghost" size="sm" onClick={toggleSortOrder}>
                              Price
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          </TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-zinc-500">
                              No products found
                            </TableCell>
                          </TableRow>
                        ) : (
                          products.map((product) => (
                            <TableRow key={product._id}>
                              <TableCell className="font-medium">{product.sku}</TableCell>
                              <TableCell>{product.name}</TableCell>
                              <TableCell>{product.category}</TableCell>
                              <TableCell className="text-right">${product.price.toFixed(2)}</TableCell>
                              <TableCell className="text-right">{product.quantity}</TableCell>
                              <TableCell className="text-right">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs ${
                                    product.quantity <= 0
                                      ? 'bg-red-100 text-red-800'
                                      : product.quantity <= product.minStockLevel
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-green-100 text-green-800'
                                  }`}
                                >
                                  {product.quantity <= 0
                                    ? 'Out of Stock'
                                    : product.quantity <= product.minStockLevel
                                    ? 'Low Stock'
                                    : 'In Stock'}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => openProductModal(product._id)}
                                    title="View Details"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      setSelectedProductId(product._id);
                                      setEditMode(true);
                                      setIsModalOpen(true);
                                    }}
                                    title="Edit Product"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleDeleteProduct(product._id, product.name)}
                                    className="text-red-500 hover:bg-red-50"
                                    title="Delete Product"
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Pagination */}
                  {pagination.pages > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                      >
                        Previous
                      </Button>
                      <span className="flex items-center px-2">
                        Page {pagination.page} of {pagination.pages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.pages}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Modal */}
      <ProductModal 
        isOpen={isModalOpen}
        onClose={closeProductModal}
        productId={selectedProductId}
        onProductUpdated={handleProductUpdated}
        editMode={editMode}
      />
    </DashboardLayout>
  );
} 