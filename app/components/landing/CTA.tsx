'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight, Smartphone } from 'lucide-react'
import { Button } from '../Button'

/**
 * CTA (Call To Action) Section Component
 *
 * Final call to action section to convert visitors into users.
 *
 * @component
 */

export const CTA: React.FC = () => {
  return (
    <section className="relative py-24 bg-gradient-to-br from-primary-600 via-primary-500 to-accent-500 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animated Gradient Orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-blob" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-blob animation-delay-2000" />

        {/* Pattern Overlay */}
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

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-8">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-2xl animate-float">
              <Smartphone className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white">
              ¿Listo para simplificar tus pagos?
            </h2>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
              Únete a miles de usuarios que ya confían en Guair.app para sus transacciones diarias.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Link href="/login">
              <Button
                size="lg"
                variant="secondary"
                rightIcon={<ArrowRight className="w-5 h-5" />}
                className="w-full sm:w-auto bg-white text-primary-600 hover:bg-gray-100 shadow-xl hover:shadow-2xl border-0"
              >
                Comenzar ahora gratis
              </Button>
            </Link>

            <Link href="#features">
              <Button
                size="lg"
                variant="secondary"
                className="w-full sm:w-auto bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 border-white/20"
              >
                Ver demostración
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="pt-8 flex flex-wrap justify-center gap-8 text-white/80">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full" />
              <span className="text-sm">Sin tarjeta de crédito requerida</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full" />
              <span className="text-sm">Prueba gratis por 30 días</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full" />
              <span className="text-sm">Cancela cuando quieras</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
