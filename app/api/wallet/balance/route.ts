import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { WalletService } from '@/app/lib/services/wallet.service';
import { successResponse, handleApiError, unauthorizedResponse } from '@/app/lib/utils/response';

/**
 * GET /api/wallet/balance
 * Obtiene el balance actual de la wallet del usuario
 *
 * @auth Required
 * @returns { balance, currency, status }
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession();
    if (!session?.user?.id) {
      return unauthorizedResponse();
    }

    // Obtener wallet del usuario
    const wallet = await WalletService.getUserWallet(session.user.id);

    return successResponse(
      {
        walletId: wallet.id,
        balance: wallet.balance,
        currency: wallet.currency,
        status: wallet.status,
      },
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
