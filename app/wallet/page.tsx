'use client'

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Wallet as WalletIcon,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Eye,
  EyeOff,
  X,
} from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useWalletStore } from '../store/walletStore';

export default function WalletPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;
  const { wallet, transactions, fetchWallet, fetchTransactions, deposit } = useWalletStore();
  const [showBalance, setShowBalance] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchWallet(userId);
      fetchTransactions(userId);
    }
  }, [userId]);

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const handleDeposit = async () => {
    if (!userId || !depositAmount) return;

    setIsLoading(true);
    try {
      await deposit(userId, parseFloat(depositAmount), 'card');
      setShowDepositModal(false);
      setDepositAmount('');
    } catch (error) {
      console.error('Deposit failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Mi Billetera</h1>
          <p className="mt-2 text-white/70">
            Gestiona tu balance y realiza transacciones
          </p>
        </div>

        {/* Balance card */}
        <Card className="bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600 text-white border-0 shadow-2xl">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <WalletIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-white/80 text-sm">Balance Disponible</p>
                  <p className="text-3xl font-bold mt-1">
                    {showBalance
                      ? formatCurrency(wallet?.balance || 0, wallet?.currency)
                      : '••••••'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                {showBalance ? (
                  <Eye className="w-5 h-5" />
                ) : (
                  <EyeOff className="w-5 h-5" />
                )}
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="secondary"
                className="flex-1"
                leftIcon={<Plus className="w-5 h-5" />}
                onClick={() => setShowDepositModal(true)}
              >
                Recargar
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                leftIcon={<ArrowUpRight className="w-5 h-5" />}
              >
                Transferir
              </Button>
            </div>
          </div>
        </Card>

        {/* Quick stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <ArrowDownRight className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-white/70">Total Recibido</p>
                <p className="text-xl font-bold text-white">
                  {formatCurrency(
                    (transactions || [])
                      .filter((t) => t.type === 'deposit')
                      .reduce((sum, t) => sum + t.amount, 0)
                  )}
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <ArrowUpRight className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-sm text-white/70">Total Gastado</p>
                <p className="text-xl font-bold text-white">
                  {formatCurrency(
                    (transactions || [])
                      .filter((t) => t.type === 'payment')
                      .reduce((sum, t) => sum + t.amount, 0)
                  )}
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-white/70">Este Mes</p>
                <p className="text-xl font-bold text-white">
                  {formatCurrency(
                    (transactions || [])
                      .filter(
                        (t) =>
                          new Date(t.createdAt).getMonth() === new Date().getMonth()
                      )
                      .reduce((sum, t) => sum + (t.type === 'deposit' ? t.amount : -t.amount), 0)
                  )}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Deposit modal */}
        {showDepositModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md bg-gray-800/95 backdrop-blur-xl border-white/20">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Recargar Billetera</h2>
                <button
                  onClick={() => setShowDepositModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
              <div className="space-y-4">
                <Input
                  label="Monto"
                  type="number"
                  placeholder="0.00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  leftIcon={<span className="text-white/60">$</span>}
                />
                <div className="grid grid-cols-3 gap-2">
                  {[10, 25, 50].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setDepositAmount(amount.toString())}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm font-medium transition-colors text-white"
                    >
                      ${amount}
                    </button>
                  ))}
                </div>
                <div className="flex space-x-3 pt-4">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setShowDepositModal(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={handleDeposit}
                    isLoading={isLoading}
                    disabled={!depositAmount || parseFloat(depositAmount) <= 0}
                  >
                    Confirmar
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
