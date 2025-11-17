import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

// JWT Secret - en producción debe estar en .env
const JWT_SECRET = process.env.JWT_SECRET || 'guair-secret-key-change-in-production-min-32-chars'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { identifier, password } = body

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Email/teléfono y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Buscar usuario por email o teléfono
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier }
        ]
      },
      include: {
        wallet: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    // Verificar contraseña
    const isValid = await bcrypt.compare(password, user.password)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    // Generar JWT real con firma criptográfica
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      JWT_SECRET,
      {
        expiresIn: '7d',
        issuer: 'guair-app',
        audience: 'guair-users'
      }
    )

    // Retornar datos del usuario (sin contraseña)
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      token
    })

  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Handlers para métodos HTTP no permitidos
export async function GET() {
  return NextResponse.json(
    { error: 'Método no permitido. Use POST.' },
    {
      status: 405,
      headers: { 'Allow': 'POST' }
    }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Método no permitido. Use POST.' },
    {
      status: 405,
      headers: { 'Allow': 'POST' }
    }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Método no permitido. Use POST.' },
    {
      status: 405,
      headers: { 'Allow': 'POST' }
    }
  )
}

export async function PATCH() {
  return NextResponse.json(
    { error: 'Método no permitido. Use POST.' },
    {
      status: 405,
      headers: { 'Allow': 'POST' }
    }
  )
}
