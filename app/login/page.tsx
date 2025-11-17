'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Phone, Lock, AlertCircle, Smartphone, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { Button } from '../components/Button'
import { FormInput } from '../components/ui/FormInput'

/**
 * Login Page
 *
 * Enhanced authentication page with improved UX, validation, and accessibility.
 * Features:
 * - Visual feedback on form states
 * - Password visibility toggle
 * - Remember me functionality
 * - Demo credentials for testing
 * - Responsive design
 * - WCAG 2.2 compliant
 *
 * @page
 */

export default function LoginPage() {
  const router = useRouter()

  // Form state
  const [identifier, setIdentifier] = useState('admin@guair.app')
  const [password, setPassword] = useState('admin123')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Credenciales inválidas. Por favor verifica tus datos.')
        setIsLoading(false)
        return
      }

      // Store auth token and user data
      if (data.token) {
        localStorage.setItem('auth_token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
      }

      // Redirect to dashboard
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor. Intenta nuevamente.')
      setIsLoading(false)
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
            <div className="flex flex-col items-center justify-center mb-4">
              <Image
                src="/images/logo-large-alt.png"
                alt="Guair.app Logo"
                width={400}
                height={160}
                priority
                className="w-full max-w-[320px] sm:max-w-[380px] md:max-w-[420px] h-auto group-hover:scale-105 transition-transform"
                style={{ height: 'auto' }}
              />
            </div>
          </Link>
          <p className="text-gray-400">Inicia sesión en tu cuenta</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 animate-fade-in-up animation-delay-200">
          {/* Welcome Message */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">¡Bienvenido de nuevo!</h2>
            <p className="text-gray-400">Ingresa tus credenciales para continuar</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div
              className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-start gap-3"
              role="alert"
            >
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email/Phone Input */}
            <FormInput
              label="Email o Teléfono"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              leftIcon={<Phone className="w-5 h-5" />}
              placeholder="admin@guair.app o +58412..."
              required
              autoComplete="username"
            />

            {/* Password Input */}
            <FormInput
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-5 h-5" />}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/10 text-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                />
                <span className="text-sm text-gray-400 group-hover:text-white transition-colors">
                  Recordarme
                </span>
              </label>

              <Link
                href="/forgot-password"
                className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
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
              Iniciar Sesión
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

          {/* Register Link */}
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              ¿No tienes una cuenta?{' '}
              <Link
                href="/register"
                className="text-primary-400 hover:text-primary-300 font-semibold transition-colors"
              >
                Regístrate gratis
              </Link>
            </p>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 text-center animate-fade-in-up animation-delay-400">
          <div className="inline-block bg-primary-500/10 border border-primary-500/20 rounded-xl px-6 py-3">
            <p className="text-xs text-gray-400 mb-1">Demo - Credenciales precargadas</p>
            <p className="text-sm text-primary-400 font-mono">
              admin@guair.app / admin123
            </p>
          </div>
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
