import { z } from 'zod';

/**
 * Schema de validación para creación de transacción
 */
export const createTransactionSchema = z.object({
  walletId: z.string()
    .uuid('ID de wallet debe ser UUID válido'),
  type: z.enum(['deposit', 'payment', 'withdrawal', 'transfer', 'refund'], {
    errorMap: () => ({ message: 'Tipo de transacción inválido' }),
  }),
  amount: z.number()
    .positive('Monto debe ser positivo')
    .max(1000000, 'Monto máximo excedido')
    .refine((val) => Number(val.toFixed(2)) === val, {
      message: 'Monto debe tener máximo 2 decimales',
    }),
  currency: z.string()
    .length(3, 'Código de moneda debe tener 3 caracteres')
    .toUpperCase()
    .default('USD'),
  description: z.string()
    .max(500, 'Descripción demasiado larga')
    .optional(),
  metadata: z.record(z.unknown())
    .optional(),
  idempotencyKey: z.string()
    .uuid('Idempotency key debe ser UUID válido'),
});

/**
 * Schema de validación para listado de transacciones con paginación
 */
export const listTransactionsSchema = z.object({
  page: z.number()
    .int('Página debe ser número entero')
    .positive('Página debe ser positiva')
    .default(1),
  limit: z.number()
    .int('Límite debe ser número entero')
    .positive('Límite debe ser positivo')
    .max(100, 'Límite máximo es 100')
    .default(20),
  type: z.enum(['deposit', 'payment', 'withdrawal', 'transfer', 'refund'])
    .optional(),
  status: z.enum(['pending', 'processing', 'succeeded', 'failed', 'cancelled'])
    .optional(),
  startDate: z.string()
    .datetime('Fecha de inicio inválida')
    .optional(),
  endDate: z.string()
    .datetime('Fecha de fin inválida')
    .optional(),
  walletId: z.string()
    .uuid('ID de wallet debe ser UUID válido')
    .optional(),
  sortBy: z.enum(['createdAt', 'amount', 'status'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc'])
    .default('desc'),
});

/**
 * Schema de validación para obtener detalle de transacción
 */
export const getTransactionSchema = z.object({
  transactionId: z.string()
    .uuid('ID de transacción debe ser UUID válido'),
});

/**
 * Schema de validación para exportar transacciones
 */
export const exportTransactionsSchema = z.object({
  format: z.enum(['csv', 'xlsx', 'pdf'], {
    errorMap: () => ({ message: 'Formato de exportación inválido' }),
  }).default('csv'),
  startDate: z.string()
    .datetime('Fecha de inicio inválida'),
  endDate: z.string()
    .datetime('Fecha de fin inválida'),
  type: z.enum(['deposit', 'payment', 'withdrawal', 'transfer', 'refund'])
    .optional(),
  status: z.enum(['pending', 'processing', 'succeeded', 'failed', 'cancelled'])
    .optional(),
  walletId: z.string()
    .uuid('ID de wallet debe ser UUID válido')
    .optional(),
});

/**
 * Schema de validación para analytics de transacciones
 */
export const transactionAnalyticsSchema = z.object({
  startDate: z.string()
    .datetime('Fecha de inicio inválida'),
  endDate: z.string()
    .datetime('Fecha de fin inválida'),
  groupBy: z.enum(['day', 'week', 'month'], {
    errorMap: () => ({ message: 'Agrupación inválida' }),
  }).default('day'),
  walletId: z.string()
    .uuid('ID de wallet debe ser UUID válido')
    .optional(),
});

/**
 * Schema de validación para actualización de estado de transacción
 */
export const updateTransactionStatusSchema = z.object({
  transactionId: z.string()
    .uuid('ID de transacción debe ser UUID válido'),
  status: z.enum(['pending', 'processing', 'succeeded', 'failed', 'cancelled'], {
    errorMap: () => ({ message: 'Estado inválido' }),
  }),
  failureReason: z.string()
    .max(500, 'Razón de falla demasiado larga')
    .optional(),
});

// Types exportados
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type ListTransactionsInput = z.infer<typeof listTransactionsSchema>;
export type GetTransactionInput = z.infer<typeof getTransactionSchema>;
export type ExportTransactionsInput = z.infer<typeof exportTransactionsSchema>;
export type TransactionAnalyticsInput = z.infer<typeof transactionAnalyticsSchema>;
export type UpdateTransactionStatusInput = z.infer<typeof updateTransactionStatusSchema>;
