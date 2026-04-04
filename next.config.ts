import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    formats: ['image/avif', 'image/webp'],
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
      // Vercel Blob Storage (이미지 업로드)
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/**",
      },
      // Placeholder images (demo)
      {
        protocol: "https",
        hostname: "picsum.photos",
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
    optimizePackageImports: ['date-fns', 'zod', '@sentry/nextjs', 'pusher-js', 'firebase'],
    staleTimes: {
      dynamic: 0,
      static: 30,
    },
  },
};

export default nextConfig;
