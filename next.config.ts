import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    // Explicitly set root to fix "Next.js package not found" panic
    // when project path contains spaces (e.g. "Project Ucentric")
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's3.ucentric.id',
        pathname: '/products/**',
      },
      {
        protocol: 'https',
        hostname: '*.ucentric.id',
      },
    ],
  },
};

export default nextConfig;
