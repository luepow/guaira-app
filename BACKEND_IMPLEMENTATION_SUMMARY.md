# Backend Implementation Summary - Guaira POS

## Resumen Ejecutivo

Se ha implementado un backend completo de nivel producción para el sistema de pagos externos, billeteras y autenticación con OTP, siguiendo las mejores prácticas de arquitectura hexagonal, DDD y seguridad financiera.

## Componentes Implementados

### 1. Schemas de Validación con Zod

**Ubicación:** `/app/lib/validations/`

- ✅ **auth.schema.ts**: Validación de OTP, login, registro, reseteo de contraseña
- ✅ **wallet.schema.ts**: Validación de depósitos, retiros, transferencias
- ✅ **transaction.schema.ts**: Validación de transacciones, listados, exportación, analytics
- ✅ **payment.schema.ts**: Validación de pagos Stripe/PayPal, refunds, webhooks

**Características:**
- Validación estricta de tipos y formatos
- Mensajes de error descriptivos en español
- Límites de seguridad (montos, longitudes, formatos)
- Type-safety con TypeScript

---

### 2. Schema de Base de Datos (Prisma)

**Ubicación:** `/prisma/schema.prisma`

**Modelos Implementados:**

#### Core Models
- **User**: Usuarios con roles (customer, merchant, admin)
- **Wallet**: Billeteras con balance y estado
- **Transaction**: Transacciones con idempotency keys
- **LedgerEntry**: Entradas de contabilidad de doble partida

#### OTP & Verification
- **OtpCode**: Códigos OTP con expiración y límite de intentos

#### Payments
- **Payment**: Pagos realizados
- **PaymentMethod**: Métodos de pago guardados (tarjetas, cuentas)
- **Refund**: Reembolsos

#### Audit & Security
- **AuditLog**: Logs inmutables de auditoría
- **RateLimitLog**: Registro de rate limiting

#### NextAuth
- **Account**, **Session**, **VerificationToken**

**Índices Optimizados:**
- Índices compuestos para búsquedas eficientes
- Índices por fecha para queries temporales
- Índices únicos para integridad (idempotencyKey, email, phone)

---

### 3. Utilidades y Helpers

**Ubicación:** `/app/lib/utils/`

#### crypto.ts
- `generateOtp()`: Generación de OTP de 6 dígitos
- `hashOtp()`, `verifyOtp()`: Hashing seguro con bcrypt
- `generateSecureToken()`: Tokens aleatorios seguros
- `hashPassword()`, `verifyPassword()`: Gestión de contraseñas
- `encrypt()`, `decrypt()`: Encriptación AES-256-GCM
- `hmacSha256()`, `verifyHmac()`: Firma de webhooks
- `maskSensitiveData()`: Máscara de datos sensibles para logs

#### email.ts
- Abstracción multi-proveedor (Resend, SendGrid, Console)
- `sendOtp()`: Envío de OTP con template profesional HTML
- `sendTransactionNotification()`: Notificaciones de transacciones
- Templates responsivos y profesionales

#### rate-limiter.ts
- Rate limiting basado en base de datos (persistent)
- Sliding window algorithm
- Configuraciones predefinidas por tipo de acción
- Limpieza automática de registros antiguos
- Presets: OTP_GENERATION, OTP_VERIFICATION, LOGIN_ATTEMPT, etc.

#### audit.ts
- Servicio de auditoría inmutable
- Helpers para operaciones comunes (create, update, delete, login, etc.)
- Metadata de IP y User-Agent
- Queries con filtros avanzados

#### response.ts
- Respuestas estandarizadas de API
- Códigos de error consistentes
- Custom error classes (AppError, ValidationError, etc.)
- Helpers para casos comunes (success, error, validation, rate limit, etc.)

---

### 4. Servicios de Negocio

**Ubicación:** `/app/lib/services/`

#### otp.service.ts - Servicio de OTP

**Métodos:**
- `generateAndSend()`: Genera y envía OTP por email con rate limiting
- `verify()`: Verifica OTP con límite de intentos (5 max)
- `cleanExpired()`: Limpia OTPs expirados (mantenimiento)
- `getStats()`: Estadísticas de OTP por email

**Características:**
- Rate limiting integrado (5 generaciones / 15 min)
- Expiración configurable (default 10 minutos)
- Máximo 5 intentos de verificación por OTP
- Invalidación automática de OTPs anteriores
- Auditoría completa de todas las operaciones
- Soporte para múltiples propósitos (login, password_reset, email_verification)

#### wallet.service.ts - Servicio de Wallet con Double-Entry

