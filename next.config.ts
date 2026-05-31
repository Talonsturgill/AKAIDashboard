import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "substackcdn.com" },
      { protocol: "https", hostname: "substack-post-media.s3.amazonaws.com" },
    ],
  },
  experimental: {
    optimizePackageImports: ["@tremor/react", "lucide-react", "@xyflow/react"],
  },
};

export default nextConfig;
