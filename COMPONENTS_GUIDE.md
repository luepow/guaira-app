# Guía de Componentes - Guair.app

## Tabla de Contenidos

- [Introducción](#introducción)
- [Componentes UI Base](#componentes-ui-base)
- [Componentes de Landing](#componentes-de-landing)
- [Páginas de Autenticación](#páginas-de-autenticación)
- [Ejemplos de Uso](#ejemplos-de-uso)

---

## Introducción

Esta guía proporciona una referencia completa de todos los componentes disponibles en Guair.app, incluyendo ejemplos de código y mejores prácticas.

---

## Componentes UI Base

### Button

Componente de botón versátil con múltiples variantes, tamaños y estados.

**Ubicación:** `/app/components/Button.tsx`

**Props:**
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}
```

**Ejemplos:**

```tsx
import { Button } from '@/components/Button'
import { ArrowRight, Save } from 'lucide-react'

// Botón primario básico
<Button variant="primary">
  Click me
</Button>

// Botón con icono
<Button
  variant="primary"
  rightIcon={<ArrowRight className="w-5 h-5" />}
>
  Continuar
</Button>

// Botón con estado de carga
<Button variant="primary" isLoading>
  Guardando...
</Button>

// Botón de diferentes tamaños
<Button size="sm">Pequeño</Button>
<Button size="md">Mediano</Button>
<Button size="lg">Grande</Button>
```

---

### FormInput

Input de formulario con validación, iconos y estados visuales.

**Ubicación:** `/app/components/ui/FormInput.tsx`

**Props:**
```typescript
interface FormInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'filled' | 'outlined'
}
```

**Ejemplos:**

```tsx
import { FormInput } from '@/components/ui/FormInput'
import { Mail, Lock, User } from 'lucide-react'

// Input básico con label
<FormInput
  label="Email"
  type="email"
  placeholder="tu@email.com"
  required
/>

// Input con icono
<FormInput
  label="Email"
  type="email"
  leftIcon={<Mail className="w-5 h-5" />}
  placeholder="tu@email.com"
/>

// Input con error
<FormInput
  label="Contraseña"
  type="password"
  leftIcon={<Lock className="w-5 h-5" />}
  error="La contraseña debe tener al menos 8 caracteres"
/>

// Input con texto de ayuda
<FormInput
  label="Nombre de usuario"
  helperText="Este será tu identificador único"
  leftIcon={<User className="w-5 h-5" />}
/>

// Password input (con toggle automático)
<FormInput
  label="Contraseña"
  type="password"
  leftIcon={<Lock className="w-5 h-5" />}
/>
```

---

### FormTextarea

Área de texto con las mismas características que FormInput.

**Ubicación:** `/app/components/ui/FormInput.tsx`

**Ejemplos:**

```tsx
import { FormTextarea } from '@/components/ui/FormInput'

<FormTextarea
  label="Descripción"
  placeholder="Escribe una descripción..."
  rows={4}
  helperText="Máximo 500 caracteres"
/>
```

---

### Dialog

Modal/Dialog con backdrop, animaciones y accesibilidad.

**Ubicación:** `/app/components/ui/Dialog.tsx`

**Props:**
```typescript
interface DialogProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
  closeOnBackdrop?: boolean
  closeOnEscape?: boolean
  footer?: React.ReactNode
}
```

**Ejemplos:**

```tsx
import { Dialog, ConfirmDialog } from '@/components/ui/Dialog'
import { Button } from '@/components/Button'

// Dialog básico
const [isOpen, setIsOpen] = useState(false)

<Dialog
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Detalles del Usuario"
  description="Información completa del usuario"
>
  <div className="space-y-4">
    <p>Contenido del dialog...</p>
  </div>
</Dialog>

// Dialog con footer personalizado
<Dialog
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Editar Perfil"
  footer={
    <>
      <Button variant="secondary" onClick={() => setIsOpen(false)}>
        Cancelar
      </Button>
      <Button variant="primary" onClick={handleSave}>
        Guardar
      </Button>
    </>
  }
>
  {/* Formulario */}
</Dialog>

// Confirm Dialog
<ConfirmDialog
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onConfirm={handleDelete}
  title="Eliminar Usuario"
  message="¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer."
  confirmText="Eliminar"
  cancelText="Cancelar"
  confirmVariant="danger"
  isLoading={isDeleting}
/>
```

---

### Toast

Sistema de notificaciones toast con múltiples tipos y auto-dismiss.

**Ubicación:** `/app/components/ui/Toast.tsx`

**Setup:**
```tsx
// En tu layout o app root
import { ToastProvider } from '@/components/ui/Toast'

export default function Layout({ children }) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  )
}
```

**Uso:**
```tsx
import { useToast } from '@/components/ui/Toast'

