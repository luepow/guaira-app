import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params

    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    })

    if (!wallet) {
      return NextResponse.json(
        {
          success: false,
          error: 'Billetera no encontrada',
        },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: wallet.id,
          userId: wallet.userId,
          balance: wallet.balance,
          currency: wallet.currency,
          status: wallet.status,
          updatedAt: wallet.updatedAt.toISOString(),
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get wallet error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    )
  }
}
