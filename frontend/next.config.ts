import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  // Enable compression for smaller payloads
  compress: true,
  // Optimize fonts
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
    ],
  },
  // Turbopack for faster builds (Next.js 16+)
  turbopack: {
    rules: {
      // Ensure CSS is handled properly
    },
  },
  // Webpack optimizations for production
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Split chunks more aggressively for smaller initial bundles
      if (config.optimization && config.optimization.splitChunks) {
        config.optimization.splitChunks.chunks = "all";
        config.optimization.splitChunks.cacheGroups = {
          ...config.optimization.splitChunks.cacheGroups,
          // Separate @xyflow/react into its own chunk (only loaded when graph components are used)
          xyflow: {
            test: /[\\/]node_modules[\\/](@xyflow|reactflow)[\\/]/,
            name: "xyflow",
            chunks: "all",
            priority: 30,
          },
          // Separate framer-motion into its own chunk
          framer: {
            test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
            name: "framer",
            chunks: "all",
            priority: 25,
          },
          // Separate lucide-react into its own chunk
          lucide: {
            test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
            name: "lucide",
            chunks: "all",
            priority: 20,
          },
        };
      }
    }
    return config;
  },
};

export default nextConfig;
