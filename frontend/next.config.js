/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV === 'development';

const nextConfig = {
  reactStrictMode: true,

  images: {
    // next/image optimization requires a server — not available in static export.
    // CloudFront serves images directly from S3 in production.
    unoptimized: true,
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        pathname: '/**',
      },
    ],
  },

  // Production: static export uploaded to S3. CloudFront routes /api/* to API Gateway.
  // Development: Next.js dev server proxies /api/* to NEXT_PUBLIC_API_URL (staging API Gateway).
  ...(isDev ? {} : { output: 'export' }),

  ...(isDev && process.env.NEXT_PUBLIC_API_URL ? {
    async rewrites() {
      return [
        {
          source: '/api/:path*',
          destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
        },
      ];
    },
  } : {}),

  poweredByHeader: false,
}

module.exports = nextConfig