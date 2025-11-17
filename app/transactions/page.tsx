'use client'

import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { History, ArrowDownRight, ArrowUpRight, Search } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Input } from '../components/Input';
import { useWalletStore } from '../store/walletStore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function TransactionsPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;
  const { transactions, fetchTransactions } = useWalletStore();
  const [searchTerm, setSearchTerm] = React.useState('');

  useEffect(() => {
    if (userId) {
      fetchTransactions(userId);
    }
  }, [userId]);

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getTransactionIcon = (type: string) => {
    if (type === 'deposit') {
      return <ArrowDownRight className="w-5 h-5" />;
    }
    return <ArrowUpRight className="w-5 h-5" />;
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

  const filteredTransactions = (transactions || []).filter(
    (t) =>
      t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Historial de Transacciones</h1>
          <p className="mt-2 text-white/70">
            Revisa todas tus transacciones y movimientos
          </p>
        </div>

        <Card className="bg-white/5 backdrop-blur-md border-white/10">
          <Input
            placeholder="Buscar transacciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-5 h-5" />}
          />
        </Card>

        {filteredTransactions.length === 0 ? (
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <div className="flex flex-col items-center justify-center py-16">
              <History className="w-24 h-24 text-white/30 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No hay transacciones
              </h3>
              <p className="text-white/60 text-center max-w-md">
                {searchTerm
                  ? 'No se encontraron transacciones con ese criterio de búsqueda.'
                  : 'Aún no has realizado ninguna transacción.'}
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((transaction) => (
              <Card
                key={transaction.id}
                className="bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        transaction.type === 'deposit'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{transaction.description}</p>
                      <p className="text-sm text-white/60">
                        {format(new Date(transaction.createdAt), "d 'de' MMMM 'a las' HH:mm", {
                          locale: es,
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold text-lg ${
                        transaction.type === 'deposit' ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {transaction.type === 'deposit' ? '+' : '-'}
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </p>
                    {getStatusBadge(transaction.status)}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
