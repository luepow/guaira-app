'use client'

import React from 'react'
import {
  Smartphone,
  Shield,
  Zap,
  CreditCard,
  BarChart3,
  Lock,
  Clock,
  Wallet,
  TrendingUp,
  Users,
  Globe,
  Bell,
} from 'lucide-react'

/**
 * Features Section Component
 *
 * Showcases the main features and benefits of Guair.app
 * with icons, descriptions, and visual hierarchy.
 *
 * @component
 */

interface Feature {
  icon: React.ElementType
  title: string
  description: string
  color: string
}

const mainFeatures: Feature[] = [
  {
    icon: Smartphone,
    title: 'App Móvil Intuitiva',
    description: 'Interfaz moderna y fácil de usar. Disponible para iOS y Android.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Shield,
    title: 'Máxima Seguridad',
    description: 'Certificación PCI DSS. Tus datos protegidos con encriptación de última generación.',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: Zap,
    title: 'Pagos Instantáneos',
    description: 'Transacciones procesadas en segundos. Sin demoras ni complicaciones.',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    icon: CreditCard,
    title: 'Múltiples Métodos de Pago',
    description: 'Acepta tarjetas, transferencias bancarias y más opciones de pago.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: BarChart3,
    title: 'Reportes Detallados',
    description: 'Analiza tus gastos e ingresos con reportes completos y visualizaciones.',
    color: 'from-indigo-500 to-blue-500',
  },
  {
    icon: Lock,
    title: 'Control Total',
    description: 'Tú decides quién puede acceder a tu cuenta con autenticación multifactor.',
    color: 'from-red-500 to-rose-500',
  },
]

const additionalFeatures = [
  {
    icon: Clock,
    title: 'Disponibilidad 24/7',
    description: 'Realiza pagos en cualquier momento del día, todos los días del año.',
  },
  {
    icon: Wallet,
    title: 'Billetera Virtual',
    description: 'Guarda tu dinero de forma segura y accede a él cuando lo necesites.',
  },
  {
    icon: TrendingUp,
    title: 'Cashback y Recompensas',
    description: 'Gana puntos y beneficios exclusivos en cada transacción.',
  },
  {
    icon: Users,
    title: 'Soporte Dedicado',
    description: 'Equipo de atención al cliente listo para ayudarte cuando lo necesites.',
  },
  {
    icon: Globe,
    title: 'Pagos Internacionales',
    description: 'Realiza transacciones en múltiples monedas sin complicaciones.',
  },
  {
    icon: Bell,
    title: 'Notificaciones en Tiempo Real',
    description: 'Recibe alertas instantáneas de todas tus transacciones.',
  },
]

export const Features: React.FC = () => {
  return (
    <section id="features" className="relative py-24 bg-gray-900 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm font-medium">
            <Zap className="w-4 h-4" />
            <span>Características</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Todo lo que necesitas en una{' '}
            <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
              sola app
            </span>
          </h2>

          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Guair.app combina tecnología de punta con simplicidad para ofrecerte la mejor experiencia
            en pagos digitales.
          </p>
        </div>

        {/* Main Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {mainFeatures.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Icon with Gradient Background */}
              <div className="relative mb-6">
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-20 blur-xl rounded-full group-hover:opacity-30 transition-opacity`}
                />
                <div
                  className={`relative w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center shadow-lg`}
                >
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-400 leading-relaxed">
                {feature.description}
              </p>

              {/* Hover Effect Border */}
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-white/20 rounded-2xl transition-colors pointer-events-none" />
            </div>
          ))}
        </div>

        {/* Additional Features List */}
        <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border border-white/10 rounded-3xl p-8 md:p-12">
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-8 text-center">
            Y mucho más...
          </h3>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {additionalFeatures.map((feature, index) => (
              <div
                key={index}
                className="flex items-start gap-4 group"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center group-hover:bg-primary-500/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary-400" />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">
                    {feature.title}
                  </h4>
                  <p className="text-sm text-gray-400">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
