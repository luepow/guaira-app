'use client'

import React from 'react'
import { Hero, Features, Security, Testimonials, Pricing, CTA, Footer } from '../components/landing'

/**
 * Landing Page
 *
 * Main public-facing landing page for Guair.app
 * Showcases features, security, testimonials, and pricing.
 *
 * SEO optimized with proper metadata and semantic HTML.
 *
 * @page
 */

export default function LandingPage() {
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
