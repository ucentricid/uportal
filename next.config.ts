import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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
