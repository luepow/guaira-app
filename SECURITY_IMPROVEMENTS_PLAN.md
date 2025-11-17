# PLAN DE MEJORAS DE SEGURIDAD - GUAIRA.APP
## Sistema de Billetera Digital y Punto de Venta

**Fecha:** 2025-11-16
**Responsable:** Chief Systems Architect & Global PMO Director
**Prioridad:** CRITICA - P0

---

## INDICE

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Roadmap de Seguridad](#2-roadmap-de-seguridad)
3. [Mejoras Criticas (P0)](#3-mejoras-criticas-p0)
4. [Mejoras de Alta Prioridad (P1)](#4-mejoras-de-alta-prioridad-p1)
5. [Mejoras de Media Prioridad (P2)](#5-mejoras-de-media-prioridad-p2)
6. [Checklist PCI-DSS](#6-checklist-pci-dss)
7. [Plan de Testing de Seguridad](#7-plan-de-testing-de-seguridad)

---

## 1. RESUMEN EJECUTIVO

Este documento detalla el plan completo de mejoras de seguridad para Guaira.app. El sistema actualmente presenta **vulnerabilidades criticas** que deben ser resueltas antes de cualquier deployment en produccion.

### 1.1 Situacion Actual

- **Score de Seguridad:** 15/100
- **Vulnerabilidades Criticas:** 5
- **Vulnerabilidades Altas:** 5
- **Vulnerabilidades Medias:** 8
- **PCI-DSS Compliance:** 0%
- **Veredicto:** NOT PRODUCTION READY

### 1.2 Tiempo Estimado de Implementacion

| Fase | Duracion | Esfuerzo |
|------|----------|----------|
| **Fase 1 - Criticas (P0)** | 2-3 semanas | 120-160 horas |
| **Fase 2 - Alta Prioridad (P1)** | 3-4 semanas | 160-200 horas |
| **Fase 3 - Media Prioridad (P2)** | 4-6 semanas | 200-280 horas |
| **Testing & Auditoria** | 2-3 semanas | 80-120 horas |
| **TOTAL** | 11-16 semanas | 560-760 horas |

### 1.3 Recursos Necesarios

- **Backend Developer Senior:** 1 FTE (Full Time Equivalent)
- **Security Engineer:** 0.5 FTE
- **DevOps Engineer:** 0.5 FTE
- **QA/Testing Engineer:** 0.5 FTE
- **External Security Auditor:** Consultoria puntual

---

## 2. ROADMAP DE SEGURIDAD

```
TIMELINE (16 SEMANAS)

SEMANA 1-3: FASE 1 - BLOQUEADORES CRITICOS (P0)
├─ Password Hashing Implementation
├─ JWT Token System
├─ Secret Management
├─ Input Validation Layer
└─ Rate Limiting

SEMANA 4-7: FASE 2 - ALTA PRIORIDAD (P1)
├─ Two-Factor Authentication (2FA)
├─ OTP System for Transactions
├─ Data Encryption at Rest
├─ Audit Logging System
└─ HTTPS & Security Headers

SEMANA 8-13: FASE 3 - MEDIA PRIORIDAD (P2)
├─ Double-Entry Accounting
├─ Advanced Authorization (RBAC/ABAC)
├─ Session Management Enhanced
├─ API Security Hardening
├─ Database Security
└─ Monitoring & Alerting

SEMANA 14-16: TESTING & AUDITORIA
├─ Security Testing Suite
├─ Penetration Testing
├─ External Security Audit
├─ PCI-DSS Assessment
└─ Documentation & Training

┌────────────────────────────────────────────┐
│  OBJETIVO: 90%+ Security Score             │
│  TARGET: PCI-DSS SAQ-A Compliant           │
└────────────────────────────────────────────┘
```

---

## 3. MEJORAS CRITICAS (P0)

### 3.1 Password Hashing con Bcrypt

**PROBLEMA ACTUAL:**
```typescript
// ❌ CRITICO: Passwords en texto plano
password: 'demo123',  // prisma/seed.ts
if (user.password !== password) { ... }  // login route
```

**SOLUCION:**

#### 3.1.1 Crear Utilidades de Crypto

```typescript
// lib/crypto/password.ts

import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export const SALT_ROUNDS = 12; // Incrementar a 14 en produccion

export interface PasswordHashResult {
  hash: string;
  salt: string;
}

/**
 * Hash a password using bcrypt
 * @param password - Plain text password
 * @returns Hash and salt
 */
export async function hashPassword(
  password: string
): Promise<PasswordHashResult> {
  // Validar password
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  if (password.length > 100) {
    throw new Error('Password too long');
  }

  // Generar salt
  const salt = await bcrypt.genSalt(SALT_ROUNDS);

  // Hash password
  const hash = await bcrypt.hash(password, salt);

  return { hash, salt };
}

/**
 * Verify a password against a hash
 * @param password - Plain text password to verify
 * @param hash - Stored hash
 * @returns True if password matches
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * Check if password meets complexity requirements
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  if (password.length > 100) {
    errors.push('Password must not exceed 100 characters');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

#### 3.1.2 Actualizar Schema Prisma

```prisma
// prisma/schema.prisma

model User {
  id                String    @id @default(uuid())
  phone             String    @unique
  passwordHash      String    // Cambiar de 'password'
  passwordSalt      String    // Nuevo campo
  passwordUpdatedAt DateTime  @default(now())
  // ... resto de campos
}
```

#### 3.1.3 Migration Script

```typescript
// prisma/migrations/hash-existing-passwords.ts

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../lib/crypto/password';

const prisma = new PrismaClient();

async function migratePasswords() {
  console.log('🔄 Starting password migration...');

  const users = await prisma.user.findMany({
    select: { id: true, password: true }
  });

  for (const user of users) {
    if (!user.password) continue;

    const { hash, salt } = await hashPassword(user.password);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hash,
        passwordSalt: salt,
      },
    });

    console.log(`✅ Migrated password for user ${user.id}`);
  }

  console.log('✅ Password migration completed!');
}

migratePasswords()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

#### 3.1.4 Actualizar Login Route

```typescript
// app/api/auth/login/route.ts

import { verifyPassword } from '@/lib/crypto/password';

export async function POST(request: NextRequest) {
  const { phone, password } = await request.json();

  const user = await prisma.user.findUnique({
    where: { phone },
    select: {
      id: true,
      passwordHash: true,
      status: true,
      role: true,
    },
  });

  if (!user) {
    // Timing attack prevention
    await verifyPassword('dummy', '$2a$12$dummyhash');
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  }

  const isValid = await verifyPassword(password, user.passwordHash);

  if (!isValid) {
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  }

  // Continue with token generation...
}
```

**CHECKLIST:**
- [ ] Instalar `bcryptjs` y `@types/bcryptjs`
- [ ] Crear `lib/crypto/password.ts`
- [ ] Actualizar Prisma schema
- [ ] Crear y ejecutar migration
- [ ] Actualizar login route
- [ ] Actualizar register route
- [ ] Actualizar seed script
- [ ] Testing: Unit tests para crypto functions
- [ ] Testing: Integration tests para login
- [ ] Documentation: Documentar en README

**TIEMPO ESTIMADO:** 16-24 horas
**PRIORIDAD:** P0 - BLOCKER

---

### 3.2 JWT Token System

**PROBLEMA ACTUAL:**
```typescript
// ❌ Token simple, no firmado
const token = `token-${user.id}-${Date.now()}`;
```

**SOLUCION:**

#### 3.2.1 Crear JWT Utilities

```typescript
// lib/auth/jwt.ts

import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const JWT_EXPIRATION = '1h';
const JWT_REFRESH_EXPIRATION = '7d';

export interface JWTPayload {
  userId: string;
  role: string;
  sessionId: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Generate JWT access token
 */
export async function generateAccessToken(
  payload: Omit<JWTPayload, 'iat' | 'exp'>
): Promise<string> {
  return jwt.sign(
    payload,
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRATION,
      issuer: 'guaira.app',
      audience: 'guaira-api',
      algorithm: 'HS512',
      jwtid: crypto.randomUUID(),
    }
  );
}

/**
 * Generate JWT refresh token
 */
export async function generateRefreshToken(
  payload: Omit<JWTPayload, 'iat' | 'exp'>
): Promise<string> {
  return jwt.sign(
    { userId: payload.userId, sessionId: payload.sessionId },
    JWT_REFRESH_SECRET,
    {
      expiresIn: JWT_REFRESH_EXPIRATION,
      issuer: 'guaira.app',
      audience: 'guaira-refresh',
      algorithm: 'HS512',
      jwtid: crypto.randomUUID(),
    }
  );
}

/**
 * Generate both access and refresh tokens
 */
export async function generateTokenPair(
  payload: Omit<JWTPayload, 'iat' | 'exp'>
): Promise<TokenPair> {
  const accessToken = await generateAccessToken(payload);
  const refreshToken = await generateRefreshToken(payload);

  return {
    accessToken,
    refreshToken,
    expiresIn: 3600, // 1 hour in seconds
  };
}

/**
 * Verify JWT access token
 */
export async function verifyAccessToken(
  token: string
): Promise<JWTPayload | null> {
  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      issuer: 'guaira.app',
      audience: 'guaira-api',
      algorithms: ['HS512'],
    }) as JWTPayload;

    return payload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.warn('Access token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.error('Invalid access token');
    }
    return null;
  }
}

/**
 * Verify JWT refresh token
 */
export async function verifyRefreshToken(
  token: string
): Promise<Pick<JWTPayload, 'userId' | 'sessionId'> | null> {
  try {
    const payload = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'guaira.app',
      audience: 'guaira-refresh',
      algorithms: ['HS512'],
    }) as JWTPayload;

    return {
      userId: payload.userId,
      sessionId: payload.sessionId,
    };
  } catch (error) {
    console.error('Invalid refresh token');
    return null;
  }
}

/**
 * Decode JWT without verification (for debugging)
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
}
```

#### 3.2.2 Token Blacklist (Redis)

```typescript
// lib/auth/token-blacklist.ts

import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

/**
 * Add token to blacklist (for logout or security)
 */
export async function blacklistToken(
  token: string,
  expiresIn: number
): Promise<void> {
  const key = `blacklist:${token}`;
  await redis.set(key, '1', { ex: expiresIn });
}

/**
 * Check if token is blacklisted
 */
export async function isTokenBlacklisted(
  token: string
): Promise<boolean> {
  const key = `blacklist:${token}`;
  const result = await redis.get(key);
  return result !== null;
}

/**
 * Remove token from blacklist
 */
export async function removeFromBlacklist(
  token: string
): Promise<void> {
  const key = `blacklist:${token}`;
  await redis.del(key);
}
```

#### 3.2.3 Actualizar Login para JWT

```typescript
// app/api/auth/login/route.ts

import { generateTokenPair } from '@/lib/auth/jwt';
import { verifyPassword } from '@/lib/crypto/password';

export async function POST(request: NextRequest) {
  // ... validacion y verificacion de password ...

  // Crear session en DB
  const sessionId = crypto.randomUUID();
  await prisma.session.create({
    data: {
      sessionToken: sessionId,
      userId: user.id,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
    },
  });

  // Generar tokens JWT
  const tokens = await generateTokenPair({
    userId: user.id,
    role: user.role,
    sessionId,
  });

  // Actualizar last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return NextResponse.json({
    success: true,
    data: tokens,
    message: 'Login successful',
  });
}
```

#### 3.2.4 Middleware de Verificacion JWT

```typescript
// lib/auth/middleware.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from './jwt';
import { isTokenBlacklisted } from './token-blacklist';

export async function authenticateRequest(
  request: NextRequest
): Promise<{
  authenticated: boolean;
  user?: { userId: string; role: string };
  error?: string;
}> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      authenticated: false,
      error: 'No token provided',
    };
  }

  const token = authHeader.substring(7);

  // Check blacklist
  const blacklisted = await isTokenBlacklisted(token);
  if (blacklisted) {
    return {
      authenticated: false,
      error: 'Token has been revoked',
    };
  }

  // Verify token
  const payload = await verifyAccessToken(token);
  if (!payload) {
    return {
      authenticated: false,
      error: 'Invalid or expired token',
    };
  }

  // Validate session still exists
  const session = await prisma.session.findUnique({
    where: { sessionToken: payload.sessionId },
  });

  if (!session || session.expires < new Date()) {
    return {
      authenticated: false,
      error: 'Session expired',
    };
  }

  return {
    authenticated: true,
    user: {
      userId: payload.userId,
      role: payload.role,
    },
  };
}
```

**CHECKLIST:**
- [ ] Instalar `jsonwebtoken` y `@types/jsonwebtoken`
- [ ] Crear `lib/auth/jwt.ts`
- [ ] Crear `lib/auth/token-blacklist.ts`
- [ ] Configurar Redis (Upstash o local)
- [ ] Actualizar `.env` con JWT_SECRET y JWT_REFRESH_SECRET
- [ ] Actualizar login route
- [ ] Crear refresh token endpoint
- [ ] Crear logout endpoint (blacklist token)
- [ ] Actualizar middleware de autenticacion
- [ ] Testing: JWT generation and verification
- [ ] Testing: Token blacklist functionality

**TIEMPO ESTIMADO:** 24-32 horas
**PRIORIDAD:** P0 - BLOCKER

---

### 3.3 Secret Management

**PROBLEMA ACTUAL:**
```bash
# .env - EXPUESTO EN CODIGO
NEXTAUTH_SECRET=guair-super-secret-key-change-in-production-2024
DATABASE_URL="postgresql://postgres:Caracas.2018%2B@localhost..."
```

**SOLUCION:**

#### 3.3.1 Generar Secrets Seguros

```bash
# Generar JWT Secret (256 bits)
openssl rand -base64 32

# Generar NextAuth Secret
openssl rand -hex 32

# Generar Database Encryption Key
openssl rand -base64 32
```

#### 3.3.2 Variables de Entorno Requeridas

```bash
# .env.example - TEMPLATE (versionable)

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:9300/api
NEXT_PUBLIC_APP_NAME=Guair.app
NEXT_PUBLIC_APP_VERSION=1.0.0

# Database Configuration
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

# Authentication
NEXTAUTH_URL=http://localhost:9300
NEXTAUTH_SECRET=CHANGE_THIS_IN_PRODUCTION_MIN_32_CHARS

# JWT
JWT_SECRET=CHANGE_THIS_IN_PRODUCTION_MIN_32_CHARS
JWT_REFRESH_SECRET=CHANGE_THIS_IN_PRODUCTION_MIN_32_CHARS

# Encryption
ENCRYPTION_KEY=CHANGE_THIS_IN_PRODUCTION_BASE64_32_BYTES

# Redis (for rate limiting and sessions)
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here

# Payment Providers (Production)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...

# Monitoring & Logging
SENTRY_DSN=https://...
SENTRY_AUTH_TOKEN=...
```

#### 3.3.3 Validacion de Secrets al Startup

```typescript
// lib/config/validate-env.ts

import { z } from 'zod';

const EnvSchema = z.object({
  // Database
  DATABASE_URL: z.string().url().min(1),

  // NextAuth
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),

  // Encryption
  ENCRYPTION_KEY: z.string().min(32),

  // Redis
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Node env
  NODE_ENV: z.enum(['development', 'production', 'test']),
});

export function validateEnvironment() {
  const result = EnvSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(result.error.format());
    throw new Error('Environment validation failed');
  }

  console.log('✅ Environment variables validated');
  return result.data;
}

// Ejecutar al iniciar la aplicacion
export const env = validateEnvironment();
```

#### 3.3.4 Uso de Secret Manager (Produccion)

Para produccion, usar un secret manager:

**Opcion 1: AWS Secrets Manager**
```typescript
// lib/config/secrets-manager.ts

import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({ region: 'us-east-1' });

export async function getSecret(secretName: string): Promise<string> {
  const command = new GetSecretValueCommand({ SecretId: secretName });
  const response = await client.send(command);
  return response.SecretString || '';
}

// Cargar secrets al startup
export async function loadSecrets() {
  if (process.env.NODE_ENV === 'production') {
    process.env.JWT_SECRET = await getSecret('guaira/jwt-secret');
    process.env.DATABASE_URL = await getSecret('guaira/database-url');
    // ... otros secrets
  }
}
```

**Opcion 2: HashiCorp Vault**
```typescript
import vault from 'node-vault';

const client = vault({
  endpoint: process.env.VAULT_ADDR,
  token: process.env.VAULT_TOKEN,
});

export async function getVaultSecret(path: string) {
  const result = await client.read(path);
  return result.data;
}
```

**CHECKLIST:**
- [ ] Agregar `.env` a `.gitignore`
- [ ] Crear `.env.example` template
- [ ] Generar secrets seguros
- [ ] Crear `lib/config/validate-env.ts`
- [ ] Configurar secret manager (AWS/Vault) para produccion
- [ ] Actualizar deployment pipeline para inyectar secrets
- [ ] Documentar proceso de rotacion de secrets
- [ ] Eliminar secrets existentes del historial de Git
- [ ] Testing: Validacion de env variables

**TIEMPO ESTIMADO:** 8-12 horas
**PRIORIDAD:** P0 - BLOCKER

---

### 3.4 Input Validation con Zod

**PROBLEMA ACTUAL:**
```typescript
// ❌ Sin validacion
const { phone, password } = await request.json();
```

**SOLUCION:**

#### 3.4.1 Schemas de Validacion

```typescript
// lib/validation/schemas.ts

import { z } from 'zod';

// Auth Schemas
export const LoginSchema = z.object({
  phone: z.string()
    .regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number format (E.164)'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password too long'),
  otp: z.string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only numbers')
    .optional(),
});

export const RegisterSchema = z.object({
  phone: z.string()
    .regex(/^\+[1-9]\d{1,14}$/),
  password: z.string()
    .min(8)
    .max(100)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      'Password must contain uppercase, lowercase, number, and special character'),
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  email: z.string()
    .email('Invalid email format')
    .max(255)
    .optional(),
});

// Wallet Schemas
export const DepositSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  amount: z.number()
    .positive('Amount must be positive')
    .max(100000, 'Amount exceeds maximum limit')
    .multipleOf(0.01, 'Amount must have at most 2 decimal places'),
  paymentMethod: z.enum(['card', 'cash', 'bank_transfer']),
  paymentDetails: z.object({
    cardLast4: z.string().length(4).optional(),
    bankAccount: z.string().optional(),
  }).optional(),
});

export const WithdrawSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number()
    .positive()
    .max(50000, 'Withdrawal amount exceeds limit'),
  destination: z.string()
    .min(1, 'Destination is required'),
  otp: z.string().length(6).regex(/^\d{6}$/),
});

export const TransferSchema = z.object({
  fromUserId: z.string().uuid(),
  toUserId: z.string().uuid(),
  amount: z.number()
    .positive()
    .max(10000, 'Transfer amount exceeds limit'),
  description: z.string()
    .max(500, 'Description too long')
    .optional(),
  otp: z.string().length(6).regex(/^\d{6}$/),
});

// POS Schemas
export const POSPaymentSchema = z.object({
  userId: z.string().uuid(),
  merchantId: z.string().uuid(),
  amount: z.number()
    .positive()
    .max(50000),
  description: z.string()
    .max(500)
    .optional(),
  items: z.array(z.object({
    name: z.string().max(255),
    quantity: z.number().int().positive().max(1000),
    price: z.number().positive(),
  })).max(100, 'Too many items'),
});

// Transaction Query Schema
export const TransactionQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(50),
  type: z.enum(['deposit', 'withdrawal', 'payment', 'refund', 'transfer']).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
}).refine(
  (data) => !data.startDate || !data.endDate || data.startDate <= data.endDate,
  { message: 'Start date must be before end date' }
);
```

#### 3.4.2 Middleware de Validacion

```typescript
// lib/validation/middleware.ts

import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError } from 'zod';

export function validateRequest<T extends z.ZodType>(schema: T) {
  return async (
    request: NextRequest
  ): Promise<{
    valid: boolean;
    data?: z.infer<T>;
    error?: { message: string; details: any };
  }> => {
    try {
      const body = await request.json();
      const data = schema.parse(body);

      return {
        valid: true,
        data,
      };
    } catch (error) {
      if (error instanceof ZodError) {
        return {
          valid: false,
          error: {
            message: 'Validation failed',
            details: error.errors,
          },
        };
      }

      return {
        valid: false,
        error: {
          message: 'Invalid request',
          details: null,
        },
      };
    }
  };
}

export function validateQueryParams<T extends z.ZodType>(schema: T) {
  return (request: NextRequest): {
    valid: boolean;
    data?: z.infer<T>;
    error?: { message: string; details: any };
  } => {
    try {
      const { searchParams } = new URL(request.url);
      const params = Object.fromEntries(searchParams.entries());
      const data = schema.parse(params);

      return {
        valid: true,
        data,
      };
    } catch (error) {
      if (error instanceof ZodError) {
        return {
          valid: false,
          error: {
            message: 'Invalid query parameters',
            details: error.errors,
          },
        };
      }

      return {
        valid: false,
        error: {
          message: 'Invalid request',
          details: null,
        },
      };
    }
  };
}
```

#### 3.4.3 Uso en API Routes

```typescript
// app/api/auth/login/route.ts

import { LoginSchema } from '@/lib/validation/schemas';
import { validateRequest } from '@/lib/validation/middleware';

export async function POST(request: NextRequest) {
  // Validar input
  const validation = await validateRequest(LoginSchema)(request);

  if (!validation.valid) {
    return NextResponse.json(
      {
        success: false,
        error: validation.error?.message,
        details: validation.error?.details,
      },
      { status: 400 }
    );
  }

  const { phone, password, otp } = validation.data!;

  // Continue with business logic...
}
```

**CHECKLIST:**
- [ ] Crear `lib/validation/schemas.ts`
- [ ] Crear `lib/validation/middleware.ts`
- [ ] Actualizar TODOS los API routes con validacion
- [ ] Crear sanitization utilities (XSS prevention)
- [ ] Testing: Unit tests para schemas
- [ ] Testing: API tests con invalid inputs
- [ ] Documentation: Documentar schemas en API docs

**TIEMPO ESTIMADO:** 16-24 horas
**PRIORIDAD:** P0 - BLOCKER

---

### 3.5 Rate Limiting

**PROBLEMA ACTUAL:**
- Sin limites en endpoints
- Vulnerable a brute force
- Vulnerable a DDoS

**SOLUCION:**

#### 3.5.1 Rate Limiter con Redis

```typescript
// lib/security/rate-limiter.ts

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

// Rate limiters para diferentes endpoints
export const loginRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 intentos per 15 min
  analytics: true,
  prefix: 'rl:login',
});

export const apiRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 req per min
  analytics: true,
  prefix: 'rl:api',
});

export const transactionRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 transacciones per min
  analytics: true,
  prefix: 'rl:transaction',
});

export const otpRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '5 m'), // 3 OTP per 5 min
  analytics: true,
  prefix: 'rl:otp',
});

/**
 * Check rate limit for a given identifier
 */
export async function checkRateLimit(
  identifier: string,
  limiter: Ratelimit
): Promise<{
  allowed: boolean;
  remaining: number;
  reset: number;
}> {
  const result = await limiter.limit(identifier);

  return {
    allowed: result.success,
    remaining: result.remaining,
    reset: result.reset,
  };
}

/**
 * Get client identifier from request
 */
export function getClientIdentifier(request: Request): string {
  // Try to get real IP from headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  return cfConnectingIp || realIp || forwardedFor?.split(',')[0] || 'unknown';
}
```

#### 3.5.2 Rate Limit Middleware

```typescript
// lib/security/rate-limit-middleware.ts

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIdentifier } from './rate-limiter';
import { Ratelimit } from '@upstash/ratelimit';

export function withRateLimit(limiter: Ratelimit) {
  return async (
    request: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> => {
    const identifier = getClientIdentifier(request);

    const result = await checkRateLimit(identifier, limiter);

    if (!result.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.reset.toString(),
            'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    const response = await handler(request);

    // Add rate limit headers to successful responses
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', result.reset.toString());

    return response;
  };
}
```

#### 3.5.3 Aplicar en Routes

```typescript
// app/api/auth/login/route.ts

import { loginRateLimiter } from '@/lib/security/rate-limiter';
import { withRateLimit } from '@/lib/security/rate-limit-middleware';

async function loginHandler(request: NextRequest) {
  // Business logic...
}

export async function POST(request: NextRequest) {
  return withRateLimit(loginRateLimiter)(request, loginHandler);
}
```

**CHECKLIST:**
- [ ] Instalar `@upstash/ratelimit` y `@upstash/redis`
- [ ] Configurar Redis (Upstash account)
- [ ] Crear `lib/security/rate-limiter.ts`
- [ ] Crear `lib/security/rate-limit-middleware.ts`
- [ ] Aplicar rate limiting en login endpoint
- [ ] Aplicar rate limiting en transaction endpoints
- [ ] Aplicar rate limiting en API general
- [ ] Testing: Verificar rate limits funcionan
- [ ] Monitoring: Alertas para rate limit exceeded
- [ ] Documentation: Documentar limites en API docs

**TIEMPO ESTIMADO:** 12-16 horas
**PRIORIDAD:** P0 - BLOCKER

---

**FIN DOCUMENTO PARTE 1**
*Continua en la siguiente seccion con P1 y P2 priorities...*
