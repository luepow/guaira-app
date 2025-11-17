# Archivos Implementados - Backend Guaira POS

## Índice Completo de Archivos Creados

### 📁 Validaciones (Zod Schemas)
```
app/lib/validations/
├── auth.schema.ts          # Validación de OTP, login, registro
├── wallet.schema.ts        # Validación de depósitos, retiros, transferencias
├── transaction.schema.ts   # Validación de transacciones y listados
└── payment.schema.ts       # Validación de pagos Stripe/PayPal
```

### 📁 Utilidades
```
app/lib/utils/
├── crypto.ts              # Encriptación, hashing, OTP generation
├── email.ts               # Servicio de email multi-proveedor
├── rate-limiter.ts        # Rate limiting con sliding window
├── audit.ts               # Servicio de auditoría inmutable
└── response.ts            # Helpers de respuesta API estandarizada
```

### 📁 Servicios de Negocio
```
app/lib/services/
├── otp.service.ts         # Servicio de OTP completo
├── wallet.service.ts      # Servicio de Wallet con double-entry
└── payment.service.ts     # Integración Stripe y PayPal
```

### 📁 Middleware
```
app/lib/middleware/
├── rate-limit.middleware.ts    # Middleware de rate limiting
├── auth.middleware.ts          # Middleware de autenticación
└── validation.middleware.ts    # Middleware de validación Zod
```

### 📁 API Routes - Autenticación
```
app/api/auth/otp/
├── generate/route.ts      # POST - Generar OTP
└── verify/route.ts        # POST - Verificar OTP
```

### 📁 API Routes - Wallet
```
app/api/wallet/
├── balance/route.ts       # GET - Obtener balance
├── deposit/route.ts       # POST - Depositar fondos
├── withdraw/route.ts      # POST - Retirar fondos
└── transfer/route.ts      # POST - Transferir entre usuarios
```

### 📁 API Routes - Transacciones
```
app/api/transactions/
├── route.ts               # GET - Listar transacciones
└── [id]/route.ts          # GET - Detalle de transacción
```

### 📁 API Routes - Pagos Stripe
```
app/api/payments/stripe/
├── create/route.ts        # POST - Crear Payment Intent
└── webhook/route.ts       # POST - Webhook handler
```

### 📁 API Routes - Pagos PayPal
```
app/api/payments/paypal/
├── create/route.ts        # POST - Crear orden
└── capture/route.ts       # POST - Capturar orden
```

### 📁 Base de Datos
```
prisma/
├── schema.prisma          # Schema completo con 13 modelos
└── migrations/
    └── 20250116000000_init/
        └── migration.sql  # Migración inicial
```

### 📁 Configuración y Documentación
```
/
├── .env.example                           # Variables de entorno completas
├── API_DOCUMENTATION.md                   # Documentación completa de API
├── BACKEND_SETUP.md                       # Guía de setup paso a paso
├── BACKEND_IMPLEMENTATION_SUMMARY.md      # Resumen ejecutivo
└── IMPLEMENTATION_FILES.md                # Este archivo
```

---

## Estadísticas de Implementación

### Archivos Creados
- **Total:** 33 archivos
- **Schemas de Validación:** 4
- **Utilidades:** 5
- **Servicios:** 3
- **Middleware:** 3
- **API Routes:** 10
- **Base de Datos:** 2
- **Documentación:** 5

### Líneas de Código (aproximado)
- **TypeScript:** ~5,000 líneas
- **SQL:** ~300 líneas
- **Markdown:** ~2,000 líneas
- **Total:** ~7,300 líneas

### Modelos de Base de Datos
- **Core:** User, Wallet, Transaction, LedgerEntry
- **OTP:** OtpCode
- **Payments:** Payment, PaymentMethod, Refund
- **Security:** AuditLog, RateLimitLog
- **NextAuth:** Account, Session, VerificationToken
- **Total:** 13 modelos

### API Endpoints
- **Autenticación:** 2 endpoints
- **Wallet:** 4 endpoints
- **Transacciones:** 2 endpoints
- **Pagos Stripe:** 2 endpoints
- **Pagos PayPal:** 2 endpoints
- **Total:** 12 endpoints

---

## Descripción de Archivos Principales

### 1. app/lib/validations/auth.schema.ts
**Propósito:** Validación de operaciones de autenticación
**Exports:**
- `generateOtpSchema`: Validación de generación de OTP
- `verifyOtpSchema`: Validación de verificación de OTP
- `registerSchema`: Validación de registro de usuario
- `loginSchema`: Validación de login
- `resetPasswordSchema`: Validación de reseteo de contraseña

### 2. app/lib/validations/wallet.schema.ts
**Propósito:** Validación de operaciones de wallet
**Exports:**
- `depositSchema`: Validación de depósitos
- `withdrawalSchema`: Validación de retiros
- `transferSchema`: Validación de transferencias
- `createWalletSchema`: Validación de creación de wallet
- `updateWalletSchema`: Validación de actualización

