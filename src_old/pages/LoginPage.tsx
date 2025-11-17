import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Phone, Lock, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ParticleBackground } from '../components/ParticleBackground';
import { WaveBackground } from '../components/WaveBackground';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  // Credenciales predeterminadas
  const [phone, setPhone] = useState('+584121234567');
  const [password, setPassword] = useState('demo123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Modo demo: Login sin backend
    setTimeout(() => {
      // Simular datos de usuario y token
      const mockUser = {
        id: '1',
        phone: phone,
        name: 'Usuario Demo',
        email: 'demo@guair.app',
        balance: 25000,
        role: 'merchant',
      };
      const mockToken = 'demo-token-' + Date.now();

      // Guardar en localStorage
      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));

      // Actualizar el estado de autenticación
      window.location.href = '/';
    }, 800);

    setIsLoading(false);
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-emerald-500 via-teal-600 to-sky-700 overflow-hidden">
      {/* Animated background effects */}
      <ParticleBackground />
      <WaveBackground />

      {/* Floating blur orbs */}
      <div className="absolute top-20 -left-20 w-96 h-96 bg-emerald-400/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
      <div className="absolute top-40 -right-20 w-96 h-96 bg-teal-400/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-20 left-40 w-96 h-96 bg-sky-400/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo and branding */}
          <div className="text-center mb-8 animate-fade-in-up">
            <div className="inline-block mb-6">
              <img
                src="/GUAIRAPP-32.png"
                alt="Guair.app"
                className="w-32 h-32 mx-auto drop-shadow-2xl animate-float"
              />
            </div>
            <div className="flex items-center justify-center mb-2">
              <Sparkles className="w-6 h-6 text-white/90 mr-2" />
              <h1 className="text-5xl font-black text-white tracking-tight">
                Guair<span className="text-emerald-200">.app</span>
              </h1>
            </div>
            <p className="text-xl text-white/90 font-medium">Billetera Digital & POS</p>
          </div>

          {/* Login card with glass morphism */}
          <div className="glass rounded-3xl shadow-2xl p-8 backdrop-blur-xl animate-fade-in-up animation-delay-200">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">¡Bienvenido de nuevo!</h2>
              <p className="text-white/70 text-sm">Ingresa tus credenciales para continuar</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-400/50 rounded-xl flex items-start backdrop-blur-sm">
                <AlertCircle className="w-5 h-5 text-red-200 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm text-red-100">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Teléfono
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl py-3 px-12 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-transparent backdrop-blur-sm transition-all"
                    placeholder="+58412..."
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl py-3 px-12 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-transparent backdrop-blur-sm transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-white/30 bg-white/10 text-emerald-400 focus:ring-emerald-300 focus:ring-offset-0"
                  />
                  <span className="ml-2 text-white/90">Recordarme</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-emerald-200 hover:text-white font-medium transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <span className="relative flex items-center justify-center">
                  {isLoading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Iniciar Sesión
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-white/70">
                ¿No tienes una cuenta?{' '}
                <Link
                  to="/register"
                  className="text-emerald-200 hover:text-white font-semibold transition-colors"
                >
                  Regístrate gratis
                </Link>
              </p>
            </div>
          </div>

          {/* Features pills */}
          <div className="mt-8 flex items-center justify-center gap-4 animate-fade-in-up animation-delay-400">
            <div className="glass px-4 py-2 rounded-full backdrop-blur-sm">
              <span className="text-white/90 text-sm font-medium">💰 Billetera</span>
            </div>
            <div className="glass px-4 py-2 rounded-full backdrop-blur-sm">
              <span className="text-white/90 text-sm font-medium">🅿️ Parking</span>
            </div>
            <div className="glass px-4 py-2 rounded-full backdrop-blur-sm">
              <span className="text-white/90 text-sm font-medium">💳 Pagos</span>
            </div>
          </div>

          {/* Demo credentials hint */}
          <div className="mt-6 text-center animate-fade-in-up animation-delay-600">
            <div className="glass inline-block px-6 py-3 rounded-xl backdrop-blur-sm">
              <p className="text-xs text-white/70 mb-1">🎯 Demo - Credenciales precargadas</p>
              <p className="text-sm text-emerald-200 font-mono">+584121234567 / demo123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
