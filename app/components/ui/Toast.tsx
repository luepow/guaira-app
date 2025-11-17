'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'

/**
 * Toast Notification System
 *
 * A toast notification component with context provider for global toast management.
 * Supports multiple variants (success, error, warning, info) and auto-dismiss.
 *
 * @component
 * @example
 * ```tsx
 * // In your app layout or root component
 * <ToastProvider>
 *   {children}
 * </ToastProvider>
 *
 * // In any component
 * const { showToast } = useToast()
 *
 * showToast({
 *   type: 'success',
 *   message: 'Operation completed successfully!',
 *   duration: 3000
 * })
 * ```
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
  description?: string
  duration?: number
}

interface ToastContextValue {
  showToast: (toast: Omit<Toast, 'id'>) => void
  hideToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: React.ReactNode
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  position = 'top-right',
}) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: Toast = { ...toast, id }

    setToasts((prev) => [...prev, newToast])

    // Auto dismiss
    const duration = toast.duration ?? 5000
    if (duration > 0) {
      setTimeout(() => {
        hideToast(id)
      }, duration)
    }
  }, [])

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  }

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}

      {/* Toast Container */}
      <div
        className={`fixed ${positionClasses[position]} z-50 flex flex-col gap-2 pointer-events-none`}
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onClose={() => hideToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

interface ToastItemProps {
  toast: Toast
  onClose: () => void
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose }) => {
  const { type, message, description } = toast

  const config = {
    success: {
      icon: CheckCircle2,
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/50',
      iconColor: 'text-green-400',
      textColor: 'text-green-100',
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/50',
      iconColor: 'text-red-400',
      textColor: 'text-red-100',
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/50',
      iconColor: 'text-yellow-400',
      textColor: 'text-yellow-100',
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/50',
      iconColor: 'text-blue-400',
      textColor: 'text-blue-100',
    },
  }

  const Icon = config[type].icon

  return (
    <div
      className={`
        pointer-events-auto
        flex items-start gap-3 p-4
        ${config[type].bgColor}
        ${config[type].borderColor}
        border rounded-lg shadow-lg backdrop-blur-sm
        animate-slide-down
        min-w-[320px] max-w-md
      `}
      role="alert"
    >
      <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${config[type].iconColor}`} />

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${config[type].textColor}`}>
          {message}
        </p>
        {description && (
          <p className="mt-1 text-xs text-gray-400">
            {description}
          </p>
        )}
      </div>

      <button
        onClick={onClose}
        className="flex-shrink-0 p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
        aria-label="Cerrar notificación"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