### 3. app/lib/validations/transaction.schema.ts
**Propósito:** Validación de transacciones
**Exports:**
- `createTransactionSchema`: Validación de creación
- `listTransactionsSchema`: Validación de listado con paginación
- `exportTransactionsSchema`: Validación de exportación
- `transactionAnalyticsSchema`: Validación de analytics

### 4. app/lib/validations/payment.schema.ts
**Propósito:** Validación de pagos externos
**Exports:**
- `createStripePaymentSchema`: Stripe Payment Intent
- `confirmStripePaymentSchema`: Confirmación de pago
- `createPayPalOrderSchema`: Orden de PayPal
- `capturePayPalOrderSchema`: Captura de orden
- `refundPaymentSchema`: Reembolsos

### 5. app/lib/utils/crypto.ts
**Propósito:** Operaciones criptográficas
**Functions:**
- `generateOtp()`: OTP de 6 dígitos
- `hashOtp()`, `verifyOtp()`: Hashing con bcrypt
- `generateSecureToken()`: Tokens aleatorios
- `hashPassword()`, `verifyPassword()`: Gestión de contraseñas
- `encrypt()`, `decrypt()`: AES-256-GCM
- `hmacSha256()`, `verifyHmac()`: Firma de mensajes

### 6. app/lib/utils/email.ts
**Propósito:** Envío de emails
**Classes:**
- `EmailService`: Singleton para envío de emails
- `ResendProvider`, `SendGridProvider`, `ConsoleProvider`
**Methods:**
- `send()`: Envío genérico
- `sendOtp()`: Email de OTP con template HTML
- `sendTransactionNotification()`: Notificación de transacción

### 7. app/lib/utils/rate-limiter.ts
**Propósito:** Rate limiting
**Class:** `RateLimiter`
**Methods:**
- `checkLimit()`: Verifica límite
- `resetLimit()`: Resetea contador
- `isBlocked()`: Verifica si está bloqueado
**Presets:** OTP_GENERATION, OTP_VERIFICATION, LOGIN_ATTEMPT, etc.

### 8. app/lib/utils/audit.ts
**Propósito:** Auditoría inmutable
**Class:** `AuditService`
**Methods:**
- `log()`: Log genérico
- `logCreate()`, `logUpdate()`, `logDelete()`: CRUD
- `logLogin()`, `logLogout()`: Autenticación
- `logTransaction()`, `logWalletOperation()`: Financiero

### 9. app/lib/utils/response.ts
**Propósito:** Respuestas API estandarizadas
**Functions:**
- `successResponse()`, `errorResponse()`
- `validationErrorResponse()`, `rateLimitErrorResponse()`
- `unauthorizedResponse()`, `notFoundResponse()`
**Classes:**
- `AppError`, `ValidationError`, `UnauthorizedError`
- `InsufficientBalanceError`, `RateLimitError`

### 10. app/lib/services/otp.service.ts
**Propósito:** Servicio completo de OTP
**Class:** `OtpService`
**Methods:**
- `generateAndSend()`: Genera y envía OTP
- `verify()`: Verifica OTP
- `cleanExpired()`: Limpieza de mantenimiento
- `getStats()`: Estadísticas
**Features:**
- Rate limiting integrado
- Máximo 5 intentos por OTP
- Expiración configurable
- Auditoría completa

### 11. app/lib/services/wallet.service.ts
**Propósito:** Servicio de Wallet con doble partida
**Class:** `WalletService`
**Methods:**
- `createWallet()`: Crea wallet
- `deposit()`: Depósito con double-entry
- `withdraw()`: Retiro con validación de saldo
- `transfer()`: Transferencia entre usuarios
- `getBalance()`: Balance actual
- `suspendWallet()`, `activateWallet()`
**Features:**
- ACID transactions
- Double-entry accounting
- Idempotencia garantizada
- Ledger entries automáticos

### 12. app/lib/services/payment.service.ts
**Propósito:** Integración de pagos externos
**Classes:**
- `StripePaymentService`
- `PayPalPaymentService`
**Methods Stripe:**
- `createPaymentIntent()`, `confirmPaymentIntent()`
- `createRefund()`, `verifyWebhookSignature()`
**Methods PayPal:**
- `createOrder()`, `captureOrder()`
- `createRefund()`, `verifyWebhookSignature()`

### 13. prisma/schema.prisma
**Propósito:** Schema completo de base de datos
**Modelos:** 13 modelos con relaciones
**Features:**
- Índices optimizados
- Constraints de integridad
- Cascade deletes
- JSONB para metadata
- Soporte para NextAuth

---

## Uso de los Archivos

### Flujo de una Operación de Depósito

