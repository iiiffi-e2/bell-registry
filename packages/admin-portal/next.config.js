/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https', 
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'bell-registry-uploads.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: process.env.NEXT_PUBLIC_DOMAIN || 'localhost',
      }
    ],
  },
}

module.exports = nextConfig 