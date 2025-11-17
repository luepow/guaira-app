/**
 * Input Validation Schemas
 * PCI-DSS Requirement 6.5.1 - Injection flaws
 *
 * Compliance:
 * - PCI-DSS 6.5.1 (Injection flaws)
 * - OWASP Top 10 A03:2021 - Injection
 */

import { z } from 'zod';

/**
 * Phone number validation
 * Supports international formats
 */
export const phoneSchema = z
  .string()
  .min(10, 'Número de teléfono inválido')
  .max(15, 'Número de teléfono inválido')
  .regex(/^\+?[1-9]\d{1,14}$/, 'Formato de teléfono inválido');

/**
 * Email validation
 */
export const emailSchema = z
  .string()
  .email('Email inválido')
  .max(255, 'Email muy largo');

/**
 * Password validation - PCI-DSS 8.2.3
 * Requirements:
 * - Minimum 12 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const passwordSchema = z
  .string()
  .min(12, 'La contraseña debe tener al menos 12 caracteres')
  .max(128, 'La contraseña es muy larga')
  .regex(/[A-Z]/, 'La contraseña debe incluir al menos una letra mayúscula')
  .regex(/[a-z]/, 'La contraseña debe incluir al menos una letra minúscula')
  .regex(/[0-9]/, 'La contraseña debe incluir al menos un número')
  .regex(
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
    'La contraseña debe incluir al menos un carácter especial'
  );

/**
 * User registration schema
 */
export const registerSchema = z.object({
  phone: phoneSchema,
  email: emailSchema.optional(),
  name: z
    .string()
    .min(2, 'Nombre muy corto')
    .max(100, 'Nombre muy largo')
    .regex(/^[a-zA-Z\s\u00C0-\u017F]+$/, 'Nombre contiene caracteres inválidos'),
  password: passwordSchema,
});

/**
 * Login schema
 */
export const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, 'Contraseña requerida'),
});

/**
 * Amount validation (for payments)
 */
export const amountSchema = z
  .number()
  .positive('El monto debe ser mayor a cero')
  .max(1000000, 'Monto excede el límite permitido')
  .refine((val) => Number.isFinite(val), 'Monto inválido')
  .refine((val) => {
    // Check for reasonable decimal places (max 2)
    const decimalPlaces = (val.toString().split('.')[1] || '').length;
    return decimalPlaces <= 2;
  }, 'Monto debe tener máximo 2 decimales');

/**
 * Payment schema
 */
export const paymentSchema = z.object({
  userId: z.string().uuid('ID de usuario inválido'),
  amount: amountSchema,
  merchantId: z.string().uuid('ID de comercio inválido'),
  description: z.string().max(500, 'Descripción muy larga').optional(),
  items: z
    .array(
      z.object({
        id: z.string(),
        name: z.string().max(200),
        quantity: z.number().int().positive(),
        price: amountSchema,
      })
    )
    .optional(),
});

/**
 * Deposit schema
 */
export const depositSchema = z.object({
  userId: z.string().uuid('ID de usuario inválido'),
  amount: amountSchema,
  paymentMethod: z.enum(['card', 'cash', 'bank_transfer'], {
    errorMap: () => ({ message: 'Método de pago inválido' }),
  }),
  paymentDetails: z.record(z.any()).optional(),
});

/**
 * Transfer schema
 */
export const transferSchema = z.object({
  fromUserId: z.string().uuid('ID de usuario origen inválido'),
  toUserId: z.string().uuid('ID de usuario destino inválido'),
  amount: amountSchema,
  description: z.string().max(500, 'Descripción muy larga').optional(),
});

/**
 * Transaction query schema
 */
export const transactionQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(50),
  type: z.enum(['deposit', 'payment', 'withdrawal', 'transfer']).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

/**
 * User update schema
 */
export const userUpdateSchema = z.object({
  name: z
    .string()
    .min(2, 'Nombre muy corto')
    .max(100, 'Nombre muy largo')
    .optional(),
  email: emailSchema.optional(),
  avatar: z.string().url('URL de avatar inválida').optional(),
});

/**
 * Password change schema
 */
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Contraseña actual requerida'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

/**
 * Sanitize string input
 * Removes potentially dangerous characters
 *
 * @param input - String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/['"]/g, '') // Remove quotes
    .trim();
}

/**
 * Sanitize object recursively
 *
 * @param obj - Object to sanitize
 * @returns Sanitized object
 */
export function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (typeof obj === 'object' && obj !== null) {
    const sanitized: any = {};
    for (const key in obj) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
    return sanitized;
  }

  return obj;
}

/**
 * Validate UUID format
 *
 * @param id - UUID string
 * @returns True if valid UUID
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Validate and parse request body
 *
 * @param schema - Zod schema
 * @param data - Data to validate
 * @returns Validated data
 * @throws Error if validation fails
 */
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((err) => err.message).join(', ');
      throw new Error(`Validación fallida: ${messages}`);
    }
    throw error;
  }
}
