# Backend Setup Guide - Guaira POS

## Requisitos Previos

- Node.js 18+
- PostgreSQL 14+
- npm o yarn
- Cuenta en Stripe (opcional para pagos)
- Cuenta en PayPal (opcional para pagos)
- Cuenta en Resend o SendGrid (opcional para emails en producción)

## Instalación

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar Variables de Entorno

Copiar el archivo de ejemplo y configurar:

```bash
cp .env.example .env
```

Editar `.env` con tus credenciales reales:

```env
# Base de datos (obligatorio)
DATABASE_URL="postgresql://user:password@localhost:5432/guaira_pos_db"

# NextAuth (obligatorio)
NEXTAUTH_URL="http://localhost:9300"
NEXTAUTH_SECRET="generar-con-openssl-rand-hex-32"

# Email (opcional en dev, usar 'console')
EMAIL_PROVIDER="console"
EMAIL_FROM="noreply@guaira.app"

# Stripe (opcional)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# PayPal (opcional)
PAYPAL_CLIENT_ID="..."
PAYPAL_CLIENT_SECRET="..."
```

### 3. Generar Claves de Seguridad

```bash
# NextAuth Secret
openssl rand -hex 32

# Encryption Key (64 caracteres hex)
openssl rand -hex 32
```

### 4. Configurar Base de Datos

```bash
# Generar cliente de Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate deploy

# (Opcional) Seed con datos de prueba
npm run prisma:seed
```

## Estructura del Proyecto

```
app/
├── api/                                  # API Routes
│   ├── auth/
│   │   └── otp/
│   │       ├── generate/route.ts        # POST - Generar OTP
│   │       └── verify/route.ts          # POST - Verificar OTP
│   ├── wallet/
│   │   ├── balance/route.ts             # GET - Obtener balance
│   │   ├── deposit/route.ts             # POST - Depositar
│   │   ├── withdraw/route.ts            # POST - Retirar
│   │   └── transfer/route.ts            # POST - Transferir
│   ├── transactions/
│   │   ├── route.ts                     # GET - Listar transacciones
│   │   └── [id]/route.ts                # GET - Detalle transacción
│   └── payments/
│       ├── stripe/
│       │   ├── create/route.ts          # POST - Crear payment intent
│       │   └── webhook/route.ts         # POST - Webhook handler
│       └── paypal/
│           ├── create/route.ts          # POST - Crear orden
│           └── capture/route.ts         # POST - Capturar orden
│
├── lib/
│   ├── services/                         # Business Logic Services
│   │   ├── otp.service.ts               # Servicio de OTP
│   │   ├── wallet.service.ts            # Servicio de Wallet
│   │   └── payment.service.ts           # Servicio de Pagos
│   ├── utils/                           # Utilidades
│   │   ├── crypto.ts                    # Encriptación, hashing
│   │   ├── email.ts                     # Envío de emails
│   │   ├── rate-limiter.ts              # Rate limiting
│   │   ├── audit.ts                     # Logging de auditoría
│   │   └── response.ts                  # Helpers de respuesta
│   ├── validations/                     # Schemas de Zod
│   │   ├── auth.schema.ts
│   │   ├── wallet.schema.ts
│   │   ├── transaction.schema.ts
│   │   └── payment.schema.ts
│   └── middleware/                      # Middleware
│       ├── auth.middleware.ts           # Autenticación
│       ├── rate-limit.middleware.ts     # Rate limiting
│       └── validation.middleware.ts     # Validación
│
prisma/
├── schema.prisma                        # Schema de Prisma
└── migrations/                          # Migraciones de DB
```

## Testing

### 1. Testing Manual con cURL

**Generar OTP:**
```bash
curl -X POST http://localhost:9300/api/auth/otp/generate \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**Verificar OTP:**
```bash
curl -X POST http://localhost:9300/api/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otp":"123456"}'
```

**Depositar en Wallet (requiere auth):**
```bash
curl -X POST http://localhost:9300/api/wallet/deposit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{
    "amount": 100.00,
    "currency": "USD",
    "source": "stripe",
    "sourceId": "pi_test_123",
    "idempotencyKey": "uuid-here"
  }'
```

### 2. Testing con Postman

Importar colección en Postman con estos endpoints base.

### 3. Testing de Webhooks Localmente

Usar Stripe CLI para testing de webhooks:

```bash
# Instalar Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks a tu local
stripe listen --forward-to localhost:9300/api/payments/stripe/webhook
```

## Seguridad

### Mejores Prácticas Implementadas

1. **Rate Limiting**: Todos los endpoints críticos tienen rate limiting
2. **Idempotencia**: Transacciones garantizadas con idempotencyKey
3. **Auditoría**: Logs inmutables de todas las operaciones críticas
4. **Double-Entry**: Contabilidad de doble partida para integridad financiera
5. **Validación**: Zod schemas en todos los endpoints
6. **Encriptación**: Datos sensibles encriptados con AES-256-GCM
7. **Hashing**: Contraseñas y OTPs con bcrypt
8. **HTTPS**: Requerido en producción

### Checklist Pre-Producción

- [ ] Configurar `NEXTAUTH_SECRET` único y seguro
- [ ] Configurar `ENCRYPTION_KEY` único (64 hex chars)
- [ ] Cambiar `NODE_ENV=production`
- [ ] Usar proveedor de email real (no 'console')
- [ ] Configurar webhooks de Stripe/PayPal
- [ ] Habilitar HTTPS
- [ ] Configurar backups de base de datos
- [ ] Revisar límites de rate limiting
- [ ] Configurar monitoreo y alertas
- [ ] Auditar logs de seguridad

## Troubleshooting

### Error: "PrismaClient is not configured"

```bash
npx prisma generate
```

### Error: "Database connection failed"

Verificar que PostgreSQL esté corriendo y que `DATABASE_URL` sea correcta.

```bash
# Probar conexión
psql postgresql://user:password@localhost:5432/guaira_pos_db
```

### Emails no se envían

En desarrollo, usar `EMAIL_PROVIDER=console` para ver emails en consola.

En producción, verificar API keys de Resend/SendGrid.

### Webhooks no funcionan

1. Verificar que la URL sea accesible públicamente
2. Verificar `STRIPE_WEBHOOK_SECRET` o `PAYPAL_WEBHOOK_ID`
3. Usar Stripe CLI para testing local

## Mantenimiento

### Limpiar OTPs Expirados

Ejecutar periódicamente (puede ser un cron job):

```typescript
import { OtpService } from '@/app/lib/services/otp.service';

// Limpia OTPs expirados o verificados hace más de 24h
const deleted = await OtpService.cleanExpired();
console.log(`Deleted ${deleted} expired OTP codes`);
```

### Backup de Base de Datos

```bash
# Backup
pg_dump -U user -d guaira_pos_db > backup_$(date +%Y%m%d).sql

# Restore
psql -U user -d guaira_pos_db < backup_20250116.sql
```

### Monitoreo de Rate Limits

Query para ver IPs bloqueadas:

```sql
SELECT identifier, action, COUNT(*) as blocked_count
FROM rate_limit_logs
WHERE blocked = true
  AND "windowEnd" > NOW()
GROUP BY identifier, action
ORDER BY blocked_count DESC
LIMIT 20;
```

## Soporte

- Documentación API: Ver `API_DOCUMENTATION.md`
- Issues: GitHub Issues
- Email: dev@guaira.app
