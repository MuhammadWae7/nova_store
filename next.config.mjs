/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["bcryptjs", "@neondatabase/serverless"],
  images: {
    remotePatterns: [
      // Storefront/editorial images
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      // AWS S3 buckets (any region, any bucket name)
      {
        protocol: "https",
        hostname: "*.amazonaws.com",
      },
      // Cloudflare R2 storage (private bucket hostname pattern)
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
      },
      // Cloudflare R2 public bucket sub-domain pattern
      {
        protocol: "https",
        hostname: "pub-*.r2.dev",
      },
    ],
  },
};

export default nextConfig;
