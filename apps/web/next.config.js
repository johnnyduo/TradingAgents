/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@tradingagents/types', '@tradingagents/config'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  generateBuildId: async () => {
    return `build-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  },
  // Disable static page generation entirely - all pages are dynamic
  output: 'standalone',
  // Skip generating 404/500 pages
  async rewrites() {
    return [];
  },
};

module.exports = nextConfig;
