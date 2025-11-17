'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowRight, Smartphone, CheckCircle2, ArrowLeft } from 'lucide-react'
import { Button } from '../components/Button'
import { FormInput } from '../components/ui/FormInput'

/**
 * Forgot Password Page
 *
 * Password recovery page with email/phone verification.
 * Features:
 * - Email or phone input
 * - Success confirmation
 * - Clear instructions
 * - Accessibility compliant
 *
 * @page
 */

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setIsSuccess(true)
      } else {
        setError(data.message || 'Error al enviar el correo de recuperación')
      }
    } catch (err: any) {
      setError(err.message || 'Error al enviar el correo de recuperación')
    } finally {
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
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white">
                Guair<span className="text-primary-400">.app</span>
              </h1>
            </div>
          </Link>
          <p className="text-gray-400">Recupera tu contraseña</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 animate-fade-in-up animation-delay-200">
          {!isSuccess ? (
            <>
              {/* Header */}
              <div className="mb-6 text-center">
                <div className="w-16 h-16 bg-primary-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-primary-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">¿Olvidaste tu contraseña?</h2>
                <p className="text-gray-400">
                  No te preocupes, te enviaremos instrucciones para recuperarla.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <FormInput
                  label="Correo electrónico o teléfono"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="w-5 h-5" />}
                  placeholder="tu@email.com o +58412..."
                  error={error}
                  helperText="Ingresa el email o teléfono asociado a tu cuenta"
                  required
                  autoComplete="email"
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  isLoading={isLoading}
                  rightIcon={!isLoading ? <ArrowRight className="w-5 h-5" /> : undefined}
                >
                  Enviar instrucciones
                </Button>
              </form>

              {/* Back to Login */}
              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="text-sm text-gray-400 hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver al inicio de sesión
                </Link>
              </div>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10 text-green-400" />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">¡Correo enviado!</h2>
                  <p className="text-gray-400">
                    Hemos enviado las instrucciones de recuperación a <strong className="text-white">{email}</strong>
                  </p>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <p className="text-sm text-blue-300">
                    <strong>Nota:</strong> Si no recibes el correo en los próximos minutos, revisa tu carpeta de spam.
                  </p>
                </div>

                <div className="space-y-3">
                  <Link href="/login" className="block">
                    <Button variant="primary" size="lg" className="w-full">
                      Volver al inicio de sesión
                    </Button>
                  </Link>

                  <button
                    onClick={() => {
                      setIsSuccess(false)
                      setEmail('')
                    }}
                    className="w-full text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Intentar con otro correo
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-gray-400 animate-fade-in-up animation-delay-400">
          <p>
            ¿Necesitas ayuda?{' '}
            <a href="mailto:soporte@guair.app" className="text-primary-400 hover:text-primary-300 underline">
              Contáctanos
            </a>
          </p>
        </div>

        {/* Back to Home */}
        <div className="mt-4 text-center">
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