**Métodos:**
- `createWallet()`: Crea wallet para usuario
- `getWallet()`, `getUserWallet()`: Obtiene wallet por ID o userId
- `deposit()`: Depósito con doble partida
- `withdraw()`: Retiro con validación de saldo
- `transfer()`: Transferencia entre usuarios
- `getBalance()`: Balance actual
- `suspendWallet()`, `activateWallet()`: Gestión de estado

**Características Críticas:**
- ✅ **ACID Transactions**: Transacciones atómicas de base de datos
- ✅ **Double-Entry Accounting**: DR (débito) + CR (crédito) automático
- ✅ **Idempotencia**: Prevención de duplicados con idempotencyKey
- ✅ **Balance Validation**: Verificación de saldo en retiros/transferencias
- ✅ **Audit Trail**: Registro completo de cambios de balance
- ✅ **Ledger Entries**: Historial contable inmutable
- ✅ **Wallet Status**: Control de wallets suspendidas/cerradas

**Contabilidad de Doble Partida:**

Depósito:
```
DR: Asset (Wallet) +100    // Aumenta activo
CR: Revenue (Income) +100  // Aumenta ingreso
```

Retiro:
```
DR: Expense (Withdrawal) +50  // Aumenta gasto
CR: Asset (Wallet) -50        // Disminuye activo
```

Transferencia:
```
// Remitente
DR: Asset (Receptor) +25
CR: Asset (Wallet) -25

// Los balances se actualizan atómicamente
```

#### payment.service.ts - Integración de Pagos

**Clases:**
- `StripePaymentService`: Integración completa con Stripe
- `PayPalPaymentService`: Integración completa con PayPal

**Métodos Stripe:**
- `createPaymentIntent()`: Crea Payment Intent
- `confirmPaymentIntent()`: Confirma pago
- `createRefund()`: Procesa reembolso
- `verifyWebhookSignature()`: Verifica firma de webhook
- `getPaymentIntent()`: Obtiene detalles de pago

**Métodos PayPal:**
- `createOrder()`: Crea orden de pago
- `captureOrder()`: Captura orden aprobada
- `createRefund()`: Procesa reembolso
- `getOrder()`: Obtiene detalles de orden
- `verifyWebhookSignature()`: Verifica webhook

**Seguridad:**
- Verificación de firmas de webhooks
- Manejo seguro de API keys
- Soporte para sandbox y producción

---

### 5. API Routes

**Ubicación:** `/app/api/`

#### Autenticación y OTP

**POST /api/auth/otp/generate**
- Genera y envía OTP por email
- Rate limiting: 5 intentos / 15 min
- Response: { expiresAt }

**POST /api/auth/otp/verify**
- Verifica código OTP
- Rate limiting: 10 intentos / 15 min
- Response: { verified, userId }

#### Wallet Management

**GET /api/wallet/balance**
- Obtiene balance actual
- Auth: Required
- Response: { walletId, balance, currency, status }

**POST /api/wallet/deposit**
- Deposita fondos en wallet
- Auth: Required
- Body: { amount, currency, source, sourceId, idempotencyKey }
- Response: { transaction }

**POST /api/wallet/withdraw**
- Retira fondos de wallet
- Auth: Required
- Body: { amount, currency, destination, destinationId, idempotencyKey }
- Response: { transaction }

**POST /api/wallet/transfer**
- Transfiere entre usuarios
- Auth: Required
- Body: { amount, currency, recipientId, idempotencyKey }
- Response: { transaction }

#### Transacciones

**GET /api/transactions**
- Lista transacciones con paginación
- Auth: Required
- Query: { page, limit, type, status, startDate, endDate, sortBy, sortOrder }
- Response: { transactions[], pagination }

**GET /api/transactions/[id]**
- Detalle de transacción
- Auth: Required
- Response: { transaction, ledgerEntries[] }

#### Pagos Externos - Stripe

**POST /api/payments/stripe/create**
- Crea Payment Intent
- Auth: Required
- Body: { amount, currency, description, metadata, paymentMethodId? }
- Response: { paymentIntent, clientSecret }

**POST /api/payments/stripe/webhook**
- Webhook handler de Stripe
- Public endpoint con verificación de firma
- Eventos: payment_intent.succeeded, payment_failed, charge.refunded
- Proceso automático: Depósito en wallet al confirmar pago

#### Pagos Externos - PayPal

**POST /api/payments/paypal/create**
- Crea orden de PayPal
- Auth: Required
- Body: { amount, currency, description }
- Response: { orderId, approvalUrl }

**POST /api/payments/paypal/capture**
- Captura orden aprobada
- Auth: Required
- Body: { orderId }
- Response: { capture } + Depósito automático en wallet

---

