# API Documentation - Guaira POS Backend

## Tabla de Contenidos

1. [Autenticación y OTP](#autenticación-y-otp)
2. [Wallet Management](#wallet-management)
3. [Transacciones](#transacciones)
4. [Pagos Externos](#pagos-externos)
5. [Webhooks](#webhooks)
6. [Códigos de Error](#códigos-de-error)

---

## Autenticación y OTP

### Generar OTP

Genera y envía un código OTP por email.

```http
POST /api/auth/otp/generate
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Respuesta (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Código OTP enviado exitosamente",
    "expiresAt": "2025-01-16T19:00:00.000Z"
  },
  "metadata": {
    "timestamp": "2025-01-16T18:50:00.000Z"
  }
}
```

**Rate Limiting:** 5 intentos cada 15 minutos por email

---

### Verificar OTP

Verifica un código OTP previamente generado.

```http
POST /api/auth/otp/verify
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Respuesta (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "OTP verificado exitosamente",
    "verified": true,
    "userId": "uuid-user-id"
  }
}
```

**Errores comunes:**
- `OTP_INVALID`: Código incorrecto o expirado
- `OTP_MAX_ATTEMPTS`: Máximo de intentos excedido (5 intentos por OTP)
- `RATE_LIMIT_EXCEEDED`: Demasiados intentos de verificación

---

## Wallet Management

### Obtener Balance

Obtiene el balance actual de la wallet del usuario autenticado.

```http
GET /api/wallet/balance
Authorization: Bearer {session-token}
```

**Respuesta (200 OK):**
```json
{
  "success": true,
  "data": {
    "walletId": "uuid-wallet-id",
    "balance": 1500.50,
    "currency": "USD",
    "status": "active"
  }
}
```

---

### Depositar Fondos

Realiza un depósito en la wallet del usuario.

```http
POST /api/wallet/deposit
Authorization: Bearer {session-token}
Content-Type: application/json

{
  "amount": 100.00,
  "currency": "USD",
  "source": "stripe",
  "sourceId": "pi_1234567890",
  "description": "Recarga de saldo",
  "idempotencyKey": "uuid-idempotency-key"
}
```

**Parámetros:**
- `amount` (number, required): Monto a depositar (positivo, máx 2 decimales)
- `currency` (string, required): Código de moneda (3 caracteres, ej: "USD")
- `source` (enum, required): Método de pago - "stripe" | "paypal" | "bank_transfer" | "cash"
- `sourceId` (string, optional): ID de referencia del pago externo
- `description` (string, optional): Descripción del depósito (máx 500 caracteres)
- `metadata` (object, optional): Datos adicionales
- `idempotencyKey` (string, required): UUID para prevenir duplicados

**Respuesta (201 Created):**
```json
{
  "success": true,
  "data": {
    "transaction": {
      "id": "uuid-transaction-id",
      "userId": "uuid-user-id",
      "walletId": "uuid-wallet-id",
      "type": "deposit",
      "amount": 100.00,
      "currency": "USD",
      "status": "succeeded",
      "description": "Recarga de saldo",
      "createdAt": "2025-01-16T18:50:00.000Z"
    },
    "message": "Depósito realizado exitosamente"
  }
}
```

**Características:**
- ✅ Idempotencia garantizada con `idempotencyKey`
- ✅ Double-entry accounting automático
- ✅ Auditoría completa de la operación
- ✅ Actualización atómica del balance

---

### Retirar Fondos

Realiza un retiro de la wallet del usuario.

```http
POST /api/wallet/withdraw
Authorization: Bearer {session-token}
Content-Type: application/json

{
  "amount": 50.00,
  "currency": "USD",
  "destination": "bank_account",
  "destinationId": "ba_1234567890",
  "description": "Retiro a cuenta bancaria",
  "idempotencyKey": "uuid-idempotency-key"
}
```

**Parámetros:**
- `amount` (number, required): Monto a retirar
- `currency` (string, required): Código de moneda
- `destination` (enum, required): Destino - "bank_account" | "paypal" | "stripe"
- `destinationId` (string, required): ID de la cuenta destino
- `description` (string, optional): Descripción del retiro
- `idempotencyKey` (string, required): UUID para prevenir duplicados

**Respuesta (201 Created):**
```json
{
  "success": true,
  "data": {
    "transaction": {
      "id": "uuid-transaction-id",
      "type": "withdrawal",
      "amount": 50.00,
      "status": "processing",
      "description": "Retiro a cuenta bancaria"
    },
    "message": "Retiro iniciado exitosamente"
  }
}
```

**Errores comunes:**
- `INSUFFICIENT_BALANCE`: Saldo insuficiente
- `WALLET_SUSPENDED`: Wallet suspendida o cerrada

---

### Transferir Fondos

Realiza una transferencia entre wallets de usuarios.

```http
POST /api/wallet/transfer
Authorization: Bearer {session-token}
Content-Type: application/json

{
  "amount": 25.00,
  "currency": "USD",
  "recipientId": "uuid-recipient-user-id",
  "description": "Pago por servicio",
  "idempotencyKey": "uuid-idempotency-key"
}
```

**Respuesta (201 Created):**
```json
{
  "success": true,
  "data": {
    "transaction": {
      "id": "uuid-transaction-id",
      "type": "transfer",
      "amount": -25.00,
      "status": "succeeded",
      "destinationId": "uuid-recipient-wallet-id"
    },
    "message": "Transferencia realizada exitosamente"
  }
}
```

---

## Transacciones

### Listar Transacciones

Lista todas las transacciones del usuario con paginación y filtros.

```http
GET /api/transactions?page=1&limit=20&type=deposit&status=succeeded&sortBy=createdAt&sortOrder=desc
Authorization: Bearer {session-token}
```

**Query Parameters:**
- `page` (number, optional): Página actual (default: 1)
- `limit` (number, optional): Resultados por página (default: 20, max: 100)
- `type` (enum, optional): Filtrar por tipo - "deposit" | "payment" | "withdrawal" | "transfer" | "refund"
- `status` (enum, optional): Filtrar por estado - "pending" | "processing" | "succeeded" | "failed" | "cancelled"
- `startDate` (ISO datetime, optional): Fecha de inicio
- `endDate` (ISO datetime, optional): Fecha de fin
- `sortBy` (enum, optional): Campo para ordenar - "createdAt" | "amount" | "status" (default: createdAt)
- `sortOrder` (enum, optional): Orden - "asc" | "desc" (default: desc)

**Respuesta (200 OK):**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "uuid-transaction-id",
        "type": "deposit",
        "amount": 100.00,
        "currency": "USD",
        "status": "succeeded",
        "description": "Recarga de saldo",
        "createdAt": "2025-01-16T18:50:00.000Z",
        "wallet": {
          "id": "uuid-wallet-id",
          "currency": "USD"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

### Detalle de Transacción

Obtiene información detallada de una transacción específica.

```http
GET /api/transactions/{transaction-id}
Authorization: Bearer {session-token}
```

**Respuesta (200 OK):**
```json
{
  "success": true,
  "data": {
    "transaction": {
      "id": "uuid-transaction-id",
      "userId": "uuid-user-id",
      "walletId": "uuid-wallet-id",
      "type": "deposit",
      "amount": 100.00,
      "currency": "USD",
      "status": "succeeded",
      "description": "Recarga de saldo",
      "metadata": {},
      "idempotencyKey": "uuid-idempotency-key",
      "sourceId": "pi_1234567890",
      "createdAt": "2025-01-16T18:50:00.000Z",
      "wallet": {
        "id": "uuid-wallet-id",
        "currency": "USD",
        "balance": 1500.50
      },
      "ledgerEntries": [
        {
          "id": "uuid-ledger-id",
          "accountType": "asset",
          "debit": 100.00,
          "credit": 0.00,
          "balance": 1500.50,
          "description": "Depósito - Recarga de saldo"
        },
        {
          "id": "uuid-ledger-id-2",
          "accountType": "revenue",
          "debit": 0.00,
          "credit": 100.00,
          "balance": 0.00,
          "description": "Ingreso por depósito - Recarga de saldo"
        }
      ]
    }
  }
}
```

---

## Pagos Externos

### Stripe - Crear Payment Intent

Crea un Payment Intent para procesar un pago con Stripe.

```http
POST /api/payments/stripe/create
Authorization: Bearer {session-token}
Content-Type: application/json

{
  "amount": 100.00,
  "currency": "usd",
  "description": "Recarga de saldo",
  "metadata": {
    "source": "mobile_app"
  },
  "paymentMethodId": "pm_1234567890"
}
```

**Respuesta (201 Created):**
```json
{
  "success": true,
  "data": {
    "paymentIntent": {
      "id": "pi_1234567890",
      "amount": 10000,
      "currency": "usd",
      "status": "succeeded",
      "client_secret": "pi_1234567890_secret_xxxxx"
    },
    "clientSecret": "pi_1234567890_secret_xxxxx"
  }
}
```

**Uso del clientSecret:**
El `clientSecret` debe usarse en el frontend con Stripe.js para confirmar el pago:

```javascript
const stripe = Stripe('pk_publishable_key');
const result = await stripe.confirmCardPayment(clientSecret);
```

---

### Stripe - Webhook Handler

Endpoint para recibir eventos de Stripe (payment confirmations, refunds, etc).

```http
POST /api/payments/stripe/webhook
Stripe-Signature: {stripe-signature-header}
Content-Type: application/json

{...stripe-event-data}
```

**Eventos soportados:**
- `payment_intent.succeeded`: Pago exitoso → Depósito automático en wallet
- `payment_intent.payment_failed`: Pago fallido → Log de auditoría
- `charge.refunded`: Reembolso → Creación de registro de refund

**Respuesta (200 OK):**
```json
{
  "success": true,
  "data": {
    "received": true
  }
}
```

**Seguridad:**
- ✅ Verificación de firma con `STRIPE_WEBHOOK_SECRET`
- ✅ Procesamiento idempotente de eventos
- ✅ Auditoría completa de todos los eventos

---

### PayPal - Crear Orden

Crea una orden de pago con PayPal.

```http
POST /api/payments/paypal/create
Authorization: Bearer {session-token}
Content-Type: application/json

{
  "amount": 100.00,
  "currency": "USD",
  "description": "Recarga de saldo"
}
```

**Respuesta (201 Created):**
```json
{
  "success": true,
  "data": {
    "orderId": "ORDER-1234567890",
    "approvalUrl": "https://www.paypal.com/checkoutnow?token=ORDER-1234567890"
  }
}
```

**Flujo de pago:**
1. Crear orden en backend
2. Redirigir usuario a `approvalUrl`
3. Usuario aprueba pago en PayPal
4. PayPal redirige a tu app
5. Capturar orden (ver siguiente endpoint)

---

### PayPal - Capturar Orden

Captura una orden de PayPal previamente aprobada.

```http
POST /api/payments/paypal/capture
Authorization: Bearer {session-token}
Content-Type: application/json

{
  "orderId": "ORDER-1234567890"
}
```

**Respuesta (200 OK):**
```json
{
  "success": true,
  "data": {
    "capture": {
      "id": "CAPTURE-1234567890",
      "status": "COMPLETED",
      "purchase_units": [...]
    },
    "message": "Pago capturado y depositado exitosamente"
  }
}
```

**Proceso automático:**
1. Captura la orden en PayPal
2. Extrae monto y moneda
3. Crea depósito automático en wallet
4. Registra auditoría completa

---

## Webhooks

### Configuración de Webhooks

#### Stripe Webhook
1. URL: `https://your-domain.com/api/payments/stripe/webhook`
2. Eventos a suscribir:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
3. Configurar `STRIPE_WEBHOOK_SECRET` en .env

#### PayPal Webhook
1. URL: `https://your-domain.com/api/payments/paypal/webhook`
2. Eventos a suscribir:
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
   - `PAYMENT.CAPTURE.REFUNDED`
3. Configurar `PAYPAL_WEBHOOK_ID` en .env

---

## Códigos de Error

### Validación
- `VALIDATION_ERROR`: Error en la validación de datos (400)
- `INVALID_INPUT`: Input inválido (400)

### Autenticación
- `UNAUTHORIZED`: No autenticado (401)
- `FORBIDDEN`: Sin permisos (403)
- `INVALID_TOKEN`: Token inválido (401)
- `TOKEN_EXPIRED`: Token expirado (401)

### OTP
- `OTP_EXPIRED`: OTP expirado (400)
- `OTP_INVALID`: OTP inválido (400)
- `OTP_MAX_ATTEMPTS`: Máximo de intentos excedido (400)

### Rate Limiting
- `RATE_LIMIT_EXCEEDED`: Límite de rate excedido (429)
- `TOO_MANY_REQUESTS`: Demasiadas peticiones (429)

### Recursos
- `NOT_FOUND`: Recurso no encontrado (404)
- `ALREADY_EXISTS`: Recurso ya existe (409)
- `CONFLICT`: Conflicto en la operación (409)

### Wallet
- `INSUFFICIENT_BALANCE`: Saldo insuficiente (400)
- `WALLET_SUSPENDED`: Wallet suspendida (400)
- `WALLET_NOT_FOUND`: Wallet no encontrada (404)
- `TRANSACTION_FAILED`: Transacción fallida (400)
- `DUPLICATE_TRANSACTION`: Transacción duplicada (409)

### Pagos
- `PAYMENT_FAILED`: Pago fallido (400)
- `PAYMENT_PROCESSING`: Pago en procesamiento (400)
- `REFUND_FAILED`: Reembolso fallido (400)

### Sistema
- `INTERNAL_ERROR`: Error interno del servidor (500)
- `SERVICE_UNAVAILABLE`: Servicio no disponible (503)
- `BAD_REQUEST`: Request inválida (400)

---

## Seguridad y Mejores Prácticas

### Rate Limiting
Todos los endpoints tienen rate limiting configurado:
- OTP Generation: 5 intentos / 15 min
- OTP Verification: 10 intentos / 15 min
- Login: 5 intentos / 15 min
- API Calls: 100 requests / min
- Wallet Transactions: 10 requests / min

### Idempotencia
Todos los endpoints de escritura (POST) requieren `idempotencyKey` (UUID) para prevenir duplicados.

### Auditoría
Todas las operaciones críticas se registran en logs de auditoría inmutables:
- Autenticación y login
- Transacciones financieras
- Cambios en wallets
- Operaciones de pago

### Double-Entry Accounting
Todas las transacciones financieras generan entradas de doble partida en el ledger:
- Cada transacción tiene al menos 2 entradas: DR (debit) y CR (credit)
- Suma de débitos = Suma de créditos (validación automática)
- Balance calculado en cada entrada para trazabilidad

### HTTPS Requerido
Todos los endpoints deben usarse sobre HTTPS en producción para proteger:
- Tokens de sesión
- Datos de pago
- Información personal

---

## Testing

### Credenciales de Prueba

**Stripe Test Cards:**
- Success: `4242424242424242`
- Decline: `4000000000000002`
- Insufficient funds: `4000000000009995`

**PayPal Sandbox:**
- Email: `sb-buyer@business.example.com`
- Password: `testpassword123`

### OTP de Prueba (Development)
En modo desarrollo (`EMAIL_PROVIDER=console`), los OTPs se imprimen en consola en lugar de enviarse por email.

---

## Soporte

Para reportar bugs o solicitar features:
- Email: dev@guaira.app
- GitHub Issues: https://github.com/guaira-app/backend/issues
