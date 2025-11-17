import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Guair.app - Billetera Digital y Punto de Venta',
  description: 'Sistema de billetera digital y punto de venta',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="dark">
      <body suppressHydrationWarning className="bg-gray-900 text-white antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
