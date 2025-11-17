'use client'

import React from 'react';
import { useSession, signOut } from 'next-auth/react';
import { User, Phone, Mail, LogOut, Settings } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

export default function AccountPage() {
  const { data: session } = useSession();
  const user = session?.user;

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Mi Cuenta</h1>
          <p className="mt-2 text-white/70">
            Gestiona tu información personal y configuración
          </p>
        </div>

        {/* Profile Info */}
        <Card className="bg-white/5 backdrop-blur-md border-white/10">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center ring-4 ring-white/20">
              <span className="text-white font-bold text-3xl">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{user?.name || 'Usuario'}</h2>
              <p className="text-white/70">{user?.email || 'Sin email'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">Nombre</label>
              <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                <User className="w-5 h-5 text-white/60" />
                <span className="text-white">{user?.name || 'No especificado'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">Teléfono</label>
              <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                <Phone className="w-5 h-5 text-white/60" />
                <span className="text-white">{(user as any)?.phone || 'No especificado'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">Email</label>
              <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                <Mail className="w-5 h-5 text-white/60" />
                <span className="text-white">{user?.email || 'No especificado'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">Rol</label>
              <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                <Settings className="w-5 h-5 text-white/60" />
                <span className="text-white capitalize">{(user as any)?.role || 'customer'}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <Card className="bg-white/5 backdrop-blur-md border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Acciones</h3>
          <div className="space-y-3">
            <Button
              variant="danger"
              className="w-full justify-start"
              leftIcon={<LogOut className="w-5 h-5" />}
              onClick={handleLogout}
            >
              Cerrar Sesión
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
