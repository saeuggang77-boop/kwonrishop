import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "k.kakaocdn.net",
        pathname: "/dn/**",
      },
      {
        protocol: "https",
        hostname: "ssl.pstatic.net",
        pathname: "/static/pwe/address/**",
      },
      {
        protocol: "http",
        hostname: "k.kakaocdn.net",
        pathname: "/dn/**",
      },
      {
        protocol: "https",
        hostname: "phinf.pstatic.net",
        pathname: "/**",
      },
      // S3 compatible storage
      {
        protocol: "https",
        hostname: "**.s3.**.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.r2.cloudflarestorage.com",
        pathname: "/**",
      },
      // Custom S3 endpoint (MinIO, R2 custom domain, etc.)
      ...(process.env.S3_PUBLIC_URL
        ? [
            {
              protocol: "https" as const,
              hostname: new URL(process.env.S3_PUBLIC_URL).hostname,
              pathname: "/**",
            },
          ]
        : []),
    ],
  },
  experimental: {
    optimizePackageImports: ['date-fns'],
  },
};

export default nextConfig;