```
1. Cliente → POST /api/wallet/deposit
   ↓
2. API Route (deposit/route.ts)
   - Autentica con NextAuth
   - Valida con depositSchema (Zod)
   - Obtiene IP y User-Agent
   ↓
3. WalletService.deposit()
   - Verifica idempotencyKey
   - Inicia transacción ACID
   - Valida wallet (existe, activa, pertenece al usuario)
   - Crea Transaction record
   - Actualiza balance de Wallet
   - Crea 2 LedgerEntry (DR + CR)
   - Registra en AuditLog
   ↓
4. Response estandarizada
   - successResponse() con transaction
```

### Flujo de Generación y Verificación de OTP

```
1. Cliente → POST /api/auth/otp/generate
   ↓
2. API Route (generate/route.ts)
   - Valida email con generateOtpSchema
   - Obtiene IP para rate limiting
   ↓
3. OtpService.generateAndSend()
   - Verifica rate limit (5/15min)
   - Invalida OTPs anteriores
   - Genera OTP de 6 dígitos
   - Hashea con bcrypt
   - Guarda en DB
   - Envía email con template HTML
   - Registra en AuditLog
   ↓
4. Response con expiresAt

---

5. Cliente → POST /api/auth/otp/verify
   ↓
6. API Route (verify/route.ts)
   - Valida email + otp con verifyOtpSchema
   ↓
7. OtpService.verify()
   - Verifica rate limit (10/15min)
   - Busca OTP válido no expirado
   - Incrementa contador de intentos
   - Verifica límite de intentos (5 max)
   - Compara hash con bcrypt
   - Marca como verificado
   - Registra en AuditLog
   ↓
8. Response con userId si existe
```

### Flujo de Webhook de Stripe

```
1. Stripe → POST /api/payments/stripe/webhook
   ↓
2. Webhook Handler (webhook/route.ts)
   - Lee raw body
   - Obtiene stripe-signature header
   - Verifica firma con webhook secret
   ↓
3. Procesa evento según tipo:
   - payment_intent.succeeded →
     * Extrae userId de metadata
     * Obtiene wallet del usuario
     * Llama WalletService.deposit()
     * Depósito automático

   - payment_intent.payment_failed →
     * Registra en AuditLog

   - charge.refunded →
     * Crea Refund record
   ↓
4. Response { received: true }
```

---

## Testing de los Archivos

### Setup Inicial
```bash
# 1. Instalar dependencias
npm install

# 2. Configurar .env
cp .env.example .env
# Editar .env con tus credenciales

# 3. Setup de DB
npx prisma generate
npx prisma migrate deploy
```

### Testing Manual
```bash
# Generar OTP
curl -X POST http://localhost:9300/api/auth/otp/generate \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Verificar OTP (ver código en consola si EMAIL_PROVIDER=console)
curl -X POST http://localhost:9300/api/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otp":"123456"}'
```

---

## Mantenimiento de los Archivos

### Actualizaciones Futuras

**Para agregar un nuevo endpoint:**
1. Crear schema de validación en `/app/lib/validations/`
2. Agregar método en servicio apropiado en `/app/lib/services/`
3. Crear API route en `/app/api/`
4. Aplicar middleware necesario
5. Actualizar `API_DOCUMENTATION.md`

**Para agregar un nuevo modelo:**
1. Actualizar `prisma/schema.prisma`
2. Crear migración: `npx prisma migrate dev --name add_new_model`
3. Generar cliente: `npx prisma generate`
4. Actualizar servicios relevantes

**Para agregar nuevo proveedor de pago:**
1. Crear clase en `payment.service.ts`
2. Implementar métodos: create, confirm, refund, verifyWebhook
3. Agregar schemas en `payment.schema.ts`
4. Crear API routes en `/app/api/payments/[provider]/`
5. Configurar webhooks

---

## Archivos de Configuración Críticos

### Variables de Entorno Requeridas

**Mínimo para desarrollo:**
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:9300"
NEXTAUTH_SECRET="..."
EMAIL_PROVIDER="console"
```

**Para Stripe:**
```env
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

**Para PayPal:**
```env
PAYPAL_CLIENT_ID="..."
PAYPAL_CLIENT_SECRET="..."
PAYPAL_MODE="sandbox"
```

**Para Emails en producción:**
```env
EMAIL_PROVIDER="resend"
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@guaira.app"
```

---

## Conclusión

Todos los archivos implementados siguen las mejores prácticas de:
- ✅ TypeScript strict mode
- ✅ Arquitectura hexagonal
- ✅ Separation of concerns
- ✅ DRY (Don't Repeat Yourself)
- ✅ SOLID principles
- ✅ Security-first approach
- ✅ Documentación inline
- ✅ Error handling robusto

**El sistema está listo para:**
- Desarrollo local
- Testing
- Integración con frontend
- Deployment a staging
- Auditoría de seguridad
- Producción (con configuración apropiada)
