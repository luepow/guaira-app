import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { successResponse, handleApiError, unauthorizedResponse, notFoundResponse, errorResponse, ErrorCodes } from '@/app/lib/utils/response';

const prisma = new PrismaClient();

/**
 * GET /api/transactions/[id]
 * Obtiene detalle de una transacción
 *
 * @auth Required
 * @param id Transaction ID
 * @returns Transaction details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return unauthorizedResponse();
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: params.id },
      include: {
        wallet: {
          select: {
            id: true,
            currency: true,
            balance: true,
          },
        },
        ledgerEntries: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!transaction) {
      return notFoundResponse('Transacción');
    }

    // Verificar que la transacción pertenece al usuario
    if (transaction.userId !== session.user.id) {
      return errorResponse(
        ErrorCodes.FORBIDDEN,
        'No tienes permiso para ver esta transacción',
        403
      );
    }

    return successResponse({ transaction }, 200);
  } catch (error) {
    return handleApiError(error);
  }
}
