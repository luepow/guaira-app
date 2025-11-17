import { z } from 'zod';

/**
 * Schema de validación para depósitos
 * - Amount positivo con máximo 2 decimales
 * - Idempotency key obligatorio
 * - Source (método de pago) obligatorio
 */
export const depositSchema = z.object({
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
  source: z.enum(['stripe', 'paypal', 'bank_transfer', 'cash'], {
    errorMap: () => ({ message: 'Método de pago inválido' }),
  }),
  sourceId: z.string()
    .min(1, 'ID de fuente requerido')
    .max(255, 'ID de fuente demasiado largo')
    .optional(), // Payment intent ID, transaction ID, etc.
  description: z.string()
    .max(500, 'Descripción demasiado larga')
    .optional(),
  metadata: z.record(z.unknown())
    .optional(),
  idempotencyKey: z.string()
    .uuid('Idempotency key debe ser UUID válido'),
});

/**
 * Schema de validación para retiros
 * - Amount positivo
 * - Destination obligatorio
 * - Idempotency key obligatorio
 */
export const withdrawalSchema = z.object({
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
  destination: z.enum(['bank_account', 'paypal', 'stripe'], {
    errorMap: () => ({ message: 'Destino inválido' }),
  }),
  destinationId: z.string()
    .min(1, 'ID de destino requerido')
    .max(255, 'ID de destino demasiado largo'),
  description: z.string()
    .max(500, 'Descripción demasiado larga')
    .optional(),
  metadata: z.record(z.unknown())
    .optional(),
  idempotencyKey: z.string()
    .uuid('Idempotency key debe ser UUID válido'),
});

/**
 * Schema de validación para transferencias
 * - Amount positivo
 * - Recipient obligatorio
 * - Idempotency key obligatorio
 */
export const transferSchema = z.object({
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
  recipientId: z.string()
    .uuid('ID de destinatario debe ser UUID válido'),
  description: z.string()
    .max(500, 'Descripción demasiado larga')
    .optional(),
  metadata: z.record(z.unknown())
    .optional(),
  idempotencyKey: z.string()
    .uuid('Idempotency key debe ser UUID válido'),
});

/**
 * Schema de validación para creación de wallet
 */
export const createWalletSchema = z.object({
  currency: z.string()
    .length(3, 'Código de moneda debe tener 3 caracteres')
    .toUpperCase()
    .default('USD'),
  initialBalance: z.number()
    .min(0, 'Balance inicial no puede ser negativo')
    .default(0)
    .optional(),
});

/**
 * Schema de validación para actualización de wallet
 */
export const updateWalletSchema = z.object({
  status: z.enum(['active', 'suspended', 'closed'], {
    errorMap: () => ({ message: 'Estado inválido' }),
  }).optional(),
});

/**
 * Schema de validación para query de balance
 */
export const getBalanceSchema = z.object({
  currency: z.string()
    .length(3, 'Código de moneda debe tener 3 caracteres')
    .toUpperCase()
    .optional(),
});

// Types exportados
export type DepositInput = z.infer<typeof depositSchema>;
export type WithdrawalInput = z.infer<typeof withdrawalSchema>;
export type TransferInput = z.infer<typeof transferSchema>;
export type CreateWalletInput = z.infer<typeof createWalletSchema>;
export type UpdateWalletInput = z.infer<typeof updateWalletSchema>;
export type GetBalanceInput = z.infer<typeof getBalanceSchema>;
