/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    // Required for static export — Next.js image optimization needs a server.
    // CloudFront serves images directly from S3.
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

  // Static export — output goes to /out, uploaded to S3.
  // /api/* calls are routed by CloudFront to API Gateway, no Next.js proxy needed.
  output: 'export',

  poweredByHeader: false,
}

module.exports = nextConfig