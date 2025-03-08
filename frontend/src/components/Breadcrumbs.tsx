'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { Home } from 'lucide-react';

interface BreadcrumbsProps {
  className?: string;
}

// Map of path segments to more readable names
const pathMap: Record<string, string> = {
  dashboard: 'Dashboard',
  products: 'Products',
  new: 'New',
  edit: 'Edit',
  reports: 'Reports',
  'inventory-summary': 'Inventory Summary',
  'transaction-history': 'Transaction History',
  alerts: 'Alerts',
  settings: 'Settings',
  users: 'Users',
};

// Add more detailed breadcrumb info for specific paths
const getPathInfo = (segment: string, fullPath: string) => {
  // Product details or edit page
  if (segment.length === 24 && segment.match(/^[0-9a-f]{24}$/i)) {
    if (fullPath.includes('/products/')) {
      return { name: 'Product Details', icon: null };
    }
    return { name: 'Item Details', icon: null };
  }
  
  // Known routes
  const displayName = pathMap[segment] || segment;
  
  return { name: displayName, icon: null };
};

export function Breadcrumbs({ className }: BreadcrumbsProps) {
  const pathname = usePathname();
  
  // Skip rendering breadcrumbs on the dashboard page
  if (pathname === '/dashboard' || pathname === '/') {
    return null;
  }
  
  // Split pathname into segments and remove empty strings
  const pathSegments = pathname.split('/').filter(Boolean);
  
  // Generate breadcrumb items
  const breadcrumbItems = pathSegments.map((segment, index) => {
    // Build the href for this segment
    const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
    const fullPath = '/' + pathSegments.join('/');
    
    // Get the path info
    const { name: displayName } = getPathInfo(segment, fullPath);
    
    // Check if this is the last segment (current page)
    const isLastItem = index === pathSegments.length - 1;
    
    return (
      <BreadcrumbItem key={segment}>
        <BreadcrumbSeparator />
        {isLastItem ? (
          <BreadcrumbPage className="font-medium text-foreground">{displayName}</BreadcrumbPage>
        ) : (
          <Link href={href} passHref legacyBehavior>
            <BreadcrumbLink className="text-muted-foreground hover:text-primary">{displayName}</BreadcrumbLink>
          </Link>
        )}
      </BreadcrumbItem>
    );
  });
  
  return (
    <Breadcrumb className={`py-2 ${className}`}>
      <BreadcrumbList className="flex-wrap gap-1">
        <BreadcrumbItem>
          <Link href="/dashboard" passHref legacyBehavior>
            <BreadcrumbLink className="text-muted-foreground hover:text-primary flex items-center">
              <Home className="h-4 w-4" />
            </BreadcrumbLink>
          </Link>
        </BreadcrumbItem>
        {breadcrumbItems}
      </BreadcrumbList>
    </Breadcrumb>
  );
} 