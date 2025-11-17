# Guaira POS - Sistema de Punto de Venta y Billetera Digital

Una aplicación web moderna construida con React, TypeScript y Tailwind CSS para gestionar pagos, billeteras digitales y transacciones. Diseñada como interfaz frontend para conectarse con la infraestructura backend de Guaira Parking.

![Guaira POS](https://img.shields.io/badge/React-18.x-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-blue)

## 🎯 Características Principales

### 💰 Billetera Digital
- Gestión completa de balance en tiempo real
- Depósitos y retiros con múltiples métodos de pago
- Transferencias entre usuarios
- Historial detallado de transacciones
- Visualización de estadísticas y gráficos

### 🛒 Punto de Venta (POS)
- Catálogo de servicios con búsqueda y filtros
- Carrito de compras intuitivo
- Procesamiento de pagos con tarjeta o billetera
- Cálculo automático de impuestos
- Generación de recibos

### 📊 Dashboard Inteligente
- Resumen de balance y actividades
- Estadísticas de gastos mensuales
- Acciones rápidas para operaciones comunes
- Transacciones recientes con estado en tiempo real

### 🔐 Seguridad
- Autenticación JWT
- Rutas protegidas
- Gestión de sesiones
- Almacenamiento seguro de tokens

### 📱 Diseño Responsive
- Optimizado para desktop, tablet y móvil
- UI moderna con animaciones suaves
- Modo claro con paleta de colores personalizable
- Componentes reutilizables y modulares

## 🚀 Tecnologías Utilizadas

### Core
- **React 18** - Biblioteca de UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool ultra-rápido
- **React Router DOM** - Navegación

### Estado y Datos
- **Zustand** - Gestión de estado global
- **Axios** - Cliente HTTP
- **React Hook Form** - Manejo de formularios
- **Zod** - Validación de esquemas

### UI/UX
- **Tailwind CSS** - Framework de utilidades CSS
- **Lucide React** - Iconos modernos
- **date-fns** - Manipulación de fechas
- **Recharts** - Gráficos y visualizaciones

## 📦 Instalación

### Requisitos Previos
- Node.js 18+
- npm o yarn

### Pasos de Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tu configuración

# Ejecutar en modo desarrollo
npm run dev

# Compilar para producción
npm run build

# Vista previa de producción
npm run preview
```

## ⚙️ Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# API Configuration
VITE_API_URL=http://localhost:8080/api

# App Configuration
VITE_APP_NAME=Guaira POS
VITE_APP_VERSION=1.0.0
```

### Conexión con Backend

La aplicación está diseñada para conectarse con el backend de Guaira Parking (Dart/Shelf). Asegúrate de:

1. El backend esté corriendo en el puerto especificado (por defecto 8080)
2. CORS esté habilitado en el backend
3. Los endpoints coincidan con los definidos en `src/services/`

## 📂 Estructura del Proyecto

```
guaira-pos-web/
├── src/
│   ├── components/          # Componentes reutilizables
│   ├── layouts/            # Layouts de página
│   ├── pages/              # Páginas principales
│   ├── services/           # Servicios de API
│   ├── store/              # Estado global (Zustand)
│   ├── types/              # Tipos TypeScript
│   ├── App.tsx             # Componente principal
│   └── main.tsx           # Punto de entrada
├── .env                   # Variables de entorno
├── tailwind.config.js     # Configuración Tailwind
└── package.json           # Dependencias
```

## 🚀 Deployment

### Build de Producción
```bash
npm run build
```

Esto generará una carpeta `dist/` con los archivos optimizados para producción.

## 📄 Licencia

Este proyecto es privado y propietario de Guaira Parking.

---

**Desarrollado con ❤️ usando React, TypeScript y Tailwind CSS**
