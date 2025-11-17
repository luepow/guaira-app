'use client'

import React from 'react'
import { Star, Quote } from 'lucide-react'

/**
 * Testimonials Section Component
 *
 * Displays customer testimonials and reviews to build social proof.
 *
 * @component
 */

interface Testimonial {
  name: string
  role: string
  company: string
  avatar: string
  rating: number
  content: string
}

const testimonials: Testimonial[] = [
  {
    name: 'María González',
    role: 'Propietaria',
    company: 'Café del Centro',
    avatar: 'MG',
    rating: 5,
    content: 'Guair.app transformó completamente la forma en que recibimos pagos. Ahora nuestros clientes pueden pagar de forma rápida y segura, sin complicaciones.',
  },
  {
    name: 'Carlos Ramírez',
    role: 'Conductor',
    company: 'Usuario frecuente',
    avatar: 'CR',
    rating: 5,
    content: 'Ya no tengo que preocuparme por llevar efectivo para el parquímetro. Con Guair.app todo es más simple y recibo notificaciones cuando mi tiempo está por vencer.',
  },
  {
    name: 'Ana Martínez',
    role: 'Gerente',
    company: 'Restaurant El Buen Sabor',
    avatar: 'AM',
    rating: 5,
    content: 'La integración con nuestro sistema POS fue muy sencilla. El soporte técnico es excelente y los reportes nos ayudan a tomar mejores decisiones.',
  },
  {
    name: 'Jorge Fernández',
    role: 'Freelancer',
    company: 'Diseñador independiente',
    avatar: 'JF',
    rating: 5,
    content: 'Como freelancer necesito flexibilidad en los pagos. Guair.app me permite recibir y hacer pagos desde cualquier lugar, con total seguridad.',
  },
  {
    name: 'Laura Sánchez',
    role: 'Dueña',
    company: 'Boutique Fashion',
    avatar: 'LS',
    rating: 5,
    content: 'Las comisiones son justas y el servicio es confiable. Mis clientes adoran lo fácil que es pagar con su celular.',
  },
  {
    name: 'Roberto Torres',
    role: 'Comerciante',
    company: 'Mercado Local',
    avatar: 'RT',
    rating: 5,
    content: 'Implementar Guair.app fue la mejor decisión para mi negocio. Aumentaron mis ventas porque ahora acepto más formas de pago.',
  },
]

export const Testimonials: React.FC = () => {
  return (
    <section className="relative py-24 bg-gray-900 overflow-hidden">
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm font-medium">
            <Star className="w-4 h-4 fill-current" />
            <span>Testimonios</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Lo que dicen nuestros{' '}
            <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              usuarios
            </span>
          </h2>

          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Miles de negocios y usuarios confían en Guair.app para sus pagos digitales.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Quote Icon */}
              <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Quote className="w-16 h-16 text-primary-400" fill="currentColor" />
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 text-yellow-400 fill-current"
                  />
                ))}
              </div>

              {/* Content */}
              <p className="text-gray-300 leading-relaxed mb-6 relative z-10">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                  {testimonial.avatar}
                </div>

                {/* Info */}
                <div>
                  <div className="text-white font-semibold">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-400">
                    {testimonial.role} • {testimonial.company}
                  </div>
                </div>
              </div>

              {/* Hover Border */}
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary-500/20 rounded-2xl transition-colors pointer-events-none" />
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: '10,000+', label: 'Usuarios activos' },
            { value: '5,000+', label: 'Comercios' },
            { value: '99.9%', label: 'Satisfacción' },
            { value: '24/7', label: 'Soporte' },
          ].map((stat, index) => (
            <div
              key={index}
              className="text-center p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl"
            >
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-gray-400 text-sm">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
