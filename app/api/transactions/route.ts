import { NextRequest } from 'next/server';
import { getServerSession } from 'next/server-auth';
import { PrismaClient } from '@prisma/client';
import { successResponse, handleApiError, unauthorizedResponse } from '@/app/lib/utils/response';

const prisma = new PrismaClient();

/**
 * GET /api/transactions
 * Lista transacciones del usuario con paginación y filtros
 *
 * @auth Required
 * @query { page?, limit?, type?, status?, startDate?, endDate?, sortBy?, sortOrder? }
 * @returns Paginatedz transactions
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);

    // Parámetros de paginación
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const skip = (page - 1) * limit;

    // Filtros
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Construir where clause
    const where: any = {
      userId: session.user.id,
    };

    if (type) where.type = type;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Ejecutar queries en paralelo
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
        include: {
          wallet: {
            select: {
              id: true,
              currency: true,
            },
          },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    return successResponse({
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    }, 200);
  } catch (error) {
    return handleApiError(error);
  }
}
