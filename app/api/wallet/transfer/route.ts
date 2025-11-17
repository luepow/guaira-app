import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { transferSchema } from '@/app/lib/validations/wallet.schema';
import { WalletService } from '@/app/lib/services/wallet.service';
import { successResponse, handleApiError, unauthorizedResponse } from '@/app/lib/utils/response';

/**
 * POST /api/wallet/transfer
 * Realiza una transferencia entre wallets
 *
 * @auth Required
 * @body { amount, currency, recipientId, description, metadata, idempotencyKey }
 * @returns Transaction
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession();
    if (!session?.user?.id) {
      return unauthorizedResponse();
    }

    const body = await request.json();

    // Validar entrada
    const validatedData = transferSchema.parse(body);

    // Obtener wallet del usuario
    const wallet = await WalletService.getUserWallet(session.user.id);

    // Obtener metadata
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Realizar transferencia
    const transaction = await WalletService.transfer({
      fromWalletId: wallet.id,
      fromUserId: session.user.id,
      toUserId: validatedData.recipientId,
      amount: validatedData.amount,
      currency: validatedData.currency,
      description: validatedData.description,
      metadata: validatedData.metadata,
      idempotencyKey: validatedData.idempotencyKey,
      ipAddress,
      userAgent,
    });

    return successResponse(
      {
        transaction,
        message: 'Transferencia realizada exitosamente',
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
