/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // swcMinify: true, // Removing this option as it's causing build errors
  // Configure images for Netlify
  images: {
    domains: ['firebasestorage.googleapis.com'],
    unoptimized: true,
  },
  // Add CORS headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },
  // Configure environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '/.netlify/functions/server/api',
  },
};

module.exports = nextConfig;