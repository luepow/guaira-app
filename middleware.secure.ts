/**
 * Secure Next.js Middleware
 * PCI-DSS Compliant Request Filtering and Security Controls
 *
 * Compliance:
 * - PCI-DSS 7.1 (Limit access to system components)
 * - PCI-DSS 8.2 (Ensure proper user authentication)
 * - OWASP Top 10 A01:2021 - Broken Access Control
 */

import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Rate limiting store (should use Redis in production)
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Check rate limit for IP address
 */
function checkRateLimit(ip: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  rateLimitStore.set(ip, record);
  return true;
}

/**
 * Security middleware for authenticated routes
 */
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Get client IP
    const ip = req.headers.get('x-forwarded-for') ||
               req.headers.get('x-real-ip') ||
               'unknown';

    // Global rate limiting - 100 requests per minute per IP
    const isAllowed = checkRateLimit(ip, 100, 60 * 1000);
    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
          },
        }
      );
    }

    // Admin-only routes - PCI-DSS 7.1
    if (pathname.startsWith('/admin')) {
      if (token?.role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }

      // Extra security for admin routes
      // Could add IP whitelist check here
      const adminIpWhitelist = process.env.ADMIN_IP_WHITELIST?.split(',') || [];
      if (adminIpWhitelist.length > 0 && !adminIpWhitelist.includes(ip)) {
        return NextResponse.json(
          { error: 'Forbidden - IP not whitelisted' },
          { status: 403 }
        );
      }
    }

    // Merchant-only routes - PCI-DSS 7.1
    if (pathname.startsWith('/pos')) {
      if (!['merchant', 'admin'].includes(token?.role as string)) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    // Payment routes - extra validation
    if (pathname.startsWith('/api/pos/payment') || pathname.startsWith('/api/wallet')) {
      // Verify session is recent (within last 5 minutes for sensitive operations)
      const tokenIssuedAt = token?.iat as number;
      const now = Math.floor(Date.now() / 1000);
      const sessionAge = now - tokenIssuedAt;

      if (sessionAge > 5 * 60) {
        // Session too old for payment operations - require re-authentication
        return NextResponse.json(
          { error: 'Session expired. Please re-authenticate.' },
          { status: 401 }
        );
      }
    }

    // Security headers for all authenticated routes
    const response = NextResponse.next();

    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // HTTPS enforcement in production
    if (process.env.NODE_ENV === 'production') {
      const protocol = req.headers.get('x-forwarded-proto');
      if (protocol !== 'https') {
        const url = req.nextUrl.clone();
        url.protocol = 'https';
        return NextResponse.redirect(url);
      }
    }

    return response;
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // User must be authenticated
        return !!token;
      },
    },
    pages: {
      signIn: '/login',
      error: '/login',
    },
  }
);

/**
 * Middleware configuration
 * Protected routes that require authentication
 */
export const config = {
  matcher: [
    // Protected pages
    '/dashboard/:path*',
    '/wallet/:path*',
    '/pos/:path*',
    '/payments/:path*',
    '/transactions/:path*',
    '/admin/:path*',
    '/account/:path*',

    // Protected API routes
    '/api/wallet/:path*',
    '/api/pos/:path*',
    '/api/payments/:path*',
    '/api/user/:path*',

    // Exclude public routes
    '/((?!api/auth|login|register|_next/static|_next/image|favicon.ico|public).*)',
  ],
};

/**
 * Clean up rate limit records periodically
 */
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetAt) {
        rateLimitStore.delete(key);
      }
    }
  }, 60 * 1000); // Clean up every minute
}
