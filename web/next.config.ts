import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Enable static export for Capacitor builds
  output: process.env.BUILD_TARGET === 'capacitor' ? 'export' : undefined,
  // Disable image optimization for static export
  images: {
    unoptimized: process.env.BUILD_TARGET === 'capacitor' ? true : false,
  },
};

export default nextConfig;
