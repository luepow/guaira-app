import { z } from 'zod';

/**
 * Schema de validación para crear Payment Intent con Stripe
 */
export const createStripePaymentSchema = z.object({
  amount: z.number()
    .positive('Monto debe ser positivo')
    .max(1000000, 'Monto máximo excedido')
    .refine((val) => Number(val.toFixed(2)) === val, {
      message: 'Monto debe tener máximo 2 decimales',
    }),
  currency: z.string()
    .length(3, 'Código de moneda debe tener 3 caracteres')
    .toLowerCase()
    .default('usd'),
  description: z.string()
    .max(500, 'Descripción demasiado larga')
    .optional(),
  metadata: z.record(z.string())
    .optional(),
  paymentMethodId: z.string()
    .min(1, 'Payment method ID requerido')
    .optional(), // Si se provee, se confirma automáticamente
});

/**
 * Schema de validación para confirmar Payment Intent
 */
export const confirmStripePaymentSchema = z.object({
  paymentIntentId: z.string()
    .min(1, 'Payment Intent ID requerido'),
  paymentMethodId: z.string()
    .min(1, 'Payment method ID requerido'),
});

/**
 * Schema de validación para crear orden de PayPal
 */
export const createPayPalOrderSchema = z.object({
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
  returnUrl: z.string()
    .url('URL de retorno inválida')
    .optional(),
  cancelUrl: z.string()
    .url('URL de cancelación inválida')
    .optional(),
});

/**
 * Schema de validación para capturar orden de PayPal
 */
export const capturePayPalOrderSchema = z.object({
  orderId: z.string()
    .min(1, 'Order ID requerido'),
});

/**
 * Schema de validación para reembolso
 */
export const refundPaymentSchema = z.object({
  paymentId: z.string()
    .min(1, 'Payment ID requerido'),
  amount: z.number()
    .positive('Monto debe ser positivo')
    .optional(), // Si no se provee, reembolso total
  reason: z.enum([
    'duplicate',
    'fraudulent',
    'requested_by_customer',
    'other'
  ]).default('requested_by_customer'),
  description: z.string()
    .max(500, 'Descripción demasiado larga')
    .optional(),
});

/**
 * Schema de validación para agregar método de pago
 */
export const addPaymentMethodSchema = z.object({
  provider: z.enum(['stripe', 'paypal'], {
    errorMap: () => ({ message: 'Proveedor inválido' }),
  }),
  methodId: z.string()
    .min(1, 'Method ID requerido'),
  type: z.enum(['card', 'bank_account', 'paypal_account'], {
    errorMap: () => ({ message: 'Tipo de método inválido' }),
  }),
  isDefault: z.boolean()
    .default(false),
  metadata: z.record(z.unknown())
    .optional(),
});

/**
 * Schema de validación para webhook de Stripe
 */
export const stripeWebhookSchema = z.object({
  signature: z.string()
    .min(1, 'Signature requerida'),
  rawBody: z.string()
    .min(1, 'Body requerido'),
});

/**
 * Schema de validación para webhook de PayPal
 */
export const paypalWebhookSchema = z.object({
  transmissionId: z.string()
    .min(1, 'Transmission ID requerido'),
  transmissionTime: z.string()
    .min(1, 'Transmission time requerido'),
  certUrl: z.string()
    .url('Cert URL inválida'),
  authAlgo: z.string()
    .min(1, 'Auth algo requerido'),
  transmissionSig: z.string()
    .min(1, 'Transmission signature requerida'),
  webhookId: z.string()
    .min(1, 'Webhook ID requerido'),
  webhookEvent: z.record(z.unknown()),
});

// Types exportados
export type CreateStripePaymentInput = z.infer<typeof createStripePaymentSchema>;
export type ConfirmStripePaymentInput = z.infer<typeof confirmStripePaymentSchema>;
export type CreatePayPalOrderInput = z.infer<typeof createPayPalOrderSchema>;
export type CapturePayPalOrderInput = z.infer<typeof capturePayPalOrderSchema>;
export type RefundPaymentInput = z.infer<typeof refundPaymentSchema>;
export type AddPaymentMethodInput = z.infer<typeof addPaymentMethodSchema>;
export type StripeWebhookInput = z.infer<typeof stripeWebhookSchema>;
export type PayPalWebhookInput = z.infer<typeof paypalWebhookSchema>;
