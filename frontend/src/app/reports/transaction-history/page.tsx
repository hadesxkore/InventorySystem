'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { reportApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Download, Loader2, FileText, Printer, Search, Calendar, Filter } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useReactToPrint } from 'react-to-print';
import { toast } from 'sonner';

export default function TransactionHistoryPage() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const printComponentRef = useRef<HTMLDivElement>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [transactionType, setTransactionType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchTransactions = async (page = 1) => {
    try {
      setLoading(true);
      
      // Clean up parameters to avoid sending 'undefined' string values
      const params: any = {};
      
      // Only add properties that have valid values
      if (searchQuery && searchQuery.trim() !== '') {
        params.search = searchQuery;
      }
      
      if (transactionType && transactionType !== 'all') {
        params.type = transactionType;
      }
      
      if (startDate && startDate.trim() !== '') {
        params.startDate = startDate;
      }
      
      if (endDate && endDate.trim() !== '') {
        params.endDate = endDate;
      }
      
      // Always include these parameters
      params.sortBy = sortBy;
      params.sortOrder = sortOrder;
      params.page = page;
      params.limit = 10;
      
      console.log('Fetching transactions with params:', params);
      
      const result = await reportApi.getTransactionHistory(currentUser, params);
      
      // Check if we have valid data
      if (result && result.transactions) {
        setData(result);
        setCurrentPage(page);
      } else {
        // Set empty data
        setData({
          transactions: [],
          summary: [],
          pagination: {
            total: 0,
            page: page,
            pages: 0,
            limit: 10
          }
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch transaction history');
      console.error('Error fetching transaction history:', err);
      
      // Set empty data on error
      setData({
        transactions: [],
        summary: [],
        pagination: {
          total: 0,
          page: page,
          pages: 0,
          limit: 10
        }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchTransactions();
    }
  }, [currentUser]);

  // Handle filter changes
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTransactions(1);
  };

  // Get transaction type badge color
  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'stock-in':
        return 'bg-green-100 text-green-800';
      case 'stock-out':
        return 'bg-red-100 text-red-800';
      case 'adjustment':
        return 'bg-blue-100 text-blue-800';
      case 'return':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format transaction type for display
  const formatTransactionType = (type: string) => {
    switch (type) {
      case 'stock-in':
        return 'Stock In';
      case 'stock-out':
        return 'Stock Out';
      case 'adjustment':
        return 'Adjustment';
      case 'return':
        return 'Return';
      default:
        return type;
    }
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    fetchTransactions(newPage);
  };

  // Handle PDF export
  const exportPDF = () => {
    try {
      // Create a new jsPDF instance with proper configuration
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(18);
      doc.text('Transaction History Report', 14, 22);
      doc.setFontSize(11);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
      
      if (startDate || endDate) {
        let dateText = 'Date Range: ';
        if (startDate) dateText += `From ${new Date(startDate).toLocaleDateString()} `;
        if (endDate) dateText += `To ${new Date(endDate).toLocaleDateString()}`;
        doc.text(dateText, 14, 38);
      }
      
      // Add transaction table
      const tableData = [
        ['Date', 'Product', 'SKU', 'Type', 'Quantity', 'Reason', 'Reference', 'User'],
        ...data.transactions.map((transaction: any) => [
          new Date(transaction.createdAt).toLocaleDateString(),
          transaction.productId?.name || 'Unknown',
          transaction.productId?.sku || 'N/A',
          formatTransactionType(transaction.type),
          transaction.quantity.toString(),
          transaction.reason || '',
          transaction.reference || '',
          transaction.createdBy?.name || 'System'
        ])
      ];
      
      // Use autoTable directly
      autoTable(doc, {
        startY: 45,
        head: [tableData[0]],
        body: tableData.slice(1),
        theme: 'striped',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 139, 202] }
      });
      
      doc.save('transaction-history.pdf');
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
      
      // Create header
      const header = [
        ['Transaction History Report'],
        ['Generated on:', new Date().toLocaleString()],
        []
      ];
      
      if (startDate || endDate) {
        let dateRange = ['Date Range:'];
        if (startDate) dateRange.push(`From ${new Date(startDate).toLocaleDateString()}`);
        if (endDate) dateRange.push(`To ${new Date(endDate).toLocaleDateString()}`);
        header.push(dateRange);
        header.push([]);
      }
      
      // Create table header
      const tableHeader = [
        'Date', 'Product', 'SKU', 'Type', 'Previous Qty', 'Change', 'Current Qty', 
        'Reason', 'Reference', 'User'
      ];
      
      // Add data rows
      const rows = data.transactions.map((transaction: any) => [
        new Date(transaction.createdAt).toLocaleDateString(),
        transaction.productId?.name || 'Unknown',
        transaction.productId?.sku || 'N/A',
        formatTransactionType(transaction.type),
        transaction.previousQuantity,
        transaction.quantity > 0 ? `+${transaction.quantity}` : transaction.quantity,
        transaction.currentQuantity,
        transaction.reason || '',
        transaction.reference || '',
        transaction.createdBy?.name || 'System'
      ]);
      
      // Combine headers and rows
      const worksheet = [
        ...header,
        tableHeader,
        ...rows
      ];
      
      // Create worksheet and add to workbook
      const ws = XLSX.utils.aoa_to_sheet(worksheet);
      XLSX.utils.book_append_sheet(wb, ws, 'Transaction History');
      
      // Save the file
      XLSX.writeFile(wb, 'transaction-history.xlsx');
      toast.success('Excel exported successfully');
    } catch (err) {
      console.error('Error exporting Excel:', err);
      toast.error('Failed to export Excel');
    }
  };

  // Create the print function with react-to-print
  const reactToPrintContent = useReactToPrint({
    documentTitle: 'Transaction History Report',
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Transaction History</h1>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportPDF} disabled={loading || !data}>
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
            <Button variant="outline" onClick={exportExcel} disabled={loading || !data}>
              <FileText className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
            <Button 
              variant="outline" 
              onClick={handlePrint} 
              disabled={loading || !data}
            >
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filter Transactions</CardTitle>
            <CardDescription>
              Search and filter transaction history by various criteria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Search Product or Reference</Label>
                  <div className="flex">
                    <Input
                      id="search"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">Transaction Type</Label>
                  <Select value={transactionType} onValueChange={setTransactionType}>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="stock-in">Stock In</SelectItem>
                      <SelectItem value="stock-out">Stock Out</SelectItem>
                      <SelectItem value="adjustment">Adjustment</SelectItem>
                      <SelectItem value="return">Return</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button type="submit">
                  <Filter className="mr-2 h-4 w-4" />
                  Apply Filters
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p>Loading transaction history...</p>
            </div>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="pt-6">
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            </CardContent>
          </Card>
        ) : data?.transactions?.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-gray-500" />
                </div>
                <h3 className="text-lg font-medium mb-1">No Transactions Found</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  No transaction records match your search criteria. Try adjusting your filters or check back later.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : data ? (
          <div>
            <div ref={printComponentRef}>
              <Card>
                <CardHeader>
                  <CardTitle>Transaction Records</CardTitle>
                  <CardDescription>
                    History of all inventory movements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Previous</TableHead>
                          <TableHead className="text-right">Change</TableHead>
                          <TableHead className="text-right">Current</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Reference</TableHead>
                          <TableHead>User</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.transactions.map((transaction: any) => (
                          <TableRow key={transaction._id}>
                            <TableCell>
                              {new Date(transaction.createdAt).toLocaleDateString()}
                              <div className="text-xs text-gray-500">
                                {new Date(transaction.createdAt).toLocaleTimeString()}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{transaction.productId?.name || 'Unknown Product'}</div>
                              <div className="text-xs text-gray-500">{transaction.productId?.sku || 'N/A'}</div>
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTransactionTypeColor(transaction.type)}`}>
                                {formatTransactionType(transaction.type)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">{transaction.previousQuantity}</TableCell>
                            <TableCell className={`text-right font-medium ${transaction.quantity > 0 ? 'text-green-600' : transaction.quantity < 0 ? 'text-red-600' : ''}`}>
                              {transaction.quantity > 0 ? `+${transaction.quantity}` : transaction.quantity}
                            </TableCell>
                            <TableCell className="text-right">{transaction.currentQuantity}</TableCell>
                            <TableCell>{transaction.reason || '-'}</TableCell>
                            <TableCell>{transaction.reference || '-'}</TableCell>
                            <TableCell>{transaction.createdBy?.name || 'System'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Pagination */}
                  {data.pagination && data.pagination.pages > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="flex items-center px-2">
                        Page {currentPage} of {data.pagination.pages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === data.pagination.pages}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
} 