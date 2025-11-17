/**
 * Secure Next.js Configuration
 * PCI-DSS Compliant Security Headers and Settings
 *
 * Compliance:
 * - PCI-DSS 4.1 (Use strong cryptography for transmission)
 * - PCI-DSS 6.5.10 (Broken authentication and session management)
 * - OWASP Secure Headers Project
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Security Headers - PCI-DSS 6.5.10
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          {
            // Prevent MIME type sniffing
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            // Enable XSS filter (legacy browsers)
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            // Prevent clickjacking
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            // HSTS - Force HTTPS (PCI-DSS 4.1)
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            // Referrer Policy
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            // Permissions Policy (formerly Feature-Policy)
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), payment=(self)',
          },
          {
            // Content Security Policy
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // TODO: Remove unsafe-inline in production
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://api.guair.app",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
        ],
      },
    ];
  },

  // Image Configuration
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.guair.app',
      },
    ],
    // Disable external image optimization to prevent SSRF
    dangerouslyAllowSVG: false,
  },

  // Disable X-Powered-By header (information disclosure)
  poweredByHeader: false,

  // Compression
  compress: true,

  // Production optimizations
  productionBrowserSourceMaps: false,

  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Security: Don't expose source maps in production
    if (!isServer) {
      config.devtool = false;
    }

    return config;
  },

  // Environment variables validation
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
  },

  // Experimental features
  experimental: {
    // Server Actions security
    serverActions: {
      bodySizeLimit: '2mb',
      allowedOrigins: ['guair.app', '*.guair.app'],
    },
  },

  // TypeScript strict mode
  typescript: {
    // Don't build if there are type errors
    ignoreBuildErrors: false,
  },

  // ESLint strict mode
  eslint: {
    // Don't build if there are linting errors
    ignoreDuringBuilds: false,
  },

  // Redirects for security
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'header',
            key: 'x-forwarded-proto',
            value: 'http',
          },
        ],
        destination: 'https://guair.app/:path*',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
