import { z } from 'zod';

/**
 * Schema de validación para generación de OTP
 * - Email válido y normalizado
 * - Rate limiting aplicado en controller
 */
export const generateOtpSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .toLowerCase()
    .trim()
    .max(255, 'Email demasiado largo'),
});

/**
 * Schema de validación para verificación de OTP
 * - Email válido
 * - OTP de exactamente 6 dígitos numéricos
 */
export const verifyOtpSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .toLowerCase()
    .trim(),
  otp: z.string()
    .length(6, 'OTP debe tener 6 dígitos')
    .regex(/^\d{6}$/, 'OTP debe contener solo números'),
});

/**
 * Schema de validación para registro de usuario
 */
export const registerSchema = z.object({
  phone: z.string()
    .min(10, 'Teléfono debe tener al menos 10 caracteres')
    .max(20, 'Teléfono demasiado largo')
    .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/, 'Formato de teléfono inválido'),
  password: z.string()
    .min(8, 'Contraseña debe tener al menos 8 caracteres')
    .max(100, 'Contraseña demasiado larga')
    .regex(/[A-Z]/, 'Contraseña debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Contraseña debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Contraseña debe contener al menos un número'),
  name: z.string()
    .min(2, 'Nombre debe tener al menos 2 caracteres')
    .max(100, 'Nombre demasiado largo')
    .trim(),
  email: z.string()
    .email('Email inválido')
    .toLowerCase()
    .trim()
    .optional(),
});

/**
 * Schema de validación para login
 */
export const loginSchema = z.object({
  phone: z.string()
    .min(10, 'Teléfono inválido'),
  password: z.string()
    .min(1, 'Contraseña requerida'),
});

/**
 * Schema de validación para reseteo de contraseña
 */
export const resetPasswordSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .toLowerCase()
    .trim(),
  otp: z.string()
    .length(6, 'OTP debe tener 6 dígitos')
    .regex(/^\d{6}$/, 'OTP debe contener solo números'),
  newPassword: z.string()
    .min(8, 'Contraseña debe tener al menos 8 caracteres')
    .max(100, 'Contraseña demasiado larga')
    .regex(/[A-Z]/, 'Contraseña debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Contraseña debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Contraseña debe contener al menos un número'),
});

// Types exportados
export type GenerateOtpInput = z.infer<typeof generateOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
