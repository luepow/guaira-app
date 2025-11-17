# Guair.app - API Documentation

API REST para consumir desde la aplicación móvil Flutter.

## Base URL

```
http://localhost:9300/api
```

## Autenticación

La API utiliza tokens Bearer para autenticación. Incluye el token en el header:

```
Authorization: Bearer {token}
```

---

## 🔐 Autenticación

### POST /api/auth/login

Iniciar sesión con teléfono y contraseña.

**Request Body:**
```json
{
  "phone": "+584121234567",
  "password": "demo123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "1",
      "phone": "+584121234567",
      "name": "Usuario Demo",
      "email": "demo@guair.app",
      "balance": 25000,
      "currency": "USD",
      "role": "merchant"
    },
    "token": "token-1-1699564800000"
  },
  "message": "Login exitoso"
}
```

**Usuarios de prueba:**
- **Demo:** `+584121234567` / `demo123`
- **Test:** `+584129876543` / `test123`

---

### POST /api/auth/register

Registrar un nuevo usuario.

**Request Body:**
```json
{
  "phone": "+584121111111",
  "password": "password123",
  "name": "Nuevo Usuario",
  "email": "nuevo@guair.app"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "1699564800000",
      "phone": "+584121111111",
      "name": "Nuevo Usuario",
      "email": "nuevo@guair.app",
      "balance": 0,
      "currency": "USD",
      "role": "customer",
      "createdAt": "2024-11-08T00:00:00.000Z"
    },
    "token": "token-1699564800000-1699564800000"
  },
  "message": "Usuario registrado exitosamente"
}
```

---

## 💰 Billetera

### GET /api/wallet/{userId}

Obtener información de la billetera del usuario.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "userId": "1",
    "balance": 25000,
    "currency": "USD",
    "status": "active",
    "updatedAt": "2024-11-08T00:00:00.000Z"
  }
}
```

---

### GET /api/wallet/{userId}/transactions

Obtener transacciones del usuario con paginación.

**Query Parameters:**
- `page` (opcional): Número de página (default: 1)
- `pageSize` (opcional): Tamaño de página (default: 50)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "txn_1",
        "userId": "1",
        "type": "deposit",
        "amount": 5000,
        "currency": "USD",
        "status": "succeeded",
        "description": "Recarga de saldo",
        "createdAt": "2024-11-07T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 50,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

**Tipos de transacción:**
- `deposit`: Recarga de saldo
- `payment`: Pago realizado
- `withdrawal`: Retiro de saldo

**Estados:**
- `pending`: Pendiente
- `processing`: Procesando
- `succeeded`: Exitosa
- `failed`: Fallida

---

### POST /api/wallet/deposit

Realizar un depósito a la billetera.

**Request Body:**
```json
{
  "userId": "1",
  "amount": 10000,
  "paymentMethod": "credit_card"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "txn_1699564800000",
    "userId": "1",
    "type": "deposit",
    "amount": 10000,
    "currency": "USD",
    "paymentMethod": "credit_card",
    "status": "succeeded",
    "description": "Recarga de saldo vía credit_card",
    "createdAt": "2024-11-08T00:00:00.000Z"
  },
  "message": "Depósito realizado exitosamente"
}
```

---

## 🛒 Punto de Venta (POS)

### POST /api/pos/payment

Procesar un pago en el punto de venta.

**Request Body:**
```json
{
  "userId": "1",
  "merchantId": "merchant_1",
  "amount": 2500,
  "description": "Pago en Restaurant La Guaira",
  "items": [
    {
      "name": "Hamburguesa",
      "quantity": 2,
      "price": 1000
    },
    {
      "name": "Refresco",
      "quantity": 2,
      "price": 250
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "pay_1699564800000",
    "userId": "1",
    "merchantId": "merchant_1",
    "amount": 2500,
    "currency": "USD",
    "status": "succeeded",
    "description": "Pago en Restaurant La Guaira",
    "items": [...],
    "createdAt": "2024-11-08T00:00:00.000Z"
  },
  "message": "Pago procesado exitosamente"
}
```

---

## 👤 Usuario

### GET /api/user/{userId}

Obtener perfil del usuario.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "phone": "+584121234567",
    "name": "Usuario Demo",
    "email": "demo@guair.app",
    "balance": 25000,
    "currency": "USD",
    "role": "merchant",
    "avatar": "/avatars/demo.png",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### PUT /api/user/{userId}

Actualizar perfil del usuario.

**Request Body:**
```json
{
  "name": "Nuevo Nombre",
  "email": "nuevo@email.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "phone": "+584121234567",
    "name": "Nuevo Nombre",
    "email": "nuevo@email.com",
    "balance": 25000,
    "currency": "USD",
    "role": "merchant",
    "avatar": "/avatars/demo.png",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-11-08T00:00:00.000Z"
  },
  "message": "Perfil actualizado exitosamente"
}
```

---

## 📝 Códigos de Estado

- `200` - OK: Solicitud exitosa
- `201` - Created: Recurso creado exitosamente
- `400` - Bad Request: Datos inválidos
- `401` - Unauthorized: No autenticado
- `404` - Not Found: Recurso no encontrado
- `500` - Internal Server Error: Error del servidor

---

## 🔧 Formato de Respuesta

Todas las respuestas siguen este formato:

```json
{
  "success": boolean,
  "data": object | array | null,
  "message": string | null,
  "error": string | null
}
```

---

## 🚀 Ejemplos de Uso en Flutter

### Login
```dart
final response = await http.post(
  Uri.parse('http://localhost:9300/api/auth/login'),
  headers: {'Content-Type': 'application/json'},
  body: jsonEncode({
    'phone': '+584121234567',
    'password': 'demo123',
  }),
);
```

### Obtener Wallet
```dart
final response = await http.get(
  Uri.parse('http://localhost:9300/api/wallet/1'),
  headers: {
    'Authorization': 'Bearer $token',
  },
);
```

### Realizar Pago
```dart
final response = await http.post(
  Uri.parse('http://localhost:9300/api/pos/payment'),
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer $token',
  },
  body: jsonEncode({
    'userId': '1',
    'merchantId': 'merchant_1',
    'amount': 2500,
    'description': 'Pago en Restaurant',
  }),
);
```

---

## 📌 Notas Importantes

1. **Datos Mock**: Esta API actualmente usa datos simulados en memoria.
2. **Persistencia**: Los datos NO se persisten entre reinicios del servidor.
3. **Tokens**: Los tokens son simples strings. En producción usar JWT.
4. **CORS**: La API está configurada para aceptar peticiones desde cualquier origen.
5. **Desarrollo**: Ideal para desarrollo y pruebas de la app Flutter.

---

## 🔜 Próximas Implementaciones

- [ ] Base de datos real (PostgreSQL)
- [ ] JWT para autenticación
- [ ] Middleware de validación
- [ ] Rate limiting
- [ ] Logs estructurados
- [ ] WebSockets para notificaciones en tiempo real
- [ ] Integración con PSP real
