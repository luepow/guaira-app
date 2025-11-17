# Guair.app - Digital Wallet & POS System

🚀 **Sistema de Billetera Digital y Punto de Venta** | Digital Wallet & Point of Sale System

[![Quality Score](https://img.shields.io/badge/QA%20Score-78%2F100-yellow)](https://github.com/luepow/guaira-app)
[![Production](https://img.shields.io/badge/Production-Online-brightgreen)](http://64.23.201.2)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)

## 📋 Tabla de Contenidos

- [Descripción](#descripción)
- [Características](#características)
- [Stack Tecnológico](#stack-tecnológico)
- [Instalación](#instalación)
- [Uso](#uso)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [API Endpoints](#api-endpoints)
- [Base de Datos](#base-de-datos)
- [Deployment](#deployment)
- [QA Report](#qa-report)
- [Roadmap](#roadmap)
- [Contribución](#contribución)
- [Licencia](#licencia)

## 📖 Descripción

Guair.app es un sistema moderno de billetera digital y punto de venta diseñado para facilitar pagos de parquímetros, servicios y comercios. La aplicación ofrece una experiencia de usuario fluida con autenticación segura, gestión de saldos y transacciones en tiempo real.

**Demo en vivo:** [http://64.23.201.2](http://64.23.201.2)

**Credenciales de prueba:**
- Email: `admin@guair.app`
- Password: `admin123`

## ✨ Características

### Implementadas ✅

- **Landing Page Responsiva**: Hero section con logo GUAIRAPP-24, features, CTAs
- **Sistema de Autenticación**: Login con Prisma ORM + bcrypt + JWT real
- **Dashboard Interactivo**: Visualización de balance, estadísticas, transacciones
- **FormInput Components**: Componentes de formulario con validación y UX mejorada
- **API RESTful**: Endpoints para autenticación con validación de métodos HTTP
- **PostgreSQL Database**: Schema con Prisma ORM, double-entry accounting
- **Responsive Design**: Compatible con mobile, tablet y desktop
- **Hydration Stable**: Sin errores de hidratación usando React useId()

### En Desarrollo 🚧

- Recargas de wallet (Stripe/PayPal integration)
- Transferencias entre usuarios
- Historial de transacciones completo
- Gestión de usuarios (admin panel)
- NFC payments con pulseras
- Modo offline para transacciones
- OTP authentication via SMS/Email
- Rate limiting y seguridad avanzada

## 🛠️ Stack Tecnológico

### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Language**: TypeScript 5.7
- **Styling**: Tailwind CSS 4 + PostCSS
- **Icons**: Lucide React
- **State Management**: React Hooks (useState, useEffect)

### Backend
- **Runtime**: Node.js 20
- **Framework**: Next.js API Routes
- **Database ORM**: Prisma 6.2.1
- **Authentication**: bcrypt + jsonwebtoken
- **Validation**: Zod (en desarrollo)

### Database
- **DBMS**: PostgreSQL 16
- **Schema**: Prisma schema con relaciones User-Wallet-Transaction
- **Features**: Double-entry accounting, audit logs, indexes

### Infrastructure
- **Server**: Ubuntu 24.04 (64.23.201.2)
- **Web Server**: Nginx (reverse proxy)
- **Process Manager**: PM2 (cluster mode)
- **Deployment**: GitHub Actions CI/CD
- **Port**: 9300 (internal), 80 (public)

## 📦 Instalación

### Requisitos

- Node.js 20+
- PostgreSQL 16+
- npm 10+
- Git

### Clonar el Repositorio

```bash
git clone https://github.com/luepow/guaira-app.git
cd guaira-app
```

### Instalar Dependencias

```bash
npm install
```

### Configurar Variables de Entorno

Crear archivo `.env`:

```env
# Database
DATABASE_URL="postgresql://guair_user:password@localhost:5432/guaira_db"

# JWT Secret
JWT_SECRET="your-super-secret-key-min-32-chars"

# NextAuth (opcional)
NEXTAUTH_URL="http://localhost:9300"
NEXTAUTH_SECRET="your-nextauth-secret"
```

### Configurar Base de Datos

```bash
# Crear base de datos
createdb guaira_db

# Ejecutar migraciones de Prisma
npx prisma migrate deploy

# Generar cliente de Prisma
npx prisma generate
```

### Iniciar en Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:9300](http://localhost:9300)

## 📊 QA Report

**Quality Score: 78/100**

### Tests Ejecutados: 35/45 (77.8%)
- ✅ Tests Pasados: 30/35 (85.7%)
- ❌ Tests Fallados: 2/35 (5.7%)
- ⚠️ Tests Parciales: 3/35 (8.6%)

### Performance Metrics
- Landing Page Load: **0.593s** ✅
- Login Page Load: **0.367s** ✅
- API Response Time: **0.349s** ✅

### Security Metrics
- ✅ Password Security: bcrypt con salt 10
- ✅ SQL Injection Protection: Prisma ORM
- ✅ JWT Security: Real tokens con firma
- ❌ HTTPS: NO implementado (crítico)

## 🗺️ Roadmap

### Sprint 1 - CRÍTICO ⚠️
- [x] Implementar JWT real
- [x] Validación de métodos HTTP
- [ ] Implementar HTTPS con Let's Encrypt
- [ ] Middleware de autenticación
- [ ] Rate limiting en login

### Sprint 2 - ALTO 🔴
- [ ] Wallet recharge (Stripe/PayPal)
- [ ] User transfers
- [ ] Transaction history
- [ ] Testing automatizado

### Sprint 3 - MEDIO 🟡
- [ ] NFC payments
- [ ] Offline mode
- [ ] OTP via SMS/Email
- [ ] Mobile app

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE) para detalles.

## 👥 Autores

- **Luis Perez** - [@luepow](https://github.com/luepow)

---

🤖 **Generated with [Claude Code](https://claude.com/claude-code)**

Co-Authored-By: Claude <noreply@anthropic.com>
