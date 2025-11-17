import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, password, name, email } = body

    // Validar campos requeridos
    if (!phone || !password || !name || !email) {
      return NextResponse.json(
        {
          success: false,
          error: 'Todos los campos son requeridos',
        },
        { status: 400 }
      )
    }

    // Simular creación de usuario
    const newUser = {
      id: `${Date.now()}`,
      phone,
      name,
      email,
      balance: 0,
      currency: 'USD',
      role: 'customer',
      createdAt: new Date().toISOString(),
    }

    // Generar token
    const token = `token-${newUser.id}-${Date.now()}`

    return NextResponse.json(
      {
        success: true,
        data: {
          user: newUser,
          token,
        },
        message: 'Usuario registrado exitosamente',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    )
  }
}
