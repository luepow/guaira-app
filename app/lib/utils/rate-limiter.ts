import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface RateLimitConfig {
  identifier: string; // IP, userId, email, etc.
  action: string; // otp_generation, login_attempt, api_call, etc.
  maxAttempts: number;
  windowMs: number; // Ventana de tiempo en milisegundos
}

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  resetAt: Date;
  currentCount: number;
}

/**
 * Rate limiter basado en base de datos con sliding window
 * - Persistent across server restarts
 * - Distributed-friendly
 * - Configurable por acción
 */
export class RateLimiter {
  /**
   * Verifica si una acción está permitida bajo rate limiting
   */
  static async checkLimit(config: RateLimitConfig): Promise<RateLimitResult> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - config.windowMs);
    const windowEnd = new Date(now.getTime() + config.windowMs);

    // Limpiar registros antiguos (más allá de la ventana)
    await prisma.rateLimitLog.deleteMany({
      where: {
        identifier: config.identifier,
        action: config.action,
        windowEnd: {
          lt: now,
        },
      },
    });

    // Obtener registros en la ventana actual
    const existingLogs = await prisma.rateLimitLog.findMany({
      where: {
        identifier: config.identifier,
        action: config.action,
        windowEnd: {
          gte: now,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const currentCount = existingLogs.reduce((sum, log) => sum + log.count, 0);
    const allowed = currentCount < config.maxAttempts;

    if (allowed) {
      // Registrar nuevo intento
      await prisma.rateLimitLog.create({
        data: {
          identifier: config.identifier,
          action: config.action,
          count: 1,
          windowStart,
          windowEnd,
          blocked: false,
        },
      });
    } else {
      // Registrar intento bloqueado
      await prisma.rateLimitLog.create({
        data: {
          identifier: config.identifier,
          action: config.action,
          count: 1,
          windowStart,
          windowEnd,
          blocked: true,
          metadata: {
            reason: 'Rate limit exceeded',
            currentCount,
            maxAttempts: config.maxAttempts,
          },
        },
      });
    }

    const resetAt = existingLogs[0]?.windowEnd || windowEnd;
    const remainingAttempts = Math.max(0, config.maxAttempts - currentCount - (allowed ? 1 : 0));

    return {
      allowed,
      remainingAttempts,
      resetAt,
      currentCount: currentCount + (allowed ? 1 : 0),
    };
  }

  /**
   * Resetea el contador de rate limiting para un identificador y acción
   */
  static async resetLimit(identifier: string, action: string): Promise<void> {
    await prisma.rateLimitLog.deleteMany({
      where: {
        identifier,
        action,
      },
    });
  }

  /**
   * Verifica si un identificador está bloqueado
   */
  static async isBlocked(identifier: string, action: string): Promise<boolean> {
    const now = new Date();

    const blockedLog = await prisma.rateLimitLog.findFirst({
      where: {
        identifier,
        action,
        blocked: true,
        windowEnd: {
          gte: now,
        },
      },
    });

    return !!blockedLog;
  }
}

/**
 * Configuraciones predefinidas de rate limiting
 */
export const RateLimitPresets = {
  OTP_GENERATION: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutos
  },
  OTP_VERIFICATION: {
    maxAttempts: 10,
    windowMs: 15 * 60 * 1000, // 15 minutos
  },
  LOGIN_ATTEMPT: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutos
  },
  PASSWORD_RESET: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hora
  },
  API_CALL: {
    maxAttempts: 100,
    windowMs: 60 * 1000, // 1 minuto
  },
  WALLET_TRANSACTION: {
    maxAttempts: 10,
    windowMs: 60 * 1000, // 1 minuto
  },
  PAYMENT_CREATION: {
    maxAttempts: 20,
    windowMs: 60 * 1000, // 1 minuto
  },
} as const;

/**
 * Middleware helper para rate limiting en API routes
 */
export async function rateLimitMiddleware(
  identifier: string,
  action: keyof typeof RateLimitPresets
): Promise<RateLimitResult> {
  const preset = RateLimitPresets[action];

  return RateLimiter.checkLimit({
    identifier,
    action,
    maxAttempts: preset.maxAttempts,
    windowMs: preset.windowMs,
  });
}
