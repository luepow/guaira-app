'use client'

import React from 'react'
import Link from 'next/link'
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  MapPin,
  Smartphone,
} from 'lucide-react'

/**
 * Footer Component
 *
 * Complete footer with links, social media, contact info, and legal pages.
 *
 * @component
 */

const footerLinks = {
  product: {
    title: 'Producto',
    links: [
      { label: 'Características', href: '#features' },
      { label: 'Seguridad', href: '#security' },
      { label: 'Precios', href: '#pricing' },
      { label: 'API', href: '/api-docs' },
      { label: 'Integraciones', href: '/integrations' },
    ],
  },
  company: {
    title: 'Compañía',
    links: [
      { label: 'Nosotros', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Blog', href: '/blog' },
      { label: 'Prensa', href: '/press' },
      { label: 'Contacto', href: '/contact' },
    ],
  },
  resources: {
    title: 'Recursos',
    links: [
      { label: 'Centro de ayuda', href: '/help' },
      { label: 'Documentación', href: '/docs' },
      { label: 'Tutoriales', href: '/tutorials' },
      { label: 'Comunidad', href: '/community' },
      { label: 'Estado del servicio', href: '/status' },
    ],
  },
  legal: {
    title: 'Legal',
    links: [
      { label: 'Términos de servicio', href: '/terms' },
      { label: 'Política de privacidad', href: '/privacy' },
      { label: 'Política de cookies', href: '/cookies' },
      { label: 'Cumplimiento PCI DSS', href: '/compliance' },
      { label: 'Licencias', href: '/licenses' },
    ],
  },
}

const socialLinks = [
  { icon: Facebook, href: 'https://facebook.com/guairapp', label: 'Facebook' },
  { icon: Twitter, href: 'https://twitter.com/guairapp', label: 'Twitter' },
  { icon: Instagram, href: 'https://instagram.com/guairapp', label: 'Instagram' },
  { icon: Linkedin, href: 'https://linkedin.com/company/guairapp', label: 'LinkedIn' },
]

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative bg-secondary-900 border-t border-white/10">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">Guair.app</span>
            </div>

            <p className="text-gray-400 mb-6 max-w-sm">
              La forma más simple y segura de realizar pagos digitales.
              Tu billetera virtual, siempre contigo.
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <a
                href="mailto:soporte@guair.app"
                className="flex items-center gap-2 text-gray-400 hover:text-primary-400 transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span className="text-sm">soporte@guair.app</span>
              </a>
              <a
                href="tel:+1234567890"
                className="flex items-center gap-2 text-gray-400 hover:text-primary-400 transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span className="text-sm">+1 (234) 567-890</span>
              </a>
              <div className="flex items-start gap-2 text-gray-400">
                <MapPin className="w-4 h-4 mt-0.5" />
                <span className="text-sm">
                  123 Tech Street, Suite 456<br />
                  San Francisco, CA 94102
                </span>
              </div>
            </div>
          </div>

          {/* Links Sections */}
          {Object.entries(footerLinks).map(([key, section]) => (
            <div key={key}>
              <h3 className="text-white font-semibold mb-4">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-primary-400 transition-colors text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Social Links & Newsletter */}
        <div className="border-t border-white/10 pt-8 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Social Links */}
            <div className="flex items-center gap-4">
              <span className="text-gray-400 text-sm mr-2">Síguenos:</span>
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center text-gray-400 hover:text-primary-400 transition-all hover:scale-110"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>

            {/* Newsletter */}
            <div className="flex items-center gap-2">
              <input
                type="email"
                placeholder="Tu email para newsletter"
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                aria-label="Email para newsletter"
              />
              <button className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors">
                Suscribirse
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
            <p>
              &copy; {currentYear} Guair.app. Todos los derechos reservados.
            </p>

            <div className="flex items-center gap-6">
              <Link
                href="/terms"
                className="hover:text-primary-400 transition-colors"
              >
                Términos
              </Link>
              <Link
                href="/privacy"
                className="hover:text-primary-400 transition-colors"
              >
                Privacidad
              </Link>
              <Link
                href="/cookies"
                className="hover:text-primary-400 transition-colors"
              >
                Cookies
              </Link>
            </div>
          </div>

          {/* Certifications */}
          <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap justify-center gap-4 text-xs text-gray-500">
            <span>PCI DSS Level 1 Certified</span>
            <span>•</span>
            <span>ISO 27001 Compliant</span>
            <span>•</span>
            <span>GDPR Compliant</span>
            <span>•</span>
            <span>SOC 2 Type II</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
