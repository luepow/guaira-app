import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { withdrawalSchema } from '@/app/lib/validations/wallet.schema';
import { WalletService } from '@/app/lib/services/wallet.service';
import { successResponse, handleApiError, unauthorizedResponse } from '@/app/lib/utils/response';

/**
 * POST /api/wallet/withdraw
 * Realiza un retiro de la wallet
 *
 * @auth Required
 * @body { amount, currency, destination, destinationId, description, metadata, idempotencyKey }
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
    const validatedData = withdrawalSchema.parse(body);

    // Obtener wallet del usuario
    const wallet = await WalletService.getUserWallet(session.user.id);

    // Obtener metadata
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Realizar retiro
    const transaction = await WalletService.withdraw({
      walletId: wallet.id,
      userId: session.user.id,
      amount: validatedData.amount,
      currency: validatedData.currency,
      destination: validatedData.destination,
      destinationId: validatedData.destinationId,
      description: validatedData.description,
      metadata: validatedData.metadata,
      idempotencyKey: validatedData.idempotencyKey,
      ipAddress,
      userAgent,
    });

    return successResponse(
      {
        transaction,
        message: 'Retiro iniciado exitosamente',
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
