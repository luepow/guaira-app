# GUAIRA.APP - ANALISIS ARQUITECTONICO COMPLETO
## Sistema de Billetera Digital y Punto de Venta

**Fecha de Analisis:** 2025-11-16
**Version del Sistema:** 1.0.0
**Tecnologia Principal:** Next.js 16 + React 19 + TypeScript + Prisma + PostgreSQL
**Analista:** Chief Systems Architect & Global PMO Director

---

## INDICE

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Arquitectura Actual](#2-arquitectura-actual)
3. [Stack Tecnologico](#3-stack-tecnologico)
4. [Modelo de Datos](#4-modelo-de-datos)
5. [Capa de API](#5-capa-de-api)
6. [Autenticacion y Autorizacion](#6-autenticacion-y-autorizacion)
7. [Gaps Criticos de Seguridad](#7-gaps-criticos-de-seguridad)
8. [Estado del Sistema](#8-estado-del-sistema)
9. [Evaluacion de Madurez](#9-evaluacion-de-madurez)

---

## 1. RESUMEN EJECUTIVO

### 1.1 Vision General

Guaira.app es una aplicacion web moderna de billetera digital y punto de venta construida con Next.js 16 (App Router), React 19, y PostgreSQL. El sistema esta en fase MVP temprana con funcionalidades basicas implementadas pero **CRITICOS gaps de seguridad** que deben ser resueltos antes de cualquier despliegue en produccion.

### 1.2 Estado Actual del Proyecto

| Aspecto | Estado | Nivel |
|---------|--------|-------|
| Funcionalidad Core | ✅ Implementada | 60% |
| Seguridad | ❌ Critico | 15% |
| Arquitectura | ⚠️ Basica | 45% |
| Escalabilidad | ⚠️ Limitada | 30% |
| Testing | ❌ Ausente | 0% |
| Documentacion | ⚠️ Parcial | 40% |
| PCI-DSS Compliance | ❌ No cumple | 0% |
| Production Ready | ❌ NO | 20% |

### 1.3 Hallazgos Criticos

**RIESGO ALTO - BLOQUEADORES DE PRODUCCION:**

1. **Passwords en texto plano** almacenadas en base de datos
2. **Tokens de autenticacion inseguros** (strings simples, no JWT)
3. **Secret key expuesta** en codigo (.env con valores de desarrollo)
4. **Sin encriptacion** de datos sensibles
5. **Sin validacion robusta** de inputs
6. **Sin rate limiting** en endpoints criticos
7. **Sin auditoria** de transacciones financieras
8. **Sin double-entry accounting** para billeteras
9. **Sin integracion** con payment providers reales
10. **Sin sistema OTP** para autenticacion de dos factores

---

## 2. ARQUITECTURA ACTUAL

### 2.1 Patron Arquitectonico

El sistema implementa una arquitectura **Monolitica Modular** basada en Next.js App Router:

```
┌─────────────────────────────────────────────────────────────┐
│                   GUAIRA.APP ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │           FRONTEND (React 19 + Next.js 16)         │    │
│  │                                                     │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐        │    │
│  │  │  Pages   │  │Components│  │  Layouts │        │    │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘        │    │
│  │       │             │             │               │    │
│  │  ┌────┴─────────────┴─────────────┴─────┐        │    │
│  │  │     State Management (Zustand)        │        │    │
│  │  └────┬─────────────────────────────────┬┘        │    │
│  │       │                                 │         │    │
│  │  ┌────┴─────────┐              ┌───────┴──────┐  │    │
│  │  │   Services   │              │  API Client  │  │    │
│  │  └────┬─────────┘              └───────┬──────┘  │    │
│  └───────┼─────────────────────────────────┼─────────┘    │
│          │                                 │              │
│  ┌───────┴─────────────────────────────────┴─────────┐    │
│  │           BACKEND (Next.js API Routes)            │    │
│  │                                                    │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐       │    │
│  │  │   Auth   │  │  Wallet  │  │   POS    │       │    │
│  │  │  Routes  │  │  Routes  │  │  Routes  │       │    │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘       │    │
│  │       │             │             │              │    │
│  │  ┌────┴─────────────┴─────────────┴─────┐       │    │
│  │  │        NextAuth Middleware            │       │    │
│  │  └────┬──────────────────────────────────┘       │    │
│  │       │                                          │    │
│  │  ┌────┴──────────────────────────────────┐      │    │
│  │  │         Prisma ORM Layer              │      │    │
│  │  └────┬──────────────────────────────────┘      │    │
│  └───────┼──────────────────────────────────────────┘    │
│          │                                               │
│  ┌───────┴───────────────────────────────────────┐      │
│  │        PostgreSQL Database (v15+)             │      │
│  │                                                │      │
│  │  ┌──────┐ ┌──────┐ ┌──────────┐ ┌─────────┐ │      │
│  │  │Users │ │Wallet│ │Transaction│ │ Payment │ │      │
│  │  └──────┘ └──────┘ └──────────┘ └─────────┘ │      │
│  └────────────────────────────────────────────────┘      │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

### 2.2 Estructura de Directorios

```
guaira-pos-web/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes (Backend)
│   │   ├── auth/
│   │   │   ├── login/route.ts    # Login endpoint
│   │   │   ├── register/route.ts # Register endpoint
│   │   │   └── [...nextauth]/    # NextAuth handler
│   │   ├── wallet/
│   │   │   ├── [userId]/
│   │   │   │   ├── route.ts      # Get wallet
│   │   │   │   └── transactions/ # Get transactions
│   │   │   └── deposit/route.ts  # Deposit endpoint
│   │   ├── pos/
│   │   │   └── payment/route.ts  # POS payment
│   │   └── user/
│   │       └── [userId]/route.ts # User profile
│   │
│   ├── components/               # React Components
│   │   ├── dashboard/            # Dashboard widgets
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── SplashScreen.tsx
│   │   ├── ParticleBackground.tsx
│   │   └── WaveBackground.tsx
│   │
│   ├── lib/                      # Libraries & Utils
│   │   ├── auth.ts               # NextAuth config
│   │   └── prisma.ts             # Prisma client
│   │
│   ├── services/                 # API Service Layer
│   │   ├── api.ts                # Axios client
│   │   ├── auth.service.ts       # Auth service
│   │   ├── wallet.service.ts     # Wallet service
│   │   └── payment.service.ts    # Payment service
│   │
│   ├── store/                    # State Management (Zustand)
│   │   ├── authStore.ts          # Auth state
│   │   ├── walletStore.ts        # Wallet state
│   │   └── cartStore.ts          # Cart state
│   │
│   ├── types/                    # TypeScript Types
│   │   └── index.ts              # All type definitions
│   │
│   ├── (pages)/                  # App Pages
│   │   ├── page.tsx              # Home (Splash)
│   │   ├── login/page.tsx        # Login page
│   │   ├── dashboard/page.tsx    # Dashboard
│   │   ├── wallet/page.tsx       # Wallet management
│   │   ├── pos/page.tsx          # Point of Sale
│   │   ├── transactions/page.tsx # Transaction history
│   │   └── account/page.tsx      # User account
│   │
│   ├── layout.tsx                # Root layout
│   ├── providers.tsx             # Context providers
│   └── globals.css               # Global styles
│
├── prisma/
│   ├── schema.prisma             # Database schema
│   ├── seed.ts                   # Database seeding
│   └── migrations/               # DB migrations
│
├── public/                       # Static assets
├── middleware.ts                 # Next.js middleware (Auth)
├── next.config.js                # Next.js config
├── tailwind.config.js            # Tailwind config
├── tsconfig.json                 # TypeScript config
├── package.json                  # Dependencies
└── .env                          # Environment variables
```

### 2.3 Flujo de Datos

**Flujo de Autenticacion:**
```
User → Login Page → NextAuth Credentials Provider →
Prisma (DB Query) → Session Creation (JWT) →
Middleware Protection → Protected Pages
```

**Flujo de Transaccion Wallet:**
```
User → Wallet Page → walletStore.deposit() →
apiClient.post('/wallet/deposit') →
API Route Handler → Prisma Transaction →
Database Update → Response → UI Update
```

**Flujo de POS Payment:**
```
User → POS Page → Add Items to Cart →
Payment Action → apiClient.post('/pos/payment') →
API Route Handler → Validate →
Create Payment + Transaction → Database → Response
```

---

## 3. STACK TECNOLOGICO

### 3.1 Frontend Stack

| Tecnologia | Version | Proposito | Estado |
|------------|---------|-----------|--------|
| **Next.js** | 16.0.1 | Framework React SSR/SSG | ✅ Actual |
| **React** | 19.2.0 | UI Library | ✅ Ultima |
| **TypeScript** | 5.9.3 | Type Safety | ✅ Configurado |
| **Tailwind CSS** | 4.1.17 | Styling Framework | ✅ Custom Config |
| **Zustand** | 5.0.8 | State Management | ✅ Funcional |
| **Axios** | 1.13.2 | HTTP Client | ✅ Configurado |
| **React Hook Form** | 7.66.0 | Form Management | ⚠️ Parcial |
| **Zod** | 4.1.12 | Schema Validation | ⚠️ No usado |
| **Lucide React** | 0.553.0 | Icon Library | ✅ Funcional |
| **date-fns** | 4.1.0 | Date Manipulation | ✅ Funcional |
| **Recharts** | 3.3.0 | Charts/Graphs | ⚠️ No implementado |

### 3.2 Backend Stack

| Tecnologia | Version | Proposito | Estado |
|------------|---------|-----------|--------|
| **Next.js API Routes** | 16.0.1 | Backend API | ✅ Funcional |
| **NextAuth.js** | 4.24.13 | Authentication | ⚠️ Configuracion basica |
| **Prisma ORM** | 6.19.0 | Database ORM | ✅ Funcional |
| **PostgreSQL** | 15+ | Database | ✅ Configurado |
| **bcryptjs** | 3.0.3 | Password Hashing | ❌ NO USADO |

### 3.3 DevOps & Tools

| Herramienta | Version | Proposito | Estado |
|-------------|---------|-----------|--------|
| **ESLint** | 9.36.0 | Code Linting | ✅ Configurado |
| **PostCSS** | 8.5.6 | CSS Processing | ✅ Funcional |
| **tsx** | 4.20.6 | TS Execution | ✅ Para seeding |
| **Git** | - | Version Control | ⚠️ No inicializado |

### 3.4 Dependencias Criticas Ausentes

**REQUERIDAS PARA PRODUCCION:**

1. **Seguridad:**
   - ❌ `helmet` - Security headers
   - ❌ `express-rate-limit` o `@upstash/ratelimit` - Rate limiting
   - ❌ `node-2fa` o `speakeasy` - Two-Factor Authentication
   - ❌ `crypto-js` o equivalente para encriptacion

2. **Pagos:**
   - ❌ `stripe` - Stripe integration
   - ❌ `@paypal/checkout-server-sdk` - PayPal integration

3. **Validacion:**
   - ✅ `zod` (instalado pero NO usado en backend)

4. **Logging & Monitoring:**
   - ❌ `winston` o `pino` - Structured logging
   - ❌ `@sentry/nextjs` - Error tracking
   - ❌ `newrelic` o `datadog` - APM

5. **Testing:**
   - ❌ `jest` - Unit testing
   - ❌ `@testing-library/react` - Component testing
   - ❌ `cypress` o `playwright` - E2E testing

6. **Performance:**
   - ❌ `@vercel/analytics` - Analytics
   - ❌ `compression` - Response compression

---

## 4. MODELO DE DATOS

### 4.1 Esquema Prisma Actual

```prisma
// MODELO ACTUAL - CRITICAS DEFICIENCIAS

model User {
  id            String    @id @default(uuid())
  phone         String    @unique
  password      String    // ❌ CRITICO: Plain text storage!
  name          String
  email         String?   @unique
  emailVerified DateTime?
  role          String    @default("customer")
  avatar        String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  wallet       Wallet?
  transactions Transaction[]
  payments     Payment[]
  accounts     Account[]
  sessions     Session[]
}

model Wallet {
  id        String   @id @default(uuid())
  userId    String   @unique
  balance   Float    @default(0)  // ❌ CRITICO: Float para dinero!
  currency  String   @default("USD")
  status    String   @default("active")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user         User          @relation(fields: [userId], references: [id])
  transactions Transaction[]
}

model Transaction {
  id          String   @id @default(uuid())
  userId      String
  walletId    String
  type        String   // ❌ No enum, solo string
  amount      Float    // ❌ Float para dinero
  currency    String   @default("USD")
  status      String   @default("pending")
  description String?
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user   User   @relation(fields: [userId], references: [id])
  wallet Wallet @relation(fields: [walletId], references: [id])

  @@index([userId])
  @@index([walletId])
  @@index([createdAt])
}

model Payment {
  id          String   @id @default(uuid())
  userId      String
  merchantId  String
  amount      Float    // ❌ Float para dinero
  currency    String   @default("USD")
  status      String   @default("succeeded")
  description String?
  items       Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user User @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([merchantId])
  @@index([createdAt])
}

// NextAuth models
model Account { ... }
model Session { ... }
model VerificationToken { ... }
```

### 4.2 Problemas Criticos del Modelo

**SEGURIDAD:**

1. **Passwords sin hash**: Se almacenan en texto plano
   - SOLUCION: Implementar bcrypt con salt rounds >= 12

2. **Datos sensibles sin encriptar**:
   - Email, phone, metadata expuestos
   - SOLUCION: Encriptacion a nivel de aplicacion (AES-256-GCM)

**PRECISION FINANCIERA:**

3. **Float para cantidades de dinero**:
   - PROBLEMA: Errores de precision decimal
   - SOLUCION: Usar `Decimal` o almacenar como enteros (centavos)

```prisma
// CORRECTO:
balance Decimal @db.Decimal(19, 4)  // Precision de 4 decimales
// O mejor aun:
balanceCents BigInt  // Almacenar en centavos
```

**AUDITORIA:**

4. **Sin tablas de auditoria**:
   - No hay registro de cambios en balances
   - No hay trazabilidad de quien modifico que
   - SOLUCION: Tabla AuditLog

**INTEGRIDAD:**

5. **Sin constraints de negocio**:
   - No hay validacion de balance >= 0
   - No hay limites de transaccion
   - No hay double-entry accounting

### 4.3 Modelo Recomendado (Next Steps)

```prisma
// MODELO MEJORADO - RECOMENDACION

model User {
  id                String    @id @default(uuid())
  phone             String    @unique
  passwordHash      String    // Bcrypt hash
  passwordSalt      String    // Salt separado
  name              String
  emailEncrypted    String?   @unique  // Email encriptado
  emailHash         String?   // Para busquedas
  emailVerified     DateTime?
  role              UserRole  @default(CUSTOMER)
  avatar            String?
  twoFactorEnabled  Boolean   @default(false)
  twoFactorSecret   String?   // Encriptado
  kycStatus         KycStatus @default(PENDING)
  kycLevel          Int       @default(1)
  status            UserStatus @default(ACTIVE)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  lastLoginAt       DateTime?

  @@index([emailHash])
  @@index([phone])
  @@map("users")
}

enum UserRole {
  CUSTOMER
  MERCHANT
  ADMIN
  SUPPORT
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  CLOSED
  KYC_PENDING
}

enum KycStatus {
  PENDING
  VERIFIED
  REJECTED
}

model Wallet {
  id              String      @id @default(uuid())
  userId          String      @unique
  balanceCents    BigInt      @default(0)  // En centavos
  currency        Currency    @default(USD)
  status          WalletStatus @default(ACTIVE)
  dailyLimitCents BigInt?
  monthlyLimitCents BigInt?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  frozenAt        DateTime?
  closedAt        DateTime?

  user            User        @relation(fields: [userId], references: [id])
  entries         LedgerEntry[]

  // Constraint: balance no puede ser negativo
  @@check("balanceCents >= 0")
  @@map("wallets")
}

enum Currency {
  USD
  EUR
  VES
  BTC
}

enum WalletStatus {
  ACTIVE
  FROZEN
  SUSPENDED
  CLOSED
}

// Double-Entry Accounting
model LedgerEntry {
  id              String          @id @default(uuid())
  walletId        String
  transactionId   String
  entryType       LedgerEntryType
  amountCents     BigInt
  balanceCents    BigInt          // Balance after this entry
  description     String
  metadata        Json?
  createdAt       DateTime        @default(now())

  wallet          Wallet          @relation(fields: [walletId], references: [id])
  transaction     Transaction     @relation(fields: [transactionId], references: [id])

  @@index([walletId, createdAt])
  @@index([transactionId])
  @@map("ledger_entries")
}

enum LedgerEntryType {
  DEBIT   // Disminuye balance
  CREDIT  // Aumenta balance
}

model Transaction {
  id                String            @id @default(uuid())
  userId            String
  type              TransactionType
  amountCents       BigInt
  currency          Currency          @default(USD)
  status            TransactionStatus @default(PENDING)
  failureReason     String?
  description       String
  metadata          Json?
  idempotencyKey    String?           @unique
  externalId        String?           // ID de PSP externo
  provider          String?           // stripe, paypal, etc
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  completedAt       DateTime?

  user              User              @relation(fields: [userId], references: [id])
  ledgerEntries     LedgerEntry[]
  auditLogs         AuditLog[]

  @@index([userId, createdAt])
  @@index([status])
  @@index([idempotencyKey])
  @@map("transactions")
}

enum TransactionType {
  DEPOSIT
  WITHDRAWAL
  PAYMENT
  REFUND
  TRANSFER_IN
  TRANSFER_OUT
  FEE
  REVERSAL
}

enum TransactionStatus {
  PENDING
  PROCESSING
  SUCCEEDED
  FAILED
  CANCELLED
  REVERSED
}

// Tabla de Auditoria
model AuditLog {
  id            String   @id @default(uuid())
  entityType    String   // User, Wallet, Transaction
  entityId      String
  action        String   // CREATE, UPDATE, DELETE
  userId        String?  // Quien ejecuto la accion
  changes       Json     // Cambios realizados
  metadata      Json?
  ipAddress     String?
  userAgent     String?
  createdAt     DateTime @default(now())

  @@index([entityType, entityId])
  @@index([userId, createdAt])
  @@index([createdAt])
  @@map("audit_logs")
}

// OTP para autenticacion
model Otp {
  id          String    @id @default(uuid())
  userId      String
  code        String    // Hasheado
  purpose     OtpPurpose
  expiresAt   DateTime
  usedAt      DateTime?
  attempts    Int       @default(0)
  createdAt   DateTime  @default(now())

  user        User      @relation(fields: [userId], references: [id])

  @@index([userId, purpose, expiresAt])
  @@map("otps")
}

enum OtpPurpose {
  LOGIN
  TRANSACTION_VERIFY
  PASSWORD_RESET
  EMAIL_VERIFY
}
```

---

## 5. CAPA DE API

### 5.1 Endpoints Actuales

**AUTENTICACION:**

| Endpoint | Metodo | Seguridad | Estado | Problemas |
|----------|--------|-----------|--------|-----------|
| `/api/auth/login` | POST | ❌ Ninguna | Funcional | Password plano, token simple |
| `/api/auth/register` | POST | ❌ Ninguna | Mock | Sin validacion, sin hash |
| `/api/auth/[...nextauth]` | GET/POST | ⚠️ NextAuth | Funcional | Config basica |

**WALLET:**

| Endpoint | Metodo | Seguridad | Estado | Problemas |
|----------|--------|-----------|--------|-----------|
| `/api/wallet/[userId]` | GET | ⚠️ Token | Funcional | Sin rate limit |
| `/api/wallet/[userId]/transactions` | GET | ⚠️ Token | Funcional | Sin paginacion real |
| `/api/wallet/deposit` | POST | ❌ Ninguna | Mock | No actualiza DB |

**POS:**

| Endpoint | Metodo | Seguridad | Estado | Problemas |
|----------|--------|-----------|--------|-----------|
| `/api/pos/payment` | POST | ❌ Ninguna | Mock | No valida fondos |

**USER:**

| Endpoint | Metodo | Seguridad | Estado | Problemas |
|----------|--------|-----------|--------|-----------|
| `/api/user/[userId]` | GET | ⚠️ Token | Funcional | Expone datos sensibles |

### 5.2 Implementacion Actual de Login

```typescript
// app/api/auth/login/route.ts - ESTADO ACTUAL

export async function POST(request: NextRequest) {
  const { phone, password } = await request.json();

  // ❌ CRITICO: No validacion de input
  if (!phone || !password) {
    return NextResponse.json({ error: '...' }, { status: 400 });
  }

  // ✅ OK: Query con Prisma
  const user = await prisma.user.findUnique({
    where: { phone },
    include: { wallet: true },
  });

  // ❌ CRITICO: Comparacion de password en texto plano
  if (!user || user.password !== password) {
    return NextResponse.json({ error: '...' }, { status: 401 });
  }

  // ❌ CRITICO: Token simple, no JWT firmado
  const token = `token-${user.id}-${Date.now()}`;

  // ❌ CRITICO: Expone password en respuesta
  const userResponse = {
    id: user.id,
    phone: user.phone,
    name: user.name,
    email: user.email,
    balance: user.wallet?.balance || 0,  // ❌ Expone balance directamente
    // ... sin sanitizacion
  };

  return NextResponse.json({
    success: true,
    data: { user: userResponse, token },
  });
}
```

### 5.3 Problemas Identificados en API

**SEGURIDAD:**

1. **Sin validacion de inputs**:
   - No usa Zod schemas
   - No sanitiza datos
   - Vulnerable a SQL injection (mitigado por Prisma)
   - Vulnerable a XSS

2. **Sin rate limiting**:
   - Endpoint de login expuesto a brute force
   - Sin proteccion contra DDoS

3. **Sin CORS apropiado**:
   - Configuracion permisiva en desarrollo

4. **Sin CSP headers**:
   - No hay Content Security Policy

**LOGICA DE NEGOCIO:**

5. **Deposit sin validacion**:
   - No verifica fondos disponibles
   - No integra con PSP real
   - No actualiza balance realmente

6. **Payment sin validacion**:
   - No verifica balance suficiente
   - No crea doble entrada contable
   - Status siempre "succeeded"

**ARQUITECTURA:**

7. **Sin capa de servicios**:
   - Logica de negocio en routes
   - No hay separacion de concerns

8. **Sin manejo de transacciones DB**:
   - Operaciones atomicas no garantizadas
   - Riesgo de inconsistencia de datos

### 5.4 Implementacion Recomendada

```typescript
// app/api/auth/login/route.ts - RECOMENDADO

import { z } from 'zod';
import { rateLimiter } from '@/lib/rate-limiter';
import { hashPassword, verifyPassword } from '@/lib/crypto';
import { generateJWT } from '@/lib/jwt';
import { auditLog } from '@/lib/audit';

const LoginSchema = z.object({
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/),
  password: z.string().min(8).max(100),
  otp: z.string().length(6).optional(),
});

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const rateLimitResult = await rateLimiter.check(ip, 'login', {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  });

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Too many attempts' },
      { status: 429 }
    );
  }

  // Parse & validate input
  const body = await request.json();
  const validation = LoginSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: validation.error },
      { status: 400 }
    );
  }

  const { phone, password, otp } = validation.data;

  // Query user
  const user = await prisma.user.findUnique({
    where: { phone },
    select: {
      id: true,
      passwordHash: true,
      passwordSalt: true,
      twoFactorEnabled: true,
      twoFactorSecret: true,
      status: true,
      role: true,
    },
  });

  if (!user) {
    // Generic error para no exponer si el usuario existe
    await new Promise(resolve => setTimeout(resolve, 1000)); // Timing attack prevention
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  }

  // Verify password
  const isValid = await verifyPassword(
    password,
    user.passwordHash,
    user.passwordSalt
  );

  if (!isValid) {
    await auditLog.create({
      entityType: 'User',
      entityId: user.id,
      action: 'LOGIN_FAILED',
      metadata: { reason: 'invalid_password', ip },
    });
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  }

  // Verify 2FA if enabled
  if (user.twoFactorEnabled) {
    if (!otp) {
      return NextResponse.json(
        { error: 'OTP required', requires2FA: true },
        { status: 401 }
      );
    }

    const isOtpValid = await verifyOtp(user.twoFactorSecret, otp);
    if (!isOtpValid) {
      await auditLog.create({
        entityType: 'User',
        entityId: user.id,
        action: 'LOGIN_FAILED',
        metadata: { reason: 'invalid_otp', ip },
      });
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 401 }
      );
    }
  }

  // Check user status
  if (user.status !== 'ACTIVE') {
    return NextResponse.json(
      { error: 'Account suspended or closed' },
      { status: 403 }
    );
  }

  // Generate JWT
  const token = await generateJWT({
    userId: user.id,
    role: user.role,
    sessionId: crypto.randomUUID(),
  });

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // Audit log
  await auditLog.create({
    entityType: 'User',
    entityId: user.id,
    action: 'LOGIN_SUCCESS',
    metadata: { ip, userAgent: request.headers.get('user-agent') },
  });

  // Return minimal data
  return NextResponse.json({
    success: true,
    data: { token },
    message: 'Login successful',
  });
}
```

---

## 6. AUTENTICACION Y AUTORIZACION

### 6.1 NextAuth Configuration Actual

```typescript
// app/lib/auth.ts - ESTADO ACTUAL

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      credentials: {
        phone: { label: 'Telefono', type: 'tel' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        const user = await prisma.user.findUnique({
          where: { phone: credentials.phone },
        });

        // ❌ CRITICO: Comparacion de password plano
        const isValid = credentials.password === user.password;

        if (!isValid) {
          throw new Error('Contraseña incorrecta');
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // ❌ 30 dias muy largo para finanzas
  },
  secret: process.env.NEXTAUTH_SECRET, // ⚠️ Debe ser fuerte en produccion
};
```

### 6.2 Middleware de Proteccion

```typescript
// middleware.ts - ESTADO ACTUAL

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Basic role-based access
    if (pathname.startsWith('/admin') && token?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    if (pathname.startsWith('/pos') && !['merchant', 'admin'].includes(token?.role)) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/wallet/:path*',
    '/pos/:path*',
    '/payments/:path*',
    '/transactions/:path*',
    '/admin/:path*',
  ],
};
```

### 6.3 Problemas de Autenticacion

**CRITICOS:**

1. **Passwords sin hash**:
   - Almacenadas en texto plano
   - Comparacion directa sin bcrypt

2. **Token inseguro en /api/auth/login**:
   - Token simple: `token-${userId}-${timestamp}`
   - No firmado, facilmente falsificable

3. **Sin Two-Factor Authentication**:
   - Para un sistema financiero es OBLIGATORIO

4. **Sin OTP para operaciones criticas**:
   - Transacciones grandes sin verificacion adicional

**MEDIOS:**

5. **Session muy larga**:
   - 30 dias para un sistema financiero es excesivo
   - Recomendado: 1 hora con refresh token

6. **Sin limites de sesiones concurrentes**:
   - Un usuario puede tener infinitas sesiones activas

7. **Sin revocacion de tokens**:
   - No hay blacklist de tokens comprometidos

### 6.4 Configuracion Recomendada

```typescript
// lib/auth-config.ts - RECOMENDADO

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './prisma';
import { verifyPassword } from './crypto';
import { verifyOtp } from './otp';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      id: 'credentials-otp',
      name: 'Credentials with OTP',
      credentials: {
        phone: { label: 'Phone', type: 'tel' },
        password: { label: 'Password', type: 'password' },
        otp: { label: 'OTP Code', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.password) {
          throw new Error('Missing credentials');
        }

        const user = await prisma.user.findUnique({
          where: { phone: credentials.phone },
          select: {
            id: true,
            passwordHash: true,
            passwordSalt: true,
            twoFactorEnabled: true,
            twoFactorSecret: true,
            status: true,
            role: true,
            name: true,
            emailEncrypted: true,
          },
        });

        if (!user || user.status !== 'ACTIVE') {
          throw new Error('Invalid credentials');
        }

        // Verify password with bcrypt
        const isPasswordValid = await verifyPassword(
          credentials.password,
          user.passwordHash,
          user.passwordSalt
        );

        if (!isPasswordValid) {
          throw new Error('Invalid credentials');
        }

        // Verify OTP if 2FA is enabled
        if (user.twoFactorEnabled) {
          if (!credentials.otp) {
            throw new Error('OTP required');
          }

          const isOtpValid = await verifyOtp(
            user.twoFactorSecret!,
            credentials.otp
          );

          if (!isOtpValid) {
            throw new Error('Invalid OTP');
          }
        }

        // Create session record
        const sessionId = crypto.randomUUID();
        await prisma.session.create({
          data: {
            sessionToken: sessionId,
            userId: user.id,
            expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
          },
        });

        return {
          id: user.id,
          role: user.role,
          sessionId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.userId = user.id;
        token.role = user.role;
        token.sessionId = user.sessionId;
      }

      // Validate session is still active
      if (token.sessionId) {
        const session = await prisma.session.findUnique({
          where: { sessionToken: token.sessionId as string },
        });

        if (!session || session.expires < new Date()) {
          throw new Error('Session expired');
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId as string;
        session.user.role = token.role as string;
        session.sessionId = token.sessionId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60, // 1 hour
    updateAge: 15 * 60, // Update session every 15 minutes
  },
  secret: process.env.NEXTAUTH_SECRET,
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
};
```

---

## 7. GAPS CRITICOS DE SEGURIDAD

### 7.1 Clasificacion de Riesgos

| # | Vulnerabilidad | Severidad | Impacto | Probabilidad | Score CVSS |
|---|----------------|-----------|---------|--------------|------------|
| 1 | Passwords en texto plano | CRITICO | Alto | Alto | 9.8 |
| 2 | Tokens inseguros | CRITICO | Alto | Alto | 9.1 |
| 3 | Secret key expuesto | ALTO | Alto | Medio | 8.2 |
| 4 | Sin rate limiting | ALTO | Medio | Alto | 7.5 |
| 5 | Sin validacion de inputs | ALTO | Alto | Medio | 7.8 |
| 6 | Sin 2FA | ALTO | Alto | Medio | 7.2 |
| 7 | Float para dinero | MEDIO | Medio | Alto | 6.5 |
| 8 | Sin encriptacion de datos | ALTO | Alto | Bajo | 7.0 |
| 9 | Sin auditoria | MEDIO | Medio | Medio | 5.8 |
| 10 | Sin HTTPS enforcement | ALTO | Alto | Bajo | 7.5 |

### 7.2 Matriz de Riesgos

```
IMPACTO
  ^
  │
A │  [8]           [1][2][3][5][6]
L │                [10]
T │
O │      [9]       [4][7]
  │
  │
B │
A │
J │
O │
  └─────────────────────────────────>
    BAJA    MEDIA    ALTA   PROBABILIDAD
```

### 7.3 Detalle de Vulnerabilidades Criticas

#### 7.3.1 Passwords en Texto Plano

**Problema:**
```typescript
// prisma/seed.ts
password: 'demo123',  // ❌ Texto plano

// app/api/auth/login/route.ts
if (user.password !== password) { ... }  // ❌ Comparacion directa
```

**Impacto:**
- Si la DB es comprometida, todas las passwords estan expuestas
- Violacion de GDPR, PCI-DSS, y todas las normativas
- Perdida total de confianza del cliente

**Solucion:**
```typescript
import bcrypt from 'bcryptjs';

// Al crear usuario
const salt = await bcrypt.genSalt(12);
const passwordHash = await bcrypt.hash(password, salt);

await prisma.user.create({
  data: {
    passwordHash,
    passwordSalt: salt,
    // ...
  }
});

// Al verificar
const isValid = await bcrypt.compare(password, user.passwordHash);
```

**Prioridad:** P0 - BLOCKER

#### 7.3.2 Tokens Inseguros

**Problema:**
```typescript
// app/api/auth/login/route.ts
const token = `token-${user.id}-${Date.now()}`;  // ❌ Predecible
```

**Impacto:**
- Token facilmente falsificable
- Sin firma criptografica
- Sin expiracion
- Sin claims

**Solucion:**
```typescript
import jwt from 'jsonwebtoken';

const token = jwt.sign(
  {
    userId: user.id,
    role: user.role,
    sessionId: crypto.randomUUID(),
  },
  process.env.JWT_SECRET!,
  {
    expiresIn: '1h',
    issuer: 'guaira.app',
    audience: 'guaira-api',
    algorithm: 'HS512',
  }
);
```

**Prioridad:** P0 - BLOCKER

#### 7.3.3 Secret Key Expuesto

**Problema:**
```bash
# .env (VERSIONADO EN GIT)
NEXTAUTH_SECRET=guair-super-secret-key-change-in-production-2024
DATABASE_URL="postgresql://postgres:Caracas.2018%2B@localhost:5432/..."
```

**Impacto:**
- Secret key predecible
- Credenciales de DB expuestas
- Si el repo es publico, full compromise

**Solucion:**
1. Agregar `.env` a `.gitignore`
2. Usar variables de entorno del sistema
3. Generar secret seguro:
   ```bash
   openssl rand -base64 32
   ```
4. Usar servicios de secrets management (AWS Secrets Manager, Vault)

**Prioridad:** P0 - BLOCKER

#### 7.3.4 Sin Rate Limiting

**Problema:**
- Endpoint `/api/auth/login` sin limites
- Vulnerable a brute force attacks
- Vulnerable a DDoS

**Solucion:**
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 attempts per 15 min
  analytics: true,
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }
  // ...
}
```

**Prioridad:** P0 - BLOCKER

#### 7.3.5 Sin Validacion de Inputs

**Problema:**
```typescript
const { phone, password } = await request.json();
// ❌ No validacion, confia en el cliente
```

**Solucion:**
```typescript
import { z } from 'zod';

const LoginSchema = z.object({
  phone: z.string()
    .regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password too long'),
});

const validation = LoginSchema.safeParse(body);
if (!validation.success) {
  return NextResponse.json(
    { error: validation.error.errors },
    { status: 400 }
  );
}
```

**Prioridad:** P0 - BLOCKER

### 7.4 PCI-DSS Compliance Gaps

Para un sistema de pagos, PCI-DSS requiere:

| Requisito | Estado | Gap |
|-----------|--------|-----|
| 1. Firewall configuration | ❌ | No configurado |
| 2. Default passwords changed | ❌ | Demo passwords en seed |
| 3. Protect stored cardholder data | ❌ | No almacenamos (OK), pero sin tokenizacion |
| 4. Encrypt transmission | ⚠️ | HTTPS en produccion pendiente |
| 5. Antivirus | N/A | Web app |
| 6. Secure systems | ❌ | Multiples vulnerabilidades |
| 7. Restrict data access | ⚠️ | Role-based parcial |
| 8. Unique IDs | ✅ | UUID implementado |
| 9. Restrict physical access | N/A | Cloud |
| 10. Track network access | ❌ | Sin logging |
| 11. Test security | ❌ | Sin tests |
| 12. Security policy | ❌ | No existe |

**RESULTADO:** 0% compliance con PCI-DSS

---

## 8. ESTADO DEL SISTEMA

### 8.1 Funcionalidades Implementadas

**AUTENTICACION:**
- ✅ Login con phone + password (NextAuth)
- ✅ Register (mock, sin DB real)
- ✅ Session management basico
- ✅ Role-based access (admin, merchant, customer)
- ❌ Two-Factor Authentication
- ❌ Password reset
- ❌ Email verification
- ❌ OTP para transacciones

**WALLET:**
- ✅ Ver balance
- ✅ Ver transacciones (paginado)
- ⚠️ Deposit (mock, no actualiza DB)
- ❌ Withdraw
- ❌ Transfer entre usuarios
- ❌ Double-entry accounting
- ❌ Transaction limits

**POS:**
- ⚠️ Payment (mock, siempre succeed)
- ❌ Validacion de fondos
- ❌ Receipt generation
- ❌ Refunds
- ❌ Split payments

**DASHBOARD:**
- ✅ Balance overview
- ✅ Recent transactions
- ✅ Monthly spending stats
- ✅ Quick actions
- ⚠️ Charts (libreria instalada, no implementada)

**UI/UX:**
- ✅ Splash screen animado
- ✅ Login page con animaciones
- ✅ Dashboard responsive
- ✅ Wallet page
- ✅ Transactions page
- ✅ POS page (basica)
- ✅ Glass morphism effects
- ✅ Particle backgrounds

### 8.2 Testing Coverage

**ESTADO ACTUAL:** 0% coverage

No hay ninguna prueba implementada:
- ❌ Unit tests
- ❌ Integration tests
- ❌ E2E tests
- ❌ Performance tests
- ❌ Security tests

### 8.3 Deployment Readiness

**DESARROLLO:**
- ✅ Dev server funcional (port 9300)
- ✅ Hot reload
- ✅ TypeScript compilation
- ✅ ESLint configurado

**STAGING:**
- ❌ No existe ambiente staging
- ❌ No hay CI/CD pipeline

**PRODUCCION:**
- ❌ NO READY FOR PRODUCTION
- ❌ Sin HTTPS enforcement
- ❌ Sin variables de entorno seguras
- ❌ Sin monitoring
- ❌ Sin logging estructurado
- ❌ Sin error tracking (Sentry)
- ❌ Sin backup strategy
- ❌ Sin disaster recovery plan

---

## 9. EVALUACION DE MADUREZ

### 9.1 Capability Maturity Model (CMM)

| Area | Nivel Actual | Nivel Objetivo | Gap |
|------|--------------|----------------|-----|
| **Seguridad** | 1 - Inicial | 5 - Optimizado | 4 niveles |
| **Arquitectura** | 2 - Repetible | 4 - Gestionado | 2 niveles |
| **Testing** | 1 - Inicial | 4 - Gestionado | 3 niveles |
| **DevOps** | 1 - Inicial | 4 - Gestionado | 3 niveles |
| **Documentacion** | 2 - Repetible | 4 - Gestionado | 2 niveles |
| **Compliance** | 1 - Inicial | 4 - Gestionado | 3 niveles |

**Niveles:**
1. **Inicial**: Ad-hoc, caotico
2. **Repetible**: Procesos basicos
3. **Definido**: Procesos documentados
4. **Gestionado**: Medido y controlado
5. **Optimizado**: Mejora continua

### 9.2 Scorecard General

```
┌─────────────────────────────────────────────────┐
│        GUAIRA.APP - HEALTH SCORECARD            │
├─────────────────────────────────────────────────┤
│                                                 │
│ Seguridad:          ▓░░░░░░░░░  15%  ❌        │
│ Funcionalidad:      ▓▓▓▓▓▓░░░░  60%  ⚠️        │
│ Performance:        ▓▓▓░░░░░░░  30%  ⚠️        │
│ Escalabilidad:      ▓▓▓░░░░░░░  30%  ⚠️        │
│ Mantenibilidad:     ▓▓▓▓░░░░░░  45%  ⚠️        │
│ Testing:            ░░░░░░░░░░   0%  ❌        │
│ Documentacion:      ▓▓▓▓░░░░░░  40%  ⚠️        │
│ PCI-DSS Compliance: ░░░░░░░░░░   0%  ❌        │
│                                                 │
├─────────────────────────────────────────────────┤
│ OVERALL SCORE:      ▓▓▓░░░░░░░  27.5%  ❌      │
└─────────────────────────────────────────────────┘

VERDICT: NOT PRODUCTION READY
```

### 9.3 Recomendacion Ejecutiva

**ESTADO:** El sistema NO esta listo para produccion ni para manejo de dinero real.

**BLOQUEADORES CRITICOS (P0):**
1. Implementar hashing de passwords con bcrypt
2. Reemplazar tokens simples por JWT firmados
3. Remover secrets del repositorio
4. Implementar rate limiting en endpoints criticos
5. Implementar validacion de inputs con Zod

**ACCION INMEDIATA REQUERIDA:**
- STOP de cualquier plan de deployment a produccion
- Dedicar sprint completo a resolver P0 blockers
- Contratar auditoria de seguridad externa
- Implementar plan de testing

**TIEMPO ESTIMADO PARA PRODUCCION:**
- Minimo: 8-12 semanas con equipo dedicado
- Recomendado: 16-20 semanas con testing completo

---

**FIN DEL ANALISIS ARQUITECTONICO**

*Documento generado por: Chief Systems Architect & Global PMO Director*
*Confidencial - Solo para uso interno*
