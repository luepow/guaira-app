import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')

    // Get total count
    const total = await prisma.transaction.count({
      where: { userId },
    })

    // Get paginated transactions
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          transactions: transactions.map((t) => ({
            id: t.id,
            userId: t.userId,
            type: t.type,
            amount: t.amount,
            currency: t.currency,
            status: t.status,
            description: t.description,
            createdAt: t.createdAt.toISOString(),
          })),
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
          },
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get transactions error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    )
  }
}
