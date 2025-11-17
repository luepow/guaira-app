import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

/**
 * Estructura estándar de respuesta API
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  metadata?: {
    timestamp: string;
    requestId?: string;
    [key: string]: unknown;
  };
}

/**
 * Códigos de error estándar
 */
export const ErrorCodes = {
  // Validación
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // Autenticación y Autorización
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // OTP
  OTP_EXPIRED: 'OTP_EXPIRED',
  OTP_INVALID: 'OTP_INVALID',
  OTP_MAX_ATTEMPTS: 'OTP_MAX_ATTEMPTS',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',

  // Recursos
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // Wallet y Transacciones
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  WALLET_SUSPENDED: 'WALLET_SUSPENDED',
  WALLET_NOT_FOUND: 'WALLET_NOT_FOUND',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  DUPLICATE_TRANSACTION: 'DUPLICATE_TRANSACTION',

  // Pagos
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_PROCESSING: 'PAYMENT_PROCESSING',
  REFUND_FAILED: 'REFUND_FAILED',

  // Genéricos
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  BAD_REQUEST: 'BAD_REQUEST',
} as const;

/**
 * Helper para crear respuestas de éxito
 */
export function successResponse<T>(
  data: T,
  status: number = 200,
  metadata?: Record<string, unknown>
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        ...metadata,
      },
    },
    { status }
  );
}

/**
 * Helper para crear respuestas de error
 */
export function errorResponse(
  code: string,
  message: string,
  status: number = 400,
  details?: unknown
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
      metadata: {
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

/**
 * Helper para manejar errores de Zod
 */
export function validationErrorResponse(
  error: ZodError
): NextResponse<ApiResponse> {
  const details = error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));

  return errorResponse(
    ErrorCodes.VALIDATION_ERROR,
    'Error de validación en los datos enviados',
    400,
    details
  );
}

/**
 * Helper para manejar errores de rate limiting
 */
export function rateLimitErrorResponse(
  remainingAttempts: number,
  resetAt: Date
): NextResponse<ApiResponse> {
  return errorResponse(
    ErrorCodes.RATE_LIMIT_EXCEEDED,
    'Demasiados intentos. Por favor, inténtalo más tarde.',
    429,
    {
      remainingAttempts,
      resetAt: resetAt.toISOString(),
    }
  );
}

/**
 * Helper para manejar errores no autorizados
 */
export function unauthorizedResponse(
  message: string = 'No autorizado'
): NextResponse<ApiResponse> {
  return errorResponse(ErrorCodes.UNAUTHORIZED, message, 401);
}

/**
 * Helper para manejar errores de recurso no encontrado
 */
export function notFoundResponse(
  resource: string = 'Recurso'
): NextResponse<ApiResponse> {
  return errorResponse(
    ErrorCodes.NOT_FOUND,
    `${resource} no encontrado`,
    404
  );
}

/**
 * Helper para manejar errores de conflicto
 */
export function conflictResponse(
  message: string = 'El recurso ya existe'
): NextResponse<ApiResponse> {
  return errorResponse(ErrorCodes.CONFLICT, message, 409);
}

/**
 * Helper para manejar errores internos del servidor
 */
export function internalErrorResponse(
  message: string = 'Error interno del servidor',
  details?: unknown
): NextResponse<ApiResponse> {
  // En producción, no exponer detalles internos
  const exposedDetails = process.env.NODE_ENV === 'development' ? details : undefined;

  return errorResponse(
    ErrorCodes.INTERNAL_ERROR,
    message,
    500,
    exposedDetails
  );
}

/**
 * Wrapper para manejar errores en API routes
 */
export async function handleApiError(error: unknown): Promise<NextResponse<ApiResponse>> {
  console.error('API Error:', error);

  // Error de validación con Zod
  if (error instanceof ZodError) {
    return validationErrorResponse(error);
  }

  // Error personalizado con código
  if (error instanceof Error && 'code' in error) {
    const customError = error as Error & { code: string; statusCode?: number };
    return errorResponse(
      customError.code,
      customError.message,
      customError.statusCode || 400
    );
  }

  // Error genérico
  if (error instanceof Error) {
    return internalErrorResponse(error.message, {
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }

  // Error desconocido
  return internalErrorResponse('Error desconocido', error);
}

/**
 * Custom Error Classes
 */
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(ErrorCodes.VALIDATION_ERROR, message, 400, details);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'No autorizado') {
    super(ErrorCodes.UNAUTHORIZED, message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Acceso prohibido') {
    super(ErrorCodes.FORBIDDEN, message, 403);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Recurso') {
    super(ErrorCodes.NOT_FOUND, `${resource} no encontrado`, 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'El recurso ya existe') {
    super(ErrorCodes.CONFLICT, message, 409);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(resetAt: Date, remainingAttempts: number = 0) {
    super(
      ErrorCodes.RATE_LIMIT_EXCEEDED,
      'Demasiados intentos. Por favor, inténtalo más tarde.',
      429,
      { resetAt, remainingAttempts }
    );
    this.name = 'RateLimitError';
  }
}

export class InsufficientBalanceError extends AppError {
  constructor(available: number, required: number) {
    super(
      ErrorCodes.INSUFFICIENT_BALANCE,
      'Saldo insuficiente',
      400,
      { available, required }
    );
    this.name = 'InsufficientBalanceError';
  }
}
