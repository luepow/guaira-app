'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, Phone, Lock, Mail, AlertCircle, Smartphone, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '../components/Button'
import { FormInput } from '../components/ui/FormInput'

/**
 * Register Page
 *
 * User registration page with validation and password strength indicator.
 * Features:
 * - Real-time validation
 * - Password strength meter
 * - Terms acceptance
 * - Responsive design
 * - Accessibility compliant
 *
 * @page
 */

export default function RegisterPage() {
  const router = useRouter()

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  // Password strength calculation
  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    let strength = 0
    if (password.length >= 8) strength++
    if (password.length >= 12) strength++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++

    const levels = [
      { strength: 0, label: 'Muy débil', color: 'bg-red-500' },
      { strength: 1, label: 'Débil', color: 'bg-orange-500' },
      { strength: 2, label: 'Regular', color: 'bg-yellow-500' },
      { strength: 3, label: 'Buena', color: 'bg-blue-500' },
      { strength: 4, label: 'Fuerte', color: 'bg-green-500' },
      { strength: 5, label: 'Muy fuerte', color: 'bg-green-600' },
    ]

    return levels[strength]
  }

  const passwordStrength = getPasswordStrength(formData.password)

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido'
    } else if (!/^\+?[1-9]\d{1,14}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Número de teléfono inválido'
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida'
    } else if (formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden'
    }

    if (!acceptTerms) {
      newErrors.terms = 'Debes aceptar los términos y condiciones'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Redirect to login with success message
        router.push('/login?registered=true')
      } else {
        setErrors({ submit: data.message || 'Error al registrar usuario' })
        setIsLoading(false)
      }
    } catch (err: any) {
      setErrors({ submit: err.message || 'Error al registrar usuario' })
      setIsLoading(false)
    }
  }

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: e.target.value })
    // Clear error for this field
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-secondary-900 to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-blob" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '4rem 4rem',
          }}
        />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo & Brand */}
        <div className="text-center mb-8 animate-fade-in-up">
          <Link href="/" className="inline-block group">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white">
                Guair<span className="text-primary-400">.app</span>
              </h1>
            </div>
          </Link>
          <p className="text-gray-400">Crea tu cuenta gratis</p>
        </div>

        {/* Register Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 animate-fade-in-up animation-delay-200">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">¡Únete a Guair.app!</h2>
            <p className="text-gray-400">Completa los datos para crear tu cuenta</p>
          </div>

          {/* Error Alert */}
          {errors.submit && (
            <div
              className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-start gap-3"
              role="alert"
            >
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-300">{errors.submit}</p>
            </div>
          )}

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Input */}
            <FormInput
              label="Nombre completo"
              type="text"
              value={formData.name}
              onChange={handleChange('name')}
              leftIcon={<User className="w-5 h-5" />}
              placeholder="Juan Pérez"
              error={errors.name}
              required
              autoComplete="name"
            />

            {/* Email Input */}
            <FormInput
              label="Correo electrónico"
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
              leftIcon={<Mail className="w-5 h-5" />}
              placeholder="tu@email.com"
              error={errors.email}
              required
              autoComplete="email"
            />

            {/* Phone Input */}
            <FormInput
              label="Número de teléfono"
              type="tel"
              value={formData.phone}
              onChange={handleChange('phone')}
              leftIcon={<Phone className="w-5 h-5" />}
              placeholder="+58412..."
              error={errors.phone}
              required
              autoComplete="tel"
            />

            {/* Password Input */}
            <div>
              <FormInput
                label="Contraseña"
                type="password"
                value={formData.password}
                onChange={handleChange('password')}
                leftIcon={<Lock className="w-5 h-5" />}
                placeholder="••••••••"
                error={errors.password}
                required
                autoComplete="new-password"
              />

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2 space-y-2">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4].map((index) => (
                      <div
                        key={index}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          index < passwordStrength.strength
                            ? passwordStrength.color
                            : 'bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-400">
                    Fortaleza: <span className="font-medium">{passwordStrength.label}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password Input */}
            <FormInput
              label="Confirmar contraseña"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange('confirmPassword')}
              leftIcon={<Lock className="w-5 h-5" />}
              placeholder="••••••••"
              error={errors.confirmPassword}
              required
              autoComplete="new-password"
            />

            {/* Terms Acceptance */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => {
                    setAcceptTerms(e.target.checked)
                    if (errors.terms) {
                      setErrors({ ...errors, terms: '' })
                    }
                  }}
                  className="mt-1 w-4 h-4 rounded border-white/20 bg-white/10 text-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                />
                <span className="text-sm text-gray-400 group-hover:text-white transition-colors">
                  Acepto los{' '}
                  <Link href="/terms" className="text-primary-400 hover:text-primary-300 underline">
                    términos y condiciones
                  </Link>{' '}
                  y la{' '}
                  <Link href="/privacy" className="text-primary-400 hover:text-primary-300 underline">
                    política de privacidad
                  </Link>
                </span>
              </label>
              {errors.terms && (
                <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.terms}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
              rightIcon={!isLoading ? <ArrowRight className="w-5 h-5" /> : undefined}
            >
              Crear cuenta
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gray-900/50 text-gray-400">o</span>
            </div>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              ¿Ya tienes una cuenta?{' '}
              <Link
                href="/login"
                className="text-primary-400 hover:text-primary-300 font-semibold transition-colors"
              >
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-6 grid grid-cols-3 gap-3 animate-fade-in-up animation-delay-400">
          {[
            { icon: '🎁', text: 'Gratis para siempre' },
            { icon: '🔒', text: '100% Seguro' },
            { icon: '⚡', text: 'Sin comisiones' },
          ].map((benefit, index) => (
            <div
              key={index}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-center"
            >
              <div className="text-2xl mb-1">{benefit.icon}</div>
              <div className="text-white text-xs">{benefit.text}</div>
            </div>
          ))}
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-white transition-colors inline-flex items-center gap-1"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
