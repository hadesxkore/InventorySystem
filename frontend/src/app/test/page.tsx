'use client';

import React from 'react';
import Link from 'next/link';

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">Test Page</h1>
        <p className="text-gray-700 mb-4">
          If you can see this page, your Next.js routing is working correctly.
        </p>
        <div className="flex justify-center">
          <Link href="/" className="text-blue-500 hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 