import { create } from 'zustand';
import type { Wallet, Transaction } from '../types';
import { walletService } from '../services/wallet.service';

interface WalletStore {
  wallet: Wallet | null;
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;

  fetchWallet: (userId: string) => Promise<void>;
  fetchTransactions: (userId: string) => Promise<void>;
  deposit: (userId: string, amount: number, paymentMethod: 'card' | 'cash') => Promise<void>;
  withdraw: (userId: string, amount: number, destination: string) => Promise<void>;
  transfer: (fromUserId: string, toUserId: string, amount: number, description?: string) => Promise<void>;
}

export const useWalletStore = create<WalletStore>((set, get) => ({
  wallet: null,
  transactions: [],
  isLoading: false,
  error: null,

  fetchWallet: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await walletService.getWallet(userId);
      if (response.success && response.data) {
        set({ wallet: response.data, isLoading: false });
      } else {
        set({ error: response.error || 'Failed to fetch wallet', isLoading: false });
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchTransactions: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await walletService.getTransactions(userId, {
        page: 1,
        pageSize: 50,
      });
      if (response.success && response.data) {
        set({ transactions: response.data.data, isLoading: false });
      } else {
        set({ error: response.error || 'Failed to fetch transactions', isLoading: false });
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  deposit: async (userId: string, amount: number, paymentMethod: 'card' | 'cash') => {
    set({ isLoading: true, error: null });
    try {
      const response = await walletService.deposit({
        userId,
        amount,
        paymentMethod,
      });
      if (response.success) {
        // Refresh wallet and transactions
        await get().fetchWallet(userId);
        await get().fetchTransactions(userId);
        set({ isLoading: false });
      } else {
        set({ error: response.error || 'Deposit failed', isLoading: false });
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  withdraw: async (userId: string, amount: number, destination: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await walletService.withdraw({
        userId,
        amount,
        destination,
      });
      if (response.success) {
        await get().fetchWallet(userId);
        await get().fetchTransactions(userId);
        set({ isLoading: false });
      } else {
        set({ error: response.error || 'Withdrawal failed', isLoading: false });
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  transfer: async (fromUserId: string, toUserId: string, amount: number, description?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await walletService.transfer({
        fromUserId,
        toUserId,
        amount,
        description,
      });
      if (response.success) {
        await get().fetchWallet(fromUserId);
        await get().fetchTransactions(fromUserId);
        set({ isLoading: false });
      } else {
        set({ error: response.error || 'Transfer failed', isLoading: false });
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
}));