### 6. Middleware de Seguridad

**Ubicación:** `/app/lib/middleware/`

#### rate-limit.middleware.ts
- `withRateLimit()`: HOC para aplicar rate limiting a rutas
- Configuraciones por tipo de acción
- Response automático con error 429 si excede

**Ejemplo de uso:**
```typescript
export const POST = withRateLimit(handler, 'OTP_GENERATION');
```

#### auth.middleware.ts
- `withAuth()`: Verifica autenticación con NextAuth
- `withRole()`: Verifica rol de usuario
- Response automático 401 si no autenticado

**Ejemplo de uso:**
```typescript
export const POST = withAuth(async (request, session) => {
  // session.user está disponible
});

export const DELETE = withRole(handler, ['admin', 'merchant']);
```

#### validation.middleware.ts
- `withValidation()`: Valida body con schema de Zod
- `withQueryValidation()`: Valida query params
- Response automático con errores de validación

**Ejemplo de uso:**
```typescript
export const POST = withValidation(handler, depositSchema);
```

---

### 7. Configuración y Documentación

#### .env.example
Archivo completo con todas las variables necesarias:
- Database (PostgreSQL)
- NextAuth (URL, Secret)
- Email Providers (Resend, SendGrid)
- Stripe (Keys, Webhook Secret)
- PayPal (Client ID, Secret, Mode)
- Security (Encryption, CSRF)
- Rate Limiting (Configuración opcional)
- Logging & Monitoring

#### API_DOCUMENTATION.md
Documentación completa de API con:
- Descripción de cada endpoint
- Request/Response examples en JSON
- Códigos de error
- Rate limiting por endpoint
- Ejemplos de uso con cURL
- Seguridad y mejores prácticas
- Testing con credenciales de prueba

#### BACKEND_SETUP.md
Guía de setup paso a paso:
- Requisitos previos
- Instalación de dependencias
- Configuración de variables
- Setup de base de datos
- Estructura del proyecto
- Testing manual y con herramientas
- Troubleshooting
- Mantenimiento

#### BACKEND_IMPLEMENTATION_SUMMARY.md
Este documento - Resumen ejecutivo completo

---

## Arquitectura y Patrones

### Clean Architecture / Hexagonal Architecture

```
┌─────────────────────────────────────────┐
│        API Routes (Controllers)         │
│    /api/wallet, /api/auth, etc.        │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│      Application Services Layer         │
│  WalletService, OtpService, etc.       │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Domain Layer (Prisma)           │
│    Models, Business Rules, Ledger       │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│      Infrastructure Layer               │
│  Database, Email, Payment Providers     │
└─────────────────────────────────────────┘
```

### Patrones Implementados

1. **Repository Pattern**: Prisma como abstracción de datos
2. **Service Layer**: Lógica de negocio desacoplada
3. **Factory Pattern**: Inicialización de servicios de pago
4. **Strategy Pattern**: Múltiples proveedores de email/pago
5. **Decorator Pattern**: Middleware HOCs
6. **Singleton Pattern**: Instancias únicas de servicios

---

## Seguridad

### Implementaciones Críticas

1. ✅ **Rate Limiting**: Sliding window, persistent en DB
2. ✅ **Idempotencia**: UUID keys en transacciones
3. ✅ **Auditoría**: Logs inmutables de operaciones
4. ✅ **Encriptación**: AES-256-GCM para datos sensibles
5. ✅ **Hashing**: BCrypt para contraseñas y OTPs
6. ✅ **Validación**: Zod schemas en todos los endpoints
7. ✅ **ACID Transactions**: Prisma transactions
8. ✅ **Double-Entry**: Integridad financiera
9. ✅ **Webhook Verification**: Firma de Stripe/PayPal
10. ✅ **Input Sanitization**: Validación estricta

### Compliance

- **PCI DSS Ready**: No almacenamiento de tarjetas completas
- **GDPR**: Datos personales encriptados
- **SOX**: Auditoría inmutable
- **ISO 27001**: Mejores prácticas de seguridad

---

## Base de Datos

### Características

- **Engine**: PostgreSQL 14+
- **ORM**: Prisma 6.x
- **Migraciones**: Versionadas y reversibles
- **Índices**: Optimizados para queries frecuentes
- **Constraints**: Integridad referencial
- **JSONB**: Metadata flexible

### Optimizaciones

1. Índices compuestos para búsquedas
2. Índices por fecha para rangos
3. Índices únicos para idempotency
4. Cascade deletes configurados
5. Default values en columnas
6. Enum validation en tipos

---

## Testing

### Estrategia de Testing (Recomendado)

