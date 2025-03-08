'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { reportApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { 
  BarChart, Bar, PieChart, Pie, ResponsiveContainer, Cell, Tooltip, Legend, 
  XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { 
  Download, 
  Loader2, 
  FileText, 
  Printer, 
  ArrowLeft,
  Package,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  X 
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useReactToPrint } from 'react-to-print';
import { toast } from 'sonner';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

// Custom colors for the charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B', '#6B8E23', '#4682B4'];

export default function InventorySummaryPage() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const printComponentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const summaryData = await reportApi.getInventorySummary(currentUser);
        setData(summaryData);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch inventory summary');
        console.error('Error fetching inventory summary:', err);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  // Prepare data for the pie chart
  const prepareStockStatusData = () => {
    if (!data || !data.stockStatus) return [];
    
    return [
      { name: 'In Stock', value: data.stockStatus.inStock, color: '#10b981' },
      { name: 'Low Stock', value: data.stockStatus.lowStock, color: '#f59e0b' },
      { name: 'Out of Stock', value: data.stockStatus.outOfStock, color: '#ef4444' }
    ];
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  // Create the print function with react-to-print
  const reactToPrintContent = useReactToPrint({
    documentTitle: 'Inventory Summary Report',
    content: () => printComponentRef.current,
    onAfterPrint: () => toast.success('Report printed successfully'),
  } as any);

  // Create a wrapper function to handle the button click
  const handlePrint = () => {
    if (printComponentRef.current) {
      reactToPrintContent();
    } else {
      toast.error('Nothing to print');
    }
  };

  // Handle PDF export
  const exportPDF = () => {
    try {
      // Create a new jsPDF instance with proper configuration
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(18);
      doc.text('Inventory Summary Report', 14, 22);
      doc.setFontSize(11);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
      
      // Add inventory summary
      doc.setFontSize(14);
      doc.text('Inventory Overview', 14, 45);
      
      // Convert all values to strings first to avoid type issues
      const tableRows = [];
      for (const cat of data.categoryDistribution) {
        const categoryName = cat._id || 'Uncategorized';
        const count = '' + cat.count; // string concat to force string type
        
        // Format the value with proper type checking
        let value = '';
        if (typeof cat.value === 'number') {
          value = '$' + cat.value.toFixed(2);
        } else if (cat.value) {
          // If it's already a string or some other type, just convert to string
          value = String(cat.value);
        } else {
          value = '$0.00';
        }
        
        tableRows.push([categoryName, count, value]);
      }
      
      const tableData = [
        ['Category', 'Total Products', 'Total Value'],
        ...tableRows
      ];
      
      // Add summary table
      autoTable(doc, {
        startY: 50,
        head: [tableData[0]],
        body: tableData.slice(1),
        theme: 'striped',
      });
      
      // Add stock status
      const stockY = (doc as any).lastAutoTable.finalY + 20;
      doc.setFontSize(14);
      doc.text('Stock Status', 14, stockY);
      
      const stockData = [
        ['Status', 'Count'],
        ['In Stock', '' + data.stockStatus.inStock],
        ['Low Stock', '' + data.stockStatus.lowStock],
        ['Out of Stock', '' + data.stockStatus.outOfStock],
        ['Total', '' + (data.stockStatus.inStock + data.stockStatus.lowStock + data.stockStatus.outOfStock)]
      ];
      
      // Use autoTable directly
      autoTable(doc, {
        startY: stockY + 5,
        head: [stockData[0]],
        body: stockData.slice(1),
        theme: 'striped',
      });
      
      doc.save('inventory-summary.pdf');
      toast.success('PDF exported successfully');
    } catch (err) {
      console.error('Error exporting PDF:', err);
      toast.error('Failed to export PDF');
    }
  };

  // Handle Excel export
  const exportExcel = () => {
    try {
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Create header for category distribution
      const categoryHeader = [
        ['Inventory Summary Report'],
        ['Generated on:', new Date().toLocaleString()],
        [],
        ['Category Distribution']
      ];
      
      // Create table header and data for category distribution
      const categoryTableHeader = ['Category', 'Total Products', 'Total Value'];
      const categoryRows = data.categoryDistribution.map((cat: any) => [
        cat._id || 'Uncategorized',
        cat.count,
        typeof cat.value === 'number' ? cat.value.toFixed(2) : cat.value || 0
      ]);
      
      // Combine headers and rows for category distribution
      const categoryWorksheet = [
        ...categoryHeader,
        categoryTableHeader,
        ...categoryRows,
        [],
        ['Stock Status'],
        ['Status', 'Count'],
        ['In Stock', data.stockStatus.inStock],
        ['Low Stock', data.stockStatus.lowStock],
        ['Out of Stock', data.stockStatus.outOfStock],
        ['Total', data.stockStatus.inStock + data.stockStatus.lowStock + data.stockStatus.outOfStock]
      ];
      
      // Create worksheet and add to workbook
      const ws = XLSX.utils.aoa_to_sheet(categoryWorksheet);
      XLSX.utils.book_append_sheet(wb, ws, 'Inventory Summary');
      
      // Save the file
      XLSX.writeFile(wb, 'inventory-summary.xlsx');
      toast.success('Excel exported successfully');
    } catch (err) {
      console.error('Error exporting Excel:', err);
      toast.error('Failed to export Excel');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with back button and actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <div className="flex items-center gap-3">
            <Link href="/reports" className="inline-flex items-center justify-center h-10 w-10 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Inventory Summary</h1>
              <p className="text-muted-foreground">Comprehensive overview of your current inventory status</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportPDF} disabled={!data}>
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>
            <Button variant="outline" onClick={exportExcel} disabled={!data}>
              <FileText className="mr-2 h-4 w-4" />
              Excel
            </Button>
            <Button 
              variant="outline" 
              onClick={handlePrint} 
              disabled={!data}
            >
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </div>
        
        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="flex flex-col items-center">
              <Loader2 className="h-12 w-12 animate-spin mb-4 text-primary" />
              <p className="text-lg font-medium">Loading inventory summary...</p>
              <p className="text-muted-foreground">This won't take long</p>
            </div>
          </div>
        ) : error ? (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-destructive">
                <X className="h-8 w-8" />
                <div>
                  <h3 className="font-semibold">Error Loading Data</h3>
                  <p>{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : data ? (
          <div ref={printComponentRef} className="space-y-6">
            {/* KPI cards */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              <Card className="overflow-hidden transition-all duration-200 hover:shadow-md hover:border-blue-500">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-3 rounded-full transition-transform hover:scale-110">
                      <Package className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                      <h3 className="text-2xl font-bold">
                        {data.stockStatus.inStock + data.stockStatus.lowStock + data.stockStatus.outOfStock}
                      </h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="overflow-hidden transition-all duration-200 hover:shadow-md hover:border-green-500">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-3 rounded-full transition-transform hover:scale-110">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                      <h3 className="text-2xl font-bold">
                        {formatCurrency(data.totalValue || 0)}
                      </h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="overflow-hidden transition-all duration-200 hover:shadow-md hover:border-amber-500">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-100 p-3 rounded-full transition-transform hover:scale-110">
                      <AlertTriangle className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Low Stock</p>
                      <h3 className="text-2xl font-bold">
                        {data.stockStatus.lowStock}
                        <span className="text-sm font-normal text-muted-foreground ml-1">items</span>
                      </h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="overflow-hidden transition-all duration-200 hover:shadow-md hover:border-red-500">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-red-100 p-3 rounded-full transition-transform hover:scale-110">
                      <X className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Out of Stock</p>
                      <h3 className="text-2xl font-bold">
                        {data.stockStatus.outOfStock}
                        <span className="text-sm font-normal text-muted-foreground ml-1">items</span>
                      </h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="overview" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                  Category Overview
                </TabsTrigger>
                <TabsTrigger value="status" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                  Stock Status
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Category Distribution</CardTitle>
                    <CardDescription>
                      Breakdown of products and value by category
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          width={500}
                          height={300}
                          data={data.categoryDistribution}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="_id" />
                          {/* Left Y-axis for product counts */}
                          <YAxis 
                            yAxisId="left" 
                            orientation="left" 
                            stroke="#0088FE"
                            label={{ value: 'Products', angle: -90, position: 'insideLeft' }} 
                          />
                          {/* Right Y-axis for monetary values */}
                          <YAxis 
                            yAxisId="right" 
                            orientation="right" 
                            stroke="#00C49F"
                            label={{ value: 'Value ($)', angle: -90, position: 'insideRight' }} 
                            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                          />
                          <Tooltip 
                            formatter={(value, name, props) => {
                              if (name === 'value') return [`$${Number(value).toFixed(2)}`, 'Value'];
                              return [value, name === '_id' ? 'Category' : name];
                            }}
                          />
                          <Legend />
                          <Bar dataKey="count" name="Products" fill="#0088FE" yAxisId="left" />
                          <Bar dataKey="value" name="Value ($)" fill="#00C49F" yAxisId="right" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Category Details</CardTitle>
                    <CardDescription>
                      Detailed breakdown of products by category
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4">Category</th>
                            <th className="text-left py-3 px-4">Products</th>
                            <th className="text-right py-3 px-4">Total Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.categoryDistribution.map((cat: any, index: number) => (
                            <tr key={cat._id || index} className="border-b hover:bg-muted/50">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                  ></div>
                                  <span>{cat._id || 'Uncategorized'}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4">{cat.count}</td>
                              <td className="text-right py-3 px-4">
                                {typeof cat.value === 'number' 
                                  ? formatCurrency(cat.value) 
                                  : formatCurrency(0)}
                              </td>
                            </tr>
                          ))}
                          <tr className="font-medium bg-muted/30">
                            <td className="py-3 px-4">Total</td>
                            <td className="py-3 px-4">
                              {data.categoryDistribution.reduce((sum: number, cat: any) => sum + cat.count, 0)}
                            </td>
                            <td className="text-right py-3 px-4">
                              {formatCurrency(data.totalValue || 0)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="status" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Stock Status Distribution</CardTitle>
                      <CardDescription>
                        Breakdown of products by stock level status
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                      <div className="h-72 w-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={prepareStockStatusData()}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {prepareStockStatusData().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value} products`, 'Count']} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Stock Status Summary</CardTitle>
                      <CardDescription>
                        Overview of products by stock level status
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-8">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-green-500"></div>
                              <span className="font-medium">In Stock</span>
                            </div>
                            <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                              {data.stockStatus.inStock} products
                            </Badge>
                          </div>
                          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500 rounded-full transition-all duration-500" 
                              style={{ 
                                width: `${(data.stockStatus.inStock / (data.stockStatus.inStock + data.stockStatus.lowStock + data.stockStatus.outOfStock)) * 100}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                              <span className="font-medium">Low Stock</span>
                            </div>
                            <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-700">
                              {data.stockStatus.lowStock} products
                            </Badge>
                          </div>
                          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                              style={{ 
                                width: `${(data.stockStatus.lowStock / (data.stockStatus.inStock + data.stockStatus.lowStock + data.stockStatus.outOfStock)) * 100}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-red-500"></div>
                              <span className="font-medium">Out of Stock</span>
                            </div>
                            <Badge variant="outline" className="bg-red-50 border-red-200 text-red-700">
                              {data.stockStatus.outOfStock} products
                            </Badge>
                          </div>
                          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-red-500 rounded-full transition-all duration-500" 
                              style={{ 
                                width: `${(data.stockStatus.outOfStock / (data.stockStatus.inStock + data.stockStatus.lowStock + data.stockStatus.outOfStock)) * 100}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
} 