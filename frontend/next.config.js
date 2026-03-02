/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true, // Enable for better debugging
  swcMinify: true, // Enable minification for better performance
  
  // SEO: Enable compression
  compress: true,
  
  // SEO: Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Allow image optimization in development
    unoptimized: process.env.NODE_ENV === 'development',
    // Production image optimization settings
    minimumCacheTTL: 31536000, // 1 year cache
    dangerouslyAllowSVG: true,
    // Allow external images from Cloudinary
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/beats-on-beltline/**',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        pathname: '/**',
      },
    ],
  },
  
  // API proxy configuration for backend communication
  async rewrites() {
    // In production, use the backend container name
    // In development, use localhost
    const backendUrl = process.env.BACKEND_URL || 'http://backend:8000';
    
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`
      },
      {
        source: '/health',
        destination: `${backendUrl}/health`
      }
    ]
  },
  
  // SEO: Custom headers for better caching and security
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|webp|avif|gif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          }
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ],
      },
    ]
  },
  
  // Container compatibility settings
  experimental: {
    esmExternals: false
  },
  
  // Output configuration for container environment
  output: 'standalone',
  
  // SEO: Generate optimized build
  poweredByHeader: false, // Remove X-Powered-By header for security
}

module.exports = nextConfig