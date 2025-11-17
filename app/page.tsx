'use client'

import React from 'react'
import { Hero, Features, Security, Testimonials, Pricing, CTA, Footer } from './components/landing'

/**
 * Main Landing Page
 *
 * Public-facing homepage for Guair.app with all landing sections.
 * This replaces the splash screen redirect for non-authenticated users.
 *
 * @page
 */

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-900">
      <Hero />
      <Features />
      <Security />
      <Testimonials />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  )
}
