import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, amount, merchantId, description, items } = body

    // Validar campos requeridos
    if (!userId || !amount || !merchantId) {
      return NextResponse.json(
        {
          success: false,
          error: 'userId, amount y merchantId son requeridos',
        },
        { status: 400 }
      )
    }

    // Validar monto
    if (amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'El monto debe ser mayor a cero',
        },
        { status: 400 }
      )
    }

    // Simular pago
    const payment = {
      id: `pay_${Date.now()}`,
      userId,
      merchantId,
      amount,
      currency: 'USD',
      status: 'succeeded',
      description: description || 'Pago en POS',
      items: items || [],
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json(
      {
        success: true,
        data: payment,
        message: 'Pago procesado exitosamente',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Payment error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    )
  }
}
