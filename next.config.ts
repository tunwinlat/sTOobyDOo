import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output as standalone for optimal Vercel deployment
  output: 'standalone',
  
  // Image optimization
  images: {
    unoptimized: true,
  },

  // Experimental features
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Make env vars available at build time
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_AUTH_TOKEN: process.env.DATABASE_AUTH_TOKEN,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },

  // Custom webpack config if needed
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on `fs` module
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

export default nextConfig;
