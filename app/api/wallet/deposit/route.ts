import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { depositSchema } from '@/app/lib/validations/wallet.schema';
import { WalletService } from '@/app/lib/services/wallet.service';
import { successResponse, handleApiError, unauthorizedResponse } from '@/app/lib/utils/response';

/**
 * POST /api/wallet/deposit
 * Realiza un depósito en la wallet
 *
 * @auth Required
 * @body { amount, currency, source, sourceId, description, metadata, idempotencyKey }
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
    const validatedData = depositSchema.parse(body);

    // Obtener wallet del usuario
    const wallet = await WalletService.getUserWallet(session.user.id);

    // Obtener metadata
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Realizar depósito
    const transaction = await WalletService.deposit({
      walletId: wallet.id,
      userId: session.user.id,
      amount: validatedData.amount,
      currency: validatedData.currency,
      source: validatedData.source,
      sourceId: validatedData.sourceId,
      description: validatedData.description,
      metadata: validatedData.metadata,
      idempotencyKey: validatedData.idempotencyKey,
      ipAddress,
      userAgent,
    });

    return successResponse(
      {
        transaction,
        message: 'Depósito realizado exitosamente',
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
