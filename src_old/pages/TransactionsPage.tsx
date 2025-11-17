import React, { useEffect, useState } from 'react';
import { Search, ArrowUpRight, ArrowDownRight, Activity, Download } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Badge } from '../components/Badge';
import { useAuthStore } from '../store/authStore';
import { useWalletStore } from '../store/walletStore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Transaction } from '../types';

export const TransactionsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { transactions, fetchTransactions } = useWalletStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    if (user?.id) {
      fetchTransactions(user.id);
    }
  }, [user?.id]);

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownRight className="w-5 h-5 text-green-600" />;
      case 'withdrawal':
      case 'payment':
        return <ArrowUpRight className="w-5 h-5 text-red-600" />;
      default:
        return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger'> = {
      succeeded: 'success',
      processing: 'warning',
      failed: 'danger',
      pending: 'warning',
    };

    const labels: Record<string, string> = {
      succeeded: 'Exitoso',
      processing: 'Procesando',
      failed: 'Fallido',
      pending: 'Pendiente',
    };

    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      deposit: 'Depósito',
      withdrawal: 'Retiro',
      payment: 'Pago',
      refund: 'Reembolso',
      transfer: 'Transferencia',
    };
    return labels[type] || type;
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || transaction.type === filterType;
    return matchesSearch && matchesType;
  });

  const typeFilters = [
    { id: 'all', name: 'Todas' },
    { id: 'deposit', name: 'Depósitos' },
    { id: 'payment', name: 'Pagos' },
    { id: 'withdrawal', name: 'Retiros' },
    { id: 'transfer', name: 'Transferencias' },
  ];

  const totalAmount = filteredTransactions.reduce(
    (sum, t) => sum + (t.type === 'deposit' ? t.amount : -t.amount),
    0
  );

  const groupTransactionsByDate = (transactions: Transaction[]) => {
    const groups: Record<string, Transaction[]> = {};

    transactions.forEach((transaction) => {
      const date = format(new Date(transaction.createdAt), 'yyyy-MM-dd');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
    });

    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  };

  const groupedTransactions = groupTransactionsByDate(filteredTransactions);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transacciones</h1>
          <p className="mt-2 text-gray-600">
            Historial completo de todas tus transacciones
          </p>
        </div>
        <Button
          variant="secondary"
          leftIcon={<Download className="w-5 h-5" />}
        >
          Exportar
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <p className="text-sm text-gray-600">Total Transacciones</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{filteredTransactions.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600">Balance Neto</p>
          <p className={`text-2xl font-bold mt-2 ${totalAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(Math.abs(totalAmount))}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600">Este Mes</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {
              filteredTransactions.filter(
                (t) => new Date(t.createdAt).getMonth() === new Date().getMonth()
              ).length
            }
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="space-y-4">
          <Input
            placeholder="Buscar por descripción o ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-5 h-5" />}
          />
          <div className="flex flex-wrap gap-2">
            {typeFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setFilterType(filter.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === filter.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.name}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Transactions list */}
      {groupedTransactions.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No se encontraron transacciones</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedTransactions.map(([date, dayTransactions]) => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-gray-500 mb-3">
                {format(new Date(date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
              </h3>
              <Card noPadding>
                <div className="divide-y divide-gray-200">
                  {dayTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-gray-900">{transaction.description}</p>
                            <Badge variant="info" size="sm">
                              {getTypeLabel(transaction.type)}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <p className="text-sm text-gray-500">
                              {format(new Date(transaction.createdAt), 'HH:mm')}
                            </p>
                            <span className="text-gray-300">•</span>
                            <p className="text-xs text-gray-400 font-mono">{transaction.id}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <p
                          className={`text-lg font-semibold ${
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
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
