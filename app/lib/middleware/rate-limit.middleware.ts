import { NextRequest, NextResponse } from 'next/server';
import { rateLimitMiddleware } from '../utils/rate-limiter';
import { rateLimitErrorResponse } from '../utils/response';

/**
 * Middleware de rate limiting para API routes
 * Uso:
 *   import { withRateLimit } from '@/app/lib/middleware/rate-limit.middleware';
 *   export const POST = withRateLimit(handler, 'OTP_GENERATION');
 */
export function withRateLimit(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
  action: 'OTP_GENERATION' | 'OTP_VERIFICATION' | 'LOGIN_ATTEMPT' | 'PASSWORD_RESET' | 'API_CALL' | 'WALLET_TRANSACTION' | 'PAYMENT_CREATION'
) {
  return async function (request: NextRequest, ...args: any[]) {
    try {
      // Obtener identificador (IP o userId)
      const identifier = request.headers.get('x-forwarded-for')
        || request.headers.get('x-real-ip')
        || 'unknown';

      // Verificar rate limit
      const rateLimitResult = await rateLimitMiddleware(identifier, action);

      if (!rateLimitResult.allowed) {
        return rateLimitErrorResponse(
          rateLimitResult.remainingAttempts,
          rateLimitResult.resetAt
        );
      }

      // Continuar con el handler original
      return handler(request, ...args);
    } catch (error) {
      console.error('Rate limit middleware error:', error);
      // En caso de error, permitir la request (fail-open)
      return handler(request, ...args);
    }
  };
}
