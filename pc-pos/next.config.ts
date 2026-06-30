// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '30mb', // 🔥 Nâng tải trọng lên 30MB để chứa trọn vẹn file 20MB của sếp
          },
  },
  distDir: '.next'
};

export default nextConfig;