function MyComponent() {
  const { showToast } = useToast()

  const handleSuccess = () => {
    showToast({
      type: 'success',
      message: 'Operación exitosa',
      description: 'Los cambios se guardaron correctamente',
      duration: 3000
    })
  }

  const handleError = () => {
    showToast({
      type: 'error',
      message: 'Error al guardar',
      description: 'Por favor intenta nuevamente',
      duration: 5000
    })
  }

  const handleWarning = () => {
    showToast({
      type: 'warning',
      message: 'Advertencia',
      description: 'Esta acción requiere confirmación'
    })
  }

  const handleInfo = () => {
    showToast({
      type: 'info',
      message: 'Nueva actualización disponible',
      duration: 0 // No auto-dismiss
    })
  }
}
```

---

## Componentes de Landing

### Hero

Sección hero de la landing page con CTA y animaciones.

**Ubicación:** `/app/components/landing/Hero.tsx`

**Características:**
- Gradientes animados de fondo
- Mockup de app móvil
- CTAs destacados
- Trust indicators
- Responsive design

**Uso:**
```tsx
import { Hero } from '@/components/landing'

<Hero />
```

---

### Features

Sección de características con grid de features cards.

**Ubicación:** `/app/components/landing/Features.tsx`

**Características:**
- Grid responsive
- Iconos con gradientes
- Animaciones escalonadas
- Hover effects

**Uso:**
```tsx
import { Features } from '@/components/landing'

<Features />
```

---

### Security

Sección de seguridad con animaciones orbitales.

**Ubicación:** `/app/components/landing/Security.tsx`

**Características:**
- Animación orbital de iconos
- Lista de features de seguridad
- Trust badges
- Stats cards flotantes

**Uso:**
```tsx
import { Security } from '@/components/landing'

<Security />
```

---

### Testimonials

Sección de testimonios con grid de cards.

**Ubicación:** `/app/components/landing/Testimonials.tsx`

**Características:**
- Grid de testimonios
- Rating stars
- Stats de usuarios
- Avatar con iniciales

**Uso:**
```tsx
import { Testimonials } from '@/components/landing'

<Testimonials />
```

---

### Pricing

Sección de planes y precios.

**Ubicación:** `/app/components/landing/Pricing.tsx`

**Características:**
- Grid de pricing cards
- Plan destacado
- Lista de features
- CTAs por plan

**Uso:**
```tsx
import { Pricing } from '@/components/landing'

<Pricing />
```

---

### CTA

Sección de call-to-action final.

**Ubicación:** `/app/components/landing/CTA.tsx`

**Características:**
- Gradiente de fondo
- Múltiples CTAs
- Trust indicators

**Uso:**
```tsx
import { CTA } from '@/components/landing'

<CTA />
```

---

### Footer

Footer completo con links y social media.

**Ubicación:** `/app/components/landing/Footer.tsx`

**Características:**
- Grid de links
- Información de contacto
- Social media links
- Newsletter signup
- Certifications

**Uso:**
```tsx
import { Footer } from '@/components/landing'

