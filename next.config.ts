import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      /** Browsers request /favicon.ico by default; serve the same asset as metadata icons. */
      { source: "/favicon.ico", destination: "/capsule-icon.png" },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.clerk.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
