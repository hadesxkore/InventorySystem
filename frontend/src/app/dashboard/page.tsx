'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { reportApi } from '@/services/api';
import { AlertTriangle, Package, TrendingDown, TrendingUp, DollarSign, Plus } from 'lucide-react';
import Link from 'next/link';

// Define proper interfaces for type safety
interface CategoryDistribution {
  _id: string;
  count: number;
  value: number;
}

interface StockStatus {
  lowStock: number;
  outOfStock: number;
  inStock: number;
}

interface InventorySummary {
  totalProducts: number;
  totalValue: number;
  stockStatus: StockStatus;
  categoryDistribution: CategoryDistribution[];
}

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const [summaryData, setSummaryData] = useState<InventorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummaryData = async () => {
      try {
        setLoading(true);
        const data = await reportApi.getInventorySummary(currentUser);
        setSummaryData(data);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch inventory summary';
        setError(errorMessage);
        console.error('Error fetching inventory summary:', err);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchSummaryData();
    }
  }, [currentUser]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          {currentUser?.role === 'admin' && (
            <Link href="/products/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </Link>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-zinc-900"></div>
          </div>
        ) : error ? (
          <Card className="bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                  <Package className="h-4 w-4 text-zinc-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summaryData?.totalProducts || 0}</div>
                  <p className="text-xs text-zinc-500">Total items in inventory</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
                  <DollarSign className="h-4 w-4 text-zinc-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${summaryData?.totalValue?.toFixed(2) || '0.00'}
                  </div>
                  <p className="text-xs text-zinc-500">Total value of inventory</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                  <TrendingDown className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summaryData?.stockStatus?.lowStock || 0}</div>
                  <p className="text-xs text-zinc-500">Items below minimum stock level</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summaryData?.stockStatus?.outOfStock || 0}</div>
                  <p className="text-xs text-zinc-500">Items with zero quantity</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Category Distribution</CardTitle>
                  <CardDescription>
                    Breakdown of products by category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {summaryData?.categoryDistribution?.length > 0 ? (
                    <div className="space-y-4">
                      {summaryData?.categoryDistribution.map((category) => (
                        <div key={category._id} className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{category._id}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-zinc-500">{category.count} items</p>
                              <p className="text-xs text-zinc-500">
                                ${category.value.toFixed(2)}
                              </p>
                            </div>
                          </div>
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-zinc-100">
                            <div
                              className="h-full bg-zinc-700"
                              style={{
                                width: `${(category.count / (summaryData.totalProducts || 1)) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-zinc-500 text-sm">No category data available</p>
                  )}
                </CardContent>
              </Card>

              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Common inventory management tasks
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link href="/products">
                    <Button variant="outline" className="w-full justify-start">
                      <Package className="mr-2 h-4 w-4" />
                      View All Products
                    </Button>
                  </Link>
                  <Link href="/alerts">
                    <Button variant="outline" className="w-full justify-start">
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      View Low Stock Alerts
                    </Button>
                  </Link>
                  <Link href="/reports">
                    <Button variant="outline" className="w-full justify-start">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Generate Reports
                    </Button>
                  </Link>
                  {currentUser?.role === 'admin' && (
                    <Link href="/products/new">
                      <Button variant="outline" className="w-full justify-start">
                        <Plus className="mr-2 h-4 w-4" />
                        Add New Product
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}