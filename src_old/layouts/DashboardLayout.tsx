import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  CreditCard,
  History,
  User,
  LogOut,
  Menu,
  X,
  ShoppingCart,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Billetera', href: '/wallet', icon: Wallet },
    { name: 'Punto de Venta', href: '/pos', icon: ShoppingCart },
    { name: 'Transacciones', href: '/transactions', icon: History },
    { name: 'Pagos', href: '/payments', icon: CreditCard },
    { name: 'Cuenta', href: '/account', icon: User },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-primary-50/30 to-secondary-50/20">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-secondary-600 via-secondary-700 to-secondary-800 shadow-2xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Patron decorativo de fondo con círculos animados */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Círculo 1 - Top */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary-400/10 rounded-full blur-3xl animate-blob"></div>
          {/* Círculo 2 - Middle */}
          <div className="absolute top-1/3 -left-32 w-72 h-72 bg-secondary-500/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
          {/* Círculo 3 - Bottom */}
          <div className="absolute -bottom-20 right-0 w-56 h-56 bg-primary-300/10 rounded-full blur-3xl animate-blob animation-delay-4000"></div>

          {/* Patrón de puntos */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}></div>
        </div>

        <div className="flex flex-col h-full relative z-10">
          {/* Logo - Banner completo con imagen */}
          <div className="relative h-20 bg-gradient-to-r from-primary-400 via-primary-500 to-secondary-500 flex items-center justify-center overflow-hidden">
            {/* Patron decorativo de fondo animado */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.4),transparent)]"></div>
              <div className="absolute inset-0" style={{
                backgroundImage: 'linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)',
                backgroundSize: '200% 200%',
                animation: 'shimmer 3s infinite'
              }}></div>
            </div>
            {/* Logo centrado con animación */}
            <div className="relative z-10 flex items-center gap-3">
              <img
                src="/GUAIRAPP-24.png"
                alt="Guair.app"
                className="w-14 h-14 drop-shadow-2xl transform hover:scale-110 transition-transform duration-300"
              />
              <div>
                <h1 className="text-white font-bold text-xl tracking-tight drop-shadow-md">Guair.app</h1>
                <p className="text-white/80 text-xs">POS & Wallet</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden absolute right-4 p-2 rounded-lg hover:bg-white/20 transition-colors z-20"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* User info */}
          <div className="mx-4 my-4 px-4 py-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300 group">
            <div className="flex items-center">
              <div className="relative">
                <div className="w-11 h-11 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center ring-2 ring-white/20 group-hover:ring-white/30 transition-all duration-300 shadow-lg">
                  <span className="text-white font-bold text-lg">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                {/* Indicador de status online */}
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-secondary-700 shadow-lg"></div>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user?.name || 'Usuario'}</p>
                <p className="text-xs text-white/70 truncate">{user?.phone}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group relative flex items-center px-4 py-3 rounded-xl transition-all duration-300 ${
                    active
                      ? 'bg-gradient-to-r from-primary-400 to-primary-500 text-white shadow-lg shadow-primary-500/30 scale-[1.03]'
                      : 'text-white/80 hover:bg-white/10 hover:text-white hover:scale-[1.02]'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  {/* Efecto de brillo en hover */}
                  {!active && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  )}

                  {/* Indicador lateral para item activo */}
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full shadow-lg"></div>
                  )}

                  <div className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-300 ${
                    active
                      ? 'bg-white/20'
                      : 'bg-white/5 group-hover:bg-white/10'
                  }`}>
                    <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-white/70 group-hover:text-white'} transition-colors duration-300`} />
                  </div>
                  <span className="ml-3 font-medium relative z-10">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout button */}
          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="group relative flex items-center w-full px-4 py-3 text-white/80 rounded-xl hover:bg-red-500/20 hover:text-white transition-all duration-300 hover:scale-[1.02]"
            >
              {/* Efecto de brillo en hover */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-red-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/5 group-hover:bg-red-500/20 transition-all duration-300">
                <LogOut className="w-5 h-5 text-white/70 group-hover:text-red-300 transition-colors duration-300" />
              </div>
              <span className="ml-3 font-medium relative z-10">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar con degradado */}
        <header className="sticky top-0 z-30 bg-gradient-to-r from-white via-primary-50/50 to-secondary-50/30 border-b border-primary-100/50 shadow-sm">
          <div className="flex items-center justify-between h-16 px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-primary-100/50 text-secondary-700 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex-1" />
            {/* Badge o notificaciones pueden ir aquí */}
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
