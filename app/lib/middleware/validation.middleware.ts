import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema } from 'zod';
import { validationErrorResponse } from '../utils/response';

/**
 * Middleware de validación con Zod
 * Valida el body de la request contra un schema de Zod
 */
export function withValidation<T>(
  handler: (request: NextRequest, validatedData: T, ...args: any[]) => Promise<NextResponse>,
  schema: ZodSchema<T>
) {
  return async function (request: NextRequest, ...args: any[]) {
    try {
      const body = await request.json();
      const validatedData = schema.parse(body);

      return handler(request, validatedData, ...args);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return validationErrorResponse(error);
      }

      // Re-throw otros errores
      throw error;
    }
  };
}

/**
 * Middleware de validación para query params
 */
export function withQueryValidation<T>(
  handler: (request: NextRequest, validatedQuery: T, ...args: any[]) => Promise<NextResponse>,
  schema: ZodSchema<T>
) {
  return async function (request: NextRequest, ...args: any[]) {
    try {
      const { searchParams } = new URL(request.url);
      const query = Object.fromEntries(searchParams.entries());

      // Convertir strings numéricos a números
      const parsedQuery = Object.entries(query).reduce((acc, [key, value]) => {
        const numValue = Number(value);
        return {
          ...acc,
          [key]: isNaN(numValue) ? value : numValue,
        };
      }, {});

      const validatedData = schema.parse(parsedQuery);

      return handler(request, validatedData, ...args);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return validationErrorResponse(error);
      }

      throw error;
    }
  };
}