<Footer />
```

---

## Páginas de Autenticación

### Login Page

Página de inicio de sesión mejorada.

**Ubicación:** `/app/login/page.tsx`

**Características:**
- FormInput components
- Validación en tiempo real
- Password toggle
- Remember me
- Link a forgot password
- Demo credentials display

---

### Register Page

Página de registro con validación completa.

**Ubicación:** `/app/register/page.tsx`

**Características:**
- Validación de formulario
- Password strength meter
- Confirm password
- Terms acceptance
- Error handling

---

### Forgot Password Page

Página de recuperación de contraseña.

**Ubicación:** `/app/forgot-password/page.tsx`

**Características:**
- Email/phone input
- Success confirmation
- Error handling
- Link back to login

---

## Ejemplos de Uso

### Formulario Completo

```tsx
'use client'

import { useState } from 'react'
import { FormInput } from '@/components/ui/FormInput'
import { Button } from '@/components/Button'
import { useToast } from '@/components/ui/Toast'
import { Mail, Lock, User } from 'lucide-react'

export default function CompleteForm() {
  const { showToast } = useToast()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // API call
      await api.submit(formData)

      showToast({
        type: 'success',
        message: 'Formulario enviado',
        description: 'Los datos se guardaron correctamente'
      })
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Error al enviar',
        description: error.message
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FormInput
        label="Nombre"
        type="text"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        leftIcon={<User className="w-5 h-5" />}
        error={errors.name}
        required
      />

      <FormInput
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        leftIcon={<Mail className="w-5 h-5" />}
        error={errors.email}
        required
      />

      <FormInput
        label="Contraseña"
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        leftIcon={<Lock className="w-5 h-5" />}
        error={errors.password}
        helperText="Mínimo 8 caracteres"
        required
      />

      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isLoading}
        className="w-full"
      >
        Enviar
      </Button>
    </form>
  )
}
```

### Dialog con Formulario

```tsx
'use client'

import { useState } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { FormInput } from '@/components/ui/FormInput'
import { Button } from '@/components/Button'

export default function EditDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')

  const handleSave = async () => {
    // Save logic
    setIsOpen(false)
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Abrir Dialog
      </Button>

      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Editar Información"
        description="Actualiza los datos del usuario"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSave}>
              Guardar Cambios
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormInput
            label="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      </Dialog>
    </>
  )
}
```

### Landing Page Completa

```tsx
import {
  Hero,
  Features,
  Security,
  Testimonials,
  Pricing,
  CTA,
  Footer
} from '@/components/landing'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gray-900">
      <Hero />
      <Features />
      <Security />
      <Testimonials />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  )
}
```

---

## Mejores Prácticas

### 1. Siempre usa TypeScript

```tsx
// ✅ Correcto
interface MyComponentProps {
  title: string
  description?: string
}

const MyComponent: React.FC<MyComponentProps> = ({ title, description }) => {
  // ...
}

// ❌ Incorrecto
const MyComponent = ({ title, description }) => {
  // ...
}
```

### 2. Manejo de Errores

```tsx
// ✅ Correcto
<FormInput
  label="Email"
  error={errors.email}
  helperText="Formato: usuario@dominio.com"
/>

// ❌ Incorrecto
<FormInput
  label="Email"
  // Sin manejo de errores
/>
```

### 3. Loading States

```tsx
// ✅ Correcto
<Button isLoading={isSubmitting}>
  Guardar
</Button>

// ❌ Incorrecto
<Button disabled={isSubmitting}>
  {isSubmitting ? 'Guardando...' : 'Guardar'}
</Button>
```

### 4. Accesibilidad

```tsx
// ✅ Correcto
<button aria-label="Cerrar modal">
  <X className="w-5 h-5" />
</button>

// ❌ Incorrecto
<button>
  <X className="w-5 h-5" />
</button>
```

### 5. Responsive Design

```tsx
// ✅ Correcto
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// ❌ Incorrecto
<div className="grid grid-cols-3 gap-6">
```

---

**Última actualización**: 2025-11-16
**Versión**: 1.0.0
