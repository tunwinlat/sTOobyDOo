import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output as standalone for optimal Vercel deployment
  output: 'standalone',
  
  // Image optimization
  images: {
    unoptimized: true,
  },

  // Turbopack configuration (enabled by default in Next.js 16)
  turbopack: {},

  // Make env vars available at build time
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_AUTH_TOKEN: process.env.DATABASE_AUTH_TOKEN,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
};

export default nextConfig;
