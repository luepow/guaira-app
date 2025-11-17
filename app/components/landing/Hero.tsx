'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight, Smartphone, CreditCard, Shield, Zap } from 'lucide-react'
import { Button } from '../Button'

/**
 * Hero Section Component
 *
 * Main landing page hero section with compelling value proposition,
 * CTAs, and animated visual elements.
 *
 * @component
 */

export const Hero: React.FC = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-gray-900 via-gray-900 to-secondary-900">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-secondary-500/20 rounded-full blur-3xl animate-blob animation-delay-4000" />

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '4rem 4rem',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left space-y-8 animate-fade-in-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm font-medium">
              <Zap className="w-4 h-4" />
              <span>Pagos digitales simplificados</span>
            </div>

            {/* Heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight">
              <span className="text-white">Tu billetera digital</span>
              <br />
              <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
                sin límites
              </span>
            </h1>

            {/* Description */}
            <p className="text-xl text-gray-300 max-w-2xl">
              Paga parquímetros, servicios y comercios con Guair.app. Rápido, seguro y fácil de usar.
              Tu dinero siempre disponible, donde y cuando lo necesites.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/login">
                <Button
                  size="lg"
                  variant="primary"
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                  className="w-full sm:w-auto"
                >
                  Comenzar ahora
                </Button>
              </Link>

              <Link href="#features">
                <Button
                  size="lg"
                  variant="secondary"
                  className="w-full sm:w-auto"
                >
                  Ver características
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap gap-8 justify-center lg:justify-start pt-8 border-t border-white/10">
              <div className="flex items-center gap-2 text-gray-400">
                <Shield className="w-5 h-5 text-primary-400" />
                <span className="text-sm">Seguridad PCI DSS</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <CreditCard className="w-5 h-5 text-primary-400" />
                <span className="text-sm">Pagos encriptados</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Smartphone className="w-5 h-5 text-primary-400" />
                <span className="text-sm">App móvil disponible</span>
              </div>
            </div>
          </div>

          {/* Visual / Mockup */}
          <div className="relative lg:block animate-fade-in-up animation-delay-200">
            {/* Phone Mockup */}
            <div className="relative mx-auto w-full max-w-sm">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-accent-500 rounded-3xl blur-3xl opacity-30 animate-pulse-slow" />

              {/* Phone Frame */}
              <div className="relative bg-gray-800 rounded-3xl p-4 shadow-2xl border border-white/10">
                {/* Screen */}
                <div className="bg-gradient-to-br from-gray-900 to-secondary-900 rounded-2xl overflow-hidden aspect-[9/19]">
                  {/* Status Bar */}
                  <div className="flex items-center justify-between px-6 py-3 text-xs text-gray-400">
                    <span>9:41</span>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-3 bg-white/20 rounded-sm" />
                      <div className="w-4 h-3 bg-white/20 rounded-sm" />
                      <div className="w-4 h-3 bg-white/40 rounded-sm" />
                    </div>
                  </div>

                  {/* App Content */}
                  <div className="px-6 py-4 space-y-6">
                    {/* Balance Card */}
                    <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 shadow-xl">
                      <div className="text-white/80 text-sm mb-2">Balance disponible</div>
                      <div className="text-white text-3xl font-bold">$1,234.56</div>
                      <div className="flex gap-2 mt-4">
                        <div className="flex-1 bg-white/20 backdrop-blur-sm rounded-lg py-2 px-3 text-center text-white text-xs font-medium">
                          Recargar
                        </div>
                        <div className="flex-1 bg-white/20 backdrop-blur-sm rounded-lg py-2 px-3 text-center text-white text-xs font-medium">
                          Enviar
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { icon: '🅿️', label: 'Parquímetro' },
                        { icon: '💳', label: 'Pagar' },
                        { icon: '📊', label: 'Historial' },
                      ].map((action, index) => (
                        <div
                          key={index}
                          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center"
                        >
                          <div className="text-2xl mb-1">{action.icon}</div>
                          <div className="text-white text-xs">{action.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Recent Transactions */}
                    <div className="space-y-3">
                      <div className="text-white text-sm font-medium">Reciente</div>
                      {[1, 2, 3].map((_, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3"
                        >
                          <div className="w-8 h-8 bg-primary-500/20 rounded-full flex items-center justify-center text-primary-400 text-xs">
                            P
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-sm">Parquímetro #{1000 + index}</div>
                            <div className="text-gray-400 text-xs">Hace {index + 1}h</div>
                          </div>
                          <div className="text-white text-sm font-medium">-${(index + 1) * 5}.00</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Home Indicator */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/20 rounded-full" />
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute top-10 -right-10 bg-green-500/10 backdrop-blur-sm border border-green-500/20 rounded-2xl p-4 shadow-xl animate-float">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <div className="text-white text-sm font-medium">100% Seguro</div>
                  <div className="text-gray-400 text-xs">PCI DSS Certified</div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-10 -left-10 bg-blue-500/10 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-4 shadow-xl animate-float animation-delay-2000">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Zap className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-white text-sm font-medium">Pagos instantáneos</div>
                  <div className="text-gray-400 text-xs">En menos de 2 segundos</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce-slow">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-white/50 rounded-full" />
        </div>
      </div>
    </section>
  )
}
