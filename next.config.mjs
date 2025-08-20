/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  
  // API configuration
  async headers() {
    return [
      {
        // Apply CORS headers to all API routes
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production' 
              ? process.env.ALLOWED_ORIGINS || '*'
              : '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With, Accept, Origin'
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ]
      }
    ]
  },

  // Rewrites for API proxy (if needed)
  async rewrites() {
    return [
      // External API proxy rewrites
      {
        source: '/external-api/:path*',
        destination: `${process.env.EXTERNAL_API_BASE_URL || 'http://golfcar.go2kt.com:8080/api'}/:path*`
      },
      // Image proxy rewrites to handle external images
      {
        source: '/api/proxy/images/:path*',
        destination: `${process.env.EXTERNAL_API_BASE_URL || 'http://golfcar.go2kt.com:8080'}/:path*`
      },
      // Direct image proxy for maintenance uploads
      {
        source: '/proxy-image/:path*',
        destination: `${process.env.EXTERNAL_API_BASE_URL || 'http://golfcar.go2kt.com:8080'}/:path*`
      },
      // External API uploads proxy
      {
        source: '/api/uploads/external/:path*',
        destination: `${process.env.EXTERNAL_API_BASE_URL || 'http://golfcar.go2kt.com:8080'}/uploads/:path*`
      }
    ]
  },


  // Image optimization
  images: {
    domains: ['localhost', 'golfcar.go2kt.com'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'golfcar.go2kt.com',
        port: '8080',
        pathname: '/api/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8080',
        pathname: '/**',
      }
    ],
    formats: ['image/webp', 'image/avif'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    unoptimized: process.env.NODE_ENV === 'production',
  },

  // Compression
  compress: true,

  // Output configuration for production
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,

  // Webpack configuration
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  },

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Production-specific settings
  ...(process.env.NODE_ENV === 'production' && {
    poweredByHeader: false,
    generateEtags: true,
    httpAgentOptions: {
      keepAlive: true,
    },
  }),
}

export default nextConfig