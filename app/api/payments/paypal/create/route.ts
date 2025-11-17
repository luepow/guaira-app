import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { createPayPalOrderSchema } from '@/app/lib/validations/payment.schema';
import { initializePaymentServices } from '@/app/lib/services/payment.service';
import { successResponse, handleApiError, unauthorizedResponse } from '@/app/lib/utils/response';
import { AuditService } from '@/app/lib/utils/audit';

/**
 * POST /api/payments/paypal/create
 * Crea una orden de PayPal
 *
 * @auth Required
 * @body { amount, currency, description }
 * @returns PayPal Order
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const validatedData = createPayPalOrderSchema.parse(body);

    const { paypal } = initializePaymentServices();

    // Crear orden de PayPal
    const order = await paypal.createOrder({
      amount: validatedData.amount,
      currency: validatedData.currency,
      description: validatedData.description,
    });

    // Auditoría
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    await AuditService.log({
      userId: session.user.id,
      action: 'paypal_order_created',
      resource: 'payment',
      resourceId: order.id,
      metadata: {
        amount: validatedData.amount,
        currency: validatedData.currency,
      },
      ipAddress,
      userAgent,
    });

    return successResponse({
      orderId: order.id,
      approvalUrl: order.links.find((link: any) => link.rel === 'approve')?.href,
    }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
