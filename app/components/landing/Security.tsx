'use client'

import React from 'react'
import { Shield, Lock, Eye, FileCheck, Server, AlertTriangle } from 'lucide-react'

/**
 * Security Section Component
 *
 * Highlights security features and compliance certifications
 * to build trust with potential users.
 *
 * @component
 */

const securityFeatures = [
  {
    icon: Shield,
    title: 'Certificación PCI DSS',
    description: 'Cumplimos con los estándares más altos de seguridad para el manejo de información de tarjetas de pago.',
  },
  {
    icon: Lock,
    title: 'Encriptación End-to-End',
    description: 'Todos tus datos están protegidos con encriptación AES-256 desde el origen hasta el destino.',
  },
  {
    icon: Eye,
    title: 'Autenticación Multifactor',
    description: 'Protección adicional con verificación en dos pasos para todas tus transacciones importantes.',
  },
  {
    icon: FileCheck,
    title: 'Auditorías Regulares',
    description: 'Nuestros sistemas son auditados constantemente por expertos en seguridad independientes.',
  },
  {
    icon: Server,
    title: 'Infraestructura Segura',
    description: 'Servidores redundantes en centros de datos certificados con disponibilidad del 99.9%.',
  },
  {
    icon: AlertTriangle,
    title: 'Detección de Fraude',
    description: 'Sistema inteligente que detecta y previene actividades sospechosas en tiempo real.',
  },
]

export const Security: React.FC = () => {
  return (
    <section className="relative py-24 bg-gradient-to-b from-gray-900 to-secondary-900 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium">
            <Shield className="w-4 h-4" />
            <span>Seguridad</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Tu dinero,{' '}
            <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              100% protegido
            </span>
          </h2>

          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            La seguridad de tus datos y transacciones es nuestra prioridad número uno.
            Utilizamos las tecnologías más avanzadas para proteger tu información.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Visual Side */}
          <div className="relative">
            {/* Central Shield */}
            <div className="relative mx-auto w-80 h-80">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full blur-3xl opacity-20 animate-pulse-slow" />

              {/* Shield Container */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-64 h-64 bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-500/30 rounded-full flex items-center justify-center shadow-2xl">
                  <Shield className="w-32 h-32 text-green-400" strokeWidth={1.5} />
                </div>
              </div>

              {/* Orbiting Icons */}
              <div className="absolute inset-0 animate-spin-slow" style={{ animationDuration: '20s' }}>
                {[Lock, Eye, FileCheck, Server, AlertTriangle, Shield].map((Icon, index) => {
                  const angle = (index * 60) * (Math.PI / 180)
                  const radius = 150
                  const x = Math.cos(angle) * radius
                  const y = Math.sin(angle) * radius

                  return (
                    <div
                      key={index}
                      className="absolute top-1/2 left-1/2 w-12 h-12 -ml-6 -mt-6"
                      style={{
                        transform: `translate(${x}px, ${y}px)`,
                      }}
                    >
                      <div className="w-12 h-12 bg-gray-800/80 backdrop-blur-sm border border-white/10 rounded-xl flex items-center justify-center shadow-lg animate-spin-reverse"
                        style={{ animationDuration: '20s' }}
                      >
                        <Icon className="w-6 h-6 text-primary-400" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="absolute top-0 left-0 bg-green-500/10 backdrop-blur-sm border border-green-500/20 rounded-2xl p-4 shadow-xl animate-float">
              <div className="text-green-400 text-3xl font-bold">99.9%</div>
              <div className="text-gray-300 text-sm">Uptime</div>
            </div>

            <div className="absolute bottom-0 right-0 bg-blue-500/10 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-4 shadow-xl animate-float animation-delay-2000">
              <div className="text-blue-400 text-3xl font-bold">256-bit</div>
              <div className="text-gray-300 text-sm">Encriptación</div>
            </div>
          </div>

          {/* Features List */}
          <div className="space-y-6">
            {securityFeatures.map((feature, index) => (
              <div
                key={index}
                className="group flex items-start gap-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-16 pt-16 border-t border-white/10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center opacity-50">
            {['PCI DSS', 'ISO 27001', 'GDPR', 'SOC 2'].map((badge, index) => (
              <div key={index} className="text-center">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-3 mx-auto">
                  <Shield className="w-10 h-10 text-gray-400" />
                </div>
                <div className="text-gray-400 text-sm font-medium">{badge}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
