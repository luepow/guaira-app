import React from 'react';
import { User, Phone, Mail, Shield, CreditCard, Bell } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useAuthStore } from '../store/authStore';

export const AccountPage: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mi Cuenta</h1>
        <p className="mt-2 text-gray-600">
          Administra tu información personal y configuración
        </p>
      </div>

      {/* Profile section */}
      <Card title="Información Personal" subtitle="Actualiza tu información de perfil">
        <div className="space-y-6">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-4xl font-bold text-primary-700">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <Button variant="secondary" size="sm">
                Cambiar foto
              </Button>
              <p className="text-sm text-gray-500 mt-2">JPG, PNG o GIF (max. 2MB)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre Completo"
              value={user?.name || ''}
              leftIcon={<User className="w-5 h-5" />}
            />
            <Input
              label="Teléfono"
              value={user?.phone || ''}
              leftIcon={<Phone className="w-5 h-5" />}
              disabled
            />
            <Input
              label="Correo Electrónico"
              type="email"
              value={user?.email || ''}
              leftIcon={<Mail className="w-5 h-5" />}
            />
            <Input
              label="Rol"
              value={user?.role || ''}
              leftIcon={<Shield className="w-5 h-5" />}
              disabled
            />
          </div>

          <div className="flex justify-end">
            <Button variant="primary">Guardar Cambios</Button>
          </div>
        </div>
      </Card>

      {/* Security section */}
      <Card title="Seguridad" subtitle="Gestiona tu contraseña y autenticación">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Contraseña</p>
              <p className="text-sm text-gray-500">Última actualización hace 30 días</p>
            </div>
            <Button variant="secondary" size="sm">
              Cambiar
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Autenticación de dos factores</p>
              <p className="text-sm text-gray-500">Protege tu cuenta con 2FA</p>
            </div>
            <Button variant="secondary" size="sm">
              Activar
            </Button>
          </div>
        </div>
      </Card>

      {/* Payment methods */}
      <Card
        title="Métodos de Pago"
        subtitle="Administra tus tarjetas y métodos de pago"
        headerAction={
          <Button variant="primary" size="sm" leftIcon={<CreditCard className="w-4 h-4" />}>
            Agregar
          </Button>
        }
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
                VISA
              </div>
              <div>
                <p className="font-medium text-gray-900">•••• •••• •••• 4242</p>
                <p className="text-sm text-gray-500">Expira 12/25</p>
              </div>
            </div>
            <Button variant="danger" size="sm">
              Eliminar
            </Button>
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card title="Notificaciones" subtitle="Configura cómo deseas recibir notificaciones">
        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-3">
              <Bell className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Notificaciones por email</p>
                <p className="text-sm text-gray-500">Recibe actualizaciones en tu correo</p>
              </div>
            </div>
            <input type="checkbox" defaultChecked className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
          </label>

          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-3">
              <Bell className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Notificaciones push</p>
                <p className="text-sm text-gray-500">Alertas en tiempo real</p>
              </div>
            </div>
            <input type="checkbox" defaultChecked className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
          </label>

          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-3">
              <Bell className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Notificaciones de transacciones</p>
                <p className="text-sm text-gray-500">Alertas de pagos y depósitos</p>
              </div>
            </div>
            <input type="checkbox" defaultChecked className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
          </label>
        </div>
      </Card>

      {/* Danger zone */}
      <Card title="Zona de Peligro">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
            <div>
              <p className="font-medium text-red-900">Desactivar cuenta</p>
              <p className="text-sm text-red-700">Tu cuenta será desactivada temporalmente</p>
            </div>
            <Button variant="danger" size="sm">
              Desactivar
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
            <div>
              <p className="font-medium text-red-900">Eliminar cuenta</p>
              <p className="text-sm text-red-700">Esta acción no se puede deshacer</p>
            </div>
            <Button variant="danger" size="sm">
              Eliminar
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
