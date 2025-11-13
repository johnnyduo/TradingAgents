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
  // Use standalone output for Vercel deployment
  output: 'standalone',
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
  productionBrowserSourceMaps: false,
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

module.exports = nextConfig;
