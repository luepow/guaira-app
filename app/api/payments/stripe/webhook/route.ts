import { NextRequest } from 'next/server';
import { initializePaymentServices } from '@/app/lib/services/payment.service';
import { WalletService } from '@/app/lib/services/wallet.service';
import { successResponse, errorResponse, ErrorCodes } from '@/app/lib/utils/response';
import { PrismaClient } from '@prisma/client';
import { generateUuid } from '@/app/lib/utils/crypto';

const prisma = new PrismaClient();

/**
 * POST /api/payments/stripe/webhook
 * Webhook handler para eventos de Stripe
 *
 * @public Endpoint público con verificación de firma
 * @headers stripe-signature
 * @body Evento de Stripe
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return errorResponse(
        ErrorCodes.UNAUTHORIZED,
        'Missing stripe-signature header',
        401
      );
    }

    const { stripe } = initializePaymentServices();

    // Verificar firma del webhook
    const isValid = stripe.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      return errorResponse(
        ErrorCodes.UNAUTHORIZED,
        'Invalid webhook signature',
        401
      );
    }

    const event = JSON.parse(rawBody);

    // Procesar evento según su tipo
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object);
        break;

      case 'charge.refunded':
        await handleRefund(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return successResponse({ received: true }, 200);
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Webhook processing failed',
      500
    );
  }
}

/**
 * Procesa un pago exitoso
 */
async function handlePaymentSuccess(paymentIntent: any) {
  const userId = paymentIntent.metadata?.userId;
  if (!userId) {
    console.error('No userId in payment intent metadata');
    return;
  }

  // Obtener wallet del usuario
  const wallet = await WalletService.getUserWallet(userId);

  // Crear depósito en la wallet
  await WalletService.deposit({
    walletId: wallet.id,
    userId,
    amount: paymentIntent.amount / 100, // Stripe usa centavos
    currency: paymentIntent.currency.toUpperCase(),
    source: 'stripe',
    sourceId: paymentIntent.id,
    description: `Depósito vía Stripe - ${paymentIntent.description || ''}`,
    metadata: paymentIntent.metadata,
    idempotencyKey: `stripe-${paymentIntent.id}`,
  });

  console.log(`Payment succeeded for user ${userId}: $${paymentIntent.amount / 100}`);
}

/**
 * Procesa un pago fallido
 */
async function handlePaymentFailure(paymentIntent: any) {
  const userId = paymentIntent.metadata?.userId;
  if (!userId) return;

  // Registrar fallo en auditoría
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'payment_failed',
      resource: 'payment',
      resourceId: paymentIntent.id,
      metadata: {
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        error: paymentIntent.last_payment_error,
      } as any,
    },
  });

  console.log(`Payment failed for user ${userId}`);
}

/**
 * Procesa un reembolso
 */
async function handleRefund(charge: any) {
  const paymentIntent = charge.payment_intent;

  await prisma.refund.create({
    data: {
      paymentId: paymentIntent,
      amount: charge.amount_refunded / 100,
      currency: charge.currency.toUpperCase(),
      status: 'succeeded',
      reason: 'requested_by_customer',
      provider: 'stripe',
      providerId: charge.refunds.data[0]?.id,
    },
  });

  console.log(`Refund processed: $${charge.amount_refunded / 100}`);
}
