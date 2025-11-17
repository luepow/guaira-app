# Quick Start - Guaira POS Backend

## 🚀 Inicio Rápido (5 minutos)

### 1. Clonar y Setup Inicial
```bash
cd /Users/lperez/Workspace/Development/fullstack/guaira_app/apps/guaira-pos-web

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env
```

### 2. Configurar Variables Mínimas
Editar `.env` con estos valores mínimos:

```env
# Database (asegúrate que PostgreSQL esté corriendo)
DATABASE_URL="postgresql://postgres:password@localhost:5432/guaira_pos"

# NextAuth
NEXTAUTH_URL="http://localhost:9300"
NEXTAUTH_SECRET="$(openssl rand -hex 32)"

# Email (modo desarrollo - imprime en consola)
EMAIL_PROVIDER="console"
EMAIL_FROM="noreply@guaira.app"

# Encryption (genera con: openssl rand -hex 32)
ENCRYPTION_KEY="$(openssl rand -hex 32)"
```

### 3. Setup de Base de Datos
```bash
# Generar cliente de Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate deploy

# Ver base de datos en navegador (opcional)
npx prisma studio
```

### 4. Iniciar Servidor
```bash
npm run dev
```

El servidor estará corriendo en: **http://localhost:9300**

---

## ✅ Testing Básico

### Test 1: Generar OTP
```bash
curl -X POST http://localhost:9300/api/auth/otp/generate \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**Resultado esperado:**
```json
{
  "success": true,
  "data": {
    "message": "Código OTP enviado exitosamente",
    "expiresAt": "2025-01-16T19:00:00.000Z"
  }
}
```

**El código OTP se imprimirá en la consola del servidor** (porque EMAIL_PROVIDER=console)

### Test 2: Verificar OTP
```bash
# Usar el código que viste en la consola
curl -X POST http://localhost:9300/api/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otp":"123456"}'
```

---

## 📋 Comandos Útiles

### Base de Datos
```bash
# Ver base de datos en navegador
npx prisma studio

# Generar nueva migración
npx prisma migrate dev --name nombre_migracion

# Aplicar migraciones en producción
npx prisma migrate deploy

# Resetear base de datos (CUIDADO en dev)
npx prisma migrate reset

# Generar cliente de Prisma
npx prisma generate

# Seed de datos de prueba
npm run prisma:seed
```

### Desarrollo
```bash
# Iniciar servidor de desarrollo
npm run dev

# Build para producción
npm run build

# Iniciar servidor de producción
npm start

# Linting
npm run lint
```

---

## 📚 Documentación Completa

Para información detallada, consulta:

- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Documentación completa de API
- **[BACKEND_SETUP.md](./BACKEND_SETUP.md)** - Guía de setup detallada
- **[BACKEND_IMPLEMENTATION_SUMMARY.md](./BACKEND_IMPLEMENTATION_SUMMARY.md)** - Resumen ejecutivo
- **[IMPLEMENTATION_FILES.md](./IMPLEMENTATION_FILES.md)** - Índice de archivos

---

## 🔐 Configuración de Pagos (Opcional)

### Stripe (Testing)
1. Crear cuenta en https://dashboard.stripe.com
2. Obtener API keys de test
3. Configurar en `.env`:
```env
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

4. Configurar webhook:
```bash
# Instalar Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks a local
stripe listen --forward-to localhost:9300/api/payments/stripe/webhook
```

### PayPal (Testing)
1. Crear cuenta en https://developer.paypal.com
2. Crear app en sandbox
3. Configurar en `.env`:
```env
PAYPAL_CLIENT_ID="..."
PAYPAL_CLIENT_SECRET="..."
PAYPAL_MODE="sandbox"
```

---

**¡Listo para empezar a desarrollar! 🎉**
