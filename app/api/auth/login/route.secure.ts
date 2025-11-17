/**
 * Secure Login API Route
 * PCI-DSS Compliant Authentication
 *
 * Compliance:
 * - PCI-DSS 8.2 (Identify and authenticate access)
 * - PCI-DSS 8.2.4 (Account lockout after failed attempts)
 * - PCI-DSS 10.2.4 (Log invalid logical access attempts)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { verifyPassword } from '../../../lib/crypto';
import { createAuditLog } from '../../../lib/audit';
import { checkRateLimit } from '../../../lib/rate-limit';
import { loginSchema, validateRequest } from '../../../lib/validation';
import { generateSecureToken } from '../../../lib/crypto';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let userId: string | undefined;

  try {
    // Get client information for audit logging
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Parse and validate request body
    const body = await request.json();
    const validatedData = validateRequest(loginSchema, body);
    const { phone, password } = validatedData;

    // Rate limiting - PCI-DSS 8.2.4
    const rateLimitKey = `login:${ipAddress}`;
    const isAllowed = await checkRateLimit(rateLimitKey, {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
      blockDurationMs: 30 * 60 * 1000, // 30 minutes block
    });

    if (!isAllowed) {
      await createAuditLog({
        action: 'LOGIN_RATE_LIMITED',
        result: 'FAILURE',
        reason: 'Too many login attempts',
        ipAddress,
        userAgent,
        metadata: { phone },
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Demasiados intentos de inicio de sesión. Intente de nuevo en 30 minutos.',
        },
        { status: 429 }
      );
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { phone },
      include: { wallet: true },
    });

    // Timing attack mitigation: Always perform hash even if user not found
    if (!user) {
      // Dummy hash to maintain constant timing
      await verifyPassword(
        password,
        '$2a$12$dummyhashforunknownuserdummyhashforunknownuserdummyhash'
      );

      await createAuditLog({
        action: 'LOGIN_FAILED',
        result: 'FAILURE',
        reason: 'User not found',
        ipAddress,
        userAgent,
        metadata: { phone },
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Credenciales inválidas',
        },
        { status: 401 }
      );
    }

    userId = user.id;

    // Check if account is locked - PCI-DSS 8.2.4
    if (user.accountLocked) {
      await createAuditLog({
        action: 'LOGIN_FAILED',
        result: 'FAILURE',
        reason: 'Account locked',
        userId: user.id,
        ipAddress,
        userAgent,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Cuenta bloqueada. Contacte al administrador.',
        },
        { status: 403 }
      );
    }

    // Verify password using bcrypt
    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      // Increment failed login attempts
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: { increment: 1 },
          lastFailedLogin: new Date(),
        },
      });

      // Lock account after 5 failed attempts - PCI-DSS 8.2.4
      if (updatedUser.failedLoginAttempts >= 5) {
        await prisma.user.update({
          where: { id: user.id },
          data: { accountLocked: true },
        });

        await createAuditLog({
          action: 'ACCOUNT_LOCKED',
          result: 'SUCCESS',
          reason: 'Too many failed login attempts',
          userId: user.id,
          ipAddress,
          userAgent,
        });
      }

      await createAuditLog({
        action: 'LOGIN_FAILED',
        result: 'FAILURE',
        reason: 'Invalid password',
        userId: user.id,
        ipAddress,
        userAgent,
        metadata: {
          failedAttempts: updatedUser.failedLoginAttempts,
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Credenciales inválidas',
        },
        { status: 401 }
      );
    }

    // Successful login
    // Reset failed attempts
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lastLogin: new Date(),
      },
    });

    // Generate secure session token
    const token = generateSecureToken(32);

    // Store session in database
    const sessionExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes - PCI-DSS 8.2.5

    await prisma.session.create({
      data: {
        sessionToken: token,
        userId: user.id,
        expires: sessionExpires,
        ipAddress,
        userAgent,
      },
    });

    // Create audit log for successful login - PCI-DSS 10.2.4
    await createAuditLog({
      action: 'LOGIN_SUCCESS',
      result: 'SUCCESS',
      userId: user.id,
      ipAddress,
      userAgent,
      metadata: {
        responseTime: Date.now() - startTime,
      },
    });

    // Prepare user response (exclude sensitive data)
    const userResponse = {
      id: user.id,
      phone: user.phone,
      name: user.name,
      email: user.email,
      balance: user.wallet?.balance || 0,
      currency: user.wallet?.currency || 'USD',
      role: user.role,
      avatar: user.avatar,
    };

    return NextResponse.json(
      {
        success: true,
        data: {
          user: userResponse,
          token,
          expiresAt: sessionExpires.toISOString(),
        },
        message: 'Login exitoso',
      },
      {
        status: 200,
        headers: {
          // Security headers
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
          'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        },
      }
    );
  } catch (error: any) {
    // Log error (sanitized)
    console.error('Login error:', {
      timestamp: new Date().toISOString(),
      error: error.message,
      userId,
    });

    // Create audit log for system error
    await createAuditLog({
      action: 'LOGIN_FAILED',
      result: 'FAILURE',
      reason: 'System error',
      userId,
      metadata: {
        errorType: error.constructor.name,
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}

// Disable caching for authentication endpoint
export const dynamic = 'force-dynamic';
export const revalidate = 0;
