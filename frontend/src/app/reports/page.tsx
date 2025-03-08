'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  FileText, 
  ChevronRight, 
  LayoutDashboard,
  LineChart,
  BarChart,
  PieChart
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { reportApi } from '@/services/api';

export default function ReportsPage() {
  const { currentUser } = useAuth();
  const [inventorySummary, setInventorySummary] = useState<any>(null);
  const [transactionHistory, setTransactionHistory] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch inventory summary data
        const summaryData = await reportApi.getInventorySummary(currentUser);
        setInventorySummary(summaryData);
        
        // Fetch transaction history data with a small limit
        const transactionData = await reportApi.getTransactionHistory(currentUser, { limit: 10 });
        setTransactionHistory(transactionData);
      } catch (err) {
        console.error('Error fetching reports data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  const featuredReports = [
    {
      title: 'Inventory Summary',
      description: 'Overview of your current inventory status, value, and distribution.',
      icon: BarChart3,
      href: '/reports/inventory-summary',
      color: 'bg-blue-500',
      textColor: 'text-blue-500',
      bgLight: 'bg-blue-50',
      stats: `${inventorySummary?.totalProducts || 0} products tracked`,
    },
    {
      title: 'Transaction History',
      description: 'Detailed log of all inventory movements, including stock ins, outs, and adjustments.',
      icon: Clock,
      href: '/reports/transaction-history',
      color: 'bg-purple-500',
      textColor: 'text-purple-500',
      bgLight: 'bg-purple-50',
      stats: `${transactionHistory?.pagination?.total || 0} recent transactions`,
    },
  ];

  const additionalReports = [
    {
      title: 'Product Movement',
      description: 'Analysis of product flow over time, showing trends and patterns.',
      icon: TrendingUp,
      href: '/reports/transaction-history?type=stock-out',
      color: 'bg-green-500',
      textColor: 'text-green-500',
      bgLight: 'bg-green-50',
    },
    {
      title: 'Low Stock Alerts',
      description: 'List of products that need restocking with estimated restock values.',
      icon: AlertTriangle,
      href: '/alerts',
      color: 'bg-amber-500',
      textColor: 'text-amber-500',
      bgLight: 'bg-amber-50',
    },
  ];

  const reportCategories = [
    {
      title: 'Inventory Analytics',
      description: 'Deep insights into your inventory data',
      icon: PieChart,
      reports: [
        { name: 'Stock Value Report', href: '/reports/inventory-summary' },
        { name: 'Category Distribution', href: '/reports/inventory-summary' },
        { name: 'Stock Status Overview', href: '/reports/inventory-summary' },
      ]
    },
    {
      title: 'Transaction Analytics',
      description: 'Analyze your inventory movements',
      icon: LineChart,
      reports: [
        { name: 'All Transactions', href: '/reports/transaction-history' },
        { name: 'Stock-Out Transactions', href: '/reports/transaction-history?type=stock-out' },
        { name: 'Stock-In Transactions', href: '/reports/transaction-history?type=stock-in' },
      ]
    },
    {
      title: 'Business Intelligence',
      description: 'Actionable data for decision making',
      icon: BarChart,
      reports: [
        { name: 'Low Stock Report', href: '/alerts' },
        { name: 'Expiry Report', href: '/reports/transaction-history' },
      ]
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
            <p className="text-muted-foreground mt-1">Gain valuable insights into your inventory management</p>
          </div>
        </div>

        {/* Featured Reports Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Featured Reports</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {featuredReports.map((report) => (
              <Link href={report.href} key={report.title} className="block group">
                <Card className="overflow-hidden h-full transition-all duration-200 hover:shadow-md group-hover:border-primary group-hover:bg-primary/5">
                  <CardHeader className={cn("flex flex-row items-center gap-4 pb-2", report.bgLight)}>
                    <div className={cn("p-2 rounded-md transition-transform group-hover:scale-110", report.color)}>
                      <report.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{report.title}</CardTitle>
                      {report.stats && (
                        <CardDescription>{report.stats}</CardDescription>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">{report.description}</p>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t pt-4">
                    <span className={cn("text-sm font-medium", report.textColor)}>View Report</span>
                    <ChevronRight className={cn("h-5 w-5 transition-transform group-hover:translate-x-1", report.textColor)} />
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Report Categories */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Report Categories</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {reportCategories.map((category) => (
              <Card key={category.title} className="overflow-hidden transition-all duration-200 hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-md">
                      <category.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{category.title}</CardTitle>
                  </div>
                  <CardDescription className="pt-1">{category.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-2">
                    {category.reports.map((report) => (
                      <li key={report.name}>
                        <Link 
                          href={report.href} 
                          className="flex items-center justify-between p-2 rounded-md hover:bg-primary/10 group transition-colors"
                        >
                          <span className="text-sm font-medium group-hover:text-primary">{report.name}</span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Access Reports */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Quick Access</h2>
          <div className="grid gap-4 md:grid-cols-4">
            {additionalReports.map((report) => (
              <Link href={report.href} key={report.title} className="block group">
                <Card className="overflow-hidden transition-all duration-200 hover:shadow-md group-hover:border-primary group-hover:bg-primary/5 h-full">
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <div className={cn("p-3 rounded-full mb-3 transition-transform group-hover:scale-110", report.bgLight)}>
                      <report.icon className={cn("h-6 w-6", report.textColor)} />
                    </div>
                    <h3 className="font-medium mb-1 group-hover:text-primary">{report.title}</h3>
                    <p className="text-xs text-muted-foreground">{report.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
            
            <Link href="/reports/transaction-history" className="block group">
              <Card className="overflow-hidden transition-all duration-200 hover:shadow-md group-hover:border-primary group-hover:bg-primary/5 h-full">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="p-3 rounded-full mb-3 bg-primary/10 transition-transform group-hover:scale-110">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-medium mb-1 group-hover:text-primary">Custom Report</h3>
                  <p className="text-xs text-muted-foreground">Create a specialized report with filters</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/dashboard" className="block group">
              <Card className="overflow-hidden transition-all duration-200 hover:shadow-md group-hover:border-primary group-hover:bg-primary/5 h-full">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="p-3 rounded-full mb-3 bg-primary/10 transition-transform group-hover:scale-110">
                    <LayoutDashboard className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-medium mb-1 group-hover:text-primary">Dashboard</h3>
                  <p className="text-xs text-muted-foreground">Return to main dashboard</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 