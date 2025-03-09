'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function ProductsDebugPage() {
  // const { currentUser } = useAuth(); // Commented out as it's not used
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL;
        console.log('API URL:', API_URL);

        // First try the special debug endpoint
        const response = await fetch(`${API_URL}/products/debug/all`);
        const result = await response.json();

        setData(result);
      } catch (err: Error | unknown) {
        console.error('Error fetching data:', err);
        const errorMessage = err instanceof Error ? err.message : 'Error fetching data';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Products Debug Page</h1>
        
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="p-4 bg-red-100 text-red-800 rounded-md">
            {error}
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-semibold mb-2">Raw Product Data</h2>
            <p>Total Products: {data?.totalProducts || 0}</p>
            
            <div className="mt-4 bg-gray-100 p-4 rounded-md overflow-auto max-h-[600px]">
              <pre>{JSON.stringify(data, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 