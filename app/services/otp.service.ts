import { PrismaClient } from '@prisma/client';
import { generateOtp, hashOtp, verifyOtp } from '../lib/utils/crypto';
import { emailService } from '../lib/utils/email';
import { RateLimiter, RateLimitPresets } from '../lib/utils/rate-limiter';
import { AuditService } from '../lib/utils/audit';
import { AppError, ErrorCodes } from '../lib/utils/response';

const prisma = new PrismaClient();

export interface GenerateOtpOptions {
  email: string;
  purpose?: 'login' | 'password_reset' | 'email_verification';
  ipAddress?: string;
  userAgent?: string;
  expiresInMinutes?: number;
}

export interface VerifyOtpOptions {
  email: string;
  otp: string;
  purpose?: 'login' | 'password_reset' | 'email_verification';
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Servicio de OTP (One-Time Password)
 * - Generación y verificación de códigos OTP
 * - Rate limiting integrado
 * - Auditoría completa
 * - Expiración automática
 */
export class OtpService {
  /**
   * Genera y envía un OTP por email
   */
  static async generateAndSend(options: GenerateOtpOptions): Promise<{
    success: boolean;
    expiresAt: Date;
  }> {
    const {
      email,
      purpose = 'login',
      ipAddress,
      userAgent,
      expiresInMinutes = 10,
    } = options;

    // Rate limiting - verificar intentos de generación
    const rateLimitResult = await RateLimiter.checkLimit({
      identifier: email,
      action: 'otp_generation',
      maxAttempts: RateLimitPresets.OTP_GENERATION.maxAttempts,
      windowMs: RateLimitPresets.OTP_GENERATION.windowMs,
    });

    if (!rateLimitResult.allowed) {
      throw new AppError(
        ErrorCodes.RATE_LIMIT_EXCEEDED,
        'Demasiados intentos de generación de OTP. Por favor, inténtalo más tarde.',
        429,
        {
          resetAt: rateLimitResult.resetAt,
          remainingAttempts: rateLimitResult.remainingAttempts,
        }
      );
    }

    // Invalidar OTPs anteriores no verificados para este email y propósito
    await prisma.otpCode.updateMany({
      where: {
        email,
        purpose,
        verified: false,
      },
      data: {
        verified: true, // Marcar como verificado para invalidar
      },
    });

    // Generar nuevo OTP
    const otp = generateOtp();
    const hashedOtp = await hashOtp(otp);
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    // Buscar usuario por email (puede no existir)
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    // Guardar OTP en base de datos
    const otpRecord = await prisma.otpCode.create({
      data: {
        userId: user?.id,
        email,
        code: hashedOtp,
        purpose,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    // Enviar OTP por email
    try {
      await emailService.sendOtp(email, otp, expiresInMinutes);
    } catch (error) {
      // Eliminar OTP si falla el envío de email
      await prisma.otpCode.delete({
        where: { id: otpRecord.id },
      });

      throw new AppError(
        ErrorCodes.INTERNAL_ERROR,
        'Error al enviar el código de verificación',
        500
      );
    }

    // Auditoría
    await AuditService.log({
      userId: user?.id,
      action: 'otp_generated',
      resource: 'otp',
      resourceId: otpRecord.id,
      metadata: {
        email,
        purpose,
        expiresAt: expiresAt.toISOString(),
      },
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      expiresAt,
    };
  }

  /**
   * Verifica un OTP
   */
  static async verify(options: VerifyOtpOptions): Promise<{
    success: boolean;
    userId?: string;
  }> {
    const {
      email,
      otp,
      purpose = 'login',
      ipAddress,
      userAgent,
    } = options;

    // Rate limiting - verificar intentos de verificación
    const rateLimitResult = await RateLimiter.checkLimit({
      identifier: email,
      action: 'otp_verification',
      maxAttempts: RateLimitPresets.OTP_VERIFICATION.maxAttempts,
      windowMs: RateLimitPresets.OTP_VERIFICATION.windowMs,
    });

    if (!rateLimitResult.allowed) {
      throw new AppError(
        ErrorCodes.RATE_LIMIT_EXCEEDED,
        'Demasiados intentos de verificación. Por favor, inténtalo más tarde.',
        429,
        {
          resetAt: rateLimitResult.resetAt,
          remainingAttempts: rateLimitResult.remainingAttempts,
        }
      );
    }

    // Buscar OTP válido
    const otpRecords = await prisma.otpCode.findMany({
      where: {
        email,
        purpose,
        verified: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 1,
    });

    if (otpRecords.length === 0) {
      await AuditService.log({
        action: 'otp_verification_failed',
        resource: 'otp',
        metadata: {
          email,
          purpose,
          reason: 'No valid OTP found',
        },
        ipAddress,
        userAgent,
      });

      throw new AppError(
        ErrorCodes.OTP_INVALID,
        'Código OTP inválido o expirado',
        400
      );
    }

    const otpRecord = otpRecords[0];

    // Incrementar contador de intentos
    const updatedOtp = await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: {
        attempts: {
          increment: 1,
        },
      },
    });

    // Verificar límite de intentos (máximo 5 intentos por OTP)
    if (updatedOtp.attempts > 5) {
      await prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { verified: true }, // Invalidar OTP
      });

      await AuditService.log({
        userId: otpRecord.userId || undefined,
        action: 'otp_verification_failed',
        resource: 'otp',
        resourceId: otpRecord.id,
        metadata: {
          email,
          purpose,
          reason: 'Max attempts exceeded',
        },
        ipAddress,
        userAgent,
      });

      throw new AppError(
        ErrorCodes.OTP_MAX_ATTEMPTS,
        'Máximo de intentos excedido. Solicita un nuevo código.',
        400
      );
    }

    // Verificar OTP
    const isValid = await verifyOtp(otp, otpRecord.code);

    if (!isValid) {
      await AuditService.log({
        userId: otpRecord.userId || undefined,
        action: 'otp_verification_failed',
        resource: 'otp',
        resourceId: otpRecord.id,
        metadata: {
          email,
          purpose,
          reason: 'Invalid code',
          attempts: updatedOtp.attempts,
        },
        ipAddress,
        userAgent,
      });

      throw new AppError(
        ErrorCodes.OTP_INVALID,
        'Código OTP inválido',
        400
      );
    }

    // Marcar OTP como verificado
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    });