1. **Unit Tests**: Servicios y utilidades
2. **Integration Tests**: API routes
3. **E2E Tests**: Flujos completos
4. **Load Tests**: Rate limiting

### Herramientas Sugeridas

- Jest para unit tests
- Supertest para integration tests
- Postman/Insomnia para manual testing
- k6 para load testing

---

## Performance

### Optimizaciones Implementadas

1. **Database Queries**: Índices y eager loading
2. **Parallel Queries**: Promise.all donde posible
3. **Caching**: Redis recomendado (no implementado aún)
4. **Pagination**: Limit/offset en listados
5. **Lazy Loading**: Relaciones opcionales

### Métricas Esperadas

- Latencia P50: < 100ms
- Latencia P99: < 500ms
- Throughput: 1000+ req/s
- Concurrent Users: 10,000+

---

## Deployment

### Checklist Pre-Producción

- [ ] Variables de entorno configuradas
- [ ] Base de datos en alta disponibilidad
- [ ] Backups automáticos configurados
- [ ] Monitoreo y alertas (DataDog, Sentry)
- [ ] HTTPS habilitado
- [ ] Rate limiting ajustado
- [ ] Logs centralizados (ELK, CloudWatch)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Disaster recovery plan
- [ ] Documentación de runbooks

### Recomendaciones de Infraestructura

**Opción 1: Vercel + Neon (Recomendado para MVP)**
- Vercel: Frontend y API Routes
- Neon: PostgreSQL serverless
- Upstash Redis: Caching
- Resend: Emails

**Opción 2: AWS (Producción Enterprise)**
- ECS/Fargate: Containers
- RDS PostgreSQL: Database
- ElastiCache: Redis
- SES: Emails
- CloudFront: CDN
- WAF: Firewall

**Opción 3: Self-Hosted**
- Docker Compose
- PostgreSQL
- Nginx reverse proxy
- Let's Encrypt SSL

---

## Monitoreo y Observabilidad

### Métricas Clave

1. **Business Metrics**:
   - Total transactions/day
   - Total volume/day
   - Average transaction value
   - Success rate
   - Refund rate

2. **Technical Metrics**:
   - API latency (P50, P95, P99)
   - Error rate
   - Database query time
   - Rate limit hits
   - Cache hit rate

3. **Security Metrics**:
   - Failed login attempts
   - OTP verification failures
   - Webhook verification failures
   - Audit log volume

### Herramientas Recomendadas

- **APM**: DataDog, New Relic
- **Logging**: ELK Stack, CloudWatch
- **Errors**: Sentry
- **Uptime**: UptimeRobot, Pingdom
- **Analytics**: Mixpanel, Amplitude

---

## Próximos Pasos Recomendados

### Fase 2: Optimizaciones

1. [ ] Implementar Redis para caching de balances
2. [ ] Implementar rate limiting con Redis (más eficiente)
3. [ ] Agregar tests automatizados (unit + integration)
4. [ ] Implementar GraphQL como alternativa a REST
5. [ ] Agregar soporte para múltiples monedas
6. [ ] Implementar sistema de notificaciones en tiempo real (WebSockets)

### Fase 3: Features Avanzados

1. [ ] Sistema de referidos y rewards
2. [ ] Programas de cashback
3. [ ] Límites de transacción configurables
4. [ ] Reportes y analytics avanzados
5. [ ] Exportación de transacciones (CSV, PDF)
6. [ ] Integración con más pasarelas de pago

### Fase 4: Compliance y Seguridad

1. [ ] Certificación PCI DSS completa
2. [ ] Auditoría de seguridad externa
3. [ ] Penetration testing
4. [ ] GDPR compliance toolkit
5. [ ] KYC/AML integration
6. [ ] Fraud detection con ML

---

## Conclusión

Se ha implementado un backend robusto, seguro y escalable siguiendo las mejores prácticas de la industria financiera. El sistema está listo para desarrollo y testing, con una arquitectura que soporta crecimiento futuro.

**Tecnologías Principales:**
- Next.js 16 API Routes
- Prisma + PostgreSQL
- NextAuth
- Stripe + PayPal
- Zod validation
- BCrypt + AES-256

**Características Destacadas:**
- Double-entry accounting
- Idempotencia garantizada
- Rate limiting avanzado
- Auditoría inmutable
- Webhooks seguros
- OTP con email templates

**Listo para:**
- ✅ Desarrollo local
- ✅ Testing e integración
- ✅ Staging environment
- ⚠️ Producción (después de configurar infraestructura y hacer security audit)

---

**Autor:** Claude (Senior Backend Architect & AI Systems Engineer)
**Fecha:** 2025-01-16
**Versión:** 1.0.0
