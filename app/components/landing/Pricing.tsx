'use client'

import React from 'react'
import { Check, Zap } from 'lucide-react'
import { Button } from '../Button'
import Link from 'next/link'

/**
 * Pricing Section Component
 *
 * Displays pricing plans with features comparison.
 *
 * @component
 */

interface PricingPlan {
  name: string
  description: string
  price: string
  period: string
  features: string[]
  highlighted?: boolean
  cta: string
}

const plans: PricingPlan[] = [
  {
    name: 'Personal',
    description: 'Perfecto para usuarios individuales',
    price: 'Gratis',
    period: 'siempre',
    features: [
      'Hasta 10 transacciones/mes',
      'Billetera digital',
      'Pagos en parquímetros',
      'Notificaciones básicas',
      'Soporte por email',
    ],
    cta: 'Comenzar gratis',
  },
  {
    name: 'Negocios',
    description: 'Para pequeños y medianos negocios',
    price: '$29',
    period: 'al mes',
    features: [
      'Transacciones ilimitadas',
      'Sistema POS integrado',
      'Reportes avanzados',
      'API de integración',
      'Soporte prioritario 24/7',
      'Multiple usuarios',
      'Facturación automática',
    ],
    highlighted: true,
    cta: 'Iniciar prueba gratuita',
  },
  {
    name: 'Enterprise',
    description: 'Soluciones personalizadas',
    price: 'Contactar',
    period: 'personalizado',
    features: [
      'Todo de Negocios',
      'SLA garantizado',
      'Gerente de cuenta dedicado',
      'Integración personalizada',
      'Capacitación del equipo',
      'Seguridad avanzada',
      'Infraestructura dedicada',
    ],
    cta: 'Contactar ventas',
  },
]

export const Pricing: React.FC = () => {
  return (
    <section className="relative py-24 bg-gradient-to-b from-secondary-900 to-gray-900 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm font-medium">
            <Zap className="w-4 h-4" />
            <span>Planes y Precios</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Elige el plan perfecto{' '}
            <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
              para ti
            </span>
          </h2>

          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Sin costos ocultos. Sin sorpresas. Cancela cuando quieras.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`
                relative rounded-2xl p-8
                ${
                  plan.highlighted
                    ? 'bg-gradient-to-br from-primary-500/20 to-accent-500/20 border-2 border-primary-500/50 shadow-2xl scale-105'
                    : 'bg-white/5 border border-white/10'
                }
                backdrop-blur-sm
                hover:scale-105 transition-all duration-300
                animate-fade-in-up
              `}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Popular Badge */}
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full text-white text-sm font-semibold shadow-lg">
                  Más popular
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-400 text-sm">
                  {plan.description}
                </p>
              </div>

              {/* Pricing */}
              <div className="text-center mb-8 pb-8 border-b border-white/10">
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-bold text-white">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-gray-400">
                      {plan.period}
                    </span>
                  )}
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 bg-primary-500/20 rounded-full flex items-center justify-center mt-0.5">
                      <Check className="w-3 h-3 text-primary-400" />
                    </div>
                    <span className="text-gray-300 text-sm">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Link href="/login" className="block">
                <Button
                  variant={plan.highlighted ? 'primary' : 'secondary'}
                  size="lg"
                  className="w-full"
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <p className="text-gray-400">
            ¿Necesitas un plan personalizado?{' '}
            <a
              href="mailto:ventas@guair.app"
              className="text-primary-400 hover:text-primary-300 underline"
            >
              Contáctanos
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}
