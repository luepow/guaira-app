import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(onFinish, 500);
    }, 2500);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-emerald-500 via-teal-600 to-blue-700 transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-teal-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Logo container */}
      <div className="relative z-10 text-center">
        <div className="animate-bounce-slow">
          <img
            src="/GUAIRAPP-32.png"
            alt="Guair.app Logo"
            className="w-48 h-48 mx-auto mb-6 drop-shadow-2xl animate-pulse-slow"
          />
        </div>
        <h1 className="text-5xl font-bold text-white mb-2 tracking-tight animate-fade-in-up">
          Guair.app
        </h1>
        <p className="text-xl text-white/80 animate-fade-in-up animation-delay-200">
          Billetera Digital y Punto de Venta
        </p>

        {/* Loading indicator */}
        <div className="mt-8 flex justify-center space-x-2 animate-fade-in-up animation-delay-400">
          <div className="w-3 h-3 bg-white rounded-full animate-bounce animation-delay-0"></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce animation-delay-200"></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce animation-delay-400"></div>
        </div>
      </div>
    </div>
  );
};
