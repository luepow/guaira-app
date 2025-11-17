'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Wallet,
  CreditCard,
  TrendingUp,
  Users,
  Settings,
  LogOut,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Shield,
  Activity,
} from 'lucide-react'

/**
 * Dashboard Page
 *
 * Main admin/user dashboard with wallet balance, recent transactions,
 * and quick actions.
 */

interface User {
  id: string
  email: string
  name: string
  role: string
  wallet?: {
    balance: number
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  // First mount effect - only runs on client
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Authentication check - only runs after component is mounted on client
  useEffect(() => {
    if (!isMounted) return

    // Check if user is authenticated
    const token = localStorage.getItem('auth_token')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.push('/login')
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      setIsLoading(false)
    } catch (err) {
      console.error('Error parsing user data:', err)
      router.push('/login')
    }
  }, [router, isMounted])

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-secondary-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const balance = user.wallet?.balance || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-secondary-900 to-gray-900">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/images/logo-small-alt.png"
                alt="Guair.app"
                width={120}
                height={40}
                className="h-10 w-auto"
              />
            </Link>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">{user.name || user.email}</p>
                <p className="text-xs text-gray-400">{user.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            ¡Bienvenido de vuelta, {user.name || 'Usuario'}!
          </h1>
          <p className="text-gray-400">
            Aquí está tu resumen de actividad
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Balance Card */}
          <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <Shield className="w-5 h-5 text-white/60" />
            </div>
            <div className="text-white/80 text-sm mb-1">Balance disponible</div>
            <div className="text-white text-3xl font-bold">
              ${balance.toFixed(2)}
            </div>
          </div>

          {/* Transactions Card */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-gray-400 text-sm mb-1">Total ingresos</div>
            <div className="text-white text-2xl font-bold">$0.00</div>
          </div>

          {/* Expenses Card */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                <ArrowDownRight className="w-6 h-6 text-red-400" />
              </div>
              <DollarSign className="w-5 h-5 text-red-400" />
            </div>
            <div className="text-gray-400 text-sm mb-1">Total gastos</div>
            <div className="text-white text-2xl font-bold">$0.00</div>
          </div>

          {/* Pending Card */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="text-gray-400 text-sm mb-1">Pendientes</div>
            <div className="text-white text-2xl font-bold">0</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Acciones rápidas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="flex flex-col items-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all hover:scale-105">
              <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-primary-400" />
              </div>
              <span className="text-sm text-white font-medium">Recargar</span>
            </button>

            <button className="flex flex-col items-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all hover:scale-105">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <span className="text-sm text-white font-medium">Enviar</span>
            </button>

            <button className="flex flex-col items-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all hover:scale-105">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-sm text-white font-medium">Usuarios</span>
            </button>

            <button className="flex flex-col items-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all hover:scale-105">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Settings className="w-6 h-6 text-purple-400" />
              </div>
              <span className="text-sm text-white font-medium">Ajustes</span>
            </button>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Transacciones recientes</h2>
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl"
              >
                <div className="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center">
                  <Activity className="w-5 h-5 text-primary-400" />
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium">Transacción #{item}</div>
                  <div className="text-gray-400 text-sm">Hace {item} hora(s)</div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold">-${item * 10}.00</div>
                  <div className="text-gray-400 text-xs">Completado</div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-6">
            <button className="text-primary-400 hover:text-primary-300 text-sm font-medium">
              Ver todas las transacciones →
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
