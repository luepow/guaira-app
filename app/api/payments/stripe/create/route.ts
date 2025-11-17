import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { createStripePaymentSchema } from '@/app/lib/validations/payment.schema';
import { initializePaymentServices } from '@/app/lib/services/payment.service';
import { successResponse, handleApiError, unauthorizedResponse } from '@/app/lib/utils/response';
import { AuditService } from '@/app/lib/utils/audit';

/**
 * POST /api/payments/stripe/create
 * Crea un Payment Intent con Stripe
 *
 * @auth Required
 * @body { amount, currency, description, metadata, paymentMethodId? }
 * @returns PaymentIntent
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const validatedData = createStripePaymentSchema.parse(body);

    const { stripe } = initializePaymentServices();

    // Crear Payment Intent
    const paymentIntent = await stripe.createPaymentIntent({
      amount: validatedData.amount,
      currency: validatedData.currency,
      description: validatedData.description,
      metadata: {
        ...validatedData.metadata,
        userId: session.user.id,
      },
      paymentMethodId: validatedData.paymentMethodId,
    });

    // Auditoría
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    await AuditService.log({
      userId: session.user.id,
      action: 'stripe_payment_created',
      resource: 'payment',
      resourceId: paymentIntent.id,
      metadata: {
        amount: validatedData.amount,
        currency: validatedData.currency,
      },
      ipAddress,
      userAgent,
    });

    return successResponse({
      paymentIntent,
      clientSecret: paymentIntent.client_secret,
    }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
