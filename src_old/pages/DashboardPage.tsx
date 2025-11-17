import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  TrendingUp,
  Activity,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
} from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { useAuthStore } from '../store/authStore';
import { useWalletStore } from '../store/walletStore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { wallet, transactions, fetchWallet, fetchTransactions } = useWalletStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (user?.id) {
        await Promise.all([
          fetchWallet(user.id),
          fetchTransactions(user.id),
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownRight className="w-6 h-6 text-white" />;
      case 'withdrawal':
      case 'payment':
        return <ArrowUpRight className="w-6 h-6 text-white" />;
      default:
        return <Activity className="w-6 h-6 text-white" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger'> = {
      succeeded: 'success',
      processing: 'warning',
      failed: 'danger',
      pending: 'warning',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const recentTransactions = transactions.slice(0, 5);
  const monthlySpending = transactions
    .filter(t => t.type === 'payment' && new Date(t.createdAt).getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome section */}
      <div className="relative rounded-2xl p-8 shadow-xl border border-white/20 overflow-hidden bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-600">
        {/* Patron decorativo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary-300 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white drop-shadow-lg">
            ¡Bienvenido, {user?.name || 'Usuario'}! 👋
          </h1>
          <p className="mt-3 text-white/90 text-lg">
            Aquí está el resumen de tu cuenta y actividades recientes
          </p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-primary-500 to-primary-600 text-white border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm font-medium">Balance Total</p>
              <p className="text-3xl font-bold mt-2">
                {isLoading ? '...' : formatCurrency(wallet?.balance || 0, wallet?.currency)}
              </p>
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
          <Link to="/wallet" className="mt-4 inline-flex items-center text-sm font-medium text-white hover:text-primary-100">
            Ver billetera
            <ArrowUpRight className="w-4 h-4 ml-1" />
          </Link>
        </Card>

        <Card className="bg-gradient-to-br from-secondary-500 to-secondary-600 text-white border-0 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Transacciones</p>
              <p className="text-3xl font-bold mt-2">
                {transactions.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
          </div>
          <Link to="/transactions" className="mt-4 inline-flex items-center text-sm font-medium text-white hover:text-white/80 transition-colors">
            Ver historial
            <ArrowUpRight className="w-4 h-4 ml-1" />
          </Link>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Gasto Mensual</p>
              <p className="text-3xl font-bold mt-2">
                {formatCurrency(monthlySpending)}
              </p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <p className="mt-4 text-sm text-white/80 font-medium">Este mes</p>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Métodos de Pago</p>
              <p className="text-3xl font-bold mt-2">2</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <CreditCard className="w-6 h-6" />
            </div>
          </div>
          <Link to="/payments" className="mt-4 inline-flex items-center text-sm font-medium text-white hover:text-white/80 transition-colors">
            Administrar
            <ArrowUpRight className="w-4 h-4 ml-1" />
          </Link>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="bg-white/40 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/30">
        <h2 className="text-xl font-bold text-secondary-800 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/wallet?action=deposit"
            className="group flex flex-col items-center p-5 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
          >
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mb-3 group-hover:bg-white/30 transition-all">
              <Plus className="w-7 h-7 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">Recargar</span>
          </Link>

          <Link
            to="/pos"
            className="group flex flex-col items-center p-5 rounded-xl bg-gradient-to-br from-secondary-500 to-secondary-600 hover:from-secondary-600 hover:to-secondary-700 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
          >
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mb-3 group-hover:bg-white/30 transition-all">
              <CreditCard className="w-7 h-7 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">Pagar</span>
          </Link>

          <Link
            to="/wallet?action=transfer"
            className="group flex flex-col items-center p-5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
          >
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mb-3 group-hover:bg-white/30 transition-all">
              <ArrowUpRight className="w-7 h-7 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">Transferir</span>
          </Link>

          <Link
            to="/transactions"
            className="group flex flex-col items-center p-5 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
          >
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mb-3 group-hover:bg-white/30 transition-all">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">Historial</span>
          </Link>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="bg-white/40 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/30">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-secondary-800">Transacciones Recientes</h2>
          <Link to="/transactions">
            <Button variant="secondary" size="sm">
              Ver todas
            </Button>
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="w-10 h-10 text-secondary-500" />
            </div>
            <p className="text-secondary-700 font-medium text-lg">No hay transacciones recientes</p>
            <Link to="/pos" className="mt-6 inline-block">
              <Button variant="primary" size="sm">
                Realizar tu primera transacción
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-white/40 hover:bg-white/80 hover:shadow-md transition-all duration-300 group"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm ${
                    transaction.type === 'deposit'
                      ? 'bg-gradient-to-br from-green-400 to-green-500'
                      : 'bg-gradient-to-br from-red-400 to-red-500'
                  }`}>
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div>
                    <p className="font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors">{transaction.description}</p>
                    <p className="text-sm text-secondary-600">
                      {format(new Date(transaction.createdAt), "d 'de' MMMM 'a las' HH:mm", {
                        locale: es,
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-bold text-lg ${
                      transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {transaction.type === 'deposit' ? '+' : '-'}
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </p>
                  {getStatusBadge(transaction.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
