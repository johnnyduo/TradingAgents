/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@tradingagents/types', '@tradingagents/config'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Skip error page generation
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
  productionBrowserSourceMaps: false,
  experimental: {
    // Skip generating error pages
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

module.exports = nextConfig;