    // Auditoría
    await AuditService.log({
      userId: otpRecord.userId || undefined,
      action: 'otp_verified',
      resource: 'otp',
      resourceId: otpRecord.id,
      metadata: {
        email,
        purpose,
      },
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      userId: otpRecord.userId || undefined,
    };
  }

  /**
   * Limpia OTPs expirados (para ejecutar periódicamente)
   */
  static async cleanExpired(): Promise<number> {
    const result = await prisma.otpCode.deleteMany({
      where: {
        OR: [
          {
            expiresAt: {
              lt: new Date(),
            },
          },
          {
            verified: true,
            createdAt: {
              lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Más de 24 horas
            },
          },
        ],
      },
    });

    return result.count;
  }

  /**
   * Obtiene estadísticas de OTP para un email
   */
  static async getStats(email: string): Promise<{
    totalGenerated: number;
    totalVerified: number;
    pendingVerification: number;
  }> {
    const [totalGenerated, totalVerified, pendingVerification] = await Promise.all([
      prisma.otpCode.count({
        where: { email },
      }),
      prisma.otpCode.count({
        where: {
          email,
          verified: true,
        },
      }),
      prisma.otpCode.count({
        where: {
          email,
          verified: false,
          expiresAt: {
            gt: new Date(),
          },
        },
      }),
    ]);

    return {
      totalGenerated,
      totalVerified,
      pendingVerification,
    };
  }
}
