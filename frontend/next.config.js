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

  experimental: {
    // TypeScript 7's native compiler doesn't ship the classic in-process
    // compiler API that Next.js's build-time type-checking normally uses.
    // The "typescript" package here is aliased to Microsoft's
    // @typescript/typescript6 compatibility shim (see package.json) so
    // typescript-eslint keeps working; that shim only exposes the classic
    // API (lib/typescript.js), not a "tsc" CLI binary. Disabling
    // useTypeScriptCli (Next 16's new default) makes Next use the classic
    // API path instead of shelling out to a "typescript/bin/tsc" binary
    // that the shim doesn't provide.
    useTypeScriptCli: false,
  },
}

module.exports = nextConfig