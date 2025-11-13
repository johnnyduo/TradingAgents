/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@tradingagents/types', '@tradingagents/config'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
