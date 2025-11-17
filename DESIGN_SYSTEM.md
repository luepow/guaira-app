# Guair.app Design System

## Tabla de Contenidos

- [Colores](#colores)
- [Tipografía](#tipografía)
- [Componentes](#componentes)
- [Animaciones](#animaciones)
- [Espaciado](#espaciado)
- [Accesibilidad](#accesibilidad)
- [Mejores Prácticas](#mejores-prácticas)

---

## Colores

### Paleta de Colores Principal

El sistema de colores está basado en el branding de Guair.app y sigue una escala de 50 a 950 para cada color.

#### Primary (Verde)
Color principal de la marca, utilizado para CTAs y elementos destacados.

```css
primary-50: #edfdf5
primary-100: #d1fae5
primary-200: #a7f3d0
primary-300: #6ee7b7
primary-400: #5FD89D  /* Verde principal del logo */
primary-500: #2FA570
primary-600: #22835d
primary-700: #1b6b4d
primary-800: #16543e
primary-900: #124534
primary-950: #0a2820
```

**Uso:**
- CTAs primarios
- Botones de acción importantes
- Enlaces activos
- Estados de éxito

#### Secondary (Azul Marino)
Color secundario para fondos oscuros y elementos de soporte.

```css
secondary-50: #f0f4f8
secondary-100: #dae3ec
secondary-200: #b8cad9
secondary-300: #8da9bf
secondary-400: #5f85a1
secondary-500: #1E3A5F  /* Azul marino del logo */
secondary-600: #15293f
secondary-700: #0f1d30
secondary-800: #0c1625
secondary-900: #09111c
secondary-950: #050a10
```

**Uso:**
- Fondos oscuros
- Secciones alternativas
- Headers y footers

#### Accent (Azul Cielo)
Color de acento para elementos interactivos y destacados.

```css
accent-50: #f0f9ff
accent-100: #e0f2fe
accent-200: #bae6fd
accent-300: #7dd3fc
accent-400: #38bdf8
accent-500: #0ea5e9
accent-600: #0284c7
accent-700: #0369a1
accent-800: #075985
accent-900: #0c4a6e
accent-950: #082f49
```

**Uso:**
- Elementos interactivos secundarios
- Highlights
- Notificaciones informativas

### Colores Semánticos

```css
/* Success */
green-400, green-500, green-600

/* Warning */
yellow-400, yellow-500, yellow-600

/* Error */
red-400, red-500, red-600

/* Info */
blue-400, blue-500, blue-600
```

---

## Tipografía

### Familias de Fuentes

```css
font-sans: 'Inter', system-ui, -apple-system, sans-serif
font-mono: 'Fira Code', monospace
```

### Escalas de Tamaño

```css
text-xs: 0.75rem (12px)
text-sm: 0.875rem (14px)
text-base: 1rem (16px)
text-lg: 1.125rem (18px)
text-xl: 1.25rem (20px)
text-2xl: 1.5rem (24px)
text-3xl: 1.875rem (30px)
text-4xl: 2.25rem (36px)
text-5xl: 3rem (48px)
text-6xl: 3.75rem (60px)
text-7xl: 4.5rem (72px)
```

### Pesos de Fuente

```css
font-light: 300
font-normal: 400
font-medium: 500
font-semibold: 600
font-bold: 700
font-extrabold: 800
font-black: 900
```

### Jerarquía de Títulos

```tsx
// H1 - Títulos principales de página
<h1 className="text-5xl md:text-6xl lg:text-7xl font-bold">

// H2 - Secciones principales
<h2 className="text-4xl md:text-5xl font-bold">

// H3 - Subsecciones
<h3 className="text-2xl md:text-3xl font-bold">

// H4 - Títulos de cards/componentes
<h4 className="text-xl md:text-2xl font-semibold">
```

---

## Componentes

### Button

El componente `Button` incluye múltiples variantes y tamaños.

```tsx
import { Button } from '@/components/Button'

// Variantes
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="danger">Danger</Button>
<Button variant="success">Success</Button>

// Tamaños
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// Con iconos
<Button leftIcon={<Icon />}>With Left Icon</Button>
<Button rightIcon={<Icon />}>With Right Icon</Button>

// Loading state
<Button isLoading>Loading...</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'danger' | 'success'
- `size`: 'sm' | 'md' | 'lg'
- `isLoading`: boolean
- `leftIcon`: ReactNode
- `rightIcon`: ReactNode
- Todas las props estándar de `<button>`

### FormInput

Componente de input con validación y estados visuales.

```tsx
import { FormInput } from '@/components/ui/FormInput'

<FormInput
  label="Email"
  type="email"
  placeholder="tu@email.com"
  error="Email inválido"
  helperText="Texto de ayuda"
  leftIcon={<Mail />}
  required
/>
```

**Props:**
- `label`: string
- `error`: string
- `helperText`: string
- `leftIcon`: ReactNode
- `rightIcon`: ReactNode
- `size`: 'sm' | 'md' | 'lg'
- `variant`: 'default' | 'filled' | 'outlined'

### Dialog

Modal/Dialog con backdrop y animaciones.

```tsx
import { Dialog, ConfirmDialog } from '@/components/ui/Dialog'

// Dialog básico
<Dialog
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Título"
  description="Descripción"
>
  <p>Contenido del dialog</p>
</Dialog>

// Confirm Dialog
<ConfirmDialog
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onConfirm={handleConfirm}
  title="Confirmar acción"
  message="¿Estás seguro?"
  confirmText="Confirmar"
  confirmVariant="danger"
/>
```

**Props Dialog:**
- `isOpen`: boolean
- `onClose`: () => void
- `title`: string
- `description`: string
- `size`: 'sm' | 'md' | 'lg' | 'xl' | 'full'
- `showCloseButton`: boolean
- `closeOnBackdrop`: boolean
- `closeOnEscape`: boolean
- `footer`: ReactNode

### Toast

Sistema de notificaciones toast.

```tsx
import { ToastProvider, useToast } from '@/components/ui/Toast'

// En el root de tu app
<ToastProvider>
  {children}
</ToastProvider>

// En cualquier componente
const { showToast } = useToast()

showToast({
  type: 'success',
  message: 'Operación exitosa',
  description: 'Descripción opcional',
  duration: 3000
})
```

**Tipos de Toast:**
- `success`: Verde - Operaciones exitosas
- `error`: Rojo - Errores
- `warning`: Amarillo - Advertencias
- `info`: Azul - Información

---

## Animaciones

### Animaciones Disponibles

```css
/* Fade */
animate-fade-in          /* Aparición suave */
animate-fade-in-up       /* Aparición desde abajo */

/* Slide */
animate-slide-up         /* Deslizar hacia arriba */
animate-slide-down       /* Deslizar hacia abajo */

/* Movement */
animate-float            /* Flotación suave */
animate-blob             /* Movimiento orgánico */
animate-wave             /* Efecto de onda */

/* Timing */
animate-bounce-slow      /* Rebote lento */
animate-pulse-slow       /* Pulso lento */
animate-spin-slow        /* Rotación lenta */
animate-spin-reverse     /* Rotación inversa */

/* Effects */
animate-shimmer          /* Efecto shimmer/brillo */
```

### Delays de Animación

```css
animation-delay-0        /* Sin delay */
animation-delay-200      /* 0.2s delay */
animation-delay-400      /* 0.4s delay */
animation-delay-2000     /* 2s delay */
animation-delay-4000     /* 4s delay */
```

### Uso de Animaciones

```tsx
// Animación básica
<div className="animate-fade-in-up">
  Contenido animado
</div>

// Con delay
<div className="animate-fade-in-up animation-delay-200">
  Aparece después
</div>

// Múltiples elementos con delays escalonados
{items.map((item, index) => (
  <div
    key={index}
    className="animate-fade-in-up"
    style={{ animationDelay: `${index * 100}ms` }}
  >
    {item}
  </div>
))}
```

---

## Espaciado

### Sistema de Espaciado

Basado en múltiplos de 4px (0.25rem):

```css
0: 0px
1: 0.25rem (4px)
2: 0.5rem (8px)
3: 0.75rem (12px)
4: 1rem (16px)
5: 1.25rem (20px)
6: 1.5rem (24px)
8: 2rem (32px)
10: 2.5rem (40px)
12: 3rem (48px)
16: 4rem (64px)
20: 5rem (80px)
24: 6rem (96px)
```

### Aplicación

```tsx
// Padding
<div className="p-4">       {/* padding: 1rem */}
<div className="px-6 py-4"> {/* padding-x: 1.5rem, padding-y: 1rem */}

// Margin
<div className="m-4">       {/* margin: 1rem */}
<div className="mt-8 mb-4"> {/* margin-top: 2rem, margin-bottom: 1rem */}

// Gap (Grid/Flex)
<div className="flex gap-4">    {/* gap: 1rem */}
<div className="grid gap-6">    {/* gap: 1.5rem */}
```

---

## Accesibilidad

### Principios WCAG 2.2

El design system sigue las pautas WCAG 2.2 nivel AA:

#### 1. Contraste de Color

Todos los textos mantienen un ratio de contraste mínimo:
- Texto normal: 4.5:1
- Texto grande (18px+): 3:1

```tsx
// Textos sobre fondos oscuros
<p className="text-white">Contraste 21:1</p>
<p className="text-gray-300">Contraste ~12:1</p>
<p className="text-gray-400">Contraste ~7:1</p>
```

#### 2. Navegación por Teclado

Todos los componentes interactivos son accesibles por teclado:

```tsx
// Focus visible
className="focus:outline-none focus:ring-2 focus:ring-primary-500"

// Tab index apropiado
<button tabIndex={0}>Accesible</button>
<div tabIndex={-1}>No en tab order</div>
```

#### 3. ARIA Labels

```tsx
// Botones con iconos
<button aria-label="Cerrar diálogo">
  <X className="w-5 h-5" />
</button>

// Inputs
<input
  aria-invalid={error ? 'true' : 'false'}
  aria-describedby="input-error"
/>

// Dialogs
<div role="dialog" aria-modal="true" aria-labelledby="dialog-title">
```

#### 4. Estados Visuales

```tsx
// Disabled
<button disabled className="disabled:opacity-50 disabled:cursor-not-allowed">

// Error
<input className="border-red-500" aria-invalid="true" />

// Loading
<button aria-busy="true">
  <Loader className="animate-spin" />
</button>
```

---

## Mejores Prácticas

### 1. Responsive Design

Usa las breakpoints de Tailwind:

```tsx
// Mobile first
<div className="text-sm md:text-base lg:text-lg">
  Texto responsivo
</div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  Grid responsivo
</div>
```

### 2. Glass Morphism

Para efectos de vidrio esmerilado:

```tsx
<div className="bg-white/5 backdrop-blur-xl border border-white/10">
  Contenido con efecto glass
</div>
```

### 3. Gradientes

```tsx
// Gradientes de marca
<div className="bg-gradient-to-r from-primary-500 to-accent-500">

// Fondos
<div className="bg-gradient-to-br from-gray-900 via-secondary-900 to-gray-900">
```

### 4. Shadows

```tsx
// Elevación suave
className="shadow-lg"

// Elevación pronunciada
className="shadow-2xl"

// Con hover
className="shadow-lg hover:shadow-2xl transition-shadow"
```

### 5. Transiciones

Usa transiciones suaves para mejor UX:

```tsx
<button className="transition-all duration-200 hover:scale-105">
  Botón con transición
</button>

<div className="transition-colors hover:bg-white/10">
  Cambio de color suave
</div>
```

### 6. Loading States

Siempre proporciona feedback visual:

```tsx
// Botón con loading
<Button isLoading>Procesando...</Button>

// Spinner
<Loader2 className="w-6 h-6 animate-spin" />

// Skeleton
<div className="animate-pulse bg-white/10 h-20 rounded-lg" />
```

### 7. Error Handling

Muestra errores de forma clara:

```tsx
<FormInput
  error="Este campo es requerido"
  helperText="Texto de ayuda"
/>

{error && (
  <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl">
    <AlertCircle className="w-5 h-5 text-red-400" />
    <p className="text-red-300">{error}</p>
  </div>
)}
```

---

## Estructura de Archivos

```
app/
├── components/
│   ├── ui/                 # Componentes base del UI
│   │   ├── Dialog.tsx
│   │   ├── Toast.tsx
│   │   ├── FormInput.tsx
│   │   └── index.ts
│   ├── landing/            # Componentes de landing
│   │   ├── Hero.tsx
│   │   ├── Features.tsx
│   │   ├── Security.tsx
│   │   ├── Testimonials.tsx
│   │   ├── Pricing.tsx
│   │   ├── CTA.tsx
│   │   ├── Footer.tsx
│   │   └── index.ts
│   ├── Button.tsx          # Componentes compartidos
│   ├── Card.tsx
│   └── ...
└── globals.css             # Estilos globales
```

---

## Guía de Contribución

### Creando Nuevos Componentes

1. **Documentación JSDoc**: Todos los componentes deben incluir documentación completa
2. **TypeScript**: Tipos explícitos para todas las props
3. **Accesibilidad**: ARIA labels y navegación por teclado
4. **Responsive**: Mobile-first design
5. **Animaciones**: Transiciones suaves y consistentes

### Ejemplo de Componente

```tsx
/**
 * Card Component
 *
 * Descripción del componente y sus casos de uso.
 *
 * @component
 * @example
 * ```tsx
 * <Card title="Título" description="Descripción">
 *   Contenido
 * </Card>
 * ```
 */

interface CardProps {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}

export const Card: React.FC<CardProps> = ({
  title,
  description,
  children,
  className = '',
}) => {
  return (
    <div className={`bg-white/5 border border-white/10 rounded-xl p-6 ${className}`}>
      {title && <h3 className="text-xl font-bold text-white mb-2">{title}</h3>}
      {description && <p className="text-gray-400 mb-4">{description}</p>}
      {children}
    </div>
  )
}
```

---

## Recursos Adicionales

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
- [Lucide Icons](https://lucide.dev/)
- [Next.js Documentation](https://nextjs.org/docs)

---

**Última actualización**: 2025-11-16
**Versión**: 1.0.0
