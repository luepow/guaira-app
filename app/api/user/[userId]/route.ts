import { NextRequest, NextResponse } from 'next/server'

// Mock user data
const MOCK_USERS: Record<string, any> = {
  '1': {
    id: '1',
    phone: '+584121234567',
    name: 'Usuario Demo',
    email: 'demo@guair.app',
    balance: 25000,
    currency: 'USD',
    role: 'merchant',
    avatar: '/avatars/demo.png',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  '2': {
    id: '2',
    phone: '+584129876543',
    name: 'Usuario Test',
    email: 'test@guair.app',
    balance: 15000,
    currency: 'USD',
    role: 'customer',
    avatar: '/avatars/test.png',
    createdAt: '2024-01-15T00:00:00.000Z',
  },
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params

    const user = MOCK_USERS[userId]

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Usuario no encontrado',
        },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: user,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params
    const body = await request.json()

    const user = MOCK_USERS[userId]

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Usuario no encontrado',
        },
        { status: 404 }
      )
    }

    // Actualizar usuario
    const updatedUser = {
      ...user,
      ...body,
      id: userId, // No permitir cambiar el ID
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json(
      {
        success: true,
        data: updatedUser,
        message: 'Perfil actualizado exitosamente',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    )
  }
}
