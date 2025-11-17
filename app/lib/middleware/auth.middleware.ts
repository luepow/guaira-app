import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { unauthorizedResponse, errorResponse, ErrorCodes } from '../utils/response';

/**
 * Middleware de autenticación para API routes
 * Verifica que el usuario esté autenticado
 */
export function withAuth(
  handler: (request: NextRequest, session: any, ...args: any[]) => Promise<NextResponse>
) {
  return async function (request: NextRequest, ...args: any[]) {
    try {
      const session = await getServerSession();

      if (!session || !session.user) {
        return unauthorizedResponse('Debes estar autenticado para acceder a este recurso');
      }

      // Pasar la sesión al handler
      return handler(request, session, ...args);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return errorResponse(
        ErrorCodes.INTERNAL_ERROR,
        'Error al verificar autenticación',
        500
      );
    }
  };
}

/**
 * Middleware de autorización por roles
 */
export function withRole(
  handler: (request: NextRequest, session: any, ...args: any[]) => Promise<NextResponse>,
  allowedRoles: string[]
) {
  return withAuth(async function (request: NextRequest, session: any, ...args: any[]) {
    if (!allowedRoles.includes(session.user.role)) {
      return errorResponse(
        ErrorCodes.FORBIDDEN,
        'No tienes permisos para acceder a este recurso',
        403
      );
    }

    return handler(request, session, ...args);
  });
}
