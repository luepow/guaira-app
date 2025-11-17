'use client'

import { useEffect } from 'react'
import { SessionProvider } from 'next-auth/react'
import { useAuthStore } from './store/authStore'
import { ToastProvider } from './components/ui/Toast'

/**
 * Providers Component
 *
 * Wraps the app with necessary providers:
 * - SessionProvider: NextAuth session management
 * - ToastProvider: Global toast notifications
 * - Auth Store: Authentication state initialization
 */

export function Providers({ children }: { children: React.ReactNode }) {
  const { initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <SessionProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </SessionProvider>
  )
}
