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
    // Force new build ID to bypass Vercel cache
    return `build-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  },
};

module.exports = nextConfig;
