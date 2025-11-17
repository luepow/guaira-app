import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { capturePayPalOrderSchema } from '@/app/lib/validations/payment.schema';
import { initializePaymentServices } from '@/app/lib/services/payment.service';
import { WalletService } from '@/app/lib/services/wallet.service';
import { successResponse, handleApiError, unauthorizedResponse } from '@/app/lib/utils/response';

/**
 * POST /api/payments/paypal/capture
 * Captura una orden de PayPal aprobada
 *
 * @auth Required
 * @body { orderId }
 * @returns Captured order
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const validatedData = capturePayPalOrderSchema.parse(body);

    const { paypal } = initializePaymentServices();

    // Capturar orden
    const capture = await paypal.captureOrder(validatedData.orderId);

    // Obtener monto del pago
    const amount = parseFloat(capture.purchase_units[0].payments.captures[0].amount.value);
    const currency = capture.purchase_units[0].payments.captures[0].amount.currency_code;

    // Obtener wallet del usuario
    const wallet = await WalletService.getUserWallet(session.user.id);

    // Crear depósito en la wallet
    await WalletService.deposit({
      walletId: wallet.id,
      userId: session.user.id,
      amount,
      currency,
      source: 'paypal',
      sourceId: validatedData.orderId,
      description: 'Depósito vía PayPal',
      metadata: { captureId: capture.id },
      idempotencyKey: `paypal-${validatedData.orderId}`,
    });

    return successResponse({
      capture,
      message: 'Pago capturado y depositado exitosamente',
    }, 200);
  } catch (error) {
    return handleApiError(error);
  }
}
