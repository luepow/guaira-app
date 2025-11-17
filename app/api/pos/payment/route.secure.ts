/**
 * Secure Payment Processing API
 * PCI-DSS Compliant Payment Handler
 *
 * Compliance:
 * - PCI-DSS 6.5.1 (Injection flaws)
 * - PCI-DSS 6.5.3 (Insecure cryptographic storage)
 * - PCI-DSS 10.2 (Audit trail for all access to cardholder data)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { createAuditLog } from '../../../lib/audit';
import { checkRateLimit } from '../../../lib/rate-limit';
import { paymentSchema, validateRequest } from '../../../lib/validation';
import { requireAuth } from '../../../lib/auth.secure';
import { sha256Hash, generateHMAC } from '../../../lib/crypto';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let paymentId: string | undefined;
  let userId: string | undefined;

  try {
    // Authenticate request
    const session = await requireAuth(request);
    userId = session.user.id;

    // Get client information
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Rate limiting per user - PCI-DSS protection
    const rateLimitKey = `payment:${userId}`;
    const isAllowed = await checkRateLimit(rateLimitKey, {
      maxAttempts: 10,
      windowMs: 60 * 1000, // 1 minute
    });

    if (!isAllowed) {
      await createAuditLog({
        action: 'RATE_LIMIT_EXCEEDED',
        result: 'FAILURE',
        userId,
        reason: 'Payment rate limit exceeded',
        ipAddress,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Demasiadas solicitudes de pago. Intente de nuevo en un momento.',
        },
        { status: 429 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const validatedData = validateRequest(paymentSchema, body);
    const { userId: paymentUserId, amount, merchantId, description, items } = validatedData;

    // Authorization check: User can only make payments for their own account
    // unless they have merchant/admin role
    if (paymentUserId !== userId && !['merchant', 'admin'].includes(session.user.role)) {
      await createAuditLog({
        action: 'UNAUTHORIZED_ACCESS',
        result: 'FAILURE',
        userId,
        reason: 'Attempted payment for different user',
        ipAddress,
        metadata: { attemptedUserId: paymentUserId },
      });

      return NextResponse.json(
        {
          success: false,
          error: 'No autorizado',
        },
        { status: 403 }
      );
    }

    // Verify user and wallet exist
    const user = await prisma.user.findUnique({
      where: { id: paymentUserId },
      include: { wallet: true },
    });

    if (!user || !user.wallet) {
      await createAuditLog({
        action: 'PAYMENT_FAILED',
        result: 'FAILURE',
        userId,
        reason: 'User or wallet not found',
        ipAddress,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Usuario o billetera no encontrada',
        },
        { status: 404 }
      );
    }

    // Check sufficient balance
    if (user.wallet.balance < amount) {
      await createAuditLog({
        action: 'PAYMENT_FAILED',
        result: 'FAILURE',
        userId: paymentUserId,
        reason: 'Insufficient balance',
        ipAddress,
        metadata: {
          requestedAmount: amount,
          availableBalance: user.wallet.balance,
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Saldo insuficiente',
        },
        { status: 400 }
      );
    }

    // Generate idempotency key (prevent duplicate payments)
    const requestId = body.requestId || `${paymentUserId}-${Date.now()}-${Math.random()}`;

    // Check for duplicate payment
    const existingPayment = await prisma.payment.findUnique({
      where: { requestId },
    });

    if (existingPayment) {
      await createAuditLog({
        action: 'PAYMENT_FAILED',
        result: 'FAILURE',
        userId: paymentUserId,
        reason: 'Duplicate payment attempt',
        ipAddress,
        metadata: { requestId },
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Pago duplicado detectado',
        },
        { status: 409 }
      );
    }

    // Create payment record and update wallet in a transaction
    const payment = await prisma.$transaction(async (tx) => {
      // Deduct from wallet
      const updatedWallet = await tx.wallet.update({
        where: { id: user.wallet!.id },
        data: {
          balance: { decrement: amount },
        },
      });

      // Create payment data
      const paymentData = {
        userId: paymentUserId,
        merchantId,
        amount,
        currency: 'USD',
        status: 'succeeded',
        description: description || 'Pago en POS',
        items: items || [],
        ipAddress,
        userAgent,
        requestId,
      };

      // Generate integrity hash - PCI-DSS 10.5.2
      const dataString = JSON.stringify({
        ...paymentData,
        timestamp: new Date().toISOString(),
      });
      const hash = sha256Hash(dataString);
      const signature = generateHMAC(dataString, process.env.PAYMENT_HMAC_SECRET || '');

      // Create payment record
      const newPayment = await tx.payment.create({
        data: {
          ...paymentData,
          hash,
          signature,
        },
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          userId: paymentUserId,
          walletId: user.wallet!.id,
          type: 'payment',
          amount,
          currency: 'USD',
          status: 'succeeded',
          description: description || 'Pago en POS',
          ipAddress,
          userAgent,
          requestId,
          hash,
          signature,
          metadata: {
            paymentId: newPayment.id,
            merchantId,
            items,
          },
        },
      });

      return newPayment;
    });

    paymentId = payment.id;

    // Create audit log - PCI-DSS 10.2.1
    await createAuditLog({
      action: 'PAYMENT_SUCCESS',
      result: 'SUCCESS',
      userId: paymentUserId,
      resourceType: 'PAYMENT',
      resourceId: payment.id,
      ipAddress,
      userAgent,
      metadata: {
        amount,
        merchantId,
        processingTime: Date.now() - startTime,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: payment.id,
          userId: payment.userId,
          merchantId: payment.merchantId,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          description: payment.description,
          createdAt: payment.createdAt.toISOString(),
        },
        message: 'Pago procesado exitosamente',
      },
      {
        status: 200,
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
        },
      }
    );
  } catch (error: any) {
    console.error('Payment error:', {
      timestamp: new Date().toISOString(),
      error: error.message,
      userId,
      paymentId,
    });

    await createAuditLog({
      action: 'PAYMENT_FAILED',
      result: 'FAILURE',
      userId,
      reason: 'System error',
      metadata: {
        errorType: error.constructor.name,
        paymentId,
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Error procesando el pago',
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
